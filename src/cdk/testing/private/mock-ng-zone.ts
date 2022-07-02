/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {EventEmitter, Injectable, NgZone} from '@angular/core';

/**
 * Mock synchronous NgZone implementation that can be used
 * to flush out `onStable` subscriptions in tests.
 *
 * via: <https://github.com/angular/angular/blob/main/packages/core/testing/src/ng_zone_mock.ts>
 *
 * @docs-private
 */
@Injectable()
export class MockNgZone extends NgZone {
  override readonly onStable = new EventEmitter(false);

  constructor() {
    super({enableLongStackTrace: false});
  }

  override run(fn: Function): any {
    return fn();
  }

  override runOutsideAngular(fn: Function): any {
    return fn();
  }

  simulateZoneExit(): void {
    this.onStable.emit(null);
  }
}
