/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewEncapsulation,
  TemplateRef,
  AfterViewInit,
} from '@angular/core';
import {Subscription} from 'rxjs';
import {MatStepLabel} from './step-label';
import {MatStepperIntl} from './stepper-intl';
import {MatStepperIconContext} from './stepper-icon';
import {CdkStepHeader, StepState} from '@angular/cdk/stepper';
import {mixinColor, CanColor} from '@angular/material/core';
// Boilerplate for applying mixins to MatStepHeader.
/** @docs-private */
const _MatStepHeaderBase = mixinColor(
  class MatStepHeaderBase extends CdkStepHeader {
    constructor(elementRef: ElementRef) {
      super(elementRef);
    }
  },
  'primary',
);

@Component({
  selector: 'mat-step-header',
  templateUrl: 'step-header.html',
  styleUrls: ['step-header.css'],
  inputs: ['color'],
  host: {
    'class': 'mat-step-header',
    'role': 'tab',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatStepHeader
  extends _MatStepHeaderBase
  implements AfterViewInit, OnDestroy, CanColor
{
  private _intlSubscription: Subscription;

  /**
   * State of the given step.
   *
   * 指定步骤的状态
   *
   */
  @Input() state: StepState;

  /**
   * Label of the given step.
   *
   * 指定步骤的标签。
   *
   */
  @Input() label: MatStepLabel | string;

  /**
   * Error message to display when there's an error.
   *
   * 当出现错误时显示错误信息。
   *
   */
  @Input() errorMessage: string;

  /**
   * Overrides for the header icons, passed in via the stepper.
   *
   * 改写那些通过步进器传入的头部图标。
   *
   */
  @Input() iconOverrides: {[key: string]: TemplateRef<MatStepperIconContext>};

  /**
   * Index of the given step.
   *
   * 指定步骤的索引。
   *
   */
  @Input() index: number;

  /**
   * Whether the given step is selected.
   *
   * 指定的步骤是否已选定。
   *
   */
  @Input() selected: boolean;

  /**
   * Whether the given step label is active.
   *
   * 指定的步骤标签是否有效。
   *
   */
  @Input() active: boolean;

  /**
   * Whether the given step is optional.
   *
   * 指定的步骤是否可选。
   *
   */
  @Input() optional: boolean;

  /**
   * Whether the ripple should be disabled.
   *
   * 是否应该禁用涟漪。
   *
   */
  @Input() disableRipple: boolean;

  constructor(
    public _intl: MatStepperIntl,
    private _focusMonitor: FocusMonitor,
    _elementRef: ElementRef<HTMLElement>,
    changeDetectorRef: ChangeDetectorRef,
  ) {
    super(_elementRef);
    this._intlSubscription = _intl.changes.subscribe(() => changeDetectorRef.markForCheck());
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._elementRef, true);
  }

  ngOnDestroy() {
    this._intlSubscription.unsubscribe();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /**
   * Focuses the step header.
   *
   * 让步骤头获得焦点。
   *
   */
  override focus(origin?: FocusOrigin, options?: FocusOptions) {
    if (origin) {
      this._focusMonitor.focusVia(this._elementRef, origin, options);
    } else {
      this._elementRef.nativeElement.focus(options);
    }
  }

  /**
   * Returns string label of given step if it is a text label.
   *
   * 返回指定步骤的字符串标签（如果是文本标签）。
   *
   */
  _stringLabel(): string | null {
    return this.label instanceof MatStepLabel ? null : this.label;
  }

  /**
   * Returns MatStepLabel if the label of given step is a template label.
   *
   * 如果指定步骤的标签是模板标签，则返回 MatStepLabel。
   *
   */
  _templateLabel(): MatStepLabel | null {
    return this.label instanceof MatStepLabel ? this.label : null;
  }

  /**
   * Returns the host HTML element.
   *
   * 返回宿主的 HTML 元素。
   *
   */
  _getHostElement() {
    return this._elementRef.nativeElement;
  }

  /**
   * Template context variables that are exposed to the `matStepperIcon` instances.
   *
   * 暴露给 `matStepperIcon` 实例的模板上下文变量。
   *
   */
  _getIconContext(): MatStepperIconContext {
    return {
      index: this.index,
      active: this.active,
      optional: this.optional,
    };
  }

  _getDefaultTextForState(state: StepState): string {
    if (state == 'number') {
      return `${this.index + 1}`;
    }
    if (state == 'edit') {
      return 'create';
    }
    if (state == 'error') {
      return 'warning';
    }
    return state;
  }
}
