/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  Directive,
  Input,
  Optional,
  Inject,
} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

/**
 * Content of a card, needed as it's used as a selector in the API.
 *
 * 卡片的内容，在 API 中用作选择器时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardContent` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'mat-card-content, [mat-card-content], [matCardContent]',
  host: {'class': 'mat-card-content'},
})
export class MatLegacyCardContent {}

/**
 * Title of a card, needed as it's used as a selector in the API.
 *
 * 卡片的标题，在 API 中用作选择器时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardTitle` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: `mat-card-title, [mat-card-title], [matCardTitle]`,
  host: {
    'class': 'mat-card-title',
  },
})
export class MatLegacyCardTitle {}

/**
 * Sub-title of a card, needed as it's used as a selector in the API.
 *
 * 卡片的副标题，在 API 中用作选择器时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardSubtitle` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: `mat-card-subtitle, [mat-card-subtitle], [matCardSubtitle]`,
  host: {
    'class': 'mat-card-subtitle',
  },
})
export class MatLegacyCardSubtitle {}

/**
 * Action section of a card, needed as it's used as a selector in the API.
 *
 * 卡片的操作部分，在 API 中用作选择器时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardActions` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'mat-card-actions',
  exportAs: 'matCardActions',
  host: {
    'class': 'mat-card-actions',
    '[class.mat-card-actions-align-end]': 'align === "end"',
  },
})
export class MatLegacyCardActions {
  /**
   * Position of the actions inside the card.
   *
   * 动作在卡片中的位置。
   *
   */
  @Input() align: 'start' | 'end' = 'start';
}

/**
 * Footer of a card, needed as it's used as a selector in the API.
 *
 * 卡片页脚，在 API 中用作选择器时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardFooter` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: 'mat-card-footer',
  host: {'class': 'mat-card-footer'},
})
export class MatLegacyCardFooter {}

/**
 * Image used in a card, needed to add the mat- CSS styling.
 *
 * 卡片中使用的图像，在添加 mat- CSS 样式时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardImage` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[mat-card-image], [matCardImage]',
  host: {'class': 'mat-card-image'},
})
export class MatLegacyCardImage {}

/**
 * Image used in a card, needed to add the mat- CSS styling.
 *
 * 卡片中使用的图像，在添加 mat- CSS 样式时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardSmImage` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[mat-card-sm-image], [matCardImageSmall]',
  host: {'class': 'mat-card-sm-image'},
})
export class MatLegacyCardSmImage {}

/**
 * Image used in a card, needed to add the mat- CSS styling.
 *
 * 卡片中使用的图像，在添加 mat- CSS 样式时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardMdImage` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[mat-card-md-image], [matCardImageMedium]',
  host: {'class': 'mat-card-md-image'},
})
export class MatLegacyCardMdImage {}

/**
 * Image used in a card, needed to add the mat- CSS styling.
 *
 * 卡片中使用的图像，在添加 mat- CSS 样式时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardLgImage` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[mat-card-lg-image], [matCardImageLarge]',
  host: {'class': 'mat-card-lg-image'},
})
export class MatLegacyCardLgImage {}

/**
 * Large image used in a card, needed to add the mat- CSS styling.
 *
 * 卡片中使用的大图像，在添加 mat- CSS 样式时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardXlImage` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[mat-card-xl-image], [matCardImageXLarge]',
  host: {'class': 'mat-card-xl-image'},
})
export class MatLegacyCardXlImage {}

/**
 * Avatar image used in a card, needed to add the mat- CSS styling.
 *
 * 卡片中使用的头像图片，在添加 mat- CSS 样式时需要。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardAvatar` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Directive({
  selector: '[mat-card-avatar], [matCardAvatar]',
  host: {'class': 'mat-card-avatar'},
})
export class MatLegacyCardAvatar {}

/**
 * A basic content container component that adds the styles of a Material design card.
 *
 * 一个基本的内容容器组件，它添加了一些 Material Design 卡片的样式。
 *
 * While this component can be used alone, it also provides a number
 * of preset styles for common card sections, including:
 *
 * 虽然这个组件可以单独使用，但它也为普通的卡片区段提供了一些预设的样式，包括：
 *
 * - mat-card-title
 *
 *   卡片标题
 *
 * - mat-card-subtitle
 *
 *   卡片子标题
 *
 * - mat-card-content
 *
 *   卡片内容
 *
 * - mat-card-actions
 *
 *   卡片动作
 *
 * - mat-card-footer
 *
 *   卡片底部
 *
 * @deprecated
 *
 * Use `MatCard` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-card',
  exportAs: 'matCard',
  templateUrl: 'card.html',
  styleUrls: ['card.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'mat-card mat-focus-indicator',
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
  },
})
export class MatLegacyCard {
  // @breaking-change 9.0.0 `_animationMode` parameter to be made required.
  constructor(@Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string) {}
}

/**
 * Component intended to be used within the `<mat-card>` component. It adds styles for a
 * preset header section (i.e. a title, subtitle, and avatar layout).
 *
 * 旨在于 `<mat-card>` 组件中使用的组件。它为预设标题部分（即标题、副标题和头像布局）添加样式。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardHeader` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-card-header',
  templateUrl: 'card-header.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'class': 'mat-card-header'},
})
export class MatLegacyCardHeader {}

/**
 * Component intended to be used within the `<mat-card>` component. It adds styles for a preset
 * layout that groups an image with a title section.
 *
 * 旨在于 `<mat-card>` 组件中使用的组件。它为预设布局添加样式，该布局将带有标题部分的图像分组。
 *
 * @docs-private
 * @deprecated
 *
 * Use `MatCardTitleGroup` from `@angular/material/card` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-card-title-group',
  templateUrl: 'card-title-group.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'class': 'mat-card-title-group'},
})
export class MatLegacyCardTitleGroup {}
