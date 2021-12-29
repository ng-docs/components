/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {WorkspacePath} from '../../update-tool/file-system';
import {ResolvedResource} from '../../update-tool/component-resource-collector';
import {Migration} from '../../update-tool/migration';

import {OutputNameUpgradeData} from '../data';
import {findOutputsOnElementWithAttr, findOutputsOnElementWithTag} from '../html-parsing/angular';
import {getVersionUpgradeData, UpgradeData} from '../upgrade-data';

/**
 * Migration that walks through every inline or external HTML template and switches
 * changed output binding names to the proper new output name.
 *
 * 本迁移会遍历每个内联或外部 HTML 模板并将更改的输出绑定名称切换为正确的新输出名称。
 *
 */
export class OutputNamesMigration extends Migration<UpgradeData> {
  /**
   * Change data that upgrades to the specified target version.
   *
   * 升级到指定目标版本的更改数据。
   *
   */
  data: OutputNameUpgradeData[] = getVersionUpgradeData(this, 'outputNames');

  // Only enable the migration rule if there is upgrade data.
  enabled = this.data.length !== 0;

  override visitTemplate(template: ResolvedResource): void {
    this.data.forEach(name => {
      const limitedTo = name.limitedTo;
      const relativeOffsets: number[] = [];

      if (limitedTo.attributes) {
        relativeOffsets.push(
          ...findOutputsOnElementWithAttr(template.content, name.replace, limitedTo.attributes),
        );
      }

      if (limitedTo.elements) {
        relativeOffsets.push(
          ...findOutputsOnElementWithTag(template.content, name.replace, limitedTo.elements),
        );
      }

      relativeOffsets
        .map(offset => template.start + offset)
        .forEach(start =>
          this._replaceOutputName(template.filePath, start, name.replace.length, name.replaceWith),
        );
    });
  }

  private _replaceOutputName(
    filePath: WorkspacePath,
    start: number,
    width: number,
    newName: string,
  ) {
    this.fileSystem.edit(filePath).remove(start, width).insertRight(start, newName);
  }
}
