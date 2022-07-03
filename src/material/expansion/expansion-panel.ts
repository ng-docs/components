/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AnimationEvent} from '@angular/animations';
import {CdkAccordionItem} from '@angular/cdk/accordion';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {UniqueSelectionDispatcher} from '@angular/cdk/collections';
import {TemplatePortal} from '@angular/cdk/portal';
import {DOCUMENT} from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  SimpleChanges,
  SkipSelf,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {Subject} from 'rxjs';
import {distinctUntilChanged, filter, startWith, take} from 'rxjs/operators';
import {MatAccordionBase, MatAccordionTogglePosition, MAT_ACCORDION} from './accordion-base';
import {matExpansionAnimations} from './expansion-animations';
import {MAT_EXPANSION_PANEL} from './expansion-panel-base';
import {MatExpansionPanelContent} from './expansion-panel-content';

/**
 * MatExpansionPanel's states.
 *
 * MatExpansionPanel 的状态。
 *
 */
export type MatExpansionPanelState = 'expanded' | 'collapsed';

/**
 * Counter for generating unique element ids.
 *
 * 用于生成唯一元素 ID 的计数器。
 *
 */
let uniqueId = 0;

/**
 * Object that can be used to override the default options
 * for all of the expansion panels in a module.
 *
 * 该对象可以用来改写模块中所有可展开面板的默认选项。
 *
 */
export interface MatExpansionPanelDefaultOptions {
  /**
   * Height of the header while the panel is expanded.
   *
   * 当面板展开时，标题的高度。
   *
   */
  expandedHeight: string;

  /**
   * Height of the header while the panel is collapsed.
   *
   * 当面板折叠时，标题的高度。
   *
   */
  collapsedHeight: string;

  /**
   * Whether the toggle indicator should be hidden.
   *
   * 是否应该隐藏切换指示器。
   *
   */
  hideToggle: boolean;
}

/**
 * Injection token that can be used to configure the default
 * options for the expansion panel component.
 *
 * 这个注入令牌可以用来为可展开面板组件指定默认配置项。
 *
 */
export const MAT_EXPANSION_PANEL_DEFAULT_OPTIONS =
  new InjectionToken<MatExpansionPanelDefaultOptions>('MAT_EXPANSION_PANEL_DEFAULT_OPTIONS');

/**
 * This component can be used as a single element to show expandable content, or as one of
 * multiple children of an element with the MatAccordion directive attached.
 *
 * 该组件既可以作为单个元素来显示可展开的内容，也可以作为附着了 MatAccordion 指令的元素的多个子元素之一。
 *
 */
