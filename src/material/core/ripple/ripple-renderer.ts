/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ElementRef, NgZone} from '@angular/core';
import {Platform, normalizePassiveListenerOptions} from '@angular/cdk/platform';
import {isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader} from '@angular/cdk/a11y';
import {coerceElement} from '@angular/cdk/coercion';
import {RippleRef, RippleState, RippleConfig} from './ripple-ref';

/**
 * Interface that describes the target for launching ripples.
 * It defines the ripple configuration and disabled state for interaction ripples.
 *
 * 描述启动涟漪的目标的接口。它定义了涟漪配置和交互涟漪的禁用状态。
 *
 * @docs-private
 */
export interface RippleTarget {
  /**
   * Configuration for ripples that are launched on pointer down.
   *
   * 配置指针设备按下时发出的涟漪。
   *
   */
  rippleConfig: RippleConfig;
  /**
   * Whether ripples on pointer down should be disabled.
   *
   * 是否应禁用设备按下时的涟漪。
   *
   */
  rippleDisabled: boolean;
}

/** Interfaces the defines ripple element transition event listeners. */
interface RippleEventListeners {
  onTransitionEnd: EventListener;
  onTransitionCancel: EventListener;
}

// TODO: import these values from `@material/ripple` eventually.
/**
 * Default ripple animation configuration for ripples without an explicit
 * animation config specified.
 *
 * 没有指定显式动画配置时的默认涟漪动画配置。
 *
 */
export const defaultRippleAnimationConfig = {
  enterDuration: 225,
  exitDuration: 150,
};

/**
 * Timeout for ignoring mouse events. Mouse events will be temporary ignored after touch
 * events to avoid synthetic mouse events.
 *
 * 忽略鼠标事件的超时。触摸事件后，鼠标事件将被暂时忽略，以免并入鼠标事件。
 *
 */
const ignoreMouseEventsTimeout = 800;

/**
 * Options that apply to all the event listeners that are bound by the ripple renderer.
 *
 * 适用于由涟漪渲染器绑定的所有事件侦听器的选项。
 *
 */
const passiveEventOptions = normalizePassiveListenerOptions({passive: true});

/**
 * Events that signal that the pointer is down.
 *
 * 指示指针设备按下的事件。
 *
 */
const pointerDownEvents = ['mousedown', 'touchstart'];

/**
 * Events that signal that the pointer is up.
 *
 * 指示指针设备松开的事件。
 *
 */
const pointerUpEvents = ['mouseup', 'mouseleave', 'touchend', 'touchcancel'];

/**
 * Helper service that performs DOM manipulations. Not intended to be used outside this module.
 * The constructor takes a reference to the ripple directive's host element and a map of DOM
 * event handlers to be installed on the element that triggers ripple animations.
 * This will eventually become a custom renderer once Angular support exists.
 *
 * 执行 DOM 操作的辅助器服务。不得在该模块之外使用。构造函数引用了涟漪指令的宿主元素以及要在触发涟漪图动画的元素上安装的 DOM 事件处理程序的映射。一旦获得 Angular 的支持，它最终将成为自定义渲染器。
 *
 * @docs-private
 */
export class RippleRenderer implements EventListenerObject {
  /**
   * Element where the ripples are being added to.
   *
   * 要在其中添加涟漪的元素。
   *
   */
  private _containerElement: HTMLElement;

  /**
   * Element which triggers the ripple elements on mouse events.
   *
   * 要在鼠标事件中触发涟漪元素的元素。
   *
   */
  private _triggerElement: HTMLElement | null;

  /**
   * Whether the pointer is currently down or not.
   *
   * 指针设备当前是否按下。
   *
   */
  private _isPointerDown = false;

  /**
   * Map of currently active ripple references.
   * The ripple reference is mapped to its element event listeners.
   * The reason why `| null` is used is that event listeners are added only
   * when the condition is truthy (see the `_startFadeOutTransition` method).
   */
  private _activeRipples = new Map<RippleRef, RippleEventListeners | null>();

  /**
   * Latest non-persistent ripple that was triggered.
   *
   * 最近触发的非持续性涟漪。
   *
   */
  private _mostRecentTransientRipple: RippleRef | null;

  /**
   * Time in milliseconds when the last touchstart event happened.
   *
   * 上一次 touchstart 事件发生的时间（以毫秒为单位）。
   *
   */
  private _lastTouchStartEvent: number;

  /**
   * Whether pointer-up event listeners have been registered.
   *
   * 指针设备抬起事件的侦听器是否已注册。
   *
   */
  private _pointerUpEventsRegistered = false;

  /**
   * Cached dimensions of the ripple container. Set when the first
   * ripple is shown and cleared once no more ripples are visible.
   *
   * 涟漪容器的已缓存尺寸。在显示第一个涟漪时设置，并在不再可见涟漪时将其清除。
   *
   */
  private _containerRect: ClientRect | null;

