/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  MAT_OPTGROUP,
  MAT_OPTION_PARENT_COMPONENT,
  MatOptgroup,
  MatOption,
  mixinDisableRipple,
  CanDisableRipple,
  _MatOptionBase,
  _MatOptgroupBase,
  ThemePalette,
} from '@angular/material/core';
import {ActiveDescendantKeyManager} from '@angular/cdk/a11y';
import {BooleanInput, coerceBooleanProperty, coerceStringArray} from '@angular/cdk/coercion';
import {Platform} from '@angular/cdk/platform';
import {panelAnimation} from './animations';
import {Subscription} from 'rxjs';

/**
 * Autocomplete IDs need to be unique across components, so this counter exists outside of
 * the component definition.
 *
 * 自动完成器的 ID 在组件之间必须是唯一的，所以这个计数器存在于组件定义之外。
 *
 */
let _uniqueAutocompleteIdCounter = 0;

/**
 * Event object that is emitted when an autocomplete option is selected.
 *
 * 选定某个自动完成选项时发出的事件对象。
 *
 */
export class MatAutocompleteSelectedEvent {
  constructor(
    /**
     * Reference to the autocomplete panel that emitted the event.
     *
     * 对发出此事件的自动完成面板的引用。
     */
    public source: _MatAutocompleteBase,
    /**
     * Option that was selected.
     *
     * 已选择的选项。
     */
    public option: _MatOptionBase,
  ) {}
}

/**
 * Event object that is emitted when an autocomplete option is activated.
 *
 * 激活某个自动完成选项时发出的事件对象。
 *
 */
export interface MatAutocompleteActivatedEvent {
  /**
   * Reference to the autocomplete panel that emitted the event.
   *
   * 引用那个发出本事件的自动完成器面板。
   *
   */
  source: _MatAutocompleteBase;

  /**
   * Option that was selected.
   *
   * 选定的选项。
   *
   */
  option: _MatOptionBase | null;
}

// Boilerplate for applying mixins to MatAutocomplete.
/** @docs-private */
const _MatAutocompleteMixinBase = mixinDisableRipple(class {});

/**
 * Default `mat-autocomplete` options that can be overridden.
 *
 * 默认的 `mat-autocomplete` 选项，可被改写。
 *
 */
export interface MatAutocompleteDefaultOptions {
  /**
   * Whether the first option should be highlighted when an autocomplete panel is opened.
   *
   * 当打开自动完成面板时，是否应突出显示第一个选项。
   *
   */
  autoActiveFirstOption?: boolean;

  /**
   * Whether the active option should be selected as the user is navigating.
   *
   * 在用户导航时是否应选择活动选项。
   *
   */
  autoSelectActiveOption?: boolean;

  /**
   * Class or list of classes to be applied to the autocomplete's overlay panel.
   *
   * 类或类的列表，应用在自动完成器的弹出面板中。
   *
   */
  overlayPanelClass?: string | string[];
}

/**
 * Injection token to be used to override the default options for `mat-autocomplete`.
 *
 * 这个注入令牌用来改写 `mat-autocomplete` 的默认选项。
 *
 */
export const MAT_AUTOCOMPLETE_DEFAULT_OPTIONS = new InjectionToken<MatAutocompleteDefaultOptions>(
  'mat-autocomplete-default-options',
  {
    providedIn: 'root',
    factory: MAT_AUTOCOMPLETE_DEFAULT_OPTIONS_FACTORY,
  },
);

/** @docs-private */
export function MAT_AUTOCOMPLETE_DEFAULT_OPTIONS_FACTORY(): MatAutocompleteDefaultOptions {
  return {autoActiveFirstOption: false, autoSelectActiveOption: false};
}

/**
 * Base class with all of the `MatAutocomplete` functionality.
 *
 * 具备所有 `MatAutocomplete` 功能的基类。
 *
 */
