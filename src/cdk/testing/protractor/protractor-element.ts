/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  _getTextWithExcludedElements,
  ElementDimensions,
  getNoKeysSpecifiedError,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
  EventData,
} from '@angular/cdk/testing';
import {browser, Button, by, ElementFinder, Key} from 'protractor';

/**
 * Maps the `TestKey` constants to Protractor's `Key` constants.
 *
 * 将 `TestKey` 常量映射到 Protractor 的 `Key` 常量。
 *
 */
const keyMap = {
  [TestKey.BACKSPACE]: Key.BACK_SPACE,
  [TestKey.TAB]: Key.TAB,
  [TestKey.ENTER]: Key.ENTER,
  [TestKey.SHIFT]: Key.SHIFT,
  [TestKey.CONTROL]: Key.CONTROL,
  [TestKey.ALT]: Key.ALT,
  [TestKey.ESCAPE]: Key.ESCAPE,
  [TestKey.PAGE_UP]: Key.PAGE_UP,
  [TestKey.PAGE_DOWN]: Key.PAGE_DOWN,
  [TestKey.END]: Key.END,
  [TestKey.HOME]: Key.HOME,
  [TestKey.LEFT_ARROW]: Key.ARROW_LEFT,
  [TestKey.UP_ARROW]: Key.ARROW_UP,
  [TestKey.RIGHT_ARROW]: Key.ARROW_RIGHT,
  [TestKey.DOWN_ARROW]: Key.ARROW_DOWN,
  [TestKey.INSERT]: Key.INSERT,
  [TestKey.DELETE]: Key.DELETE,
  [TestKey.F1]: Key.F1,
  [TestKey.F2]: Key.F2,
  [TestKey.F3]: Key.F3,
  [TestKey.F4]: Key.F4,
  [TestKey.F5]: Key.F5,
  [TestKey.F6]: Key.F6,
  [TestKey.F7]: Key.F7,
  [TestKey.F8]: Key.F8,
  [TestKey.F9]: Key.F9,
  [TestKey.F10]: Key.F10,
  [TestKey.F11]: Key.F11,
  [TestKey.F12]: Key.F12,
  [TestKey.META]: Key.META,
  [TestKey.COMMA]: ',',
};

/**
 * Converts a `ModifierKeys` object to a list of Protractor `Key`s.
 *
 * 将 `ModifierKeys` 对象转换为 Protractor `Key` 的列表。
 *
 */
function toProtractorModifierKeys(modifiers: ModifierKeys): string[] {
  const result: string[] = [];
  if (modifiers.control) {
    result.push(Key.CONTROL);
  }
  if (modifiers.alt) {
    result.push(Key.ALT);
  }
  if (modifiers.shift) {
    result.push(Key.SHIFT);
  }
  if (modifiers.meta) {
    result.push(Key.META);
  }
  return result;
}

/**
 * A `TestElement` implementation for Protractor.
 *
 * 用于 Protractor 的 `TestElement`
 *
 * @deprecated
 * @breaking-change 13.0.0
 */
export class ProtractorElement implements TestElement {
  constructor(readonly element: ElementFinder) {}

  /**
   * Blur the element.
   *
   * 让此元素失焦。
   *
   */
  async blur(): Promise<void> {
    return browser.executeScript('arguments[0].blur()', this.element);
  }

