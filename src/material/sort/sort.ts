/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  Directive,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {CanDisable, HasInitialized, mixinDisabled, mixinInitialized} from '@angular/material/core';
import {Subject} from 'rxjs';
import {SortDirection} from './sort-direction';
import {
  getSortDuplicateSortableIdError,
  getSortHeaderMissingIdError,
  getSortInvalidDirectionError,
} from './sort-errors';

/**
 * Position of the arrow that displays when sorted.
 *
 * 排序时显示的箭头的位置。
 *
 */
export type SortHeaderArrowPosition = 'before' | 'after';

/**
 * Interface for a directive that holds sorting state consumed by `MatSortHeader`.
 *
 * 指令的接口，用于保存供 `MatSortHeader` 使用的排序状态。
 *
 */
export interface MatSortable {
  /**
   * The id of the column being sorted.
   *
   * 要被排序的列的 id。
   *
   */
  id: string;

  /**
   * Starting sort direction.
   *
   * 开始排序的方向。
   *
   */
  start: SortDirection;

  /**
   * Whether to disable clearing the sorting state.
   *
   * 是否禁止清除排序状态。
   *
   */
  disableClear: boolean;
}

/**
 * The current sort state.
 *
 * 当前的排序状态。
 *
 */
export interface Sort {
  /**
   * The id of the column being sorted.
   *
   * 要被排序的列的 id。
   *
   */
  active: string;

  /**
   * The sort direction.
   *
   * 排序的方向。
   *
   */
  direction: SortDirection;
}

/**
 * Default options for `mat-sort`.
 *
 * `mat-sort` 的默认选项。
 *
 */
export interface MatSortDefaultOptions {
  /**
   * Whether to disable clearing the sorting state.
   *
   * 是否禁止清除排序状态。
   *
   */
  disableClear?: boolean;
  /**
   * Position of the arrow that displays when sorted.
   *
   * 排序时显示的箭头的位置。
   *
   */
  arrowPosition?: SortHeaderArrowPosition;
}

/**
 * Injection token to be used to override the default options for `mat-sort`.
 *
 * `mat-sort` 的默认选项的注入令牌。
 *
 */
export const MAT_SORT_DEFAULT_OPTIONS = new InjectionToken<MatSortDefaultOptions>(
  'MAT_SORT_DEFAULT_OPTIONS',
);

// Boilerplate for applying mixins to MatSort.
/** @docs-private */
const _MatSortBase = mixinInitialized(mixinDisabled(class {}));

/**
 * Container for MatSortables to manage the sort state and provide default sort parameters.
 *
 * MatSortable 的容器，可以管理排序状态并提供默认的排序参数。
 *
 */
