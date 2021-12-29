/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {DOWN_ARROW, ENTER, ESCAPE, TAB, UP_ARROW, hasModifierKey} from '@angular/cdk/keycodes';
import {
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  OverlayRef,
  PositionStrategy,
  ScrollStrategy,
  ConnectedPosition,
} from '@angular/cdk/overlay';
import {_getEventTarget} from '@angular/cdk/platform';
import {TemplatePortal} from '@angular/cdk/portal';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  forwardRef,
  Host,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  ViewContainerRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  _countGroupLabelsBeforeOption,
  _getOptionScrollPosition,
  MatOption,
  MatOptionSelectionChange,
} from '@angular/material/core';
import {MAT_FORM_FIELD, MatFormField} from '@angular/material/form-field';
import {defer, fromEvent, merge, Observable, of as observableOf, Subject, Subscription} from 'rxjs';
import {delay, filter, map, switchMap, take, tap} from 'rxjs/operators';

import {
  _MatAutocompleteBase,
  MAT_AUTOCOMPLETE_DEFAULT_OPTIONS,
  MatAutocompleteDefaultOptions,
} from './autocomplete';
import {_MatAutocompleteOriginBase} from './autocomplete-origin';

/**
 * Injection token that determines the scroll handling while the autocomplete panel is open.
 *
 * 当自动完成面板打开时，注入令牌决定了滚动处理策略。
 *
 */
export const MAT_AUTOCOMPLETE_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'mat-autocomplete-scroll-strategy',
);

/** @docs-private */
export function MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY(overlay: Overlay): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

/** @docs-private */
export const MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MAT_AUTOCOMPLETE_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MAT_AUTOCOMPLETE_SCROLL_STRATEGY_FACTORY,
};

/**
 * Provider that allows the autocomplete to register as a ControlValueAccessor.
 *
 * 允许将此自动完成器注册为 ControlValueAccessor 的提供者。
 *
 * @docs-private
 */
export const MAT_AUTOCOMPLETE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MatAutocompleteTrigger),
  multi: true,
};

/**
 * Creates an error to be thrown when attempting to use an autocomplete trigger without a panel.
 *
 * 试图在没有面板的情况下使用自动完成触发器时，就会抛出一个错误。
 *
 * @docs-private
 */
export function getMatAutocompleteMissingPanelError(): Error {
  return Error(
    'Attempting to open an undefined instance of `mat-autocomplete`. ' +
      'Make sure that the id passed to the `matAutocomplete` is correct and that ' +
      "you're attempting to open it after the ngAfterContentInit hook.",
  );
}

/**
 * Base class with all of the `MatAutocompleteTrigger` functionality.
 *
 * 具备所有 `MatAutocompleteTrigger` 功能的基类。
 *
 */
@Directive()
export abstract class _MatAutocompleteTriggerBase
  implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy
{
  private _overlayRef: OverlayRef | null;
  private _portal: TemplatePortal;
  private _componentDestroyed = false;
  private _autocompleteDisabled = false;
  private _scrollStrategy: () => ScrollStrategy;

  /**
   * Old value of the native input. Used to work around issues with the `input` event on IE.
   *
   * 原生输入框的旧值。用来解决 IE 中 `input` 事件的问题。
   *
   */
  private _previousValue: string | number | null;

  /**
   * Strategy that is used to position the panel.
   *
   * 本面板的定位策略。
   *
   */
  private _positionStrategy: FlexibleConnectedPositionStrategy;

  /**
   * Whether or not the label state is being overridden.
   *
   * 是否改写了标签状态。
   *
   */
  private _manuallyFloatingLabel = false;

  /**
   * The subscription for closing actions (some are bound to document).
   *
   * 管理各种关闭动作（其中一些订阅到了 `document`）的订阅。
   *
   */
  private _closingActionsSubscription: Subscription;

  /**
   * Subscription to viewport size changes.
   *
   * 管理视口大小变化的订阅。
   *
   */
  private _viewportSubscription = Subscription.EMPTY;

  /**
   * Whether the autocomplete can open the next time it is focused. Used to prevent a focused,
   * closed autocomplete from being reopened if the user switches to another browser tab and then
   * comes back.
   *
   * 自动完成功能是否可以在下一次获得焦点时打开。如果用户切换到另一个浏览器标签，然后回来，它会防止重新打开一个有焦点的、已关闭的自动完成器。
   *
   */
  private _canOpenOnNextFocus = true;

