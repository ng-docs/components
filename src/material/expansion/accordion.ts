/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Directive,
  Input,
  ContentChildren,
  QueryList,
  AfterContentInit,
  OnDestroy,
} from '@angular/core';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {CdkAccordion} from '@angular/cdk/accordion';
import {FocusKeyManager} from '@angular/cdk/a11y';
import {startWith} from 'rxjs/operators';
import {
  MAT_ACCORDION,
  MatAccordionBase,
  MatAccordionDisplayMode,
  MatAccordionTogglePosition,
} from './accordion-base';
import {MatExpansionPanelHeader} from './expansion-panel-header';

/**
 * Directive for a Material Design Accordion.
 *
 * Material Design 手风琴的指令
 *
 */
@Directive({
  selector: 'mat-accordion',
  exportAs: 'matAccordion',
  inputs: ['multi'],
  providers: [
    {
      provide: MAT_ACCORDION,
      useExisting: MatAccordion,
    },
  ],
  host: {
    class: 'mat-accordion',
    // Class binding which is only used by the test harness as there is no other
    // way for the harness to detect if multiple panel support is enabled.
    '[class.mat-accordion-multi]': 'this.multi',
  },
})
export class MatAccordion
  extends CdkAccordion
  implements MatAccordionBase, AfterContentInit, OnDestroy
{
  private _keyManager: FocusKeyManager<MatExpansionPanelHeader>;

  /**
   * Headers belonging to this accordion.
   *
   * 该手风琴的标头。
   *
   */
  private _ownHeaders = new QueryList<MatExpansionPanelHeader>();

  /**
   * All headers inside the accordion. Includes headers inside nested accordions.
   *
   * 该手风琴的所有标头。也包括嵌套的手风琴中的标头。
   *
   */
  @ContentChildren(MatExpansionPanelHeader, {descendants: true})
  _headers: QueryList<MatExpansionPanelHeader>;

  /**
   * Whether the expansion indicator should be hidden.
   *
   * 是否应该隐藏展开指示器。
   *
   */
  @Input()
  get hideToggle(): boolean {
    return this._hideToggle;
  }
  set hideToggle(show: BooleanInput) {
    this._hideToggle = coerceBooleanProperty(show);
  }
  private _hideToggle: boolean = false;

  /**
   * Display mode used for all expansion panels in the accordion. Currently two display
   * modes exist:
   *  default - a gutter-like spacing is placed around any expanded panel, placing the expanded
   *     panel at a different elevation from the rest of the accordion.
   *  flat - no spacing is placed around expanded panels, showing all panels at the same
   *     elevation.
   *
   * 手风琴中的所有可展开面板的显示模式。目前有两种显示模式：
   * default - 在任何展开的面板周围放置一个类似于沟的间距，把展开的面板放在与手风琴其余部分不同的纵深上。
   * flat - 展开的面板周围没有间距，所有面板显示在同样的纵深上。
   *
   */
  @Input() displayMode: MatAccordionDisplayMode = 'default';

  /**
   * The position of the expansion indicator.
   *
   * 展开指示器的位置。
   *
   */
  @Input() togglePosition: MatAccordionTogglePosition = 'after';

  ngAfterContentInit() {
    this._headers.changes
      .pipe(startWith(this._headers))
      .subscribe((headers: QueryList<MatExpansionPanelHeader>) => {
        this._ownHeaders.reset(headers.filter(header => header.panel.accordion === this));
        this._ownHeaders.notifyOnChanges();
      });

    this._keyManager = new FocusKeyManager(this._ownHeaders).withWrap().withHomeAndEnd();
  }

  /**
   * Handles keyboard events coming in from the panel headers.
   *
   * 处理从面板标头进来的键盘事件。
   *
   */
  _handleHeaderKeydown(event: KeyboardEvent) {
    this._keyManager.onKeydown(event);
  }

  _handleHeaderFocus(header: MatExpansionPanelHeader) {
    this._keyManager.updateActiveItem(header);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._keyManager?.destroy();
    this._ownHeaders.destroy();
  }
}
