/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {ElementRef, InjectionToken, OnDestroy, OnInit, QueryList} from '@angular/core';

/**
 * Item inside a tab header relative to which the ink bar can be aligned.
 *
 * 选项卡标题内的条目，墨条可以相对于该条目对齐。
 *
 * @docs-private
 */
export interface MatInkBarItem extends OnInit, OnDestroy {
  elementRef: ElementRef<HTMLElement>;
  activateInkBar(previousIndicatorClientRect?: ClientRect): void;
  deactivateInkBar(): void;
  fitInkBarToContent: boolean;
}

/**
 * Class that is applied when a tab indicator is active.
 *
 * 标签指示器处于活动状态时要应用的类。
 *
 */
const ACTIVE_CLASS = 'mdc-tab-indicator--active';

/**
 * Class that is applied when the tab indicator should not transition.
 *
 * 当标签指示器不需要过渡动画时要应用的类。
 *
 */
const NO_TRANSITION_CLASS = 'mdc-tab-indicator--no-transition';

/**
 * Abstraction around the MDC tab indicator that acts as the tab header's ink bar.
 *
 * 围绕 MDC 选项卡指示器的抽象物，该指示器充当标签标题的墨条。
 *
 * @docs-private
 */
export class MatInkBar {
  /** Item to which the ink bar is aligned currently. */
  private _currentItem: MatInkBarItem | undefined;

  constructor(private _items: QueryList<MatInkBarItem>) {}

  /**
   * Hides the ink bar.
   *
   * 隐藏此墨条。
   *
   */
  hide() {
    this._items.forEach(item => item.deactivateInkBar());
  }

  /**
   * Aligns the ink bar to a DOM node.
   *
   * 将墨条与 DOM 节点对齐。
   *
   */
  alignToElement(element: HTMLElement) {
    const correspondingItem = this._items.find(item => item.elementRef.nativeElement === element);
    const currentItem = this._currentItem;

    if (correspondingItem === currentItem) {
      return;
    }

    currentItem?.deactivateInkBar();

    if (correspondingItem) {
      const clientRect = currentItem?.elementRef.nativeElement.getBoundingClientRect?.();

      // The ink bar won't animate unless we give it the `ClientRect` of the previous item.
      correspondingItem.activateInkBar(clientRect);
      this._currentItem = correspondingItem;
    }
  }
}

/**
 * Mixin that can be used to apply the `MatInkBarItem` behavior to a class.
 * Base on MDC's `MDCSlidingTabIndicatorFoundation`:
 * https://github.com/material-components/material-components-web/blob/c0a11ef0d000a098fd0c372be8f12d6a99302855/packages/mdc-tab-indicator/sliding-foundation.ts
 *
 * @docs-private
 */
export function mixinInkBarItem<
  T extends new (...args: any[]) => {elementRef: ElementRef<HTMLElement>},