  /**
   * Stream of keyboard events that can close the panel.
   *
   * 可以关闭此面板的键盘事件流。
   *
   */
  private readonly _closeKeyEventStream = new Subject<void>();

  /**
   * Event handler for when the window is blurred. Needs to be an
   * arrow function in order to preserve the context.
   *
   * 窗口失焦时的事件处理函数。需要用箭头函数才能保留上下文。
   *
   */
  private _windowBlurHandler = () => {
    // If the user blurred the window while the autocomplete is focused, it means that it'll be
    // refocused when they come back. In this case we want to skip the first focus event, if the
    // pane was closed, in order to avoid reopening it unintentionally.
    this._canOpenOnNextFocus =
      this._document.activeElement !== this._element.nativeElement || this.panelOpen;
  };

  /** `View -> model callback called when value changes` */
  _onChange: (value: any) => void = () => {};

  /** `View -> model callback called when autocomplete has been touched` */
  _onTouched = () => {};

  /**
   * The autocomplete panel to be attached to this trigger.
   *
   * 要附加到此触发器的自动完成面板。
   *
   */
  @Input('matAutocomplete') autocomplete: _MatAutocompleteBase;

  /**
   * Position of the autocomplete panel relative to the trigger element. A position of `auto`
   * will render the panel underneath the trigger if there is enough space for it to fit in
   * the viewport, otherwise the panel will be shown above it. If the position is set to
   * `above` or `below`, the panel will always be shown above or below the trigger. no matter
   * whether it fits completely in the viewport.
   *
   * 自动完成面板相对于触发器元素的位置。`auto` 位置会让该面板在触发器下方渲染，前提是它有足够的空间放进本视口中，否则面板就会显示在它的上方。如果位置设为 `above` 或 `below`，则面板将始终显示在触发器的上方或下方，无论它是否完全适合本视口。
   *
   */
  @Input('matAutocompletePosition') position: 'auto' | 'above' | 'below' = 'auto';

  /**
   * Reference relative to which to position the autocomplete panel.
   * Defaults to the autocomplete trigger element.
   *
   * 用来定位自动完成面板的基准点。默认为本自动完成触发器元素。
   *
   */
  @Input('matAutocompleteConnectedTo') connectedTo: _MatAutocompleteOriginBase;

  /**
   * `autocomplete` attribute to be set on the input element.
   *
   * 要在输入框元素上设置的 `autocomplete` 属性
   *
   * @docs-private
   */
  @Input('autocomplete') autocompleteAttribute: string = 'off';

  /**
   * Whether the autocomplete is disabled. When disabled, the element will
   * act as a regular input and the user won't be able to open the panel.
   *
   * 是否禁用了自动完成器。当禁用时，该元素和常规输入框的行为相同，用户将无法打开该面板。
   *
   */
  @Input('matAutocompleteDisabled')
  get autocompleteDisabled(): boolean {
    return this._autocompleteDisabled;
  }
  set autocompleteDisabled(value: BooleanInput) {
    this._autocompleteDisabled = coerceBooleanProperty(value);
  }

