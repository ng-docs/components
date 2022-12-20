/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusableOption} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {BACKSPACE, DELETE, SPACE} from '@angular/cdk/keycodes';
import {Platform} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {
  Attribute,
  ChangeDetectorRef,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
} from '@angular/core';
import {
  CanColor,
  CanDisable,
  CanDisableRipple,
  HasTabIndex,
  MAT_RIPPLE_GLOBAL_OPTIONS,
  mixinColor,
  mixinDisableRipple,
  mixinTabIndex,
  RippleConfig,
  RippleGlobalOptions,
  RippleRenderer,
  RippleTarget,
} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

/**
 * Represents an event fired on an individual `mat-chip`.
 *
 * 表示单个 `mat-chip` 上触发的事件。
 *
 * @deprecated
 *
 * Use `MatChipEvent` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface MatLegacyChipEvent {
  /**
   * The chip the event was fired on.
   *
   * 触发该事件的纸片。
   *
   */
  chip: MatLegacyChip;
}

/**
 * Event object emitted by MatChip when selected or deselected.
 *
 * MatChip 在选定或取消选定时会发出本事件对象。
 *
 * @deprecated
 *
 * Use `MatChipSelectionChange` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export class MatLegacyChipSelectionChange {
  constructor(
    /** Reference to the chip that emitted the event. */
    public source: MatLegacyChip,
    /** Whether the chip that emitted the event is selected. */
    public selected: boolean,
    /** Whether the selection change was a result of a user interaction. */
    public isUserInput = false,
  ) {}
}

/**
 * Injection token that can be used to reference instances of `MatChipRemove`. It serves as
 * alternative token to the actual `MatChipRemove` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatChipRemove` 实例。它可以作为实际 `MatChipRemove` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 * @deprecated
 *
 * Use `MAT_CHIP_REMOVE` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export const MAT_LEGACY_CHIP_REMOVE = new InjectionToken<MatLegacyChipRemove>('MatChipRemove');

/**
 * Injection token that can be used to reference instances of `MatChipAvatar`. It serves as
 * alternative token to the actual `MatChipAvatar` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatChipAvatar` 实例。它可以作为实际 `MatChipAvatar` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 * @deprecated
 *
 * Use `MAT_CHIP_AVATAR` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export const MAT_LEGACY_CHIP_AVATAR = new InjectionToken<MatLegacyChipAvatar>('MatChipAvatar');

/**
 * Injection token that can be used to reference instances of `MatChipTrailingIcon`. It serves as
 * alternative token to the actual `MatChipTrailingIcon` class which could cause unnecessary
 * retention of the class and its directive metadata.
 *
 * 这个注入令牌可以用来引用 `MatChipTrailingIcon` 实例。它可以作为实际 `MatChipTrailingIcon` 类的备用令牌，直接使用实际类可能导致该类及其元数据无法被优化掉。
 *
 * @deprecated
 *
 * Use `MAT_CHIP_TRAILING_ICON` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export const MAT_LEGACY_CHIP_TRAILING_ICON = new InjectionToken<MatLegacyChipTrailingIcon>(
  'MatChipTrailingIcon',
);

// Boilerplate for applying mixins to MatChip.
/** @docs-private */
abstract class MatChipBase {
  abstract disabled: boolean;
  constructor(public _elementRef: ElementRef) {}
}

const _MatChipMixinBase = mixinTabIndex(mixinColor(mixinDisableRipple(MatChipBase), 'primary'), -1);

