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
  EventData,
  getNoKeysSpecifiedError,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
} from '@angular/cdk/testing';
import * as webdriver from 'selenium-webdriver';
import {getSeleniumWebDriverModifierKeys, seleniumWebDriverKeyMap} from './selenium-webdriver-keys';

/**
 * A `TestElement` implementation for WebDriver.
 *
 * WebDriver 的 `TestElement` 实现。
 *
 */
export class SeleniumWebDriverElement implements TestElement {
  constructor(
    readonly element: () => webdriver.WebElement,
    private _stabilize: () => Promise<void>,
  ) {}

  /**
   * Blur the element.
   *
   * 让此元素失焦。
   *
   */
  async blur(): Promise<void> {
    await this._executeScript((element: HTMLElement) => element.blur(), this.element());
    await this._stabilize();
  }

  /**
   * Clear the element's input (for input and textarea elements only).
   *
   * 清除此元素的输入（仅适用于 input 和 textarea 元素）。
   *
   */
  async clear(): Promise<void> {
    await this.element().clear();
    await this._stabilize();
  }

  /**
   * Click the element at the default location for the current environment. If you need to guarantee
   * the element is clicked at a specific location, consider using `click('center')` or
   * `click(x, y)` instead.
   *
   * 单击当前环境下处于默认位置处的元素。如果需要确保在特定位置单击元素，请考虑改用 `click('center')` 或 `click(x, y)`。
   *
   */
  click(modifiers?: ModifierKeys): Promise<void>;
  /**
   * Click the element at the element's center.
   *
   * 单击元素中心的元素。
   *
   */
  click(location: 'center', modifiers?: ModifierKeys): Promise<void>;
  /**
   * Click the element at the specified coordinates relative to the top-left of the element.
   *
   * 单击相对于此元素左上角的指定坐标处的元素。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 沿所单击的 X 轴方向的元素内坐标。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 沿所单击的 Y 轴方向的元素内坐标。
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
    await this._dispatchClickEventSequence(args, webdriver.Button.LEFT);
    await this._stabilize();
  }

  /**
   * Right clicks on the element at the specified coordinates relative to the top-left of it.
   *
   * 右键单击相对于元素左上角的指定坐标处的元素。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 沿所单击的 X 轴方向的元素内坐标。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 沿所单击的 Y 轴方向的元素内坐标。
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
    await this._dispatchClickEventSequence(args, webdriver.Button.RIGHT);
    await this._stabilize();
  }

  /**
   * Focus the element.
   *
   * 让元素获得焦点。
   *
   */
  async focus(): Promise<void> {
    await this._executeScript((element: HTMLElement) => element.focus(), this.element());
    await this._stabilize();
  }

  /**
   * Get the computed value of the given CSS property for the element.
   *
   * 获取元素的给定 CSS 属性的已计算值。
   *
   */
  async getCssValue(property: string): Promise<string> {
    await this._stabilize();
    return this.element().getCssValue(property);
  }

  /**
   * Hovers the mouse over the element.
   *
   * 将鼠标悬停在元素上。
   *
   */
  async hover(): Promise<void> {
    await this._actions().mouseMove(this.element()).perform();
    await this._stabilize();
  }

  /**
   * Moves the mouse away from the element.
   *
   * 将鼠标从此元素移开。
   *
   */
  async mouseAway(): Promise<void> {
    await this._actions().mouseMove(this.element(), {x: -1, y: -1}).perform();
    await this._stabilize();
  }

  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 通过一系列按键将给定的字符串发送到输入框。还会触发 input 事件，并尝试将字符串添加到 Element 的值。
   *
   */
  async sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 通过一系列按键将给定的字符串发送到输入框。还会触发 input 事件，并尝试将字符串添加到 Element 的值。
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

