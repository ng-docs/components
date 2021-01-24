/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, InjectionToken, TemplateRef} from '@angular/core';

/**
 * Injection token that can be used to reference instances of `MatTabContent`. It serves as
 * alternative token to the actual `MatTabContent` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatTabContent` 实例。它可以作为实际 `MatTabContent` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 */
export const MAT_TAB_CONTENT = new InjectionToken<MatTabContent>('MatTabContent');

/**
 * Decorates the `ng-template` tags and reads out the template from it.
 *
 * 修饰 `ng-template` 标签，并从中读出模板。
 *
 */
@Directive({
  selector: '[matTabContent]',
  providers: [{provide: MAT_TAB_CONTENT, useExisting: MatTabContent}],
})
export class MatTabContent {
  constructor(
    /** Content for the tab. */ public template: TemplateRef<any>) {}
}
