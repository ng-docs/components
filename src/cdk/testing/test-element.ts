/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ElementDimensions} from './element-dimensions';

/**
 * Modifier keys that may be held while typing.
 *
 * 打字时可能会按住的修饰键。
 *
 */
export interface ModifierKeys {
  control?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/**
 * Data that can be attached to a custom event dispatched from a `TestElement`.
 *
 * `TestElement` 派发的自定义事件可以携带的数据。
 *
 */
export type EventData =
    string | number | boolean | undefined | null | EventData[] | {[key: string]: EventData};

/**
 * An enum of non-text keys that can be used with the `sendKeys` method.
 *
 * 非文本按键的枚举，可以和 `sendKeys` 方法一起使用。
 *
 */
// NOTE: This is a separate enum from `@angular/cdk/keycodes` because we don't necessarily want to
// support every possible keyCode. We also can't rely on Protractor's `Key` because we don't want a
// dependency on any particular testing framework here. Instead we'll just maintain this supported
// list of keys and let individual concrete `HarnessEnvironment` classes map them to whatever key
// representation is used in its respective testing framework.
// tslint:disable-next-line:prefer-const-enum Seems like this causes some issues with System.js
export enum TestKey {
  BACKSPACE,
  TAB,
  ENTER,
  SHIFT,
  CONTROL,
  ALT,
  ESCAPE,
  PAGE_UP,
  PAGE_DOWN,
  END,
  HOME,
  LEFT_ARROW,
  UP_ARROW,
  RIGHT_ARROW,
  DOWN_ARROW,
  INSERT,
  DELETE,
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
  META
}

/**
 * This acts as a common interface for DOM elements across both unit and e2e tests. It is the
 * interface through which the ComponentHarness interacts with the component's DOM.
 *
 * 这可以作为单元和 e2e 测试中 DOM 元素的通用接口。它是 ComponentHarness 与组件 DOM 交互的接口。
 *
 */
export interface TestElement {
  /**
   * Blur the element.
   *
   * 让元素失焦。
   *
   */
  blur(): Promise<void>;

  /**
   * Clear the element's input (for input and textarea elements only).
   *
   * 清除元素的输入（只适用于 input 和 textarea 元素）。
   *
   */
  clear(): Promise<void>;

  /**
   * Click the element at the default location for the current environment. If you need to guarantee
   * the element is clicked at a specific location, consider using `click('center')` or
   * `click(x, y)` instead.
   *
   * 单击当前环境下位于默认位置的元素。
   * 如果你需要保证在某个特定的位置单击该元素，可以考虑 `click('center')` 或 `click(x, y)`。
   *
   */
  click(modifiers?: ModifierKeys): Promise<void>;

  /**
   * Click the element at the element's center.
   *
   * 在元素中心单击此元素。
   *
   */
  click(location: 'center', modifiers?: ModifierKeys): Promise<void>;

  /**
   * Click the element at the specified coordinates relative to the top-left of the element.
   *
   * 单击相对于该元素左上方的指定坐标处的元素。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 元素内部的相对坐标 x。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 元素内部的相对坐标 y。
   *
   * @param modifiers Modifier keys held while clicking
   *
   * 单击时会按住的修饰键
   *
   */
  click(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;

  /**
   * Right clicks on the element at the specified coordinates relative to the top-left of it.
   *
   * 在相对于该元素左上角的指定坐标处右键单击它。
   *
   * @param relativeX Coordinate within the element, along the X-axis at which to click.
   *
   * 元素内部的相对坐标 x。
   *
   * @param relativeY Coordinate within the element, along the Y-axis at which to click.
   *
   * 元素内部的相对坐标 y。
   *
   * @param modifiers Modifier keys held while clicking
   *
   * 单击时按住的修饰键
   *
   */
  rightClick(relativeX: number, relativeY: number, modifiers?: ModifierKeys): Promise<void>;

  /**
   * Focus the element.
   *
   * 让此元素获得焦点。
   *
   */
  focus(): Promise<void>;

  /**
   * Get the computed value of the given CSS property for the element.
   *
   * 获取该元素的指定 CSS 属性的计算值。
   *
   */
  getCssValue(property: string): Promise<string>;

  /**
   * Hovers the mouse over the element.
   *
   * 将鼠标悬停在元素上方。
   *
   */
  hover(): Promise<void>;

  /**
   * Moves the mouse away from the element.
   *
   * 将鼠标从此元素移开。
   *
   */
  mouseAway(): Promise<void>;

  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 以按键序列的形式，把指定的字符串发送给输入设备。同时触发输入事件，并尝试将该字符串添加到 Element 的值中。
   *
   */
  sendKeys(...keys: (string | TestKey)[]): Promise<void>;

  /**
   * Sends the given string to the input as a series of key presses. Also fires input events
   * and attempts to add the string to the Element's value.
   *
   * 以按键序列的形式，把指定的字符串发送给输入设备。同时触发输入事件，并尝试将该字符串添加到 Element 的值中。
   *
   */
  sendKeys(modifiers: ModifierKeys, ...keys: (string | TestKey)[]): Promise<void>;

  /**
   * Gets the text from the element.
   *
   * 从元素中获取文本。
   *
   * @param options Options that affect what text is included.
   *
   * 影响要包含哪些文本的选项。
   *
   */
  text(options?: TextOptions): Promise<string>;

  /**
   * Gets the value for the given attribute from the element.
   *
   * 从元素中获取指定 attribute 的值。
   *
   */
  getAttribute(name: string): Promise<string | null>;

  /**
   * Checks whether the element has the given class.
   *
   * 检查元素是否具有指定的类。
   *
   */
  hasClass(name: string): Promise<boolean>;

  /**
   * Gets the dimensions of the element.
   *
   * 获取该元素的规格。
   *
   */
  getDimensions(): Promise<ElementDimensions>;

  /**
   * Gets the value of a property of an element.
   *
   * 获取一个 element 的 property 的值。
   *
   */
  getProperty(name: string): Promise<any>;

  /**
   * Checks whether this element matches the given selector.
   *
   * 检查此元素是否与指定的选择器匹配。
   *
   */
  matchesSelector(selector: string): Promise<boolean>;

  /**
   * Checks whether the element is focused.
   *
   * 检查该元素是否拥有焦点。
   *
   */
  isFocused(): Promise<boolean>;

  /**
   * Sets the value of a property of an input.
   *
   * 设置输入框的属性值。
   *
   */
  setInputValue(value: string): Promise<void>;

  // Note that ideally here we'd be selecting options based on their value, rather than their
  // index, but we're limited by `@angular/forms` which will modify the option value in some cases.
  // Since the value will be truncated, we can't rely on it to do the lookup in the DOM. See:
  // https://github.com/angular/angular/blob/master/packages/forms/src/directives/select_control_value_accessor.ts#L19
  /**
   * Selects the options at the specified indexes inside of a native `select` element.
   *
   * 选择 `select` 元素中指定索引处的选项。
   *
   */
  selectOptions(...optionIndexes: number[]): Promise<void>;

  /**
   * Dispatches an event with a particular name.
   *
   * 派发具有特定名称的事件。
   *
   * @param name Name of the event to be dispatched.
   *
   * 要派发的事件名称。
   *
   */
  dispatchEvent(name: string, data?: Record<string, EventData>): Promise<void>;
}

export interface TextOptions {
  /**
   * Optional selector for elements to exclude.
   *
   * （可选）要排除的元素的选择器。
   *
   */
  exclude?: string;
}
