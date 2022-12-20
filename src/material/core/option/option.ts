/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusableOption, FocusOrigin} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {ENTER, hasModifierKey, SPACE} from '@angular/cdk/keycodes';
import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ElementRef,
  ChangeDetectorRef,
  Optional,
  Inject,
  Directive,
  AfterViewChecked,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  QueryList,
  ViewChild,
} from '@angular/core';
import {Subject} from 'rxjs';
import {MatOptgroup, MAT_OPTGROUP, _MatOptgroupBase} from './optgroup';
import {MatOptionParentComponent, MAT_OPTION_PARENT_COMPONENT} from './option-parent';

/**
 * Option IDs need to be unique across components, so this counter exists outside of
 * the component definition.
 *
 * 选项的 ID 在各个组件之间必须是唯一的，因此此计数器存在于组件定义之外。
 *
 */
let _uniqueIdCounter = 0;

/**
 * Event object emitted by MatOption when selected or deselected.
 *
 * 选中或取消选中 MatOption 发出的事件对象。
 *
 */
export class MatOptionSelectionChange<T = any> {
  constructor(
    /**
     * Reference to the option that emitted the event.
     *
     * 到发出此事件的选项的引用。
     *
     */
    public source: _MatOptionBase<T>,
    /**
     * Whether the change in the option's value was a result of a user action.
     *
     * 本次结果值的变化是否有用户操作导致的。
     */
    public isUserInput = false,
  ) {}
}

@Directive()
export class _MatOptionBase<T = any> implements FocusableOption, AfterViewChecked, OnDestroy {
  private _selected = false;
  private _active = false;
  private _disabled = false;
  private _mostRecentViewValue = '';

  /**
   * Whether the wrapping component is in multiple selection mode.
   *
   * 包装组件是否处于多选模式。
   *
   */
  get multiple() {
    return this._parent && this._parent.multiple;
  }

  /**
   * Whether or not the option is currently selected.
   *
   * 当前是否选择了此选项。
   *
   */
  get selected(): boolean {
    return this._selected;
  }

  /**
   * The form value of the option.
   *
   * 此选项的表单值。
   *
   */
  @Input() value: T;

  /**
   * The unique ID of the option.
   *
   * 此选项的唯一 ID。
   *
   */
  @Input() id: string = `mat-option-${_uniqueIdCounter++}`;

  /**
   * Whether the option is disabled.
   *
   * 该选项是否已禁用。
   *
   */
  @Input()
  get disabled(): boolean {
    return (this.group && this.group.disabled) || this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }

  /**
   * Whether ripples for the option are disabled.
   *
   * 此选项的涟漪是否已禁用。
   *
   */
  get disableRipple(): boolean {
    return !!(this._parent && this._parent.disableRipple);
  }

  /**
   * Event emitted when the option is selected or deselected.
   *
   * 选择或取消选择该选项时发出的事件。
   *
   */
  // tslint:disable-next-line:no-output-on-prefix
  @Output() readonly onSelectionChange = new EventEmitter<MatOptionSelectionChange<T>>();

  /** Element containing the option's text. */
  @ViewChild('text', {static: true}) _text: ElementRef<HTMLElement> | undefined;

  /**
   * Emits when the state of the option changes and any parents have to be notified.
   *
   * 当选项的状态发生变化时发出，任何父级都会被通知到。
   *
   */
  readonly _stateChanges = new Subject<void>();

  constructor(
    private _element: ElementRef<HTMLElement>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _parent: MatOptionParentComponent,
    readonly group: _MatOptgroupBase,
  ) {}

  /**
   * Whether or not the option is currently active and ready to be selected.
   * An active option displays styles as if it is focused, but the
   * focus is actually retained somewhere else. This comes in handy
   * for components like autocomplete where focus must remain on the input.
   *
   * 该选项当前是否处于活动状态并且可以被选中。激活的选项将样式显示为具有焦点的样子，但实际上焦点仍留在其他位置。这对于像自动完成这样的组件非常有用，在这些组件中焦点必须保持在输入框上。
   *
   */
  get active(): boolean {
    return this._active;
  }

