import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatRippleModule} from '@angular/material/core';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {CdkTableModule} from '@angular/cdk/table';

import {TableFlexBasicExample} from './table-flex-basic/table-flex-basic-example';
import {TableBasicExample} from './table-basic/table-basic-example';
import {TableDynamicColumnsExample} from './table-dynamic-columns/table-dynamic-columns-example';
import {TableExpandableRowsExample} from './table-expandable-rows/table-expandable-rows-example';
import {TableFilteringExample} from './table-filtering/table-filtering-example';
import {TableFooterRowExample} from './table-footer-row/table-footer-row-example';
import {TableHttpExample} from './table-http/table-http-example';
import {TableMultipleHeaderFooterExample} from './table-multiple-header-footer/table-multiple-header-footer-example';
import {TableOverviewExample} from './table-overview/table-overview-example';
import {TablePaginationExample} from './table-pagination/table-pagination-example';
import {TableRowContextExample} from './table-row-context/table-row-context-example';
import {TableSelectionExample} from './table-selection/table-selection-example';
import {TableSortingExample} from './table-sorting/table-sorting-example';
import {TableStickyColumnsExample} from './table-sticky-columns/table-sticky-columns-example';
import {TableStickyComplexFlexExample} from './table-sticky-complex-flex/table-sticky-complex-flex-example';
import {TableStickyComplexExample} from './table-sticky-complex/table-sticky-complex-example';
import {TableStickyFooterExample} from './table-sticky-footer/table-sticky-footer-example';
import {TableStickyHeaderExample} from './table-sticky-header/table-sticky-header-example';
import {TableTextColumnAdvancedExample} from './table-text-column-advanced/table-text-column-advanced-example';
import {TableTextColumnExample} from './table-text-column/table-text-column-example';
import {TableWrappedExample, WrapperTable} from './table-wrapped/table-wrapped-example';
import {TableReorderableExample} from './table-reorderable/table-reorderable-example';
import {TableRecycleRowsExample} from './table-recycle-rows/table-recycle-rows-example';
import {TableHarnessExample} from './table-harness/table-harness-example';
import {TableWithRipplesExample} from './table-with-ripples/table-with-ripples-example';
import {TableColumnStylingExample} from './table-column-styling/table-column-styling-example';
import {TableRowBindingExample} from './table-row-binding/table-row-binding-example';
import {TableDynamicArrayDataExample} from './table-dynamic-array-data/table-dynamic-array-data-example';
import {TableDynamicObservableDataExample} from './table-dynamic-observable-data/table-dynamic-observable-data-example';
import {TableGeneratedColumnsExample} from './table-generated-columns/table-generated-columns-example';

export {
  TableBasicExample,
  TableColumnStylingExample,
  TableDynamicArrayDataExample,
  TableDynamicColumnsExample,
  TableDynamicObservableDataExample,
  TableExpandableRowsExample,
  TableFilteringExample,
  TableFlexBasicExample,
  TableFooterRowExample,
  TableGeneratedColumnsExample,
  TableHarnessExample,
  TableHttpExample,
  TableMultipleHeaderFooterExample,
  TableOverviewExample,
  TablePaginationExample,
  TableRecycleRowsExample,
  TableReorderableExample,
  TableRowBindingExample,
  TableRowContextExample,
  TableSelectionExample,
  TableSortingExample,
  TableStickyColumnsExample,
  TableStickyComplexExample,
  TableStickyComplexFlexExample,
  TableStickyFooterExample,
  TableStickyHeaderExample,
  TableTextColumnAdvancedExample,
  TableTextColumnExample,
  TableWithRipplesExample,
  TableWrappedExample,
  WrapperTable,
};

const EXAMPLES = [
  TableBasicExample,
  TableColumnStylingExample,
  TableDynamicArrayDataExample,
  TableDynamicColumnsExample,
  TableDynamicObservableDataExample,
  TableExpandableRowsExample,
  TableFilteringExample,
  TableFlexBasicExample,
  TableFooterRowExample,
  TableGeneratedColumnsExample,
  TableHarnessExample,
  TableHttpExample,
  TableMultipleHeaderFooterExample,
  TableOverviewExample,
  TablePaginationExample,
  TableRecycleRowsExample,
  TableReorderableExample,
  TableRowBindingExample,
  TableRowContextExample,
  TableSelectionExample,
  TableSortingExample,
  TableStickyColumnsExample,
  TableStickyComplexExample,
  TableStickyComplexFlexExample,
  TableStickyFooterExample,
  TableStickyHeaderExample,
  TableTextColumnAdvancedExample,
  TableTextColumnExample,
  TableWithRipplesExample,
  TableWrappedExample,
  WrapperTable,
];

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatSortModule,
    MatTableModule,
    CdkTableModule,
    DragDropModule,
  ],
  declarations: EXAMPLES,
  exports: EXAMPLES,
})
export class TableExamplesModule {}