@Directive()
export abstract class _MatAutocompleteBase
  extends _MatAutocompleteMixinBase
  implements AfterContentInit, CanDisableRipple, OnDestroy
{
  private _activeOptionChanges = Subscription.EMPTY;

  /**
   * Class to apply to the panel when it's visible.
   *
   * 当面板可见时应用于此面板的类。
   *
   */
  protected abstract _visibleClass: string;

  /**
   * Class to apply to the panel when it's hidden.
   *
   * 当面板隐藏时应用于此面板的类。
   *
   */
  protected abstract _hiddenClass: string;

  /**
   * Manages active item in option list based on key events.
   *
   * 根据某些关键事件来管理选项列表中的活动条目。
   *
   */
  _keyManager: ActiveDescendantKeyManager<_MatOptionBase>;

  /**
   * Whether the autocomplete panel should be visible, depending on option length.
   *
   * 自动填充功能面板是否可见，取决于选项的长度。
   *
   */
  showPanel: boolean = false;

  /**
   * Whether the autocomplete panel is open.
   *
   * 自动完成面板是否已打开。
   *
   */
  get isOpen(): boolean {
    return this._isOpen && this.showPanel;
  }
  _isOpen: boolean = false;

  /** @docs-private Sets the theme color of the panel. */
  _setColor(value: ThemePalette) {
    this._color = value;
    this._setThemeClasses(this._classList);
  }
  /** @docs-private theme color of the panel */
  private _color: ThemePalette;

  // The @ViewChild query for TemplateRef here needs to be static because some code paths
  // lead to the overlay being created before change detection has finished for this component.
  // Notably, another component may trigger `focus` on the autocomplete-trigger.

  /** @docs-private */
  @ViewChild(TemplateRef, {static: true}) template: TemplateRef<any>;

  /**
   * Element for the panel containing the autocomplete options.
   *
   * 容纳自动完成选项的面板元素。
   *
   */
  @ViewChild('panel') panel: ElementRef;

  /**
   * Reference to all options within the autocomplete.
   *
   * 对自动完成中所有选项的引用。
   *
   */
  abstract options: QueryList<_MatOptionBase>;

  /**
   * Reference to all option groups within the autocomplete.
   *
   * 对自动完成中所有选项组的引用。
   *
   */
  abstract optionGroups: QueryList<_MatOptgroupBase>;

  /**
   * Aria label of the autocomplete.
   *
   * 选择器的 Aria 标签。
   *
   */
  @Input('aria-label') ariaLabel: string;

  /**
   * Input that can be used to specify the `aria-labelledby` attribute.
   *
   * 用于指定 `aria-labelledby` 属性的输入属性。
   *
   */
  @Input('aria-labelledby') ariaLabelledby: string;

  /**
   * Function that maps an option's control value to its display value in the trigger.
   *
   * 一个函数，用来将选项的控件值映射到触发器中的显示值。
   *
   */
  @Input() displayWith: ((value: any) => string) | null = null;

  /**
   * Whether the first option should be highlighted when the autocomplete panel is opened.
   * Can be configured globally through the `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` token.
   *
   * 当自动完成面板打开时，是否应突出显示第一个选项。可以通过 `MAT_AUTOCOMPLETE_DEFAULT_OPTIONS` 令牌进行全局配置。
   *
   */
  @Input()
  get autoActiveFirstOption(): boolean {
    return this._autoActiveFirstOption;
  }
  set autoActiveFirstOption(value: BooleanInput) {
    this._autoActiveFirstOption = coerceBooleanProperty(value);
  }
  private _autoActiveFirstOption: boolean;

  /**
   * Whether the active option should be selected as the user is navigating.
   *
   * 在用户导航时是否应选择活动选项。
   *
   */
  @Input()
  get autoSelectActiveOption(): boolean {
    return this._autoSelectActiveOption;
  }
  set autoSelectActiveOption(value: BooleanInput) {
    this._autoSelectActiveOption = coerceBooleanProperty(value);
  }
  private _autoSelectActiveOption: boolean;

  /**
   * Specify the width of the autocomplete panel.  Can be any CSS sizing value, otherwise it will
   * match the width of its host.
   *
   * 指定自动完成面板的宽度。可以是任意 CSS 尺寸值，否则就会匹配它的宿主宽度。
   *
   */
  @Input() panelWidth: string | number;

  /**
   * Event that is emitted whenever an option from the list is selected.
   *
   * 每次从列表中选择一个选项时就会发出的事件。
   *
   */
  @Output() readonly optionSelected: EventEmitter<MatAutocompleteSelectedEvent> =
    new EventEmitter<MatAutocompleteSelectedEvent>();

  /**
   * Event that is emitted when the autocomplete panel is opened.
   *
   * 自动完成面板打开时发出的事件。
   *
   */
  @Output() readonly opened: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Event that is emitted when the autocomplete panel is closed.
   *
   * 自动完成面板关闭时发出的事件。
   *
   */
  @Output() readonly closed: EventEmitter<void> = new EventEmitter<void>();

  /**
   * Emits whenever an option is activated.
   *
   * 只要激活某个选项，就会发出触发本事件。
   *
   */
  @Output() readonly optionActivated: EventEmitter<MatAutocompleteActivatedEvent> =
    new EventEmitter<MatAutocompleteActivatedEvent>();

  /**
   * Takes classes set on the host mat-autocomplete element and applies them to the panel
   * inside the overlay container to allow for easy styling.
   *
   * 取得 mat-autocomplete 宿主元素上设置的类，并把它们应用到浮层容器中的面板上，以便指定样式。
   *
   */
  @Input('class')
  set classList(value: string | string[]) {
    if (value && value.length) {
      this._classList = coerceStringArray(value).reduce((classList, className) => {
        classList[className] = true;
        return classList;
      }, {} as {[key: string]: boolean});
    } else {
      this._classList = {};
    }

    this._setVisibilityClasses(this._classList);
    this._setThemeClasses(this._classList);
    this._elementRef.nativeElement.className = '';
  }
  _classList: {[key: string]: boolean} = {};

  /**
   * Unique ID to be used by autocomplete trigger's "aria-owns" property.
   *
   * 供自动完成触发器的 “aria-owns” 属性使用的唯一 ID。
   *
   */
  id: string = `mat-autocomplete-${_uniqueAutocompleteIdCounter++}`;

  /**
   * Tells any descendant `mat-optgroup` to use the inert a11y pattern.
   *
   * 告诉所有后代 `mat-optgroup` 使用惰性 a11y 模式。
   *
   * @docs-private
   */
  readonly inertGroups: boolean;

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _elementRef: ElementRef<HTMLElement>,
    @Inject(MAT_AUTOCOMPLETE_DEFAULT_OPTIONS) defaults: MatAutocompleteDefaultOptions,
    platform?: Platform,
  ) {
    super();

    // TODO(crisbeto): the problem that the `inertGroups` option resolves is only present on
    // Safari using VoiceOver. We should occasionally check back to see whether the bug
    // wasn't resolved in VoiceOver, and if it has, we can remove this and the `inertGroups`
    // option altogether.
    this.inertGroups = platform?.SAFARI || false;
    this._autoActiveFirstOption = !!defaults.autoActiveFirstOption;
    this._autoSelectActiveOption = !!defaults.autoSelectActiveOption;
  }

  ngAfterContentInit() {
    this._keyManager = new ActiveDescendantKeyManager<_MatOptionBase>(this.options).withWrap();
    this._activeOptionChanges = this._keyManager.change.subscribe(index => {
      if (this.isOpen) {
        this.optionActivated.emit({source: this, option: this.options.toArray()[index] || null});
      }
    });

    // Set the initial visibility state.
    this._setVisibility();
  }

  ngOnDestroy() {
    this._keyManager?.destroy();
    this._activeOptionChanges.unsubscribe();
  }

  /**
   * Sets the panel scrollTop. This allows us to manually scroll to display options
   * above or below the fold, as they are not actually being focused when active.
   *
   * 设置此面板的 scrollTop。这样我们就可以通过手动滚动显示出上方或下方的选项，因为它们在激活时实际上没有获得焦点。
   *
   */
  _setScrollTop(scrollTop: number): void {
    if (this.panel) {
      this.panel.nativeElement.scrollTop = scrollTop;
    }
  }

  /**
   * Returns the panel's scrollTop.
   *
   * 返回此面板的 scrollTop。
   *
   */
  _getScrollTop(): number {
    return this.panel ? this.panel.nativeElement.scrollTop : 0;
  }

  /**
   * Panel should hide itself when the option list is empty.
   *
   * 当选项列表为空时，Panel 应自行隐藏。
   *
   */
  _setVisibility() {
    this.showPanel = !!this.options.length;
    this._setVisibilityClasses(this._classList);
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Emits the `select` event.
   *
   * 发出 `select` 事件。
   *
   */
  _emitSelectEvent(option: _MatOptionBase): void {
    const event = new MatAutocompleteSelectedEvent(this, option);
    this.optionSelected.emit(event);
  }

  /**
   * Gets the aria-labelledby for the autocomplete panel.
   *
   * 获取此自动完成面板的 aria-labelledby。
   *
   */
  _getPanelAriaLabelledby(labelId: string | null): string | null {
    if (this.ariaLabel) {
      return null;
    }

    const labelExpression = labelId ? labelId + ' ' : '';
    return this.ariaLabelledby ? labelExpression + this.ariaLabelledby : labelId;
  }

  /**
   * Sets the autocomplete visibility classes on a classlist based on the panel is visible.
   *
   * 基于该面板的是否可见，在类清单中设置此自动完成器的可见性类。
   *
   */
  private _setVisibilityClasses(classList: {[key: string]: boolean}) {
    classList[this._visibleClass] = this.showPanel;
    classList[this._hiddenClass] = !this.showPanel;
  }

  /** Sets the theming classes on a classlist based on the theme of the panel. */
  private _setThemeClasses(classList: {[key: string]: boolean}) {
    classList['mat-primary'] = this._color === 'primary';
    classList['mat-warn'] = this._color === 'warn';
    classList['mat-accent'] = this._color === 'accent';
  }
}

@Component({
  selector: 'mat-autocomplete',
  templateUrl: 'autocomplete.html',
  styleUrls: ['autocomplete.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'matAutocomplete',
  inputs: ['disableRipple'],
  host: {
    'class': 'mat-mdc-autocomplete',
  },
  providers: [{provide: MAT_OPTION_PARENT_COMPONENT, useExisting: MatAutocomplete}],
  animations: [panelAnimation],
})
export class MatAutocomplete extends _MatAutocompleteBase {
  /**
   * Reference to all option groups within the autocomplete.
   *
   * 对自动完成中所有选项组的引用。
   *
   */
  @ContentChildren(MAT_OPTGROUP, {descendants: true}) optionGroups: QueryList<MatOptgroup>;
  /**
   * Reference to all options within the autocomplete.
   *
   * 对自动完成中所有选项的引用。
   *
   */
  @ContentChildren(MatOption, {descendants: true}) options: QueryList<MatOption>;
  protected _visibleClass = 'mat-mdc-autocomplete-visible';
  protected _hiddenClass = 'mat-mdc-autocomplete-hidden';
}
