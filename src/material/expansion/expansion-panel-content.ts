/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, TemplateRef, Inject, Optional} from '@angular/core';
import {MAT_EXPANSION_PANEL, MatExpansionPanelBase} from './expansion-panel-base';

/**
 * Expansion panel content that will be rendered lazily
 * after the panel is opened for the first time.
 *
 * 这些可展开面板的内容会在面板第一次打开后惰性渲染。
 *
 */
@Directive({
  selector: 'ng-template[matExpansionPanelContent]',
})
export class MatExpansionPanelContent {
  constructor(
    public _template: TemplateRef<any>,
    @Inject(MAT_EXPANSION_PANEL) @Optional() public _expansionPanel?: MatExpansionPanelBase,
  ) {}
}
