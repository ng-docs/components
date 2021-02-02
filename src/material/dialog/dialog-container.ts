/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AnimationEvent} from '@angular/animations';
import {FocusMonitor, FocusOrigin, FocusTrap, FocusTrapFactory} from '@angular/cdk/a11y';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  ComponentPortal,
  DomPortal,
  TemplatePortal
} from '@angular/cdk/portal';
import {DOCUMENT} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  Inject,
  Optional,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {matDialogAnimations} from './dialog-animations';
import {MatDialogConfig} from './dialog-config';

/**
 * Event that captures the state of dialog container animations.
 *
 * 捕获对话框容器动画状态的事件。
 *
 */
interface DialogAnimationEvent {
  state: 'opened' | 'opening' | 'closing' | 'closed';
  totalTime: number;
}

/**
 * Throws an exception for the case when a ComponentPortal is
 * attached to a DomPortalOutlet without an origin.
 *
 * 当 ComponentPortal 被附加到一个没有原点（origin）的 DomPortalOutlet 时会引发异常。
 *
 * @docs-private
 */
export function throwMatDialogContentAlreadyAttachedError() {
  throw Error('Attempting to attach dialog content after content is already attached');
}

/**
 * Base class for the `MatDialogContainer`. The base class does not implement
 * animations as these are left to implementers of the dialog container.
 *
 * `MatDialogContainer` 的基类。基类没有实现动画，因为这些动画留给了对话框容器的各个实现者。
 *
 */
@Directive()
export abstract class _MatDialogContainerBase extends BasePortalOutlet {
  protected _document: Document;

  /**
   * The portal outlet inside of this container into which the dialog content will be loaded.
   *
   * 此容器内的传送点地标，会在其中加载对话框内容。
   *
   */
  @ViewChild(CdkPortalOutlet, {static: true}) _portalOutlet: CdkPortalOutlet;

  /**
   * The class that traps and manages focus within the dialog.
   *
   * 在对话框中捕获和管理焦点的类。
   *
   */
  private _focusTrap: FocusTrap;

  /**
   * Emits when an animation state changes.
   *
   * 当动画状态发生变化时会触发。
   *
   */
  _animationStateChanged = new EventEmitter<DialogAnimationEvent>();

  /**
   * Element that was focused before the dialog was opened. Save this to restore upon close.
   *
   * 在打开对话框之前拥有焦点的元素。保存它，以便在关闭时恢复。
   *
   */
  private _elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

  /**
   * Type of interaction that led to the dialog being closed. This is used to determine
   * whether the focus style will be applied when returning focus to its original location
   * after the dialog is closed.
   *
   * 会导致关闭该对话框的交互类型。它用来确定在对话框关闭后把焦点返还给原来的位置时是否要应用焦点样式。
   *
   */
  _closeInteractionType: FocusOrigin|null = null;

  /**
   * ID of the element that should be considered as the dialog's label.
   *
   * 要作为对话框标签的元素的 ID。
   *
   */
  _ariaLabelledBy: string | null;

  /**
   * ID for the container DOM element.
   *
   * 容器 DOM 元素的标识。
   *
   */
  _id: string;

  constructor(
    protected _elementRef: ElementRef,
    protected _focusTrapFactory: FocusTrapFactory,
    protected _changeDetectorRef: ChangeDetectorRef,
    @Optional() @Inject(DOCUMENT) _document: any,
    /** The dialog configuration. */
    public _config: MatDialogConfig,
    private _focusMonitor?: FocusMonitor) {

    super();
    this._ariaLabelledBy = _config.ariaLabelledBy || null;
    this._document = _document;
  }

  /**
   * Starts the dialog exit animation.
   *
   * 开始播放对话框的退出动画。
   *
   */
  abstract _startExitAnimation(): void;

