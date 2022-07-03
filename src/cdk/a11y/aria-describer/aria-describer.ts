/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable, OnDestroy, APP_ID, inject} from '@angular/core';
import {Platform} from '@angular/cdk/platform';
import {addAriaReferencedId, getAriaReferenceIds, removeAriaReferencedId} from './aria-reference';

/**
 * Interface used to register message elements and keep a count of how many registrations have
 * the same message and the reference to the message element used for the `aria-describedby`.
 *
 * 本接口用于注册消息元素并保留具有相同消息的注册数量的计数，以及用于 `aria-describedby` 对消息元素的引用。
 *
 */
export interface RegisteredMessage {
  /**
   * The element containing the message.
   *
   * 包含消息的元素。
   *
   */
  messageElement: Element;

  /**
   * The number of elements that reference this message element via `aria-describedby`.
   *
   * 通过 `aria-describedby` 引用此消息元素的元素数。
   *
   */
  referenceCount: number;
}

/**
 * ID used for the body container where all messages are appended.
 *
 * 用于追加所有消息的正文容器的 ID。
 *
 * @deprecated
 *
 * No longer being used. To be removed.
 *
 * 不再使用。即将被删除。
 *
 * @breaking-change 14.0.0
 */
export const MESSAGES_CONTAINER_ID = 'cdk-describedby-message-container';

/**
 * ID prefix used for each created message element.
 *
 * 用于所创建的每个消息元素的 ID 前缀。
 *
 * @deprecated
 *
 * To be turned into a private variable.
 *
 * 变成私有变量。
 *
 * @breaking-change 14.0.0
 */
export const CDK_DESCRIBEDBY_ID_PREFIX = 'cdk-describedby-message';

/**
 * Attribute given to each host element that is described by a message element.
 *
 * 用来指定消息元素描述的每个宿主元素的属性。
 *
 * @deprecated
 *
 * To be turned into a private variable.
 *
 * 变成私有变量。
 *
 * @breaking-change 14.0.0
 */
export const CDK_DESCRIBEDBY_HOST_ATTRIBUTE = 'cdk-describedby-host';

/**
 * Global incremental identifier for each registered message element.
 *
 * 每个已注册消息元素的全局增量标识符。
 *
 */
let nextId = 0;

/**
 * Utility that creates visually hidden elements with a message content. Useful for elements that
 * want to use aria-describedby to further describe themselves without adding additional visual
 * content.
 *
 * 该实用工具创建带有消息内容的视觉不可见元素。对于希望使用 aria-describedby 来进一步描述自己而不想添加其他视觉内容的元素很有用。
 *
 */
@Injectable({providedIn: 'root'})
export class AriaDescriber implements OnDestroy {
  private _document: Document;

  /**
   * Map of all registered message elements that have been placed into the document.
   *
   * 已放入文档中的所有已注册消息元素的映射表。
   *
   */
  private _messageRegistry = new Map<string | Element, RegisteredMessage>();

  /**
   * Container for all registered messages.
   *
   * 所有注册消息的容器。
   *
   */
  private _messagesContainer: HTMLElement | null = null;

  /**
   * Unique ID for the service.
   *
   * 服务的唯一 ID。
   *
   */
  private readonly _id = `${nextId++}`;

  constructor(
    @Inject(DOCUMENT) _document: any,
    /**
     * @deprecated To be turned into a required parameter.
     * @breaking-change 14.0.0
     */
    private _platform?: Platform,
  ) {
    this._document = _document;
    this._id = inject(APP_ID) + '-' + nextId++;
  }

  /**
   * Adds to the host element an aria-describedby reference to a hidden element that contains
   * the message. If the same message has already been registered, then it will reuse the created
   * message element.
   *
   * 为宿主元素添加一个由 aria-describedby 引用的不可见的消息元素。如果已经注册了相同的消息，则它将复用已创建的消息元素。
   *
   */
  describe(hostElement: Element, message: string, role?: string): void;

  /**
   * Adds to the host element an aria-describedby reference to an already-existing message element.
   *
   * 为宿主元素添加一个由 aria-describedby 引用的现有消息元素。
   *
   */
  describe(hostElement: Element, message: HTMLElement): void;

