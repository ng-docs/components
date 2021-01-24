/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput} from '@angular/cdk/coercion';
import {TemplatePortal} from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  InjectionToken,
  Inject,
} from '@angular/core';
import {CanDisable, CanDisableCtor, mixinDisabled} from '@angular/material/core';
import {Subject} from 'rxjs';
import {MAT_TAB_CONTENT} from './tab-content';
import {MAT_TAB_LABEL, MatTabLabel} from './tab-label';


// Boilerplate for applying mixins to MatTab.
/** @docs-private */
class MatTabBase {}
const _MatTabMixinBase: CanDisableCtor & typeof MatTabBase =
    mixinDisabled(MatTabBase);

/**
 * Used to provide a tab group to a tab without causing a circular dependency.
 *
 * 用来为选项卡提供一个选项卡组，而不会产生循环依赖。
 *
 * @docs-private
 */
export const MAT_TAB_GROUP = new InjectionToken<any>('MAT_TAB_GROUP');

@Component({
  selector: 'mat-tab',
  templateUrl: 'tab.html',
  inputs: ['disabled'],
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'matTab',
})
export class MatTab extends _MatTabMixinBase implements OnInit, CanDisable, OnChanges, OnDestroy {
  /**
   * Content for the tab label given by `<ng-template mat-tab-label>`.
   *
   * 选项卡标签的内容由 `<ng-template mat-tab-label>` 指定。
   *
   */
  @ContentChild(MAT_TAB_LABEL)
  get templateLabel(): MatTabLabel { return this._templateLabel; }
  set templateLabel(value: MatTabLabel) { this._setTemplateLabelInput(value); }
  protected _templateLabel: MatTabLabel;

  /**
   * Template provided in the tab content that will be used if present, used to enable lazy-loading
   *
   * 选项卡内容中提供的模板，如果存在，将用于启用惰性加载
   *
   */
  @ContentChild(MAT_TAB_CONTENT, {read: TemplateRef, static: true})
  _explicitContent: TemplateRef<any>;

  /**
   * Template inside the MatTab view that contains an `<ng-content>`.
   *
   *  MatTab 视图中包含 `<ng-content>` 的模板内容。
   *
   */
  @ViewChild(TemplateRef, {static: true}) _implicitContent: TemplateRef<any>;

  /**
   * Plain text label for the tab, used when there is no template label.
   *
   * 选项卡的纯文本标签，没有模板标签时使用。
   *
   */
  @Input('label') textLabel: string = '';

  /**
   * Aria label for the tab.
   *
   * 选项卡的 Aria 标签。
   *
   */
  @Input('aria-label') ariaLabel: string;

  /**
   * Reference to the element that the tab is labelled by.
   * Will be cleared if `aria-label` is set at the same time.
   *
   * 到选项卡标签所标注的元素的引用。如果同时设置了 `aria-label`，该属性将被清除。
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string;

  /**
   * Portal that will be the hosted content of the tab
   *
   * 该选项卡内容的传送点
   *
   */
  private _contentPortal: TemplatePortal | null = null;

  /** @docs-private */
  get content(): TemplatePortal | null {
    return this._contentPortal;
  }

  /**
   * Emits whenever the internal state of the tab changes.
   *
   * 只要选项卡内部状态发生变化，就会发出通知。
   *
   */
  readonly _stateChanges = new Subject<void>();

  /**
   * The relatively indexed position where 0 represents the center, negative is left, and positive
   * represents the right.
   *
   * 相对的索引位置，其中 0 代表中心，负数代表左边，正数代表右边。
   *
   */
  position: number | null = null;

  /**
   * The initial relatively index origin of the tab if it was created and selected after there
   * was already a selected tab. Provides context of what position the tab should originate from.
   *
   * 该选项卡初始相对索引的原点（如果已经创建并在已选定的选项卡之后被选定）。这个属性提供了此选项卡应该来自哪个位置的上下文。
   *
   */
  origin: number | null = null;

  /**
   * Whether the tab is currently active.
   *
   * 该选项卡目前是否有效。
   *
   */
  isActive = false;

  constructor(
    private _viewContainerRef: ViewContainerRef,
    @Inject(MAT_TAB_GROUP) public _closestTabGroup: any) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('textLabel') || changes.hasOwnProperty('disabled')) {
      this._stateChanges.next();
    }
  }

  ngOnDestroy(): void {
    this._stateChanges.complete();
  }

  ngOnInit(): void {
    this._contentPortal = new TemplatePortal(
        this._explicitContent || this._implicitContent, this._viewContainerRef);
  }

  /**
   * This has been extracted to a util because of TS 4 and VE.
   * View Engine doesn't support property rename inheritance.
   * TS 4.0 doesn't allow properties to override accessors or vice-versa.
   *
   * 由于 TS 4 和 VE 的原因，它已被提取成了一个工具函数。 View Engine 不支持继承时进行属性重命名。 TS 4.0 不允许改写属性访问器，反之亦然。
   *
   * @docs-private
   */
  protected _setTemplateLabelInput(value: MatTabLabel) {
    // Only update the templateLabel via query if there is actually
    // a MatTabLabel found. This works around an issue where a user may have
    // manually set `templateLabel` during creation mode, which would then get clobbered
    // by `undefined` when this query resolves.
    if (value) {
      this._templateLabel = value;
    }
  }

  static ngAcceptInputType_disabled: BooleanInput;
}
