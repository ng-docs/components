/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {HighContrastModeDetector} from '@angular/cdk/a11y';
import {BidiModule} from '@angular/cdk/bidi';
import {inject, Inject, InjectionToken, NgModule, Optional} from '@angular/core';
import {VERSION as CDK_VERSION} from '@angular/cdk';
import {DOCUMENT} from '@angular/common';
import {Platform, _isTestEnvironment} from '@angular/cdk/platform';
import {VERSION} from '../version';

/** @docs-private */
export function MATERIAL_SANITY_CHECKS_FACTORY(): SanityChecks {
  return true;
}

/**
 * Injection token that configures whether the Material sanity checks are enabled.
 *
 * 注入令牌，用于配置是否启用 Material 的完整性检查。
 *
 */
export const MATERIAL_SANITY_CHECKS = new InjectionToken<SanityChecks>('mat-sanity-checks', {
  providedIn: 'root',
  factory: MATERIAL_SANITY_CHECKS_FACTORY,
});

/**
 * Possible sanity checks that can be enabled. If set to
 * true/false, all checks will be enabled/disabled.
 *
 * 可以启用可能的完整性检查。如果设置为 true / false，则将启用/禁用所有检查。
 *
 */
export type SanityChecks = boolean | GranularSanityChecks;

/**
 * Object that can be used to configure the sanity checks granularly.
 *
 * 可用于对完整性检查进行精细配置的对象。
 *
 */
export interface GranularSanityChecks {
  doctype: boolean;
  theme: boolean;
  version: boolean;
}

/**
 * Module that captures anything that should be loaded and/or run for *all* Angular Material
 * components. This includes Bidi, etc.
 *
 * 用来捕捉那些应该为*所有* Angular Material 组件加载和/或运行的内容的模块。包括 bidi（双向文字）等
 *
 * This module should be imported to each top-level component module (e.g., MatTabsModule).
 *
 * 该模块应导入到每个顶级组件模块（例如 MatTabsModule）中。
 *
 */
@NgModule({
  imports: [BidiModule],
  exports: [BidiModule],
})
export class MatCommonModule {
  /**
   * Whether we've done the global sanity checks (e.g. a theme is loaded, there is a doctype).
   *
   * 是否进行了全局完整性检查（例如，已加载了主题，具有 doctype 等）。
   *
   */
  private _hasDoneGlobalChecks = false;

  constructor(
    highContrastModeDetector: HighContrastModeDetector,
    @Optional() @Inject(MATERIAL_SANITY_CHECKS) private _sanityChecks: SanityChecks,
    @Inject(DOCUMENT) private _document: Document,
  ) {
    // While A11yModule also does this, we repeat it here to avoid importing A11yModule
    // in MatCommonModule.
    highContrastModeDetector._applyBodyHighContrastModeCssClasses();

    if (!this._hasDoneGlobalChecks) {
      this._hasDoneGlobalChecks = true;

      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        // Inject in here so the reference to `Platform` can be removed in production mode.
        const platform = inject(Platform, {optional: true});

        if (this._checkIsEnabled('doctype')) {
          _checkDoctypeIsDefined(this._document);
        }

        if (this._checkIsEnabled('theme')) {
          _checkThemeIsPresent(this._document, !!platform?.isBrowser);
        }

        if (this._checkIsEnabled('version')) {
          _checkCdkVersionMatch();
        }
      }
    }
  }

  /**
   * Gets whether a specific sanity check is enabled.
   *
   * 获取是否启用了特定的健全性检查。
   *
   */
  private _checkIsEnabled(name: keyof GranularSanityChecks): boolean {
    if (_isTestEnvironment()) {
      return false;
    }

    if (typeof this._sanityChecks === 'boolean') {
      return this._sanityChecks;
    }

    return !!this._sanityChecks[name];
  }
}

/**
 * Checks that the page has a doctype.
 *
 * 检查本页面是否有 doctype。
 *
 */
function _checkDoctypeIsDefined(doc: Document): void {
  if (!doc.doctype) {
    console.warn(
      'Current document does not have a doctype. This may cause ' +
        'some Angular Material components not to behave as expected.',
    );
  }
}

/**
 * Checks that a theme has been included.
 *
 * 检查是否已包含主题。
 *
 */
function _checkThemeIsPresent(doc: Document, isBrowser: boolean): void {
  // We need to assert that the `body` is defined, because these checks run very early
  // and the `body` won't be defined if the consumer put their scripts in the `head`.
  if (!doc.body || !isBrowser) {
    return;
  }

  const testElement = doc.createElement('div');
  testElement.classList.add('mat-theme-loaded-marker');
  doc.body.appendChild(testElement);

  const computedStyle = getComputedStyle(testElement);

  // In some situations the computed style of the test element can be null. For example in
  // Firefox, the computed style is null if an application is running inside of a hidden iframe.
  // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
  if (computedStyle && computedStyle.display !== 'none') {
    console.warn(
      'Could not find Angular Material core theme. Most Material ' +
        'components may not work as expected. For more info refer ' +
        'to the theming guide: https://material.angular.io/guide/theming',
    );
  }

  testElement.remove();
}

/**
 * Checks whether the Material version matches the CDK version.
 *
 * 检查 Material 版本是否与 CDK 版本相匹配。
 *
 */
function _checkCdkVersionMatch(): void {
  if (VERSION.full !== CDK_VERSION.full) {
    console.warn(
      'The Angular Material version (' +
        VERSION.full +
        ') does not match ' +
        'the Angular CDK version (' +
        CDK_VERSION.full +
        ').\n' +
        'Please ensure the versions of these two packages exactly match.',
    );
  }
}
