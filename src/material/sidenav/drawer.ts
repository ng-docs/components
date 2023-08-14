/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AnimationEvent} from '@angular/animations';
import {
  FocusMonitor,
  FocusOrigin,
  FocusTrap,
  FocusTrapFactory,
  InteractivityChecker,
} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {ESCAPE, hasModifierKey} from '@angular/cdk/keycodes';
import {Platform} from '@angular/cdk/platform';
import {CdkScrollable, ScrollDispatcher, ViewportRuler} from '@angular/cdk/scrolling';
import {DOCUMENT} from '@angular/common';
import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DoCheck,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  InjectionToken,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {fromEvent, merge, Observable, Subject} from 'rxjs';
import {
  debounceTime,
  filter,
  map,
  startWith,
  take,
  takeUntil,
  distinctUntilChanged,
  mapTo,
} from 'rxjs/operators';
import {matDrawerAnimations} from './drawer-animations';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Throws an exception when two MatDrawer are matching the same position.
 *
 * 当两个 MatDrawer 匹配同一个位置时，抛出一个异常。
 *
 * @docs-private
 */
export function throwMatDuplicatedDrawerError(position: string) {
  throw Error(`A drawer was already declared for 'position="${position}"'`);
}

/**
 * Options for where to set focus to automatically on dialog open
 *
 * 用于在对话框打开时自动将焦点设置到何处的选项
 *
 */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading';

/**
 * Result of the toggle promise that indicates the state of the drawer.
 *
 * 开关 Promise 的结果，用于标出抽屉的状态。
 *
 */
export type MatDrawerToggleResult = 'open' | 'close';

/**
 * Drawer and SideNav display modes.
 *
 * 抽屉和侧边导航显示模式。
 *
 */
export type MatDrawerMode = 'over' | 'push' | 'side';

/**
 * Configures whether drawers should use auto sizing by default.
 *
 * 配置默认情况下抽屉是否应该自动调整大小。
 *
 */
export const MAT_DRAWER_DEFAULT_AUTOSIZE = new InjectionToken<boolean>(
  'MAT_DRAWER_DEFAULT_AUTOSIZE',
  {
    providedIn: 'root',
    factory: MAT_DRAWER_DEFAULT_AUTOSIZE_FACTORY,
  },
);

/**
 * Used to provide a drawer container to a drawer while avoiding circular references.
 *
 * 用来为抽屉提供一个抽屉容器，同时避免使用循环引用。
 *
 * @docs-private
 */
export const MAT_DRAWER_CONTAINER = new InjectionToken('MAT_DRAWER_CONTAINER');

/** @docs-private */
export function MAT_DRAWER_DEFAULT_AUTOSIZE_FACTORY(): boolean {
  return false;
}

@Component({
  selector: 'mat-drawer-content',
  template: '<ng-content></ng-content>',
  host: {
    'class': 'mat-drawer-content',
    '[style.margin-left.px]': '_container._contentMargins.left',
    '[style.margin-right.px]': '_container._contentMargins.right',
    'ngSkipHydration': '',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: CdkScrollable,
      useExisting: MatDrawerContent,
    },
  ],
})
export class MatDrawerContent extends CdkScrollable implements AfterContentInit {
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    @Inject(forwardRef(() => MatDrawerContainer)) public _container: MatDrawerContainer,
    elementRef: ElementRef<HTMLElement>,
    scrollDispatcher: ScrollDispatcher,
    ngZone: NgZone,
  ) {
    super(elementRef, scrollDispatcher, ngZone);
  }

  ngAfterContentInit() {
    this._container._contentMarginChanges.subscribe(() => {
      this._changeDetectorRef.markForCheck();
    });
  }
}

/**
 * This component corresponds to a drawer that can be opened on the drawer container.
 *
 * 该组件对应于一个可以在抽屉容器上打开的抽屉。
 *
 */
