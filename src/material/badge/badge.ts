/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AriaDescriber, InteractivityChecker} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {DOCUMENT} from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Optional,
  Renderer2,
} from '@angular/core';
import {CanDisable, mixinDisabled, ThemePalette} from '@angular/material/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';

let nextId = 0;

// Boilerplate for applying mixins to MatBadge.
/** @docs-private */
const _MatBadgeBase = mixinDisabled(class {});

/**
 * Allowed position options for matBadgePosition
 *
 * matBadgePosition 可接受的位置选项
 *
 */
export type MatBadgePosition =
  | 'above after'
  | 'above before'
  | 'below before'
  | 'below after'
  | 'before'
  | 'after'
  | 'above'
  | 'below';

/**
 * Allowed size options for matBadgeSize
 *
 * matBadgeSize 可接受的大小选项
 *
 */
export type MatBadgeSize = 'small' | 'medium' | 'large';

const BADGE_CONTENT_CLASS = 'mat-badge-content';

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
    '[class.mat-badge-hidden]': 'hidden || !content',
    '[class.mat-badge-disabled]': 'disabled',
  },
})
export class MatBadge extends _MatBadgeBase implements OnInit, OnDestroy, CanDisable {
  /**
   * The color of the badge. Can be `primary`, `accent`, or `warn`.
   *
   * 徽章的颜色。可以是 `primary`、`accent` 或 `warn`。
   *
   */
  @Input('matBadgeColor')
  get color(): ThemePalette {
    return this._color;
  }
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
  get overlap(): boolean {
    return this._overlap;
  }
  set overlap(val: BooleanInput) {
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
  @Input('matBadge')
  get content(): string | number | undefined | null {
    return this._content;
  }
  set content(newContent: string | number | undefined | null) {
    this._updateRenderedContent(newContent);
  }
  private _content: string | number | undefined | null;

  /**
   * Message used to describe the decorated element via aria-describedby
   *
   * 用于描述被 aria-describedby 装饰的元素的信息
   *
   */
  @Input('matBadgeDescription')
  get description(): string {
    return this._description;
  }
  set description(newDescription: string) {
    this._updateDescription(newDescription);
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
  get hidden(): boolean {
    return this._hidden;
  }
  set hidden(val: BooleanInput) {
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

  /**
   * Visible badge element.
   *
   * 可见的徽章元素。
   *
   */
  private _badgeElement: HTMLElement | undefined;

  /** Inline badge description. Used when the badge is applied to non-interactive host elements. */
  private _inlineBadgeDescription: HTMLElement | undefined;

  /** Whether the OnInit lifecycle hook has run yet */
  private _isInitialized = false;

  /** InteractivityChecker to determine if the badge host is focusable. */
  private _interactivityChecker = inject(InteractivityChecker);

  private _document = inject(DOCUMENT);

  constructor(
    private _ngZone: NgZone,
    private _elementRef: ElementRef<HTMLElement>,
    private _ariaDescriber: AriaDescriber,
    private _renderer: Renderer2,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) private _animationMode?: string,
  ) {
    super();

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      const nativeElement = _elementRef.nativeElement;
      if (nativeElement.nodeType !== nativeElement.ELEMENT_NODE) {
        throw Error('matBadge must be attached to an element node.');
      }

      const matIconTagName: string = 'mat-icon';

      // Heads-up for developers to avoid putting matBadge on <mat-icon>
      // as it is aria-hidden by default docs mention this at:
      // https://material.angular.io/components/badge/overview#accessibility
      if (
        nativeElement.tagName.toLowerCase() === matIconTagName &&
        nativeElement.getAttribute('aria-hidden') === 'true'
      ) {
        console.warn(
          `Detected a matBadge on an "aria-hidden" "<mat-icon>". ` +
            `Consider setting aria-hidden="false" in order to surface the information assistive technology.` +
            `\n${nativeElement.outerHTML}`,
        );
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

  /**
   * Gets the element into which the badge's content is being rendered. Undefined if the element
   * hasn't been created (e.g. if the badge doesn't have content).
   *
   * 获取要在其中渲染徽章内容的元素。如果该元素尚未创建（例如，如果徽章没有内容），则为 undefined。
   *
   */
  getBadgeElement(): HTMLElement | undefined {
    return this._badgeElement;
  }

  ngOnInit() {
    // We may have server-side rendered badge that we need to clear.
    // We need to do this in ngOnInit because the full content of the component
    // on which the badge is attached won't necessarily be in the DOM until this point.
    this._clearExistingBadges();

    if (this.content && !this._badgeElement) {
      this._badgeElement = this._createBadgeElement();
      this._updateRenderedContent(this.content);
    }

    this._isInitialized = true;
  }

  ngOnDestroy() {
    // ViewEngine only: when creating a badge through the Renderer, Angular remembers its index.
    // We have to destroy it ourselves, otherwise it'll be retained in memory.
    if (this._renderer.destroyNode) {
      this._renderer.destroyNode(this._badgeElement);
      this._inlineBadgeDescription?.remove();
    }

    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this.description);
  }

  /** Gets whether the badge's host element is interactive. */
  private _isHostInteractive(): boolean {
    // Ignore visibility since it requires an expensive style caluclation.
    return this._interactivityChecker.isFocusable(this._elementRef.nativeElement, {
      ignoreVisibility: true,
    });
  }

  /** Creates the badge element */
  private _createBadgeElement(): HTMLElement {
    const badgeElement = this._renderer.createElement('span');
    const activeClass = 'mat-badge-active';

    badgeElement.setAttribute('id', `mat-badge-content-${this._id}`);

    // The badge is aria-hidden because we don't want it to appear in the page's navigation
    // flow. Instead, we use the badge to describe the decorated element with aria-describedby.
    badgeElement.setAttribute('aria-hidden', 'true');
    badgeElement.classList.add(BADGE_CONTENT_CLASS);

    if (this._animationMode === 'NoopAnimations') {
      badgeElement.classList.add('_mat-animation-noopable');
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
   * Update the text content of the badge element in the DOM, creating the element if necessary.
   *
   * 更新 DOM 中徽章元素的文本内容，必要时创建该元素。
   *
   */
  private _updateRenderedContent(newContent: string | number | undefined | null): void {
    const newContentNormalized: string = `${newContent ?? ''}`.trim();

    // Don't create the badge element if the directive isn't initialized because we want to
    // append the badge element to the *end* of the host element's content for backwards
    // compatibility.
    if (this._isInitialized && newContentNormalized && !this._badgeElement) {
      this._badgeElement = this._createBadgeElement();
    }

    if (this._badgeElement) {
      this._badgeElement.textContent = newContentNormalized;
    }

    this._content = newContentNormalized;
  }

  /**
   * Updates the host element's aria description via AriaDescriber.
   *
   * 通过 AriaDescriber 更新宿主元素的 aria 描述。
   *
   */
  private _updateDescription(newDescription: string): void {
    // Always start by removing the aria-describedby; we will add a new one if necessary.
    this._ariaDescriber.removeDescription(this._elementRef.nativeElement, this.description);

    // NOTE: We only check whether the host is interactive here, which happens during
    // when then badge content changes. It is possible that the host changes
    // interactivity status separate from one of these. However, watching the interactivity
    // status of the host would require a `MutationObserver`, which is likely more code + overhead
    // than it's worth; from usages inside Google, we see that the vats majority of badges either
    // never change interactivity, or also set `matBadgeHidden` based on the same condition.

    if (!newDescription || this._isHostInteractive()) {
      this._removeInlineDescription();
    }

    this._description = newDescription;

    // We don't add `aria-describedby` for non-interactive hosts elements because we
    // instead insert the description inline.
    if (this._isHostInteractive()) {
      this._ariaDescriber.describe(this._elementRef.nativeElement, newDescription);
    } else {
      this._updateInlineDescription();
    }
  }

  private _updateInlineDescription() {
    // Create the inline description element if it doesn't exist
    if (!this._inlineBadgeDescription) {
      this._inlineBadgeDescription = this._document.createElement('span');
      this._inlineBadgeDescription.classList.add('cdk-visually-hidden');
    }

    this._inlineBadgeDescription.textContent = this.description;
    this._badgeElement?.appendChild(this._inlineBadgeDescription);
  }

  private _removeInlineDescription() {
    this._inlineBadgeDescription?.remove();
    this._inlineBadgeDescription = undefined;
  }

  /**
   * Adds css theme class given the color to the component host
   *
   * 为组件宿主添加指定颜色的 css 主题类
   *
   */
  private _setColor(colorPalette: ThemePalette) {
    const classList = this._elementRef.nativeElement.classList;
    classList.remove(`mat-badge-${this._color}`);
    if (colorPalette) {
      classList.add(`mat-badge-${colorPalette}`);
    }
  }

  /**
   * Clears any existing badges that might be left over from server-side rendering.
   *
   * 清除可能在服务端渲染时残留的所有现存徽章。
   *
   */
  private _clearExistingBadges() {
    // Only check direct children of this host element in order to avoid deleting
    // any badges that might exist in descendant elements.
    const badges = this._elementRef.nativeElement.querySelectorAll(
      `:scope > .${BADGE_CONTENT_CLASS}`,
    );
    for (const badgeElement of Array.from(badges)) {
      if (badgeElement !== this._badgeElement) {
        badgeElement.remove();
      }
    }
  }
}
