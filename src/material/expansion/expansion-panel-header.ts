/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FocusableOption, FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {ENTER, hasModifierKey, SPACE} from '@angular/cdk/keycodes';
import {
  AfterViewInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  Host,
  Inject,
  Input,
  OnDestroy,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {HasTabIndex, mixinTabIndex} from '@angular/material/core';
import {EMPTY, merge, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {MatAccordionTogglePosition} from './accordion-base';
import {matExpansionAnimations} from './expansion-animations';
import {
  MatExpansionPanel,
  MatExpansionPanelDefaultOptions,
  MAT_EXPANSION_PANEL_DEFAULT_OPTIONS,
} from './expansion-panel';

// Boilerplate for applying mixins to MatExpansionPanelHeader.
/** @docs-private */
abstract class MatExpansionPanelHeaderBase {
  abstract readonly disabled: boolean;
}
const _MatExpansionPanelHeaderMixinBase = mixinTabIndex(MatExpansionPanelHeaderBase);

/**
 * Header element of a `<mat-expansion-panel>`.
 *
 * `<mat-expansion-panel>` 标头元素。
 *
 */
@Component({
  selector: 'mat-expansion-panel-header',
  styleUrls: ['expansion-panel-header.css'],
  templateUrl: 'expansion-panel-header.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['tabIndex'],
  animations: [matExpansionAnimations.indicatorRotate],
  host: {
    'class': 'mat-expansion-panel-header mat-focus-indicator',
    'role': 'button',
    '[attr.id]': 'panel._headerId',
    '[attr.tabindex]': 'tabIndex',
    '[attr.aria-controls]': '_getPanelId()',
    '[attr.aria-expanded]': '_isExpanded()',
    '[attr.aria-disabled]': 'panel.disabled',
    '[class.mat-expanded]': '_isExpanded()',
    '[class.mat-expansion-toggle-indicator-after]': `_getTogglePosition() === 'after'`,
    '[class.mat-expansion-toggle-indicator-before]': `_getTogglePosition() === 'before'`,
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
    '[style.height]': '_getHeaderHeight()',
    '(click)': '_toggle()',
    '(keydown)': '_keydown($event)',
  },
})
export class MatExpansionPanelHeader
  extends _MatExpansionPanelHeaderMixinBase
  implements AfterViewInit, OnDestroy, FocusableOption, HasTabIndex
{
  private _parentChangeSubscription = Subscription.EMPTY;

  constructor(
    @Host() public panel: MatExpansionPanel,
    private _element: ElementRef,
    private _focusMonitor: FocusMonitor,
    private _changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_EXPANSION_PANEL_DEFAULT_OPTIONS)
    @Optional()
    defaultOptions?: MatExpansionPanelDefaultOptions,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
    @Attribute('tabindex') tabIndex?: string,
  ) {
    super();
    const accordionHideToggleChange = panel.accordion
      ? panel.accordion._stateChanges.pipe(
          filter(changes => !!(changes['hideToggle'] || changes['togglePosition'])),
        )
      : EMPTY;
    this.tabIndex = parseInt(tabIndex || '') || 0;

    // Since the toggle state depends on an @Input on the panel, we
    // need to subscribe and trigger change detection manually.
    this._parentChangeSubscription = merge(
      panel.opened,
      panel.closed,
      accordionHideToggleChange,
      panel._inputChanges.pipe(
        filter(changes => {
          return !!(changes['hideToggle'] || changes['disabled'] || changes['togglePosition']);
        }),
      ),
    ).subscribe(() => this._changeDetectorRef.markForCheck());

    // Avoids focus being lost if the panel contained the focused element and was closed.
    panel.closed
      .pipe(filter(() => panel._containsFocus()))
      .subscribe(() => _focusMonitor.focusVia(_element, 'program'));

    if (defaultOptions) {
      this.expandedHeight = defaultOptions.expandedHeight;
      this.collapsedHeight = defaultOptions.collapsedHeight;
    }
  }

  /**
   * Height of the header while the panel is expanded.
   *
   * 当面板展开时，标题的高度。
   *
   */
  @Input() expandedHeight: string;

  /**
   * Height of the header while the panel is collapsed.
   *
   * 当面板折叠时，标题的高度。
   *
   */
  @Input() collapsedHeight: string;

  /**
   * Whether the associated panel is disabled. Implemented as a part of `FocusableOption`.
   *
   * 相关面板是否已禁用。实现为 `FocusableOption` 的一部分。
   *
   * @docs-private
   */
  get disabled(): boolean {
    return this.panel.disabled;
  }

  /**
   * Toggles the expanded state of the panel.
   *
   * 切换面板的展开状态。
   *
   */
  _toggle(): void {
    if (!this.disabled) {
      this.panel.toggle();
    }
  }

  /**
   * Gets whether the panel is expanded.
   *
   * 获取该面板是否已展开。
   *
   */
  _isExpanded(): boolean {
    return this.panel.expanded;
  }

  /**
   * Gets the expanded state string of the panel.
   *
   * 获取面板的展开状态字符串。
   *
   */
  _getExpandedState(): string {
    return this.panel._getExpandedState();
  }

  /**
   * Gets the panel id.
   *
   * 获取面板的 id。
   *
   */
  _getPanelId(): string {
    return this.panel.id;
  }

  /**
   * Gets the toggle position for the header.
   *
   * 获取标头上切换开关的位置。
   *
   */
  _getTogglePosition(): MatAccordionTogglePosition {
    return this.panel.togglePosition;
  }

  /**
   * Gets whether the expand indicator should be shown.
   *
   * 获取是否显示展开指示器。
   *
   */
  _showToggle(): boolean {
    return !this.panel.hideToggle && !this.panel.disabled;
  }

  /**
   * Gets the current height of the header. Null if no custom height has been
   * specified, and if the default height from the stylesheet should be used.
   *
   * 获取标头的当前高度。如果没有指定自定义高度并且使用样式表中的默认高度，则为 null。
   *
   */
  _getHeaderHeight(): string | null {
    const isExpanded = this._isExpanded();
    if (isExpanded && this.expandedHeight) {
      return this.expandedHeight;
    } else if (!isExpanded && this.collapsedHeight) {
      return this.collapsedHeight;
    }
    return null;
  }

  /**
   * Handle keydown event calling to toggle\(\) if appropriate.
   *
   * 处理 keydown 事件，并且如果合适就调用 toggle\(\)。
   *
   */
  _keydown(event: KeyboardEvent) {
    switch (event.keyCode) {
      // Toggle for space and enter keys.
      case SPACE:
      case ENTER:
        if (!hasModifierKey(event)) {
          event.preventDefault();
          this._toggle();
        }

        break;
      default:
        if (this.panel.accordion) {
          this.panel.accordion._handleHeaderKeydown(event);
        }

        return;
    }
  }

  /**
   * Focuses the panel header. Implemented as a part of `FocusableOption`.
   *
   * 让这个面板标头获得焦点。实现为 `FocusableOption` 的一部分。
   *
   * @param origin Origin of the action that triggered the focus.
   *
   * 触发获得焦点的动作来源。
   *
   * @docs-private
   */
  focus(origin?: FocusOrigin, options?: FocusOptions) {
    if (origin) {
      this._focusMonitor.focusVia(this._element, origin, options);
    } else {
      this._element.nativeElement.focus(options);
    }
  }

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._element).subscribe(origin => {
      if (origin && this.panel.accordion) {
        this.panel.accordion._handleHeaderFocus(this);
      }
    });
  }

  ngOnDestroy() {
    this._parentChangeSubscription.unsubscribe();
    this._focusMonitor.stopMonitoring(this._element);
  }
}

/**
 * Description element of a `<mat-expansion-panel-header>`.
 *
 * `<mat-expansion-panel-header>` 的描述元素。
 *
 */
@Directive({
  selector: 'mat-panel-description',
  host: {
    class: 'mat-expansion-panel-header-description',
  },
})
export class MatExpansionPanelDescription {}

/**
 * Title element of a `<mat-expansion-panel-header>`.
 *
 * `<mat-expansion-panel-header>` 的标头元素
 *
 */
@Directive({
  selector: 'mat-panel-title',
  host: {
    class: 'mat-expansion-panel-header-title',
  },
})
export class MatExpansionPanelTitle {}
