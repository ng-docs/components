/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  FocusMonitor,
  FocusOrigin,
  FocusTrap,
  FocusTrapFactory,
  InteractivityChecker,
} from '@angular/cdk/a11y';
import {OverlayRef} from '@angular/cdk/overlay';
import {_getFocusedElementPierceShadowDom} from '@angular/cdk/platform';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  ComponentPortal,
  DomPortal,
  TemplatePortal,
} from '@angular/cdk/portal';
import {DOCUMENT} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ElementRef,
  EmbeddedViewRef,
  Inject,
  NgZone,
  OnDestroy,
  Optional,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {DialogConfig} from './dialog-config';

export function throwDialogContentAlreadyAttachedError() {
  throw Error('Attempting to attach dialog content after content is already attached');
}

/**
 * Internal component that wraps user-provided dialog content.
 *
 * 包裹用户提供的对话框内容的内部组件。
 *
 * @docs-private
 */
@Component({
  selector: 'cdk-dialog-container',
  templateUrl: './dialog-container.html',
  styleUrls: ['dialog-container.css'],
  encapsulation: ViewEncapsulation.None,
  // Using OnPush for dialogs caused some G3 sync issues. Disabled until we can track them down.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    'class': 'cdk-dialog-container',
    'tabindex': '-1',
    '[attr.id]': '_config.id || null',
    '[attr.role]': '_config.role',
    '[attr.aria-modal]': '_config.ariaModal',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledByQueue[0]',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
  },
})
export class CdkDialogContainer<C extends DialogConfig = DialogConfig>
  extends BasePortalOutlet
  implements OnDestroy
{
  protected _document: Document;

  /**
   * The portal outlet inside of this container into which the dialog content will be loaded.
   *
   * 此容器内的传送点出口，对话内容将加载到其中。
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
   * Element that was focused before the dialog was opened. Save this to restore upon close.
   *
   * 在打开对话框之前聚焦的元素。保存以在关闭时恢复。
   *
   */
  private _elementFocusedBeforeDialogWasOpened: HTMLElement | null = null;

  /**
   * Type of interaction that led to the dialog being closed. This is used to determine
   * whether the focus style will be applied when returning focus to its original location
   * after the dialog is closed.
   *
   * 导致对话框关闭的交互类型。这用于确定在对话框关闭后将焦点返回到其原始位置时是否应用焦点样式。
   *
   */
  _closeInteractionType: FocusOrigin | null = null;

  /**
   * Queue of the IDs of the dialog's label element, based on their definition order. The first
   * ID will be used as the `aria-labelledby` value. We use a queue here to handle the case
   * where there are two or more titles in the DOM at a time and the first one is destroyed while
   * the rest are present.
   */
  _ariaLabelledByQueue: string[] = [];

  constructor(
    protected _elementRef: ElementRef,
    protected _focusTrapFactory: FocusTrapFactory,
    @Optional() @Inject(DOCUMENT) _document: any,
    @Inject(DialogConfig) readonly _config: C,
    private _interactivityChecker: InteractivityChecker,
    protected _ngZone: NgZone,
    private _overlayRef: OverlayRef,
    private _focusMonitor?: FocusMonitor,
  ) {
    super();

    this._document = _document;

    if (this._config.ariaLabelledBy) {
      this._ariaLabelledByQueue.push(this._config.ariaLabelledBy);
    }
  }

  protected _contentAttached() {
    this._initializeFocusTrap();
    this._handleBackdropClicks();
    this._captureInitialFocus();
  }

  /**
   * Can be used by child classes to customize the initial focus
   * capturing behavior (e.g. if it's tied to an animation).
   *
   * 子类可以使用它来自定义初始焦点捕获行为（例如，如果它与动画相关联）。
   *
   */
  protected _captureInitialFocus() {
    this._trapFocus();
  }

  ngOnDestroy() {
    this._restoreFocus();
  }

  /**
   * Attach a ComponentPortal as content to this dialog container.
   *
   * 将 ComponentPortal 作为内容附着到此对话框容器。
   *
   * @param portal Portal to be attached as the dialog content.
   *
   * 要作为对话框内容进行附着的传送点。
   *
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }

    const result = this._portalOutlet.attachComponentPortal(portal);
    this._contentAttached();
    return result;
  }

  /**
   * Attach a TemplatePortal as content to this dialog container.
   *
   * 将某个 TemplatePortal 作为内容附着到此对话框容器。
   *
   * @param portal Portal to be attached as the dialog content.
   *
   * 要作为对话框内容进行附着的传送点。
   *
   */
  attachTemplatePortal<T>(portal: TemplatePortal<T>): EmbeddedViewRef<T> {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }

    const result = this._portalOutlet.attachTemplatePortal(portal);
    this._contentAttached();
    return result;
  }

  /**
   * Attaches a DOM portal to the dialog container.
   *
   * 将 DOM 传送点附着到对话框容器。
   *
   * @param portal Portal to be attached.
   *
   * 要附着到的传送点。
   *
   * @deprecated
   *
   * To be turned into a method.
   *
   * 变成了方法。
   *
   * @breaking-change 10.0.0
   */
  override attachDomPortal = (portal: DomPortal) => {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }

    const result = this._portalOutlet.attachDomPortal(portal);
    this._contentAttached();
    return result;
  };

  // TODO(crisbeto): this shouldn't be exposed, but there are internal references to it.
  /**
   * Captures focus if it isn't already inside the dialog.
   *
   * 如果焦点不在此对话框中，则捕获焦点。
   *
   */
  _recaptureFocus() {
    if (!this._containsFocus()) {
      this._trapFocus();
    }
  }

  /**
   * Focuses the provided element. If the element is not focusable, it will add a tabIndex
   * attribute to forcefully focus it. The attribute is removed after focus is moved.
   *
   * 聚焦提供的元素。如果元素不可聚焦，它会添加一个 tabIndex 属性来强制聚焦它。移动焦点后删除该属性。
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
   * 聚焦于和焦点陷阱中给定选择器匹配的第一个元素。
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
   * Moves the focus inside the focus trap. When autoFocus is not set to 'dialog', if focus
   * cannot be moved then focus will go to the dialog container.
   *
   * 在焦点陷阱内移动焦点。当 autoFocus 未设置为“对话框”时，如果焦点无法移动，则焦点将转到此对话框容器。
   *
   */
  protected _trapFocus() {
    const element = this._elementRef.nativeElement;
    // If were to attempt to focus immediately, then the content of the dialog would not yet be
    // ready in instances where change detection has to run first. To deal with this, we simply
    // wait for the microtask queue to be empty when setting focus when autoFocus isn't set to
    // dialog. If the element inside the dialog can't be focused, then the container is focused
    // so the user can't tab into other elements behind it.
    switch (this._config.autoFocus) {
      case false:
      case 'dialog':
        // Ensure that focus is on the dialog container. It's possible that a different
        // component tried to move focus while the open animation was running. See:
        // https://github.com/angular/components/issues/16215. Note that we only want to do this
        // if the focus isn't inside the dialog already, because it's possible that the consumer
        // turned off `autoFocus` in order to move focus themselves.
        if (!this._containsFocus()) {
          element.focus();
        }
        break;
      case true:
      case 'first-tabbable':
        this._focusTrap.focusInitialElementWhenReady().then(focusedSuccessfully => {
          // If we weren't able to find a focusable element in the dialog, then focus the dialog
          // container instead.
          if (!focusedSuccessfully) {
            this._focusDialogContainer();
          }
        });
        break;
      case 'first-heading':
        this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
        break;
      default:
        this._focusByCssSelector(this._config.autoFocus!);
        break;
    }
  }

  /**
   * Restores focus to the element that was focused before the dialog opened.
   *
   * 将焦点恢复到对话框打开之前聚焦的元素。
   *
   */
  private _restoreFocus() {
    const focusConfig = this._config.restoreFocus;
    let focusTargetElement: HTMLElement | null = null;

    if (typeof focusConfig === 'string') {
      focusTargetElement = this._document.querySelector(focusConfig);
    } else if (typeof focusConfig === 'boolean') {
      focusTargetElement = focusConfig ? this._elementFocusedBeforeDialogWasOpened : null;
    } else if (focusConfig) {
      focusTargetElement = focusConfig;
    }

    // We need the extra check, because IE can set the `activeElement` to null in some cases.
    if (
      this._config.restoreFocus &&
      focusTargetElement &&
      typeof focusTargetElement.focus === 'function'
    ) {
      const activeElement = _getFocusedElementPierceShadowDom();
      const element = this._elementRef.nativeElement;

      // Make sure that focus is still inside the dialog or is on the body (usually because a
      // non-focusable element like the backdrop was clicked) before moving it. It's possible that
      // the consumer moved it themselves before the animation was done, in which case we shouldn't
      // do anything.
      if (
        !activeElement ||
        activeElement === this._document.body ||
        activeElement === element ||
        element.contains(activeElement)
      ) {
        if (this._focusMonitor) {
          this._focusMonitor.focusVia(focusTargetElement, this._closeInteractionType);
          this._closeInteractionType = null;
        } else {
          focusTargetElement.focus();
        }
      }
    }

    if (this._focusTrap) {
      this._focusTrap.destroy();
    }
  }

  /**
   * Focuses the dialog container.
   *
   * 聚焦对话框容器。
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
   * 返回焦点是否在对话框内。
   *
   */
  private _containsFocus() {
    const element = this._elementRef.nativeElement;
    const activeElement = _getFocusedElementPierceShadowDom();
    return element === activeElement || element.contains(activeElement);
  }

  /**
   * Sets up the focus trap.
   *
   * 设置焦点陷阱。
   *
   */
  private _initializeFocusTrap() {
    this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);

    // Save the previously focused element. This element will be re-focused
    // when the dialog closes.
    if (this._document) {
      this._elementFocusedBeforeDialogWasOpened = _getFocusedElementPierceShadowDom();
    }
  }

  /**
   * Sets up the listener that handles clicks on the dialog backdrop.
   *
   * 设置处理对话背景点击的侦听器。
   *
   */
  private _handleBackdropClicks() {
    // Clicking on the backdrop will move focus out of dialog.
    // Recapture it if closing via the backdrop is disabled.
    this._overlayRef.backdropClick().subscribe(() => {
      if (this._config.disableClose) {
        this._recaptureFocus();
      }
    });
  }
}
