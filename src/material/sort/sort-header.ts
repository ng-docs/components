/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AriaDescriber, FocusMonitor} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {ENTER, SPACE} from '@angular/cdk/keycodes';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {CanDisable, mixinDisabled} from '@angular/material/core';
import {merge, Subscription} from 'rxjs';
import {
  MAT_SORT_DEFAULT_OPTIONS,
  MatSort,
  MatSortable,
  MatSortDefaultOptions,
  SortHeaderArrowPosition,
} from './sort';
import {matSortAnimations} from './sort-animations';
import {SortDirection} from './sort-direction';
import {getSortHeaderNotContainedWithinSortError} from './sort-errors';
import {MatSortHeaderIntl} from './sort-header-intl';

// Boilerplate for applying mixins to the sort header.
/** @docs-private */
const _MatSortHeaderBase = mixinDisabled(class {});

/**
 * Valid positions for the arrow to be in for its opacity and translation. If the state is a
 * sort direction, the position of the arrow will be above/below and opacity 0. If the state is
 * hint, the arrow will be in the center with a slight opacity. Active state means the arrow will
 * be fully opaque in the center.
 *
 * 箭头要出现在的有效位置，主要其不透明度和平移值。如果状态是一个排序方向，箭头的位置会高于/低于此值，不透明度为 0。
 * 如果该状态是 hint，那么该箭头将位于中心，且略有不透明度。active 状态表示箭头在中心处是完全不透明的。
 *
 * @docs-private
 */
export type ArrowViewState = SortDirection | 'hint' | 'active';

/**
 * States describing the arrow's animated position \(animating fromState to toState\).
 * If the fromState is not defined, there will be no animated transition to the toState.
 *
 * 描述箭头动画位置的状态（动画从 fromState 变为 toState）。如果没有定义 fromState，就不会有到 toState 的过渡动画。
 *
 * @docs-private
 */
export interface ArrowViewStateTransition {
  fromState?: ArrowViewState;
  toState?: ArrowViewState;
}

/**
 * Column definition associated with a `MatSortHeader`.
 *
 * `MatSortHeader` 关联的列定义。
 *
 */
interface MatSortHeaderColumnDef {
  name: string;
}

/**
 * Applies sorting behavior \(click to change sort\) and styles to an element, including an
 * arrow to display the current sort direction.
 *
 * 对元素应用排序行为（点击以改变排序）和样式，包括一个显示当前排序方向的箭头。
 *
 * Must be provided with an id and contained within a parent MatSort directive.
 *
 * 必须提供一个 id 并将其包含在父 MatSort 指令中。
 *
 * If used on header cells in a CdkTable, it will automatically default its id from its containing
 * column definition.
 *
 * 如果在 CdkTable 的头单元格中使用它，它会自动默认包含列的定义。
 *
 */