  /**
   * Initializes the dialog container with the attached content.
   *
   * 初始化带有附加内容的对话框容器。
   *
   */
  _initializeWithAttachedContent() {
    this._setupFocusTrap();
    // Save the previously focused element. This element will be re-focused
    // when the dialog closes.
    this._capturePreviouslyFocusedElement();
    // Move focus onto the dialog immediately in order to prevent the user
    // from accidentally opening multiple dialogs at the same time.
    this._focusDialogContainer();
  }

  /**
   * Attach a ComponentPortal as content to this dialog container.
   *
   * 把 ComponentPortal 作为内容附加到这个对话框的容器中。
   *
   * @param portal Portal to be attached as the dialog content.
   *
   * 要作为对话框内容进行附加的传送点（Portal）。
   *
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwMatDialogContentAlreadyAttachedError();
    }

    return this._portalOutlet.attachComponentPortal(portal);
  }

  /**
   * Attach a TemplatePortal as content to this dialog container.
   *
   * 把 TemplatePortal 作为内容附加到这个对话框的容器中。
   *
   * @param portal Portal to be attached as the dialog content.
   *
   * 要作为对话框内容进行附加的传送点。
   *
   */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwMatDialogContentAlreadyAttachedError();
    }

    return this._portalOutlet.attachTemplatePortal(portal);
  }

  /**
   * Attaches a DOM portal to the dialog container.
   *
   * 把 DOM 传送点附加到对话框容器中。
   *
   * @param portal Portal to be attached.
   *
   * 要附加的传送点。
   *
   * @deprecated To be turned into a method.
   *
   * 将会变成方法。
   *
   * @breaking-change 10.0.0
   */
  attachDomPortal = (portal: DomPortal) => {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwMatDialogContentAlreadyAttachedError();
    }

    return this._portalOutlet.attachDomPortal(portal);
  }

  /**
   * Moves focus back into the dialog if it was moved out.
   *
   * 如果已经移出了焦点，就会把焦点移回对话框。
   *
   */
  _recaptureFocus() {
    if (!this._containsFocus()) {
      const focusContainer = !this._config.autoFocus || !this._focusTrap.focusInitialElement();

      if (focusContainer) {
        this._elementRef.nativeElement.focus();
      }
    }
  }

  /**
   * Moves the focus inside the focus trap.
   *
   * 把焦点移到焦点陷阱里面。
   *
   */
  protected _trapFocus() {
    // If we were to attempt to focus immediately, then the content of the dialog would not yet be
    // ready in instances where change detection has to run first. To deal with this, we simply
    // wait for the microtask queue to be empty.
    if (this._config.autoFocus) {
      this._focusTrap.focusInitialElementWhenReady();
    } else if (!this._containsFocus()) {
      // Otherwise ensure that focus is on the dialog container. It's possible that a different
      // component tried to move focus while the open animation was running. See:
      // https://github.com/angular/components/issues/16215. Note that we only want to do this
      // if the focus isn't inside the dialog already, because it's possible that the consumer
      // turned off `autoFocus` in order to move focus themselves.
      this._elementRef.nativeElement.focus();
    }
  }

  /**
   * Restores focus to the element that was focused before the dialog opened.
   *
   * 将焦点恢复到打开对话框之前拥有焦点的元素。
   *
   */
  protected _restoreFocus() {
    const previousElement = this._elementFocusedBeforeDialogWasOpened;

    // We need the extra check, because IE can set the `activeElement` to null in some cases.
    if (this._config.restoreFocus && previousElement &&
        typeof previousElement.focus === 'function') {
      const activeElement = this._document.activeElement;
      const element = this._elementRef.nativeElement;

      // Make sure that focus is still inside the dialog or is on the body (usually because a
      // non-focusable element like the backdrop was clicked) before moving it. It's possible that
      // the consumer moved it themselves before the animation was done, in which case we shouldn't
      // do anything.
      if (!activeElement || activeElement === this._document.body || activeElement === element ||
          element.contains(activeElement)) {
        if (this._focusMonitor) {
          this._focusMonitor.focusVia(previousElement, this._closeInteractionType);
          this._closeInteractionType = null;
        } else {
          previousElement.focus();
        }
      }
    }

    if (this._focusTrap) {
      this._focusTrap.destroy();
    }
  }

  /**
   * Sets up the focus trap.
   *
   * 设置焦点陷阱。
   *
   */
  private _setupFocusTrap() {
    this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
  }

  /**
   * Captures the element that was focused before the dialog was opened.
   *
   * 捕获在打开对话框之前拥有焦点的元素。
   *
   */
  private _capturePreviouslyFocusedElement() {
    if (this._document) {
      this._elementFocusedBeforeDialogWasOpened = this._document.activeElement as HTMLElement;
    }
  }

  /**
   * Focuses the dialog container.
   *
   * 让对话框容器获得焦点。
   *
   */
  private _focusDialogContainer() {
    // Note that there is no focus method when rendering on the server.
    if (this._elementRef.nativeElement.focus) {
      this._elementRef.nativeElement.focus();
    }
  }

  /**
   * Returns whether focus is inside the dialog.
   *
   * 返回焦点是否在对话框中。
   *
   */
  private _containsFocus() {
    const element = this._elementRef.nativeElement;
    const activeElement = this._document.activeElement;
    return element === activeElement || element.contains(activeElement);
  }
}

