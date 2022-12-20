import {parse, Root, Rule} from 'postcss';
import {compileString} from 'sass';
import {runfiles} from '@bazel/runfiles';
import * as path from 'path';

import {compareNodes} from '../../../../../tools/postcss/compare-nodes';
import {createLocalAngularPackageImporter} from '../../../../../tools/sass/local-sass-importer';
import {pathToFileURL} from 'url';

// Note: For Windows compatibility, we need to resolve the directory paths through runfiles
// which are guaranteed to reside in the source tree.
const testDir = path.join(runfiles.resolvePackageRelative('../_all-theme.scss'), '../tests');
const packagesDir = path.join(runfiles.resolveWorkspaceRelative('src/cdk/_index.scss'), '../..');

const localPackageSassImporter = createLocalAngularPackageImporter(packagesDir);

const mdcSassImporter = {
  findFileUrl: (url: string) => {
    if (url.toString().startsWith('@material')) {
      return pathToFileURL(path.join(runfiles.resolveWorkspaceRelative('./node_modules'), url));
    }
    return null;
  },
};

describe('theming api', () => {
  /**
   * Map of known selectors for density styles and their corresponding AST rule.
   *
   * 密度样式的已知选择器及其对应的 AST 规则的映射表。
   *
   */
  let knownDensitySelectors: Map<string, Rule>;

  // Before all tests, we collect all nodes specific to density styles. We can then
  // use this check how density styles are generated. i.e. if they are duplicated
  // for legacy themes, or if they are properly scoped to a given selector.
  beforeAll(() => {
    knownDensitySelectors = new Map();
    parse(transpile(`@include angular-material-density(0);`)).each(node => {
      if (node.type === 'rule') {
        node.selectors.forEach(s => knownDensitySelectors.set(s, node));
      }
    });
  });

  it('should warn if color styles are duplicated', () => {
    spyOn(process.stderr, 'write');

    transpile(`
      $theme: mat-light-theme((
        color: (
          primary: mat-define-palette($mat-red),
          accent: mat-define-palette($mat-red),
        )
      ));

      @include angular-material-theme($theme);

      .dark-theme {
        @include angular-material-theme($theme);
      }
    `);

    expectWarning(/The same color styles are generated multiple times/);
  });

  it('should not warn if color styles and density are not duplicated', () => {
    const parsed = parse(
      transpile(`
      $theme: mat-light-theme((
        color: (
          primary: mat-define-palette($mat-red),
          accent: mat-define-palette($mat-red),
        )
      ));
      $theme2: mat-light-theme((
        color: (
          primary: mat-define-palette($mat-red),
          accent: mat-define-palette($mat-blue),
        )
      ));

      @include angular-material-theme($theme);

      .dark-theme {
        @include angular-material-color($theme2);
      }
    `),
    );

    expect(hasDensityStyles(parsed, null)).toBe('all');
    expect(hasDensityStyles(parsed, '.dark-theme')).toBe('none');
    expectNoWarning(/The same color styles are generated multiple times/);
  });

  it('should be possible to modify color configuration directly', () => {
    const result = transpile(`
      $theme: mat-light-theme((
        color: (
          primary: mat-define-palette($mat-red),
          accent: mat-define-palette($mat-blue),
        )
      ));

      // Updates the "icon" foreground color to "canary".
      $color: map-get($theme, color);
      $theme: map-merge($color,
        (foreground: map-merge(map-get($color, foreground), (icon: "canary"))));

      @include angular-material-theme($theme);
    `);

    expect(result).toContain(': "canary"');
  });

  it('should warn if default density styles are duplicated', () => {
    spyOn(process.stderr, 'write');

    const parsed = parse(
      transpile(`
      @include angular-material-theme((color: null));

      .dark-theme {
        @include angular-material-theme((color: null));
      }
    `),
    );

    expect(hasDensityStyles(parsed, null)).toBe('all');
    expect(hasDensityStyles(parsed, '.dark-theme')).toBe('all');
    expectWarning(/The same density styles are generated multiple times/);
  });

  it('should warn if density styles are duplicated', () => {
    spyOn(process.stderr, 'write');

    transpile(`
      @include angular-material-theme((density: -1));

      .dark-theme {
        @include angular-material-theme((density: -1));
      }
    `);

    expectWarning(/The same density styles are generated multiple times/);
  });

  it('should not warn if density styles are not duplicated', () => {
    spyOn(process.stderr, 'write');

    transpile(`
      @include angular-material-theme((density: -1));

      .dark-theme {
        @include angular-material-theme((density: -2));
      }
    `);

    expect(process.stderr.write).toHaveBeenCalledTimes(0);
  });

  it('should warn if typography styles are duplicated', () => {
    spyOn(process.stderr, 'write');

    transpile(`
      $theme: (typography: mat-typography-config(), density: null);
      @include angular-material-theme($theme);

      .dark-theme {
        @include angular-material-theme($theme);
      }
    `);

    expectWarning(/The same typography styles are generated multiple times/);
  });

  it('should not warn if typography styles are not duplicated', () => {
    spyOn(process.stderr, 'write');

    transpile(`
      @include angular-material-theme((
        typography: mat-typography-config(),
        density: null,
      ));

      .dark-theme {
        @include angular-material-theme((
          typography: mat-typography-config($font-family: "sans-serif"),
          density: null,
        ));
      }
    `);

    expect(process.stderr.write).toHaveBeenCalledTimes(0);
  });

  /**
   * Checks whether the given parsed stylesheet contains density styles scoped to
   * a given selector. If the selector is `null`, then density is expected to be
   * generated at top-level.
   *
   * 检查给定的已解析样式表是否包含范围为给定选择器的密度样式。如果选择器为 `null` ，则预期在顶层生成密度。
   *
   */
  function hasDensityStyles(parsed: Root, baseSelector: string | null): 'all' | 'partial' | 'none' {
    expect(parsed.nodes).withContext('Expected CSS to be not empty.').toBeDefined();
    expect(knownDensitySelectors.size).not.toBe(0);
    const missingDensitySelectors = new Set(knownDensitySelectors.keys());
    const baseSelectorRegex = new RegExp(`^${baseSelector} `, 'g');

    // Go through all rules in the stylesheet and check if they match with any
    // of the density style selectors. If so, we remove it from the copied set
    // of density selectors. If the set is empty at the end, we know that density
    // styles have been generated as expected.
    parsed.nodes!.forEach(node => {
      if (node.type !== 'rule') {
        return;
      }
      node.selectors.forEach(selector => {
        // Only check selectors that match the specified base selector.
        if (baseSelector && !baseSelectorRegex.test(selector)) {
          return;
        }
        selector = selector.replace(baseSelectorRegex, '');
        const matchingRule = knownDensitySelectors.get(selector);
        if (matchingRule && compareNodes(node, matchingRule)) {
          missingDensitySelectors.delete(selector);
        }
      });
    });

    // If there are no unmatched density selectors, then it's confirmed that
    // all density styles have been generated (scoped to the given selector).
    if (missingDensitySelectors.size === 0) {
      return 'all';
    }
    // If no density selector has been matched at all, then no density
    // styles have been generated.
    if (missingDensitySelectors.size === knownDensitySelectors.size) {
      return 'none';
    }
    console.error('MISSING!!! ', [...missingDensitySelectors].join(','));
    return 'partial';
  }

  /**
   * Transpiles given Sass content into CSS.
   *
   * 将给定的 Sass 内容转译为 CSS。
   *
   */
  function transpile(content: string) {
    return compileString(
      `
        @import '../_all-theme.scss';
        @import '../../color/_all-color.scss';
        @import '../../density/private/_all-density.scss';
        @import '../../typography/_all-typography.scss';

        ${content}
      `,
      {
        loadPaths: [testDir],
        importers: [localPackageSassImporter, mdcSassImporter],
      },
    ).css.toString();
  }

  /** Expects the given warning to be reported in Sass. */
  function expectWarning(message: RegExp) {
    expect(getMatchingWarning(message))
      .withContext('Expected warning to be printed.')
      .toBeDefined();
  }

  /** Expects the given warning not to be reported in Sass. */
  function expectNoWarning(message: RegExp) {
    expect(getMatchingWarning(message))
      .withContext('Expected no warning to be printed.')
      .toBeUndefined();
  }

  /**
   * Gets first instance of the given warning reported in Sass. Dart sass directly writes
   * to the `process.stderr` stream, so we spy on the `stderr.write` method. We
   * cannot expect a specific amount of writes as Sass calls `stderr.write` multiple
   * times for a warning (e.g. spacing and stack trace)
   *
   * 期望在 Sass 中报告给定的警告。 Dart sass 会直接写入 `process.stderr` 流，所以我们窥探 `stderr.write` 方法。我们不能期望它有特定数量的写入，因为 Sass 会对某个警告多次调用 `stderr.write`（例如间距和堆栈跟踪）
   *
   */
  function getMatchingWarning(message: RegExp) {
    const writeSpy = process.stderr.write as jasmine.Spy;
    return (writeSpy.calls?.all() ?? []).find(
      (s: jasmine.CallInfo<typeof process.stderr.write>) =>
        typeof s.args[0] === 'string' && message.test(s.args[0]),
    );
  }
});
