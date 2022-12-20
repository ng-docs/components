/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  NgZone,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {matSnackBarAnimations} from './snack-bar-animations';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  ComponentPortal,
  DomPortal,
  TemplatePortal,
} from '@angular/cdk/portal';
import {Observable, Subject} from 'rxjs';
import {AriaLivePoliteness} from '@angular/cdk/a11y';
import {Platform} from '@angular/cdk/platform';
import {AnimationEvent} from '@angular/animations';
import {take} from 'rxjs/operators';
import {MatSnackBarConfig} from './snack-bar-config';

/**
 * Base class for snack bar containers.
 *
 * 快餐栏容器的基类。
 *
 * @docs-private
 */
@Directive()
export abstract class _MatSnackBarContainerBase extends BasePortalOutlet implements OnDestroy {
  /**
   * The number of milliseconds to wait before announcing the snack bar's content.
   *
   * 朗读快餐栏内容之前要等待的毫秒数。
   *
   */
  private readonly _announceDelay: number = 150;

  /**
   * The timeout for announcing the snack bar's content.
   *
   * 朗读快餐栏内容的超时时间。
   *
   */
  private _announceTimeoutId: number;

  /**
   * Whether the component has been destroyed.
   *
   * 该组件是否已被销毁。
   *
   */
  private _destroyed = false;

  /**
   * The portal outlet inside of this container into which the snack bar content will be loaded.
   *
   * 此容器内部的传送点出口地标，快餐栏的内容将加载到这里。
   *
   */
  @ViewChild(CdkPortalOutlet, {static: true}) _portalOutlet: CdkPortalOutlet;

  /**
   * Subject for notifying that the snack bar has announced to screen readers.
   *
   * 用于通知快餐栏已经朗读给屏幕阅读器的主体对象。
   *
   */
  readonly _onAnnounce: Subject<void> = new Subject();

  /**
   * Subject for notifying that the snack bar has exited from view.
   *
   * 用于通知快餐栏已经从视图中退出的主体对象。
   *
   */
  readonly _onExit: Subject<void> = new Subject();

  /**
   * Subject for notifying that the snack bar has finished entering the view.
   *
   * 用于通知快餐栏已经进入视图的主体对象。
   *
   */
  readonly _onEnter: Subject<void> = new Subject();

  /**
   * The state of the snack bar animations.
   *
   * 快餐栏动画的状态。
   *
   */
  _animationState = 'void';

  /**
   * aria-live value for the live region.
   *
   * 表示现场区域的 aria-live 值。
   *
   */
  _live: AriaLivePoliteness;

  /**
   * Role of the live region. This is only for Firefox as there is a known issue where Firefox +
   * JAWS does not read out aria-live message.
   *
   * 现场区域的角色。这仅适用于 Firefox，因为存在一个已知问题，即 Firefox + JAWS 无法读取 aria-live 消息。
   *
   */
  _role?: 'status' | 'alert';

  constructor(
    private _ngZone: NgZone,
    protected _elementRef: ElementRef<HTMLElement>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _platform: Platform,
    /** The snack bar configuration. */
    public snackBarConfig: MatSnackBarConfig,
  ) {
    super();

    // Use aria-live rather than a live role like 'alert' or 'status'
    // because NVDA and JAWS have show inconsistent behavior with live roles.
    if (snackBarConfig.politeness === 'assertive' && !snackBarConfig.announcementMessage) {
      this._live = 'assertive';
    } else if (snackBarConfig.politeness === 'off') {
      this._live = 'off';
    } else {
      this._live = 'polite';
    }

    // Only set role for Firefox. Set role based on aria-live because setting role="alert" implies
    // aria-live="assertive" which may cause issues if aria-live is set to "polite" above.
    if (this._platform.FIREFOX) {
      if (this._live === 'polite') {
        this._role = 'status';
      }
      if (this._live === 'assertive') {
        this._role = 'alert';
      }
    }
  }

