/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as ts from 'typescript';
import {WorkspacePath} from '../../update-tool/file-system';
import {ResolvedResource} from '../../update-tool/component-resource-collector';
import {Migration} from '../../update-tool/migration';
import {AttributeSelectorUpgradeData} from '../data/attribute-selectors';
import {findAllSubstringIndices} from '../typescript/literal';
import {getVersionUpgradeData, UpgradeData} from '../upgrade-data';

/**
 * Migration that walks through every string literal, template and stylesheet
 * in order to switch deprecated attribute selectors to the updated selector.
 *
 * 本迁移遍历每个字符串文字，模板和样式表，以便将已弃用的属性选择器切换到更新的选择器。
 *
 */
export class AttributeSelectorsMigration extends Migration<UpgradeData> {
  /**
   * Required upgrade changes for specified target version.
   *
   * 指定目标版本的必要升级变更。
   *
   */
  data = getVersionUpgradeData(this, 'attributeSelectors');

  // Only enable the migration rule if there is upgrade data.
  enabled: boolean = this.data.length !== 0;

  override visitNode(node: ts.Node) {
    if (ts.isStringLiteralLike(node)) {
      this._visitStringLiteralLike(node);
    }
  }

  override visitTemplate(template: ResolvedResource) {
    this.data.forEach(selector => {
      findAllSubstringIndices(template.content, selector.replace)
        .map(offset => template.start + offset)
        .forEach(start => this._replaceSelector(template.filePath, start, selector));
    });
  }

  override visitStylesheet(stylesheet: ResolvedResource): void {
    this.data.forEach(selector => {
      const currentSelector = `[${selector.replace}]`;
      const updatedSelector = `[${selector.replaceWith}]`;

      findAllSubstringIndices(stylesheet.content, currentSelector)
        .map(offset => stylesheet.start + offset)
        .forEach(start =>
          this._replaceSelector(stylesheet.filePath, start, {
            replace: currentSelector,
            replaceWith: updatedSelector,
          }),
        );
    });
  }

  private _visitStringLiteralLike(literal: ts.StringLiteralLike) {
    if (literal.parent && literal.parent.kind !== ts.SyntaxKind.CallExpression) {
      return;
    }

    const literalText = literal.getText();
    const filePath = this.fileSystem.resolve(literal.getSourceFile().fileName);

    this.data.forEach(selector => {
      findAllSubstringIndices(literalText, selector.replace)
        .map(offset => literal.getStart() + offset)
        .forEach(start => this._replaceSelector(filePath, start, selector));
    });
  }

  private _replaceSelector(
    filePath: WorkspacePath,
    start: number,
    data: AttributeSelectorUpgradeData,
  ) {
    this.fileSystem
      .edit(filePath)
      .remove(start, data.replace.length)
      .insertRight(start, data.replaceWith);
  }
}
