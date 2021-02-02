/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Component,
  ComponentRef,
  EmbeddedViewRef,
  ViewChild,
  OnDestroy,
  ElementRef,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  ChangeDetectorRef,
  EventEmitter,
  Inject,
  Optional,
} from '@angular/core';
import {AnimationEvent} from '@angular/animations';
import {
  BasePortalOutlet,
  ComponentPortal,
  TemplatePortal,
  CdkPortalOutlet,
  DomPortal,
} from '@angular/cdk/portal';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatBottomSheetConfig} from './bottom-sheet-config';
import {matBottomSheetAnimations} from './bottom-sheet-animations';
import {Subscription} from 'rxjs';
import {DOCUMENT} from '@angular/common';
import {FocusTrap, FocusTrapFactory} from '@angular/cdk/a11y';

// TODO(crisbeto): consolidate some logic between this, MatDialog and MatSnackBar

/**
 * Internal component that wraps user-provided bottom sheet content.
 *
 * 用于包装用户提供的底部操作表内容的内部组件。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-bottom-sheet-container',
  templateUrl: 'bottom-sheet-container.html',
  styleUrls: ['bottom-sheet-container.css'],
  // In Ivy embedded views will be change detected from their declaration place, rather than where
  // they were stamped out. This means that we can't have the bottom sheet container be OnPush,
  // because it might cause the sheets that were opened from a template not to be out of date.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  animations: [matBottomSheetAnimations.bottomSheetState],
  host: {
    'class': 'mat-bottom-sheet-container',
    'tabindex': '-1',
    'role': 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': 'bottomSheetConfig?.ariaLabel',
    '[@state]': '_animationState',
    '(@state.start)': '_onAnimationStart($event)',
    '(@state.done)': '_onAnimationDone($event)'
  },
})
export class MatBottomSheetContainer extends BasePortalOutlet implements OnDestroy {
  private _breakpointSubscription: Subscription;

  /**
   * The portal outlet inside of this container into which the content will be loaded.
   *
   * 此容器内的传送点地标（portal outlet），其内容会加载。
   *
   */
  @ViewChild(CdkPortalOutlet, {static: true}) _portalOutlet: CdkPortalOutlet;

  /**
   * The state of the bottom sheet animations.
   *
   * 底部操作表动画的状态。
   *
   */
  _animationState: 'void' | 'visible' | 'hidden' = 'void';

  /**
   * Emits whenever the state of the animation changes.
   *
   * 每当动画的状态发生变化时就会触发。
   *
   */
  _animationStateChanged = new EventEmitter<AnimationEvent>();

  /**
   * The class that traps and manages focus within the bottom sheet.
   *
   * 在底部操作表中捕获和管理焦点的类。
   *
   */
  private _focusTrap: FocusTrap;

  /**
   * Element that was focused before the bottom sheet was opened.
   *
   * 在底部操作表打开之前拥有焦点的元素。
   *
   */
  private _elementFocusedBeforeOpened: HTMLElement | null = null;

  /**
   * Server-side rendering-compatible reference to the global document object.
   *
   * 与服务器渲染兼容的对全局文档对象的引用。
   *
   */
  private _document: Document;

  /**
   * Whether the component has been destroyed.
   *
   * 该组件是否已被销毁。
   *
   */
  private _destroyed: boolean;

  constructor(
    private _elementRef: ElementRef<HTMLElement>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _focusTrapFactory: FocusTrapFactory,
    breakpointObserver: BreakpointObserver,
    @Optional() @Inject(DOCUMENT) document: any,
    /** The bottom sheet configuration. */
    public bottomSheetConfig: MatBottomSheetConfig) {
    super();

    this._document = document;
    this._breakpointSubscription = breakpointObserver
      .observe([Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .subscribe(() => {
        this._toggleClass('mat-bottom-sheet-container-medium',
            breakpointObserver.isMatched(Breakpoints.Medium));
        this._toggleClass('mat-bottom-sheet-container-large',
            breakpointObserver.isMatched(Breakpoints.Large));
        this._toggleClass('mat-bottom-sheet-container-xlarge',
            breakpointObserver.isMatched(Breakpoints.XLarge));
      });
  }

  /**
   * Attach a component portal as content to this bottom sheet container.
   *
   * 把组件传送点作为内容附加到这个底部操作表容器中。
   *
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    this._validatePortalAttached();
    this._setPanelClass();
    this._savePreviouslyFocusedElement();
    return this._portalOutlet.attachComponentPortal(portal);
  }

  /**
   * Attach a template portal as content to this bottom sheet container.
   *
   * 把模板传送点作为内容附加到这个底部操作表容器中。
   *
   */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    this._validatePortalAttached();
    this._setPanelClass();
    this._savePreviouslyFocusedElement();
    return this._portalOutlet.attachTemplatePortal(portal);
  }

  /**
   * Attaches a DOM portal to the bottom sheet container.
   *
   * 把 DOM 传送点连接到底部操作表容器中。
   *
   * @deprecated To be turned into a method.
   *
   * 将会转成方法。
   *
   * @breaking-change 10.0.0
   */
  attachDomPortal = (portal: DomPortal) => {
    this._validatePortalAttached();
    this._setPanelClass();
    this._savePreviouslyFocusedElement();
    return this._portalOutlet.attachDomPortal(portal);
  }

  /**
   * Begin animation of bottom sheet entrance into view.
   *
   * 启动底部操作表进入视图动画。
   *
   */
  enter(): void {
    if (!this._destroyed) {
      this._animationState = 'visible';
      this._changeDetectorRef.detectChanges();
    }
  }

  /**
   * Begin animation of the bottom sheet exiting from view.
   *
   * 启动底部操作表离开视图的动画。
   *
   */
  exit(): void {
    if (!this._destroyed) {
      this._animationState = 'hidden';
      this._changeDetectorRef.markForCheck();
    }
  }

  ngOnDestroy() {
    this._breakpointSubscription.unsubscribe();
    this._destroyed = true;
  }

  _onAnimationDone(event: AnimationEvent) {
    if (event.toState === 'hidden') {
      this._restoreFocus();
    } else if (event.toState === 'visible') {
      this._trapFocus();
    }

    this._animationStateChanged.emit(event);
  }

  _onAnimationStart(event: AnimationEvent) {
    this._animationStateChanged.emit(event);
  }

  private _toggleClass(cssClass: string, add: boolean) {
    const classList = this._elementRef.nativeElement.classList;
    add ? classList.add(cssClass) : classList.remove(cssClass);
  }

  private _validatePortalAttached() {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('Attempting to attach bottom sheet content after content is already attached');
    }
  }

  private _setPanelClass() {
    const element: HTMLElement = this._elementRef.nativeElement;
    const panelClass = this.bottomSheetConfig.panelClass;

    if (Array.isArray(panelClass)) {
      // Note that we can't use a spread here, because IE doesn't support multiple arguments.
      panelClass.forEach(cssClass => element.classList.add(cssClass));
    } else if (panelClass) {
      element.classList.add(panelClass);
    }
  }

  /**
   * Moves the focus inside the focus trap.
   *
   * 把焦点移到焦点陷阱内部。
   *
   */
  private _trapFocus() {
    const element = this._elementRef.nativeElement;

    if (!this._focusTrap) {
      this._focusTrap = this._focusTrapFactory.create(element);
    }

    if (this.bottomSheetConfig.autoFocus) {
      this._focusTrap.focusInitialElementWhenReady();
    } else {
      const activeElement = this._document.activeElement;

      // Otherwise ensure that focus is on the container. It's possible that a different
      // component tried to move focus while the open animation was running. See:
      // https://github.com/angular/components/issues/16215. Note that we only want to do this
      // if the focus isn't inside the bottom sheet already, because it's possible that the
      // consumer turned off `autoFocus` in order to move focus themselves.
      if (activeElement !== element && !element.contains(activeElement)) {
        element.focus();
      }
    }
  }

  /**
   * Restores focus to the element that was focused before the bottom sheet was opened.
   *
   * 将焦点返还给底部操作表打开前拥有焦点的元素。
   *
   */
  private _restoreFocus() {
    const toFocus = this._elementFocusedBeforeOpened;

    // We need the extra check, because IE can set the `activeElement` to null in some cases.
    if (this.bottomSheetConfig.restoreFocus && toFocus && typeof toFocus.focus === 'function') {
      const activeElement = this._document.activeElement;
      const element = this._elementRef.nativeElement;

      // Make sure that focus is still inside the bottom sheet or is on the body (usually because a
      // non-focusable element like the backdrop was clicked) before moving it. It's possible that
      // the consumer moved it themselves before the animation was done, in which case we shouldn't
      // do anything.
      if (!activeElement || activeElement === this._document.body || activeElement === element ||
        element.contains(activeElement)) {
        toFocus.focus();
      }
    }

    if (this._focusTrap) {
      this._focusTrap.destroy();
    }
  }

  /**
   * Saves a reference to the element that was focused before the bottom sheet was opened.
   *
   * 在打开底部操作表之前，保存对拥有焦点的元素的引用。
   *
   */
  private _savePreviouslyFocusedElement() {
    this._elementFocusedBeforeOpened = this._document.activeElement as HTMLElement;

    // The `focus` method isn't available during server-side rendering.
    if (this._elementRef.nativeElement.focus) {
      Promise.resolve().then(() => this._elementRef.nativeElement.focus());
    }
  }
}
