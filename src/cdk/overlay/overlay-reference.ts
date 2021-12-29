/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Portal} from '@angular/cdk/portal';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {Observable, Subject} from 'rxjs';

/**
 * Basic interface for an overlay. Used to avoid circular type references between
 * `OverlayRef`, `PositionStrategy` and `ScrollStrategy`, and `OverlayConfig`.
 *
 * 浮层的基本接口。用于避免 `OverlayRef`、`PositionStrategy` 以及 `ScrollStrategy` 和 `OverlayConfig` 之间的循环类型引用。
 *
 * @docs-private
 */
export interface OverlayReference {
  attach: (portal: Portal<any>) => any;
  detach: () => any;
  dispose: () => void;
  overlayElement: HTMLElement;
  hostElement: HTMLElement;
  backdropElement: HTMLElement | null;
  getConfig: () => any;
  hasAttached: () => boolean;
  updateSize: (config: any) => void;
  updatePosition: () => void;
  getDirection: () => Direction;
  setDirection: (dir: Direction | Directionality) => void;
  backdropClick: () => Observable<MouseEvent>;
  attachments: () => Observable<void>;
  detachments: () => Observable<void>;
  keydownEvents: () => Observable<KeyboardEvent>;
  outsidePointerEvents: () => Observable<MouseEvent>;
  addPanelClass: (classes: string | string[]) => void;
  removePanelClass: (classes: string | string[]) => void;
  readonly _outsidePointerEvents: Subject<MouseEvent>;
  readonly _keydownEvents: Subject<KeyboardEvent>;
}
