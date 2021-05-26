/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FormControl, FormGroupDirective, NgControl, NgForm} from '@angular/forms';
import {Subject} from 'rxjs';
import {ErrorStateMatcher} from '../error/error-options';
import {AbstractConstructor, Constructor} from './constructor';

/** @docs-private */
export interface CanUpdateErrorState {
  updateErrorState(): void;
  readonly stateChanges: Subject<void>;
  errorState: boolean;
  errorStateMatcher: ErrorStateMatcher;
}

/** @docs-private */
export type CanUpdateErrorStateCtor = Constructor<CanUpdateErrorState> &
                                      AbstractConstructor<CanUpdateErrorState>;

/** @docs-private */
export interface HasErrorState {
  _parentFormGroup: FormGroupDirective;
  _parentForm: NgForm;
  _defaultErrorStateMatcher: ErrorStateMatcher;
  ngControl: NgControl;
}

/**
 * Mixin to augment a directive with updateErrorState method.
 * For component with `errorState` and need to update `errorState`.
 *
 * 混入 updateErrorState 方法，以扩展指令。对于具有 `errorState` 组件，需要更新其 `errorState`。
 *
 */
export function mixinErrorState<T extends AbstractConstructor<HasErrorState>>(base: T):
  CanUpdateErrorStateCtor & T;
export function mixinErrorState<T extends Constructor<HasErrorState>>(base: T):
  CanUpdateErrorStateCtor & T {
  return class extends base {
    /**
     * Whether the component is in an error state.
     *
     * 组件是否处于错误状态。
     *
     */
    errorState: boolean = false;

    /**
     * Stream that emits whenever the state of the input changes such that the wrapping
     * `MatFormField` needs to run change detection.
     *
     * 每当输入的状态发生更改时发出的流，这样包装的 `MatFormField` 需要运行变更检测。
     *
     */
    readonly stateChanges = new Subject<void>();

    errorStateMatcher: ErrorStateMatcher;

    updateErrorState() {
      const oldState = this.errorState;
      const parent = this._parentFormGroup || this._parentForm;
      const matcher = this.errorStateMatcher || this._defaultErrorStateMatcher;
      const control = this.ngControl ? this.ngControl.control as FormControl : null;
      const newState = matcher.isErrorState(control, parent);

      if (newState !== oldState) {
        this.errorState = newState;
        this.stateChanges.next();
      }
    }

    constructor(...args: any[]) {
      super(...args);
    }
  };
}
