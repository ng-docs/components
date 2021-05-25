/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {FlatTreeControl, TreeControl} from '@angular/cdk/tree';
import {BehaviorSubject, merge, Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';

/**
 * Tree flattener to convert a normal type of node to node with children & level information.
 * Transform nested nodes of type `T` to flattened nodes of type `F`.
 *
 * 树展平器，用于将普通类型的节点转换为具有子级和级别信息的节点。把 `T` 型嵌套节点转换为 `F` 型扁平节点。
 *
 * For example, the input data of type `T` is nested, and contains its children data:
 *
 * 例如，类型为 `T` 的输入数据是嵌套的，并包含其子数据：
 *
 *   SomeNode: {
 *     key: 'Fruits',
 *     children: [
 *       NodeOne: {
 *         key: 'Apple',
 *       },
 *       NodeTwo: {
 *        key: 'Pear',
 *      }
 *    ]
 *  }
 *
 *  After flattener flatten the tree, the structure will become
 *
 * 当展平之后，其结构变为：
 *
 *  SomeNode: {
 *    key: 'Fruits',
 *    expandable: true,
 *    level: 1
 *  },
 *  NodeOne: {
 *    key: 'Apple',
 *    expandable: false,
 *    level: 2
 *  },
 *  NodeTwo: {
 *   key: 'Pear',
 *   expandable: false,
 *   level: 2
 * }
 *
 * and the output flattened type is `F` with additional information.
 *
 *
 */
export class MatTreeFlattener<T, F, K = F> {

  constructor(public transformFunction: (node: T, level: number) => F,
              public getLevel: (node: F) => number,
              public isExpandable: (node: F) => boolean,
              public getChildren: (node: T) =>
                  Observable<T[]> | T[] | undefined | null) {}

  _flattenNode(node: T, level: number,
               resultNodes: F[], parentMap: boolean[]): F[] {
    const flatNode = this.transformFunction(node, level);
    resultNodes.push(flatNode);

    if (this.isExpandable(flatNode)) {
      const childrenNodes = this.getChildren(node);
      if (childrenNodes) {
        if (Array.isArray(childrenNodes)) {
          this._flattenChildren(childrenNodes, level, resultNodes, parentMap);
        } else {
          childrenNodes.pipe(take(1)).subscribe(children => {
            this._flattenChildren(children, level, resultNodes, parentMap);
          });
        }
      }
    }
    return resultNodes;
  }

  _flattenChildren(children: T[], level: number,
                   resultNodes: F[], parentMap: boolean[]): void {
    children.forEach((child, index) => {
      let childParentMap: boolean[] = parentMap.slice();
      childParentMap.push(index != children.length - 1);
      this._flattenNode(child, level + 1, resultNodes, childParentMap);
    });
  }

  /**
   * Flatten a list of node type T to flattened version of node F.
   * Please note that type T may be nested, and the length of `structuredData` may be different
   * from that of returned list `F[]`.
   *
   * 将节点类型为 T 的列表展平为节点类型为 F 的展平版本。请注意，类型 T 可能是嵌套的，而 `structuredData` 的长度可能与返回列表 `F[]` 的长度不同。
   *
   */
  flattenNodes(structuredData: T[]): F[] {
    let resultNodes: F[] = [];
    structuredData.forEach(node => this._flattenNode(node, 0, resultNodes, []));
    return resultNodes;
  }

  /**
   * Expand flattened node with current expansion status.
   * The returned list may have different length.
   *
   * 根据当前展开状态展开已展平的节点。返回的列表长度可能不同。
   *
   */
  expandFlattenedNodes(nodes: F[], treeControl: TreeControl<F, K>): F[] {
    let results: F[] = [];
    let currentExpand: boolean[] = [];
    currentExpand[0] = true;

    nodes.forEach(node => {
      let expand = true;
      for (let i = 0; i <= this.getLevel(node); i++) {
        expand = expand && currentExpand[i];
      }
      if (expand) {
        results.push(node);
      }
      if (this.isExpandable(node)) {
        currentExpand[this.getLevel(node) + 1] = treeControl.isExpanded(node);
      }
    });
    return results;
  }
}

/**
 * Data source for flat tree.
 * The data source need to handle expansion/collapsion of the tree node and change the data feed
 * to `MatTree`.
 * The nested tree nodes of type `T` are flattened through `MatTreeFlattener`, and converted
 * to type `F` for `MatTree` to consume.
 *
 * 扁平树的数据源。数据源需要处理树节点的展开/折叠，并将数据提更改为 `MatTree`。`T` 型的嵌套树节点由 `MatTreeFlattener` 展平，并转换为 `F` 型，供 `MatTree` 使用。
 *
 */
export class MatTreeFlatDataSource<T, F, K = F> extends DataSource<F> {
  private readonly _flattenedData = new BehaviorSubject<F[]>([]);
  private readonly _expandedData = new BehaviorSubject<F[]>([]);

  get data() { return this._data.value; }
  set data(value: T[]) {
    this._data.next(value);
    this._flattenedData.next(this._treeFlattener.flattenNodes(this.data));
    this._treeControl.dataNodes = this._flattenedData.value;
  }
  private readonly _data = new BehaviorSubject<T[]>([]);

  constructor(private _treeControl: FlatTreeControl<F, K>,
              private _treeFlattener: MatTreeFlattener<T, F, K>,
              initialData?: T[]) {
    super();

    if (initialData) {
      // Assign the data through the constructor to ensure that all of the logic is executed.
      this.data = initialData;
    }
  }

  connect(collectionViewer: CollectionViewer): Observable<F[]> {
    return merge(
      collectionViewer.viewChange,
      this._treeControl.expansionModel.changed,
      this._flattenedData
    ).pipe(map(() => {
      this._expandedData.next(
        this._treeFlattener.expandFlattenedNodes(this._flattenedData.value, this._treeControl));
      return this._expandedData.value;
    }));
  }

  disconnect() {
    // no op
  }
}
