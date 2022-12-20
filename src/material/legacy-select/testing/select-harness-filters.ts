/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BaseHarnessFilters} from '@angular/cdk/testing';

/**
 * A set of criteria that can be used to filter a list of `MatSelectHarness` instances.
 *
 * 一组可用于过滤 `MatSelectHarness` 实例列表的条件。
 *
 * @deprecated
 *
 * Use `SelectHarnessFilters` from `@angular/material/select/testing` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 *
 * @breaking-change 17.0.0
 */
export interface LegacySelectHarnessFilters extends BaseHarnessFilters {}
