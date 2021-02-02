/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Throws an exception when attempting to attach a null portal to a host.
 *
 * 当试图把空的传送点附加到宿主上时抛出异常。
 *
 * @docs-private
 */
export function throwNullPortalError() {
  throw Error('Must provide a portal to attach');
}

/**
 * Throws an exception when attempting to attach a portal to a host that is already attached.
 *
 * 当试图把传送点附加到已经附加过的宿主上时，会抛出异常。
 *
 * @docs-private
 */
export function throwPortalAlreadyAttachedError() {
  throw Error('Host already has a portal attached');
}

/**
 * Throws an exception when attempting to attach a portal to an already-disposed host.
 *
 * 当试图把传送点连接到已经拆除的宿主上时，会抛出异常。
 *
 * @docs-private
 */
export function throwPortalOutletAlreadyDisposedError() {
  throw Error('This PortalOutlet has already been disposed');
}

/**
 * Throws an exception when attempting to attach an unknown portal type.
 *
 * 当试图连接未知的传送点类型时抛出异常。
 *
 * @docs-private
 */
export function throwUnknownPortalTypeError() {
  throw Error('Attempting to attach an unknown Portal type. BasePortalOutlet accepts either ' +
              'a ComponentPortal or a TemplatePortal.');
}

/**
 * Throws an exception when attempting to attach a portal to a null host.
 *
 * 当试图把传送点添加到空宿主时抛出异常。
 *
 * @docs-private
 */
export function throwNullPortalOutletError() {
  throw Error('Attempting to attach a portal to a null PortalOutlet');
}

/**
 * Throws an exception when attempting to detach a portal that is not attached.
 *
 * 当试图拆除未附加过的传送点时抛出异常。
 *
 * @docs-private
 */
export function throwNoPortalAttachedError() {
  throw Error('Attempting to detach a portal that is not attached to a host');
}
