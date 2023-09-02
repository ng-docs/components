/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ALT, CONTROL, MAC_META, META, SHIFT} from '@angular/cdk/keycodes';
import {Inject, Injectable, InjectionToken, OnDestroy, Optional, NgZone} from '@angular/core';
import {normalizePassiveListenerOptions, Platform, _getEventTarget} from '@angular/cdk/platform';
import {DOCUMENT} from '@angular/common';
import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged, skip} from 'rxjs/operators';
import {
  isFakeMousedownFromScreenReader,
  isFakeTouchstartFromScreenReader,
} from '../fake-event-detection';

/**
 * The input modalities detected by this service. Null is used if the input modality is unknown.
 *
 * 此服务检测到的输入模式。如果输入模式未知，则使用 Null。
 *
 */
export type InputModality = 'keyboard' | 'mouse' | 'touch' | null;

/**
 * Options to configure the behavior of the InputModalityDetector.
 *
 * 用于配置 InputModalityDetector 行为的选项。
 *
 */
export interface InputModalityDetectorOptions {
  /**
   * Keys to ignore when detecting keyboard input modality.
   *
   * 检测键盘输入模式时要忽略的按键。
   *
   */
  ignoreKeys?: number[];
}

/**
 * Injectable options for the InputModalityDetector. These are shallowly merged with the default
 * options.
 *
 * InputModalityDetector 的可注入选项。这些会与默认选项进行浅合并。
 *
 */
export const INPUT_MODALITY_DETECTOR_OPTIONS = new InjectionToken<InputModalityDetectorOptions>(
  'cdk-input-modality-detector-options',
);

/**
 * Default options for the InputModalityDetector.
 *
 * InputModalityDetector 的默认选项。
 *
 * Modifier keys are ignored by default \(i.e. when pressed won't cause the service to detect
 * keyboard input modality\) for two reasons:
 *
 * 默认情况下忽略修饰键（即按下时不会导致服务检测键盘输入模式），这有两个原因：
 *
 * 1. Modifier keys are commonly used with mouse to perform actions such as 'right click' or 'open
 *    in new tab', and are thus less representative of actual keyboard interaction.
 *
 *    修饰键通常与鼠标一起使用以执行诸如“右键单击”或“在新选项卡中打开”之类的操作，因此不太能代表实际的键盘交互。
 *
 * 2. VoiceOver triggers some keyboard events when linearly navigating with Control + Option \(but
 *    confusingly not with Caps Lock\). Thus, to have parity with other screen readers, we ignore
 *    these keys so as to not update the input modality.
 *
 *    当使用 Control + Option 进行线性导航时，VoiceOver 会触发一些键盘事件（但不会与 Caps Lock 混淆）。因此，为了与其他屏幕阅读器保持一致，我们忽略这些键以免改变输入模式。
 *
 * Note that we do not by default ignore the right Meta key on Safari because it has the same key
 * code as the ContextMenu key on other browsers. When we switch to using event.key, we can
 * distinguish between the two.
 *
 * 请注意，默认情况下我们不会忽略 Safari 上的右侧 Meta 键，因为它与其他浏览器上的 ContextMenu 键具有相同的键代码。当我们转而使用 event.key 时，我们能够区分两者。
 *
 */
export const INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS: InputModalityDetectorOptions = {
  ignoreKeys: [ALT, CONTROL, MAC_META, META, SHIFT],
};

/**
 * The amount of time needed to pass after a touchstart event in order for a subsequent mousedown
 * event to be attributed as mouse and not touch.
 *
 * 在 touchstart 事件之后需要经过的时间量，以便将随后的 mousedown 事件归因于鼠标而不是触摸。
 *
 * This is the value used by AngularJS Material. Through trial and error \(on iPhone 6S\) they found
 * that a value of around 650ms seems appropriate.
 *
 * 这是 AngularJS Material 使用的值。通过反复试验（在 iPhone 6S 上），他们发现 650 毫秒左右的值似乎是合适的。
 *
 */
export const TOUCH_BUFFER_MS = 650;

/**
 * Event listener options that enable capturing and also mark the listener as passive if the browser
 * supports it.
 *
 * 启用捕获的事件侦听器选项，如果浏览器支持，还可以将侦听器标记为被动型。
 *
 */
const modalityEventListenerOptions = normalizePassiveListenerOptions({
  passive: true,
  capture: true,
});

/**
 * Service that detects the user's input modality.
 *
 * 检测用户输入模式的服务。
 *
 * This service does not update the input modality when a user navigates with a screen reader
 * \(e.g. linear navigation with VoiceOver, object navigation / browse mode with NVDA, virtual PC
 * cursor mode with JAWS\). This is in part due to technical limitations \(i.e. keyboard events do not
 * fire as expected in these modes\) but is also arguably the correct behavior. Navigating with a
 * screen reader is akin to visually scanning a page, and should not be interpreted as actual user
 * input interaction.
 *
 * 当用户使用屏幕阅读器进行导航（例如借助 VoiceOver 进行线性导航、借助 NVDA 使用对象导航/浏览模式、借助 JAWS 使用虚拟 PC 光标模式）时，此服务不会改变输入模式。这部分是由于技术限制（即在这些模式下键盘事件不会按预期触发），但也可以说是正确的行为。使用屏幕阅读器导航类似于视觉扫描页面，不应被解释为实际的用户输入交互。
 *
 * When a user is not navigating but *interacting* with a screen reader, this service attempts to
 * update the input modality to keyboard, but in general this service's behavior is largely
 * undefined.
 *
 * 当用户不是在导航而是与屏幕阅读器*交互*时，此服务会尝试将输入模式改为键盘，但一般来说此服务的行为在很大程度上是未定义的。
 *
 */
