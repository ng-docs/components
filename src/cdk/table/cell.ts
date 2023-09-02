/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  ContentChild,
  Directive,
  ElementRef,
  Inject,
  Input,
  Optional,
  TemplateRef,
} from '@angular/core';
import {CanStick, CanStickCtor, mixinHasStickyInput} from './can-stick';
import {CDK_TABLE} from './tokens';

/**
 * Base interface for a cell definition. Captures a column's cell template definition.
 *
 * 用于单元格定义的基本接口。存放列的单元格模板定义。
 *
 */
export interface CellDef {
  template: TemplateRef<any>;
}

/**
 * Cell definition for a CDK table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 *
 * CDK 表格的单元格定义。存放列的数据行单元格的模板以及单元格的专有属性。
 *
 */
@Directive({selector: '[cdkCellDef]'})
export class CdkCellDef implements CellDef {
  constructor(/** @docs-private */ public template: TemplateRef<any>) {}
}

/**
 * Header cell definition for a CDK table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 *
 * CDK 表格的表头单元格定义。存放列的表头单元格的模板以及单元格的专有属性。
 *
 */
@Directive({selector: '[cdkHeaderCellDef]'})
export class CdkHeaderCellDef implements CellDef {
  constructor(/** @docs-private */ public template: TemplateRef<any>) {}
}

/**
 * Footer cell definition for a CDK table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 *
 * CDK 表格的表尾单元格定义。存放列的表尾单元格的模板以及单元格的专有属性。
 *
 */
@Directive({selector: '[cdkFooterCellDef]'})
export class CdkFooterCellDef implements CellDef {
  constructor(/** @docs-private */ public template: TemplateRef<any>) {}
}

// Boilerplate for applying mixins to CdkColumnDef.
/** @docs-private */
class CdkColumnDefBase {}
const _CdkColumnDefBase: CanStickCtor & typeof CdkColumnDefBase =
  mixinHasStickyInput(CdkColumnDefBase);

/**
 * Column definition for the CDK table.
 * Defines a set of cells available for a table column.
 *
 * CDK 表格的列定义。定义一组可用于表列的单元格。
 *
 */
@Directive({
  selector: '[cdkColumnDef]',
  inputs: ['sticky'],
  providers: [{provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: CdkColumnDef}],
})
export class CdkColumnDef extends _CdkColumnDefBase implements CanStick {
  /**
   * Unique name for this column.
   *
   * 这个列的唯一名称。
   *
   */
  @Input('cdkColumnDef')
  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._setNameInput(name);
  }
  protected _name: string;

  /**
   * Whether this column should be sticky positioned on the end of the row. Should make sure
   * that it mimics the `CanStick` mixin such that `_hasStickyChanged` is set to true if the value
   * has been changed.
   *
   * 此列是否应粘性在该行的末尾。应该确保它模仿了混入接口 `CanStick`，当该值更改后必须把 `_hasStickyChanged` 设为 true。
   *
   */
  @Input('stickyEnd')
  get stickyEnd(): boolean {
    return this._stickyEnd;
  }
  set stickyEnd(v: BooleanInput) {
    const prevValue = this._stickyEnd;
    this._stickyEnd = coerceBooleanProperty(v);
    this._hasStickyChanged = prevValue !== this._stickyEnd;
  }
  _stickyEnd: boolean = false;

  /** @docs-private */
  @ContentChild(CdkCellDef) cell: CdkCellDef;

  /** @docs-private */
  @ContentChild(CdkHeaderCellDef) headerCell: CdkHeaderCellDef;

  /** @docs-private */
  @ContentChild(CdkFooterCellDef) footerCell: CdkFooterCellDef;

  /**
   * Transformed version of the column name that can be used as part of a CSS classname. Excludes
   * all non-alphanumeric characters and the special characters '-' and '\_'. Any characters that
   * do not match are replaced by the '-' character.
   *
   * 列名的转换后版本，可以作为 CSS 类名的一部分。只允许字母、数字和两个特殊字符 “-” 和 “\_”。除此之外的字符都会替换为 “-”。
   *
   */
  cssClassFriendlyName: string;

  /**
   * Class name for cells in this column.
   *
   * 该列中单元格的类名。
   *
   * @docs-private
   */
  _columnCssClassName: string[];

  constructor(@Inject(CDK_TABLE) @Optional() public _table?: any) {
    super();
  }

  /**
   * Overridable method that sets the css classes that will be added to every cell in this
   * column.
   * In the future, columnCssClassName will change from type string\[\] to string and this
   * will set a single string value.
   *
   * 可改写的方法，它设置要添加到此列的每个单元格的 css 类。将来，columnCssClassName 会从 string\[\] 类型变为 string 类型，这样就可以设置一个字符串值。
   *
   * @docs-private
   */
  protected _updateColumnCssClassName() {
    this._columnCssClassName = [`cdk-column-${this.cssClassFriendlyName}`];
  }

  /**
   * This has been extracted to a util because of TS 4 and VE.
   * View Engine doesn't support property rename inheritance.
   * TS 4.0 doesn't allow properties to override accessors or vice-versa.
   *
   * 由于 TS 4 和 VE 的原因，它已被提取成了一个工具函数。View Engine 不支持继承时进行属性重命名。TS 4.0 不允许改写属性访问器，反之亦然。
   *
   * @docs-private
   */
  protected _setNameInput(value: string) {
    // If the directive is set without a name (updated programmatically), then this setter will
    // trigger with an empty string and should not overwrite the programmatically set value.
    if (value) {
      this._name = value;
      this.cssClassFriendlyName = value.replace(/[^a-z0-9_-]/gi, '-');
      this._updateColumnCssClassName();
    }
  }
}