@Directive({
  selector: '[matSort]',
  exportAs: 'matSort',
  host: {
    'class': 'mat-sort',
  },
  inputs: ['disabled: matSortDisabled'],
})
export class MatSort
  extends _MatSortBase
  implements CanDisable, HasInitialized, OnChanges, OnDestroy, OnInit
{
  /**
   * Collection of all registered sortables that this directive manages.
   *
   * 本指令管理的所有已注册可排序对象的集合。
   *
   */
  sortables = new Map<string, MatSortable>();

  /**
   * Used to notify any child components listening to state changes.
   *
   * 用来通知那些监听状态变化的子组件。
   *
   */
  readonly _stateChanges = new Subject<void>();

  /**
   * The id of the most recently sorted MatSortable.
   *
   * 最近排序过的 MatSortable 的 id。
   *
   */
  @Input('matSortActive') active: string;

  /**
   * The direction to set when an MatSortable is initially sorted.
   * May be overridden by the MatSortable's sort start.
   *
   * 最初对 MatSortable 进行排序时要设置的方向。可以通过 MatSortable 的输入属性 start 来改写它。
   *
   */
  @Input('matSortStart') start: SortDirection = 'asc';

  /**
   * The sort direction of the currently active MatSortable.
   *
   * 当前活动的 MatSortable 的排序方向。
   *
   */
  @Input('matSortDirection')
  get direction(): SortDirection {
    return this._direction;
  }
  set direction(direction: SortDirection) {
    if (
      direction &&
      direction !== 'asc' &&
      direction !== 'desc' &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw getSortInvalidDirectionError(direction);
    }
    this._direction = direction;
  }
  private _direction: SortDirection = '';

  /**
   * Whether to disable the user from clearing the sort by finishing the sort direction cycle.
   * May be overridden by the MatSortable's disable clear input.
   *
   * 是否通过完成排序方向的循环来禁止用户清除排序。可以通过 MatSortable 的输入属性 disableClear 来改写它。
   *
   */
  @Input('matSortDisableClear')
  get disableClear(): boolean {
    return this._disableClear;
  }
  set disableClear(v: BooleanInput) {
    this._disableClear = coerceBooleanProperty(v);
  }
  private _disableClear: boolean;

  /**
   * Event emitted when the user changes either the active sort or sort direction.
   *
   * 当用户改变活动的排序或排序方向时发出的事件。
   *
   */
  @Output('matSortChange') readonly sortChange: EventEmitter<Sort> = new EventEmitter<Sort>();

  constructor(
    @Optional()
    @Inject(MAT_SORT_DEFAULT_OPTIONS)
    private _defaultOptions?: MatSortDefaultOptions,
  ) {
    super();
  }

  /**
   * Register function to be used by the contained MatSortables. Adds the MatSortable to the
   * collection of MatSortables.
   *
   * 注册 MatSortable 的函数。这会把此 MatSortable 添加到 MatSortable 的集合中的。
   *
   */
  register(sortable: MatSortable): void {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!sortable.id) {
        throw getSortHeaderMissingIdError();
      }

      if (this.sortables.has(sortable.id)) {
        throw getSortDuplicateSortableIdError(sortable.id);
      }
    }

    this.sortables.set(sortable.id, sortable);
  }

  /**
   * Unregister function to be used by the contained MatSortables. Removes the MatSortable from the
   * collection of contained MatSortables.
   *
   * 取消注册 MatSortable 的函数。这会从 MatSortable 集合中删除此 MatSortable。
   *
   */
  deregister(sortable: MatSortable): void {
    this.sortables.delete(sortable.id);
  }

  /**
   * Sets the active sort id and determines the new sort direction.
   *
   * 设置当前排序的 id，并确定新的排序方向。
   *
   */
  sort(sortable: MatSortable): void {
    if (this.active != sortable.id) {
      this.active = sortable.id;
      this.direction = sortable.start ? sortable.start : this.start;
    } else {
      this.direction = this.getNextSortDirection(sortable);
    }

    this.sortChange.emit({active: this.active, direction: this.direction});
  }

  /**
   * Returns the next sort direction of the active sortable, checking for potential overrides.
   *
   * 返回活动可排序对象的下一个排序方向，检查潜在的改写。
   *
   */
  getNextSortDirection(sortable: MatSortable): SortDirection {
    if (!sortable) {
      return '';
    }

    // Get the sort direction cycle with the potential sortable overrides.
    const disableClear =
      sortable?.disableClear ?? this.disableClear ?? !!this._defaultOptions?.disableClear;
    let sortDirectionCycle = getSortDirectionCycle(sortable.start || this.start, disableClear);

    // Get and return the next direction in the cycle
    let nextDirectionIndex = sortDirectionCycle.indexOf(this.direction) + 1;
    if (nextDirectionIndex >= sortDirectionCycle.length) {
      nextDirectionIndex = 0;
    }
    return sortDirectionCycle[nextDirectionIndex];
  }

  ngOnInit() {
    this._markInitialized();
  }

  ngOnChanges() {
    this._stateChanges.next();
  }

  ngOnDestroy() {
    this._stateChanges.complete();
  }
}

/**
 * Returns the sort direction cycle to use given the provided parameters of order and clear.
 *
 * 指定所提供的 start 和 disableClear 参数，返回要使用的排序方向循环。
 *
 */
function getSortDirectionCycle(start: SortDirection, disableClear: boolean): SortDirection[] {
  let sortOrder: SortDirection[] = ['asc', 'desc'];
  if (start == 'desc') {
    sortOrder.reverse();
  }
  if (!disableClear) {
    sortOrder.push('');
  }

  return sortOrder;
}