@Component({
  styleUrls: ['expansion-panel.css'],
  selector: 'mat-expansion-panel',
  exportAs: 'matExpansionPanel',
  templateUrl: 'expansion-panel.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['disabled', 'expanded'],
  outputs: ['opened', 'closed', 'expandedChange'],
  animations: [matExpansionAnimations.bodyExpansion],
  providers: [
    // Provide MatAccordion as undefined to prevent nested expansion panels from registering
    // to the same accordion.
    {provide: MAT_ACCORDION, useValue: undefined},
    {provide: MAT_EXPANSION_PANEL, useExisting: MatExpansionPanel},
  ],
  host: {
    'class': 'mat-expansion-panel',
    '[class.mat-expanded]': 'expanded',
    '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
    '[class.mat-expansion-panel-spacing]': '_hasSpacing()',
  },
})
export class MatExpansionPanel
  extends CdkAccordionItem
  implements AfterContentInit, OnChanges, OnDestroy
{
  private _document: Document;
  private _hideToggle = false;
  private _togglePosition: MatAccordionTogglePosition;

  /**
   * Whether the toggle indicator should be hidden.
   *
   * 是否应该隐藏切换指示器。
   *
   */
  @Input()
  get hideToggle(): boolean {
    return this._hideToggle || (this.accordion && this.accordion.hideToggle);
  }
  set hideToggle(value: BooleanInput) {
    this._hideToggle = coerceBooleanProperty(value);
  }

  /**
   * The position of the expansion indicator.
   *
   * 展开指示器的位置。
   *
   */
  @Input()
  get togglePosition(): MatAccordionTogglePosition {
    return this._togglePosition || (this.accordion && this.accordion.togglePosition);
  }
  set togglePosition(value: MatAccordionTogglePosition) {
    this._togglePosition = value;
  }

  /**
   * An event emitted after the body's expansion animation happens.
   *
   * 面板体展开动画发生后触发的事件。
   *
   */
  @Output() readonly afterExpand = new EventEmitter<void>();

  /**
   * An event emitted after the body's collapse animation happens.
   *
   * 面板体折叠动画发生后触发的事件。。
   *
   */
  @Output() readonly afterCollapse = new EventEmitter<void>();

  /**
   * Stream that emits for changes in `@Input` properties.
   *
   * `@Input` 属性发生变化时触发的流。
   *
   */
  readonly _inputChanges = new Subject<SimpleChanges>();

  /**
   * Optionally defined accordion the expansion panel belongs to.
   *
   * （可选的）可展开面板所属的已定义手风琴。
   *
   */
  override accordion: MatAccordionBase;

  /**
   * Content that will be rendered lazily.
   *
   * 惰性渲染的内容
   *
   */
  @ContentChild(MatExpansionPanelContent) _lazyContent: MatExpansionPanelContent;

  /**
   * Element containing the panel's user-provided content.
   *
   * 包含该面板中由用户提供的内容的元素。
   *
   */
  @ViewChild('body') _body: ElementRef<HTMLElement>;

  /**
   * Portal holding the user's content.
   *
   * 持有用户内容的传送点。
   *
   */
  _portal: TemplatePortal;

  /**
   * ID for the associated header element. Used for a11y labelling.
   *
   * 关联标头元素的 ID。用作无障碍标签。
   *
   */
  _headerId = `mat-expansion-panel-header-${uniqueId++}`;

  /**
   * Stream of body animation done events.
   *
   * 面板体动画完成的事件流。
   *
   */
  readonly _bodyAnimationDone = new Subject<AnimationEvent>();

  constructor(
    @Optional() @SkipSelf() @Inject(MAT_ACCORDION) accordion: MatAccordionBase,
    _changeDetectorRef: ChangeDetectorRef,
    _uniqueSelectionDispatcher: UniqueSelectionDispatcher,
    private _viewContainerRef: ViewContainerRef,
    @Inject(DOCUMENT) _document: any,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode: string,
    @Inject(MAT_EXPANSION_PANEL_DEFAULT_OPTIONS)
    @Optional()
    defaultOptions?: MatExpansionPanelDefaultOptions,
  ) {
    super(accordion, _changeDetectorRef, _uniqueSelectionDispatcher);
    this.accordion = accordion;
    this._document = _document;

    // We need a Subject with distinctUntilChanged, because the `done` event
    // fires twice on some browsers. See https://github.com/angular/angular/issues/24084
    this._bodyAnimationDone
      .pipe(
        distinctUntilChanged((x, y) => {
          return x.fromState === y.fromState && x.toState === y.toState;
        }),
      )
      .subscribe(event => {
        if (event.fromState !== 'void') {
          if (event.toState === 'expanded') {
            this.afterExpand.emit();
          } else if (event.toState === 'collapsed') {
            this.afterCollapse.emit();
          }
        }
      });

    if (defaultOptions) {
      this.hideToggle = defaultOptions.hideToggle;
    }
  }

  /**
   * Determines whether the expansion panel should have spacing between it and its siblings.
   *
   * 决定可展开面板是否应该在它和它的兄弟节点之间有间距。
   *
   */
  _hasSpacing(): boolean {
    if (this.accordion) {
      return this.expanded && this.accordion.displayMode === 'default';
    }
    return false;
  }

  /**
   * Gets the expanded state string.
   *
   * 获取展开状态的字符串。
   *
   */
  _getExpandedState(): MatExpansionPanelState {
    return this.expanded ? 'expanded' : 'collapsed';
  }

  /**
   * Toggles the expanded state of the expansion panel.
   *
   * 切换可展开面板的展开状态。
   *
   */
  override toggle(): void {
    this.expanded = !this.expanded;
  }

  /**
   * Sets the expanded state of the expansion panel to false.
   *
   * 将可展开面板的展开状态设置为 false。
   *
   */
  override close(): void {
    this.expanded = false;
  }

  /**
   * Sets the expanded state of the expansion panel to true.
   *
   * 将可展开面板的展开状态设置为 true。
   *
   */
  override open(): void {
    this.expanded = true;
  }

  ngAfterContentInit() {
    if (this._lazyContent && this._lazyContent._expansionPanel === this) {
      // Render the content as soon as the panel becomes open.
      this.opened
        .pipe(
          startWith(null),
          filter(() => this.expanded && !this._portal),
          take(1),
        )
        .subscribe(() => {
          this._portal = new TemplatePortal(this._lazyContent._template, this._viewContainerRef);
        });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this._inputChanges.next(changes);
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._bodyAnimationDone.complete();
    this._inputChanges.complete();
  }

  /**
   * Checks whether the expansion panel's content contains the currently-focused element.
   *
   * 检查可展开面板的内容是否包含当前拥有焦点的元素。
   *
   */
  _containsFocus(): boolean {
    if (this._body) {
      const focusedElement = this._document.activeElement;
      const bodyElement = this._body.nativeElement;
      return focusedElement === bodyElement || bodyElement.contains(focusedElement);
    }

    return false;
  }
}

/**
 * Actions of a `<mat-expansion-panel>`.
 *
 * `<mat-expansion-panel>` 的操作。
 *
 */
@Directive({
  selector: 'mat-action-row',
  host: {
    class: 'mat-action-row',
  },
})
export class MatExpansionPanelActionRow {}
