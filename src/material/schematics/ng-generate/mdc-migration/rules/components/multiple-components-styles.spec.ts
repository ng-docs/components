import {createTestApp, patchDevkitTreeToExposeTypeScript} from '@angular/cdk/schematics/testing';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {createNewTestRunner, migrateComponents, THEME_FILE} from './test-setup-helper';

describe('multiple component styles', () => {
  let runner: SchematicTestRunner;
  let cliAppTree: UnitTestTree;

  async function runMigrationTest(
    components: string[],
    oldFileContent: string,
    newFileContent: string,
  ) {
    cliAppTree.create(THEME_FILE, oldFileContent);
    const tree = await migrateComponents(components, runner, cliAppTree);
    expect(tree.readContent(THEME_FILE)).toBe(newFileContent);
  }

  beforeEach(async () => {
    runner = createNewTestRunner();
    cliAppTree = patchDevkitTreeToExposeTypeScript(await createTestApp(runner));
  });

  describe('mixin migrations', () => {
    it('should replace the old themes with the new ones', async () => {
      await runMigrationTest(
        ['checkbox', 'radio'],
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-checkbox-theme($theme);
        @include mat.legacy-radio-theme($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.checkbox-theme($theme);
        @include mat.radio-theme($theme);
      `,
      );
    });

    it('should add theme once if both components include it', async () => {
      await runMigrationTest(
        ['button', 'snack-bar'],
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-button-theme($theme);
        @include mat.legacy-snack-bar-theme($theme);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.button-theme($theme);
        @include mat.fab-theme($theme);
        @include mat.icon-button-theme($theme);
        @include mat.snack-bar-theme($theme);
      `,
      );
    });

    it('should remove legacy mixin if all replacements are already accounted for', async () => {
      await runMigrationTest(
        ['paginator', 'select'],
        `
          @use '@angular/material' as mat;
          $theme: ();
          @include mat.legacy-paginator-theme($theme);
          @include mat.legacy-select-theme($theme);
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

    it('should migrate all component mixins for a full migration', async () => {
      await runMigrationTest(
        ['all'],
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-core();
        @include mat.all-legacy-component-themes($sample-project-themes);
        @include mat.all-legacy-component-colors($sample-colors);
        @include mat.all-legacy-component-typographies($sample-typographies);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.core();
        @include mat.all-component-themes($sample-project-themes);
        @include mat.all-component-colors($sample-colors);
        @include mat.all-component-typographies($sample-typographies);
      `,
      );
    });

    it('should migrate all component mixins for a partial migration', async () => {
      await runMigrationTest(
        ['checkbox', 'radio'],
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.legacy-core();
        @include mat.all-legacy-component-themes($sample-project-themes);
        @include mat.all-legacy-component-colors($sample-colors);
        @include mat.all-legacy-component-typographies($sample-typographies);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        /* TODO(mdc-migration): Remove legacy-core once all legacy components are migrated */
        @include mat.legacy-core();
        @include mat.core();
        /* TODO(mdc-migration): Remove all-legacy-component-themes once all legacy components are migrated */
        @include mat.all-legacy-component-themes($sample-project-themes);
        @include mat.all-component-themes($sample-project-themes);
        /* TODO(mdc-migration): Remove all-legacy-component-colors once all legacy components are migrated */
        @include mat.all-legacy-component-colors($sample-colors);
        @include mat.all-component-colors($sample-colors);
        /* TODO(mdc-migration): Remove all-legacy-component-typographies once all legacy components are migrated */
        @include mat.all-legacy-component-typographies($sample-typographies);
        @include mat.all-component-typographies($sample-typographies);
      `,
      );
    });

    it('should migrate multi-line all-legacy-component-themes mixin', async () => {
      await runMigrationTest(
        ['all'],
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.all-legacy-component-themes((
          color: $config,
          typography: null,
          density: null,
        ));
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.all-component-themes((
          color: $config,
          typography: null,
          density: null,
        ));
      `,
      );
    });

    it('should multiple all-legacy-component-themes mixin for multiple themes', async () => {
      await runMigrationTest(
        ['all'],
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.all-legacy-component-themes($light-theme);
        @include mat.all-legacy-component-themes($dark-theme);
      `,
        `
        @use '@angular/material' as mat;
        $light-theme: ();
        $dark-theme: ();
        @include mat.all-component-themes($light-theme);
        @include mat.all-component-themes($dark-theme);
      `,
      );
    });

    it('should add migrate all component mixins', async () => {
      await runMigrationTest(
        ['checkbox', 'radio'],
        `
        @use '@angular/material' as mat;
        $theme: ();
        @include mat.all-legacy-component-themes($sample-project-themes);
        @include mat.all-legacy-component-colors($sample-colors);
        @include mat.all-legacy-component-typographies($sample-typographies);
      `,
        `
        @use '@angular/material' as mat;
        $theme: ();
        /* TODO(mdc-migration): Remove all-legacy-component-themes once all legacy components are migrated */
        @include mat.all-legacy-component-themes($sample-project-themes);
        @include mat.all-component-themes($sample-project-themes);
        /* TODO(mdc-migration): Remove all-legacy-component-colors once all legacy components are migrated */
        @include mat.all-legacy-component-colors($sample-colors);
        @include mat.all-component-colors($sample-colors);
        /* TODO(mdc-migration): Remove all-legacy-component-typographies once all legacy components are migrated */
        @include mat.all-legacy-component-typographies($sample-typographies);
        @include mat.all-component-typographies($sample-typographies);
      `,
      );
    });
  });
});
