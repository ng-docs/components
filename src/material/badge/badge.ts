/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AriaDescriber} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  Directive,
  ElementRef,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Optional,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import {CanDisable, CanDisableCtor, mixinDisabled, ThemePalette} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

let nextId = 0;

// Boilerplate for applying mixins to MatBadge.
/** @docs-private */
class MatBadgeBase {}

const _MatBadgeMixinBase:
    CanDisableCtor & typeof MatBadgeBase = mixinDisabled(MatBadgeBase);

/**
 * Allowed position options for matBadgePosition
 *
 * matBadgePosition 可接受的位置选项
 *
 */
export type MatBadgePosition =
    'above after' | 'above before' | 'below before' | 'below after' |
    'before' | 'after' | 'above' | 'below';

/**
 * Allowed size options for matBadgeSize
 *
 * matBadgeSize 可接受的大小选项
 *
 */
export type MatBadgeSize = 'small' | 'medium' | 'large';

/**
 * Directive to display a text badge.
 *
 * 用于显示文字徽章的指令。
 *
 */
@Directive({
  selector: '[matBadge]',
  inputs: ['disabled: matBadgeDisabled'],
  host: {
    'class': 'mat-badge',
    '[class.mat-badge-overlap]': 'overlap',
    '[class.mat-badge-above]': 'isAbove()',
    '[class.mat-badge-below]': '!isAbove()',
    '[class.mat-badge-before]': '!isAfter()',
    '[class.mat-badge-after]': 'isAfter()',
    '[class.mat-badge-small]': 'size === "small"',
    '[class.mat-badge-medium]': 'size === "medium"',
    '[class.mat-badge-large]': 'size === "large"',
    '[class.mat-badge-hidden]': 'hidden || !_hasContent',
    '[class.mat-badge-disabled]': 'disabled',
  },
})
export class MatBadge extends _MatBadgeMixinBase implements OnDestroy, OnChanges, CanDisable {
  /**
   * Whether the badge has any content.
   *
   * 徽章中是否有任何内容。
   *
   */
  _hasContent = false;

  /**
   * The color of the badge. Can be `primary`, `accent`, or `warn`.
   *
   * 徽章的颜色。可以是 `primary`、`accent` 或 `warn`。
   *
   */
  @Input('matBadgeColor')
  get color(): ThemePalette { return this._color; }
  set color(value: ThemePalette) {
    this._setColor(value);
    this._color = value;
  }
  private _color: ThemePalette = 'primary';

  /**
   * Whether the badge should overlap its contents or not
   *
   * 徽章是否应与其内容重叠
   *
   */
  @Input('matBadgeOverlap')
  get overlap(): boolean { return this._overlap; }
  set overlap(val: boolean) {
    this._overlap = coerceBooleanProperty(val);
  }
  private _overlap: boolean = true;

  /**
   * Position the badge should reside.
   * Accepts any combination of 'above'|'below' and 'before'|'after'
   *
   * 徽章应该放在哪里。接受 'above'|'below' 和 'before'|'after' 的任意组合
   *
   */
  @Input('matBadgePosition') position: MatBadgePosition = 'above after';

  /**
   * The content for the badge
   *
   * 徽章的内容
   *
   */
  @Input('matBadge') content: string | number | undefined | null;

  /**
   * Message used to describe the decorated element via aria-describedby
   *
   * 用于描述被 aria-describedby 装饰的元素的信息
   *
   */
  @Input('matBadgeDescription')
  get description(): string { return this._description; }
  set description(newDescription: string) {
    if (newDescription !== this._description) {
      const badgeElement = this._badgeElement;
      this._updateHostAriaDescription(newDescription, this._description);
      this._description = newDescription;

      if (badgeElement) {
        newDescription ? badgeElement.setAttribute('aria-label', newDescription) :
            badgeElement.removeAttribute('aria-label');
      }
    }
  }
  private _description: string;

  /**
   * Size of the badge. Can be 'small', 'medium', or 'large'.
   *
   * 徽章的大小。可以是 'small'、'medium' 或 'large'。
   *
   */
  @Input('matBadgeSize') size: MatBadgeSize = 'medium';

  /**
   * Whether the badge is hidden.
   *
   * 徽章是否隐藏了。
   *
   */
  @Input('matBadgeHidden')
  get hidden(): boolean { return this._hidden; }
  set hidden(val: boolean) {
    this._hidden = coerceBooleanProperty(val);
  }
  private _hidden: boolean;

  /**
   * Unique id for the badge
   *
   * 徽章的唯一标识
   *
   */
  _id: number = nextId++;

  private _badgeElement: HTMLElement | undefined;