  constructor(
    private _element: ElementRef<HTMLInputElement>,
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private _zone: NgZone,
    private _changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_AUTOCOMPLETE_SCROLL_STRATEGY) scrollStrategy: any,
    @Optional() private _dir: Directionality,
    @Optional() @Inject(MAT_FORM_FIELD) @Host() private _formField: MatFormField,
    @Optional() @Inject(DOCUMENT) private _document: any,
    private _viewportRuler: ViewportRuler,
    @Optional()
    @Inject(MAT_AUTOCOMPLETE_DEFAULT_OPTIONS)
    private _defaults?: MatAutocompleteDefaultOptions,
  ) {
    this._scrollStrategy = scrollStrategy;
  }

  /**
   * Class to apply to the panel when it's above the input.
   *
   * 当此面板位于输入框上方时要应用的类。
   *
   */
  protected abstract _aboveClass: string;

  ngAfterViewInit() {
    const window = this._getWindow();

    if (typeof window !== 'undefined') {
      this._zone.runOutsideAngular(() => window.addEventListener('blur', this._windowBlurHandler));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['position'] && this._positionStrategy) {
      this._setStrategyPositions(this._positionStrategy);

      if (this.panelOpen) {
        this._overlayRef!.updatePosition();
      }
    }
  }

  ngOnDestroy() {
    const window = this._getWindow();

    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this._windowBlurHandler);
    }

    this._viewportSubscription.unsubscribe();
    this._componentDestroyed = true;
    this._destroyPanel();
    this._closeKeyEventStream.complete();
  }

  /**
   * Whether or not the autocomplete panel is open.
   *
   * 自动完成面板是否处于已打开状态。
   *
   */
  get panelOpen(): boolean {
    return this._overlayAttached && this.autocomplete.showPanel;
  }
  private _overlayAttached: boolean = false;

  /**
   * Opens the autocomplete suggestion panel.
   *
   * 打开自动完成建议面板。
   *
   */
  openPanel(): void {
    this._attachOverlay();
    this._floatLabel();
  }

  /**
   * Closes the autocomplete suggestion panel.
   *
   * 关闭自动完成建议面板。
   *
   */
  closePanel(): void {
    this._resetLabel();

    if (!this._overlayAttached) {
      return;
    }

    if (this.panelOpen) {
      // Only emit if the panel was visible.
      this.autocomplete.closed.emit();
    }

    this.autocomplete._isOpen = this._overlayAttached = false;

    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
      this._closingActionsSubscription.unsubscribe();
    }

    // Note that in some cases this can end up being called after the component is destroyed.
    // Add a check to ensure that we don't try to run change detection on a destroyed view.
    if (!this._componentDestroyed) {
      // We need to trigger change detection manually, because
      // `fromEvent` doesn't seem to do it at the proper time.
      // This ensures that the label is reset when the
      // user clicks outside.
      this._changeDetectorRef.detectChanges();
    }
  }

  /**
   * Updates the position of the autocomplete suggestion panel to ensure that it fits all options
   * within the viewport.
   *
   * 更新自动完成建议面板的位置，以确保它能容纳视口中的所有选项。
   *
   */
  updatePosition(): void {
    if (this._overlayAttached) {
      this._overlayRef!.updatePosition();
    }
  }

  /**
   * A stream of actions that should close the autocomplete panel, including
   * when an option is selected, on blur, and when TAB is pressed.
   *
   * 会导致关闭自动完成面板的一系列动作，包括当选择了某个选项时、失焦时，以及当按下 TAB 时。
   *
   */
  get panelClosingActions(): Observable<MatOptionSelectionChange | null> {
    return merge(
      this.optionSelections,
      this.autocomplete._keyManager.tabOut.pipe(filter(() => this._overlayAttached)),
      this._closeKeyEventStream,
      this._getOutsideClickStream(),
      this._overlayRef
        ? this._overlayRef.detachments().pipe(filter(() => this._overlayAttached))
        : observableOf(),
    ).pipe(
      // Normalize the output so we return a consistent type.
      map(event => (event instanceof MatOptionSelectionChange ? event : null)),
    );
  }

  /**
   * Stream of autocomplete option selections.
   *
   * 自动完成选项的选择流。
   *
   */
  readonly optionSelections: Observable<MatOptionSelectionChange> = defer(() => {
    if (this.autocomplete && this.autocomplete.options) {
      return merge(...this.autocomplete.options.map(option => option.onSelectionChange));
    }

    // If there are any subscribers before `ngAfterViewInit`, the `autocomplete` will be undefined.
    // Return a stream that we'll replace with the real one once everything is in place.
    return this._zone.onStable.pipe(
      take(1),
      switchMap(() => this.optionSelections),
    );
  }) as Observable<MatOptionSelectionChange>;

  /**
   * The currently active option, coerced to MatOption type.
   *
   * 当前处于活动状态的选项，强制转换为 MatOption 类型。
   *
   */
  get activeOption(): MatOption | null {
    if (this.autocomplete && this.autocomplete._keyManager) {
      return this.autocomplete._keyManager.activeItem;
    }

    return null;
  }

  /**
   * Stream of clicks outside of the autocomplete panel.
   *
   * 自动填充面板外部的点击事件流。
   *
   */
  private _getOutsideClickStream(): Observable<any> {
    return merge(
      fromEvent(this._document, 'click') as Observable<MouseEvent>,
      fromEvent(this._document, 'auxclick') as Observable<MouseEvent>,
      fromEvent(this._document, 'touchend') as Observable<TouchEvent>,
    ).pipe(
      filter(event => {
        // If we're in the Shadow DOM, the event target will be the shadow root, so we have to
        // fall back to check the first element in the path of the click event.
        const clickTarget = _getEventTarget<HTMLElement>(event)!;
        const formField = this._formField ? this._formField._elementRef.nativeElement : null;
        const customOrigin = this.connectedTo ? this.connectedTo.elementRef.nativeElement : null;

        return (
          this._overlayAttached &&
          clickTarget !== this._element.nativeElement &&
          (!formField || !formField.contains(clickTarget)) &&
          (!customOrigin || !customOrigin.contains(clickTarget)) &&
          !!this._overlayRef &&
          !this._overlayRef.overlayElement.contains(clickTarget)
        );
      }),
    );
  }

  // Implemented as part of ControlValueAccessor.
  writeValue(value: any): void {
    Promise.resolve(null).then(() => this._setTriggerValue(value));
  }

  // Implemented as part of ControlValueAccessor.
  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }

  // Implemented as part of ControlValueAccessor.
  registerOnTouched(fn: () => {}) {
    this._onTouched = fn;
  }

  // Implemented as part of ControlValueAccessor.
  setDisabledState(isDisabled: boolean) {
    this._element.nativeElement.disabled = isDisabled;
  }

  _handleKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;

    // Prevent the default action on all escape key presses. This is here primarily to bring IE
    // in line with other browsers. By default, pressing escape on IE will cause it to revert
    // the input value to the one that it had on focus, however it won't dispatch any events
    // which means that the model value will be out of sync with the view.
    if (keyCode === ESCAPE && !hasModifierKey(event)) {
      event.preventDefault();
    }

    if (this.activeOption && keyCode === ENTER && this.panelOpen) {
      this.activeOption._selectViaInteraction();
      this._resetActiveItem();
      event.preventDefault();
    } else if (this.autocomplete) {
      const prevActiveItem = this.autocomplete._keyManager.activeItem;
      const isArrowKey = keyCode === UP_ARROW || keyCode === DOWN_ARROW;

      if (this.panelOpen || keyCode === TAB) {
        this.autocomplete._keyManager.onKeydown(event);
      } else if (isArrowKey && this._canOpen()) {
        this.openPanel();
      }

      if (isArrowKey || this.autocomplete._keyManager.activeItem !== prevActiveItem) {
        this._scrollToOption(this.autocomplete._keyManager.activeItemIndex || 0);
      }
    }
  }

  _handleInput(event: KeyboardEvent): void {
    let target = event.target as HTMLInputElement;
    let value: number | string | null = target.value;

    // Based on `NumberValueAccessor` from forms.
    if (target.type === 'number') {
      value = value == '' ? null : parseFloat(value);
    }

    // If the input has a placeholder, IE will fire the `input` event on page load,
    // focus and blur, in addition to when the user actually changed the value. To
    // filter out all of the extra events, we save the value on focus and between
    // `input` events, and we check whether it changed.
    // See: https://connect.microsoft.com/IE/feedback/details/885747/
    if (this._previousValue !== value) {
      this._previousValue = value;
      this._onChange(value);

      if (this._canOpen() && this._document.activeElement === event.target) {
        this.openPanel();
      }
    }
  }

  _handleFocus(): void {
    if (!this._canOpenOnNextFocus) {
      this._canOpenOnNextFocus = true;
    } else if (this._canOpen()) {
      this._previousValue = this._element.nativeElement.value;
      this._attachOverlay();
      this._floatLabel(true);
    }
  }

  /**
   * In "auto" mode, the label will animate down as soon as focus is lost.
   * This causes the value to jump when selecting an option with the mouse.
   * This method manually floats the label until the panel can be closed.
   *
   * 在 `auto` 模式下，一旦焦点丢失，标签就会以动画形式下沉。当使用鼠标选择一个选项时，会导致该值跳动。此方法会手动浮起标签直到面板关闭。
   *
   * @param shouldAnimate Whether the label should be animated when it is floated.
   *
   * 该标签在浮起时是否应该是动画的。
   *
   */
  private _floatLabel(shouldAnimate = false): void {
    if (this._formField && this._formField.floatLabel === 'auto') {
      if (shouldAnimate) {
        this._formField._animateAndLockLabel();
      } else {
        this._formField.floatLabel = 'always';
      }

      this._manuallyFloatingLabel = true;
    }
  }

  /**
   * If the label has been manually elevated, return it to its normal state.
   *
   * 如果已经手动浮起了标签，就把它恢复到正常状态。
   *
   */
  private _resetLabel(): void {
    if (this._manuallyFloatingLabel) {
      this._formField.floatLabel = 'auto';
      this._manuallyFloatingLabel = false;
    }
  }

  /**
   * This method listens to a stream of panel closing actions and resets the
   * stream every time the option list changes.
   *
   * 此方法监听面板的关闭动作流，并在每次选项列表发生变化时重置该流。
   *
   */
  private _subscribeToClosingActions(): Subscription {
    const firstStable = this._zone.onStable.pipe(take(1));
    const optionChanges = this.autocomplete.options.changes.pipe(
      tap(() => this._positionStrategy.reapplyLastPosition()),
      // Defer emitting to the stream until the next tick, because changing
      // bindings in here will cause "changed after checked" errors.
      delay(0),
    );

    // When the zone is stable initially, and when the option list changes...
    return (
      merge(firstStable, optionChanges)
        .pipe(
          // create a new stream of panelClosingActions, replacing any previous streams
          // that were created, and flatten it so our stream only emits closing events...
          switchMap(() => {
            const wasOpen = this.panelOpen;
            this._resetActiveItem();
            this.autocomplete._setVisibility();

            if (this.panelOpen) {
              this._overlayRef!.updatePosition();

              // If the `panelOpen` state changed, we need to make sure to emit the `opened`
              // event, because we may not have emitted it when the panel was attached. This
              // can happen if the users opens the panel and there are no options, but the
              // options come in slightly later or as a result of the value changing.
              if (wasOpen !== this.panelOpen) {
                this.autocomplete.opened.emit();
              }
            }

            return this.panelClosingActions;
          }),
          // when the first closing event occurs...
          take(1),
        )
        // set the value, close the panel, and complete.
        .subscribe(event => this._setValueAndClose(event))
    );
  }

  /**
   * Destroys the autocomplete suggestion panel.
   *
   * 销毁自动完成建议面板。
   *
   */
  private _destroyPanel(): void {
    if (this._overlayRef) {
      this.closePanel();
      this._overlayRef.dispose();
      this._overlayRef = null;
    }
  }

  private _setTriggerValue(value: any): void {
    const toDisplay =
      this.autocomplete && this.autocomplete.displayWith
        ? this.autocomplete.displayWith(value)
        : value;

    // Simply falling back to an empty string if the display value is falsy does not work properly.
    // The display value can also be the number zero and shouldn't fall back to an empty string.
    const inputValue = toDisplay != null ? toDisplay : '';

    // If it's used within a `MatFormField`, we should set it through the property so it can go
    // through change detection.
    if (this._formField) {
      this._formField._control.value = inputValue;
    } else {
      this._element.nativeElement.value = inputValue;
    }

    this._previousValue = inputValue;
  }

  /**
   * This method closes the panel, and if a value is specified, also sets the associated
   * control to that value. It will also mark the control as dirty if this interaction
   * stemmed from the user.
   *
   * 这个方法会关闭此面板，如果指定了值，也会把其关联控件设置为该值。如果这种交互来自用户，它还会把此控件标记为脏的。
   *
   */
  private _setValueAndClose(event: MatOptionSelectionChange | null): void {
    if (event && event.source) {
      this._clearPreviousSelectedOption(event.source);
      this._setTriggerValue(event.source.value);
      this._onChange(event.source.value);
      this._element.nativeElement.focus();
      this.autocomplete._emitSelectEvent(event.source);
    }

    this.closePanel();
  }

  /**
   * Clear any previous selected option and emit a selection change event for this option
   *
   * 清除以前选定的所有选项并为该选项发出当前选择变更事件
   *
   */
  private _clearPreviousSelectedOption(skip: MatOption) {
    this.autocomplete.options.forEach(option => {
      if (option !== skip && option.selected) {
        option.deselect();
      }
    });
  }

  private _attachOverlay(): void {
    if (!this.autocomplete && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getMatAutocompleteMissingPanelError();
    }

    let overlayRef = this._overlayRef;

    if (!overlayRef) {
      this._portal = new TemplatePortal(this.autocomplete.template, this._viewContainerRef, {
        id: this._formField?.getLabelId(),
      });
      overlayRef = this._overlay.create(this._getOverlayConfig());
      this._overlayRef = overlayRef;

      // Use the `keydownEvents` in order to take advantage of
      // the overlay event targeting provided by the CDK overlay.
      overlayRef.keydownEvents().subscribe(event => {
        // Close when pressing ESCAPE or ALT + UP_ARROW, based on the a11y guidelines.
        // See: https://www.w3.org/TR/wai-aria-practices-1.1/#textbox-keyboard-interaction
        if (
          (event.keyCode === ESCAPE && !hasModifierKey(event)) ||
          (event.keyCode === UP_ARROW && hasModifierKey(event, 'altKey'))
        ) {
          this._closeKeyEventStream.next();
          this._resetActiveItem();

          // We need to stop propagation, otherwise the event will eventually
          // reach the input itself and cause the overlay to be reopened.
          event.stopPropagation();
          event.preventDefault();
        }
      });

      this._viewportSubscription = this._viewportRuler.change().subscribe(() => {
        if (this.panelOpen && overlayRef) {
          overlayRef.updateSize({width: this._getPanelWidth()});
        }
      });
    } else {
      // Update the trigger, panel width and direction, in case anything has changed.
      this._positionStrategy.setOrigin(this._getConnectedElement());
      overlayRef.updateSize({width: this._getPanelWidth()});
    }

    if (overlayRef && !overlayRef.hasAttached()) {
      overlayRef.attach(this._portal);
      this._closingActionsSubscription = this._subscribeToClosingActions();
    }

    const wasOpen = this.panelOpen;

    this.autocomplete._setVisibility();
    this.autocomplete._isOpen = this._overlayAttached = true;

    // We need to do an extra `panelOpen` check in here, because the
    // autocomplete won't be shown if there are no options.
    if (this.panelOpen && wasOpen !== this.panelOpen) {
      this.autocomplete.opened.emit();
    }
  }

  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPosition(),
      scrollStrategy: this._scrollStrategy(),
      width: this._getPanelWidth(),
      direction: this._dir,
      panelClass: this._defaults?.overlayPanelClass,
    });
  }

  private _getOverlayPosition(): PositionStrategy {
    const strategy = this._overlay
      .position()
      .flexibleConnectedTo(this._getConnectedElement())
      .withFlexibleDimensions(false)
      .withPush(false);

    this._setStrategyPositions(strategy);
    this._positionStrategy = strategy;
    return strategy;
  }

  /**
   * Sets the positions on a position strategy based on the directive's input state.
   *
   * 根据指令的输入状态设置某个定位策略上的一些位置值。
   *
   */
  private _setStrategyPositions(positionStrategy: FlexibleConnectedPositionStrategy) {
    // Note that we provide horizontal fallback positions, even though by default the dropdown
    // width matches the input, because consumers can override the width. See #18854.
    const belowPositions: ConnectedPosition[] = [
      {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
      {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
    ];

    // The overlay edge connected to the trigger should have squared corners, while
    // the opposite end has rounded corners. We apply a CSS class to swap the
    // border-radius based on the overlay position.
    const panelClass = this._aboveClass;
    const abovePositions: ConnectedPosition[] = [
      {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', panelClass},
      {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', panelClass},
    ];

    let positions: ConnectedPosition[];

    if (this.position === 'above') {
      positions = abovePositions;
    } else if (this.position === 'below') {
      positions = belowPositions;
    } else {
      positions = [...belowPositions, ...abovePositions];
    }

    positionStrategy.withPositions(positions);
  }

  private _getConnectedElement(): ElementRef<HTMLElement> {
    if (this.connectedTo) {
      return this.connectedTo.elementRef;
    }

    return this._formField ? this._formField.getConnectedOverlayOrigin() : this._element;
  }

  private _getPanelWidth(): number | string {
    return this.autocomplete.panelWidth || this._getHostWidth();
  }

  /**
   * Returns the width of the input element, so the panel width can match it.
   *
   * 返回输入框元素的宽度，面板的宽度可以适配它。
   *
   */
  private _getHostWidth(): number {
    return this._getConnectedElement().nativeElement.getBoundingClientRect().width;
  }

  /**
   * Resets the active item to -1 so arrow events will activate the
   * correct options, or to 0 if the consumer opted into it.
   *
   * 活动条目的值会重置为 -1，所以方向键事件会激活正确的选项，如果消费者选择了它，则为 0。
   *
   */
  private _resetActiveItem(): void {
    const autocomplete = this.autocomplete;

    if (autocomplete.autoActiveFirstOption) {
      // Note that we go through `setFirstItemActive`, rather than `setActiveItem(0)`, because
      // the former will find the next enabled option, if the first one is disabled.
      autocomplete._keyManager.setFirstItemActive();
    } else {
      autocomplete._keyManager.setActiveItem(-1);
    }
  }

  /**
   * Determines whether the panel can be opened.
   *
   * 确定是否可以打开面板。
   *
   */
  private _canOpen(): boolean {
    const element = this._element.nativeElement;
    return !element.readOnly && !element.disabled && !this._autocompleteDisabled;
  }

  /**
   * Use defaultView of injected document if available or fallback to global window reference
   *
   * 如果可用，则使用注入文档中的 defaultView，否则回退到全局窗口引用
   *
   */
  private _getWindow(): Window {
    return this._document?.defaultView || window;
  }

  /**
   * Scrolls to a particular option in the list.
   *
   * 滚动到列表中的某个特定选项。
   *
   */
  private _scrollToOption(index: number): void {
    // Given that we are not actually focusing active options, we must manually adjust scroll
    // to reveal options below the fold. First, we find the offset of the option from the top
    // of the panel. If that offset is below the fold, the new scrollTop will be the offset -
    // the panel height + the option height, so the active option will be just visible at the
    // bottom of the panel. If that offset is above the top of the visible panel, the new scrollTop
    // will become the offset. If that offset is visible within the panel already, the scrollTop is
    // not adjusted.
    const autocomplete = this.autocomplete;
    const labelCount = _countGroupLabelsBeforeOption(
      index,
      autocomplete.options,
      autocomplete.optionGroups,
    );

    if (index === 0 && labelCount === 1) {
      // If we've got one group label before the option and we're at the top option,
      // scroll the list to the top. This is better UX than scrolling the list to the
      // top of the option, because it allows the user to read the top group's label.
      autocomplete._setScrollTop(0);
    } else if (autocomplete.panel) {
      const option = autocomplete.options.toArray()[index];

      if (option) {
        const element = option._getHostElement();
        const newScrollPosition = _getOptionScrollPosition(
          element.offsetTop,
          element.offsetHeight,
          autocomplete._getScrollTop(),
          autocomplete.panel.nativeElement.offsetHeight,
        );

        autocomplete._setScrollTop(newScrollPosition);
      }
    }
  }
}

@Directive({
  selector: `input[matAutocomplete], textarea[matAutocomplete]`,
  host: {
    'class': 'mat-autocomplete-trigger',
    '[attr.autocomplete]': 'autocompleteAttribute',
    '[attr.role]': 'autocompleteDisabled ? null : "combobox"',
    '[attr.aria-autocomplete]': 'autocompleteDisabled ? null : "list"',
    '[attr.aria-activedescendant]': '(panelOpen && activeOption) ? activeOption.id : null',
    '[attr.aria-expanded]': 'autocompleteDisabled ? null : panelOpen.toString()',
    '[attr.aria-owns]': '(autocompleteDisabled || !panelOpen) ? null : autocomplete?.id',
    '[attr.aria-haspopup]': '!autocompleteDisabled',
    // Note: we use `focusin`, as opposed to `focus`, in order to open the panel
    // a little earlier. This avoids issues where IE delays the focusing of the input.
    '(focusin)': '_handleFocus()',
    '(blur)': '_onTouched()',
    '(input)': '_handleInput($event)',
    '(keydown)': '_handleKeydown($event)',
  },
  exportAs: 'matAutocompleteTrigger',
  providers: [MAT_AUTOCOMPLETE_VALUE_ACCESSOR],
})
export class MatAutocompleteTrigger extends _MatAutocompleteTriggerBase {
  protected _aboveClass = 'mat-autocomplete-panel-above';
}