@Component({
  selector: 'mat-drawer',
  exportAs: 'matDrawer',
  templateUrl: 'drawer.html',
  animations: [matDrawerAnimations.transformDrawer],
  host: {
    'class': 'mat-drawer',
    // must prevent the browser from aligning text based on value
    '[attr.align]': 'null',
    '[class.mat-drawer-end]': 'position === "end"',
    '[class.mat-drawer-over]': 'mode === "over"',
    '[class.mat-drawer-push]': 'mode === "push"',
    '[class.mat-drawer-side]': 'mode === "side"',
    '[class.mat-drawer-opened]': 'opened',
    'tabIndex': '-1',
    '[@transform]': '_animationState',
    '(@transform.start)': '_animationStarted.next($event)',
    '(@transform.done)': '_animationEnd.next($event)',
    'ngSkipHydration': '',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatDrawer implements AfterViewInit, AfterContentChecked, OnDestroy {
  private _focusTrap: FocusTrap;
  private _elementFocusedBeforeDrawerWasOpened: HTMLElement | null = null;

  /**
   * Whether the drawer is initialized. Used for disabling the initial animation.
   *
   * 抽屉是否已初始化。用于禁用初始动画。
   *
   */
  private _enableAnimations = false;

  /**
   * Whether the view of the component has been attached.
   *
   * 组件的视图是否已附着上。
   *
   */
  private _isAttached: boolean;

  /**
   * Anchor node used to restore the drawer to its initial position.
   *
   * 用于将抽屉恢复到其初始位置的锚节点。
   *
   */
  private _anchor: Comment | null;

  /**
   * The side that the drawer is attached to.
   *
   * 抽屉附着到的一侧。
   *
   */
  @Input()
  get position(): 'start' | 'end' {
    return this._position;
  }
  set position(value: 'start' | 'end') {
    // Make sure we have a valid value.
    value = value === 'end' ? 'end' : 'start';
    if (value !== this._position) {
      // Static inputs in Ivy are set before the element is in the DOM.
      if (this._isAttached) {
        this._updatePositionInParent(value);
      }

      this._position = value;
      this.onPositionChanged.emit();
    }
  }
  private _position: 'start' | 'end' = 'start';

  /**
   * Mode of the drawer; one of 'over', 'push' or 'side'.
   *
   * 抽屉的模式：'over'、'push' 或 'side'之一。
   *
   */
  @Input()
  get mode(): MatDrawerMode {
    return this._mode;
  }
  set mode(value: MatDrawerMode) {
    this._mode = value;
    this._updateFocusTrapState();
    this._modeChanged.next();
  }
  private _mode: MatDrawerMode = 'over';

  /**
   * Whether the drawer can be closed with the escape key or by clicking on the backdrop.
   *
   * 抽屉是否可以通过 escape 或点击背景板来关闭。
   *
   */
  @Input()
  get disableClose(): boolean {
    return this._disableClose;
  }
  set disableClose(value: BooleanInput) {
    this._disableClose = coerceBooleanProperty(value);
  }
  private _disableClose: boolean = false;

  /**
   * Whether the drawer should focus the first focusable element automatically when opened.
   * Defaults to false in when `mode` is set to `side`, otherwise defaults to `true`. If explicitly
   * enabled, focus will be moved into the sidenav in `side` mode as well.
   *
   * 抽屉是否应该在打开时自动聚焦于第一个可聚焦元素。`mode` 设置为 `side` 时默认为 false，否则默认为 `true`。如果显式启用，焦点也可以移到 `side` 模式下的侧边导航中。
   *
   * @breaking-change 14.0.0 Remove boolean option from autoFocus. Use string or AutoFocusTarget
   * instead.
   *
   * 从 autoFocus 中删除布尔选项。请改用字符串或 AutoFocusTarget。
   *
   */
  @Input()
  get autoFocus(): AutoFocusTarget | string | boolean {
    const value = this._autoFocus;

    // Note that usually we don't allow autoFocus to be set to `first-tabbable` in `side` mode,
    // because we don't know how the sidenav is being used, but in some cases it still makes
    // sense to do it. The consumer can explicitly set `autoFocus`.
    if (value == null) {
      if (this.mode === 'side') {
        return 'dialog';
      } else {
        return 'first-tabbable';
      }
    }
    return value;
  }
  set autoFocus(value: AutoFocusTarget | string | BooleanInput) {
    if (value === 'true' || value === 'false' || value == null) {
      value = coerceBooleanProperty(value);
    }
    this._autoFocus = value;
  }
  private _autoFocus: AutoFocusTarget | string | boolean | undefined;

  /**
   * Whether the drawer is opened. We overload this because we trigger an event when it
   * starts or end.
   *
   * 抽屉是否打开了。我们把它重载了，因为我们要在它开始或结束时触发一个事件。
   *
   */
  @Input()
  get opened(): boolean {
    return this._opened;
  }
  set opened(value: BooleanInput) {
    this.toggle(coerceBooleanProperty(value));
  }
  private _opened: boolean = false;

  /**
   * How the sidenav was opened (keypress, mouse click etc.)
   *
   * 侧边导航是如何打开的（按键，鼠标点击等）
   *
   */
  private _openedVia: FocusOrigin | null;

  /**
   * Emits whenever the drawer has started animating.
   *
   * 当抽屉开始动画时，它会触发。
   *
   */
  readonly _animationStarted = new Subject<AnimationEvent>();

  /**
   * Emits whenever the drawer is done animating.
   *
   * 抽屉做完动画后，就会触发。
   *
   */
  readonly _animationEnd = new Subject<AnimationEvent>();

  /**
   * Current state of the sidenav animation.
   *
   * 侧边导航动画的当前状态。
   *
   */
  _animationState: 'open-instant' | 'open' | 'void' = 'void';

  /**
   * Event emitted when the drawer open state is changed.
   *
   * 抽屉打开状态发生变化时发出的事件。
   *
   */
  @Output() readonly openedChange: EventEmitter<boolean> =
    // Note this has to be async in order to avoid some issues with two-bindings (see #8872).
    new EventEmitter<boolean>(/* isAsync */ true);

  /**
   * Event emitted when the drawer has been opened.
   *
   * 抽屉打开时发出的事件。
   *
   */
  @Output('opened')
  readonly _openedStream = this.openedChange.pipe(
    filter(o => o),
    map(() => {}),
  );

  /**
   * Event emitted when the drawer has started opening.
   *
   * 抽屉开始打开时发出的事件。
   *
   */
  @Output()
  readonly openedStart: Observable<void> = this._animationStarted.pipe(
    filter(e => e.fromState !== e.toState && e.toState.indexOf('open') === 0),
    mapTo(undefined),
  );

  /**
   * Event emitted when the drawer has been closed.
   *
   * 抽屉关闭后发出的事件。
   *
   */
  @Output('closed')
  readonly _closedStream = this.openedChange.pipe(
    filter(o => !o),
    map(() => {}),
  );

  /**
   * Event emitted when the drawer has started closing.
   *
   * 抽屉开始关闭时发出的事件。
   *
   */
  @Output()
  readonly closedStart: Observable<void> = this._animationStarted.pipe(
    filter(e => e.fromState !== e.toState && e.toState === 'void'),
    mapTo(undefined),
  );

  /**
   * Emits when the component is destroyed.
   *
   * 当本组件被销毁时会触发。
   *
   */
  private readonly _destroyed = new Subject<void>();

  /**
   * Event emitted when the drawer's position changes.
   *
   * 当抽屉的位置发生变化时会触发。
   *
   */
  // tslint:disable-next-line:no-output-on-prefix
  @Output('positionChanged') readonly onPositionChanged = new EventEmitter<void>();

  /**
   * Reference to the inner element that contains all the content.
   *
   * 一个引用，指向包含所有内容的内部元素。
   *
   */
  @ViewChild('content') _content: ElementRef<HTMLElement>;

  /**
   * An observable that emits when the drawer mode changes. This is used by the drawer container to
   * to know when to when the mode changes so it can adapt the margins on the content.
   *
   * 当抽屉模式发生变化时会触发。抽屉容器会用它来了解何时模式发生变化，以便它能调整内容的边距。
   *
   */
  readonly _modeChanged = new Subject<void>();

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    private _focusTrapFactory: FocusTrapFactory,
    private _focusMonitor: FocusMonitor,
    private _platform: Platform,
    private _ngZone: NgZone,
    private readonly _interactivityChecker: InteractivityChecker,
    @Optional() @Inject(DOCUMENT) private _doc: any,
    @Optional() @Inject(MAT_DRAWER_CONTAINER) public _container?: MatDrawerContainer,
  ) {
    this.openedChange.subscribe((opened: boolean) => {
      if (opened) {
        if (this._doc) {
          this._elementFocusedBeforeDrawerWasOpened = this._doc.activeElement as HTMLElement;
        }

        this._takeFocus();
      } else if (this._isFocusWithinDrawer()) {
        this._restoreFocus(this._openedVia || 'program');
      }
    });

    /**
     * Listen to `keydown` events outside the zone so that change detection is not run every
     * time a key is pressed. Instead we re-enter the zone only if the `ESC` key is pressed
     * and we don't have close disabled.
     *
     * 监听 `keydown` 事件，以便每次按键时都不再运行变更检测。相反，只有当按下 `ESC` 键并且没有禁止关闭时，我们才会重新进行变更检测。
     *
     */
    this._ngZone.runOutsideAngular(() => {
      (fromEvent(this._elementRef.nativeElement, 'keydown') as Observable<KeyboardEvent>)
        .pipe(
          filter(event => {
            return event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event);
          }),
          takeUntil(this._destroyed),
        )
        .subscribe(event =>
          this._ngZone.run(() => {
            this.close();
            event.stopPropagation();
            event.preventDefault();
          }),
        );
    });

    // We need a Subject with distinctUntilChanged, because the `done` event
    // fires twice on some browsers. See https://github.com/angular/angular/issues/24084
    this._animationEnd
      .pipe(
        distinctUntilChanged((x, y) => {
          return x.fromState === y.fromState && x.toState === y.toState;
        }),
      )
      .subscribe((event: AnimationEvent) => {
        const {fromState, toState} = event;

        if (
          (toState.indexOf('open') === 0 && fromState === 'void') ||
          (toState === 'void' && fromState.indexOf('open') === 0)
        ) {
          this.openedChange.emit(this._opened);
        }
      });
  }

  /**
   * Focuses the provided element. If the element is not focusable, it will add a tabIndex
   * attribute to forcefully focus it. The attribute is removed after focus is moved.
   *
   * 聚焦所提供的元素。如果元素不可聚焦，它将添加一个 tabIndex 属性来强制聚焦它。移动焦点后移除该属性。
   *
   * @param element The element to focus.
   *
   * 要聚焦的元素。
   *
   */
  private _forceFocus(element: HTMLElement, options?: FocusOptions) {
    if (!this._interactivityChecker.isFocusable(element)) {
      element.tabIndex = -1;
      // The tabindex attribute should be removed to avoid navigating to that element again
      this._ngZone.runOutsideAngular(() => {
        const callback = () => {
          element.removeEventListener('blur', callback);
          element.removeEventListener('mousedown', callback);
          element.removeAttribute('tabindex');
        };

        element.addEventListener('blur', callback);
        element.addEventListener('mousedown', callback);
      });
    }
    element.focus(options);
  }

  /**
   * Focuses the first element that matches the given selector within the focus trap.
   *
   * 聚焦与焦点陷阱中的给定选择器匹配的第一个元素。
   *
   * @param selector The CSS selector for the element to set focus to.
   *
   * 要设置焦点的元素的 CSS 选择器。
   *
   */
  private _focusByCssSelector(selector: string, options?: FocusOptions) {
    let elementToFocus = this._elementRef.nativeElement.querySelector(
      selector,
    ) as HTMLElement | null;
    if (elementToFocus) {
      this._forceFocus(elementToFocus, options);
    }
  }

  /**
   * Moves focus into the drawer. Note that this works even if
   * the focus trap is disabled in `side` mode.
   *
   * 把焦点移到抽屉里。即使 `side` 模式下禁用了焦点陷阱，这也能正常工作。
   *
   */
  private _takeFocus() {
    if (!this._focusTrap) {
      return;
    }

    const element = this._elementRef.nativeElement;

    // When autoFocus is not on the sidenav, if the element cannot be focused or does
    // not exist, focus the sidenav itself so the keyboard navigation still works.
    // We need to check that `focus` is a function due to Universal.
    switch (this.autoFocus) {
      case false:
      case 'dialog':
        return;
      case true:
      case 'first-tabbable':
        this._focusTrap.focusInitialElementWhenReady().then(hasMovedFocus => {
          if (!hasMovedFocus && typeof this._elementRef.nativeElement.focus === 'function') {
            element.focus();
          }
        });
        break;
      case 'first-heading':
        this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
        break;
      default:
        this._focusByCssSelector(this.autoFocus!);
        break;
    }
  }

  /**
   * Restores focus to the element that was originally focused when the drawer opened.
   * If no element was focused at that time, the focus will be restored to the drawer.
   *
   * 将焦点返还给抽屉打开时拥有焦点的元素。如果此时没有任何元素有焦点，焦点就会还给本抽屉。
   *
   */
  private _restoreFocus(focusOrigin: Exclude<FocusOrigin, null>) {
    if (this.autoFocus === 'dialog') {
      return;
    }

    if (this._elementFocusedBeforeDrawerWasOpened) {
      this._focusMonitor.focusVia(this._elementFocusedBeforeDrawerWasOpened, focusOrigin);
    } else {
      this._elementRef.nativeElement.blur();
    }

    this._elementFocusedBeforeDrawerWasOpened = null;
  }

  /**
   * Whether focus is currently within the drawer.
   *
   * 焦点目前是否在抽屉内？
   *
   */
  private _isFocusWithinDrawer(): boolean {
    const activeEl = this._doc.activeElement;
    return !!activeEl && this._elementRef.nativeElement.contains(activeEl);
  }

  ngAfterViewInit() {
    this._isAttached = true;
    this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
    this._updateFocusTrapState();

    // Only update the DOM position when the sidenav is positioned at
    // the end since we project the sidenav before the content by default.
    if (this._position === 'end') {
      this._updatePositionInParent('end');
    }
  }

  ngAfterContentChecked() {
    // Enable the animations after the lifecycle hooks have run, in order to avoid animating
    // drawers that are open by default. When we're on the server, we shouldn't enable the
    // animations, because we don't want the drawer to animate the first time the user sees
    // the page.
    if (this._platform.isBrowser) {
      this._enableAnimations = true;
    }
  }

  ngOnDestroy() {
    if (this._focusTrap) {
      this._focusTrap.destroy();
    }

    this._anchor?.remove();
    this._anchor = null;
    this._animationStarted.complete();
    this._animationEnd.complete();
    this._modeChanged.complete();
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Open the drawer.
   *
   * 打开抽屉。
   *
   * @param openedVia Whether the drawer was opened by a key press, mouse click or programmatically.
   * Used for focus management after the sidenav is closed.
   *
   * 是通过按键、鼠标点击还是编程的方式打开抽屉。侧边导航关闭后，用于焦点管理。
   *
   */
  open(openedVia?: FocusOrigin): Promise<MatDrawerToggleResult> {
    return this.toggle(true, openedVia);
  }

  /**
   * Close the drawer.
   *
   * 关闭抽屉。
   *
   */
  close(): Promise<MatDrawerToggleResult> {
    return this.toggle(false);
  }

  /**
   * Closes the drawer with context that the backdrop was clicked.
   *
   * 在单击背景板时关闭抽屉。
   *
   */
  _closeViaBackdropClick(): Promise<MatDrawerToggleResult> {
    // If the drawer is closed upon a backdrop click, we always want to restore focus. We
    // don't need to check whether focus is currently in the drawer, as clicking on the
    // backdrop causes blurs the active element.
    return this._setOpen(/* isOpen */ false, /* restoreFocus */ true, 'mouse');
  }

  /**
   * Toggle this drawer.
   *
   * 切换这个抽屉。
   *
   * @param isOpen Whether the drawer should be open.
   *
   * 抽屉是否应该打开。
   *
   * @param openedVia Whether the drawer was opened by a key press, mouse click or programmatically.
   * Used for focus management after the sidenav is closed.
   *
   * 通过按键、鼠标点击还是编程的方式打开抽屉。侧边导航关闭后，用于焦点管理。
   *
   */
  toggle(isOpen: boolean = !this.opened, openedVia?: FocusOrigin): Promise<MatDrawerToggleResult> {
    // If the focus is currently inside the drawer content and we are closing the drawer,
    // restore the focus to the initially focused element (when the drawer opened).
    if (isOpen && openedVia) {
      this._openedVia = openedVia;
    }

    const result = this._setOpen(
      isOpen,
      /* restoreFocus */ !isOpen && this._isFocusWithinDrawer(),
      this._openedVia || 'program',
    );

    if (!isOpen) {
      this._openedVia = null;
    }

    return result;
  }

  /**
   * Toggles the opened state of the drawer.
   *
   * 切换抽屉的打开状态。
   *
   * @param isOpen Whether the drawer should open or close.
   *
   * 抽屉是否应该打开或关闭。
   *
   * @param restoreFocus Whether focus should be restored on close.
   *
   * 是否应该在关闭时还原焦点。
   *
   * @param focusOrigin Origin to use when restoring focus.
   *
   * 可以在打开抽屉时自动设定焦点来源。稍后当抽屉关闭时要返还焦点时，会使用焦点来源。
   *
   */
  private _setOpen(
    isOpen: boolean,
    restoreFocus: boolean,
    focusOrigin: Exclude<FocusOrigin, null>,
  ): Promise<MatDrawerToggleResult> {
    this._opened = isOpen;

    if (isOpen) {
      this._animationState = this._enableAnimations ? 'open' : 'open-instant';
    } else {
      this._animationState = 'void';
      if (restoreFocus) {
        this._restoreFocus(focusOrigin);
      }
    }

    this._updateFocusTrapState();

    return new Promise<MatDrawerToggleResult>(resolve => {
      this.openedChange.pipe(take(1)).subscribe(open => resolve(open ? 'open' : 'close'));
    });
  }

  _getWidth(): number {
    return this._elementRef.nativeElement ? this._elementRef.nativeElement.offsetWidth || 0 : 0;
  }

  /**
   * Updates the enabled state of the focus trap.
   *
   * 更新焦点陷阱的启用状态。
   *
   */
  private _updateFocusTrapState() {
    if (this._focusTrap) {
      // Trap focus only if the backdrop is enabled. Otherwise, allow end user to interact with the
      // sidenav content.
      this._focusTrap.enabled = !!this._container?.hasBackdrop;
    }
  }

  /**
   * Updates the position of the drawer in the DOM. We need to move the element around ourselves
   * when it's in the `end` position so that it comes after the content and the visual order
   * matches the tab order. We also need to be able to move it back to `start` if the sidenav
   * started off as `end` and was changed to `start`.
   *
   * 更新抽屉在 DOM 中的位置。当元素处于 `end` 位置时，我们需要在自己周围移动元素，以便它位于内容之后，并且视觉顺序与 tab 顺序匹配。如果侧边导航从 `end` 开始并且已改为 `start`，则我们也要能把它改回 `start`。
   *
   */
  private _updatePositionInParent(newPosition: 'start' | 'end') {
    const element = this._elementRef.nativeElement;
    const parent = element.parentNode!;

    if (newPosition === 'end') {
      if (!this._anchor) {
        this._anchor = this._doc.createComment('mat-drawer-anchor')!;
        parent.insertBefore(this._anchor!, element);
      }

      parent.appendChild(element);
    } else if (this._anchor) {
      this._anchor.parentNode!.insertBefore(element, this._anchor);
    }
  }
}

/**
 * `<mat-drawer-container>` component.
 *
 * `<mat-drawer-container>` 组件。
 *
 * This is the parent component to one or two `<mat-drawer>`s that validates the state internally
 * and coordinates the backdrop and content styling.
 *
 * 这是一两个 `<mat-drawer>` 的父组件，用于在内部验证状态，并协调背景板和内容的样式。
 *
 */
@Component({
  selector: 'mat-drawer-container',
  exportAs: 'matDrawerContainer',
  templateUrl: 'drawer-container.html',
  styleUrls: ['drawer.css'],
  host: {
    'class': 'mat-drawer-container',
    '[class.mat-drawer-container-explicit-backdrop]': '_backdropOverride',
    'ngSkipHydration': '',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: MAT_DRAWER_CONTAINER,
      useExisting: MatDrawerContainer,
    },
  ],
})
export class MatDrawerContainer implements AfterContentInit, DoCheck, OnDestroy {
  /**
   * All drawers in the container. Includes drawers from inside nested containers.
   *
   * 容器内的所有抽屉。包括来自嵌套容器内部的抽屉。
   *
   */
  @ContentChildren(MatDrawer, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  _allDrawers: QueryList<MatDrawer>;

  /**
   * Drawers that belong to this container.
   *
   * 那些属于这个容器的抽屉。
   *
   */
  _drawers = new QueryList<MatDrawer>();

  @ContentChild(MatDrawerContent) _content: MatDrawerContent;
  @ViewChild(MatDrawerContent) _userContent: MatDrawerContent;

  /**
   * The drawer child with the `start` position.
   *
   * `start` 位置的子抽屉式。
   *
   */
  get start(): MatDrawer | null {
    return this._start;
  }

  /**
   * The drawer child with the `end` position.
   *
   * `end` 位置的子抽屉式。
   *
   */
  get end(): MatDrawer | null {
    return this._end;
  }

  /**
   * Whether to automatically resize the container whenever
   * the size of any of its drawers changes.
   *
   * 是否要在任何抽屉大小发生变化时自动调整容器大小。
   *
   * **Use at your own risk!** Enabling this option can cause layout thrashing by measuring
   * the drawers on every change detection cycle. Can be configured globally via the
   * `MAT_DRAWER_DEFAULT_AUTOSIZE` token.
   *
   * **使用时风险自负！** 通过在每个变更检测周期中测量抽屉，启用此选项会导致布局抖动。可以通过 `MAT_DRAWER_DEFAULT_AUTOSIZE` 令牌进行全局配置。
   *
   */
  @Input()
  get autosize(): boolean {
    return this._autosize;
  }
  set autosize(value: BooleanInput) {
    this._autosize = coerceBooleanProperty(value);
  }
  private _autosize: boolean;

  /**
   * Whether the drawer container should have a backdrop while one of the sidenavs is open.
   * If explicitly set to `true`, the backdrop will be enabled for drawers in the `side`
   * mode as well.
   *
   * 当其中一个侧边导航打开时，抽屉容器是否应该有背景板。如果明确设置为 `true`，`side` 模式下将为抽屉启用背景板。
   *
   */
  @Input()
  get hasBackdrop(): boolean {
    return this._drawerHasBackdrop(this._start) || this._drawerHasBackdrop(this._end);
  }
  set hasBackdrop(value: BooleanInput) {
    this._backdropOverride = value == null ? null : coerceBooleanProperty(value);
  }
  _backdropOverride: boolean | null;

  /**
   * Event emitted when the drawer backdrop is clicked.
   *
   * 单击抽屉背景板时发出的事件。
   *
   */
  @Output() readonly backdropClick: EventEmitter<void> = new EventEmitter<void>();

  /**
   * The drawer at the start/end position, independent of direction.
   *
   * 抽屉的起点/终点位置，与方向无关。
   *
   */
  private _start: MatDrawer | null;
  private _end: MatDrawer | null;

  /**
   * The drawer at the left/right. When direction changes, these will change as well.
   * They're used as aliases for the above to set the left/right style properly.
   * In LTR, \_left == \_start and \_right == \_end.
   * In RTL, \_left == \_end and \_right == \_start.
   *
   * 左/右抽屉柜。当方向发生变化时，它们也会发生变化。它们被用作上面的别名来正确设置左/右样式。
   * 在 LTR 布局中，\_left == \_start 且 \_right == \_end。在 RTL 布局中，\_left == \_end 且 \_right == \_start。
   *
   */
  private _left: MatDrawer | null;
  private _right: MatDrawer | null;

  /**
   * Emits when the component is destroyed.
   *
   * 当组件被销毁时触发。
   *
   */
  private readonly _destroyed = new Subject<void>();

  /**
   * Emits on every ngDoCheck. Used for debouncing reflows.
   *
   * 每次 ngDoCheck 时都会触发。用于去除重排（reflow）。
   *
   */
  private readonly _doCheckSubject = new Subject<void>();

  /**
   * Margins to be applied to the content. These are used to push / shrink the drawer content when a
   * drawer is open. We use margin rather than transform even for push mode because transform breaks
   * fixed position elements inside of the transformed element.
   *
   * 要应用于内容的边距。它们用于在抽屉打开时推/缩抽屉内容。我们甚至在 push 模式下都使用了 margin 而不是 transform，因为 transform 会修改转换元素内部的固定位置元素。
   *
   */
  _contentMargins: {left: number | null; right: number | null} = {left: null, right: null};

  readonly _contentMarginChanges = new Subject<{left: number | null; right: number | null}>();

  /**
   * Reference to the CdkScrollable instance that wraps the scrollable content.
   *
   * 对包装了可滚动内容的 CdkScrollable 实例的引用。
   *
   */
  get scrollable(): CdkScrollable {
    return this._userContent || this._content;
  }

  constructor(
    @Optional() private _dir: Directionality,
    private _element: ElementRef<HTMLElement>,
    private _ngZone: NgZone,
    private _changeDetectorRef: ChangeDetectorRef,
    viewportRuler: ViewportRuler,
    @Inject(MAT_DRAWER_DEFAULT_AUTOSIZE) defaultAutosize = false,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) private _animationMode?: string,
  ) {
    // If a `Dir` directive exists up the tree, listen direction changes
    // and update the left/right properties to point to the proper start/end.
    if (_dir) {
      _dir.change.pipe(takeUntil(this._destroyed)).subscribe(() => {
        this._validateDrawers();
        this.updateContentMargins();
      });
    }

    // Since the minimum width of the sidenav depends on the viewport width,
    // we need to recompute the margins if the viewport changes.
    viewportRuler
      .change()
      .pipe(takeUntil(this._destroyed))
      .subscribe(() => this.updateContentMargins());

    this._autosize = defaultAutosize;
  }

  ngAfterContentInit() {
    this._allDrawers.changes
      .pipe(startWith(this._allDrawers), takeUntil(this._destroyed))
      .subscribe((drawer: QueryList<MatDrawer>) => {
        this._drawers.reset(drawer.filter(item => !item._container || item._container === this));
        this._drawers.notifyOnChanges();
      });

    this._drawers.changes.pipe(startWith(null)).subscribe(() => {
      this._validateDrawers();

      this._drawers.forEach((drawer: MatDrawer) => {
        this._watchDrawerToggle(drawer);
        this._watchDrawerPosition(drawer);
        this._watchDrawerMode(drawer);
      });

      if (
        !this._drawers.length ||
        this._isDrawerOpen(this._start) ||
        this._isDrawerOpen(this._end)
      ) {
        this.updateContentMargins();
      }

      this._changeDetectorRef.markForCheck();
    });

    // Avoid hitting the NgZone through the debounce timeout.
    this._ngZone.runOutsideAngular(() => {
      this._doCheckSubject
        .pipe(
          debounceTime(10), // Arbitrary debounce time, less than a frame at 60fps
          takeUntil(this._destroyed),
        )
        .subscribe(() => this.updateContentMargins());
    });
  }

  ngOnDestroy() {
    this._contentMarginChanges.complete();
    this._doCheckSubject.complete();
    this._drawers.destroy();
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Calls `open` of both start and end drawers
   *
   * 对开始和结束处的抽屉调用 `open`
   *
   */
  open(): void {
    this._drawers.forEach(drawer => drawer.open());
  }

  /**
   * Calls `close` of both start and end drawers
   *
   * 对开始和结束处的抽屉调用 `close`
   *
   */
  close(): void {
    this._drawers.forEach(drawer => drawer.close());
  }

  /**
   * Recalculates and updates the inline styles for the content. Note that this should be used
   * sparingly, because it causes a reflow.
   *
   * 重新计算并更新该内容的内联样式。请注意，这应该谨慎使用，因为它会导致重排（reflow）。
   *
   */
  updateContentMargins() {
    // 1. For drawers in `over` mode, they don't affect the content.
    // 2. For drawers in `side` mode they should shrink the content. We do this by adding to the
    //    left margin (for left drawer) or right margin (for right the drawer).
    // 3. For drawers in `push` mode the should shift the content without resizing it. We do this by
    //    adding to the left or right margin and simultaneously subtracting the same amount of
    //    margin from the other side.
    let left = 0;
    let right = 0;

    if (this._left && this._left.opened) {
      if (this._left.mode == 'side') {
        left += this._left._getWidth();
      } else if (this._left.mode == 'push') {
        const width = this._left._getWidth();
        left += width;
        right -= width;
      }
    }

    if (this._right && this._right.opened) {
      if (this._right.mode == 'side') {
        right += this._right._getWidth();
      } else if (this._right.mode == 'push') {
        const width = this._right._getWidth();
        right += width;
        left -= width;
      }
    }

    // If either `right` or `left` is zero, don't set a style to the element. This
    // allows users to specify a custom size via CSS class in SSR scenarios where the
    // measured widths will always be zero. Note that we reset to `null` here, rather
    // than below, in order to ensure that the types in the `if` below are consistent.
    left = left || null!;
    right = right || null!;

    if (left !== this._contentMargins.left || right !== this._contentMargins.right) {
      this._contentMargins = {left, right};

      // Pull back into the NgZone since in some cases we could be outside. We need to be careful
      // to do it only when something changed, otherwise we can end up hitting the zone too often.
      this._ngZone.run(() => this._contentMarginChanges.next(this._contentMargins));
    }
  }

  ngDoCheck() {
    // If users opted into autosizing, do a check every change detection cycle.
    if (this._autosize && this._isPushed()) {
      // Run outside the NgZone, otherwise the debouncer will throw us into an infinite loop.
      this._ngZone.runOutsideAngular(() => this._doCheckSubject.next());
    }
  }

  /**
   * Subscribes to drawer events in order to set a class on the main container element when the
   * drawer is open and the backdrop is visible. This ensures any overflow on the container element
   * is properly hidden.
   *
   * 订阅抽屉事件，以便在抽屉打开且背景板可见时在主容器元素上设置一个类。这可以确保容器元素上的所有溢出都被正确的隐藏。
   *
   */
  private _watchDrawerToggle(drawer: MatDrawer): void {
    drawer._animationStarted
      .pipe(
        filter((event: AnimationEvent) => event.fromState !== event.toState),
        takeUntil(this._drawers.changes),
      )
      .subscribe((event: AnimationEvent) => {
        // Set the transition class on the container so that the animations occur. This should not
        // be set initially because animations should only be triggered via a change in state.
        if (event.toState !== 'open-instant' && this._animationMode !== 'NoopAnimations') {
          this._element.nativeElement.classList.add('mat-drawer-transition');
        }

        this.updateContentMargins();
        this._changeDetectorRef.markForCheck();
      });

    if (drawer.mode !== 'side') {
      drawer.openedChange
        .pipe(takeUntil(this._drawers.changes))
        .subscribe(() => this._setContainerClass(drawer.opened));
    }
  }

  /**
   * Subscribes to drawer onPositionChanged event in order to
   * re-validate drawers when the position changes.
   *
   * 订阅抽屉的 onPositionChanged 事件，以便在该位置发生变化时重新验证抽屉。
   *
   */
  private _watchDrawerPosition(drawer: MatDrawer): void {
    if (!drawer) {
      return;
    }
    // NOTE: We need to wait for the microtask queue to be empty before validating,
    // since both drawers may be swapping positions at the same time.
    drawer.onPositionChanged.pipe(takeUntil(this._drawers.changes)).subscribe(() => {
      this._ngZone.onMicrotaskEmpty.pipe(take(1)).subscribe(() => {
        this._validateDrawers();
      });
    });
  }

  /**
   * Subscribes to changes in drawer mode so we can run change detection.
   *
   * 订阅了抽屉的模式变化，以便我们进行变更检测。
   *
   */
  private _watchDrawerMode(drawer: MatDrawer): void {
    if (drawer) {
      drawer._modeChanged
        .pipe(takeUntil(merge(this._drawers.changes, this._destroyed)))
        .subscribe(() => {
          this.updateContentMargins();
          this._changeDetectorRef.markForCheck();
        });
    }
  }

  /**
   * Toggles the 'mat-drawer-opened' class on the main 'mat-drawer-container' element.
   *
   * 在 “mat-drawer-container” 主元素上切换 “mat-drawer-opened” 类。
   *
   */
  private _setContainerClass(isAdd: boolean): void {
    const classList = this._element.nativeElement.classList;
    const className = 'mat-drawer-container-has-open';

    if (isAdd) {
      classList.add(className);
    } else {
      classList.remove(className);
    }
  }

  /**
   * Validate the state of the drawer children components.
   *
   * 验证抽屉子组件的状态。
   *
   */
  private _validateDrawers() {
    this._start = this._end = null;

    // Ensure that we have at most one start and one end drawer.
    this._drawers.forEach(drawer => {
      if (drawer.position == 'end') {
        if (this._end != null && (typeof ngDevMode === 'undefined' || ngDevMode)) {
          throwMatDuplicatedDrawerError('end');
        }
        this._end = drawer;
      } else {
        if (this._start != null && (typeof ngDevMode === 'undefined' || ngDevMode)) {
          throwMatDuplicatedDrawerError('start');
        }
        this._start = drawer;
      }
    });

    this._right = this._left = null;

    // Detect if we're LTR or RTL.
    if (this._dir && this._dir.value === 'rtl') {
      this._left = this._end;
      this._right = this._start;
    } else {
      this._left = this._start;
      this._right = this._end;
    }
  }

  /**
   * Whether the container is being pushed to the side by one of the drawers.
   *
   * 容器是否被其中一个抽屉推到了一边。
   *
   */
  private _isPushed() {
    return (
      (this._isDrawerOpen(this._start) && this._start.mode != 'over') ||
      (this._isDrawerOpen(this._end) && this._end.mode != 'over')
    );
  }

  _onBackdropClicked() {
    this.backdropClick.emit();
    this._closeModalDrawersViaBackdrop();
  }

  _closeModalDrawersViaBackdrop() {
    // Close all open drawers where closing is not disabled and the mode is not `side`.
    [this._start, this._end]
      .filter(drawer => drawer && !drawer.disableClose && this._drawerHasBackdrop(drawer))
      .forEach(drawer => drawer!._closeViaBackdropClick());
  }

  _isShowingBackdrop(): boolean {
    return (
      (this._isDrawerOpen(this._start) && this._drawerHasBackdrop(this._start)) ||
      (this._isDrawerOpen(this._end) && this._drawerHasBackdrop(this._end))
    );
  }

  private _isDrawerOpen(drawer: MatDrawer | null): drawer is MatDrawer {
    return drawer != null && drawer.opened;
  }

  // Whether argument drawer should have a backdrop when it opens
  private _drawerHasBackdrop(drawer: MatDrawer | null) {
    if (this._backdropOverride == null) {
      return !!drawer && drawer.mode !== 'side';
    }

    return this._backdropOverride;
  }
}
