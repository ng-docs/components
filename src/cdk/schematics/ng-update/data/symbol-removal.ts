/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {VersionChanges} from '../../update-tool/version-changes';

export interface SymbolRemovalUpgradeData {
  /**
   * Module that the symbol was removed from.
   *
   * 要从中删除符号的模块。
   *
   */
  module: string;

  /**
   * Name of the symbol being removed.
   *
   * 被删除的符号的名称。
   *
   */
  name: string;

  /**
   * Message to log explaining why the symbol was removed.
   *
   * 要记录的消息，说明符号被删除的原因。
   *
   */
  message: string;
}

export const symbolRemoval: VersionChanges<SymbolRemovalUpgradeData> = {};
