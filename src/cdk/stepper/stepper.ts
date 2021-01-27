/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusableOption, FocusKeyManager} from '@angular/cdk/a11y';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput
} from '@angular/cdk/coercion';
import {ENTER, hasModifierKey, SPACE} from '@angular/cdk/keycodes';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  AfterContentInit,
} from '@angular/core';
import {Observable, of as observableOf, Subject} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';

import {CdkStepHeader} from './step-header';
import {CdkStepLabel} from './step-label';

/**
 * Used to generate unique ID for each stepper component.
 *
 * 用于为每个步进器组件生成唯一的 ID。
 *
 */
let nextId = 0;

/**
 * Position state of the content of each step in stepper that is used for transitioning
 * the content into correct position upon step selection change.
 *
 * 步进器中每个步骤内容的位置状态，用于在选定的步骤改变时将内容转移到正确的位置。
 *
 */
export type StepContentPositionState = 'previous'|'current'|'next';

/**
 * Possible orientation of a stepper.
 *
 * 步进器可能的方向。
 *
 */
export type StepperOrientation = 'horizontal'|'vertical';

/**
 * Change event emitted on selection changes.
 *
 * 在选定值变化时发出的变更事件。
 *
 */
export class StepperSelectionEvent {
  /**
   * Index of the step now selected.
   *
   * 当前步骤的索引。
   *
   */
  selectedIndex: number;

  /**
   * Index of the step previously selected.
   *
   * 前一个步骤的索引。
   *
   */
  previouslySelectedIndex: number;

  /**
   * The step instance now selected.
   *
   * 此步骤的实例已被选定。
   *
   */
  selectedStep: CdkStep;

  /**
   * The step instance previously selected.
   *
   * 以前选定的步骤实例。
   *
   */
  previouslySelectedStep: CdkStep;
}

/**
 * The state of each step.
 *
 * 每一步的状态。
 *
 */
export type StepState = 'number'|'edit'|'done'|'error'|string;

/**
 * Enum to represent the different states of the steps.
 *
 * 枚举表示步骤的不同状态。
 *
 */
export const STEP_STATE = {
  NUMBER: 'number',
  EDIT: 'edit',
  DONE: 'done',
  ERROR: 'error'
};

/**
 * InjectionToken that can be used to specify the global stepper options.
 *
 * 这个注入令牌可以用来指定全局的步进器选项。
 *
 */
export const STEPPER_GLOBAL_OPTIONS = new InjectionToken<StepperOptions>('STEPPER_GLOBAL_OPTIONS');

/**
 * InjectionToken that can be used to specify the global stepper options.
 *
 * 这个注入令牌可以用来指定全局的步进器选项。
 *
 * @deprecated Use `STEPPER_GLOBAL_OPTIONS` instead.
 *
 * 请改用 `STEPPER_GLOBAL_OPTIONS` 。
 *
 * @breaking-change 8.0.0.
 *
 * 8.0.0
 *
 */
export const MAT_STEPPER_GLOBAL_OPTIONS = STEPPER_GLOBAL_OPTIONS;

/**
 * Configurable options for stepper.
 *
 * 步进器的可配置选项。
 *
 */
export interface StepperOptions {
  /**
   * Whether the stepper should display an error state or not.
   * Default behavior is assumed to be false.
   *
   * 步进器是否应该显示错误状态。假定默认行为是 false。
   *
   */
  showError?: boolean;

  /**
   * Whether the stepper should display the default indicator type
   * or not.
   * Default behavior is assumed to be true.
   *
   * 步进器是否应该显示默认的指示器类型。假设默认行为是 true。
   *
   */
  displayDefaultIndicatorType?: boolean;
}

