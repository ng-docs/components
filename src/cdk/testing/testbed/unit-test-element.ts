/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as keyCodes from '@angular/cdk/keycodes';
import {
  _getTextWithExcludedElements,
  ElementDimensions,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
  EventData,
} from '@angular/cdk/testing';
import {
  clearElement,
  createFakeEvent,
  dispatchFakeEvent,
  dispatchMouseEvent,
  dispatchPointerEvent,
  isTextInput,
  triggerBlur,
  triggerFocus,
  typeInElement,
  dispatchEvent,
} from './fake-events';

/**
 * Maps `TestKey` constants to the `keyCode` and `key` values used by native browser events.
 *
 * 将 `TestKey` 常量映射到原生浏览器事件使用 `keyCode` 和 `key`。
 *
 */
const keyMap = {
  [TestKey.BACKSPACE]: {keyCode: keyCodes.BACKSPACE, key: 'Backspace'},
  [TestKey.TAB]: {keyCode: keyCodes.TAB, key: 'Tab'},
  [TestKey.ENTER]: {keyCode: keyCodes.ENTER, key: 'Enter'},
  [TestKey.SHIFT]: {keyCode: keyCodes.SHIFT, key: 'Shift'},
  [TestKey.CONTROL]: {keyCode: keyCodes.CONTROL, key: 'Control'},
  [TestKey.ALT]: {keyCode: keyCodes.ALT, key: 'Alt'},
  [TestKey.ESCAPE]: {keyCode: keyCodes.ESCAPE, key: 'Escape'},
  [TestKey.PAGE_UP]: {keyCode: keyCodes.PAGE_UP, key: 'PageUp'},
  [TestKey.PAGE_DOWN]: {keyCode: keyCodes.PAGE_DOWN, key: 'PageDown'},
  [TestKey.END]: {keyCode: keyCodes.END, key: 'End'},
  [TestKey.HOME]: {keyCode: keyCodes.HOME, key: 'Home'},
  [TestKey.LEFT_ARROW]: {keyCode: keyCodes.LEFT_ARROW, key: 'ArrowLeft'},
  [TestKey.UP_ARROW]: {keyCode: keyCodes.UP_ARROW, key: 'ArrowUp'},
  [TestKey.RIGHT_ARROW]: {keyCode: keyCodes.RIGHT_ARROW, key: 'ArrowRight'},
  [TestKey.DOWN_ARROW]: {keyCode: keyCodes.DOWN_ARROW, key: 'ArrowDown'},
  [TestKey.INSERT]: {keyCode: keyCodes.INSERT, key: 'Insert'},
  [TestKey.DELETE]: {keyCode: keyCodes.DELETE, key: 'Delete'},
  [TestKey.F1]: {keyCode: keyCodes.F1, key: 'F1'},
  [TestKey.F2]: {keyCode: keyCodes.F2, key: 'F2'},
  [TestKey.F3]: {keyCode: keyCodes.F3, key: 'F3'},
  [TestKey.F4]: {keyCode: keyCodes.F4, key: 'F4'},
  [TestKey.F5]: {keyCode: keyCodes.F5, key: 'F5'},
  [TestKey.F6]: {keyCode: keyCodes.F6, key: 'F6'},
  [TestKey.F7]: {keyCode: keyCodes.F7, key: 'F7'},
  [TestKey.F8]: {keyCode: keyCodes.F8, key: 'F8'},
  [TestKey.F9]: {keyCode: keyCodes.F9, key: 'F9'},
  [TestKey.F10]: {keyCode: keyCodes.F10, key: 'F10'},
  [TestKey.F11]: {keyCode: keyCodes.F11, key: 'F11'},
  [TestKey.F12]: {keyCode: keyCodes.F12, key: 'F12'},
  [TestKey.META]: {keyCode: keyCodes.META, key: 'Meta'},
};

/**
 * A `TestElement` implementation for unit tests.
 *
 * 用于单元测试的 `TestElement`。
 *
 */
