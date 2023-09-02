/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parse} from 'jsonc-parser';
import {getSystemPath, Path} from '@angular-devkit/core';
import {HostTree, Tree} from '@angular-devkit/schematics';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {readFileSync} from 'fs-extra';
import {sync as globSync} from 'glob';
import {basename, extname, join, relative, sep} from 'path';
import {EMPTY} from 'rxjs';
import {createTestApp} from './test-app';

/**
 * Suffix that indicates whether a given file is a test case input.
 *
 * 指示给定文件是否为测试用例输入的后缀。
 *
 */
const TEST_CASE_INPUT_SUFFIX = '_input.ts';

/**
 * Suffix that indicates whether a given file is an expected output of a test case.
 *
 * 指示给定文件是否为测试用例的预期输出的后缀。
 *
 */
const TEST_CASE_OUTPUT_SUFFIX = '_expected_output.ts';

/**
 * Name of the folder that can contain test case files which should not run automatically.
 *
 * 包含不应自动运行的测试用例文件的文件夹的名称。
 *
 */
const MISC_FOLDER_NAME = 'misc';

/**
 * Reads the UTF8 content of the specified file. Normalizes the path and ensures that
 *
 * 读取指定文件的 UTF8 内容。将路径规范化。
 *
 */
export function readFileContent(filePath: string): string {
  return readFileSync(filePath, 'utf8');
}

/**
 * Creates a test app schematic tree that will be copied over to a real filesystem location.
 * This is necessary because otherwise the TypeScript compiler API would not be able to
 * find source files within the tsconfig project.
 * TODO\(devversion\): we should be able to make the TypeScript config parsing respect the
 * schematic tree. This would allow us to fully take advantage of the virtual file system.
 *
 * 创建一个测试应用程序原理图树，该树将被复制到真实的文件系统位置。这是必需的，否则 TypeScript 编译器 API 将无法在 tsconfig 项目中找到源文件。
 *
 */
export async function createFileSystemTestApp(runner: SchematicTestRunner) {
  const hostTree = new HostTree();
  const appTree: UnitTestTree = await createTestApp(runner, {name: 'cdk-testing'}, hostTree);

  // Since the TypeScript compiler API expects all files to be present on the real file system, we
  // map every file in the app tree to a temporary location on the file system.
  appTree.files.forEach(f => writeFile(f, appTree.readContent(f)));

  return {
    appTree,
    writeFile,
  };

  function writeFile(filePath: string, content: string) {
    // Update the temp file system host to reflect the changes in the real file system.
    // This is still necessary since we depend on the real file system for parsing the
    // TypeScript project.
    if (hostTree.exists(filePath)) {
      hostTree.overwrite(filePath, content);
    } else {
      hostTree.create(filePath, content);
    }
  }
}

export async function createTestCaseSetup(
  migrationName: string,
  collectionPath: string,
  inputFiles: string[],
) {
  const runner = new SchematicTestRunner('schematics', collectionPath);

  let logOutput = '';
  runner.logger.subscribe(entry => (logOutput += `${entry.message}\n`));
  const {appTree, writeFile} = await createFileSystemTestApp(runner);

  patchDevkitTreeToExposeTypeScript(appTree);

  // Write each test-case input to the file-system. This is necessary because otherwise
  // TypeScript compiler API won't be able to pick up the test cases.
  inputFiles.forEach(inputFilePath => {
    const inputTestName = basename(inputFilePath, extname(inputFilePath));
    const relativePath = `projects/cdk-testing/src/test-cases/${inputTestName}.ts`;
    const inputContent = readFileContent(inputFilePath);

    writeFile(relativePath, inputContent);
  });

  const testAppTsconfigPath = 'projects/cdk-testing/tsconfig.app.json';
  // Parse TypeScript configuration files with JSONC (like the CLI does) as the
  // config files could contain comments or trailing commas
  const testAppTsconfig = parse(appTree.readContent(testAppTsconfigPath), [], {
    allowTrailingComma: true,
  });

  // include all TypeScript files in the project. Otherwise all test input
  // files won't be part of the program and cannot be migrated.
  testAppTsconfig.include.push('src/**/*.ts');

  writeFile(testAppTsconfigPath, JSON.stringify(testAppTsconfig, null, 2));

  const runFixers = async function () {
    // Patch "executePostTasks" to do nothing. This is necessary since
    // we cannot run the node install task in unit tests. Rather we just
    // assert that certain async post tasks are scheduled.
    // TODO(devversion): RxJS version conflicts between angular-devkit and our dev deps.
    runner.engine.executePostTasks = () => EMPTY as any;

    await runner.runSchematic(migrationName, {}, appTree);

    return {logOutput};
  };

  return {runner, appTree, writeFile, runFixers};
}

/**
 * Resolves all test cases for specified path using Bazel's runfile manifest. Note that we
 * cannot just use "glob" since the test case files are not copied to the Bazel bin directory
 * and are just runfiles.
 *
 * 使用 Bazel 的 runfile 清单解析指定路径下的所有测试用例。请注意，我们不能仅使用 “glob”，因为测试用例文件不会复制到 Bazel 的 bin 目录中，而只是 runfiles。
 *
 */