/**
 * Dummy directive to add CSS class to chip avatar.
 *
 * 将 CSS 类添加到纸片头像的虚拟指令。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatChipAvatar` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'mat-chip-avatar, [matChipAvatar]',
  host: {'class': 'mat-chip-avatar'},
  providers: [{provide: MAT_LEGACY_CHIP_AVATAR, useExisting: MatLegacyChipAvatar}],
})
export class MatLegacyChipAvatar {}

/**
 * Dummy directive to add CSS class to chip trailing icon.
 *
 * 将 CSS 类添加到纸片尾随图标的虚拟指令。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatChipTrailingIcon` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'mat-chip-trailing-icon, [matChipTrailingIcon]',
  host: {'class': 'mat-chip-trailing-icon'},
  providers: [{provide: MAT_LEGACY_CHIP_TRAILING_ICON, useExisting: MatLegacyChipTrailingIcon}],
})
export class MatLegacyChipTrailingIcon {}

/**
 * Material Design styled chip directive. Used inside the MatChipList component.
 *
 * Material Design 风格的纸片指令。在 MatChipList 组件内部使用。
 *
 * @deprecated
 *
 * Use `MatChip` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
@Directive({
  selector: `mat-basic-chip, [mat-basic-chip], mat-chip, [mat-chip]`,
  inputs: ['color', 'disableRipple', 'tabIndex'],
  exportAs: 'matChip',
  host: {
    'class': 'mat-chip mat-focus-indicator',
    '[attr.tabindex]': 'disabled ? null : tabIndex',
    '[attr.role]': 'role',
    '[class.mat-chip-selected]': 'selected',
    '[class.mat-chip-with-avatar]': 'avatar',
    '[class.mat-chip-with-trailing-icon]': 'trailingIcon || removeIcon',
    '[class.mat-chip-disabled]': 'disabled',
    '[class._mat-animation-noopable]': '_animationsDisabled',
    '[attr.disabled]': 'disabled || null',
    '[attr.aria-disabled]': 'disabled.toString()',
    '[attr.aria-selected]': 'ariaSelected',
    '(click)': '_handleClick($event)',
    '(keydown)': '_handleKeydown($event)',
    '(focus)': 'focus()',
    '(blur)': '_blur()',
  },
})
export class MatLegacyChip
  extends _MatChipMixinBase
  implements
    FocusableOption,
    OnDestroy,
    CanColor,
    CanDisableRipple,
    RippleTarget,
    HasTabIndex,
    CanDisable
{
  /** Reference to the RippleRenderer for the chip. */
  private _chipRipple: RippleRenderer;

  /**
   * Reference to the element that acts as the chip's ripple target. This element is
   * dynamically added as a child node of the chip. The chip itself cannot be used as the
   * ripple target because it must be the host of the focus indicator.
   */
  private _chipRippleTarget: HTMLElement;

  /**
   * Ripple configuration for ripples that are launched on pointer down. The ripple config
   * is set to the global ripple options since we don't have any configurable options for
   * the chip ripples.
   *
   * 当指针按下时启动的涟漪的配置。涟漪配置设置为全局涟漪选项，因为我们没有任何可配置的纸片涟漪选项。
   *
   * @docs-private
   */
  rippleConfig: RippleConfig & RippleGlobalOptions;

  /**
   * Whether ripples are disabled on interaction
   *
   * 交互时是否禁用涟漪
   *
   * @docs-private
   */
  get rippleDisabled(): boolean {
    return (
      this.disabled ||
      this.disableRipple ||
      this._animationsDisabled ||
      !!this.rippleConfig.disabled
    );
  }

  /**
   * Whether the chip has focus.
   *
   * 纸片是否有焦点。
   *
   */
  _hasFocus: boolean = false;

  /**
   * Whether animations for the chip are enabled.
   *
   * 纸片的动画是否已启用。
   *
   */
  _animationsDisabled: boolean;

  /**
   * Whether the chip list is selectable
   *
   * 纸片列表是否可选
   *
   */
  chipListSelectable: boolean = true;

  /**
   * Whether the chip list is in multi-selection mode.
   *
   * 纸片列表是否为多选模式。
   *
   */
  _chipListMultiple: boolean = false;

  /**
   * Whether the chip list as a whole is disabled.
   *
   * 纸片列表是否作为一个整体被禁用。
   *
   */
  _chipListDisabled: boolean = false;

  /**
   * The chip avatar
   *
   * 该纸片的头像
   *
   */
  @ContentChild(MAT_LEGACY_CHIP_AVATAR) avatar: MatLegacyChipAvatar;

  /**
   * The chip's trailing icon.
   *
   * 该纸片的尾部图标。
   *
   */
  @ContentChild(MAT_LEGACY_CHIP_TRAILING_ICON) trailingIcon: MatLegacyChipTrailingIcon;

  /**
   * The chip's remove toggler.
   *
   * 该纸片的移除切换器。
   *
   */
  @ContentChild(MAT_LEGACY_CHIP_REMOVE) removeIcon: MatLegacyChipRemove;

  /**
   * ARIA role that should be applied to the chip.
   *
   * 应该应用于本纸片的 ARIA 角色。
   *
   */
  @Input() role: string = 'option';

  /**
   * Whether the chip is selected.
   *
   * 纸片是否被选定。
   *
   */
  @Input()
  get selected(): boolean {
    return this._selected;
  }
  set selected(value: BooleanInput) {
    const coercedValue = coerceBooleanProperty(value);

    if (coercedValue !== this._selected) {
      this._selected = coercedValue;
      this._dispatchSelectionChange();
    }
  }
  protected _selected: boolean = false;

  /**
   * The value of the chip. Defaults to the content inside `<mat-chip>` tags.
   *
   * 该纸片的值。默认为 `<mat-chip>` 标签中的内容。
   *
   */
  @Input()
  get value(): any {
    return this._value !== undefined ? this._value : this._elementRef.nativeElement.textContent;
  }
  set value(value: any) {
    this._value = value;
  }
  protected _value: any;

  /**
   * Whether or not the chip is selectable. When a chip is not selectable,
   * changes to its selected state are always ignored. By default a chip is
   * selectable, and it becomes non-selectable if its parent chip list is
   * not selectable.
   *
   * 该纸片是否可以选择。当纸片不可选时，总会忽略对选定状态的更改。默认情况下，纸片是可选择的，如果它的父纸片列表不可选，它就会变得不可选。
   *
   */
  @Input()
  get selectable(): boolean {
    return this._selectable && this.chipListSelectable;
  }
  set selectable(value: BooleanInput) {
    this._selectable = coerceBooleanProperty(value);
  }
  protected _selectable: boolean = true;

  /**
   * Whether the chip is disabled.
   *
   * 纸片是否已禁用了。
   *
   */
  @Input()
  get disabled(): boolean {
    return this._chipListDisabled || this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  protected _disabled: boolean = false;

  /**
   * Determines whether or not the chip displays the remove styling and emits (removed) events.
   *
   * 确定该纸片是否显示移除样式并发出 (removed) 事件。
   *
   */
  @Input()
  get removable(): boolean {
    return this._removable;
  }
  set removable(value: BooleanInput) {
    this._removable = coerceBooleanProperty(value);
  }
  protected _removable: boolean = true;

  /**
   * Emits when the chip is focused.
   *
   * 当纸片聚焦时发出。
   *
   */
  readonly _onFocus = new Subject<MatLegacyChipEvent>();

  /**
   * Emits when the chip is blurred.
   *
   * 当纸片失焦时发出。
   *
   */
  readonly _onBlur = new Subject<MatLegacyChipEvent>();

  /**
   * Emitted when the chip is selected or deselected.
   *
   * 该纸片被选定或取消选定时会触发。
   *
   */
  @Output() readonly selectionChange: EventEmitter<MatLegacyChipSelectionChange> =
    new EventEmitter<MatLegacyChipSelectionChange>();

  /**
   * Emitted when the chip is destroyed.
   *
   * 当该纸片被销毁时会触发。
   *
   */
  @Output() readonly destroyed: EventEmitter<MatLegacyChipEvent> =
    new EventEmitter<MatLegacyChipEvent>();

  /**
   * Emitted when a chip is to be removed.
   *
   * 当要移除某个纸片时会触发。
   *
   */
  @Output() readonly removed: EventEmitter<MatLegacyChipEvent> =
    new EventEmitter<MatLegacyChipEvent>();

  /**
   * The ARIA selected applied to the chip.
   *
   * 应用于该纸片的 ARIA 选定属性。
   *
   */
  get ariaSelected(): string | null {
    // Remove the `aria-selected` when the chip is deselected in single-selection mode, because
    // it adds noise to NVDA users where "not selected" will be read out for each chip.
    return this.selectable && (this._chipListMultiple || this.selected)
      ? this.selected.toString()
      : null;
  }

  constructor(
    elementRef: ElementRef<HTMLElement>,
    private _ngZone: NgZone,
    platform: Platform,
    @Optional()
    @Inject(MAT_RIPPLE_GLOBAL_OPTIONS)
    globalRippleOptions: RippleGlobalOptions | null,
    private _changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) _document: any,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
    @Attribute('tabindex') tabIndex?: string,
  ) {
    super(elementRef);

    this._addHostClassName();

    // Dynamically create the ripple target, append it within the chip, and use it as the
    // chip's ripple target. Adding the class '.mat-chip-ripple' ensures that it will have
    // the proper styles.
    this._chipRippleTarget = _document.createElement('div');
    this._chipRippleTarget.classList.add('mat-chip-ripple');
    this._elementRef.nativeElement.appendChild(this._chipRippleTarget);
    this._chipRipple = new RippleRenderer(this, _ngZone, this._chipRippleTarget, platform);
    this._chipRipple.setupTriggerEvents(elementRef);

    this.rippleConfig = globalRippleOptions || {};
    this._animationsDisabled = animationMode === 'NoopAnimations';
    this.tabIndex = tabIndex != null ? parseInt(tabIndex) || -1 : -1;
  }

  _addHostClassName() {
    const basicChipAttrName = 'mat-basic-chip';
    const element = this._elementRef.nativeElement as HTMLElement;

    if (
      element.hasAttribute(basicChipAttrName) ||
      element.tagName.toLowerCase() === basicChipAttrName
    ) {
      element.classList.add(basicChipAttrName);
      return;
    } else {
      element.classList.add('mat-standard-chip');
    }
  }

  ngOnDestroy() {
    this.destroyed.emit({chip: this});
    this._chipRipple._removeTriggerEvents();
  }

  /**
   * Selects the chip.
   *
   * 选择该纸片。
   *
   */
  select(): void {
    if (!this._selected) {
      this._selected = true;
      this._dispatchSelectionChange();
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Deselects the chip.
   *
   * 取消选择该纸片。
   *
   */
  deselect(): void {
    if (this._selected) {
      this._selected = false;
      this._dispatchSelectionChange();
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Select this chip and emit selected event
   *
   * 选择这个纸片并发出 selected 事件
   *
   */
  selectViaInteraction(): void {
    if (!this._selected) {
      this._selected = true;
      this._dispatchSelectionChange(true);
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Toggles the current selected state of this chip.
   *
   * 切换当前纸片的选定状态。
   *
   */
  toggleSelected(isUserInput: boolean = false): boolean {
    this._selected = !this.selected;
    this._dispatchSelectionChange(isUserInput);
    this._changeDetectorRef.markForCheck();
    return this.selected;
  }

  /**
   * Allows for programmatic focusing of the chip.
   *
   * 允许通过编程把该纸片设为焦点。
   *
   */
  focus(): void {
    if (!this._hasFocus) {
      this._elementRef.nativeElement.focus();
      this._onFocus.next({chip: this});
    }
    this._hasFocus = true;
  }

  /**
   * Allows for programmatic removal of the chip. Called by the MatChipList when the DELETE or
   * BACKSPACE keys are pressed.
   *
   * 允许以编程方式移除该纸片。当按下 DELETE 或 BACKSPACE 键时，会由 MatChipList 调用。
   *
   * Informs any listeners of the removal request. Does not remove the chip from the DOM.
   *
   * 通知任何监听器这个删除请求。但不会从 DOM 中移除纸片。
   *
   */
  remove(): void {
    if (this.removable) {
      this.removed.emit({chip: this});
    }
  }

  /**
   * Handles click events on the chip.
   *
   * 处理纸片上的点击事件。
   *
   */
  _handleClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
    }
  }

  /**
   * Handle custom key presses.
   *
   * 处理自定义按键。
   *
   */
  _handleKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    switch (event.keyCode) {
      case DELETE:
      case BACKSPACE:
        // If we are removable, remove the focused chip
        this.remove();
        // Always prevent so page navigation does not occur
        event.preventDefault();
        break;
      case SPACE:
        // If we are selectable, toggle the focused chip
        if (this.selectable) {
          this.toggleSelected(true);
        }

        // Always prevent space from scrolling the page since the list has focus
        event.preventDefault();
        break;
    }
  }

  _blur(): void {
    // When animations are enabled, Angular may end up removing the chip from the DOM a little
    // earlier than usual, causing it to be blurred and throwing off the logic in the chip list
    // that moves focus not the next item. To work around the issue, we defer marking the chip
    // as not focused until the next time the zone stabilizes.
    this._ngZone.onStable.pipe(take(1)).subscribe(() => {
      this._ngZone.run(() => {
        this._hasFocus = false;
        this._onBlur.next({chip: this});
      });
    });
  }

  private _dispatchSelectionChange(isUserInput = false) {
    this.selectionChange.emit({
      source: this,
      isUserInput,
      selected: this._selected,
    });
  }
}

/**
 * Applies proper (click) support and adds styling for use with the Material Design "cancel" icon
 * available at https://material.io/icons/#ic_cancel.
 *
 * 应用正确的（click）支持，并为 https://material.io/icons/#ic_cancel 提供的 Material Design “cancel” 图标添加样式。
 *
 * Example:
 *
 * 示例：
 *
 * ```
 * `<mat-chip>
 *   <mat-icon matChipRemove>cancel</mat-icon>
 * </mat-chip>`
 * ```
 *
 * You *may* use a custom icon, but you may need to override the `mat-chip-remove` positioning
 * styles to properly center the icon within the chip.
 *
 * 你*可以*使用自定义图标，但是可能需要改写 `mat-chip-remove` 的定位样式，这样才能让图标在纸片内正确居中。
 *
 * @deprecated
 *
 * Use `MatChipRemove` from `@angular/material/chips` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[matChipRemove]',
  host: {
    'class': 'mat-chip-remove mat-chip-trailing-icon',
    '(click)': '_handleClick($event)',
  },
  providers: [{provide: MAT_LEGACY_CHIP_REMOVE, useExisting: MatLegacyChipRemove}],
})
export class MatLegacyChipRemove {
  constructor(protected _parentChip: MatLegacyChip, elementRef: ElementRef<HTMLElement>) {
    if (elementRef.nativeElement.nodeName === 'BUTTON') {
      elementRef.nativeElement.setAttribute('type', 'button');
    }
  }

  /**
   * Calls the parent chip's public `remove()` method if applicable.
   *
   * 如果适用，调用父纸片的公共 `remove()` 方法。
   *
   */
  _handleClick(event: Event): void {
    const parentChip = this._parentChip;

    if (parentChip.removable && !parentChip.disabled) {
      parentChip.remove();
    }

    // We need to stop event propagation because otherwise the event will bubble up to the
    // form field and cause the `onContainerClick` method to be invoked. This method would then
    // reset the focused chip that has been focused after chip removal. Usually the parent
    // the parent click listener of the `MatChip` would prevent propagation, but it can happen
    // that the chip is being removed before the event bubbles up.
    event.stopPropagation();
    event.preventDefault();
  }
}
