/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TargetVersion} from '../../update-tool/target-version';
import {VersionChanges} from '../../update-tool/version-changes';

export interface InputNameUpgradeData {
  /**
   * The @Input() name to replace.
   *
   * 要替换的 @Input() 名称。
   *
   */
  replace: string;
  /**
   * The new name for the @Input().
   *
   * @Input() 的新名称。
   *
   */
  replaceWith: string;
  /**
   * Controls which elements and attributes in which this replacement is made.
   *
   * 控制要替换的元素和属性。
   *
   */
  limitedTo: {
    /**
     * Limit to elements with any of these element tags.
     *
     * 限制为任何具有这些元素标签的元素。
     *
     */
    elements?: string[];
    /**
     * Limit to elements with any of these attributes.
     *
     * 限制为任何带有这些属性的元素。
     *
     */
    attributes?: string[];
  };
}

export const inputNames: VersionChanges<InputNameUpgradeData> = {
  [TargetVersion.V6]: [
    {
      pr: 'https://github.com/angular/components/pull/10161',
      changes: [
        {
          replace: 'origin',
          replaceWith: 'cdkConnectedOverlayOrigin',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'positions',
          replaceWith: 'cdkConnectedOverlayPositions',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'offsetX',
          replaceWith: 'cdkConnectedOverlayOffsetX',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'offsetY',
          replaceWith: 'cdkConnectedOverlayOffsetY',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'width',
          replaceWith: 'cdkConnectedOverlayWidth',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'height',
          replaceWith: 'cdkConnectedOverlayHeight',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'minWidth',
          replaceWith: 'cdkConnectedOverlayMinWidth',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'minHeight',
          replaceWith: 'cdkConnectedOverlayMinHeight',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'backdropClass',
          replaceWith: 'cdkConnectedOverlayBackdropClass',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'scrollStrategy',
          replaceWith: 'cdkConnectedOverlayScrollStrategy',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'open',
          replaceWith: 'cdkConnectedOverlayOpen',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
        {
          replace: 'hasBackdrop',
          replaceWith: 'cdkConnectedOverlayHasBackdrop',
          limitedTo: {
            attributes: ['cdk-connected-overlay', 'connected-overlay', 'cdkConnectedOverlay'],
          },
        },
      ],
    },
  ],
};