  describe(hostElement: Element, message: string | HTMLElement, role?: string): void {
    if (!this._canBeDescribed(hostElement, message)) {
      return;
    }

    const key = getKey(message, role);

    if (typeof message !== 'string') {
      // We need to ensure that the element has an ID.
      setMessageId(message, this._id);
      this._messageRegistry.set(key, {messageElement: message, referenceCount: 0});
    } else if (!this._messageRegistry.has(key)) {
      this._createMessageElement(message, role);
    }

    if (!this._isElementDescribedByMessage(hostElement, key)) {
      this._addMessageReference(hostElement, key);
    }
  }

  /**
   * Removes the host element's aria-describedby reference to the message.
   *
   * 删除宿主元素由 aria-describedby 引用的消息。
   *
   */
  removeDescription(hostElement: Element, message: string, role?: string): void;

  /**
   * Removes the host element's aria-describedby reference to the message element.
   *
   * 删除宿主元素由 aria-describedby 引用的消息元素。
   *
   */
  removeDescription(hostElement: Element, message: HTMLElement): void;

  removeDescription(hostElement: Element, message: string | HTMLElement, role?: string): void {
    if (!message || !this._isElementNode(hostElement)) {
      return;
    }

    const key = getKey(message, role);

    if (this._isElementDescribedByMessage(hostElement, key)) {
      this._removeMessageReference(hostElement, key);
    }

    // If the message is a string, it means that it's one that we created for the
    // consumer so we can remove it safely, otherwise we should leave it in place.
    if (typeof message === 'string') {
      const registeredMessage = this._messageRegistry.get(key);
      if (registeredMessage && registeredMessage.referenceCount === 0) {
        this._deleteMessageElement(key);
      }
    }

    if (this._messagesContainer?.childNodes.length === 0) {
      this._messagesContainer.remove();
      this._messagesContainer = null;
    }
  }

  /**
   * Unregisters all created message elements and removes the message container.
   *
   * 注销所有已创建的消息元素，并删除消息容器。
   *
   */
  ngOnDestroy() {
    const describedElements = this._document.querySelectorAll(
      `[${CDK_DESCRIBEDBY_HOST_ATTRIBUTE}="${this._id}"]`,
    );

    for (let i = 0; i < describedElements.length; i++) {
      this._removeCdkDescribedByReferenceIds(describedElements[i]);
      describedElements[i].removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
    }

    this._messagesContainer?.remove();
    this._messagesContainer = null;
    this._messageRegistry.clear();
  }

  /**
   * Creates a new element in the visually hidden message container element with the message
   * as its content and adds it to the message registry.
   *
   * 在以消息为内容的可视隐藏消息容器元素中创建一个新元素，并将其添加到消息注册表中。
   *
   */
  private _createMessageElement(message: string, role?: string) {
    const messageElement = this._document.createElement('div');
    setMessageId(messageElement, this._id);
    messageElement.textContent = message;

    if (role) {
      messageElement.setAttribute('role', role);
    }

    this._createMessagesContainer();
    this._messagesContainer!.appendChild(messageElement);
    this._messageRegistry.set(getKey(message, role), {messageElement, referenceCount: 0});
  }

  /**
   * Deletes the message element from the global messages container.
   *
   * 从全局消息容器中删除消息元素。
   *
   */
  private _deleteMessageElement(key: string | Element) {
    this._messageRegistry.get(key)?.messageElement?.remove();
    this._messageRegistry.delete(key);
  }

  /**
   * Creates the global container for all aria-describedby messages.
   *
   * 为所有由 aria-describedby 引用的消息创建全局容器。
   *
   */
  private _createMessagesContainer() {
    if (this._messagesContainer) {
      return;
    }

    const containerClassName = 'cdk-describedby-message-container';
    const serverContainers = this._document.querySelectorAll(
      `.${containerClassName}[platform="server"]`,
    );

    for (let i = 0; i < serverContainers.length; i++) {
      // When going from the server to the client, we may end up in a situation where there's
      // already a container on the page, but we don't have a reference to it. Clear the
      // old container so we don't get duplicates. Doing this, instead of emptying the previous
      // container, should be slightly faster.
      serverContainers[i].remove();
    }

    const messagesContainer = this._document.createElement('div');

    // We add `visibility: hidden` in order to prevent text in this container from
    // being searchable by the browser's Ctrl + F functionality.
    // Screen-readers will still read the description for elements with aria-describedby even
    // when the description element is not visible.
    messagesContainer.style.visibility = 'hidden';
    // Even though we use `visibility: hidden`, we still apply `cdk-visually-hidden` so that
    // the description element doesn't impact page layout.
    messagesContainer.classList.add(containerClassName);
    messagesContainer.classList.add('cdk-visually-hidden');

    // @breaking-change 14.0.0 Remove null check for `_platform`.
    if (this._platform && !this._platform.isBrowser) {
      messagesContainer.setAttribute('platform', 'server');
    }

    this._document.body.appendChild(messagesContainer);
    this._messagesContainer = messagesContainer;
  }

