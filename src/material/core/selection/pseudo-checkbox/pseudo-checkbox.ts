/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Component,
  ViewEncapsulation,
  Input,
  ChangeDetectionStrategy,
  Inject,
  Optional,
} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Possible states for a pseudo checkbox.
 *
 * 伪复选框的可能状态。
 *
 * @docs-private
 */
export type MatPseudoCheckboxState = 'unchecked' | 'checked' | 'indeterminate';

/**
 * Component that shows a simplified checkbox without including any kind of "real" checkbox.
 * Meant to be used when the checkbox is purely decorative and a large number of them will be
 * included, such as for the options in a multi-select. Uses no SVGs or complex animations.
 * Note that theming is meant to be handled by the parent element, e.g.
 * `mat-primary .mat-pseudo-checkbox`.
 *
 * 显示简化复选框而不包含任何“真实”复选框的组件。当复选框仅是装饰性的并且包含大量复选框时（例如，用于多选中的选项），将使用该方法。不使用 SVG 或复杂的动画。请注意，主题化应由父元素处理，例如 `mat-primary .mat-pseudo-checkbox`。
 *
 * Note that this component will be completely invisible to screen-reader users. This is *not*
 * interchangeable with `<mat-checkbox>` and should *not* be used if the user would directly
 * interact with the checkbox. The pseudo-checkbox should only be used as an implementation detail
 * of more complex components that appropriately handle selected / checked state.
 *
 * 请注意，此组件对于屏幕阅读器用户完全不可见。这*不能*和 `<mat-checkbox>` 互换，并且如果用户将直接与复选框交互则*不*应当使用它。伪复选框只应该用作需要适当处理选定/检查状态的更复杂组件中的实现细节。
 *
 * @docs-private
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'mat-pseudo-checkbox',
  styleUrls: ['pseudo-checkbox.css'],
  template: '',
  host: {
    'class': 'mat-pseudo-checkbox',
    '[class.mat-pseudo-checkbox-indeterminate]': 'state === "indeterminate"',
    '[class.mat-pseudo-checkbox-checked]': 'state === "checked"',
    '[class.mat-pseudo-checkbox-disabled]': 'disabled',
    '[class.mat-pseudo-checkbox-minimal]': 'appearance === "minimal"',
    '[class.mat-pseudo-checkbox-full]': 'appearance === "full"',
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
  },
})
export class MatPseudoCheckbox {
  /**
   * Display state of the checkbox.
   *
   * 复选框的显示状态。
   *
   */
  @Input() state: MatPseudoCheckboxState = 'unchecked';

  /**
   * Whether the checkbox is disabled.
   *
   * 该复选框是否已禁用。
   *
   */
  @Input() disabled: boolean = false;

  /**
   * Appearance of the pseudo checkbox. Default appearance of 'full' renders a checkmark/mixedmark
   * indicator inside a square box. 'minimal' appearance only renders the checkmark/mixedmark.
   */
  @Input() appearance: 'minimal' | 'full' = 'full';

  constructor(@Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string) {}
}
