import {createTestApp, patchDevkitTreeToExposeTypeScript} from '@angular/cdk/schematics/testing';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing';
import {
  APP_MODULE_FILE,
  createNewTestRunner,
  migrateComponents,
  TEMPLATE_FILE,
} from '../test-setup-helper';

describe('card template migrator', () => {
  let runner: SchematicTestRunner;
  let cliAppTree: UnitTestTree;

  async function runMigrationTest(oldFileContent: string, newFileContent: string) {
    cliAppTree.overwrite(TEMPLATE_FILE, oldFileContent);
    const tree = await migrateComponents(['card'], runner, cliAppTree);
    expect(tree.readContent(TEMPLATE_FILE)).toBe(newFileContent);
  }

  beforeEach(async () => {
    runner = createNewTestRunner();
    cliAppTree = patchDevkitTreeToExposeTypeScript(await createTestApp(runner));
  });

  it('should not update other elements', async () => {
    await runMigrationTest('<mat-button></mat-button>', '<mat-button></mat-button>');
  });

  it('should update single', async () => {
    await runMigrationTest('<mat-card></mat-card>', '<mat-card appearance="outlined"></mat-card>');
  });

  it('should update multiple same-line unnested', async () => {
    await runMigrationTest(
      '<mat-card></mat-card><mat-card></mat-card>',
      '<mat-card appearance="outlined"></mat-card><mat-card appearance="outlined"></mat-card>',
    );
  });

  it('should update multiple same-line nested', async () => {
    await runMigrationTest(
      '<mat-card><mat-card></mat-card></mat-card>',
      '<mat-card appearance="outlined"><mat-card appearance="outlined"></mat-card></mat-card>',
    );
  });

  it('should update multiple same-line nested and unnested', async () => {
    await runMigrationTest(
      '<mat-card><mat-card></mat-card><mat-card></mat-card></mat-card>',
      '<mat-card appearance="outlined"><mat-card appearance="outlined"></mat-card><mat-card appearance="outlined"></mat-card></mat-card>',
    );
  });

  it('should update multiple multi-line unnested', async () => {
    await runMigrationTest(
      `
        <mat-card></mat-card>
        <mat-card></mat-card>
      `,
      `
        <mat-card appearance="outlined"></mat-card>
        <mat-card appearance="outlined"></mat-card>
      `,
    );
  });

  it('should update multiple multi-line nested', async () => {
    await runMigrationTest(
      `
        <mat-card>
          <mat-card></mat-card>
        </mat-card>
      `,
      `
        <mat-card appearance="outlined">
          <mat-card appearance="outlined"></mat-card>
        </mat-card>
      `,
    );
  });

  it('should update multiple multi-line nested and unnested', async () => {
    await runMigrationTest(
      `
        <mat-card>
          <mat-card></mat-card>
          <mat-card></mat-card>
        </mat-card>
      `,
      `
        <mat-card appearance="outlined">
          <mat-card appearance="outlined"></mat-card>
          <mat-card appearance="outlined"></mat-card>
        </mat-card>
      `,
    );
  });

  it('should match indentation', async () => {
    await runMigrationTest(
      `
        <mat-card
          class="some card"
          aria-label="some card"
          aria-describedby="some card"
        ></mat-card>
      `,
      `
        <mat-card
          appearance="outlined"
          class="some card"
          aria-label="some card"
          aria-describedby="some card"
        ></mat-card>
      `,
    );
  });

  it('should migrate inline templates', async () => {
    const oldContent = `
      import {Component} from '@angular/core';

      @Component({
        template: '<mat-card></mat-card>'
      })
      export class MyComp {}
    `;

    const newContent = `
      import {Component} from '@angular/core';

      @Component({
        template: '<mat-card appearance="outlined"></mat-card>'
      })
      export class MyComp {}
    `;

    cliAppTree.overwrite(APP_MODULE_FILE, oldContent);
    const tree = await migrateComponents(['card'], runner, cliAppTree);
    expect(tree.readContent(APP_MODULE_FILE)).toBe(newContent);
  });
});
