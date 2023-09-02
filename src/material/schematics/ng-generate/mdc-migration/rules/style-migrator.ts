/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as postcss from 'postcss';

const END_OF_SELECTOR_REGEX = '(?!-)';
const MIXIN_ARGUMENTS_REGEX = '\\(((\\s|.)*)\\)';

/**
 * The changes to a class names.
 *
 * 对类名称的更改。
 *
 */
export interface ClassNameChange {
  /**
   * The legacy class name.
   *
   * 旧的类名。
   *
   */
  old: string;

  /**
   * The new class name.
   *
   * 新的类名。
   *
   */
  new: string;
}

/**
 * The changes to an scss mixin.
 *
 * 对 scss mixin 的更改。
 *
 */
export interface MixinChange {
  /**
   * The name of the legacy scss mixin.
   *
   * 旧的 scss mixin 名称。
   *
   */
  old: string;

  /**
   * The name\(s\) of the new scss mixin\(s\).
   *
   * 新的 scss mixin 名称。
   *
   */
  new: string[] | null;

  /**
   * Optional check to see if new scss mixin\(s\) already exist in the styles
   *
   * 可选检查以查看样式中是否已存在新的 scss mixin
   *
   */
  checkForDuplicates?: boolean;
}

/**
 * StyleMigrator implements the basic case for migrating old component styles to new ones.
 *
 * StyleMigrator 实现了将旧组件样式迁移到新组件样式的基本案例。
 *
 */
export abstract class StyleMigrator {
  /**
   * The name of the component that this migration handles.
   *
   * 此迁移所处理的组件的名称。
   *
   */
  abstract component: string;

  /**
   * The old and new class names of this component.
   *
   * 此组件的旧类名和新类名。
   *
   */
  abstract classChanges: ClassNameChange[];

  /**
   * The old mixins and their replacements.
   *
   * 旧的 mixin 及其替代品。
   *
   */
  abstract mixinChanges: MixinChange[];

  /**
   * The prefix of classes that are specific to the old components
   *
   * 特定于旧组件的类的前缀
   *
   */
  abstract deprecatedPrefixes: string[];

  /**
   * Data structure used to track which migrators have been applied to an AST node
   * already so they don't have to be re-run when PostCSS detects changes in the AST.
   */
  private _processedNodes = new WeakMap<postcss.Node, Set<string>>();

  /**
   * Wraps a value in a placeholder string to prevent it
   * from being matched multiple times in a migration.
   *
   * 将值包装在占位符字符串中，以防止它在迁移中被多次匹配。
   *
   */
  static wrapValue(value: string): string {
    const escapeString = '__NG_MDC_MIGRATION_PLACEHOLDER__';
    return `${escapeString}${value}${escapeString}`;
  }

  /**
   * Unwraps all the values that we wrapped by `wrapValue`.
   *
   * 解开我们用 `wrapValue` 包装的所有值。
   *
   */
  static unwrapAllValues(content: string): string {
    return content.replace(/__NG_MDC_MIGRATION_PLACEHOLDER__/g, '');
  }

  /**
   * Returns whether the given at-include at-rule is a use of a legacy mixin for this component.
   *
   * 返回给定的 at-include at-rule 是否为此组件使用了旧版 mixin。
   *
   * @param namespace the namespace being used for angular/material.
   *
   * 用于 angular/material 的命名空间。
   *
   * @param atRule a postcss at-include at-rule.
   *
   * postcss 的 at-include at-rule。
   *
   * @returns
   *
   * `true` if the given at-rule is a use of a legacy mixin for this component.
   *
   * 如果给定的 at-rule 为此组件使用了旧版 mixin，则为 `true`。
   *
   */
  isLegacyMixin(namespace: string, atRule: postcss.AtRule): boolean {
    return this.mixinChanges.some(change => atRule.params.includes(`${namespace}.${change.old}`));
  }

