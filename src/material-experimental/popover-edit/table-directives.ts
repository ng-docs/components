/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {Directive} from '@angular/core';
import {
  _CELL_SELECTOR,
  _closest,
  CdkPopoverEdit,
  CdkPopoverEditTabOut,
  CdkRowHoverContent,
  CdkEditOpen,
} from '@angular/cdk-experimental/popover-edit';

const POPOVER_EDIT_HOST_BINDINGS = {
  '[attr.tabindex]': 'disabled ? null : 0',
  'class': 'mat-popover-edit-cell',
  '[attr.aria-haspopup]': '!disabled',
};

const POPOVER_EDIT_INPUTS = [
  'template: matPopoverEdit',
  'context: matPopoverEditContext',
  'colspan: matPopoverEditColspan',
  'disabled: matPopoverEditDisabled',
];

const EDIT_PANE_CLASS = 'mat-edit-pane';

const MAT_ROW_HOVER_CLASS = 'mat-row-hover-content';
const MAT_ROW_HOVER_RTL_CLASS = MAT_ROW_HOVER_CLASS + '-rtl';
const MAT_ROW_HOVER_ANIMATE_CLASS = MAT_ROW_HOVER_CLASS + '-visible';
const MAT_ROW_HOVER_CELL_CLASS = MAT_ROW_HOVER_CLASS + '-host-cell';

/**
 * Attaches an ng-template to a cell and shows it when instructed to by the
 * EditEventDispatcher service.
 * Makes the cell focusable.
 *
 * 将 ng-template 附着到单元格，并在 EditEventDispatcher 服务指示时显示它。使单元格可获得焦点。
 *
 */
@Directive({
  selector: '[matPopoverEdit]:not([matPopoverEditTabOut])',
  host: POPOVER_EDIT_HOST_BINDINGS,
  inputs: POPOVER_EDIT_INPUTS,
})
export class MatPopoverEdit<C> extends CdkPopoverEdit<C> {
  protected override panelClass(): string {
    return EDIT_PANE_CLASS;
  }
}

/**
 * Attaches an ng-template to a cell and shows it when instructed to by the
 * EditEventDispatcher service.
 * Makes the cell focusable.
 *
 * 将 ng-template 附着到单元格，并在 EditEventDispatcher 服务指示时显示它。使单元格可获得焦点。
 *
 */
@Directive({
  selector: '[matPopoverEdit][matPopoverEditTabOut]',
  host: POPOVER_EDIT_HOST_BINDINGS,
  inputs: POPOVER_EDIT_INPUTS,
})
export class MatPopoverEditTabOut<C> extends CdkPopoverEditTabOut<C> {
  protected override panelClass(): string {
    return EDIT_PANE_CLASS;
  }
}

/**
 * A structural directive that shows its contents when the table row containing
 * it is hovered or when an element in the row has focus.
 *
 * 一个结构指令，当包含它的表行或当行中的元素被悬停或具有焦点时，用于显示其内容。
 *
 */
@Directive({
  selector: '[matRowHoverContent]',
})
export class MatRowHoverContent extends CdkRowHoverContent {
  protected override initElement(element: HTMLElement) {
    super.initElement(element);
    element.classList.add(MAT_ROW_HOVER_CLASS);
  }

  protected override makeElementHiddenButFocusable(element: HTMLElement): void {
    element.classList.remove(MAT_ROW_HOVER_ANIMATE_CLASS);
  }

  protected override makeElementVisible(element: HTMLElement): void {
    _closest(this.elementRef.nativeElement!, _CELL_SELECTOR)!.classList.add(
      MAT_ROW_HOVER_CELL_CLASS,
    );

    if (this.services.directionality.value === 'rtl') {
      element.classList.add(MAT_ROW_HOVER_RTL_CLASS);
    } else {
      element.classList.remove(MAT_ROW_HOVER_RTL_CLASS);
    }

    element.classList.remove(MAT_ROW_HOVER_ANIMATE_CLASS);
    this.services.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        element.classList.add(MAT_ROW_HOVER_ANIMATE_CLASS);
      });
    });
  }
}

/**
 * Opens the closest edit popover to this element, whether it's associated with this exact
 * element or an ancestor element.
 *
 * 打开离此元素最近的编辑弹出窗口，无论它是与此元素相关联还是与其祖先元素相关联。
 *
 */
@Directive({
  selector: '[matEditOpen]',
})
export class MatEditOpen extends CdkEditOpen {}