@Component({
  selector: 'cdk-step',
  exportAs: 'cdkStep',
  template: '<ng-template><ng-content></ng-content></ng-template>',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CdkStep implements OnChanges {
  private _stepperOptions: StepperOptions;
  _showError: boolean;
  _displayDefaultIndicatorType: boolean;

  /**
   * Template for step label if it exists.
   *
   * 步进器标签的模板（如果存在）。
   *
   */
  @ContentChild(CdkStepLabel) stepLabel: CdkStepLabel;

  /**
   * Template for step content.
   *
   * 步骤内容的模板。
   *
   */
  @ViewChild(TemplateRef, {static: true}) content: TemplateRef<any>;

  /**
   * The top level abstract control of the step.
   *
   * 该步骤的顶级抽象控件。
   *
   */
  @Input() stepControl: AbstractControlLike;

  /**
   * Whether user has seen the expanded step content or not.
   *
   * 用户是否看过展开后的步骤内容。
   *
   */
  interacted = false;

  /**
   * Plain text label of the step.
   *
   * 该步骤的纯文本标签。
   *
   */
  @Input() label: string;

  /**
   * Error message to display when there's an error.
   *
   * 当出现错误时显示的错误信息。
   *
   */
  @Input() errorMessage: string;

  /**
   * Aria label for the tab.
   *
   * 选项卡的 Aria 标签。
   *
   */
  @Input('aria-label') ariaLabel: string;

  /**
   * Reference to the element that the tab is labelled by.
   * Will be cleared if `aria-label` is set at the same time.
   *
   * 到用来标注此选项卡的元素的引用。如果同时设置了 `aria-label`，则被清除。
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string;

  /**
   * State of the step.
   *
   * 步骤的状态。
   *
   */
  @Input() state: StepState;

  /**
   * Whether the user can return to this step once it has been marked as completed.
   *
   * 一旦标记为已完成，用户是否可以返回此步骤。
   *
   */
  @Input()
  get editable(): boolean {
    return this._editable;
  }
  set editable(value: boolean) {
    this._editable = coerceBooleanProperty(value);
  }
  private _editable = true;

  /**
   * Whether the completion of step is optional.
   *
   * 是否可以不必完成此步骤。
   *
   */
  @Input()
  get optional(): boolean {
    return this._optional;
  }
  set optional(value: boolean) {
    this._optional = coerceBooleanProperty(value);
  }
  private _optional = false;

  /**
   * Whether step is marked as completed.
   *
   * 步骤是否标记为已完成。
   *
   */
  @Input()
  get completed(): boolean {
    return this._completedOverride == null ? this._getDefaultCompleted() : this._completedOverride;
  }
  set completed(value: boolean) {
    this._completedOverride = coerceBooleanProperty(value);
  }
  _completedOverride: boolean|null = null;

  private _getDefaultCompleted() {
    return this.stepControl ? this.stepControl.valid && this.interacted : this.interacted;
  }

  /**
   * Whether step has an error.
   *
   * 步骤是否有错误。
   *
   */
  @Input()
  get hasError(): boolean {
    return this._customError == null ? this._getDefaultError() : this._customError;
  }
  set hasError(value: boolean) {
    this._customError = coerceBooleanProperty(value);
  }
  private _customError: boolean|null = null;

  private _getDefaultError() {
    return this.stepControl && this.stepControl.invalid && this.interacted;
  }

  /**
   *
   * @breaking-change 8.0.0 remove the `?` after `stepperOptions`
   *
   * 8.0.0 删除 `stepperOptions` 后的 `?`
   *
   */
  constructor(
      @Inject(forwardRef(() => CdkStepper)) public _stepper: CdkStepper,
      @Optional() @Inject(STEPPER_GLOBAL_OPTIONS) stepperOptions?: StepperOptions) {
    this._stepperOptions = stepperOptions ? stepperOptions : {};
    this._displayDefaultIndicatorType = this._stepperOptions.displayDefaultIndicatorType !== false;
    this._showError = !!this._stepperOptions.showError;
  }

  /**
   * Selects this step component.
   *
   * 选择此步骤组件。
   *
   */
  select(): void {
    this._stepper.selected = this;
  }

  /**
   * Resets the step to its initial state. Note that this includes resetting form data.
   *
   * 把步骤重置为初始状态。请注意，这也包括重置表单数据。
   *
   */
  reset(): void {
    this.interacted = false;

    if (this._completedOverride != null) {
      this._completedOverride = false;
    }

    if (this._customError != null) {
      this._customError = false;
    }

    if (this.stepControl) {
      this.stepControl.reset();
    }
  }

  ngOnChanges() {
    // Since basically all inputs of the MatStep get proxied through the view down to the
    // underlying MatStepHeader, we have to make sure that change detection runs correctly.
    this._stepper._stateChanged();
  }

  static ngAcceptInputType_editable: BooleanInput;
  static ngAcceptInputType_hasError: BooleanInput;
  static ngAcceptInputType_optional: BooleanInput;
  static ngAcceptInputType_completed: BooleanInput;
}

@Directive({
  selector: '[cdkStepper]',
  exportAs: 'cdkStepper',
})
export class CdkStepper implements AfterContentInit, AfterViewInit, OnDestroy {
  /**
   * Emits when the component is destroyed.
   *
   * 当组件被销毁时会触发。
   *
   */
  protected _destroyed = new Subject<void>();

  /**
   * Used for managing keyboard focus.
   *
   * 用于管理键盘焦点。
   *
   */
  private _keyManager: FocusKeyManager<FocusableOption>;

  /**
   *
   * @breaking-change 8.0.0 Remove `| undefined` once the `_document`
   * constructor param is required.
   *
   * 8.0.0 删除 `| undefined` 构造函数中的 `_document` 参数是必要的。
   *
   */
  private _document: Document|undefined;

  /**
   * Full list of steps inside the stepper, including inside nested steppers.
   *
   * 步进器里面的完整步骤列表，也包括嵌套步进器中的那些。
   *
   */
  @ContentChildren(CdkStep, {descendants: true}) _steps: QueryList<CdkStep>;

  /**
   * Steps that belong to the current stepper, excluding ones from nested steppers.
   *
   * 属于当前步进器的步骤（不包括那些来自嵌套步进器中的步骤）。
   *
   */
  readonly steps: QueryList<CdkStep> = new QueryList<CdkStep>();

  /**
   * The list of step headers of the steps in the stepper.
   *
   * 步进器中各步骤的步骤头列表。
   *
   * @deprecated Type to be changed to `QueryList<CdkStepHeader>`.
   *
   * 输入属性要改为 `QueryList<CdkStepHeader>` 。
   *
   * @breaking-change 8.0.0
   *
   */
  @ContentChildren(CdkStepHeader, {descendants: true}) _stepHeader: QueryList<FocusableOption>;

  /**
   * Whether the validity of previous steps should be checked or not.
   *
   * 是否检查前一个步骤的有效性。
   *
   */
  @Input()
  get linear(): boolean {
    return this._linear;
  }
  set linear(value: boolean) {
    this._linear = coerceBooleanProperty(value);
  }
  private _linear = false;

  /**
   * The index of the selected step.
   *
   * 选定步骤的索引。
   *
   */
  @Input()
  get selectedIndex() {
    return this._selectedIndex;
  }
  set selectedIndex(index: number) {
    const newIndex = coerceNumberProperty(index);

    if (this.steps && this._steps) {
      // Ensure that the index can't be out of bounds.
      if (!this._isValidIndex(index) && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error('cdkStepper: Cannot assign out-of-bounds value to `selectedIndex`.');
      }

      if (this._selectedIndex !== newIndex && !this._anyControlsInvalidOrPending(newIndex) &&
          (newIndex >= this._selectedIndex || this.steps.toArray()[newIndex].editable)) {
        this._updateSelectedItemIndex(index);
      }
    } else {
      this._selectedIndex = newIndex;
    }
  }
  private _selectedIndex = 0;

  /**
   * The step that is selected.
   *
   * 选定的步骤
   *
   */
  @Input()
  get selected(): CdkStep {
    // @breaking-change 8.0.0 Change return type to `CdkStep | undefined`.
    return this.steps ? this.steps.toArray()[this.selectedIndex] : undefined!;
  }
  set selected(step: CdkStep) {
    this.selectedIndex = this.steps ? this.steps.toArray().indexOf(step) : -1;
  }

  /**
   * Event emitted when the selected step has changed.
   *
   * 选定的步骤发生变化时发出的事件。
   *
   */
  @Output()
  selectionChange: EventEmitter<StepperSelectionEvent> = new EventEmitter<StepperSelectionEvent>();

  /**
   * Used to track unique ID for each stepper component.
   *
   * 用于跟踪每个步进器组件的唯一 ID。
   *
   */
  _groupId: number;

  protected _orientation: StepperOrientation = 'horizontal';

  constructor(
      @Optional() private _dir: Directionality, private _changeDetectorRef: ChangeDetectorRef,
      // @breaking-change 8.0.0 `_elementRef` and `_document` parameters to become required.
      private _elementRef?: ElementRef<HTMLElement>, @Inject(DOCUMENT) _document?: any) {
    this._groupId = nextId++;
    this._document = _document;
  }

  ngAfterContentInit() {
    this._steps.changes
      .pipe(startWith(this._steps), takeUntil(this._destroyed))
      .subscribe((steps: QueryList<CdkStep>) => {
        this.steps.reset(steps.filter(step => step._stepper === this));
        this.steps.notifyOnChanges();
      });
  }

  ngAfterViewInit() {
    // Note that while the step headers are content children by default, any components that
    // extend this one might have them as view children. We initialize the keyboard handling in
    // AfterViewInit so we're guaranteed for both view and content children to be defined.
    this._keyManager = new FocusKeyManager<FocusableOption>(this._stepHeader)
                           .withWrap()
                           .withHomeAndEnd()
                           .withVerticalOrientation(this._orientation === 'vertical');

    (this._dir ? (this._dir.change as Observable<Direction>) : observableOf<Direction>())
        .pipe(startWith(this._layoutDirection()), takeUntil(this._destroyed))
        .subscribe(direction => this._keyManager.withHorizontalOrientation(direction));

    this._keyManager.updateActiveItem(this._selectedIndex);

    // No need to `takeUntil` here, because we're the ones destroying `steps`.
    this.steps.changes.subscribe(() => {
      if (!this.selected) {
        this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
      }
    });

    // The logic which asserts that the selected index is within bounds doesn't run before the
    // steps are initialized, because we don't how many steps there are yet so we may have an
    // invalid index on init. If that's the case, auto-correct to the default so we don't throw.
    if (!this._isValidIndex(this._selectedIndex)) {
      this._selectedIndex = 0;
    }
  }

  ngOnDestroy() {
    this.steps.destroy();
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Selects and focuses the next step in list.
   *
   * 选择并让列表中的下一步获得焦点。
   *
   */
  next(): void {
    this.selectedIndex = Math.min(this._selectedIndex + 1, this.steps.length - 1);
  }

  /**
   * Selects and focuses the previous step in list.
   *
   * 选择并让列表中的上一步获得焦点。
   *
   */
  previous(): void {
    this.selectedIndex = Math.max(this._selectedIndex - 1, 0);
  }

  /**
   * Resets the stepper to its initial state. Note that this includes clearing form data.
   *
   * 步进器的初始状态是 1。请注意，这包括清除表单数据。
   *
   */
  reset(): void {
    this._updateSelectedItemIndex(0);
    this.steps.forEach(step => step.reset());
    this._stateChanged();
  }

  /**
   * Returns a unique id for each step label element.
   *
   * 为每个标签元素返回一个唯一的 id。
   *
   */
  _getStepLabelId(i: number): string {
    return `cdk-step-label-${this._groupId}-${i}`;
  }

  /**
   * Returns unique id for each step content element.
   *
   * 为每个步骤的内容元素返回唯一的 id。
   *
   */
  _getStepContentId(i: number): string {
    return `cdk-step-content-${this._groupId}-${i}`;
  }

  /**
   * Marks the component to be change detected.
   *
   * 标记要进行变更检测的组件。
   *
   */
  _stateChanged() {
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Returns position state of the step with the given index.
   *
   * 返回具有指定索引的步骤的位置状态。
   *
   */
  _getAnimationDirection(index: number): StepContentPositionState {
    const position = index - this._selectedIndex;
    if (position < 0) {
      return this._layoutDirection() === 'rtl' ? 'next' : 'previous';
    } else if (position > 0) {
      return this._layoutDirection() === 'rtl' ? 'previous' : 'next';
    }
    return 'current';
  }

  /**
   * Returns the type of icon to be displayed.
   *
   * 返回要显示的图标类型。
   *
   */
  _getIndicatorType(index: number, state: StepState = STEP_STATE.NUMBER): StepState {
    const step = this.steps.toArray()[index];
    const isCurrentStep = this._isCurrentStep(index);

    return step._displayDefaultIndicatorType ? this._getDefaultIndicatorLogic(step, isCurrentStep) :
                                               this._getGuidelineLogic(step, isCurrentStep, state);
  }

  private _getDefaultIndicatorLogic(step: CdkStep, isCurrentStep: boolean): StepState {
    if (step._showError && step.hasError && !isCurrentStep) {
      return STEP_STATE.ERROR;
    } else if (!step.completed || isCurrentStep) {
      return STEP_STATE.NUMBER;
    } else {
      return step.editable ? STEP_STATE.EDIT : STEP_STATE.DONE;
    }
  }

  private _getGuidelineLogic(
      step: CdkStep, isCurrentStep: boolean, state: StepState = STEP_STATE.NUMBER): StepState {
    if (step._showError && step.hasError && !isCurrentStep) {
      return STEP_STATE.ERROR;
    } else if (step.completed && !isCurrentStep) {
      return STEP_STATE.DONE;
    } else if (step.completed && isCurrentStep) {
      return state;
    } else if (step.editable && isCurrentStep) {
      return STEP_STATE.EDIT;
    } else {
      return state;
    }
  }

  private _isCurrentStep(index: number) {
    return this._selectedIndex === index;
  }

  /**
   * Returns the index of the currently-focused step header.
   *
   * 返回当前拥有焦点的步骤头的索引。
   *
   */
  _getFocusIndex() {
    return this._keyManager ? this._keyManager.activeItemIndex : this._selectedIndex;
  }

  private _updateSelectedItemIndex(newIndex: number): void {
    const stepsArray = this.steps.toArray();
    this.selectionChange.emit({
      selectedIndex: newIndex,
      previouslySelectedIndex: this._selectedIndex,
      selectedStep: stepsArray[newIndex],
      previouslySelectedStep: stepsArray[this._selectedIndex],
    });

    // If focus is inside the stepper, move it to the next header, otherwise it may become
    // lost when the active step content is hidden. We can't be more granular with the check
    // (e.g. checking whether focus is inside the active step), because we don't have a
    // reference to the elements that are rendering out the content.
    this._containsFocus() ? this._keyManager.setActiveItem(newIndex) :
                            this._keyManager.updateActiveItem(newIndex);

    this._selectedIndex = newIndex;
    this._stateChanged();
  }

  _onKeydown(event: KeyboardEvent) {
    const hasModifier = hasModifierKey(event);
    const keyCode = event.keyCode;
    const manager = this._keyManager;

    if (manager.activeItemIndex != null && !hasModifier &&
        (keyCode === SPACE || keyCode === ENTER)) {
      this.selectedIndex = manager.activeItemIndex;
      event.preventDefault();
    } else {
      manager.onKeydown(event);
    }
  }

  private _anyControlsInvalidOrPending(index: number): boolean {
    const steps = this.steps.toArray();

    steps[this._selectedIndex].interacted = true;

    if (this._linear && index >= 0) {
      return steps.slice(0, index).some(step => {
        const control = step.stepControl;
        const isIncomplete =
            control ? (control.invalid || control.pending || !step.interacted) : !step.completed;
        return isIncomplete && !step.optional && !step._completedOverride;
      });
    }

    return false;
  }

  private _layoutDirection(): Direction {
    return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
  }

  /**
   * Checks whether the stepper contains the focused element.
   *
   * 检查步进器是否包含有拥焦点的元素。
   *
   */
  private _containsFocus(): boolean {
    if (!this._document || !this._elementRef) {
      return false;
    }

    const stepperElement = this._elementRef.nativeElement;
    const focusedElement = this._document.activeElement;
    return stepperElement === focusedElement || stepperElement.contains(focusedElement);
  }

  /**
   * Checks whether the passed-in index is a valid step index.
   *
   * 检查传入的索引是否为有效的步骤索引。
   *
   */
  private _isValidIndex(index: number): boolean {
    return index > -1 && (!this.steps || index < this.steps.length);
  }

  static ngAcceptInputType_editable: BooleanInput;
  static ngAcceptInputType_optional: BooleanInput;
  static ngAcceptInputType_completed: BooleanInput;
  static ngAcceptInputType_hasError: BooleanInput;
  static ngAcceptInputType_linear: BooleanInput;
  static ngAcceptInputType_selectedIndex: NumberInput;
}

/**
 * Simplified representation of an "AbstractControl" from @angular/forms.
 * Used to avoid having to bring in @angular/forms for a single optional interface.
 *
 * 来自 @angular/forms 的 “AbstractControl” 的简化表示。用于避免为单个可选接口引入 @angular/forms。
 *
 * @docs-private
 */
interface AbstractControlLike {
  asyncValidator: ((control: any) => any) | null;
  dirty: boolean;
  disabled: boolean;
  enabled: boolean;
  errors: {[key: string]: any} | null;
  invalid: boolean;
  parent: any;
  pending: boolean;
  pristine: boolean;
  root: AbstractControlLike;
  status: string;
  statusChanges: Observable<any>;
  touched: boolean;
  untouched: boolean;
  updateOn: any;
  valid: boolean;
  validator: ((control: any) => any) | null;
  value: any;
  valueChanges: Observable<any>;
  clearAsyncValidators(): void;
  clearValidators(): void;
  disable(opts?: any): void;
  enable(opts?: any): void;
  get(path: (string | number)[] | string): AbstractControlLike | null;
  getError(errorCode: string, path?: (string | number)[] | string): any;
  hasError(errorCode: string, path?: (string | number)[] | string): boolean;
  markAllAsTouched(): void;
  markAsDirty(opts?: any): void;
  markAsPending(opts?: any): void;
  markAsPristine(opts?: any): void;
  markAsTouched(opts?: any): void;
  markAsUntouched(opts?: any): void;
  patchValue(value: any, options?: Object): void;
  reset(value?: any, options?: Object): void;
  setAsyncValidators(newValidator: (control: any) => any |
    ((control: any) => any)[] | null): void;
  setErrors(errors: {[key: string]: any} | null, opts?: any): void;
  setParent(parent: any): void;
  setValidators(newValidator: (control: any) => any |
    ((control: any) => any)[] | null): void;
  setValue(value: any, options?: Object): void;
  updateValueAndValidity(opts?: any): void;
  patchValue(value: any, options?: any): void;
  reset(formState?: any, options?: any): void;
  setValue(value: any, options?: any): void;
}
