/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {
  AfterViewInit,
  AfterContentInit,
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ContentChild,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  ViewEncapsulation,
  ViewChild,
  Attribute,
  ContentChildren,
  QueryList,
  OnInit,
  DoCheck,
  inject,
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {
  CanColor,
  CanDisable,
  CanDisableRipple,
  HasTabIndex,
  MatRipple,
  MAT_RIPPLE_GLOBAL_OPTIONS,
  mixinColor,
  mixinDisableRipple,
  mixinTabIndex,
  mixinDisabled,
  RippleGlobalOptions,
  MatRippleLoader,
} from '@angular/material/core';
import {FocusMonitor} from '@angular/cdk/a11y';
import {merge, Subject, Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import {MatChipAvatar, MatChipTrailingIcon, MatChipRemove} from './chip-icons';
import {MatChipAction} from './chip-action';
import {BACKSPACE, DELETE} from '@angular/cdk/keycodes';
import {MAT_CHIP, MAT_CHIP_AVATAR, MAT_CHIP_REMOVE, MAT_CHIP_TRAILING_ICON} from './tokens';

let uid = 0;

/**
 * Represents an event fired on an individual `mat-chip`.
 *
 * 表示单个 `mat-chip` 上触发的事件。
 *
 */
export interface MatChipEvent {
  /**
   * The chip the event was fired on.
   *
   * 触发该事件的纸片。
   *
   */
  chip: MatChip;
}

/**
 * Boilerplate for applying mixins to MatChip.
 *
 * 用于将 mixins 应用于 MatChip 的样板代码。
 *
 * @docs-private
 */
const _MatChipMixinBase = mixinTabIndex(
  mixinColor(
    mixinDisableRipple(
      mixinDisabled(
        class {
          constructor(public _elementRef: ElementRef<HTMLElement>) {}
        },
      ),
    ),
    'primary',
  ),
  -1,
);

/**
 * Material design styled Chip base component. Used inside the MatChipSet component.
 *
 * Material Design 风格的纸片基础组件。在 MatChipSet 组件内部使用。
 *
 * Extended by MatChipOption and MatChipRow for different interaction patterns.
 *
 * 由 MatChipOption 和 MatChipRow 扩展用于不同的交互模式。
 *
 */
@Component({
  selector: 'mat-basic-chip, [mat-basic-chip], mat-chip, [mat-chip]',
  inputs: ['color', 'disabled', 'disableRipple', 'tabIndex'],
  exportAs: 'matChip',
  templateUrl: 'chip.html',
  styleUrls: ['chip.css'],
  host: {
    'class': 'mat-mdc-chip',
    '[class.mdc-evolution-chip]': '!_isBasicChip',
    '[class.mdc-evolution-chip--disabled]': 'disabled',
    '[class.mdc-evolution-chip--with-trailing-action]': '_hasTrailingIcon()',
    '[class.mdc-evolution-chip--with-primary-graphic]': 'leadingIcon',
    '[class.mdc-evolution-chip--with-primary-icon]': 'leadingIcon',
    '[class.mdc-evolution-chip--with-avatar]': 'leadingIcon',
    '[class.mat-mdc-chip-with-avatar]': 'leadingIcon',
    '[class.mat-mdc-chip-highlighted]': 'highlighted',
    '[class.mat-mdc-chip-disabled]': 'disabled',
    '[class.mat-mdc-basic-chip]': '_isBasicChip',
    '[class.mat-mdc-standard-chip]': '!_isBasicChip',
    '[class.mat-mdc-chip-with-trailing-icon]': '_hasTrailingIcon()',
    '[class._mat-animation-noopable]': '_animationsDisabled',
    '[id]': 'id',
    '[attr.role]': 'role',
    '[attr.tabindex]': 'role ? tabIndex : null',
    '[attr.aria-label]': 'ariaLabel',
    '(keydown)': '_handleKeydown($event)',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{provide: MAT_CHIP, useExisting: MatChip}],
})
export class MatChip
  extends _MatChipMixinBase
  implements
    OnInit,
    AfterViewInit,
    AfterContentInit,
    CanColor,
    CanDisableRipple,
    CanDisable,
    DoCheck,
    HasTabIndex,
    OnDestroy
{
  protected _document: Document;

  /** Emits when the chip is focused. */
  readonly _onFocus = new Subject<MatChipEvent>();

  /**
   * Emits when the chip is blurred.
   *
   * 当纸片失焦时发出。
   *
   */
  readonly _onBlur = new Subject<MatChipEvent>();

  /**
   * Whether this chip is a basic (unstyled) chip.
   *
   * 此纸片是否为基本（无样式）纸片。
   *
   */
  _isBasicChip: boolean;

  /**
   * Role for the root of the chip.
   *
   * 用作纸片的根。
   *
   */
  @Input() role: string | null = null;

  /**
   * Whether the chip has focus.
   *
   * 纸片是否具有焦点。
   *
   */
  private _hasFocusInternal = false;

  /** Whether moving focus into the chip is pending. */
  private _pendingFocus: boolean;

  /** Subscription to changes in the chip's actions. */
  private _actionChanges: Subscription | undefined;

  /** Whether animations for the chip are enabled. */
  _animationsDisabled: boolean;

  /** All avatars present in the chip. */
  @ContentChildren(MAT_CHIP_AVATAR, {descendants: true})
  protected _allLeadingIcons: QueryList<MatChipAvatar>;

  /** All trailing icons present in the chip. */
  @ContentChildren(MAT_CHIP_TRAILING_ICON, {descendants: true})
  protected _allTrailingIcons: QueryList<MatChipTrailingIcon>;

  /** All remove icons present in the chip. */
  @ContentChildren(MAT_CHIP_REMOVE, {descendants: true})
  protected _allRemoveIcons: QueryList<MatChipRemove>;

  _hasFocus() {
    return this._hasFocusInternal;
  }

  /**
   * A unique id for the chip. If none is supplied, it will be auto-generated.
   *
   * 纸片的唯一 ID。如果没有提供，它将自动生成。
   *
   */
  @Input() id: string = `mat-mdc-chip-${uid++}`;

  // TODO(#26104): Consider deprecating and using `_computeAriaAccessibleName` instead.
  // `ariaLabel` may be unnecessary, and `_computeAriaAccessibleName` only supports
  // datepicker's use case.
  /**
   * ARIA label for the content of the chip.
   *
   * 纸片内容的 ARIA 标签。
   *
   */
  @Input('aria-label') ariaLabel: string | null = null;

  // TODO(#26104): Consider deprecating and using `_computeAriaAccessibleName` instead.
  // `ariaDescription` may be unnecessary, and `_computeAriaAccessibleName` only supports
  // datepicker's use case.
  /**
   * ARIA description for the content of the chip.
   *
   * 纸片内容的 ARIA 描述。
   *
   */
  @Input('aria-description') ariaDescription: string | null = null;

  /**
   * Id of a span that contains this chip's aria description.
   *
   * 包含此纸片的 ARIA 描述的 span 的 ID。
   *
   */
  _ariaDescriptionId = `${this.id}-aria-description`;

  private _textElement!: HTMLElement;

  /**
   * The value of the chip. Defaults to the content inside
   * the `mat-mdc-chip-action-label` element.
   *
   * 纸片的值。默认为 `mat-mdc-chip-action-label` 元素内的内容。
   *
   */
  @Input()
  get value(): any {
    return this._value !== undefined ? this._value : this._textElement.textContent!.trim();
  }
  set value(value: any) {
    this._value = value;
  }
  protected _value: any;

  /**
   * Determines whether or not the chip displays the remove styling and emits (removed) events.
   *
   * 确定该纸片是否显示移除样式并发出 (removed) 事件。
   *
   */
  @Input()
  get removable(): boolean {
    return this._removable;
  }
  set removable(value: BooleanInput) {
    this._removable = coerceBooleanProperty(value);
  }
  protected _removable: boolean = true;

  /**
   * Colors the chip for emphasis as if it were selected.
   *
   * 为纸片着色以表强调，就好像它已被选中一样。
   *
   */
  @Input()
  get highlighted(): boolean {
    return this._highlighted;
  }
  set highlighted(value: BooleanInput) {
    this._highlighted = coerceBooleanProperty(value);
  }
  protected _highlighted: boolean = false;

  /**
   * Emitted when a chip is to be removed.
   *
   * 当要移除某个纸片时会触发。
   *
   */
  @Output() readonly removed: EventEmitter<MatChipEvent> = new EventEmitter<MatChipEvent>();

  /**
   * Emitted when the chip is destroyed.
   *
   * 当该纸片被销毁时会触发。
   *
   */
  @Output() readonly destroyed: EventEmitter<MatChipEvent> = new EventEmitter<MatChipEvent>();

  /**
   * The unstyled chip selector for this component.
   *
   * 此组件的无样式纸片选择器。
   *
   */
  protected basicChipAttrName = 'mat-basic-chip';

  /**
   * The chip's leading icon.
   *
   * 纸片的主要图标。
   *
   */
  @ContentChild(MAT_CHIP_AVATAR) leadingIcon: MatChipAvatar;

  /**
   * The chip's trailing icon.
   *
   * 该纸片的尾部图标。
   *
   */
  @ContentChild(MAT_CHIP_TRAILING_ICON) trailingIcon: MatChipTrailingIcon;

  /**
   * The chip's trailing remove icon.
   *
   * 纸片的尾随删除图标。
   *
   */
  @ContentChild(MAT_CHIP_REMOVE) removeIcon: MatChipRemove;

  /**
   * Reference to the MatRipple instance of the chip.
   * @deprecated Considered an implementation detail. To be removed.
   * @breaking-change 17.0.0
   */
  get ripple(): MatRipple {
    return this._rippleLoader?.getRipple(this._elementRef.nativeElement)!;
  }
  set ripple(v: MatRipple) {
    this._rippleLoader?.attachRipple(this._elementRef.nativeElement, v);
  }

  /**
   * Action receiving the primary set of user interactions.
   *
   * 接收主要用户交互集的操作。
   *
   */
  @ViewChild(MatChipAction) primaryAction: MatChipAction;

  /**
   * Handles the lazy creation of the MatChip ripple.
   * Used to improve initial load time of large applications.
   */
  _rippleLoader: MatRippleLoader = inject(MatRippleLoader);

  constructor(
    public _changeDetectorRef: ChangeDetectorRef,
    elementRef: ElementRef<HTMLElement>,
    protected _ngZone: NgZone,
    private _focusMonitor: FocusMonitor,
    @Inject(DOCUMENT) _document: any,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationMode?: string,
    @Optional()
    @Inject(MAT_RIPPLE_GLOBAL_OPTIONS)
    private _globalRippleOptions?: RippleGlobalOptions,
    @Attribute('tabindex') tabIndex?: string,
  ) {
    super(elementRef);
    this._document = _document;
    this._animationsDisabled = animationMode === 'NoopAnimations';
    if (tabIndex != null) {
      this.tabIndex = parseInt(tabIndex) ?? this.defaultTabIndex;
    }
    this._monitorFocus();

    this._rippleLoader?.configureRipple(this._elementRef.nativeElement, {
      className: 'mat-mdc-chip-ripple',
      disabled: this._isRippleDisabled(),
    });
  }

  ngOnInit() {
    // This check needs to happen in `ngOnInit` so the overridden value of
    // `basicChipAttrName` coming from base classes can be picked up.
    const element = this._elementRef.nativeElement;
    this._isBasicChip =
      element.hasAttribute(this.basicChipAttrName) ||
      element.tagName.toLowerCase() === this.basicChipAttrName;
  }

  ngAfterViewInit() {
    this._textElement = this._elementRef.nativeElement.querySelector('.mat-mdc-chip-action-label')!;

    if (this._pendingFocus) {
      this._pendingFocus = false;
      this.focus();
    }
  }

  ngAfterContentInit(): void {
    // Since the styling depends on the presence of some
    // actions, we have to mark for check on changes.
    this._actionChanges = merge(
      this._allLeadingIcons.changes,
      this._allTrailingIcons.changes,
      this._allRemoveIcons.changes,
    ).subscribe(() => this._changeDetectorRef.markForCheck());
  }

  ngDoCheck(): void {
    this._rippleLoader.setDisabled(this._elementRef.nativeElement, this._isRippleDisabled());
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
    this._actionChanges?.unsubscribe();
    this.destroyed.emit({chip: this});
    this.destroyed.complete();
  }

  /**
   * Allows for programmatic removal of the chip.
   *
   * 允许以编程方式移除该纸片。当按下 DELETE 或 BACKSPACE 键时，会由 MatChipList 调用。
   *
   * Informs any listeners of the removal request. Does not remove the chip from the DOM.
   *
   * 通知任何监听器这个删除请求。但不会从 DOM 中移除纸片。
   *
   */
  remove(): void {
    if (this.removable) {
      this.removed.emit({chip: this});
    }
  }

  /**
   * Whether or not the ripple should be disabled.
   *
   * 是否应禁用涟漪。
   *
   */
  _isRippleDisabled(): boolean {
    return (
      this.disabled ||
      this.disableRipple ||
      this._animationsDisabled ||
      this._isBasicChip ||
      !!this._globalRippleOptions?.disabled
    );
  }

  /**
   * Returns whether the chip has a trailing icon.
   *
   * 返回纸片是否有尾随图标。
   *
   */
  _hasTrailingIcon() {
    return !!(this.trailingIcon || this.removeIcon);
  }

  /**
   * Handles keyboard events on the chip.
   *
   * 处理纸片上的键盘事件。
   *
   */
  _handleKeydown(event: KeyboardEvent) {
    if (event.keyCode === BACKSPACE || event.keyCode === DELETE) {
      event.preventDefault();
      this.remove();
    }
  }

  /**
   * Allows for programmatic focusing of the chip.
   *
   * 允许通过编程把该纸片设为焦点。
   *
   */
  focus(): void {
    if (!this.disabled) {
      // If `focus` is called before `ngAfterViewInit`, we won't have access to the primary action.
      // This can happen if the consumer tries to focus a chip immediately after it is added.
      // Queue the method to be called again on init.
      if (this.primaryAction) {
        this.primaryAction.focus();
      } else {
        this._pendingFocus = true;
      }
    }
  }

  /**
   * Gets the action that contains a specific target node.
   *
   * 获取包含特定目标节点的操作。
   *
   */
  _getSourceAction(target: Node): MatChipAction | undefined {
    return this._getActions().find(action => {
      const element = action._elementRef.nativeElement;
      return element === target || element.contains(target);
    });
  }

  /**
   * Gets all of the actions within the chip.
   *
   * 获取纸片内的所有操作。
   *
   */
  _getActions(): MatChipAction[] {
    const result: MatChipAction[] = [];

    if (this.primaryAction) {
      result.push(this.primaryAction);
    }

    if (this.removeIcon) {
      result.push(this.removeIcon);
    }

    if (this.trailingIcon) {
      result.push(this.trailingIcon);
    }

    return result;
  }

  /**
   * Handles interactions with the primary action of the chip.
   *
   * 处理与纸片主要操作的交互。
   *
   */
  _handlePrimaryActionInteraction() {
    // Empty here, but is overwritten in child classes.
  }

  /** Starts the focus monitoring process on the chip. */
  private _monitorFocus() {
    this._focusMonitor.monitor(this._elementRef, true).subscribe(origin => {
      const hasFocus = origin !== null;

      if (hasFocus !== this._hasFocusInternal) {
        this._hasFocusInternal = hasFocus;

        if (hasFocus) {
          this._onFocus.next({chip: this});
        } else {
          // When animations are enabled, Angular may end up removing the chip from the DOM a little
          // earlier than usual, causing it to be blurred and throwing off the logic in the chip list
          // that moves focus not the next item. To work around the issue, we defer marking the chip
          // as not focused until the next time the zone stabilizes.
          this._ngZone.onStable
            .pipe(take(1))
            .subscribe(() => this._ngZone.run(() => this._onBlur.next({chip: this})));
        }
      }
    });
  }
}