/**
 * Internal component that wraps user-provided dialog content.
 * Animation is based on <https://material.io/guidelines/motion/choreography.html>.
 *
 * 包装用户提供的对话框内容的内部组件。动画基于 <https://material.io/guidelines/motion/choreography.html> 。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-dialog-container',
  templateUrl: 'dialog-container.html',
  styleUrls: ['dialog.css'],
  encapsulation: ViewEncapsulation.None,
  // Using OnPush for dialogs caused some G3 sync issues. Disabled until we can track them down.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [matDialogAnimations.dialogContainer],
  host: {
    'class': 'mat-dialog-container',
    'tabindex': '-1',
    'aria-modal': 'true',
    '[id]': '_id',
    '[attr.role]': '_config.role',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledBy',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
    '[@dialogContainer]': '_state',
    '(@dialogContainer.start)': '_onAnimationStart($event)',
    '(@dialogContainer.done)': '_onAnimationDone($event)',
  },
})
export class MatDialogContainer extends _MatDialogContainerBase {
  /**
   * State of the dialog animation.
   *
   * 此对话框动画的状态。
   *
   */
  _state: 'void' | 'enter' | 'exit' = 'enter';

  /**
   * Callback, invoked whenever an animation on the host completes.
   *
   * 当宿主上的动画完成时，就会调用这个回调函数。
   *
   */
  _onAnimationDone({toState, totalTime}: AnimationEvent) {
    if (toState === 'enter') {
      this._trapFocus();
      this._animationStateChanged.next({state: 'opened', totalTime});
    } else if (toState === 'exit') {
      this._restoreFocus();
      this._animationStateChanged.next({state: 'closed', totalTime});
    }
  }

  /**
   * Callback, invoked when an animation on the host starts.
   *
   * 当宿主上的动画开始时，会调用 Callback。
   *
   */
  _onAnimationStart({toState, totalTime}: AnimationEvent) {
    if (toState === 'enter') {
      this._animationStateChanged.next({state: 'opening', totalTime});
    } else if (toState === 'exit' || toState === 'void') {
      this._animationStateChanged.next({state: 'closing', totalTime});
    }
  }

  /**
   * Starts the dialog exit animation.
   *
   * 开始播放对话框的退出动画。
   *
   */
  _startExitAnimation(): void {
    this._state = 'exit';

    // Mark the container for check so it can react if the
    // view container is using OnPush change detection.
    this._changeDetectorRef.markForCheck();
  }
}
