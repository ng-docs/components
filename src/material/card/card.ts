/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Inject,
  InjectionToken,
  Input,
  Optional,
  ViewEncapsulation,
} from '@angular/core';

export type MatCardAppearance = 'outlined' | 'raised';

/**
 * Object that can be used to configure the default options for the card module.
 *
 * 可用于配置卡模块默认选项的对象。
 *
 */
export interface MatCardConfig {
  /**
   * Default appearance for cards.
   *
   * 卡片的默认外观。
   *
   */
  appearance?: MatCardAppearance;
}

/**
 * Injection token that can be used to provide the default options the card module.
 *
 * 可用于为卡片模块提供默认选项的注入令牌。
 *
 */
export const MAT_CARD_CONFIG = new InjectionToken<MatCardConfig>('MAT_CARD_CONFIG');

/**
 * Material Design card component. Cards contain content and actions about a single subject.
 * See https://material.io/design/components/cards.html
 *
 * MatCard provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCard 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Component({
  selector: 'mat-card',
  templateUrl: 'card.html',
  styleUrls: ['card.css'],
  host: {
    'class': 'mat-mdc-card mdc-card',
    '[class.mat-mdc-card-outlined]': 'appearance === "outlined"',
    '[class.mdc-card--outlined]': 'appearance === "outlined"',
  },
  exportAs: 'matCard',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatCard {
  @Input() appearance: MatCardAppearance;

  constructor(@Inject(MAT_CARD_CONFIG) @Optional() config?: MatCardConfig) {
    this.appearance = config?.appearance || 'raised';
  }
}

// TODO(jelbourn): add `MatActionCard`, which is a card that acts like a button (and has a ripple).
// Supported in MDC with `.mdc-card__primary-action`. Will require additional a11y docs for users.

/**
 * Title of a card, intended for use within `<mat-card>`. This component is an optional
 * convenience for one variety of card title; any custom title element may be used in its place.
 *
 * 卡片的标题，用于 `<mat-card>` 中。该组件只是一种可选的便利性卡片标题；可以使用任何自定义标题元素代替它。
 *
 * MatCardTitle provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardTitle 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: `mat-card-title, [mat-card-title], [matCardTitle]`,
  host: {'class': 'mat-mdc-card-title'},
})
export class MatCardTitle {}

/**
 * Container intended to be used within the `<mat-card>` component. Can contain exactly one
 * `<mat-card-title>`, one `<mat-card-subtitle>` and one content image of any size
 * (e.g. `<img matCardLgImage>`).
 *
 * 旨在于 `<mat-card>` 组件中使用的容器。可以只包含一个 `<mat-card-title>` 、一个 `<mat-card-subtitle>` 和一个任意大小的内容图像（例如 `<img matCardLgImage>` ）。
 *
 */
@Component({
  selector: 'mat-card-title-group',
  templateUrl: 'card-title-group.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'class': 'mat-mdc-card-title-group'},
})
export class MatCardTitleGroup {}

/**
 * Content of a card, intended for use within `<mat-card>`. This component is an optional
 * convenience for use with other convenience elements, such as `<mat-card-title>`; any custom
 * content block element may be used in its place.
 *
 * 卡片的内容，旨在用于 `<mat-card>` 中。该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-title>` ；可以使用任何自定义内容块元素代替它。
 *
 * MatCardContent provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardContent 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: 'mat-card-content',
  host: {'class': 'mat-mdc-card-content'},
})
export class MatCardContent {}

/**
 * Sub-title of a card, intended for use within `<mat-card>` beneath a `<mat-card-title>`. This
 * component is an optional convenience for use with other convenience elements, such as
 * `<mat-card-title>`.
 *
 * 卡片的副标题，用于在 `<mat-card>` `<mat-card-title>` 中使用。该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-title>` 。
 *
 * MatCardSubtitle provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardSubtitle 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: `mat-card-subtitle, [mat-card-subtitle], [matCardSubtitle]`,
  host: {'class': 'mat-mdc-card-subtitle'},
})
export class MatCardSubtitle {}

/**
 * Bottom area of a card that contains action buttons, intended for use within `<mat-card>`.
 * This component is an optional convenience for use with other convenience elements, such as
 * `<mat-card-content>`; any custom action block element may be used in its place.
 *
 * 包含操作按钮的卡片底部区域，旨在用于 `<mat-card>` 中。该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-content>` ；可以使用任何自定义操作块元素代替它。
 *
 * MatCardActions provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardActions 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: 'mat-card-actions',
  exportAs: 'matCardActions',
  host: {
    'class': 'mat-mdc-card-actions mdc-card__actions',
    '[class.mat-mdc-card-actions-align-end]': 'align === "end"',
  },
})
export class MatCardActions {
  // TODO(jelbourn): deprecate `align` in favor of `actionPosition` or `actionAlignment`
  // as to not conflict with the native `align` attribute.

  /**
   * Position of the actions inside the card.
   *
   * 动作在卡片中的位置。
   *
   */
  @Input() align: 'start' | 'end' = 'start';

  // TODO(jelbourn): support `.mdc-card__actions--full-bleed`.

  // TODO(jelbourn): support  `.mdc-card__action-buttons` and `.mdc-card__action-icons`.

  // TODO(jelbourn): figure out how to use `.mdc-card__action`, `.mdc-card__action--button`, and
  // `mdc-card__action--icon`. They're used primarily for positioning, which we might be able to
  // do implicitly.
}