  constructor(
    private _target: RippleTarget,
    private _ngZone: NgZone,
    elementOrElementRef: HTMLElement | ElementRef<HTMLElement>,
    platform: Platform,
  ) {
    // Only do anything if we're on the browser.
    if (platform.isBrowser) {
      this._containerElement = coerceElement(elementOrElementRef);
    }
  }

  /**
   * Fades in a ripple at the given coordinates.
   *
   * 在给定坐标处带着涟漪渐隐。
   *
   * @param x Coordinate within the element, along the X axis at which to start the ripple.
   *
   * 沿 X 轴在元素内进行坐标，在该 X 轴处开始产生涟漪。
   *
   * @param y Coordinate within the element, along the Y axis at which to start the ripple.
   *
   * 沿 Y 轴在元素内进行坐标，在该 Y 轴处开始产生涟漪。
   *
   * @param config Extra ripple options.
   *
   * 额外的涟漪选项。
   *
   */
  fadeInRipple(x: number, y: number, config: RippleConfig = {}): RippleRef {
    const containerRect = (this._containerRect =
      this._containerRect || this._containerElement.getBoundingClientRect());
    const animationConfig = {...defaultRippleAnimationConfig, ...config.animation};

    if (config.centered) {
      x = containerRect.left + containerRect.width / 2;
      y = containerRect.top + containerRect.height / 2;
    }

    const radius = config.radius || distanceToFurthestCorner(x, y, containerRect);
    const offsetX = x - containerRect.left;
    const offsetY = y - containerRect.top;
    const enterDuration = animationConfig.enterDuration;

    const ripple = document.createElement('div');
    ripple.classList.add('mat-ripple-element');

    ripple.style.left = `${offsetX - radius}px`;
    ripple.style.top = `${offsetY - radius}px`;
    ripple.style.height = `${radius * 2}px`;
    ripple.style.width = `${radius * 2}px`;

    // If a custom color has been specified, set it as inline style. If no color is
    // set, the default color will be applied through the ripple theme styles.
    if (config.color != null) {
      ripple.style.backgroundColor = config.color;
    }

    ripple.style.transitionDuration = `${enterDuration}ms`;

    this._containerElement.appendChild(ripple);

    // By default the browser does not recalculate the styles of dynamically created
    // ripple elements. This is critical to ensure that the `scale` animates properly.
    // We enforce a style recalculation by calling `getComputedStyle` and *accessing* a property.
    // See: https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    const computedStyles = window.getComputedStyle(ripple);
    const userTransitionProperty = computedStyles.transitionProperty;
    const userTransitionDuration = computedStyles.transitionDuration;

    // Note: We detect whether animation is forcibly disabled through CSS by the use of
    // `transition: none`. This is technically unexpected since animations are controlled
    // through the animation config, but this exists for backwards compatibility. This logic does
    // not need to be super accurate since it covers some edge cases which can be easily avoided by users.
    const animationForciblyDisabledThroughCss =
      userTransitionProperty === 'none' ||
      // Note: The canonical unit for serialized CSS `<time>` properties is seconds. Additionally
      // some browsers expand the duration for every property (in our case `opacity` and `transform`).
      userTransitionDuration === '0s' ||
      userTransitionDuration === '0s, 0s';

    // Exposed reference to the ripple that will be returned.
    const rippleRef = new RippleRef(this, ripple, config, animationForciblyDisabledThroughCss);

    // Start the enter animation by setting the transform/scale to 100%. The animation will
    // execute as part of this statement because we forced a style recalculation before.
    // Note: We use a 3d transform here in order to avoid an issue in Safari where
    // the ripples aren't clipped when inside the shadow DOM (see #24028).
    ripple.style.transform = 'scale3d(1, 1, 1)';

    rippleRef.state = RippleState.FADING_IN;

    if (!config.persistent) {
      this._mostRecentTransientRipple = rippleRef;
    }

    let eventListeners: RippleEventListeners | null = null;

    // Do not register the `transition` event listener if fade-in and fade-out duration
    // are set to zero. The events won't fire anyway and we can save resources here.
    if (!animationForciblyDisabledThroughCss && (enterDuration || animationConfig.exitDuration)) {
      this._ngZone.runOutsideAngular(() => {
        const onTransitionEnd = () => this._finishRippleTransition(rippleRef);
        const onTransitionCancel = () => this._destroyRipple(rippleRef);
        ripple.addEventListener('transitionend', onTransitionEnd);
        // If the transition is cancelled (e.g. due to DOM removal), we destroy the ripple
        // directly as otherwise we would keep it part of the ripple container forever.
        // https://www.w3.org/TR/css-transitions-1/#:~:text=no%20longer%20in%20the%20document.
        ripple.addEventListener('transitioncancel', onTransitionCancel);
        eventListeners = {onTransitionEnd, onTransitionCancel};
      });
    }

    // Add the ripple reference to the list of all active ripples.
    this._activeRipples.set(rippleRef, eventListeners);

    // In case there is no fade-in transition duration, we need to manually call the transition
    // end listener because `transitionend` doesn't fire if there is no transition.
    if (animationForciblyDisabledThroughCss || !enterDuration) {
      this._finishRippleTransition(rippleRef);
    }

    return rippleRef;
  }

