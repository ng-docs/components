/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  Optional,
  QueryList,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import {
  CanColor, CanColorCtor,
  mixinColor,
} from '@angular/material/core';
import {fromEvent, merge, Subject} from 'rxjs';
import {startWith, take, takeUntil} from 'rxjs/operators';
import {MAT_ERROR, MatError} from './error';
import {matFormFieldAnimations} from './form-field-animations';
import {MatFormFieldControl} from './form-field-control';
import {
  getMatFormFieldDuplicatedHintError,
  getMatFormFieldMissingControlError,
  getMatFormFieldPlaceholderConflictError,
} from './form-field-errors';
import {_MAT_HINT, MatHint} from './hint';
import {MatLabel} from './label';
import {MatPlaceholder} from './placeholder';
import {MAT_PREFIX, MatPrefix} from './prefix';
import {MAT_SUFFIX, MatSuffix} from './suffix';
import {Platform} from '@angular/cdk/platform';
import {NgControl} from '@angular/forms';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';


let nextUniqueId = 0;
const floatingLabelScale = 0.75;
const outlineGapPadding = 5;


/**
 * Boilerplate for applying mixins to MatFormField.
 *
 * 用于将 mixins 应用到 MatFormField 的样板代码
 *
 * @docs-private
 */
class MatFormFieldBase {
  constructor(public _elementRef: ElementRef) { }
}

/**
 * Base class to which we're applying the form field mixins.
 *
 * 我们要把表单字段 mixins 应用到的基类。
 *
 * @docs-private
 */
const _MatFormFieldMixinBase: CanColorCtor & typeof MatFormFieldBase =
    mixinColor(MatFormFieldBase, 'primary');

/**
 * Possible appearance styles for the form field.
 *
 * 表单字段可能的外观样式。
 *
 */
export type MatFormFieldAppearance = 'legacy' | 'standard' | 'fill' | 'outline';

/**
 * Possible values for the "floatLabel" form-field input.
 *
 * 表单字段输入属性 “floatLabel” 的可用值。
 *
 */
export type FloatLabelType = 'always' | 'never' | 'auto';

/**
 * Represents the default options for the form field that can be configured
 * using the `MAT_FORM_FIELD_DEFAULT_OPTIONS` injection token.
 *
 * 表示可通过 `MAT_FORM_FIELD_DEFAULT_OPTIONS` 令牌配置的表单字段的默认选项。
 *
 */
export interface MatFormFieldDefaultOptions {
  appearance?: MatFormFieldAppearance;
  hideRequiredMarker?: boolean;
  /**
   * Whether the label for form-fields should by default float `always`,
   * `never`, or `auto` (only when necessary).
   *
   * 表单字段的标签默认应该是 `always`、`never` 还是 `auto`（只在必要时）。
   *
   */
  floatLabel?: FloatLabelType;
}

/**
 * Injection token that can be used to configure the
 * default options for all form field within an app.
 *
 * 注入令牌，可以用来配置应用中所有表单字段的默认选项。
 *
 */
export const MAT_FORM_FIELD_DEFAULT_OPTIONS =
    new InjectionToken<MatFormFieldDefaultOptions>('MAT_FORM_FIELD_DEFAULT_OPTIONS');

/**
 * Injection token that can be used to inject an instances of `MatFormField`. It serves
 * as alternative token to the actual `MatFormField` class which would cause unnecessary
 * retention of the `MatFormField` class and its component metadata.
 *
 * 这个注入令牌可以用来注入一个 `MatFormField` 的实例。它可以作为实际 `MatFormField` 类的备用令牌，使用实际类会导致 `MatFormField` 类及其组件元数据无法优化掉。
 *
 */
export const MAT_FORM_FIELD = new InjectionToken<MatFormField>('MatFormField');

/**
 * Container for form controls that applies Material Design styling and behavior.
 *
 * 表单控件的容器，用来应用 Material Design 的样式和行为。
 *
 */