/**
 * Base class for the cells. Adds a CSS classname that identifies the column it renders in.
 *
 * 单元格的基类。添加一个 CSS 类名来标识它所渲染的列。
 *
 */
export class BaseCdkCell {
  constructor(columnDef: CdkColumnDef, elementRef: ElementRef) {
    elementRef.nativeElement.classList.add(...columnDef._columnCssClassName);
  }
}

/**
 * Header cell template container that adds the right classes and role.
 *
 * 用于添加正确的类和角色的表头单元格模板容器。
 *
 */
@Directive({
  selector: 'cdk-header-cell, th[cdk-header-cell]',
  host: {
    'class': 'cdk-header-cell',
    'role': 'columnheader',
  },
})
export class CdkHeaderCell extends BaseCdkCell {
  constructor(columnDef: CdkColumnDef, elementRef: ElementRef) {
    super(columnDef, elementRef);
  }
}

/**
 * Footer cell template container that adds the right classes and role.
 *
 * 用于添加正确的类和角色的表尾单元格模板容器。
 *
 */
@Directive({
  selector: 'cdk-footer-cell, td[cdk-footer-cell]',
  host: {
    'class': 'cdk-footer-cell',
  },
})
export class CdkFooterCell extends BaseCdkCell {
  constructor(columnDef: CdkColumnDef, elementRef: ElementRef) {
    super(columnDef, elementRef);
    if (columnDef._table?._elementRef.nativeElement.nodeType === 1) {
      const tableRole = columnDef._table._elementRef.nativeElement.getAttribute('role');
      const role = tableRole === 'grid' || tableRole === 'treegrid' ? 'gridcell' : 'cell';
      elementRef.nativeElement.setAttribute('role', role);
    }
  }
}

/**
 * Cell template container that adds the right classes and role.
 *
 * 用于添加正确的类和角色的单元格模板容器。
 *
 */
@Directive({
  selector: 'cdk-cell, td[cdk-cell]',
  host: {
    'class': 'cdk-cell',
  },
})
export class CdkCell extends BaseCdkCell {
  constructor(columnDef: CdkColumnDef, elementRef: ElementRef) {
    super(columnDef, elementRef);
    if (columnDef._table?._elementRef.nativeElement.nodeType === 1) {
      const tableRole = columnDef._table._elementRef.nativeElement.getAttribute('role');
      const role = tableRole === 'grid' || tableRole === 'treegrid' ? 'gridcell' : 'cell';
      elementRef.nativeElement.setAttribute('role', role);
    }
  }
}
