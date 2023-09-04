/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Platform} from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  NgZone,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

import {
  MAT_ANCHOR_HOST,
  MAT_ANCHOR_INPUTS,
  MAT_BUTTON_HOST,
  MAT_BUTTON_INPUTS,
  MatAnchorBase,
  MatButtonBase,
} from './button-base';

/**
 * Material Design icon button component. This type of button displays a single interactive icon for
 * users to perform an action.
 * See https://material.io/develop/web/components/buttons/icon-buttons/
 *
 * Material Design 图标按钮组件。这种类型的按钮显示单个交互式图标，供用户执行操作。请参阅 https://material.io/develop/web/components/buttons/icon-buttons/
 *
 */
@Component({
  selector: `button[mat-icon-button]`,
  templateUrl: 'icon-button.html',
  styleUrls: ['icon-button.css', 'button-high-contrast.css'],
  inputs: MAT_BUTTON_INPUTS,
  host: MAT_BUTTON_HOST,
  exportAs: 'matButton',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatIconButton extends MatButtonBase {
  constructor(
    elementRef: ElementRef,
    platform: Platform,
    ngZone: NgZone,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, platform, ngZone, animationMode);

    this._rippleLoader.configureRipple(this._elementRef.nativeElement, {centered: true});
  }
}

/**
 * Material Design icon button component for anchor elements. This button displays a single
 * interaction icon that allows users to navigate across different routes or pages.
 * See https://material.io/develop/web/components/buttons/icon-buttons/
 *
 * `a` 元素的 Material Design 图标按钮组件。此按钮显示单个交互图标，允许用户跨不同的路由或页面导航。请参阅 https://material.io/develop/web/components/buttons/icon-buttons/
 *
 */
@Component({
  selector: `a[mat-icon-button]`,
  templateUrl: 'button.html',
  styleUrls: ['icon-button.css', 'button-high-contrast.css'],
  inputs: MAT_ANCHOR_INPUTS,
  host: MAT_ANCHOR_HOST,
  exportAs: 'matButton, matAnchor',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatIconAnchor extends MatAnchorBase {
  constructor(
    elementRef: ElementRef,
    platform: Platform,
    ngZone: NgZone,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
  ) {
    super(elementRef, platform, ngZone, animationMode);
  }
}