@Component({
  selector: 'mat-form-field',
  exportAs: 'matFormField',
  templateUrl: 'form-field.html',
  // MatInput is a directive and can't have styles, so we need to include its styles here
  // in form-field-input.css. The MatInput styles are fairly minimal so it shouldn't be a
  // big deal for people who aren't using MatInput.
  styleUrls: [
    'form-field.css',
    'form-field-fill.css',
    'form-field-input.css',
    'form-field-legacy.css',
    'form-field-outline.css',
    'form-field-standard.css',
  ],
  animations: [matFormFieldAnimations.transitionMessages],
  host: {
    'class': 'mat-form-field',
    '[class.mat-form-field-appearance-standard]': 'appearance == "standard"',
    '[class.mat-form-field-appearance-fill]': 'appearance == "fill"',
    '[class.mat-form-field-appearance-outline]': 'appearance == "outline"',
    '[class.mat-form-field-appearance-legacy]': 'appearance == "legacy"',
    '[class.mat-form-field-invalid]': '_control.errorState',
    '[class.mat-form-field-can-float]': '_canLabelFloat()',
    '[class.mat-form-field-should-float]': '_shouldLabelFloat()',
    '[class.mat-form-field-has-label]': '_hasFloatingLabel()',
    '[class.mat-form-field-hide-placeholder]': '_hideControlPlaceholder()',
    '[class.mat-form-field-disabled]': '_control.disabled',
    '[class.mat-form-field-autofilled]': '_control.autofilled',
    '[class.mat-focused]': '_control.focused',
    '[class.mat-accent]': 'color == "accent"',
    '[class.mat-warn]': 'color == "warn"',
    '[class.ng-untouched]': '_shouldForward("untouched")',
    '[class.ng-touched]': '_shouldForward("touched")',
    '[class.ng-pristine]': '_shouldForward("pristine")',
    '[class.ng-dirty]': '_shouldForward("dirty")',
    '[class.ng-valid]': '_shouldForward("valid")',
    '[class.ng-invalid]': '_shouldForward("invalid")',
    '[class.ng-pending]': '_shouldForward("pending")',
    '[class._mat-animation-noopable]': '!_animationsEnabled',
  },
  inputs: ['color'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {provide: MAT_FORM_FIELD, useExisting: MatFormField},
  ]
})

