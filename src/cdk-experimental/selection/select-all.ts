/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, Inject, OnDestroy, OnInit, Optional, Self} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Observable, of as observableOf, Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

import {CdkSelection} from './selection';

/**
 * Makes the element a select-all toggle.
 *
 * 使此元素成为全选开关。
 *
 * Must be used within a parent `CdkSelection` directive. It toggles the selection states
 * of all the selection toggles connected with the `CdkSelection` directive.
 * If the element implements `ControlValueAccessor`, e.g. `MatCheckbox`, the directive
 * automatically connects it with the select-all state provided by the `CdkSelection` directive. If
 * not, use `checked$` to get the checked state, `indeterminate$` to get the indeterminate state,
 * and `toggle()` to change the selection state.
 *
 * 必须在父 `CdkSelection` 指令中使用。它会切换与 `CdkSelection` 指令连接的所有选择开关的选定状态。如果该元素实现了 `ControlValueAccessor` ，例如 `MatCheckbox` ，指令会自动将它与 `CdkSelection` 指令提供的全选状态连接起来。如果未实现，则使用 `checked$` 获取选定状态，使用 `indeterminate$` 获取不确定状态，并使用 `toggle()` 更改选定状态。
 *
 */
@Directive({
  selector: '[cdkSelectAll]',
  exportAs: 'cdkSelectAll',
})
export class CdkSelectAll<T> implements OnDestroy, OnInit {
  /**
   * The checked state of the toggle.
   * Resolves to `true` if all the values are selected, `false` if no value is selected.
   *
   * 开关的选定状态。如果选定了所有值，则解析为 `true` ，如果未选定任何值，则解析为 `false` 。
   *
   */
  readonly checked: Observable<boolean> = this._selection.change.pipe(
    switchMap(() => observableOf(this._selection.isAllSelected())),
  );

  /**
   * The indeterminate state of the toggle.
   * Resolves to `true` if part (not all) of the values are selected, `false` if all values or no
   * value at all are selected.
   *
   * 开关的不确定状态。如果选定了部分值（而不是全部），则解析为 `true` ；如果选定了所有值或根本未选定任何值，则解析为 `false` 。
   *
   */
  readonly indeterminate: Observable<boolean> = this._selection.change.pipe(
    switchMap(() => observableOf(this._selection.isPartialSelected())),
  );

  /**
   * Toggles the select-all state.
   *
   * 切换全选状态。
   *
   * @param event The click event if the toggle is triggered by a (mouse or keyboard) click. If
   *     using with a native `<input type="checkbox">`, the parameter is required for the
   *     indeterminate state to work properly.
   *
   * 如果切换是由（鼠标或键盘）点击触发的，则为那次点击事件。如果与原生 `<input type="checkbox">` 一起使用，则其未决状态需要此参数才能正常工作。
   *
   */
  toggle(event?: MouseEvent) {
    // This is needed when applying the directive on a native <input type="checkbox">
    // checkbox. The default behavior needs to be prevented in order to support the indeterminate
    // state. The timeout is also needed so the checkbox can show the latest state.
    if (event) {
      event.preventDefault();
    }

    setTimeout(() => {
      this._selection.toggleSelectAll();
    });
  }

  private readonly _destroyed = new Subject<void>();

  constructor(
    @Optional() @Inject(CdkSelection) private readonly _selection: CdkSelection<T>,
    @Optional()
    @Self()
    @Inject(NG_VALUE_ACCESSOR)
    private readonly _controlValueAccessor: ControlValueAccessor[],
  ) {}

  ngOnInit() {
    this._assertValidParentSelection();
    this._configureControlValueAccessor();
  }

  private _configureControlValueAccessor() {
    if (this._controlValueAccessor && this._controlValueAccessor.length) {
      this._controlValueAccessor[0].registerOnChange((e: unknown) => {
        if (e === true || e === false) {
          this.toggle();
        }
      });
      this.checked.pipe(takeUntil(this._destroyed)).subscribe(state => {
        this._controlValueAccessor[0].writeValue(state);
      });
    }
  }

  private _assertValidParentSelection() {
    if (!this._selection && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('CdkSelectAll: missing CdkSelection in the parent');
    }

    if (!this._selection.multiple && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('CdkSelectAll: CdkSelection must have cdkSelectionMultiple set to true');
    }
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }
}
