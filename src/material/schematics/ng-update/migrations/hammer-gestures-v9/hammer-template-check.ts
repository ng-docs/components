/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {parse5} from '@angular/cdk/schematics';

/**
 * List of known events which are supported by the "HammerGesturesPlugin".
 *
 * “HammerGesturesPlugin” 支持的已知事件列表。
 *
 */
const STANDARD_HAMMERJS_EVENTS = [
  // Events supported by the "HammerGesturesPlugin". See:
  // angular/angular/blob/0119f46d/packages/platform-browser/src/dom/events/hammer_gestures.ts#L19
  'pan',
  'panstart',
  'panmove',
  'panend',
  'pancancel',
  'panleft',
  'panright',
  'panup',
  'pandown',
  'pinch',
  'pinchstart',
  'pinchmove',
  'pinchend',
  'pinchcancel',
  'pinchin',
  'pinchout',
  'press',
  'pressup',
  'rotate',
  'rotatestart',
  'rotatemove',
  'rotateend',
  'rotatecancel',
  'swipe',
  'swipeleft',
  'swiperight',
  'swipeup',
  'swipedown',
  'tap',
];

/**
 * List of events which are provided by the deprecated Angular Material "GestureConfig".
 *
 * 已弃用的 Angular Material GestureConfig 提供的事件列表。
 *
 */
const CUSTOM_MATERIAL_HAMMERJS_EVENS = [
  'longpress',
  'slide',
  'slidestart',
  'slideend',
  'slideright',
  'slideleft',
];

/**
 * Parses the specified HTML and searches for elements with Angular outputs listening to
 * one of the known HammerJS events. This check naively assumes that the bindings never
 * match on a component output, but only on the Hammer plugin.
 *
 * 解析指定的 HTML 并通过侦听已知 HammerJS 事件之一的 Angular 输出属性来搜索元素。这项检查假定绑定永远不会匹配组件的输出属性，而只会匹配 Hammer 插件。
 *
 */
export function isHammerJsUsedInTemplate(html: string): {
  standardEvents: boolean;
  customEvents: boolean;
} {
  const document = parse5.parseFragment(html, {sourceCodeLocationInfo: true});
  let customEvents = false;
  let standardEvents = false;
  const visitNodes = (nodes: parse5.ChildNode[]) => {
    nodes.forEach(node => {
      if (!isElement(node)) {
        return;
      }

      for (let attr of node.attrs) {
        if (!customEvents && CUSTOM_MATERIAL_HAMMERJS_EVENS.some(e => `(${e})` === attr.name)) {
          customEvents = true;
        }
        if (!standardEvents && STANDARD_HAMMERJS_EVENTS.some(e => `(${e})` === attr.name)) {
          standardEvents = true;
        }
      }

      // Do not continue traversing the AST if both type of HammerJS
      // usages have been detected already.
      if (!customEvents || !standardEvents) {
        visitNodes(node.childNodes);
      }
    });
  };
  visitNodes(document.childNodes);
  return {customEvents, standardEvents};
}

function isElement(node: any): node is parse5.Element {
  return !!node.attrs;
}
