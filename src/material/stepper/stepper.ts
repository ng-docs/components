/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {
  CdkStep,
  CdkStepper,
  StepContentPositionState,
  STEPPER_GLOBAL_OPTIONS,
  StepperOptions,
} from '@angular/cdk/stepper';
import {AnimationEvent} from '@angular/animations';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  TemplateRef,
  ViewChildren,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {AbstractControl, FormGroupDirective, NgForm} from '@angular/forms';
import {ErrorStateMatcher, ThemePalette} from '@angular/material/core';
import {TemplatePortal} from '@angular/cdk/portal';
import {Subject, Subscription} from 'rxjs';
import {takeUntil, distinctUntilChanged, map, startWith, switchMap} from 'rxjs/operators';

import {MatStepHeader} from './step-header';
import {MatStepLabel} from './step-label';
import {
  DEFAULT_HORIZONTAL_ANIMATION_DURATION,
  DEFAULT_VERTICAL_ANIMATION_DURATION,
  matStepperAnimations,
} from './stepper-animations';
import {MatStepperIcon, MatStepperIconContext} from './stepper-icon';
import {MatStepContent} from './step-content';

@Component({
  selector: 'mat-step',
  templateUrl: 'step.html',
  providers: [
    {provide: ErrorStateMatcher, useExisting: MatStep},
    {provide: CdkStep, useExisting: MatStep},
  ],
  encapsulation: ViewEncapsulation.None,
  exportAs: 'matStep',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatStep extends CdkStep implements ErrorStateMatcher, AfterContentInit, OnDestroy {
  private _isSelected = Subscription.EMPTY;

  /**
   * Content for step label given by `<ng-template matStepLabel>`.
   *
   * 步骤标签的内容，由 `<ng-template matStepLabel>` 提供。
   *
   */
  // We need an initializer here to avoid a TS error.
  @ContentChild(MatStepLabel) override stepLabel: MatStepLabel = undefined!;

  /**
   * Theme color for the particular step.
   *
   * 特定步骤的主题颜色。
   *
   */
  @Input() color: ThemePalette;

  /**
   * Content that will be rendered lazily.
   *
   * 要延迟渲染的内容。
   *
   */
  @ContentChild(MatStepContent, {static: false}) _lazyContent: MatStepContent;

  /**
   * Currently-attached portal containing the lazy content.
   *
   * 当前附着到的传送点，其中包含惰性渲染的内容。
   *
   */
  _portal: TemplatePortal;

  constructor(
    @Inject(forwardRef(() => MatStepper)) stepper: MatStepper,
    @SkipSelf() private _errorStateMatcher: ErrorStateMatcher,
    private _viewContainerRef: ViewContainerRef,
    @Optional() @Inject(STEPPER_GLOBAL_OPTIONS) stepperOptions?: StepperOptions,
  ) {
    super(stepper, stepperOptions);
  }

  ngAfterContentInit() {
    this._isSelected = this._stepper.steps.changes
      .pipe(
        switchMap(() => {
          return this._stepper.selectionChange.pipe(
            map(event => event.selectedStep === this),
            startWith(this._stepper.selected === this),
          );
        }),
      )
      .subscribe(isSelected => {
        if (isSelected && this._lazyContent && !this._portal) {
          this._portal = new TemplatePortal(this._lazyContent._template, this._viewContainerRef!);
        }
      });
  }

  ngOnDestroy() {
    this._isSelected.unsubscribe();
  }

  /**
   * Custom error state matcher that additionally checks for validity of interacted form.
   *
   * 自定义错误状态匹配器，它还要检查交互式表单的有效性。
   *
   */
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const originalErrorState = this._errorStateMatcher.isErrorState(control, form);

    // Custom error state checks for the validity of form that is not submitted or touched
    // since user can trigger a form change by calling for another step without directly
    // interacting with the current form.
    const customErrorState = !!(control && control.invalid && this.interacted);

    return originalErrorState || customErrorState;
  }
}

@Component({
  selector: 'mat-stepper, mat-vertical-stepper, mat-horizontal-stepper, [matStepper]',
  exportAs: 'matStepper, matVerticalStepper, matHorizontalStepper',
  templateUrl: 'stepper.html',
  styleUrls: ['stepper.css'],
  inputs: ['selectedIndex'],
  host: {
    '[class.mat-stepper-horizontal]': 'orientation === "horizontal"',
    '[class.mat-stepper-vertical]': 'orientation === "vertical"',
    '[class.mat-stepper-label-position-end]':
      'orientation === "horizontal" && labelPosition == "end"',
    '[class.mat-stepper-label-position-bottom]':
      'orientation === "horizontal" && labelPosition == "bottom"',
    '[class.mat-stepper-header-position-bottom]': 'headerPosition === "bottom"',
    '[attr.aria-orientation]': 'orientation',
    'role': 'tablist',
    'ngSkipHydration': '',
  },
  animations: [
    matStepperAnimations.horizontalStepTransition,
    matStepperAnimations.verticalStepTransition,
  ],
  providers: [{provide: CdkStepper, useExisting: MatStepper}],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatStepper extends CdkStepper implements AfterContentInit {
  /**
   * The list of step headers of the steps in the stepper.
   *
   * 步进器中各步骤的步骤头列表。
   *
   */
  // We need an initializer here to avoid a TS error.
  @ViewChildren(MatStepHeader) override _stepHeader: QueryList<MatStepHeader> =
    undefined as unknown as QueryList<MatStepHeader>;

  /**
   * Full list of steps inside the stepper, including inside nested steppers.
   *
   * 步进器里面的完整步骤列表，也包括嵌套的步进器内部的步骤。
   *
   */
  // We need an initializer here to avoid a TS error.
  @ContentChildren(MatStep, {descendants: true}) override _steps: QueryList<MatStep> =
    undefined as unknown as QueryList<MatStep>;

  /**
   * Steps that belong to the current stepper, excluding ones from nested steppers.
   *
   * 属于当前步进器的步骤（不包括那些来自嵌套步进器的步骤）。
   *
   */
  override readonly steps: QueryList<MatStep> = new QueryList<MatStep>();

  /**
   * Custom icon overrides passed in by the consumer.
   *
   * 消费者传入的自定义改写图标。
   *
   */
  @ContentChildren(MatStepperIcon, {descendants: true}) _icons: QueryList<MatStepperIcon>;

  /**
   * Event emitted when the current step is done transitioning in.
   *
   * 转换到当前步骤完毕后发出的事件。
   *
   */
  @Output() readonly animationDone: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Whether ripples should be disabled for the step headers.
   *
   * 是否应为步骤头禁用涟漪。
   *
   */
  @Input() disableRipple: boolean;

  /**
   * Theme color for all of the steps in stepper.
   *
   * 步进器中所有步骤的主题颜色。
   *
   */
  @Input() color: ThemePalette;

  /**
   * Whether the label should display in bottom or end position.
   * Only applies in the `horizontal` orientation.
   *
   * 标签应显示在底部还是尾部位置。仅适用于 `horizontal` 方向。
   *
   */
  @Input()
  labelPosition: 'bottom' | 'end' = 'end';

  /**
   * Position of the stepper's header.
   * Only applies in the `horizontal` orientation.
   *
   * 步进器标头的位置。仅适用于 `horizontal` 方向。
   *
   */
  @Input()
  headerPosition: 'top' | 'bottom' = 'top';

  /**
   * Consumer-specified template-refs to be used to override the header icons.
   *
   * 消费者指定的模板引用，用于覆盖标题图标。
   *
   */
  _iconOverrides: Record<string, TemplateRef<MatStepperIconContext>> = {};

  /**
   * Stream of animation `done` events when the body expands/collapses.
   *
   * 当步骤体展开/折叠时，动画的 `done` 事件流。
   *
   */
  readonly _animationDone = new Subject<AnimationEvent>();

  /**
   * Duration for the animation. Will be normalized to milliseconds if no units are set.
   *
   * 动画的持续时间。如果没有设置单位，将标准化为毫秒。
   *
   */
  @Input()
  get animationDuration(): string {
    return this._animationDuration;
  }
  set animationDuration(value: string) {
    this._animationDuration = /^\d+$/.test(value) ? value + 'ms' : value;
  }
  private _animationDuration = '';

  constructor(
    @Optional() dir: Directionality,
    changeDetectorRef: ChangeDetectorRef,
    elementRef: ElementRef<HTMLElement>,
  ) {
    super(dir, changeDetectorRef, elementRef);
    const nodeName = elementRef.nativeElement.nodeName.toLowerCase();
    this.orientation = nodeName === 'mat-vertical-stepper' ? 'vertical' : 'horizontal';
  }

  override ngAfterContentInit() {
    super.ngAfterContentInit();
    this._icons.forEach(({name, templateRef}) => (this._iconOverrides[name] = templateRef));

    // Mark the component for change detection whenever the content children query changes
    this.steps.changes.pipe(takeUntil(this._destroyed)).subscribe(() => {
      this._stateChanged();
    });

    this._animationDone
      .pipe(
        // This needs a `distinctUntilChanged` in order to avoid emitting the same event twice due
        // to a bug in animations where the `.done` callback gets invoked twice on some browsers.
        // See https://github.com/angular/angular/issues/24084
        distinctUntilChanged((x, y) => x.fromState === y.fromState && x.toState === y.toState),
        takeUntil(this._destroyed),
      )
      .subscribe(event => {
        if ((event.toState as StepContentPositionState) === 'current') {
          this.animationDone.emit();
        }
      });
  }

  _stepIsNavigable(index: number, step: MatStep): boolean {
    return step.completed || this.selectedIndex === index || !this.linear;
  }

  _getAnimationDuration() {
    if (this.animationDuration) {
      return this.animationDuration;
    }

    return this.orientation === 'horizontal'
      ? DEFAULT_HORIZONTAL_ANIMATION_DURATION
      : DEFAULT_VERTICAL_ANIMATION_DURATION;
  }
}
