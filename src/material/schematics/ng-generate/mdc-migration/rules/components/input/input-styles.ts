/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ClassNameChange, StyleMigrator} from '../../style-migrator';

export class InputStylesMigrator extends StyleMigrator {
  component = 'input';

  deprecatedPrefixes = ['mat-input'];

  mixinChanges = [
    {
      old: 'legacy-input-theme',
      new: ['input-theme'],
    },
    {
      old: 'legacy-input-color',
      new: ['input-color'],
    },
    {
      old: 'legacy-input-typography',
      new: ['input-typography'],
    },
  ];

  classChanges: ClassNameChange[] = [{old: '.mat-input-element', new: '.mat-mdc-input-element'}];
}