  /**
   * Fades out a ripple reference.
   *
   * 淡出涟漪的引用。
   *
   */
  fadeOutRipple(rippleRef: RippleRef) {
    // For ripples already fading out or hidden, this should be a noop.
    if (rippleRef.state === RippleState.FADING_OUT || rippleRef.state === RippleState.HIDDEN) {
      return;
    }

    const rippleEl = rippleRef.element;
    const animationConfig = {...defaultRippleAnimationConfig, ...rippleRef.config.animation};

    // This starts the fade-out transition and will fire the transition end listener that
    // removes the ripple element from the DOM.
    rippleEl.style.transitionDuration = `${animationConfig.exitDuration}ms`;
    rippleEl.style.opacity = '0';
    rippleRef.state = RippleState.FADING_OUT;

    // In case there is no fade-out transition duration, we need to manually call the
    // transition end listener because `transitionend` doesn't fire if there is no transition.
    if (rippleRef._animationForciblyDisabledThroughCss || !animationConfig.exitDuration) {
      this._finishRippleTransition(rippleRef);
    }
  }

  /**
   * Fades out all currently active ripples.
   *
   * 淡出所有当前活动的涟漪。
   *
   */
  fadeOutAll() {
    this._getActiveRipples().forEach(ripple => ripple.fadeOut());
  }

  /**
   * Fades out all currently active non-persistent ripples.
   *
   * 淡出所有当前活动的非持久性涟漪。
   *
   */
  fadeOutAllNonPersistent() {
    this._getActiveRipples().forEach(ripple => {
      if (!ripple.config.persistent) {
        ripple.fadeOut();
      }
    });
  }

  /**
   * Sets up the trigger event listeners
   *
   * 设置触发事件监听器
   *
   */
  setupTriggerEvents(elementOrElementRef: HTMLElement | ElementRef<HTMLElement>) {
    const element = coerceElement(elementOrElementRef);

    if (!element || element === this._triggerElement) {
      return;
    }

    // Remove all previously registered event listeners from the trigger element.
    this._removeTriggerEvents();

    this._triggerElement = element;
    this._registerEvents(pointerDownEvents);
  }

  /**
   * Handles all registered events.
   *
   * 处理所有已注册的事件。
   *
   * @docs-private
   */
  handleEvent(event: Event) {
    if (event.type === 'mousedown') {
      this._onMousedown(event as MouseEvent);
    } else if (event.type === 'touchstart') {
      this._onTouchStart(event as TouchEvent);
    } else {
      this._onPointerUp();
    }

    // If pointer-up events haven't been registered yet, do so now.
    // We do this on-demand in order to reduce the total number of event listeners
    // registered by the ripples, which speeds up the rendering time for large UIs.
    if (!this._pointerUpEventsRegistered) {
      this._registerEvents(pointerUpEvents);
      this._pointerUpEventsRegistered = true;
    }
  }

  /** Method that will be called if the fade-in or fade-in transition completed. */
  private _finishRippleTransition(rippleRef: RippleRef) {
    if (rippleRef.state === RippleState.FADING_IN) {
      this._startFadeOutTransition(rippleRef);
    } else if (rippleRef.state === RippleState.FADING_OUT) {
      this._destroyRipple(rippleRef);
    }
  }

  /**
   * Starts the fade-out transition of the given ripple if it's not persistent and the pointer
   * is not held down anymore.
   */
  private _startFadeOutTransition(rippleRef: RippleRef) {
    const isMostRecentTransientRipple = rippleRef === this._mostRecentTransientRipple;
    const {persistent} = rippleRef.config;

    rippleRef.state = RippleState.VISIBLE;

    // When the timer runs out while the user has kept their pointer down, we want to
    // keep only the persistent ripples and the latest transient ripple. We do this,
    // because we don't want stacked transient ripples to appear after their enter
    // animation has finished.
    if (!persistent && (!isMostRecentTransientRipple || !this._isPointerDown)) {
      rippleRef.fadeOut();
    }
  }

