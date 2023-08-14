/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CdkTree} from '@angular/cdk/tree';
import {ChangeDetectionStrategy, Component, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatTreeNodeOutlet} from './outlet';

/**
 * Wrapper for the CdkTable with Material design styles.
 *
 * 采用 Material Design 样式的 CdkTree 封装器。
 *
 */
@Component({
  selector: 'mat-tree',
  exportAs: 'matTree',
  template: `<ng-container matTreeNodeOutlet></ng-container>`,
  host: {
    'class': 'mat-tree',
    'role': 'tree',
  },
  styleUrls: ['tree.css'],
  encapsulation: ViewEncapsulation.None,
  // See note on CdkTree for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [{provide: CdkTree, useExisting: MatTree}],
})
export class MatTree<T, K = T> extends CdkTree<T, K> {
  // Outlets within the tree's template where the dataNodes will be inserted.
  // We need an initializer here to avoid a TS error. The value will be set in `ngAfterViewInit`.
  @ViewChild(MatTreeNodeOutlet, {static: true}) override _nodeOutlet: MatTreeNodeOutlet =
    undefined!;
}
