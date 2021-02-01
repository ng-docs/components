/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {TargetVersion} from '../../update-tool/target-version';
import {VersionChanges} from '../../update-tool/version-changes';

export interface PropertyNameUpgradeData {
  /**
   * The property name to replace.
   *
   * 要替换的属性名称。
   *
   */
  replace: string;
  /**
   * The new name for the property.
   *
   * 属性的新名称。
   *
   */
  replaceWith: string;
  /**
   * Controls which classes in which this replacement is made.
   *
   * 控制进行替换的类。
   *
   */
  limitedTo: {
    /**
     * Replace the property only when its type is one of the given Classes.
     *
     * 仅当属性的类型为给定类之一时才替换该属性。
     *
     */
    classes: string[];
  };
}

export const propertyNames: VersionChanges<PropertyNameUpgradeData> = {
  [TargetVersion.V9]: [
    {
      pr: 'https://github.com/angular/components/pull/17084',
      changes: [{
        replace: 'boundaryElementSelector',
        replaceWith: 'boundaryElement',
        limitedTo: {classes: ['CdkDrag']}
      }]
    },
    {
      pr: 'https://github.com/angular/components/pull/17302',
      changes: [{
        replace: 'onChange',
        replaceWith: 'changed',
        limitedTo: {classes: ['SelectionModel']}
      }]
    }
  ],
  [TargetVersion.V8]: [],
  [TargetVersion.V7]: [
    {
      pr: 'https://github.com/angular/components/pull/8286',
      changes:
          [{replace: 'onChange', replaceWith: 'changed', limitedTo: {classes: ['SelectionModel']}}]
    },

    {
      pr: 'https://github.com/angular/components/pull/12927',
      changes: [{
        replace: 'flexibleDiemsions',
        replaceWith: 'flexibleDimensions',
        limitedTo: {classes: ['CdkConnectedOverlay']}
      }]
    }
  ],

  [TargetVersion.V6]: [
    {
      pr: 'https://github.com/angular/components/pull/10161',
      changes: [
        {
          replace: '_deprecatedOrigin',
          replaceWith: 'origin',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedPositions',
          replaceWith: 'positions',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedOffsetX',
          replaceWith: 'offsetX',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedOffsetY',
          replaceWith: 'offsetY',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedWidth',
          replaceWith: 'width',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedHeight',
          replaceWith: 'height',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedMinWidth',
          replaceWith: 'minWidth',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedMinHeight',
          replaceWith: 'minHeight',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedBackdropClass',
          replaceWith: 'backdropClass',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedScrollStrategy',
          replaceWith: 'scrollStrategy',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedOpen',
          replaceWith: 'open',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        },
        {
          replace: '_deprecatedHasBackdrop',
          replaceWith: 'hasBackdrop',
          limitedTo: {classes: ['CdkConnectedOverlay', 'ConnectedOverlayDirective']}
        }
      ]
    },

    {
      pr: 'https://github.com/angular/components/pull/10257',
      changes: [
        {
          replace: '_deprecatedPortal',
          replaceWith: 'portal',
          limitedTo: {classes: ['CdkPortalOutlet']}
        },
        {
          replace: '_deprecatedPortalHost',
          replaceWith: 'portal',
          limitedTo: {classes: ['CdkPortalOutlet']}
        }
      ]
    },
  ]
};