  /** Destroys the given ripple by removing it from the DOM and updating its state. */
  private _destroyRipple(rippleRef: RippleRef) {
    const eventListeners = this._activeRipples.get(rippleRef) ?? null;
    this._activeRipples.delete(rippleRef);

    // Clear out the cached bounding rect if we have no more ripples.
    if (!this._activeRipples.size) {
      this._containerRect = null;
    }

    // If the current ref is the most recent transient ripple, unset it
    // avoid memory leaks.
    if (rippleRef === this._mostRecentTransientRipple) {
      this._mostRecentTransientRipple = null;
    }

    rippleRef.state = RippleState.HIDDEN;
    if (eventListeners !== null) {
      rippleRef.element.removeEventListener('transitionend', eventListeners.onTransitionEnd);
      rippleRef.element.removeEventListener('transitioncancel', eventListeners.onTransitionCancel);
    }
    rippleRef.element.remove();
  }

  /** Function being called whenever the trigger is being pressed using mouse. */
  private _onMousedown(event: MouseEvent) {
    // Screen readers will fire fake mouse events for space/enter. Skip launching a
    // ripple in this case for consistency with the non-screen-reader experience.
    const isFakeMousedown = isFakeMousedownFromScreenReader(event);
    const isSyntheticEvent =
      this._lastTouchStartEvent &&
      Date.now() < this._lastTouchStartEvent + ignoreMouseEventsTimeout;

    if (!this._target.rippleDisabled && !isFakeMousedown && !isSyntheticEvent) {
      this._isPointerDown = true;
      this.fadeInRipple(event.clientX, event.clientY, this._target.rippleConfig);
    }
  }

  /**
   * Function being called whenever the trigger is being pressed using touch.
   *
   * 每当使用触摸设备按下触发器时，就会调用该函数。
   *
   */
  private _onTouchStart(event: TouchEvent) {
    if (!this._target.rippleDisabled && !isFakeTouchstartFromScreenReader(event)) {
      // Some browsers fire mouse events after a `touchstart` event. Those synthetic mouse
      // events will launch a second ripple if we don't ignore mouse events for a specific
      // time after a touchstart event.
      this._lastTouchStartEvent = Date.now();
      this._isPointerDown = true;

      // Use `changedTouches` so we skip any touches where the user put
      // their finger down, but used another finger to tap the element again.
      const touches = event.changedTouches;

      for (let i = 0; i < touches.length; i++) {
        this.fadeInRipple(touches[i].clientX, touches[i].clientY, this._target.rippleConfig);
      }
    }
  }

  /**
   * Function being called whenever the trigger is being released.
   *
   * 释放触发器时将调用该函数。
   *
   */
  private _onPointerUp() {
    if (!this._isPointerDown) {
      return;
    }

    this._isPointerDown = false;

    // Fade-out all ripples that are visible and not persistent.
    this._getActiveRipples().forEach(ripple => {
      // By default, only ripples that are completely visible will fade out on pointer release.
      // If the `terminateOnPointerUp` option is set, ripples that still fade in will also fade out.
      const isVisible =
        ripple.state === RippleState.VISIBLE ||
        (ripple.config.terminateOnPointerUp && ripple.state === RippleState.FADING_IN);

      if (!ripple.config.persistent && isVisible) {
        ripple.fadeOut();
      }
    });
  }

  /**
   * Registers event listeners for a given list of events.
   *
   * 注册事件侦听器以获取给定的事件列表。
   *
   */
  private _registerEvents(eventTypes: string[]) {
    this._ngZone.runOutsideAngular(() => {
      eventTypes.forEach(type => {
        this._triggerElement!.addEventListener(type, this, passiveEventOptions);
      });
    });
  }

  private _getActiveRipples(): RippleRef[] {
    return Array.from(this._activeRipples.keys());
  }

  /**
   * Removes previously registered event listeners from the trigger element.
   *
   * 从触发元素中删除先前注册的事件侦听器。
   *
   */
  _removeTriggerEvents() {
    if (this._triggerElement) {
      pointerDownEvents.forEach(type => {
        this._triggerElement!.removeEventListener(type, this, passiveEventOptions);
      });

      if (this._pointerUpEventsRegistered) {
        pointerUpEvents.forEach(type => {
          this._triggerElement!.removeEventListener(type, this, passiveEventOptions);
        });
      }
    }
  }
}

/**
 * Returns the distance from the point (x, y) to the furthest corner of a rectangle.
 *
 * 返回从点（x，y）到矩形最远角的距离。
 *
 */
function distanceToFurthestCorner(x: number, y: number, rect: ClientRect) {
  const distX = Math.max(Math.abs(x - rect.left), Math.abs(x - rect.right));
  const distY = Math.max(Math.abs(y - rect.top), Math.abs(y - rect.bottom));
  return Math.sqrt(distX * distX + distY * distY);
}