  constructor(
      private _ngZone: NgZone,
      private _elementRef: ElementRef<HTMLElement>,
      private _ariaDescriber: AriaDescriber,
      private _renderer: Renderer2,
      @Optional() @Inject(ANIMATION_MODULE_TYPE) private _animationMode?: string) {
      super();

      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        const nativeElement = _elementRef.nativeElement;
        if (nativeElement.nodeType !== nativeElement.ELEMENT_NODE) {
          throw Error('matBadge must be attached to an element node.');
        }
      }
    }

  /**
   * Whether the badge is above the host or not
   *
   * 徽章是否在宿主元素上方
   *
   */
  isAbove(): boolean {
    return this.position.indexOf('below') === -1;
  }

  /**
   * Whether the badge is after the host or not
   *
   * 徽章是否在宿主元素下方
   *
   */
  isAfter(): boolean {
    return this.position.indexOf('before') === -1;
  }

  ngOnChanges(changes: SimpleChanges) {
    const contentChange = changes['content'];

    if (contentChange) {
      const value = contentChange.currentValue;
      this._hasContent = value != null && `${value}`.trim().length > 0;
      this._updateTextContent();
    }
  }

  ngOnDestroy() {
    const badgeElement = this._badgeElement;

    if (badgeElement) {
      if (this.description) {
        this._ariaDescriber.removeDescription(badgeElement, this.description);
      }

      // When creating a badge through the Renderer, Angular will keep it in an index.
      // We have to destroy it ourselves, otherwise it'll be retained in memory.
      if (this._renderer.destroyNode) {
        this._renderer.destroyNode(badgeElement);
      }
    }
  }

  /**
   * Gets the element into which the badge's content is being rendered.
   * Undefined if the element hasn't been created (e.g. if the badge doesn't have content).
   *
   * 获取要用来渲染徽章内容的元素。如果尚未创建该元素，则返回 undefined（例如，如果该徽章没有内容）。
   *
   */
  getBadgeElement(): HTMLElement | undefined {
    return this._badgeElement;
  }

  /**
   * Injects a span element into the DOM with the content.
   *
   * 把一个 span 元素注入到具有该内容的 DOM 中。
   *
   */
  private _updateTextContent(): HTMLSpanElement {
    if (!this._badgeElement) {
      this._badgeElement = this._createBadgeElement();
    } else {
      this._badgeElement.textContent = this._stringifyContent();
    }
    return this._badgeElement;
  }

  /**
   * Creates the badge element
   *
   * 创建徽章元素
   *
   */
  private _createBadgeElement(): HTMLElement {
    const badgeElement = this._renderer.createElement('span');
    const activeClass = 'mat-badge-active';
    const contentClass = 'mat-badge-content';

    // Clear any existing badges which may have persisted from a server-side render.
    this._clearExistingBadges(contentClass);
    badgeElement.setAttribute('id', `mat-badge-content-${this._id}`);
    badgeElement.classList.add(contentClass);
    badgeElement.textContent = this._stringifyContent();

    if (this._animationMode === 'NoopAnimations') {
      badgeElement.classList.add('_mat-animation-noopable');
    }

    if (this.description) {
      badgeElement.setAttribute('aria-label', this.description);
    }

    this._elementRef.nativeElement.appendChild(badgeElement);

    // animate in after insertion
    if (typeof requestAnimationFrame === 'function' && this._animationMode !== 'NoopAnimations') {
      this._ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          badgeElement.classList.add(activeClass);
        });
      });
    } else {
      badgeElement.classList.add(activeClass);
    }

    return badgeElement;
  }

  /**
   * Sets the aria-label property on the element
   *
   * 在元素上设置 aria-label 属性
   *
   */
  private _updateHostAriaDescription(newDescription: string, oldDescription: string): void {
    // ensure content available before setting label
    const content = this._updateTextContent();

    if (oldDescription) {
      this._ariaDescriber.removeDescription(content, oldDescription);
    }

    if (newDescription) {
      this._ariaDescriber.describe(content, newDescription);
    }
  }

  /**
   * Adds css theme class given the color to the component host
   *
   * 为组件宿主添加指定颜色的 css 主题类
   *
   */
  private _setColor(colorPalette: ThemePalette) {
    if (colorPalette !== this._color) {
      const classList = this._elementRef.nativeElement.classList;
      if (this._color) {
        classList.remove(`mat-badge-${this._color}`);
      }
      if (colorPalette) {
        classList.add(`mat-badge-${colorPalette}`);
      }
    }
  }

  /**
   * Clears any existing badges that might be left over from server-side rendering.
   *
   * 清除可能在服务端渲染时残留的所有现存徽章。
   *
   */
  private _clearExistingBadges(cssClass: string) {
    const element = this._elementRef.nativeElement;
    let childCount = element.children.length;

    // Use a reverse while, because we'll be removing elements from the list as we're iterating.
    while (childCount--) {
      const currentChild = element.children[childCount];

      if (currentChild.classList.contains(cssClass)) {
        element.removeChild(currentChild);
      }
    }
  }

  /**
   * Gets the string representation of the badge content.
   *
   * 获取徽章内容的字符串表示。
   *
   */
  private _stringifyContent(): string {
    // Convert null and undefined to an empty string which is consistent
    // with how Angular handles them in inside template interpolations.
    const content = this.content;
    return content == null ? '' : `${content}`;
  }

  static ngAcceptInputType_disabled: BooleanInput;
  static ngAcceptInputType_hidden: BooleanInput;
  static ngAcceptInputType_overlap: BooleanInput;
}
