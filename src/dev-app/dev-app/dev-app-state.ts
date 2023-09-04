/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Direction} from '@angular/cdk/bidi';

const KEY = 'MAT_DEV_APP_STATE';

/**
 * State of the appearance of the dev app.
 *
 * 开发应用程序的外观状态。
 *
 */
export interface DevAppState {
  density: string | number;
  animations: boolean;
  darkTheme: boolean;
  rippleDisabled: boolean;
  strongFocusEnabled: boolean;
  tokensEnabled: boolean;
  direction: Direction;
}

/**
 * Gets the current appearance state of the dev app.
 *
 * 获取开发应用程序的当前外观状态。
 *
 */
export function getAppState(): DevAppState {
  let value: DevAppState | null = null;

  // Needs a try/catch since some browsers throw an error when accessing in incognito.
  try {
    const storageValue = localStorage.getItem(KEY);

    if (storageValue) {
      value = JSON.parse(storageValue);
    }
  } catch {}

  if (!value) {
    value = {
      density: 0,
      animations: true,
      darkTheme: false,
      rippleDisabled: false,
      strongFocusEnabled: false,
      tokensEnabled: false,
      direction: 'ltr',
    };

    saveToStorage(value);
  }

  return value;
}

/** Saves the state of the dev app apperance in local storage. */
export function setAppState(newState: DevAppState): void {
  const currentState = getAppState();
  const keys = Object.keys(currentState) as (keyof DevAppState)[];

  // Only write to storage if something actually changed.
  for (const key of keys) {
    if (currentState[key] !== newState[key]) {
      saveToStorage(newState);
      break;
    }
  }
}

function saveToStorage(value: DevAppState): void {
  // Needs a try/catch since some browsers throw an error when accessing in incognito.
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {}
}