@Component({
  selector: '[mat-sort-header]',
  exportAs: 'matSortHeader',
  templateUrl: 'sort-header.html',
  styleUrls: ['sort-header.css'],
  host: {
    'class': 'mat-sort-header',
    '(click)': '_handleClick()',
    '(keydown)': '_handleKeydown($event)',
    '(mouseenter)': '_setIndicatorHintVisible(true)',
    '(mouseleave)': '_setIndicatorHintVisible(false)',
    '[attr.aria-sort]': '_getAriaSortAttribute()',
    '[class.mat-sort-header-disabled]': '_isDisabled()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['disabled'],
  animations: [
    matSortAnimations.indicator,
    matSortAnimations.leftPointer,
    matSortAnimations.rightPointer,
    matSortAnimations.arrowOpacity,
    matSortAnimations.arrowPosition,
    matSortAnimations.allowChildren,
  ],
})
export class MatSortHeader
  extends _MatSortHeaderBase
  implements CanDisable, MatSortable, OnDestroy, OnInit, AfterViewInit
{
  private _rerenderSubscription: Subscription;

  /**
   * The element with role="button" inside this component's view. We need this
   * in order to apply a description with AriaDescriber.
   *
   * 此组件视图中具有 role="button" 的元素。我们需要它来应用 AriaDescriber 的描述。
   *
   */
  private _sortButton: HTMLElement;

  /**
   * Flag set to true when the indicator should be displayed while the sort is not active. Used to
   * provide an affordance that the header is sortable by showing on focus and hover.
   *
   * 当排序处于非活动状态时，如果要显示指示器，此标志为 true。用于在聚焦和悬停时表明可以通过表头进行排序。
   *
   */
  _showIndicatorHint: boolean = false;

  /**
   * The view transition state of the arrow \(translation/ opacity\) - indicates its `from` and `to`
   * position through the animation. If animations are currently disabled, the fromState is removed
   * so that there is no animation displayed.
   *
   * 箭头的视图过渡状态（平移/透明度） - 表示通过动画来从 `from` 的位置移到 `to` 的位置。
   * 如果当前禁用了动画，则会删除 fromState，以免显示任何动画。
   *
   */
  _viewState: ArrowViewStateTransition = {};

  /**
   * The direction the arrow should be facing according to the current state.
   *
   * 箭头应根据当前状态朝向的方向。
   *
   */
  _arrowDirection: SortDirection = '';

  /**
   * Whether the view state animation should show the transition between the `from` and `to` states.
   *
   * 视图状态动画是否应该显示在 `from` 和 `to` 状态之间的过渡。
   *
   */
  _disableViewStateAnimation = false;

  /**
   * ID of this sort header. If used within the context of a CdkColumnDef, this will default to
   * the column's name.
   *
   * 此排序头的 ID。如果在 CdkColumnDef 的上下文中使用，则默认为该列的名字。
   *
   */
  @Input('mat-sort-header') id: string;

  /**
   * Sets the position of the arrow that displays when sorted.
   *
   * 设置排序后显示的箭头位置。
   *
   */
  @Input() arrowPosition: SortHeaderArrowPosition = 'after';

  /**
   * Overrides the sort start value of the containing MatSort for this MatSortable.
   *
   * 改写这个 MatSortable 中包含 MatSort 的 sort 起始值。
   *
   */
  @Input() start: SortDirection;

  /**
   * Description applied to MatSortHeader's button element with aria-describedby. This text should
   * describe the action that will occur when the user clicks the sort header.
   *
   * 描述应用于 MatSortHeader 的按钮元素，带有 aria-describedby。此文本应描述用户单击排序标题时将发生的操作。
   *
   */
  @Input()
  get sortActionDescription(): string {
    return this._sortActionDescription;
  }
  set sortActionDescription(value: string) {
    this._updateSortActionDescription(value);
  }
  // Default the action description to "Sort" because it's better than nothing.
  // Without a description, the button's label comes from the sort header text content,
  // which doesn't give any indication that it performs a sorting operation.
  private _sortActionDescription: string = 'Sort';

  /**
   * Overrides the disable clear value of the containing MatSort for this MatSortable.
   *
   * 为这个 MatSortable 改写包含其中的 MatSort 的 disableClear 值。
   *
   */
  @Input()
  get disableClear(): boolean {
    return this._disableClear;
  }
  set disableClear(v: BooleanInput) {
    this._disableClear = coerceBooleanProperty(v);
  }
  private _disableClear: boolean;

  constructor(
    /**
     * @deprecated `_intl` parameter isn't being used anymore and it'll be removed.
     * @breaking-change 13.0.0
     */
    public _intl: MatSortHeaderIntl,
    private _changeDetectorRef: ChangeDetectorRef,
    // `MatSort` is not optionally injected, but just asserted manually w/ better error.
    // tslint:disable-next-line: lightweight-tokens
    @Optional() public _sort: MatSort,
    @Inject('MAT_SORT_HEADER_COLUMN_DEF')
    @Optional()
    public _columnDef: MatSortHeaderColumnDef,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    /** @breaking-change 14.0.0 _ariaDescriber will be required. */
    @Optional() private _ariaDescriber?: AriaDescriber | null,
    @Optional()
    @Inject(MAT_SORT_DEFAULT_OPTIONS)
    defaultOptions?: MatSortDefaultOptions,
  ) {
    // Note that we use a string token for the `_columnDef`, because the value is provided both by
    // `material/table` and `cdk/table` and we can't have the CDK depending on Material,
    // and we want to avoid having the sort header depending on the CDK table because
    // of this single reference.
    super();

    if (!_sort && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getSortHeaderNotContainedWithinSortError();
    }

    if (defaultOptions?.arrowPosition) {
      this.arrowPosition = defaultOptions?.arrowPosition;
    }

    this._handleStateChanges();
  }

  ngOnInit() {
    if (!this.id && this._columnDef) {
      this.id = this._columnDef.name;
    }

    // Initialize the direction of the arrow and set the view state to be immediately that state.
    this._updateArrowDirection();
    this._setAnimationTransitionState({
      toState: this._isSorted() ? 'active' : this._arrowDirection,
    });

    this._sort.register(this);

    this._sortButton = this._elementRef.nativeElement.querySelector('.mat-sort-header-container')!;
    this._updateSortActionDescription(this._sortActionDescription);
  }

  ngAfterViewInit() {
    // We use the focus monitor because we also want to style
    // things differently based on the focus origin.
    this._focusMonitor.monitor(this._elementRef, true).subscribe(origin => {
      const newState = !!origin;
      if (newState !== this._showIndicatorHint) {
        this._setIndicatorHintVisible(newState);
        this._changeDetectorRef.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._sort.deregister(this);
    this._rerenderSubscription.unsubscribe();
  }

  /**
   * Sets the "hint" state such that the arrow will be semi-transparently displayed as a hint to the
   * user showing what the active sort will become. If set to false, the arrow will fade away.
   *
   * 设置 “hint” 状态，以便箭头半透明地显示为提示，向用户表明可以激活此排序。如果设置为 false，箭头就会消失。
   *
   */
  _setIndicatorHintVisible(visible: boolean) {
    // No-op if the sort header is disabled - should not make the hint visible.
    if (this._isDisabled() && visible) {
      return;
    }

    this._showIndicatorHint = visible;

    if (!this._isSorted()) {
      this._updateArrowDirection();
      if (this._showIndicatorHint) {
        this._setAnimationTransitionState({fromState: this._arrowDirection, toState: 'hint'});
      } else {
        this._setAnimationTransitionState({fromState: 'hint', toState: this._arrowDirection});
      }
    }
  }

  /**
   * Sets the animation transition view state for the arrow's position and opacity. If the
   * `disableViewStateAnimation` flag is set to true, the `fromState` will be ignored so that
   * no animation appears.
   *
   * 为箭头的 position 和 opacity 设置动画过渡视图的状态。如果 `disableViewStateAnimation` 标志设置为 true，那么 `fromState` 就会被忽略，以免出现动画。
   *
   */
  _setAnimationTransitionState(viewState: ArrowViewStateTransition) {
    this._viewState = viewState || {};

    // If the animation for arrow position state (opacity/translation) should be disabled,
    // remove the fromState so that it jumps right to the toState.
    if (this._disableViewStateAnimation) {
      this._viewState = {toState: viewState.toState};
    }
  }

  /**
   * Triggers the sort on this sort header and removes the indicator hint.
   *
   * 在这个排序头上触发排序并删除提示指示器。
   *
   */
  _toggleOnInteraction() {
    this._sort.sort(this);

    // Do not show the animation if the header was already shown in the right position.
    if (this._viewState.toState === 'hint' || this._viewState.toState === 'active') {
      this._disableViewStateAnimation = true;
    }
  }

  _handleClick() {
    if (!this._isDisabled()) {
      this._sort.sort(this);
    }
  }

  _handleKeydown(event: KeyboardEvent) {
    if (!this._isDisabled() && (event.keyCode === SPACE || event.keyCode === ENTER)) {
      event.preventDefault();
      this._toggleOnInteraction();
    }
  }

  /**
   * Whether this MatSortHeader is currently sorted in either ascending or descending order.
   *
   * 这个 MatSortHeader 当前是以升序还是降序的。
   *
   */
  _isSorted() {
    return (
      this._sort.active == this.id &&
      (this._sort.direction === 'asc' || this._sort.direction === 'desc')
    );
  }

  /**
   * Returns the animation state for the arrow direction \(indicator and pointers\).
   *
   * 返回箭头方向的动画状态（指示器和指针）。
   *
   */
  _getArrowDirectionState() {
    return `${this._isSorted() ? 'active-' : ''}${this._arrowDirection}`;
  }

  /**
   * Returns the arrow position state \(opacity, translation\).
   *
   * 返回箭头位置的状态（不透明度，平移）。
   *
   */
  _getArrowViewState() {
    const fromState = this._viewState.fromState;
    return (fromState ? `${fromState}-to-` : '') + this._viewState.toState;
  }

  /**
   * Updates the direction the arrow should be pointing. If it is not sorted, the arrow should be
   * facing the start direction. Otherwise if it is sorted, the arrow should point in the currently
   * active sorted direction. The reason this is updated through a function is because the direction
   * should only be changed at specific times - when deactivated but the hint is displayed and when
   * the sort is active and the direction changes. Otherwise the arrow's direction should linger
   * in cases such as the sort becoming deactivated but we want to animate the arrow away while
   * preserving its direction, even though the next sort direction is actually different and should
   * only be changed once the arrow displays again \(hint or activation\).
   *
   * 更新箭头指向的方向。如果没有排序，箭头应朝向起始方向。如果有排序，箭头应指向当前活动的排序方向。
   * 这就是要通过函数进行更新的原因，因为该方向只能在特定的时候更改 - 当停用时。当排序处于活动状态且方向发生变化时却要显示提示。
   * 否则箭头的方向会停留在排序刚停止时的情况，但我们希望在保留其方向的同时让箭头以动画方式离开，
   * 即使下一个排序方向实际上是不同的，也只有在箭头再次显示时才改变（提示或激活） ）。
   *
   */
  _updateArrowDirection() {
    this._arrowDirection = this._isSorted() ? this._sort.direction : this.start || this._sort.start;
  }

  _isDisabled() {
    return this._sort.disabled || this.disabled;
  }

  /**
   * Gets the aria-sort attribute that should be applied to this sort header. If this header
   * is not sorted, returns null so that the attribute is removed from the host element. Aria spec
   * says that the aria-sort property should only be present on one header at a time, so removing
   * ensures this is true.
   *
   * 获取那些应该应用在此排序头上的 aria-sort 属性。如果这个头没有排序，则返回 null，以便该属性从宿主元素中删除。
   * Aria 规范规定，aria-sort 属性一次只能出现在一个排序头中，所以删除可以确保这是真的。
   *
   */
  _getAriaSortAttribute() {
    if (!this._isSorted()) {
      return 'none';
    }

    return this._sort.direction == 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Whether the arrow inside the sort header should be rendered.
   *
   * 是否应该渲染排序头中的箭头。
   *
   */
  _renderArrow() {
    return !this._isDisabled() || this._isSorted();
  }

  private _updateSortActionDescription(newDescription: string) {
    // We use AriaDescriber for the sort button instead of setting an `aria-label` because some
    // screen readers (notably VoiceOver) will read both the column header *and* the button's label
    // for every *cell* in the table, creating a lot of unnecessary noise.

    // If _sortButton is undefined, the component hasn't been initialized yet so there's
    // nothing to update in the DOM.
    if (this._sortButton) {
      // removeDescription will no-op if there is no existing message.
      // TODO(jelbourn): remove optional chaining when AriaDescriber is required.
      this._ariaDescriber?.removeDescription(this._sortButton, this._sortActionDescription);
      this._ariaDescriber?.describe(this._sortButton, newDescription);
    }

    this._sortActionDescription = newDescription;
  }

  /**
   * Handles changes in the sorting state.
   *
   * 处理排序状态中的变更。
   *
   */
  private _handleStateChanges() {
    this._rerenderSubscription = merge(
      this._sort.sortChange,
      this._sort._stateChanges,
      this._intl.changes,
    ).subscribe(() => {
      if (this._isSorted()) {
        this._updateArrowDirection();

        // Do not show the animation if the header was already shown in the right position.
        if (this._viewState.toState === 'hint' || this._viewState.toState === 'active') {
          this._disableViewStateAnimation = true;
        }

        this._setAnimationTransitionState({fromState: this._arrowDirection, toState: 'active'});
        this._showIndicatorHint = false;
      }

      // If this header was recently active and now no longer sorted, animate away the arrow.
      if (!this._isSorted() && this._viewState && this._viewState.toState === 'active') {
        this._disableViewStateAnimation = false;
        this._setAnimationTransitionState({fromState: 'active', toState: this._arrowDirection});
      }

      this._changeDetectorRef.markForCheck();
    });
  }
}
