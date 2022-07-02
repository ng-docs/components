/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  forwardRef,
  Inject,
  InjectionToken,
  Optional,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import {
  MAT_RADIO_DEFAULT_OPTIONS,
  _MatRadioButtonBase,
  MatRadioDefaultOptions,
  _MatRadioGroupBase,
} from '@angular/material/radio';
import {FocusMonitor} from '@angular/cdk/a11y';
import {UniqueSelectionDispatcher} from '@angular/cdk/collections';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {NG_VALUE_ACCESSOR} from '@angular/forms';

// Re-export symbols used by the base Material radio component so that users do not need to depend
// on both packages.
export {MatRadioChange, MAT_RADIO_DEFAULT_OPTIONS} from '@angular/material/radio';

/**
 * Provider Expression that allows mat-radio-group to register as a ControlValueAccessor. This
 * allows it to support [(ngModel)] and ngControl.
 * @docs-private
 */
export const MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatRadioGroup),
  multi: true,
};

/**
 * Injection token that can be used to inject instances of `MatRadioGroup`. It serves as
 * alternative token to the actual `MatRadioGroup` class which could cause unnecessary
 * retention of the class and its component metadata.
 *
 * 这个注入令牌可以用来注入 `MatRadioGroup` 实例。它可以作为实际 `MatRadioGroup` 类的备用令牌，如果使用真实类可能导致此类及其组件元数据无法优化掉。
 *
 */
export const MAT_RADIO_GROUP = new InjectionToken<_MatRadioGroupBase<_MatRadioButtonBase>>(
  'MatRadioGroup',
);

/**
 * A group of radio buttons. May contain one or more `<mat-radio-button>` elements.
 *
 * 一组单选按钮。可以包含一个或多个 `<mat-radio-button>` 元素。
 *
 */
@Directive({
  selector: 'mat-radio-group',
  exportAs: 'matRadioGroup',
  providers: [
    MAT_RADIO_GROUP_CONTROL_VALUE_ACCESSOR,
    {provide: MAT_RADIO_GROUP, useExisting: MatRadioGroup},
  ],
  host: {
    'role': 'radiogroup',
    'class': 'mat-mdc-radio-group',
  },
})
export class MatRadioGroup extends _MatRadioGroupBase<MatRadioButton> {
  /** Child radio buttons. */
  @ContentChildren(forwardRef(() => MatRadioButton), {descendants: true})
  _radios: QueryList<MatRadioButton>;
}

@Component({
  selector: 'mat-radio-button',
  templateUrl: 'radio.html',
  styleUrls: ['radio.css'],
  host: {
    'class': 'mat-mdc-radio-button',
    '[attr.id]': 'id',
    '[class.mat-primary]': 'color === "primary"',
    '[class.mat-accent]': 'color === "accent"',
    '[class.mat-warn]': 'color === "warn"',
    '[class.mat-mdc-radio-checked]': 'checked',
    '[class._mat-animation-noopable]': '_noopAnimations',
    // Needs to be removed since it causes some a11y issues (see #21266).
    '[attr.tabindex]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    // Note: under normal conditions focus shouldn't land on this element, however it may be
    // programmatically set, for example inside of a focus trap, in this case we want to forward
    // the focus to the native element.
    '(focus)': '_inputElement.nativeElement.focus()',
  },
  inputs: ['disableRipple', 'tabIndex'],
  exportAs: 'matRadioButton',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatRadioButton extends _MatRadioButtonBase {
  constructor(
    @Optional() @Inject(MAT_RADIO_GROUP) radioGroup: MatRadioGroup,
    elementRef: ElementRef,
    _changeDetector: ChangeDetectorRef,
    _focusMonitor: FocusMonitor,
    _radioDispatcher: UniqueSelectionDispatcher,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
    @Optional()
    @Inject(MAT_RADIO_DEFAULT_OPTIONS)
    _providerOverride?: MatRadioDefaultOptions,
    @Attribute('tabindex') tabIndex?: string,
  ) {
    super(
      radioGroup,
      elementRef,
      _changeDetector,
      _focusMonitor,
      _radioDispatcher,
      animationMode,
      _providerOverride,
      tabIndex,
    );
  }
}