@Injectable({providedIn: 'root'})
export class InputModalityDetector implements OnDestroy {
  /**
   * Emits whenever an input modality is detected.
   *
   * 每当检测到输入模式时发出。
   *
   */
  readonly modalityDetected: Observable<InputModality>;

  /**
   * Emits when the input modality changes.
   *
   * 当输入模式改变时发出。
   *
   */
  readonly modalityChanged: Observable<InputModality>;

  /**
   * The most recently detected input modality.
   *
   * 最近检测到的输入模式。
   *
   */
  get mostRecentModality(): InputModality {
    return this._modality.value;
  }

  /**
   * The most recently detected input modality event target. Is null if no input modality has been
   * detected or if the associated event target is null for some unknown reason.
   *
   * 最近检测到的输入模式事件目标。如果未检测到输入模式，或者关联的事件目标由于某种未知原因为空，则为 null。
   *
   */
  _mostRecentTarget: HTMLElement | null = null;

  /**
   * The underlying BehaviorSubject that emits whenever an input modality is detected.
   *
   * 每当检测到输入模式时发出的底层 BehaviorSubject。
   *
   */
  private readonly _modality = new BehaviorSubject<InputModality>(null);

  /**
   * Options for this InputModalityDetector.
   *
   * 此 InputModalityDetector 的选项。
   *
   */
  private readonly _options: InputModalityDetectorOptions;

  /**
   * The timestamp of the last touch input modality. Used to determine whether mousedown events
   * should be attributed to mouse or touch.
   *
   * 上一次进入触摸输入模式的时间戳。用于确定 mousedown 事件是否应归因于鼠标或触摸。
   *
   */
  private _lastTouchMs = 0;

  /**
   * Handles keydown events. Must be an arrow function in order to preserve the context when it gets
   * bound.
   *
   * 处理按键事件。必须是一个箭头函数，以便在它被绑定时保留上下文。
   *
   */
  private _onKeydown = (event: KeyboardEvent) => {
    // If this is one of the keys we should ignore, then ignore it and don't update the input
    // modality to keyboard.
    if (this._options?.ignoreKeys?.some(keyCode => keyCode === event.keyCode)) {
      return;
    }

    this._modality.next('keyboard');
    this._mostRecentTarget = _getEventTarget(event);
  };

  /**
   * Handles mousedown events. Must be an arrow function in order to preserve the context when it
   * gets bound.
   *
   * 处理 mousedown 事件。必须是一个箭头函数，以便在它被绑定时保留上下文。
   *
   */
  private _onMousedown = (event: MouseEvent) => {
    // Touches trigger both touch and mouse events, so we need to distinguish between mouse events
    // that were triggered via mouse vs touch. To do so, check if the mouse event occurs closely
    // after the previous touch event.
    if (Date.now() - this._lastTouchMs < TOUCH_BUFFER_MS) {
      return;
    }

    // Fake mousedown events are fired by some screen readers when controls are activated by the
    // screen reader. Attribute them to keyboard input modality.
    this._modality.next(isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse');
    this._mostRecentTarget = _getEventTarget(event);
  };

  /**
   * Handles touchstart events. Must be an arrow function in order to preserve the context when it
   * gets bound.
   *
   * 处理触摸开始事件。必须是一个箭头函数，以便在它被绑定时保留上下文。
   *
   */
  private _onTouchstart = (event: TouchEvent) => {
    // Same scenario as mentioned in _onMousedown, but on touch screen devices, fake touchstart
    // events are fired. Again, attribute to keyboard input modality.
    if (isFakeTouchstartFromScreenReader(event)) {
      this._modality.next('keyboard');
      return;
    }

    // Store the timestamp of this touch event, as it's used to distinguish between mouse events
    // triggered via mouse vs touch.
    this._lastTouchMs = Date.now();

    this._modality.next('touch');
    this._mostRecentTarget = _getEventTarget(event);
  };

  constructor(
    private readonly _platform: Platform,
    ngZone: NgZone,
    @Inject(DOCUMENT) document: Document,
    @Optional()
    @Inject(INPUT_MODALITY_DETECTOR_OPTIONS)
    options?: InputModalityDetectorOptions,
  ) {
    this._options = {
      ...INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS,
      ...options,
    };

    // Skip the first emission as it's null.
    this.modalityDetected = this._modality.pipe(skip(1));
    this.modalityChanged = this.modalityDetected.pipe(distinctUntilChanged());

    // If we're not in a browser, this service should do nothing, as there's no relevant input
    // modality to detect.
    if (_platform.isBrowser) {
      ngZone.runOutsideAngular(() => {
        document.addEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
        document.addEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
        document.addEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
      });
    }
  }

  ngOnDestroy() {
    this._modality.complete();

    if (this._platform.isBrowser) {
      document.removeEventListener('keydown', this._onKeydown, modalityEventListenerOptions);
      document.removeEventListener('mousedown', this._onMousedown, modalityEventListenerOptions);
      document.removeEventListener('touchstart', this._onTouchstart, modalityEventListenerOptions);
    }
  }
}
