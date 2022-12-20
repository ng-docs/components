import {createTestApp, patchDevkitTreeToExposeTypeScript} from '@angular/cdk/schematics/testing';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {createNewTestRunner, migrateComponents, THEME_FILE} from '../test-setup-helper';

describe('option styles', () => {
  let runner: SchematicTestRunner;
  let cliAppTree: UnitTestTree;

  async function runMigrationTest(oldFileContent: string, newFileContent: string) {
    cliAppTree.create(THEME_FILE, oldFileContent);
    const tree = await migrateComponents(['option'], runner, cliAppTree);
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
        @include mat.legacy-option-theme($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.option-theme($theme);
      `,
      );
    });

    it('should use the correct namespace', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as arbitrary;
        $theme: ();
        @include arbitrary.legacy-option-theme($theme);
      `,
        `
        @use '@angular/material' as arbitrary;
        $theme: ();
        @include arbitrary.option-theme($theme);
      `,
      );
    });

    it('should handle updating multiple themes', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.legacy-option-theme($light-theme);
        @include mat.legacy-option-theme($dark-theme);
      `,
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.option-theme($light-theme);
        @include mat.option-theme($dark-theme);
      `,
      );
    });

    it('should preserve whitespace', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();


        @include mat.legacy-option-theme($theme);


      `,
        `
        @use '@angular/material' as mat;
        $theme: ();


        @include mat.option-theme($theme);


      `,
      );
    });

    it('should update color mixin', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-option-color($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.option-color($theme);
      `,
      );
    });

    it('should update typography mixin', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-option-typography($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.option-typography($theme);
      `,
      );
    });
  });

  describe('selector migrations', () => {
    it('should update the legacy mat-option classname', async () => {
      await runMigrationTest(
        `
        .mat-option {
          width: 50%;
        }
      `,
        `
        .mat-mdc-option {
          width: 50%;
        }
      `,
      );
    });

    it('should add comment for potentially deprecated selector', async () => {
      await runMigrationTest(
        `
        .mat-option-text {
          background-color: red;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of option that may no longer apply for the MDC version. */
        .mat-option-text {
          background-color: red;
        }
      `,
      );
    });

    it('should add comment for potentially deprecated multi-line selector', async () => {
      await runMigrationTest(
        `
        .some-class
        .mat-option-text {
          background-color: red;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of option that may no longer apply for the MDC version. */
        .some-class
        .mat-option-text {
          background-color: red;
        }
      `,
      );
    });

    it('should update the legacy mat-option class and add comment for potentially deprecated selector', async () => {
      await runMigrationTest(
        `
        .mat-option.some-class, .mat-option-text {
          width: 50%;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of option that may no longer apply for the MDC version. */
        .mat-mdc-option.some-class, .mat-option-text {
          width: 50%;
        }
      `,
      );
    });
  });
});
