/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';

interface Transaction {
  item: string;
  cost: number;
}

/**
 * @title Table with multiple header and footer rows
 */
@Component({
  selector: 'legacy-table-multiple-header-footer-example',
  styleUrls: ['legacy-table-multiple-header-footer-example.css'],
  templateUrl: 'legacy-table-multiple-header-footer-example.html',
})
export class LegacyTableMultipleHeaderFooterExample {
  displayedColumns: string[] = ['item', 'cost'];
  transactions: Transaction[] = [
    {item: 'Beach ball', cost: 4},
    {item: 'Towel', cost: 5},
    {item: 'Frisbee', cost: 2},
    {item: 'Sunscreen', cost: 4},
    {item: 'Cooler', cost: 25},
    {item: 'Swim suit', cost: 15},
  ];

  /**
   * Gets the total cost of all transactions.
   *
   * 获取所有交易的总成本。
   *
   */
  getTotalCost() {
    return this.transactions.map(t => t.cost).reduce((acc, value) => acc + value, 0);
  }
}
