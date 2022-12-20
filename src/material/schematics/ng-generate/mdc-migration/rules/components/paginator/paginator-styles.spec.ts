import {createTestApp, patchDevkitTreeToExposeTypeScript} from '@angular/cdk/schematics/testing';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {createNewTestRunner, migrateComponents, THEME_FILE} from '../test-setup-helper';

describe('paginator styles', () => {
  let runner: SchematicTestRunner;
  let cliAppTree: UnitTestTree;

  async function runMigrationTest(oldFileContent: string, newFileContent: string) {
    cliAppTree.create(THEME_FILE, oldFileContent);
    const tree = await migrateComponents(['paginator'], runner, cliAppTree);
    expect(tree.readContent(THEME_FILE)).toBe(newFileContent);
  }

  beforeEach(async () => {
    runner = createNewTestRunner();
    cliAppTree = patchDevkitTreeToExposeTypeScript(await createTestApp(runner));
  });

  describe('mixin migrations', () => {
    it('should replace the old theme with the new ones', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-paginator-theme($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.paginator-theme($theme);
        @include mat.icon-button-theme($theme);
        @include mat.form-field-theme($theme);
        @include mat.select-theme($theme);
      `,
      );
    });

    it('should use the correct namespace', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as arbitrary;
        $theme: ();
        @include arbitrary.legacy-paginator-theme($theme);
      `,
        `
        @use '@angular/material' as arbitrary;
        $theme: ();
        @include arbitrary.paginator-theme($theme);
        @include arbitrary.icon-button-theme($theme);
        @include arbitrary.form-field-theme($theme);
        @include arbitrary.select-theme($theme);
      `,
      );
    });

    it('should handle updating multiple themes', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.legacy-paginator-theme($light-theme);
        @include mat.legacy-paginator-theme($dark-theme);
      `,
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.paginator-theme($light-theme);
        @include mat.icon-button-theme($light-theme);
        @include mat.form-field-theme($light-theme);
        @include mat.select-theme($light-theme);
        @include mat.paginator-theme($dark-theme);
        @include mat.icon-button-theme($dark-theme);
        @include mat.form-field-theme($dark-theme);
        @include mat.select-theme($dark-theme);
      `,
      );
    });

    it('should preserve whitespace', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();


        @include mat.legacy-paginator-theme($theme);


      `,
        `
        @use '@angular/material' as mat;
        $theme: ();


        @include mat.paginator-theme($theme);
        @include mat.icon-button-theme($theme);
        @include mat.form-field-theme($theme);
        @include mat.select-theme($theme);


      `,
      );
    });

    it('should update color mixin', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-paginator-color($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.paginator-color($theme);
        @include mat.icon-button-color($theme);
        @include mat.form-field-color($theme);
        @include mat.select-color($theme);
      `,
      );
    });

    it('should update typography mixin', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-paginator-typography($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.paginator-typography($theme);
        @include mat.icon-button-typography($theme);
        @include mat.form-field-typography($theme);
        @include mat.select-typography($theme);
      `,
      );
    });
  });

  describe('selector migrations', () => {
    it('should update the legacy mat-paginator classname', async () => {
      await runMigrationTest(
        `
        .mat-paginator {
          padding: 12px;
        }
      `,
        `
        .mat-mdc-paginator {
          padding: 12px;
        }
      `,
      );
    });

    it('should update multiple legacy classnames', async () => {
      await runMigrationTest(
        `
        .mat-paginator {
          padding: 12px;
        }
        .mat-paginator-container {
          background: red;
        }
      `,
        `
        .mat-mdc-paginator {
          padding: 12px;
        }
        .mat-mdc-paginator-container {
          background: red;
        }
      `,
      );
    });

    it('should update a legacy classname w/ multiple selectors', async () => {
      await runMigrationTest(
        `
        .some-class.mat-mdc-paginator, .another-class {
          padding: 12px;
        }
      `,
        `
        .some-class.mat-mdc-paginator, .another-class {
          padding: 12px;
        }
      `,
      );
    });

    it('should preserve the whitespace of multiple selectors', async () => {
      await runMigrationTest(
        `
        .some-class,
        .mat-paginator-container,
        .another-class { background: red; }
      `,
        `
        .some-class,
        .mat-mdc-paginator-container,
        .another-class { background: red; }
      `,
      );
    });

    it('should add comment for potentially deprecated selector', async () => {
      await runMigrationTest(
        `
        .mat-paginator-increment {
          padding: 4px;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of paginator that may no longer apply for the MDC version. */
        .mat-paginator-increment {
          padding: 4px;
        }
      `,
      );
    });

    it('should add comment for potentially deprecated multi-line selector', async () => {
      await runMigrationTest(
        `
        .some-class
        .mat-paginator-increment {
          padding: 4px;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of paginator that may no longer apply for the MDC version. */
        .some-class
        .mat-paginator-increment {
          padding: 4px;
        }
      `,
      );
    });

    it('should update the legacy mat-paginator class and add comment for potentially deprecated selector', async () => {
      await runMigrationTest(
        `
        .mat-paginator.some-class, .mat-paginator-increment {
          padding: 4px;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of paginator that may no longer apply for the MDC version. */
        .mat-mdc-paginator.some-class, .mat-paginator-increment {
          padding: 4px;
        }
      `,
      );
    });
  });
});
