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

/** Represents an event fired on an individual `mat-chip`. */
export interface MatChipEvent {
  /** The chip the event was fired on. */
  chip: MatChip;
}

/** Event object emitted by MatChip when selected or deselected. */
export class MatChipSelectionChange {
  constructor(
    /** Reference to the chip that emitted the event. */
    public source: MatChip,
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
 */
export const MAT_CHIP_REMOVE = new InjectionToken<MatChipRemove>('MatChipRemove');

/**
 * Injection token that can be used to reference instances of `MatChipAvatar`. It serves as
 * alternative token to the actual `MatChipAvatar` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const MAT_CHIP_AVATAR = new InjectionToken<MatChipAvatar>('MatChipAvatar');

/**
 * Injection token that can be used to reference instances of `MatChipTrailingIcon`. It serves as
 * alternative token to the actual `MatChipTrailingIcon` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const MAT_CHIP_TRAILING_ICON = new InjectionToken<MatChipTrailingIcon>(
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
 * @docs-private
 */
@Directive({
  selector: 'mat-chip-avatar, [matChipAvatar]',
  host: {'class': 'mat-chip-avatar'},
  providers: [{provide: MAT_CHIP_AVATAR, useExisting: MatChipAvatar}],
})
export class MatChipAvatar {}

/**
 * Dummy directive to add CSS class to chip trailing icon.
 * @docs-private
 */
@Directive({
  selector: 'mat-chip-trailing-icon, [matChipTrailingIcon]',
  host: {'class': 'mat-chip-trailing-icon'},
  providers: [{provide: MAT_CHIP_TRAILING_ICON, useExisting: MatChipTrailingIcon}],
})
export class MatChipTrailingIcon {}

/** Material Design styled chip directive. Used inside the MatChipList component. */
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
export class MatChip
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
   * @docs-private
   */
  rippleConfig: RippleConfig & RippleGlobalOptions;

  /**
   * Whether ripples are disabled on interaction
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

  /** Whether the chip has focus. */
  _hasFocus: boolean = false;

  /** Whether animations for the chip are enabled. */
  _animationsDisabled: boolean;

  /** Whether the chip list is selectable */
  chipListSelectable: boolean = true;

  /** Whether the chip list is in multi-selection mode. */
  _chipListMultiple: boolean = false;

  /** Whether the chip list as a whole is disabled. */
  _chipListDisabled: boolean = false;

  /** The chip avatar */
  @ContentChild(MAT_CHIP_AVATAR) avatar: MatChipAvatar;

  /** The chip's trailing icon. */
  @ContentChild(MAT_CHIP_TRAILING_ICON) trailingIcon: MatChipTrailingIcon;

  /** The chip's remove toggler. */
  @ContentChild(MAT_CHIP_REMOVE) removeIcon: MatChipRemove;

  /** ARIA role that should be applied to the chip. */
  @Input() role: string = 'option';

  /** Whether the chip is selected. */
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

  /** The value of the chip. Defaults to the content inside `<mat-chip>` tags. */
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
   */
  @Input()
  get selectable(): boolean {
    return this._selectable && this.chipListSelectable;
  }
  set selectable(value: BooleanInput) {
    this._selectable = coerceBooleanProperty(value);
  }
  protected _selectable: boolean = true;

  /** Whether the chip is disabled. */
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
   */
  @Input()
  get removable(): boolean {
    return this._removable;
  }
  set removable(value: BooleanInput) {
    this._removable = coerceBooleanProperty(value);
  }
  protected _removable: boolean = true;

  /** Emits when the chip is focused. */
  readonly _onFocus = new Subject<MatChipEvent>();

  /** Emits when the chip is blured. */
  readonly _onBlur = new Subject<MatChipEvent>();

  /** Emitted when the chip is selected or deselected. */
  @Output() readonly selectionChange: EventEmitter<MatChipSelectionChange> =
    new EventEmitter<MatChipSelectionChange>();

  /** Emitted when the chip is destroyed. */
  @Output() readonly destroyed: EventEmitter<MatChipEvent> = new EventEmitter<MatChipEvent>();

  /** Emitted when a chip is to be removed. */
  @Output() readonly removed: EventEmitter<MatChipEvent> = new EventEmitter<MatChipEvent>();

  /** The ARIA selected applied to the chip. */
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

  /** Selects the chip. */
  select(): void {
    if (!this._selected) {
      this._selected = true;
      this._dispatchSelectionChange();
      this._changeDetectorRef.markForCheck();
    }
  }

  /** Deselects the chip. */
  deselect(): void {
    if (this._selected) {
      this._selected = false;
      this._dispatchSelectionChange();
      this._changeDetectorRef.markForCheck();
    }
  }

  /** Select this chip and emit selected event */
  selectViaInteraction(): void {
    if (!this._selected) {
      this._selected = true;
      this._dispatchSelectionChange(true);
      this._changeDetectorRef.markForCheck();
    }
  }

  /** Toggles the current selected state of this chip. */
  toggleSelected(isUserInput: boolean = false): boolean {
    this._selected = !this.selected;
    this._dispatchSelectionChange(isUserInput);
    this._changeDetectorRef.markForCheck();
    return this.selected;
  }

  /** Allows for programmatic focusing of the chip. */
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
   * Informs any listeners of the removal request. Does not remove the chip from the DOM.
   */
  remove(): void {
    if (this.removable) {
      this.removed.emit({chip: this});
    }
  }

  /** Handles click events on the chip. */
  _handleClick(event: Event) {
    if (this.disabled) {
      event.preventDefault();
    }
  }

  /** Handle custom key presses. */
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
 * available at <https://material.io/icons/#ic_cancel>.
 *
 * Example:
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
 */
@Directive({
  selector: '[matChipRemove]',
  host: {
    'class': 'mat-chip-remove mat-chip-trailing-icon',
    '(click)': '_handleClick($event)',
  },
  providers: [{provide: MAT_CHIP_REMOVE, useExisting: MatChipRemove}],
})
export class MatChipRemove {
  constructor(protected _parentChip: MatChip, elementRef: ElementRef<HTMLElement>) {
    if (elementRef.nativeElement.nodeName === 'BUTTON') {
      elementRef.nativeElement.setAttribute('type', 'button');
    }
  }

  /** Calls the parent chip's public `remove()` method if applicable. */
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