/**
 * Header region of a card, intended for use within `<mat-card>`. This header captures
 * a card title, subtitle, and avatar.  This component is an optional convenience for use with
 * other convenience elements, such as `<mat-card-footer>`; any custom header block element may be
 * used in its place.
 *
 * 卡片的标题区域，用于在 `<mat-card>` 中使用。此卡片头表现卡片标题、副标题和头像。该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-footer>` ；可以在其位置使用任何自定义标题块元素。
 *
 * MatCardHeader provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardHeader 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Component({
  selector: 'mat-card-header',
  templateUrl: 'card-header.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'class': 'mat-mdc-card-header'},
})
export class MatCardHeader {}

/**
 * Footer area a card, intended for use within `<mat-card>`.
 * This component is an optional convenience for use with other convenience elements, such as
 * `<mat-card-content>`; any custom footer block element may be used in its place.
 *
 * 页脚区域是一张卡片，用于在 `<mat-card>` 中使用。该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-content>` ；可以在其位置使用任何自定义页脚块元素。
 *
 * MatCardFooter provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardFooter 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: 'mat-card-footer',
  host: {'class': 'mat-mdc-card-footer'},
})
export class MatCardFooter {}

// TODO(jelbourn): deprecate the "image" selectors to replace with "media".

// TODO(jelbourn): support `.mdc-card__media-content`.

/**
 * Primary image content for a card, intended for use within `<mat-card>`. Can be applied to
 * any media element, such as `<img>` or `<picture>`.
 *
 * 卡片的主要图像内容，旨在用于 `<mat-card>` 中。可以应用于任何媒体元素，例如 `<img>` 或 `<picture>` 。
 *
 * This component is an optional convenience for use with other convenience elements, such as
 * `<mat-card-content>`; any custom media element may be used in its place.
 *
 * 该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-content>` ；可以使用任何自定义媒体元素代替它。
 *
 * MatCardImage provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardImage 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: '[mat-card-image], [matCardImage]',
  host: {'class': 'mat-mdc-card-image mdc-card__media'},
})
export class MatCardImage {
  // TODO(jelbourn): support `.mdc-card__media--square` and `.mdc-card__media--16-9`.
}

/**
 * Same as `MatCardImage`, but small.
 *
 * 与 `MatCardImage` 相同，但很小。
 *
 */
@Directive({
  selector: '[mat-card-sm-image], [matCardImageSmall]',
  host: {'class': 'mat-mdc-card-sm-image mdc-card__media'},
})
export class MatCardSmImage {}

/**
 * Same as `MatCardImage`, but medium.
 *
 * 与 `MatCardImage` 相同，但中等。
 *
 */
@Directive({
  selector: '[mat-card-md-image], [matCardImageMedium]',
  host: {'class': 'mat-mdc-card-md-image mdc-card__media'},
})
export class MatCardMdImage {}

/**
 * Same as `MatCardImage`, but large.
 *
 * 与 `MatCardImage` 相同，但较大。
 *
 */
@Directive({
  selector: '[mat-card-lg-image], [matCardImageLarge]',
  host: {'class': 'mat-mdc-card-lg-image mdc-card__media'},
})
export class MatCardLgImage {}

/**
 * Same as `MatCardImage`, but extra-large.
 *
 * 与 `MatCardImage` 相同，但超大。
 *
 */
@Directive({
  selector: '[mat-card-xl-image], [matCardImageXLarge]',
  host: {'class': 'mat-mdc-card-xl-image mdc-card__media'},
})
export class MatCardXlImage {}

/**
 * Avatar image content for a card, intended for use within `<mat-card>`. Can be applied to
 * any media element, such as `<img>` or `<picture>`.
 *
 * 卡片的头像图像内容，旨在于 `<mat-card>` 中使用。可以应用于任何媒体元素，例如 `<img>` 或 `<picture>` 。
 *
 * This component is an optional convenience for use with other convenience elements, such as
 * `<mat-card-title>`; any custom media element may be used in its place.
 *
 * 该组件是一个可选的便利组件，可以与其他便利元素一起使用，例如 `<mat-card-title>` ；可以使用任何自定义媒体元素代替它。
 *
 * MatCardAvatar provides no behaviors, instead serving as a purely visual treatment.
 *
 * MatCardAvatar 不提供任何行为，而是作为一种纯粹的视觉处理。
 *
 */
@Directive({
  selector: '[mat-card-avatar], [matCardAvatar]',
  host: {'class': 'mat-mdc-card-avatar'},
})
export class MatCardAvatar {}