  /**
   * The displayed value of the option. It is necessary to show the selected option in the
   * select's trigger.
   *
   * 此选项的显示值。必须在选择器的触发器中显示选中的选项。
   *
   */
  get viewValue(): string {
    // TODO(kara): Add input property alternative for node envs.
    return (this._text?.nativeElement.textContent || '').trim();
  }

  /**
   * Selects the option.
   *
   * 选择此选项。
   *
   */
  select(): void {
    if (!this._selected) {
      this._selected = true;
      this._changeDetectorRef.markForCheck();
      this._emitSelectionChangeEvent();
    }
  }

  /**
   * Deselects the option.
   *
   * 取消选择此选项。
   *
   */
  deselect(): void {
    if (this._selected) {
      this._selected = false;
      this._changeDetectorRef.markForCheck();
      this._emitSelectionChangeEvent();
    }
  }

  /**
   * Sets focus onto this option.
   *
   * 将焦点设置在此选项上。
   *
   */
  focus(_origin?: FocusOrigin, options?: FocusOptions): void {
    // Note that we aren't using `_origin`, but we need to keep it because some internal consumers
    // use `MatOption` in a `FocusKeyManager` and we need it to match `FocusableOption`.
    const element = this._getHostElement();

    if (typeof element.focus === 'function') {
      element.focus(options);
    }
  }