  /**
   * Gets the mixin change object that has the new mixin\(s\) replacements if
   * found for the at rule node.
   *
   * 如果为 at-rule 节点找到了新的 mixin 替代品，则获取此 mixin 更改对象。
   *
   * @param namespace the namespace being used for angular/material.
   *
   * 用于 angular/material 的命名空间。
   * @param atRule an at-include at-rule of a legacy mixin for this component.
   *
   * 此组件的旧版 mixin 的 at-include 规则。
   * @returns
   *
   * the mixin change object or null if not found
   *
   * 此 mixin 的更改对象，如果未找到则返回 null
   */
  getMixinChange(namespace: string, atRule: postcss.AtRule): MixinChange | null {
    const processedKey = `mixinChange-${namespace}`;

    if (this._nodeIsProcessed(atRule, processedKey)) {
      return null;
    }

    const change = this.mixinChanges.find(c => {
      return atRule.params.includes(`${namespace}.${c.old}`);
    });

    if (!change) {
      return null;
    }

    // Check if mixin replacements already exist in the stylesheet
    const replacements = [...(change.new ?? [])];
    if (change.checkForDuplicates) {
      const mixinArgumentMatches = atRule.params?.match(MIXIN_ARGUMENTS_REGEX);
      atRule.root().walkAtRules(rule => {
        for (const index in replacements) {
          // Include arguments if applicable since there can be multiple themes.
          // The first element of the match object includes parentheses since
          // it's the whole match from the regex.
          const mixinName =
            replacements[index] + (mixinArgumentMatches ? mixinArgumentMatches[0] : '');
          // Remove replacement if mixin found in styles and make sure to not
          // count component-legacy-theme as a duplicate of component-theme
          if (rule.params.includes('.' + mixinName)) {
            replacements.splice(Number(index), 1);
          }
        }
      });
    }

    this._trackProcessedNode(atRule, processedKey);
    return {old: change.old, new: replacements.length ? replacements : null};
  }

  /**
   * Returns whether the given postcss rule uses a legacy selector of this component.
   *
   * 返回给定的 postcss 规则是否使用了此组件的旧版选择器。
   *
   * @param rule a postcss rule.
   *
   * postcss 规则。
   *
   * @returns
   *
   * `true` if the given Rule uses a legacy selector of this component.
   *
   * 如果规定的规则为此组件使用了旧版选择器，则为 `true`。
   *
   */
  isLegacySelector(rule: postcss.Rule): boolean {
    // Since a legacy class can also have the deprecated prefix, we also
    // check that a match isn't actually a longer deprecated class.
    return this.classChanges.some(
      change => rule.selector?.match(change.old + END_OF_SELECTOR_REGEX) !== null,
    );
  }

  /**
   * Replaces a legacy selector of this component with the new one.
   *
   * 将此组件的旧版选择器替换为新版选择器。
   *
   * @param rule a postcss rule.
   *
   * postcss 规则。
   *
   */
  replaceLegacySelector(rule: postcss.Rule): void {
    if (!this._nodeIsProcessed(rule, 'replaceLegacySelector')) {
      for (let i = 0; i < this.classChanges.length; i++) {
        const change = this.classChanges[i];
        if (rule.selector?.match(change.old + END_OF_SELECTOR_REGEX)) {
          rule.selector = rule.selector.replace(change.old, change.new);
        }
      }
      this._trackProcessedNode(rule, 'replaceLegacySelector');
    }
  }

  /**
   * Returns whether the given postcss rule uses a potentially deprecated
   * selector of the old component.
   *
   * 返回给定的 postcss 规则是否使用了旧组件的可能已弃用的选择器。
   *
   * @param rule a postcss rule.
   *
   * postcss 规则。
   *
   * @returns
   *
   * `true` if the given Rule uses a selector with the deprecated prefix.
   *
   * 如果规定的规则使用了一个具有旧版前缀的选择器，则为 `true`。
   *
   */
  isDeprecatedSelector(rule: postcss.Rule): boolean {
    return this.deprecatedPrefixes.some(deprecatedPrefix =>
      rule.selector.includes(deprecatedPrefix),
    );
  }

  /** Tracks that a node has been processed by a specific action. */
  private _trackProcessedNode(node: postcss.Node, action: string) {
    const appliedActions = this._processedNodes.get(node) || new Set();
    appliedActions.add(action);
    this._processedNodes.set(node, appliedActions);
  }

  /** Checks whether a node has been processed by an action in this migrator. */
  private _nodeIsProcessed(node: postcss.Node, action: string) {
    return !!this._processedNodes.get(node)?.has(action);
  }
}
