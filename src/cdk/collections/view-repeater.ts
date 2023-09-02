/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  InjectionToken,
  IterableChangeRecord,
  IterableChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

/**
 * The context for an embedded view in the repeater's view container.
 *
 * 在复制器的视图容器中嵌入视图的上下文。
 *
 * @template T The type for the embedded view's $implicit property.
 *
 * 嵌入式视图的 $implicit 属性的类型。
 *
 */
export interface _ViewRepeaterItemContext<T> {
  $implicit?: T;
}

/**
 * The arguments needed to construct an embedded view for an item in a view
 * container.
 *
 * 为视图容器中的条目构造一个嵌入式视图时所需的参数。
 *
 * @template C The type for the context passed to each embedded view.
 *
 * 要传给每个嵌入式视图的上下文类型。
 *
 */
export interface _ViewRepeaterItemInsertArgs<C> {
  templateRef: TemplateRef<C>;
  context?: C;
  index?: number;
}

/**
 * A factory that derives the embedded view context for an item in a view
 * container.
 *
 * 该工厂用来为视图容器中的一个条目派生出嵌入式视图。
 *
 * @template T The type for the embedded view's $implicit property.
 *
 * 嵌入式视图的 $implicit 属性的类型。
 *
 * @template R The type for the item in each IterableDiffer change record.
 *
 * 每个 IterableDiffer 更改记录中的条目类型。
 *
 * @template C The type for the context passed to each embedded view.
 *
 * 传递给每个嵌入式视图的上下文类型。
 *
 */
export type _ViewRepeaterItemContextFactory<T, R, C extends _ViewRepeaterItemContext<T>> = (
  record: IterableChangeRecord<R>,
  adjustedPreviousIndex: number | null,
  currentIndex: number | null,
) => _ViewRepeaterItemInsertArgs<C>;

/**
 * Extracts the value of an item from an {@link IterableChangeRecord}.
 *
 * 从 {@link IterableChangeRecord} 中提取一个条目的值。
 *
 * @template T The type for the embedded view's $implicit property.
 *
 * 嵌入式视图的 $implicit 属性的类型。
 * @template R The type for the item in each IterableDiffer change record.
 *
 * 每个 IterableDiffer 更改记录中的条目类型。
 */
export type _ViewRepeaterItemValueResolver<T, R> = (record: IterableChangeRecord<R>) => T;

/**
 * Indicates how a view was changed by a {@link \_ViewRepeater}.
 *
 * 表示 {@link \_ViewRepeater} 如何改变视图的方式。
 *
 */
export const enum _ViewRepeaterOperation {
  /**
   * The content of an existing view was replaced with another item.
   *
   * 现有视图的内容已替换成另一个视图。
   *
   */
  REPLACED,
  /**
   * A new view was created with `createEmbeddedView`.
   *
   * 用 `createEmbeddedView` 创建了一个新视图。
   *
   */
  INSERTED,
  /**
   * The position of a view changed, but the content remains the same.
   *
   * 视图的位置发生了变化，但内容保持不变。
   *
   */
  MOVED,
  /**
   * A view was detached from the view container.
   *
   * 视图从视图容器中拆除了。
   *
   */
  REMOVED,
}

/**
 * Meta data describing the state of a view after it was updated by a
 * {@link \_ViewRepeater}.
 *
 * 元数据描述了 {@link \_ViewRepeater} 更新后的视图状态。
 *
 * @template R The type for the item in each IterableDiffer change record.
 *
 * 每个 IterableDiffer 更改记录中的条目类型。
 * @template C The type for the context passed to each embedded view.
 *
 * 传递给每个嵌入式视图的上下文类型。
 */
export interface _ViewRepeaterItemChange<R, C> {
  /**
   * The view's context after it was changed.
   *
   * 修改后的视图上下文。
   *
   */
  context?: C;
  /**
   * Indicates how the view was changed.
   *
   * 指出了视图的更改方式。
   *
   */
  operation: _ViewRepeaterOperation;
  /**
   * The view's corresponding change record.
   *
   * 该视图对应的变更记录。
   *
   */
  record: IterableChangeRecord<R>;
}

/**
 * Type for a callback to be executed after a view has changed.
 *
 * 在视图发生变化后要执行的回调类型。
 *
 * @template R The type for the item in each IterableDiffer change record.
 *
 * 每个 IterableDiffer 更改记录中的条目类型。
 *
 * @template C The type for the context passed to each embedded view.
 *
 * 传递给每个嵌入式视图的上下文类型。
 *
 */
export type _ViewRepeaterItemChanged<R, C> = (change: _ViewRepeaterItemChange<R, C>) => void;

/**
 * Describes a strategy for rendering items in a {@link ViewContainerRef}.
 *
 * 描述了在 {@link ViewContainerRef} 中渲染条目的策略。
 *
 * @template T The type for the embedded view's $implicit property.
 *
 * 嵌入式视图的 $implicit 属性的类型。
 * @template R The type for the item in each IterableDiffer change record.
 *
 * 每个 IterableDiffer 更改记录中的条目类型。
 * @template C The type for the context passed to each embedded view.
 *
 * 传递给每个嵌入式视图的上下文类型。
 */
export interface _ViewRepeater<T, R, C extends _ViewRepeaterItemContext<T>> {
  applyChanges(
    changes: IterableChanges<R>,
    viewContainerRef: ViewContainerRef,
    itemContextFactory: _ViewRepeaterItemContextFactory<T, R, C>,
    itemValueResolver: _ViewRepeaterItemValueResolver<T, R>,
    itemViewChanged?: _ViewRepeaterItemChanged<R, C>,
  ): void;

  detach(): void;
}

/**
 * Injection token for {@link \_ViewRepeater}. This token is for use by Angular Material only.
 *
 * {@link \_ViewRepeater} 的注入令牌。这个令牌只供 Angular Material 使用。
 *
 * @docs-private
 */
export const _VIEW_REPEATER_STRATEGY = new InjectionToken<
  _ViewRepeater<unknown, unknown, _ViewRepeaterItemContext<unknown>>
>('_ViewRepeater');