  /**
   * Clear the element's input \(for input and textarea elements only\).
   *
   * 清除元素的输入（仅适用于 input 和 textarea 元素）。
   *
   */
  async clear(): Promise<void> {
    return this.element.clear();
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
   * 沿元素的坐标在 X 轴上单击。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 在元素内沿单击的 Y 轴进行坐标调整。
   *
   * @param modifiers Modifier keys held while clicking
   *
   * 单击时按住修饰键
   *
   */
  click(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;
  async click(
    ...args: [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]
  ): Promise<void> {
    await this._dispatchClickEventSequence(args, Button.LEFT);
  }

  /**
   * Right clicks on the element at the specified coordinates relative to the top-left of it.
   *
   * 右键单击相对于元素左上角的指定坐标处的元素。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 沿元素的坐标在 X 轴上单击。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 在元素内沿单击的 Y 轴进行坐标调整。
   *
   * @param modifiers Modifier keys held while clicking
   *
   * 单击时按住修饰键
   *
   */
  rightClick(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;
  async rightClick(
    ...args: [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?]
  ): Promise<void> {
    await this._dispatchClickEventSequence(args, Button.RIGHT);
  }

  /**
   * Focus the element.
   *
   * 让元素获得焦点。
   *
   */
  async focus(): Promise<void> {
    return browser.executeScript('arguments[0].focus()', this.element);
  }

  /**
   * Get the computed value of the given CSS property for the element.
   *
   * 获取元素的给定 CSS 属性的已计算值。
   *
   */
  async getCssValue(property: string): Promise<string> {
    return this.element.getCssValue(property);
  }

  /**
   * Hovers the mouse over the element.
   *
   * 将鼠标悬停在元素上。
   *
   */
  async hover(): Promise<void> {
    return browser
      .actions()
      .mouseMove(await this.element.getWebElement())
      .perform();
  }

  /**
   * Moves the mouse away from the element.
   *
   * 将鼠标从此元素移开。
   *
   */
  async mouseAway(): Promise<void> {
    return browser
      .actions()
      .mouseMove(await this.element.getWebElement(), {x: -1, y: -1})
      .perform();
  }

  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 通过一系列按键将给定的字符串发送到输入。还触发输入事件，并尝试将字符串添加到 Element 的值。
   *
   */
  async sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 通过一系列按键将给定的字符串发送到输入框。还会触发输入事件，并尝试将字符串添加到 Element 的值。
   *
   */
  async sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>;
  async sendKeys(...modifiersAndKeys: any[]): Promise<void> {
    const first = modifiersAndKeys[0];
    let modifiers: ModifierKeys;
    let rest: (string | TestKey)[];
    if (first !== undefined && typeof first !== 'string' && typeof first !== 'number') {
      modifiers = first;
      rest = modifiersAndKeys.slice(1);
    } else {
      modifiers = {};
      rest = modifiersAndKeys;
    }

    const modifierKeys = toProtractorModifierKeys(modifiers);
    const keys = rest
      .map(k => (typeof k === 'string' ? k.split('') : [keyMap[k]]))
      .reduce((arr, k) => arr.concat(k), [])
      // Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
      // so avoid it if no modifier keys are required.
      .map(k => (modifierKeys.length > 0 ? Key.chord(...modifierKeys, k) : k));

    // Throw an error if no keys have been specified. Calling this function with no
    // keys should not result in a focus event being dispatched unexpectedly.
    if (keys.length === 0) {
      throw getNoKeysSpecifiedError();
    }

    return this.element.sendKeys(...keys);
  }

  /**
   * Gets the text from the element.
   *
   * 从此元素获取文本。
   *
   * @param options Options that affect what text is included.
   *
   * 影响包括哪些文本的选项。
   *
   */
  async text(options?: TextOptions): Promise<string> {
    if (options?.exclude) {
      return browser.executeScript(_getTextWithExcludedElements, this.element, options.exclude);
    }
    // We don't go through Protractor's `getText`, because it excludes text from hidden elements.
    return browser.executeScript(`return (arguments[0].textContent || '').trim()`, this.element);
  }

  /**
   * Sets the value of a `contenteditable` element.
   * @param value Value to be set on the element.
   */
  async setContenteditableValue(value: string): Promise<void> {
    const contenteditableAttr = await this.getAttribute('contenteditable');

    if (contenteditableAttr !== '' && contenteditableAttr !== 'true') {
      throw new Error('setContenteditableValue can only be called on a `contenteditable` element.');
    }

    return browser.executeScript(`arguments[0].textContent = arguments[1];`, this.element, value);
  }

  /**
   * Gets the value for the given attribute from the element.
   *
   * 从此元素获取给定属性的值。
   *
   */
  async getAttribute(name: string): Promise<string | null> {
    return browser.executeScript(
      `return arguments[0].getAttribute(arguments[1])`,
      this.element,
      name,
    );
  }

  /**
   * Checks whether the element has the given class.
   *
   * 检查此元素是否具有给定的类。
   *
   */
  async hasClass(name: string): Promise<boolean> {
    const classes = (await this.getAttribute('class')) || '';
    return new Set(classes.split(/\s+/).filter(c => c)).has(name);
  }

  /**
   * Gets the dimensions of the element.
   *
   * 获取此元素的尺寸。
   *
   */
  async getDimensions(): Promise<ElementDimensions> {
    const {width, height} = await this.element.getSize();
    const {x: left, y: top} = await this.element.getLocation();
    return {width, height, left, top};
  }

  /**
   * Gets the value of a property of an element.
   *
   * 获取此元素的属性的值。
   *
   */
  async getProperty<T = any>(name: string): Promise<T> {
    return browser.executeScript(`return arguments[0][arguments[1]]`, this.element, name);
  }

  /**
   * Sets the value of a property of an input.
   *
   * 设置输入属性的值。
   *
   */
  async setInputValue(value: string): Promise<void> {
    return browser.executeScript(`arguments[0].value = arguments[1]`, this.element, value);
  }

  /**
   * Selects the options at the specified indexes inside of a native `select` element.
   *
   * 在 `select` 元素内的指定索引处选择选项。
   *
   */
  async selectOptions(...optionIndexes: number[]): Promise<void> {
    const options = await this.element.all(by.css('option'));
    const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.

    if (options.length && indexes.size) {
      // Reset the value so all the selected states are cleared. We can
      // reuse the input-specific method since the logic is the same.
      await this.setInputValue('');

      for (let i = 0; i < options.length; i++) {
        if (indexes.has(i)) {
          // We have to hold the control key while clicking on options so that multiple can be
          // selected in multi-selection mode. The key doesn't do anything for single selection.
          await browser.actions().keyDown(Key.CONTROL).perform();
          await options[i].click();
          await browser.actions().keyUp(Key.CONTROL).perform();
        }
      }
    }
  }

  /**
   * Checks whether this element matches the given selector.
   *
   * 检查此元素是否与给定的选择器匹配。
   *
   */
  async matchesSelector(selector: string): Promise<boolean> {
    return browser.executeScript(
      `
          return (Element.prototype.matches ||
                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])
          `,
      this.element,
      selector,
    );
  }

  /**
   * Checks whether the element is focused.
   *
   * 检查元素是否具有焦点。
   *
   */
  async isFocused(): Promise<boolean> {
    return this.element.equals(browser.driver.switchTo().activeElement());
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
    return browser.executeScript(_dispatchEvent, name, this.element, data);
  }

  /**
   * Dispatches all the events that are part of a click event sequence.
   *
   * 派发属于 click 事件序列一部分的所有事件。
   *
   */
  private async _dispatchClickEventSequence(
    args: [ModifierKeys?] | ['center', ModifierKeys?] | [number, number, ModifierKeys?],
    button: string,
  ) {
    let modifiers: ModifierKeys = {};
    if (args.length && typeof args[args.length - 1] === 'object') {
      modifiers = args.pop() as ModifierKeys;
    }
    const modifierKeys = toProtractorModifierKeys(modifiers);

    // Omitting the offset argument to mouseMove results in clicking the center.
    // This is the default behavior we want, so we use an empty array of offsetArgs if
    // no args remain after popping the modifiers from the args passed to this function.
    const offsetArgs = (args.length === 2 ? [{x: args[0], y: args[1]}] : []) as [
      {x: number; y: number},
    ];

    let actions = browser.actions().mouseMove(await this.element.getWebElement(), ...offsetArgs);

    for (const modifierKey of modifierKeys) {
      actions = actions.keyDown(modifierKey);
    }
    actions = actions.click(button);
    for (const modifierKey of modifierKeys) {
      actions = actions.keyUp(modifierKey);
    }

    await actions.perform();
  }
}

/**
 * Dispatches an event with a particular name and data to an element.
 * Note that this needs to be a pure function, because it gets stringified by
 * Protractor and is executed inside the browser.
 *
 * 将具有特定名称和数据的事件派发到元素。请注意，这必须是纯函数，因为它会由 Protractor 进行字符串化并在浏览器中执行。
 *
 */
function _dispatchEvent(name: string, element: ElementFinder, data?: Record<string, EventData>) {
  const event = document.createEvent('Event');
  event.initEvent(name);

  if (data) {
    // tslint:disable-next-line:ban Have to use `Object.assign` to preserve the original object.
    Object.assign(event, data);
  }

  // This type has a string index signature, so we cannot access it using a dotted property access.
  element['dispatchEvent'](event);
}
