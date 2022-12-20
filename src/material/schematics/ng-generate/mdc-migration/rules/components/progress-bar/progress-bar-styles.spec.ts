import {createTestApp, patchDevkitTreeToExposeTypeScript} from '@angular/cdk/schematics/testing';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {createNewTestRunner, migrateComponents, THEME_FILE} from '../test-setup-helper';

describe('progress-bar styles', () => {
  let runner: SchematicTestRunner;
  let cliAppTree: UnitTestTree;

  async function runMigrationTest(oldFileContent: string, newFileContent: string) {
    cliAppTree.create(THEME_FILE, oldFileContent);
    const tree = await migrateComponents(['progress-bar'], runner, cliAppTree);
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
        @include mat.legacy-progress-bar-theme($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.progress-bar-theme($theme);
      `,
      );
    });

    it('should use the correct namespace', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as arbitrary;
        $theme: ();
        @include arbitrary.legacy-progress-bar-theme($theme);
      `,
        `
        @use '@angular/material' as arbitrary;
        $theme: ();
        @include arbitrary.progress-bar-theme($theme);
      `,
      );
    });

    it('should handle updating multiple themes', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.legacy-progress-bar-theme($light-theme);
        @include mat.legacy-progress-bar-theme($dark-theme);
      `,
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.progress-bar-theme($light-theme);
        @include mat.progress-bar-theme($dark-theme);
      `,
      );
    });

    it('should preserve whitespace', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();


        @include mat.legacy-progress-bar-theme($theme);


      `,
        `
        @use '@angular/material' as mat;
        $theme: ();


        @include mat.progress-bar-theme($theme);


      `,
      );
    });

    it('should update color mixin', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-progress-bar-color($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.progress-bar-color($theme);
      `,
      );
    });

    it('should update typography mixin', async () => {
      await runMigrationTest(
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-progress-bar-typography($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.progress-bar-typography($theme);
      `,
      );
    });
  });

  describe('selector migrations', () => {
    it('should update the legacy mat-progress-bar classname', async () => {
      await runMigrationTest(
        `
        .mat-progress-bar {
          width: 50%;
        }
      `,
        `
        .mat-mdc-progress-bar {
          width: 50%;
        }
      `,
      );
    });

    it('should add comment for potentially deprecated selector', async () => {
      await runMigrationTest(
        `
        .mat-progress-bar-buffer {
          background-color: red;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of progress-bar that may no longer apply for the MDC version. */
        .mat-progress-bar-buffer {
          background-color: red;
        }
      `,
      );
    });

    it('should add comment for potentially deprecated multi-line selector', async () => {
      await runMigrationTest(
        `
        .some-class
        .mat-progress-bar-buffer {
          background-color: red;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of progress-bar that may no longer apply for the MDC version. */
        .some-class
        .mat-progress-bar-buffer {
          background-color: red;
        }
      `,
      );
    });

    it('should update the legacy mat-progress-bar class and add comment for potentially deprecated selector', async () => {
      await runMigrationTest(
        `
        .mat-progress-bar.some-class, .mat-progress-bar-buffer {
          width: 50%;
        }
      `,
        `
        /* TODO(mdc-migration): The following rule targets internal classes of progress-bar that may no longer apply for the MDC version. */
        .mat-mdc-progress-bar.some-class, .mat-progress-bar-buffer {
          width: 50%;
        }
      `,
      );
    });
  });
});