  /**
   * This method sets display styles on the option to make it appear
   * active. This is used by the ActiveDescendantKeyManager so key
   * events will display the proper options as active on arrow key events.
   *
   * 本方法在此选项上设置显示样式，以使其显示为活动状态。ActiveDescendantKeyManager 使用此属性，因此按键事件将在箭头按键事件上显示为激活状态的正确选项。
   *
   */
  setActiveStyles(): void {
    if (!this._active) {
      this._active = true;
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * This method removes display styles on the option that made it appear
   * active. This is used by the ActiveDescendantKeyManager so key
   * events will display the proper options as active on arrow key events.
   *
   * 此方法会删除使它显示为活动选项的显示样式。ActiveDescendantKeyManager 使用此属性，因此将在箭头按键事件时显示为激活状态的正确选项。
   *
   */
  setInactiveStyles(): void {
    if (this._active) {
      this._active = false;
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Gets the label to be used when determining whether the option should be focused.
   *
   * 获取在确定该选项是否应该获得焦点时使用的标签。
   *
   */
  getLabel(): string {
    return this.viewValue;
  }

  /**
   * Ensures the option is selected when activated from the keyboard.
   *
   * 确保从键盘激活后已选中该选项。
   *
   */
  _handleKeydown(event: KeyboardEvent): void {
    if ((event.keyCode === ENTER || event.keyCode === SPACE) && !hasModifierKey(event)) {
      this._selectViaInteraction();

      // Prevent the page from scrolling down and form submits.
      event.preventDefault();
    }
  }

  /**
   * `Selects the option while indicating the selection came from the user. Used to
   * determine if the select's view -> model callback should be invoked.`
   */
  _selectViaInteraction(): void {
    if (!this.disabled) {
      this._selected = this.multiple ? !this._selected : true;
      this._changeDetectorRef.markForCheck();
      this._emitSelectionChangeEvent(true);
    }
  }

  /**
   * Gets the `aria-selected` value for the option. We explicitly omit the `aria-selected`
   * attribute from single-selection, unselected options. Including the `aria-selected="false"`
   * attributes adds a significant amount of noise to screen-reader users without providing useful
   * information.
   *
   * 获取该选项的 `aria-selected` 值。我们未选中的选项中显式省略了单选的 `aria-selected` 属性。如果包含 `aria-selected="false"` 属性会在未提供有用信息的情况下为屏幕阅读器用户带来大量干扰。
   *
   */
  _getAriaSelected(): boolean | null {
    return this.selected || (this.multiple ? false : null);
  }

  /**
   * Returns the correct tabindex for the option depending on disabled state.
   *
   * 根据禁用状态返回此选项的正确 tabindex。
   *
   */
  _getTabIndex(): string {
    return this.disabled ? '-1' : '0';
  }

  /**
   * Gets the host DOM element.
   *
   * 获取宿主 DOM 元素。
   *
   */
  _getHostElement(): HTMLElement {
    return this._element.nativeElement;
  }

  ngAfterViewChecked() {
    // Since parent components could be using the option's label to display the selected values
    // (e.g. `mat-select`) and they don't have a way of knowing if the option's label has changed
    // we have to check for changes in the DOM ourselves and dispatch an event. These checks are
    // relatively cheap, however we still limit them only to selected options in order to avoid
    // hitting the DOM too often.
    if (this._selected) {
      const viewValue = this.viewValue;

      if (viewValue !== this._mostRecentViewValue) {
        if (this._mostRecentViewValue) {
          this._stateChanges.next();
        }

        this._mostRecentViewValue = viewValue;
      }
    }
  }

  ngOnDestroy() {
    this._stateChanges.complete();
  }

  /**
   * Emits the selection change event.
   *
   * 发出选择更改事件。
   *
   */
  private _emitSelectionChangeEvent(isUserInput = false): void {
    this.onSelectionChange.emit(new MatOptionSelectionChange<T>(this, isUserInput));
  }
}

/**
 * Single option inside of a `<mat-select>` element.
 *
 * `<mat-select>` 元素内的单个选项。
 *
 */
@Component({
  selector: 'mat-option',
  exportAs: 'matOption',
  host: {
    'role': 'option',
    '[attr.tabindex]': '_getTabIndex()',
    '[class.mdc-list-item--selected]': 'selected',
    '[class.mat-mdc-option-multiple]': 'multiple',
    '[class.mat-mdc-option-active]': 'active',
    '[class.mdc-list-item--disabled]': 'disabled',
    '[id]': 'id',
    '[attr.aria-selected]': '_getAriaSelected()',
    '[attr.aria-disabled]': 'disabled.toString()',
    '(click)': '_selectViaInteraction()',
    '(keydown)': '_handleKeydown($event)',
    'class': 'mat-mdc-option mat-mdc-focus-indicator mdc-list-item',
  },
  styleUrls: ['option.css'],
  templateUrl: 'option.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatOption<T = any> extends _MatOptionBase<T> {
  constructor(
    element: ElementRef<HTMLElement>,
    changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(MAT_OPTION_PARENT_COMPONENT) parent: MatOptionParentComponent,
    @Optional() @Inject(MAT_OPTGROUP) group: MatOptgroup,
  ) {
    super(element, changeDetectorRef, parent, group);
  }
}

/**
 * Counts the amount of option group labels that precede the specified option.
 *
 * 计算指定选项之前的选项组标签的数量。
 *
 * @param optionIndex Index of the option at which to start counting.
 *
 * 开始计数的选项的索引。
 *
 * @param options Flat list of all of the options.
 *
 * 所有选项的扁平列表。
 *
 * @param optionGroups Flat list of all of the option groups.
 *
 * 所有选项组的扁平列表。
 *
 * @docs-private
 */
export function _countGroupLabelsBeforeOption(
  optionIndex: number,
  options: QueryList<MatOption>,
  optionGroups: QueryList<MatOptgroup>,
): number {
  if (optionGroups.length) {
    let optionsArray = options.toArray();
    let groups = optionGroups.toArray();
    let groupCounter = 0;

    for (let i = 0; i < optionIndex + 1; i++) {
      if (optionsArray[i].group && optionsArray[i].group === groups[groupCounter]) {
        groupCounter++;
      }
    }

    return groupCounter;
  }

  return 0;
}

/**
 * Determines the position to which to scroll a panel in order for an option to be into view.
 *
 * 确定将面板滚动到哪个位置才能看到某个选项。
 *
 * @param optionOffset Offset of the option from the top of the panel.
 *
 * 面板顶部选项的偏移量。
 *
 * @param optionHeight Height of the options.
 *
 * 选项的高度。
 *
 * @param currentScrollPosition Current scroll position of the panel.
 *
 * 面板的当前滚动位置。
 *
 * @param panelHeight Height of the panel.
 *
 * 面板的高度。
 *
 * @docs-private
 */
export function _getOptionScrollPosition(
  optionOffset: number,
  optionHeight: number,
  currentScrollPosition: number,
  panelHeight: number,
): number {
  if (optionOffset < currentScrollPosition) {
    return optionOffset;
  }

  if (optionOffset + optionHeight > currentScrollPosition + panelHeight) {
    return Math.max(0, optionOffset - panelHeight + optionHeight);
  }

  return currentScrollPosition;
}