export class UnitTestElement implements TestElement {
  constructor(readonly element: Element, private _stabilize: () => Promise<void>) {}

  /**
   * Blur the element.
   *
   * 让此元素失焦。
   *
   */
  async blur(): Promise<void> {
    triggerBlur(this.element as HTMLElement);
    await this._stabilize();
  }

  /**
   * Clear the element's input (for input and textarea elements only).
   *
   * 清除元素的输入（仅适用于 input 和 textarea 元素）。
   *
   */
  async clear(): Promise<void> {
    if (!isTextInput(this.element)) {
      throw Error('Attempting to clear an invalid element');
    }
    clearElement(this.element);
    await this._stabilize();
  }

  /**
   * Click the element at the default location for the current environment. If you need to guarantee
   * the element is clicked at a specific location, consider using `click('center')` or
   * `click(x, y)` instead.
   *
   * 单击当前环境默认位置的元素。如果需要确保在特定位置单击元素，请考虑改用 `click('center')` 或 `click(x, y)`。
   *
   */
  click(modifiers?: ModifierKeys): Promise<void>;
  /**
   * Click the element at the element's center.
   *
   * 单击此元素中心的元素。
   *
   */
  click(location: 'center', modifiers?: ModifierKeys): Promise<void>;
  /**
   * Click the element at the specified coordinates relative to the top-left of the element.
   *
   * 单击相对于元素左上角的指定坐标处的元素。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 要点击的 X 轴的元素内坐标。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 要点击的 Y 轴的元素内坐标。
   *
   * @param modifiers Modifier keys held while clicking
   *
   * 单击时按住的修饰键
   *
   */
  click(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;
  async click(
    ...args: [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]
  ): Promise<void> {
    const isDisabled = (this.element as Partial<{disabled?: boolean}>).disabled === true;

    // If the element is `disabled` and has a `disabled` property, we emit the mouse event
    // sequence but not dispatch the `click` event. This is necessary to keep the behavior
    // consistent with an actual user interaction. The click event is not necessarily
    // automatically prevented by the browser. There is mismatch between Firefox and Chromium:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=329509.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1115661.
    await this._dispatchMouseEventSequence(isDisabled ? null : 'click', args, 0);
    await this._stabilize();
  }

  /**
   * Right clicks on the element at the specified coordinates relative to the top-left of it.
   *
   * 右键单击相对于元素左上角的指定坐标处的元素。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 要点击的 X 轴的元素内坐标。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 要点击的 Y 轴的元素内坐标。
   *
   * @param modifiers Modifier keys held while clicking
   *
   * 单击时按住的修饰键
   *
   */
  rightClick(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;
  async rightClick(
    ...args: [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]
  ): Promise<void> {
    await this._dispatchMouseEventSequence('contextmenu', args, 2);
    await this._stabilize();
  }

  /**
   * Focus the element.
   *
   * 让此元素获得焦点。
   *
   */
  async focus(): Promise<void> {
    triggerFocus(this.element as HTMLElement);
    await this._stabilize();
  }

  /**
   * Get the computed value of the given CSS property for the element.
   *
   * 获取此元素的给定 CSS 属性的已计算值。
   *
   */
  async getCssValue(property: string): Promise<string> {
    await this._stabilize();
    // TODO(mmalerba): Consider adding value normalization if we run into common cases where its
    //  needed.
    return getComputedStyle(this.element).getPropertyValue(property);
  }

  /**
   * Hovers the mouse over the element.
   *
   * 将鼠标悬停在此元素上。
   *
   */
  async hover(): Promise<void> {
    this._dispatchPointerEventIfSupported('pointerenter');
    dispatchMouseEvent(this.element, 'mouseover');
    dispatchMouseEvent(this.element, 'mouseenter');
    await this._stabilize();
  }

  /**
   * Moves the mouse away from the element.
   *
   * 将鼠标从此元素移开。
   *
   */
  async mouseAway(): Promise<void> {
    this._dispatchPointerEventIfSupported('pointerleave');
    dispatchMouseEvent(this.element, 'mouseout');
    dispatchMouseEvent(this.element, 'mouseleave');
    await this._stabilize();
  }

  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value. Note that this cannot
   * reproduce native browser behavior for keyboard shortcuts such as Tab, Ctrl + A, etc.
   *
   * 通过一系列按键将给定的字符串发送到输入框。还会触发 input 事件，并尝试将字符串添加到 Element 的值。注意，这种方式不能复现快捷键（如 Tab、Ctrl + A 等）在浏览器中的原生行为。
   *
   */
  async sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 通过一系列按键将给定的字符串发送到输入框。还触发 input 事件，并尝试将字符串添加到 Element 的值。
   *
   */
  async sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>;
  async sendKeys(...modifiersAndKeys: any[]): Promise<void> {
    const args = modifiersAndKeys.map(k => (typeof k === 'number' ? keyMap[k as TestKey] : k));
    typeInElement(this.element as HTMLElement, ...args);
    await this._stabilize();
  }

  /**
   * Gets the text from the element.
   *
   * 从元素获取文本。
   *
   * @param options Options that affect what text is included.
   *
   * 影响包括哪些文本的选项。
   *
   */
  async text(options?: TextOptions): Promise<string> {
    await this._stabilize();
    if (options?.exclude) {
      return _getTextWithExcludedElements(this.element, options.exclude);
    }
    return (this.element.textContent || '').trim();
  }

  /**
   * Gets the value for the given attribute from the element.
   *
   * 从此元素获取给定属性的值。
   *
   */
  async getAttribute(name: string): Promise<string | null> {
    await this._stabilize();
    return this.element.getAttribute(name);
  }

  /**
   * Checks whether the element has the given class.
   *
   * 检查此元素是否具有给定的类。
   *
   */
  async hasClass(name: string): Promise<boolean> {
    await this._stabilize();
    return this.element.classList.contains(name);
  }

  /**
   * Gets the dimensions of the element.
   *
   * 获取此元素的尺寸。
   *
   */
  async getDimensions(): Promise<ElementDimensions> {
    await this._stabilize();
    return this.element.getBoundingClientRect();
  }

  /**
   * Gets the value of a property of an element.
   *
   * 获取此元素的属性的值。
   *
   */
  async getProperty<T = any>(name: string): Promise<T> {
    await this._stabilize();
    return (this.element as any)[name];
  }

  /**
   * Sets the value of a property of an input.
   *
   * 设置输入属性的值。
   *
   */
  async setInputValue(value: string): Promise<void> {
    (this.element as any).value = value;
    await this._stabilize();
  }

  /**
   * Selects the options at the specified indexes inside of a native `select` element.
   *
   * 选择此 `select` 元素内指定索引处的选择项。
   *
   */
  async selectOptions(...optionIndexes: number[]): Promise<void> {
    let hasChanged = false;
    const options = this.element.querySelectorAll('option');
    const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.

    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const wasSelected = option.selected;

      // We have to go through `option.selected`, because `HTMLSelectElement.value` doesn't
      // allow for multiple options to be selected, even in `multiple` mode.
      option.selected = indexes.has(i);

      if (option.selected !== wasSelected) {
        hasChanged = true;
        dispatchFakeEvent(this.element, 'change');
      }
    }

    if (hasChanged) {
      await this._stabilize();
    }
  }

  /**
   * Checks whether this element matches the given selector.
   *
   * 检查此元素是否与给定的选择器匹配。
   *
   */
  async matchesSelector(selector: string): Promise<boolean> {
    await this._stabilize();
    const elementPrototype = Element.prototype as any;
    return (elementPrototype['matches'] || elementPrototype['msMatchesSelector']).call(
      this.element,
      selector,
    );
  }

  /**
   * Checks whether the element is focused.
   *
   * 检查此元素是否拥有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    await this._stabilize();
    return document.activeElement === this.element;
  }

  /**
   * Dispatches an event with a particular name.
   *
   * 派发具有特定名称的事件。
   *
   * @param name Name of the event to be dispatched.
   *
   * 要派发的事件的名称。
   *
   */
  async dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void> {
    const event = createFakeEvent(name);

    if (data) {
      // tslint:disable-next-line:ban Have to use `Object.assign` to preserve the original object.
      Object.assign(event, data);
    }

    dispatchEvent(this.element, event);
    await this._stabilize();
  }

  /**
   * Dispatches a pointer event on the current element if the browser supports it.
   *
   * 如果浏览器支持，则在当前元素上派发指针事件。
   *
   * @param name Name of the pointer event to be dispatched.
   *
   * 要派发的指针事件的名称。
   *
   * @param clientX Coordinate of the user's pointer along the X axis.
   *
   * 用户指针沿 X 轴的坐标。
   *
   * @param clientY Coordinate of the user's pointer along the Y axis.
   *
   * 用户指针沿 Y 轴的坐标。
   *
   * @param button Mouse button that should be pressed when dispatching the event.
   *
   * 派发事件时应按下的鼠标按钮。
   *
   */
  private _dispatchPointerEventIfSupported(
    name: string,
    clientX?: number,
    clientY?: number,
    offsetX?: number,
    offsetY?: number,
    button?: number,
  ) {
    // The latest versions of all browsers we support have the new `PointerEvent` API.
    // Though since we capture the two most recent versions of these browsers, we also
    // need to support Safari 12 at time of writing. Safari 12 does not have support for this,
    // so we need to conditionally create and dispatch these events based on feature detection.
    if (typeof PointerEvent !== 'undefined' && PointerEvent) {
      dispatchPointerEvent(this.element, name, clientX, clientY, offsetX, offsetY, {
        isPrimary: true,
        button,
      });
    }
  }

  /**
   * Dispatches all the events that are part of a mouse event sequence
   * and then emits a given primary event at the end, if speciifed.
   *
   * 派发属于鼠标事件序列的所有事件，最后发出指定的主事件（如果指定过）。
   */
  private async _dispatchMouseEventSequence(
    primaryEventName: string | null,
    args: [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?],
    button?: number,
  ) {
    let clientX: number | undefined = undefined;
    let clientY: number | undefined = undefined;
    let offsetX: number | undefined = undefined;
    let offsetY: number | undefined = undefined;
    let modifiers: ModifierKeys = {};

    if (args.length && typeof args[args.length - 1] === 'object') {
      modifiers = args.pop() as ModifierKeys;
    }

    if (args.length) {
      const {left, top, width, height} = await this.getDimensions();
      offsetX = args[0] === 'center' ? width / 2 : (args[0] as number);
      offsetY = args[0] === 'center' ? height / 2 : (args[1] as number);

      // Round the computed click position as decimal pixels are not
      // supported by mouse events and could lead to unexpected results.
      clientX = Math.round(left + offsetX);
      clientY = Math.round(top + offsetY);
    }

    this._dispatchPointerEventIfSupported(
      'pointerdown',
      clientX,
      clientY,
      offsetX,
      offsetY,
      button,
    );
    dispatchMouseEvent(
      this.element,
      'mousedown',
      clientX,
      clientY,
      offsetX,
      offsetY,
      button,
      modifiers,
    );
    this._dispatchPointerEventIfSupported('pointerup', clientX, clientY, offsetX, offsetY, button);
    dispatchMouseEvent(
      this.element,
      'mouseup',
      clientX,
      clientY,
      offsetX,
      offsetY,
      button,
      modifiers,
    );

    // If a primary event name is specified, emit it after the mouse event sequence.
    if (primaryEventName !== null) {
      dispatchMouseEvent(
        this.element,
        primaryEventName,
        clientX,
        clientY,
        offsetX,
        offsetY,
        button,
        modifiers,
      );
    }

    // This call to _stabilize should not be needed since the callers will already do that them-
    // selves. Nevertheless it breaks some tests in g3 without it. It needs to be investigated
    // why removing breaks those tests.
    // See: https://github.com/angular/components/pull/20758/files#r520886256.
    await this._stabilize();
  }
}