export function findBazelVersionTestCases(basePath: string) {
  const testCasesMap = new Map<string, string[]>();
  const manifestPath = process.env['RUNFILES_MANIFEST_FILE']!;
  const runfilesDir = process.env['RUNFILES'];

  // In case we are not on Windows where runfiles are symlinked, we just find all
  // test case files by using "glob" and store them in our result map.
  if (!manifestPath) {
    const runfilesBaseDir = join(runfilesDir!, basePath);
    const inputFiles = globSync(`**/!(${MISC_FOLDER_NAME})/*${TEST_CASE_INPUT_SUFFIX}`, {
      cwd: runfilesBaseDir,
    });

    inputFiles.forEach(inputFile => {
      // The target version of an input file will be determined from the first
      // path segment. (e.g. "v6/my_rule_input.ts" will be for "v6")
      const targetVersion = inputFile.split(sep)[0];
      const resolvedInputPath = join(runfilesBaseDir, inputFile);

      testCasesMap.set(
        targetVersion,
        (testCasesMap.get(targetVersion) || []).concat(resolvedInputPath),
      );
    });

    return testCasesMap;
  }

  // In case runfiles are not symlinked (e.g. on Windows), we resolve all test case files using
  // the Bazel runfiles manifest. Read more about the manifest here:
  // https://github.com/bazelbuild/bazel/blob/701913139adc0eba49a7a9963fea4f555fcd844f/src/main/java/com/google/devtools/build/lib/analysis/SourceManifestAction.java#L214-L221
  readFileSync(manifestPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const [runfilePath, realPath] = line.split(' ');

      // In case the mapped runfile starts with the specified base path and ends with "_input.ts",
      // we store it in our result map because we assume that this is a test case.
      if (runfilePath.startsWith(basePath) && runfilePath.endsWith(TEST_CASE_INPUT_SUFFIX)) {
        const pathSegments = relative(basePath, runfilePath).split(sep);
        if (pathSegments.includes(MISC_FOLDER_NAME)) {
          return;
        }
        // The target version of an input file will be determined from the first
        // path segment. (e.g. "v6/my_rule_input.ts" will be for "v6")
        const targetVersion = pathSegments[0];
        testCasesMap.set(targetVersion, (testCasesMap.get(targetVersion) || []).concat(realPath));
      }
    });

  return testCasesMap;
}

/**
 * Sets up the specified test cases using Jasmine by creating the appropriate jasmine
 * spec definitions. This should be used within a "describe" jasmine closure.
 *
 * 通过创建适当的 Jasmine 规约定义，使用 Jasmine 设置指定的测试用例。这应该在 Jasmine 的 "describe" 闭包中使用。
 *
 */
export function defineJasmineTestCases(
  versionName: string,
  collectionFile: string,
  inputFiles: string[] | undefined,
) {
  // No test cases for the given version are available. Skip setting up tests for that
  // version.
  if (!inputFiles) {
    // Jasmine throws an error if there's a `describe` without any tests.
    it('should pass', () => {});
    return;
  }

  let appTree: UnitTestTree;
  let testCasesOutputPath: string;

  beforeAll(async () => {
    const {appTree: _tree, runFixers} = await createTestCaseSetup(
      `migration-${versionName}`,
      collectionFile,
      inputFiles,
    );

    await runFixers();

    appTree = _tree;
    testCasesOutputPath = '/projects/cdk-testing/src/test-cases/';
  });

  // Iterates through every test case directory and generates a jasmine test block that will
  // verify that the update schematics properly updated the test input to the expected output.
  inputFiles.forEach(inputFile => {
    const inputTestName = basename(inputFile, extname(inputFile));

    it(`should apply update schematics to test case: ${inputTestName}`, () => {
      expect(appTree.readContent(join(testCasesOutputPath, `${inputTestName}.ts`))).toBe(
        readFileContent(inputFile.replace(TEST_CASE_INPUT_SUFFIX, TEST_CASE_OUTPUT_SUFFIX)),
      );
    });
  });
}

/**
 * Patches the specified virtual file system tree to be able to read the TypeScript
 * default library typings. These need to be readable in unit tests because otherwise
 * type checking within migration rules is not working as in real applications.
 *
 * patch 指定的虚拟文件系统树，以便能够读取 TypeScript 的默认库类型。这些在单元测试中必须是可读的，否则迁移规则中的类型检查将不能像在实际应用程序中那样起作用。
 *
 */
export function patchDevkitTreeToExposeTypeScript<T extends Tree>(tree: T): T {
  const _originalRead = tree.read;
  tree.read = function (filePath: Path) {
    // In case a file within the TypeScript package is requested, we read the file from
    // the real file system. This is necessary because within unit tests, the "typeScript"
    // package from within the Bazel "@npm" repository  is used. The virtual tree can't be
    // used because the "@npm" repository directory is not part of the virtual file system.
    if (filePath.match(/node_modules[/\\]typescript/)) {
      return readFileSync(getSystemPath(filePath));
    } else {
      return _originalRead.call(this, filePath);
    }
  };
  return tree;
}
