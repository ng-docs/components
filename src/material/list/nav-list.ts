/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ChangeDetectionStrategy, Component, InjectionToken, ViewEncapsulation} from '@angular/core';
import {MatListBase} from './list-base';

/**
 * Injection token that can be used to inject instances of `MatNavList`. It serves as
 * alternative token to the actual `MatNavList` class which could cause unnecessary
 * retention of the class and its component metadata.
 *
 * 这个注入令牌可以用来注入一些 `MatNavList` 实例。它可以作为实际 `MatNavList` 类的备用令牌，如果使用真实类可能导致此类及其组件元数据无法优化掉。
 *
 */
export const MAT_NAV_LIST = new InjectionToken<MatNavList>('MatNavList');

@Component({
  selector: 'mat-nav-list',
  exportAs: 'matNavList',
  template: '<ng-content></ng-content>',
  host: {
    'class': 'mat-mdc-nav-list mat-mdc-list-base mdc-list',
    'role': 'navigation',
  },
  styleUrls: ['list.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: MatListBase, useExisting: MatNavList}],
})
export class MatNavList extends MatListBase {
  // An navigation list is considered interactive, but does not extend the interactive list
  // base class. We do this because as per MDC, items of interactive lists are only reachable
  // through keyboard shortcuts. We want all items for the navigation list to be reachable
  // through tab key as we do not intend to provide any special accessibility treatment. The
  // accessibility treatment depends on how the end-user will interact with it.
  override _isNonInteractive = false;
}