export class MatFormField extends _MatFormFieldMixinBase
    implements AfterContentInit, AfterContentChecked, AfterViewInit, OnDestroy, CanColor {

  /**
   * Whether the outline gap needs to be calculated
   * immediately on the next change detection run.
   *
   * 是否需要在下次变更检测运行时立即计算轮廓的间隙。
   *
   */
  private _outlineGapCalculationNeededImmediately = false;

  /**
   * Whether the outline gap needs to be calculated next time the zone has stabilized.
   *
   * 是否需要在下次 Zone 稳定后计算出轮廓的间隙。
   *
   */
  private _outlineGapCalculationNeededOnStable = false;

  private _destroyed = new Subject<void>();

  /**
   * The form-field appearance style.
   *
   * 表单字段的外观样式。
   *
   */
  @Input()
  get appearance(): MatFormFieldAppearance { return this._appearance; }
  set appearance(value: MatFormFieldAppearance) {
    const oldValue = this._appearance;

    this._appearance = value || (this._defaults && this._defaults.appearance) || 'legacy';

    if (this._appearance === 'outline' && oldValue !== value) {
      this._outlineGapCalculationNeededOnStable = true;
    }
  }
  _appearance: MatFormFieldAppearance;

  /**
   * Whether the required marker should be hidden.
   *
   * 是否应隐藏必填项标记。
   *
   */
  @Input()
  get hideRequiredMarker(): boolean { return this._hideRequiredMarker; }
  set hideRequiredMarker(value: boolean) {
    this._hideRequiredMarker = coerceBooleanProperty(value);
  }
  private _hideRequiredMarker: boolean;

  /**
   * Override for the logic that disables the label animation in certain cases.
   *
   * 在某些情况下改写禁用标签动画的逻辑。
   *
   */
  private _showAlwaysAnimate = false;

  /**
   * Whether the floating label should always float or not.
   *
   * 浮动标签是否应该始终是浮动的。
   *
   */
  _shouldAlwaysFloat(): boolean {
    return this.floatLabel === 'always' && !this._showAlwaysAnimate;
  }

  /**
   * Whether the label can float or not.
   *
   * 标签是否可以浮动。
   *
   */
  _canLabelFloat(): boolean { return this.floatLabel !== 'never'; }

  /**
   * State of the mat-hint and mat-error animations.
   *
   * mat-hint 和 mat-error 动画的状态。
   *
   */
  _subscriptAnimationState: string = '';

  /**
   * Text for the form field hint.
   *
   * 表单字段提示的文本。
   *
   */
  @Input()
  get hintLabel(): string { return this._hintLabel; }
  set hintLabel(value: string) {
    this._hintLabel = value;
    this._processHints();
  }
  private _hintLabel = '';

  // Unique id for the hint label.
  readonly _hintLabelId: string = `mat-hint-${nextUniqueId++}`;

  // Unique id for the label element.
  readonly _labelId = `mat-form-field-label-${nextUniqueId++}`;

  /**
   * Whether the label should always float, never float or float as the user types.
   *
   * 标签是否应该始终是浮动的、永远不会浮动或根据用户的输入浮动。
   *
   * Note: only the legacy appearance supports the `never` option. `never` was originally added as a
   * way to make the floating label emulate the behavior of a standard input placeholder. However
   * the form field now supports both floating labels and placeholders. Therefore in the non-legacy
   * appearances the `never` option has been disabled in favor of just using the placeholder.
   *
   * 注意：只有旧版外观支持 `never` 选项。 `never` 原本添加为让浮动标签模仿标准输入占位符行为的方法。但是，表单字段现在同时支持浮动标签和占位符。因此，在非遗留应用的外观中，只为了作为占位符使用的 `never` 选项已被禁用。
   *
   */
  @Input()
  get floatLabel(): FloatLabelType {
    return this.appearance !== 'legacy' && this._floatLabel === 'never' ? 'auto' : this._floatLabel;
  }
  set floatLabel(value: FloatLabelType) {
    if (value !== this._floatLabel) {
      this._floatLabel = value || this._getDefaultFloatLabelState();
      this._changeDetectorRef.markForCheck();
    }
  }
  private _floatLabel: FloatLabelType;

  /**
   * Whether the Angular animations are enabled.
   *
   * 是否启用了 Angular 动画。
   *
   */
  _animationsEnabled: boolean;

  /**
   * @deprecated
   * @breaking-change 8.0.0
   */
  @ViewChild('underline') underlineRef: ElementRef;

  @ViewChild('connectionContainer', {static: true}) _connectionContainerRef: ElementRef;
  @ViewChild('inputContainer') _inputContainerRef: ElementRef;
  @ViewChild('label') private _label: ElementRef<HTMLElement>;

  @ContentChild(MatFormFieldControl) _controlNonStatic: MatFormFieldControl<any>;
  @ContentChild(MatFormFieldControl, {static: true}) _controlStatic: MatFormFieldControl<any>;
  get _control() {
    // TODO(crisbeto): we need this workaround in order to support both Ivy and ViewEngine.
    //  We should clean this up once Ivy is the default renderer.
    return this._explicitFormFieldControl || this._controlNonStatic || this._controlStatic;
  }
  set _control(value) {
    this._explicitFormFieldControl = value;
  }
  private _explicitFormFieldControl: MatFormFieldControl<any>;

  @ContentChild(MatLabel) _labelChildNonStatic: MatLabel;
  @ContentChild(MatLabel, {static: true}) _labelChildStatic: MatLabel;
  @ContentChild(MatPlaceholder) _placeholderChild: MatPlaceholder;

  @ContentChildren(MAT_ERROR, {descendants: true}) _errorChildren: QueryList<MatError>;
  @ContentChildren(_MAT_HINT, {descendants: true}) _hintChildren: QueryList<MatHint>;
  @ContentChildren(MAT_PREFIX, {descendants: true}) _prefixChildren: QueryList<MatPrefix>;
  @ContentChildren(MAT_SUFFIX, {descendants: true}) _suffixChildren: QueryList<MatSuffix>;

  constructor(
      public _elementRef: ElementRef, private _changeDetectorRef: ChangeDetectorRef,
      /**
       * @deprecated `_labelOptions` parameter no longer being used. To be removed.
       * @breaking-change 12.0.0
       */
      @Inject(ElementRef)
          // Use `ElementRef` here so Angular has something to inject.
          _labelOptions: any,
      @Optional() private _dir: Directionality,
      @Optional() @Inject(MAT_FORM_FIELD_DEFAULT_OPTIONS) private _defaults:
          MatFormFieldDefaultOptions, private _platform: Platform, private _ngZone: NgZone,
      @Optional() @Inject(ANIMATION_MODULE_TYPE) _animationMode: string) {
    super(_elementRef);

    this.floatLabel = this._getDefaultFloatLabelState();
    this._animationsEnabled = _animationMode !== 'NoopAnimations';

    // Set the default through here so we invoke the setter on the first run.
    this.appearance = (_defaults && _defaults.appearance) ? _defaults.appearance : 'legacy';
    this._hideRequiredMarker = (_defaults && _defaults.hideRequiredMarker != null) ?
        _defaults.hideRequiredMarker : false;
  }

  /**
   * Gets the id of the label element. If no label is present, returns `null`.
   *
   * 获取 label 元素的 id。如果没有 label，则返回 `null` 。
   *
   */
  getLabelId(): string|null {
    return this._hasFloatingLabel() ? this._labelId : null;
  }

  /**
   * Gets an ElementRef for the element that a overlay attached to the form-field should be
   * positioned relative to.
   *
   * 获取一个 ElementRef 元素，它为附着到表单字段上的浮层提供相对于该元素定位。
   *
   */
  getConnectedOverlayOrigin(): ElementRef {
    return this._connectionContainerRef || this._elementRef;
  }

  ngAfterContentInit() {
    this._validateControlChild();

    const control = this._control;

    if (control.controlType) {
      this._elementRef.nativeElement.classList.add(`mat-form-field-type-${control.controlType}`);
    }

    // Subscribe to changes in the child control state in order to update the form field UI.
    control.stateChanges.pipe(startWith(null!)).subscribe(() => {
      this._validatePlaceholders();
      this._syncDescribedByIds();
      this._changeDetectorRef.markForCheck();
    });

    // Run change detection if the value changes.
    if (control.ngControl && control.ngControl.valueChanges) {
      control.ngControl.valueChanges
        .pipe(takeUntil(this._destroyed))
        .subscribe(() => this._changeDetectorRef.markForCheck());
    }

    // Note that we have to run outside of the `NgZone` explicitly,
    // in order to avoid throwing users into an infinite loop
    // if `zone-patch-rxjs` is included.
    this._ngZone.runOutsideAngular(() => {
      this._ngZone.onStable.pipe(takeUntil(this._destroyed)).subscribe(() => {
        if (this._outlineGapCalculationNeededOnStable) {
          this.updateOutlineGap();
        }
      });
    });

    // Run change detection and update the outline if the suffix or prefix changes.
    merge(this._prefixChildren.changes, this._suffixChildren.changes).subscribe(() => {
      this._outlineGapCalculationNeededOnStable = true;
      this._changeDetectorRef.markForCheck();
    });

    // Re-validate when the number of hints changes.
    this._hintChildren.changes.pipe(startWith(null)).subscribe(() => {
      this._processHints();
      this._changeDetectorRef.markForCheck();
    });

    // Update the aria-described by when the number of errors changes.
    this._errorChildren.changes.pipe(startWith(null)).subscribe(() => {
      this._syncDescribedByIds();
      this._changeDetectorRef.markForCheck();
    });

    if (this._dir) {
      this._dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => {
        if (typeof requestAnimationFrame === 'function') {
          this._ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => this.updateOutlineGap());
          });
        } else {
          this.updateOutlineGap();
        }
      });
    }
  }

  ngAfterContentChecked() {
    this._validateControlChild();
    if (this._outlineGapCalculationNeededImmediately) {
      this.updateOutlineGap();
    }
  }

  ngAfterViewInit() {
    // Avoid animations on load.
    this._subscriptAnimationState = 'enter';
    this._changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Determines whether a class from the NgControl should be forwarded to the host element.
   *
   * 确定是否应该把 NgControl 中的类转发给宿主元素。
   *
   */
  _shouldForward(prop: keyof NgControl): boolean {
    const ngControl = this._control ? this._control.ngControl : null;
    return ngControl && ngControl[prop];
  }

  _hasPlaceholder() {
    return !!(this._control && this._control.placeholder || this._placeholderChild);
  }

  _hasLabel() {
    return !!(this._labelChildNonStatic || this._labelChildStatic);
  }

  _shouldLabelFloat() {
    return this._canLabelFloat() &&
        ((this._control && this._control.shouldLabelFloat) || this._shouldAlwaysFloat());
  }

  _hideControlPlaceholder() {
    // In the legacy appearance the placeholder is promoted to a label if no label is given.
    return this.appearance === 'legacy' && !this._hasLabel() ||
        this._hasLabel() && !this._shouldLabelFloat();
  }

  _hasFloatingLabel() {
    // In the legacy appearance the placeholder is promoted to a label if no label is given.
    return this._hasLabel() || this.appearance === 'legacy' && this._hasPlaceholder();
  }

  /**
   * Determines whether to display hints or errors.
   *
   * 确定是否显示提示或错误。
   *
   */
  _getDisplayedMessages(): 'error' | 'hint' {
    return (this._errorChildren && this._errorChildren.length > 0 &&
        this._control.errorState) ? 'error' : 'hint';
  }

  /**
   * Animates the placeholder up and locks it in position.
   *
   * 为占位符添加动画，并把它锁定到其位置。
   *
   */
  _animateAndLockLabel(): void {
    if (this._hasFloatingLabel() && this._canLabelFloat()) {
      // If animations are disabled, we shouldn't go in here,
      // because the `transitionend` will never fire.
      if (this._animationsEnabled && this._label) {
        this._showAlwaysAnimate = true;

        fromEvent(this._label.nativeElement, 'transitionend').pipe(take(1)).subscribe(() => {
          this._showAlwaysAnimate = false;
        });
      }

      this.floatLabel = 'always';
      this._changeDetectorRef.markForCheck();
    }
  }

  /**
   * Ensure that there is only one placeholder (either `placeholder` attribute on the child control
   * or child element with the `mat-placeholder` directive).
   *
   * 确保只有一个占位符（无论是子控件中的 `placeholder` 属性，还是带有 `mat-placeholder` 指令的子元素）。
   *
   */
  private _validatePlaceholders() {
    if (this._control.placeholder && this._placeholderChild &&
      (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getMatFormFieldPlaceholderConflictError();
    }
  }

  /**
   * Does any extra processing that is required when handling the hints.
   *
   * 处理提示时是否需要进行额外的处理。
   *
   */
  private _processHints() {
    this._validateHints();
    this._syncDescribedByIds();
  }

  /**
   * Ensure that there is a maximum of one of each `<mat-hint>` alignment specified, with the
   * attribute being considered as `align="start"`.
   *
   * 确保每个 `<mat-hint>` 对齐中最只有一个对齐具有等价于 `align="start"` 的属性。
   *
   */
  private _validateHints() {
    if (this._hintChildren && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      let startHint: MatHint;
      let endHint: MatHint;
      this._hintChildren.forEach((hint: MatHint) => {
        if (hint.align === 'start') {
          if (startHint || this.hintLabel) {
            throw getMatFormFieldDuplicatedHintError('start');
          }
          startHint = hint;
        } else if (hint.align === 'end') {
          if (endHint) {
            throw getMatFormFieldDuplicatedHintError('end');
          }
          endHint = hint;
        }
      });
    }
  }

  /**
   * Gets the default float label state.
   *
   * 获取默认的浮动标签状态。
   *
   */
  private _getDefaultFloatLabelState(): FloatLabelType {
    return (this._defaults && this._defaults.floatLabel) || 'auto';
  }

  /**
   * Sets the list of element IDs that describe the child control. This allows the control to update
   * its `aria-describedby` attribute accordingly.
   *
   * 设置描述子控件的元素 ID 列表。这允许控件相应地更新它的 `aria-describedby` 属性。
   *
   */
  private _syncDescribedByIds() {
    if (this._control) {
      let ids: string[] = [];

      // TODO(wagnermaciel): Remove the type check when we find the root cause of this bug.
      if (this._control.userAriaDescribedBy &&
        typeof this._control.userAriaDescribedBy === 'string') {
        ids.push(...this._control.userAriaDescribedBy.split(' '));
      }

      if (this._getDisplayedMessages() === 'hint') {
        const startHint = this._hintChildren ?
            this._hintChildren.find(hint => hint.align === 'start') : null;
        const endHint = this._hintChildren ?
            this._hintChildren.find(hint => hint.align === 'end') : null;

        if (startHint) {
          ids.push(startHint.id);
        } else if (this._hintLabel) {
          ids.push(this._hintLabelId);
        }

        if (endHint) {
          ids.push(endHint.id);
        }
      } else if (this._errorChildren) {
        ids.push(...this._errorChildren.map(error => error.id));
      }

      this._control.setDescribedByIds(ids);
    }
  }

  /**
   * Throws an error if the form field's control is missing.
   *
   * 如果缺少表单字段的控件，就会抛出一个错误。
   *
   */
  protected _validateControlChild() {
    if (!this._control && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getMatFormFieldMissingControlError();
    }
  }

  /**
   * Updates the width and position of the gap in the outline. Only relevant for the outline
   * appearance.
   *
   * 更新轮廓中间隙的宽度和位置。只与轮廓外观有关。
   *
   */
  updateOutlineGap() {
    const labelEl = this._label ? this._label.nativeElement : null;

    if (this.appearance !== 'outline' || !labelEl || !labelEl.children.length ||
        !labelEl.textContent!.trim()) {
      return;
    }

    if (!this._platform.isBrowser) {
      // getBoundingClientRect isn't available on the server.
      return;
    }
    // If the element is not present in the DOM, the outline gap will need to be calculated
    // the next time it is checked and in the DOM.
    if (!this._isAttachedToDOM()) {
      this._outlineGapCalculationNeededImmediately = true;
      return;
    }

    let startWidth = 0;
    let gapWidth = 0;

    const container = this._connectionContainerRef.nativeElement;
    const startEls = container.querySelectorAll('.mat-form-field-outline-start');
    const gapEls = container.querySelectorAll('.mat-form-field-outline-gap');

    if (this._label && this._label.nativeElement.children.length) {
      const containerRect = container.getBoundingClientRect();

      // If the container's width and height are zero, it means that the element is
      // invisible and we can't calculate the outline gap. Mark the element as needing
      // to be checked the next time the zone stabilizes. We can't do this immediately
      // on the next change detection, because even if the element becomes visible,
      // the `ClientRect` won't be reclaculated immediately. We reset the
      // `_outlineGapCalculationNeededImmediately` flag some we don't run the checks twice.
      if (containerRect.width === 0 && containerRect.height === 0) {
        this._outlineGapCalculationNeededOnStable = true;
        this._outlineGapCalculationNeededImmediately = false;
        return;
      }

      const containerStart = this._getStartEnd(containerRect);
      const labelChildren = labelEl.children;
      const labelStart = this._getStartEnd(labelChildren[0].getBoundingClientRect());
      let labelWidth = 0;

      for (let i = 0; i < labelChildren.length; i++) {
        labelWidth += (labelChildren[i] as HTMLElement).offsetWidth;
      }
      startWidth = Math.abs(labelStart - containerStart) - outlineGapPadding;
      gapWidth = labelWidth > 0 ? labelWidth * floatingLabelScale + outlineGapPadding * 2 : 0;
    }

    for (let i = 0; i < startEls.length; i++) {
      startEls[i].style.width = `${startWidth}px`;
    }
    for (let i = 0; i < gapEls.length; i++) {
      gapEls[i].style.width = `${gapWidth}px`;
    }

    this._outlineGapCalculationNeededOnStable =
        this._outlineGapCalculationNeededImmediately = false;
  }

  /**
   * Gets the start end of the rect considering the current directionality.
   *
   * 考虑当前的方向性，取得矩形的起始端。
   *
   */
  private _getStartEnd(rect: ClientRect): number {
    return (this._dir && this._dir.value === 'rtl') ? rect.right : rect.left;
  }

  /**
   * Checks whether the form field is attached to the DOM.
   *
   * 检查表单字段是否已附着到 DOM。
   *
   */
  private _isAttachedToDOM(): boolean {
    const element: HTMLElement = this._elementRef.nativeElement;

    if (element.getRootNode) {
      const rootNode = element.getRootNode();
      // If the element is inside the DOM the root node will be either the document
      // or the closest shadow root, otherwise it'll be the element itself.
      return rootNode && rootNode !== element;
    }

    // Otherwise fall back to checking if it's in the document. This doesn't account for
    // shadow DOM, however browser that support shadow DOM should support `getRootNode` as well.
    return document.documentElement!.contains(element);
  }

  static ngAcceptInputType_hideRequiredMarker: BooleanInput;
}
