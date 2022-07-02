/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AnimationEvent} from '@angular/animations';
import {CdkDialogContainer} from '@angular/cdk/dialog';
import {FocusMonitor, FocusTrapFactory, InteractivityChecker} from '@angular/cdk/a11y';
import {OverlayRef} from '@angular/cdk/overlay';
import {_getFocusedElementPierceShadowDom} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  NgZone,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {matDialogAnimations, defaultParams} from './dialog-animations';
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
 * Base class for the `MatDialogContainer`. The base class does not implement
 * animations as these are left to implementers of the dialog container.
 *
 * `MatDialogContainer` 的基类。基类没有实现动画，因为这些动画留给了对话框容器的各个实现者。
 *
 */
// tslint:disable-next-line:validate-decorators
@Component({template: ''})
export abstract class _MatDialogContainerBase extends CdkDialogContainer<MatDialogConfig> {
  /**
   * Emits when an animation state changes.
   *
   * 当动画状态发生变化时会触发。
   *
   */
  _animationStateChanged = new EventEmitter<DialogAnimationEvent>();

  constructor(
    elementRef: ElementRef,
    focusTrapFactory: FocusTrapFactory,
    @Optional() @Inject(DOCUMENT) _document: any,
    dialogConfig: MatDialogConfig,
    interactivityChecker: InteractivityChecker,
    ngZone: NgZone,
    overlayRef: OverlayRef,
    focusMonitor?: FocusMonitor,
  ) {
    super(
      elementRef,
      focusTrapFactory,
      _document,
      dialogConfig,
      interactivityChecker,
      ngZone,
      overlayRef,
      focusMonitor,
    );
  }

  /**
   * Starts the dialog exit animation.
   *
   * 开始播放对话框的退出动画。
   *
   */
  abstract _startExitAnimation(): void;

  protected override _captureInitialFocus(): void {
    if (!this._config.delayFocusTrap) {
      this._trapFocus();
    }
  }

  /**
   * Callback for when the open dialog animation has finished. Intended to
   * be called by sub-classes that use different animation implementations.
   */
  protected _openAnimationDone(totalTime: number) {
    if (this._config.delayFocusTrap) {
      this._trapFocus();
    }

    this._animationStateChanged.next({state: 'opened', totalTime});
  }
}

/**
 * Internal component that wraps user-provided dialog content.
 * Animation is based on https://material.io/guidelines/motion/choreography.html.
 *
 * 包装用户提供的对话框内容的内部组件。动画基于 https://material.io/guidelines/motion/choreography.html。
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
    '[attr.aria-modal]': '_config.ariaModal',
    '[id]': '_config.id',
    '[attr.role]': '_config.role',
    '[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledBy',
    '[attr.aria-label]': '_config.ariaLabel',
    '[attr.aria-describedby]': '_config.ariaDescribedBy || null',
    '[@dialogContainer]': `_getAnimationState()`,
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
      this._openAnimationDone(totalTime);
    } else if (toState === 'exit') {
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

  constructor(
    elementRef: ElementRef,
    focusTrapFactory: FocusTrapFactory,
    @Optional() @Inject(DOCUMENT) document: any,
    dialogConfig: MatDialogConfig,
    checker: InteractivityChecker,
    ngZone: NgZone,
    overlayRef: OverlayRef,
    private _changeDetectorRef: ChangeDetectorRef,
    focusMonitor?: FocusMonitor,
  ) {
    super(
      elementRef,
      focusTrapFactory,
      document,
      dialogConfig,
      checker,
      ngZone,
      overlayRef,
      focusMonitor,
    );
  }

  _getAnimationState() {
    return {
      value: this._state,
      params: {
        'enterAnimationDuration':
          this._config.enterAnimationDuration || defaultParams.params.enterAnimationDuration,
        'exitAnimationDuration':
          this._config.exitAnimationDuration || defaultParams.params.exitAnimationDuration,
      },
    };
  }
}
