import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {ListOverviewExample} from './list-overview/list-overview-example';
import {ListSectionsExample} from './list-sections/list-sections-example';
import {ListSelectionExample} from './list-selection/list-selection-example';
import {ListSingleSelectionExample} from './list-single-selection/list-single-selection-example';
import {ListHarnessExample} from './list-harness/list-harness-example';
import {ListVariantsExample} from './list-variants/list-variants-example';

export {
  ListHarnessExample,
  ListOverviewExample,
  ListSectionsExample,
  ListSelectionExample,
  ListSingleSelectionExample,
  ListVariantsExample,
};

const EXAMPLES = [
  ListHarnessExample,
  ListOverviewExample,
  ListSectionsExample,
  ListSelectionExample,
  ListSingleSelectionExample,
  ListVariantsExample,
];

@NgModule({
  imports: [CommonModule, MatIconModule, MatListModule],
  declarations: EXAMPLES,
  exports: EXAMPLES,
})
export class ListExamplesModule {}