  /**
   * Attach a component portal as content to this snack bar container.
   *
   * 把一个组件传送点作为内容附着到这个快餐栏容器中。
   *
   */
  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    this._assertNotAttached();
    const result = this._portalOutlet.attachComponentPortal(portal);
    this._afterPortalAttached();
    return result;
  }

  /**
   * Attach a template portal as content to this snack bar container.
   *
   * 把模板传送点作为内容附着到这个快餐栏容器中。
   *
   */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    this._assertNotAttached();
    const result = this._portalOutlet.attachTemplatePortal(portal);
    this._afterPortalAttached();
    return result;
  }

  /**
   * Attaches a DOM portal to the snack bar container.
   *
   * 把 DOM 传送点附着到这个快餐栏容器中。
   *
   * @deprecated To be turned into a method.
   *
   * 要变成一种方法。
   *
   * @breaking-change 10.0.0
   */
  override attachDomPortal = (portal: DomPortal) => {
    this._assertNotAttached();
    const result = this._portalOutlet.attachDomPortal(portal);
    this._afterPortalAttached();
    return result;
  };

  /**
   * Handle end of animations, updating the state of the snackbar.
   *
   * 处理动画的结束事件，更新快餐栏的状态。
   *
   */
  onAnimationEnd(event: AnimationEvent) {
    const {fromState, toState} = event;

    if ((toState === 'void' && fromState !== 'void') || toState === 'hidden') {
      this._completeExit();
    }

    if (toState === 'visible') {
      // Note: we shouldn't use `this` inside the zone callback,
      // because it can cause a memory leak.
      const onEnter = this._onEnter;

      this._ngZone.run(() => {
        onEnter.next();
        onEnter.complete();
      });
    }
  }

  /**
   * Begin animation of snack bar entrance into view.
   *
   * 启动快餐栏进入视图的动画。
   *
   */
  enter(): void {
    if (!this._destroyed) {
      this._animationState = 'visible';
      this._changeDetectorRef.detectChanges();
      this._screenReaderAnnounce();
    }
  }

  /**
   * Begin animation of the snack bar exiting from view.
   *
   * 启动快餐栏离开视图的动画。
   *
   */
  exit(): Observable<void> {
    // It's common for snack bars to be opened by random outside calls like HTTP requests or
    // errors. Run inside the NgZone to ensure that it functions correctly.
    this._ngZone.run(() => {
      // Note: this one transitions to `hidden`, rather than `void`, in order to handle the case
      // where multiple snack bars are opened in quick succession (e.g. two consecutive calls to
      // `MatSnackBar.open`).
      this._animationState = 'hidden';

      // Mark this element with an 'exit' attribute to indicate that the snackbar has
      // been dismissed and will soon be removed from the DOM. This is used by the snackbar
      // test harness.
      this._elementRef.nativeElement.setAttribute('mat-exit', '');

      // If the snack bar hasn't been announced by the time it exits it wouldn't have been open
      // long enough to visually read it either, so clear the timeout for announcing.
      clearTimeout(this._announceTimeoutId);
    });

    return this._onExit;
  }

  /**
   * Makes sure the exit callbacks have been invoked when the element is destroyed.
   *
   * 当元素被销毁时，确保已经调用了 exit 回调函数。
   *
   */
  ngOnDestroy() {
    this._destroyed = true;
    this._completeExit();
  }

  /**
   * Waits for the zone to settle before removing the element. Helps prevent
   * errors where we end up removing an element which is in the middle of an animation.
   *
   * 在删除该元素之前，等待 zone 恢复正常。这有助于防止错误，因为我们最终移除了一个正在播放动画的元素。
   *
   */
  private _completeExit() {
    this._ngZone.onMicrotaskEmpty.pipe(take(1)).subscribe(() => {
      this._ngZone.run(() => {
        this._onExit.next();
        this._onExit.complete();
      });
    });
  }

  /**
   * Called after the portal contents have been attached. Can be
   * used to modify the DOM once it's guaranteed to be in place.
   *
   * 在附着传送点内容后调用。一旦确保到位，可用于修改 DOM。
   *
   */
  protected _afterPortalAttached() {
    const element: HTMLElement = this._elementRef.nativeElement;
    const panelClasses = this.snackBarConfig.panelClass;

    if (panelClasses) {
      if (Array.isArray(panelClasses)) {
        // Note that we can't use a spread here, because IE doesn't support multiple arguments.
        panelClasses.forEach(cssClass => element.classList.add(cssClass));
      } else {
        element.classList.add(panelClasses);
      }
    }
  }

  /**
   * Asserts that no content is already attached to the container.
   *
   * 断言没有任何内容附着到了容器上。
   *
   */
  private _assertNotAttached() {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('Attempting to attach snack bar content after content is already attached');
    }
  }

  /**
   * Starts a timeout to move the snack bar content to the live region so screen readers will
   * announce it.
   *
   * 开始超时，把快餐栏内容移到现场区域，以便屏幕阅读器朗读它。
   *
   */
  private _screenReaderAnnounce() {
    if (!this._announceTimeoutId) {
      this._ngZone.runOutsideAngular(() => {
        this._announceTimeoutId = setTimeout(() => {
          const inertElement = this._elementRef.nativeElement.querySelector('[aria-hidden]');
          const liveElement = this._elementRef.nativeElement.querySelector('[aria-live]');

          if (inertElement && liveElement) {
            // If an element in the snack bar content is focused before being moved
            // track it and restore focus after moving to the live region.
            let focusedElement: HTMLElement | null = null;
            if (
              this._platform.isBrowser &&
              document.activeElement instanceof HTMLElement &&
              inertElement.contains(document.activeElement)
            ) {
              focusedElement = document.activeElement;
            }

            inertElement.removeAttribute('aria-hidden');
            liveElement.appendChild(inertElement);
            focusedElement?.focus();

            this._onAnnounce.next();
            this._onAnnounce.complete();
          }
        }, this._announceDelay);
      });
    }
  }
}

/**
 * Internal component that wraps user-provided snack bar content.
 *
 * 包装用户提供的快餐栏内容的内部组件。
 *
 * @docs-private
 */
@Component({
  selector: 'mat-snack-bar-container',
  templateUrl: 'snack-bar-container.html',
  styleUrls: ['snack-bar-container.css'],
  // In Ivy embedded views will be change detected from their declaration place, rather than
  // where they were stamped out. This means that we can't have the snack bar container be OnPush,
  // because it might cause snack bars that were opened from a template not to be out of date.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  animations: [matSnackBarAnimations.snackBarState],
  host: {
    'class': 'mdc-snackbar mat-mdc-snack-bar-container mdc-snackbar--open',
    '[@state]': '_animationState',
    '(@state.done)': 'onAnimationEnd($event)',
  },
})
export class MatSnackBarContainer extends _MatSnackBarContainerBase {
  /**
   * Element that will have the `mdc-snackbar__label` class applied if the attached component
   * or template does not have it. This ensures that the appropriate structure, typography, and
   * color is applied to the attached view.
   */
  @ViewChild('label', {static: true}) _label: ElementRef;

  /** Applies the correct CSS class to the label based on its content. */
  protected override _afterPortalAttached() {
    super._afterPortalAttached();

    // Check to see if the attached component or template uses the MDC template structure,
    // specifically the MDC label. If not, the container should apply the MDC label class to this
    // component's label container, which will apply MDC's label styles to the attached view.
    const label = this._label.nativeElement;
    const labelClass = 'mdc-snackbar__label';
    label.classList.toggle(labelClass, !label.querySelector(`.${labelClass}`));
  }
}