    const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);
    const keys = rest
      .map(k => (typeof k === 'string' ? k.split('') : [seleniumWebDriverKeyMap[k]]))
      .reduce((arr, k) => arr.concat(k), [])
      // webdriver.Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
      // so avoid it if no modifier keys are required.
      .map(k => (modifierKeys.length > 0 ? webdriver.Key.chord(...modifierKeys, k) : k));

    // Throw an error if no keys have been specified. Calling this function with no
    // keys should not result in a focus event being dispatched unexpectedly.
    if (keys.length === 0) {
      throw getNoKeysSpecifiedError();
    }

    await this.element().sendKeys(...keys);
    await this._stabilize();
  }

  /**
   * Gets the text from the element.
   *
   * 从元素获取文本。
   *
   * @param options Options that affect what text is included.
   *
   * 影响要包含哪些文本的选项。
   *
   */
  async text(options?: TextOptions): Promise<string> {
    await this._stabilize();
    if (options?.exclude) {
      return this._executeScript(_getTextWithExcludedElements, this.element(), options.exclude);
    }
    // We don't go through the WebDriver `getText`, because it excludes text from hidden elements.
    return this._executeScript(
      (element: Element) => (element.textContent || '').trim(),
      this.element(),
    );
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

    await this._stabilize();
    return this._executeScript(
      (element: Element, valueToSet: string) => (element.textContent = valueToSet),
      this.element(),
      value,
    );
  }

  /**
   * Gets the value for the given attribute from the element.
   *
   * 从此元素获取给定属性的值。
   *
   */
  async getAttribute(name: string): Promise<string | null> {
    await this._stabilize();
    return this._executeScript(
      (element: Element, attribute: string) => element.getAttribute(attribute),
      this.element(),
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
    await this._stabilize();
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
    await this._stabilize();
    const {width, height} = await this.element().getSize();
    const {x: left, y: top} = await this.element().getLocation();
    return {width, height, left, top};
  }

  /**
   * Gets the value of a property of an element.
   *
   * 获取此元素的属性的值。
   *
   */
  async getProperty<T = any>(name: string): Promise<T> {
    await this._stabilize();
    return this._executeScript(
      (element: Element, property: keyof Element) => element[property],
      this.element(),
      name,
    );
  }

  /**
   * Sets the value of a property of an input.
   *
   * 设置输入框值属性的值。
   *
   */
  async setInputValue(newValue: string): Promise<void> {
    await this._executeScript(
      (element: HTMLInputElement, value: string) => (element.value = value),
      this.element(),
      newValue,
    );
    await this._stabilize();
  }

  /**
   * Selects the options at the specified indexes inside of a native `select` element.
   *
   * 在原生 `select` 元素内的指定索引处选择选项。
   *
   */
  async selectOptions(...optionIndexes: number[]): Promise<void> {
    await this._stabilize();
    const options = await this.element().findElements(webdriver.By.css('option'));
    const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.

    if (options.length && indexes.size) {
      // Reset the value so all the selected states are cleared. We can
      // reuse the input-specific method since the logic is the same.
      await this.setInputValue('');

      for (let i = 0; i < options.length; i++) {
        if (indexes.has(i)) {
          // We have to hold the control key while clicking on options so that multiple can be
          // selected in multi-selection mode. The key doesn't do anything for single selection.
          await this._actions().keyDown(webdriver.Key.CONTROL).perform();
          await options[i].click();
          await this._actions().keyUp(webdriver.Key.CONTROL).perform();
        }
      }

      await this._stabilize();
    }
  }

  /**
   * Checks whether this element matches the given selector.
   *
   * 检查此元素是否与给定的选择器相匹配。
   *
   */
  async matchesSelector(selector: string): Promise<boolean> {
    await this._stabilize();
    return this._executeScript(
      (element: Element, s: string) =>
        (Element.prototype.matches || (Element.prototype as any).msMatchesSelector).call(
          element,
          s,
        ),
      this.element(),
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
    return webdriver.WebElement.equals(
      this.element(),
      this.element().getDriver().switchTo().activeElement(),
    );
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
    await this._executeScript(dispatchEvent, name, this.element(), data);
    await this._stabilize();
  }

  /**
   * Gets the webdriver action sequence.
   *
   * 获取 WebDriver 的操作序列。
   *
   */
  private _actions() {
    return this.element().getDriver().actions();
  }

  /**
   * Executes a function in the browser.
   *
   * 在浏览器中执行某个函数。
   *
   */
  private async _executeScript<T>(script: Function, ...var_args: any[]): Promise<T> {
    return this.element()
      .getDriver()
      .executeScript(script, ...var_args);
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
    const modifierKeys = getSeleniumWebDriverModifierKeys(modifiers);

    // Omitting the offset argument to mouseMove results in clicking the center.
    // This is the default behavior we want, so we use an empty array of offsetArgs if
    // no args remain after popping the modifiers from the args passed to this function.
    const offsetArgs = (args.length === 2 ? [{x: args[0], y: args[1]}] : []) as [
      {x: number; y: number},
    ];

    let actions = this._actions().mouseMove(this.element(), ...offsetArgs);

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
 * Dispatches an event with a particular name and data to an element. Note that this needs to be a
 * pure function, because it gets stringified by WebDriver and is executed inside the browser.
 *
 * 将具有特定名称和数据的事件派发到元素。请注意，这必须是纯函数，因为它会被 WebDriver 字符串化并在浏览器内部执行。
 *
 */
function dispatchEvent(name: string, element: Element, data?: Record<string, EventData>) {
  const event = document.createEvent('Event');
  event.initEvent(name);
  // tslint:disable-next-line:ban Have to use `Object.assign` to preserve the original object.
  Object.assign(event, data || {});
  element.dispatchEvent(event);
}