  /**
   * Removes all cdk-describedby messages that are hosted through the element.
   *
   * 删除以此元素为宿主的所有由 cdk-describedby 引用的消息。
   *
   */
  private _removeCdkDescribedByReferenceIds(element: Element) {
    // Remove all aria-describedby reference IDs that are prefixed by CDK_DESCRIBEDBY_ID_PREFIX
    const originalReferenceIds = getAriaReferenceIds(element, 'aria-describedby').filter(
      id => id.indexOf(CDK_DESCRIBEDBY_ID_PREFIX) != 0,
    );
    element.setAttribute('aria-describedby', originalReferenceIds.join(' '));
  }

  /**
   * Adds a message reference to the element using aria-describedby and increments the registered
   * message's reference count.
   *
   * 把一个消息添加到由 aria-describedby 引用的元素，并递增已注册消息的引用计数。
   *
   */
  private _addMessageReference(element: Element, key: string | Element) {
    const registeredMessage = this._messageRegistry.get(key)!;

    // Add the aria-describedby reference and set the
    // describedby_host attribute to mark the element.
    addAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
    element.setAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE, this._id);
    registeredMessage.referenceCount++;
  }

  /**
   * Removes a message reference from the element using aria-describedby
   * and decrements the registered message's reference count.
   *
   * 把一个消息从由 aria-describedby 引用的元素中删除，并递减已注册消息的引用计数。
   *
   */
  private _removeMessageReference(element: Element, key: string | Element) {
    const registeredMessage = this._messageRegistry.get(key)!;
    registeredMessage.referenceCount--;

    removeAriaReferencedId(element, 'aria-describedby', registeredMessage.messageElement.id);
    element.removeAttribute(CDK_DESCRIBEDBY_HOST_ATTRIBUTE);
  }

  /**
   * Returns true if the element has been described by the provided message ID.
   *
   * 如果元素已由提供的消息 ID 描述（described），则返回 true。
   *
   */
  private _isElementDescribedByMessage(element: Element, key: string | Element): boolean {
    const referenceIds = getAriaReferenceIds(element, 'aria-describedby');
    const registeredMessage = this._messageRegistry.get(key);
    const messageId = registeredMessage && registeredMessage.messageElement.id;

    return !!messageId && referenceIds.indexOf(messageId) != -1;
  }

  /**
   * Determines whether a message can be described on a particular element.
   *
   * 确定是否可以在特定元素上描述消息。
   *
   */
  private _canBeDescribed(element: Element, message: string | HTMLElement | void): boolean {
    if (!this._isElementNode(element)) {
      return false;
    }

    if (message && typeof message === 'object') {
      // We'd have to make some assumptions about the description element's text, if the consumer
      // passed in an element. Assume that if an element is passed in, the consumer has verified
      // that it can be used as a description.
      return true;
    }

    const trimmedMessage = message == null ? '' : `${message}`.trim();
    const ariaLabel = element.getAttribute('aria-label');

    // We shouldn't set descriptions if they're exactly the same as the `aria-label` of the
    // element, because screen readers will end up reading out the same text twice in a row.
    return trimmedMessage ? !ariaLabel || ariaLabel.trim() !== trimmedMessage : false;
  }

  /**
   * Checks whether a node is an Element node.
   *
   * 检查节点是否为元素节点。
   *
   */
  private _isElementNode(element: Node): element is Element {
    return element.nodeType === this._document.ELEMENT_NODE;
  }
}

/**
 * Gets a key that can be used to look messages up in the registry.
 *
 * 获取可用于在注册表中查找消息的键。
 *
 */
function getKey(message: string | Element, role?: string): string | Element {
  return typeof message === 'string' ? `${role || ''}/${message}` : message;
}

/**
 * Assigns a unique ID to an element, if it doesn't have one already.
 *
 * 如果元素还没有，则为其分配一个唯一的 ID。
 *
 */
function setMessageId(element: HTMLElement, serviceId: string) {
  if (!element.id) {
    element.id = `${CDK_DESCRIBEDBY_ID_PREFIX}-${serviceId}-${nextId++}`;
  }
}