>(base: T): T & (new (...args: any[]) => MatInkBarItem) {
  return class extends base {
    constructor(...args: any[]) {
      super(...args);
    }

    private _inkBarElement: HTMLElement | null;
    private _inkBarContentElement: HTMLElement | null;
    private _fitToContent = false;

    /**
     * Whether the ink bar should fit to the entire tab or just its content.
     *
     * 墨条是应该适合整个选项卡还是只适合它的内容。
     *
     */
    get fitInkBarToContent(): boolean {
      return this._fitToContent;
    }
    set fitInkBarToContent(v: BooleanInput) {
      const newValue = coerceBooleanProperty(v);

      if (this._fitToContent !== newValue) {
        this._fitToContent = newValue;

        if (this._inkBarElement) {
          this._appendInkBarElement();
        }
      }
    }

    /**
     * Aligns the ink bar to the current item.
     *
     * 将墨条与当前条目对齐。
     *
     */
    activateInkBar(previousIndicatorClientRect?: ClientRect) {
      const element = this.elementRef.nativeElement;

      // Early exit if no indicator is present to handle cases where an indicator
      // may be activated without a prior indicator state
      if (
        !previousIndicatorClientRect ||
        !element.getBoundingClientRect ||
        !this._inkBarContentElement
      ) {
        element.classList.add(ACTIVE_CLASS);
        return;
      }

      // This animation uses the FLIP approach. You can read more about it at the link below:
      // https://aerotwist.com/blog/flip-your-animations/

      // Calculate the dimensions based on the dimensions of the previous indicator
      const currentClientRect = element.getBoundingClientRect();
      const widthDelta = previousIndicatorClientRect.width / currentClientRect.width;
      const xPosition = previousIndicatorClientRect.left - currentClientRect.left;
      element.classList.add(NO_TRANSITION_CLASS);
      this._inkBarContentElement.style.setProperty(
        'transform',
        `translateX(${xPosition}px) scaleX(${widthDelta})`,
      );

      // Force repaint before updating classes and transform to ensure the transform properly takes effect
      element.getBoundingClientRect();

      element.classList.remove(NO_TRANSITION_CLASS);
      element.classList.add(ACTIVE_CLASS);
      this._inkBarContentElement.style.setProperty('transform', '');
    }

    /**
     * Removes the ink bar from the current item.
     *
     * 从当前条目中移除墨条。
     *
     */
    deactivateInkBar() {
      this.elementRef.nativeElement.classList.remove(ACTIVE_CLASS);
    }

    /**
     * Initializes the foundation.
     *
     * 初始化地基。
     *
     */
    ngOnInit() {
      this._createInkBarElement();
    }

    /**
     * Destroys the foundation.
     *
     * 销毁地基。
     *
     */
    ngOnDestroy() {
      this._inkBarElement?.remove();
      this._inkBarElement = this._inkBarContentElement = null!;
    }

    /** Creates and appends the ink bar element. */
    private _createInkBarElement() {
      const documentNode = this.elementRef.nativeElement.ownerDocument || document;
      this._inkBarElement = documentNode.createElement('span');
      this._inkBarContentElement = documentNode.createElement('span');

      this._inkBarElement.className = 'mdc-tab-indicator';
      this._inkBarContentElement.className =
        'mdc-tab-indicator__content mdc-tab-indicator__content--underline';

      this._inkBarElement.appendChild(this._inkBarContentElement);
      this._appendInkBarElement();
    }

    /**
     * Appends the ink bar to the tab host element or content, depending on whether
     * the ink bar should fit to content.
     */
    private _appendInkBarElement() {
      if (!this._inkBarElement && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error('Ink bar element has not been created and cannot be appended');
      }

      const parentElement = this._fitToContent
        ? this.elementRef.nativeElement.querySelector('.mdc-tab__content')
        : this.elementRef.nativeElement;

      if (!parentElement && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error('Missing element to host the ink bar');
      }

      parentElement!.appendChild(this._inkBarElement!);
    }
  };
}

/**
 * Interface for a MatInkBar positioner method, defining the positioning and width of the ink
 * bar in a set of tabs.
 *
 * 一个 MatInkBar 定位器方法的接口，用于定义选项卡组中墨水条的位置和宽度。
 *
 */
export interface _MatInkBarPositioner {
  (element: HTMLElement): {left: string; width: string};
}

/**
 * The default positioner function for the MatInkBar.
 *
 * MatInkBar 默认的定位器函数。
 *
 * @docs-private
 */
export function _MAT_INK_BAR_POSITIONER_FACTORY(): _MatInkBarPositioner {
  const method = (element: HTMLElement) => ({
    left: element ? (element.offsetLeft || 0) + 'px' : '0',
    width: element ? (element.offsetWidth || 0) + 'px' : '0',
  });

  return method;
}

/**
 * Injection token for the MatInkBar's Positioner.
 *
 * MatInkBar 定位器的注入令牌。
 *
 */
export const _MAT_INK_BAR_POSITIONER = new InjectionToken<_MatInkBarPositioner>(
  'MatInkBarPositioner',
  {
    providedIn: 'root',
    factory: _MAT_INK_BAR_POSITIONER_FACTORY,
  },
);
