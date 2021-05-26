/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Observable} from 'rxjs';
import {NgControl} from '@angular/forms';
import {Directive} from '@angular/core';

/**
 * An interface which allows a control to work inside of a `MatFormField`.
 *
 * 本接口允许控件工作在 `MatFormField` 中。
 *
 */
@Directive()
export abstract class MatFormFieldControl<T> {
  /**
   * The value of the control.
   *
   * 控件的值。
   *
   */
  value: T | null;

  /**
   * Stream that emits whenever the state of the control changes such that the parent `MatFormField`
   * needs to run change detection.
   *
   * 每当控件的状态发生变化时就会发出的流，这样一来父 `MatFormField` 就要运行变更检测。
   *
   */
  readonly stateChanges: Observable<void>;

  /**
   * The element ID for this control.
   *
   * 这个控件的元素 ID。
   *
   */
  readonly id: string;

  /**
   * The placeholder for this control.
   *
   * 该控件的占位符。
   *
   */
  readonly placeholder: string;

  /**
   * Gets the NgControl for this control.
   *
   * 获取这个控件的 NgControl。
   *
   */
  readonly ngControl: NgControl | null;

  /**
   * Whether the control is focused.
   *
   * 控件是否有焦点
   *
   */
  readonly focused: boolean;

  /**
   * Whether the control is empty.
   *
   * 控件是否为空。
   *
   */
  readonly empty: boolean;

  /**
   * Whether the `MatFormField` label should try to float.
   *
   * `MatFormField` 标签是否应该尝试浮动。
   *
   */
  readonly shouldLabelFloat: boolean;

  /**
   * Whether the control is required.
   *
   * 控件是否必填的。
   *
   */
  readonly required: boolean;

  /**
   * Whether the control is disabled.
   *
   * 该控件是否已禁用。
   *
   */
  readonly disabled: boolean;

  /**
   * Whether the control is in an error state.
   *
   * 控件是否处于错误状态。
   *
   */
  readonly errorState: boolean;

  /**
   * An optional name for the control type that can be used to distinguish `mat-form-field` elements
   * based on their control type. The form field will add a class,
   * `mat-form-field-type-{{controlType}}` to its root element.
   *
   * 控件类型的可选名称，可以根据控件类型来区分 `mat-form-field` 元素。表单字段会在其根元素中添加形如 `mat-form-field-type-{{controlType}}` 的类。
   *
   */
  readonly controlType?: string;

  /**
   * Whether the input is currently in an autofilled state. If property is not present on the
   * control it is assumed to be false.
   *
   * 本输入框当前是否处于自动填充状态。如果控件上没有此属性，则认为它是 false。
   *
   */
  readonly autofilled?: boolean;

  /**
   * Value of `aria-describedby` that should be merged with the described-by ids
   * which are set by the form-field.
   *
   * `aria-describedby` 的值应该和由 form-field 所设置的各个 described-by id 合并。
   *
   */
  readonly userAriaDescribedBy?: string;

  /**
   * Sets the list of element IDs that currently describe this control.
   *
   * 设置当前描述该控件的元素 ID 列表。
   *
   */
  abstract setDescribedByIds(ids: string[]): void;

  /**
   * Handles a click on the control's container.
   *
   * 处理此控件的容器上的点击事件。
   *
   */
  abstract onContainerClick(event: MouseEvent): void;
}
