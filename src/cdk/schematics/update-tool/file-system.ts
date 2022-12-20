/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {UpdateRecorder} from './update-recorder';

/**
 * A workspace path semantically is equivalent to the `Path` type provided by the
 * Angular devkit. Paths denoted with such a type are guaranteed to be representing
 * paths of a given virtual file system. This means that the root of a path can be
 * different, and does not necessarily need to match the root in the real file system.
 *
 * 工作空间路径在语义上等效于 Angular devkit 提供 `Path`。用这种类型表示的路径可以保证代表给定虚拟文件系统的路径。这意味着路径的根可以不同，并且不一定需要与真实文件系统中的根匹配。
 *
 * For example: Consider we have a project in `/home/<..>/my-project`. Then a path
 * like `/package.json` could actually refer to the `package.json` file in `my-project`.
 * Note that in the real file system this would not match though.
 *
 * 例如：假设我们在 `/home/&lt;..>/my-project` 下有一个项目。然后，像 `/package.json` 这样的路径实际上引用的是 `my-project` 中的 `package.json` 文件。请注意，在实际文件系统中，这将不匹配。
 *
 * One might wonder why another type has been declared for such paths, when there
 * already is the `Path` type provided by the devkit. We do this for a couple of reasons:
 *
 * 奇怪的是，既然已经有 devkit 提供了 `Path` 类型，为什么要为这种路径声明另一种类型呢？我们这样做有两个原因：
 *
 * 1. The update-tool cannot have a dependency on the Angular devkit as that one
 *    is not synced into g3. We want to be able to run migrations in g3 if needed.
 *
 *    更新工具不能依赖于 Angular devkit，因为该工具没有同步到 g3 中。如果需要，我们希望能够在 g3 中运行迁移。
 *
 */
export type WorkspacePath = string & {
  // Brand signature matches the devkit paths so that existing path
  // utilities from the Angular devkit can be conveniently used.
  __PRIVATE_DEVKIT_PATH: void;
};

/**
 * Interface that describes a directory.
 *
 * 用来描述目录的接口。
 *
 */
export interface DirectoryEntry {
  /**
   * List of directories inside the directory.
   *
   * 目录内的子目录列表。
   *
   */
  directories: string[];
  /**
   * List of files inside the directory.
   *
   * 目录内文件列表。
   *
   */
  files: string[];
}

/**
 * Abstraction of the file system that migrations can use to record and apply
 * changes. This is necessary to support virtual file systems as used in the CLI devkit.
 *
 * 文件系统的抽象，迁移可用它来记录和应用更改。要想支持 CLI devkit 中使用的虚拟文件系统，这是必要的。
 *
 */
export abstract class FileSystem {
  /**
   * Checks whether the given file exists.
   *
   * 检查给定的文件是否存在。
   *
   */
  abstract fileExists(path: WorkspacePath): boolean;
  /** Checks whether the given directory exists.
   *
   * 检查给定的文件或目录是否存在。
   *
   */
  abstract directoryExists(path: WorkspacePath): boolean;
  /**
   * Gets the contents of the given file.
   *
   * 获取给定文件的内容。
   *
   */
  abstract read(filePath: WorkspacePath): string | null;
  /**
   * Reads the given directory to retrieve children.
   *
   * 读取给定目录以检索子级。
   *
   */
  abstract readDirectory(dirPath: WorkspacePath): DirectoryEntry;
  /**
   * Creates an update recorder for the given file. Edits can be recorded and
   * committed in batches. Changes are not applied automatically because otherwise
   * migrations would need to re-read files, or account for shifted file contents.
   *
   * 为给定文件创建一个更新记录器。可以批量记录和提交编辑。更改不会自动应用，否则迁移将需要重新读取文件或考虑文件内容的变化。
   *
   */
  abstract edit(filePath: WorkspacePath): UpdateRecorder;
  /**
   * Applies all changes which have been recorded in update recorders.
   *
   * 应用已记录在更新记录器中的所有更改。
   *
   */
  abstract commitEdits(): void;
  /**
   * Creates a new file with the given content.
   *
   * 用给定的内容创建一个新文件。
   *
   */
  abstract create(filePath: WorkspacePath, content: string): void;
  /**
   * Overwrites an existing file with the given content.
   *
   * 用给定的内容覆盖现有文件。
   *
   */
  abstract overwrite(filePath: WorkspacePath, content: string): void;
  /**
   * Deletes the given file.
   *
   * 删除给定的文件。
   *
   */
  abstract delete(filePath: WorkspacePath): void;
  /**
   * Resolves given paths to a resolved path in the file system. For example, the devkit
   * tree considers the actual workspace directory as file system root.
   *
   * 将给定路径解析为文件系统中的已解析路径。例如，devkit 树将实际的工作区目录视为文件系统根目录。
   *
   * Follows the same semantics as the native path `resolve` method. i.e. segments
   * are processed in reverse. The last segment is considered the target and the
   * function will iterate from the target through other segments until it finds an
   * absolute path segment.
   *
   * 遵循与原生 path 中的 `resolve` 方法相同的语义，即这些段是逆向处理的。最后一个段被视为目标，并且该函数将从目标遍历其他段，直到找到绝对路径段为止。
   *
   */
  abstract resolve(...segments: string[]): WorkspacePath;
}
