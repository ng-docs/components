/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HarnessEnvironment, HarnessLoader, TestElement} from '@angular/cdk/testing';
import {by, element as protractorElement, ElementArrayFinder, ElementFinder} from 'protractor';
import {ProtractorElement} from './protractor-element';

/**
 * Options to configure the environment.
 *
 * 用于配置环境的选项。
 *
 */
export interface ProtractorHarnessEnvironmentOptions {
  /**
   * The query function used to find DOM elements.
   *
   * 用于查找 DOM 元素的查询功能。
   *
   */
  queryFn: (selector: string, root: ElementFinder) => ElementArrayFinder;
}

/**
 * The default environment options.
 *
 * 默认环境选项。
 *
 */
const defaultEnvironmentOptions: ProtractorHarnessEnvironmentOptions = {
  queryFn: (selector: string, root: ElementFinder) => root.all(by.css(selector))
};

/**
 * A `HarnessEnvironment` implementation for Protractor.
 *
 * Protractor 的 `HarnessEnvironment` 实现。
 *
 */
export class ProtractorHarnessEnvironment extends HarnessEnvironment<ElementFinder> {
  /**
   * The options for this environment.
   *
   * 此环境的选项。
   *
   */
  private _options: ProtractorHarnessEnvironmentOptions;

  protected constructor(
      rawRootElement: ElementFinder, options?: ProtractorHarnessEnvironmentOptions) {
    super(rawRootElement);
    this._options = {...defaultEnvironmentOptions, ...options};
  }

  /**
   * Creates a `HarnessLoader` rooted at the document root.
   *
   * 创建一个以文档根为根的 `HarnessLoader`
   *
   */
  static loader(options?: ProtractorHarnessEnvironmentOptions): HarnessLoader {
    return new ProtractorHarnessEnvironment(protractorElement(by.css('body')), options);
  }

  /**
   * Gets the ElementFinder corresponding to the given TestElement.
   *
   * 获取与给定 TestElement 对应的 ElementFinder。
   *
   */
  static getNativeElement(el: TestElement): ElementFinder {
    if (el instanceof ProtractorElement) {
      return el.element;
    }
    throw Error('This TestElement was not created by the ProtractorHarnessEnvironment');
  }

  async forceStabilize(): Promise<void> {}

  async waitForTasksOutsideAngular(): Promise<void> {
    // TODO: figure out how we can do this for the protractor environment.
    // https://github.com/angular/components/issues/17412
  }

  protected getDocumentRoot(): ElementFinder {
    return protractorElement(by.css('body'));
  }

  protected createTestElement(element: ElementFinder): TestElement {
    return new ProtractorElement(element);
  }

  protected createEnvironment(element: ElementFinder): HarnessEnvironment<ElementFinder> {
    return new ProtractorHarnessEnvironment(element, this._options);
  }

  protected async getAllRawElements(selector: string): Promise<ElementFinder[]> {
    const elementArrayFinder = this._options.queryFn(selector, this.rawRootElement);
    const length = await elementArrayFinder.count();
    const elements: ElementFinder[] = [];
    for (let i = 0; i < length; i++) {
      elements.push(elementArrayFinder.get(i));
    }
    return elements;
  }
}
