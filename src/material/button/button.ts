/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusMonitor, FocusableOption, FocusOrigin} from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  Optional,
  Inject,
  Input,
  AfterViewInit,
} from '@angular/core';
import {
  CanColor,
  CanDisable,
  CanDisableRipple,
  MatRipple,
  mixinColor,
  mixinDisabled,
  mixinDisableRipple,
} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Default color palette for round buttons (mat-fab and mat-mini-fab)
 *
 * 圆形按钮的默认调色板（mat-fab 和 mat-mini-fab）
 *
 */
const DEFAULT_ROUND_BUTTON_COLOR = 'accent';

/**
 * List of classes to add to MatButton instances based on host attributes to
 * style as different variants.
 *
 * 要添加到 MatButton 实例中的类列表，它们会根据宿主属性设置为不同的样式。
 *
 */
const BUTTON_HOST_ATTRIBUTES = [
  'mat-button',
  'mat-flat-button',
  'mat-icon-button',
  'mat-raised-button',
  'mat-stroked-button',
  'mat-mini-fab',
  'mat-fab',
];

// Boilerplate for applying mixins to MatButton.
const _MatButtonBase = mixinColor(
  mixinDisabled(
    mixinDisableRipple(
      class {
        constructor(public _elementRef: ElementRef) {}
      },
    ),
  ),
);

/**
 * Material design button.
 *
 * Material Design 按钮。
 *
 */
@Component({
  selector: `button[mat-button], button[mat-raised-button], button[mat-icon-button],
             button[mat-fab], button[mat-mini-fab], button[mat-stroked-button],
             button[mat-flat-button]`,
  exportAs: 'matButton',
  host: {
    '[attr.disabled]': 'disabled || null',
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
    // Add a class for disabled button styling instead of the using attribute
    // selector or pseudo-selector.  This allows users to create focusabled
    // disabled buttons without recreating the styles.
    '[class.mat-button-disabled]': 'disabled',
    'class': 'mat-focus-indicator',
  },
  templateUrl: 'button.html',
  styleUrls: ['button.css'],
  inputs: ['disabled', 'disableRipple', 'color'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatButton
  extends _MatButtonBase
  implements AfterViewInit, OnDestroy, CanDisable, CanColor, CanDisableRipple, FocusableOption
{
  /**
   * Whether the button is round.
   *
   * 此按钮是否为圆形的。
   *
   */
  readonly isRoundButton: boolean = this._hasHostAttributes('mat-fab', 'mat-mini-fab');

  /**
   * Whether the button is icon button.
   *
   * 此按钮是否为图标按钮。
   *
   */
  readonly isIconButton: boolean = this._hasHostAttributes('mat-icon-button');

  /**
   * Reference to the MatRipple instance of the button.
   *
   * 引用此按钮的 MatRipple 实例。
   *
   */
  @ViewChild(MatRipple) ripple: MatRipple;

  constructor(
    elementRef: ElementRef,
    private _focusMonitor: FocusMonitor,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode: string,
  ) {
    super(elementRef);

    // For each of the variant selectors that is present in the button's host
    // attributes, add the correct corresponding class.
    for (const attr of BUTTON_HOST_ATTRIBUTES) {
      if (this._hasHostAttributes(attr)) {
        (this._getHostElement() as HTMLElement).classList.add(attr);
      }
    }

    // Add a class that applies to all buttons. This makes it easier to target if somebody
    // wants to target all Material buttons. We do it here rather than `host` to ensure that
    // the class is applied to derived classes.
    elementRef.nativeElement.classList.add('mat-button-base');

    if (this.isRoundButton) {
      this.color = DEFAULT_ROUND_BUTTON_COLOR;
    }
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._elementRef, true);
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /**
   * Focuses the button.
   *
   * 让此按钮获取焦点。
   *
   */
  focus(origin?: FocusOrigin, options?: FocusOptions): void {
    if (origin) {
      this._focusMonitor.focusVia(this._getHostElement(), origin, options);
    } else {
      this._getHostElement().focus(options);
    }
  }

  _getHostElement() {
    return this._elementRef.nativeElement;
  }

  _isRippleDisabled() {
    return this.disableRipple || this.disabled;
  }

  /**
   * Gets whether the button has one of the given attributes.
   *
   * 获取此按钮是否具有指定属性之一。
   *
   */
  _hasHostAttributes(...attributes: string[]) {
    return attributes.some(attribute => this._getHostElement().hasAttribute(attribute));
  }
}

/**
 * Material design anchor button.
 *
 * Material Design 锚定按钮。
 *
 */
@Component({
  selector: `a[mat-button], a[mat-raised-button], a[mat-icon-button], a[mat-fab],
             a[mat-mini-fab], a[mat-stroked-button], a[mat-flat-button]`,
  exportAs: 'matButton, matAnchor',
  host: {
    // Note that we ignore the user-specified tabindex when it's disabled for
    // consistency with the `mat-button` applied on native buttons where even
    // though they have an index, they're not tabbable.
    '[attr.tabindex]': 'disabled ? -1 : (tabIndex || 0)',
    '[attr.disabled]': 'disabled || null',
    '[attr.aria-disabled]': 'disabled.toString()',
    '(click)': '_haltDisabledEvents($event)',
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
    '[class.mat-button-disabled]': 'disabled',
    'class': 'mat-focus-indicator',
  },
  inputs: ['disabled', 'disableRipple', 'color'],
  templateUrl: 'button.html',
  styleUrls: ['button.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatAnchor extends MatButton {
  /**
   * Tabindex of the button.
   *
   * 此按钮的 Tabindex。
   *
   */
  @Input() tabIndex: number;

  constructor(
    focusMonitor: FocusMonitor,
    elementRef: ElementRef,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode: string,
  ) {
    super(elementRef, focusMonitor, animationMode);
  }

  _haltDisabledEvents(event: Event) {
    // A disabled button shouldn't apply any actions
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
