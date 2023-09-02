/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {FocusableOption} from '@angular/cdk/a11y';
import {CollectionViewer, DataSource, isDataSource} from '@angular/cdk/collections';
import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  Input,
  IterableChangeRecord,
  IterableDiffer,
  IterableDiffers,
  OnDestroy,
  OnInit,
  QueryList,
  TrackByFunction,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  BehaviorSubject,
  isObservable,
  Observable,
  of as observableOf,
  Subject,
  Subscription,
} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {TreeControl} from './control/tree-control';
import {CdkTreeNodeDef, CdkTreeNodeOutletContext} from './node';
import {CdkTreeNodeOutlet} from './outlet';
import {
  getTreeControlFunctionsMissingError,
  getTreeControlMissingError,
  getTreeMissingMatchingNodeDefError,
  getTreeMultipleDefaultNodeDefsError,
  getTreeNoValidDataSourceError,
} from './tree-errors';
import {coerceNumberProperty} from '@angular/cdk/coercion';

/**
 * CDK tree component that connects with a data source to retrieve data of type `T` and renders
 * dataNodes with hierarchy. Updates the dataNodes when new data is provided by the data source.
 *
 * CDK 树组件，用于连接数据源，检索 `T` 类型的数据，并使用分层结构渲染数据节点。当数据源提供新数据时，会更新数据节点。
 *
 */
@Component({
  selector: 'cdk-tree',
  exportAs: 'cdkTree',
  template: `<ng-container cdkTreeNodeOutlet></ng-container>`,
  host: {
    'class': 'cdk-tree',
    'role': 'tree',
  },
  encapsulation: ViewEncapsulation.None,

  // The "OnPush" status for the `CdkTree` component is effectively a noop, so we are removing it.
  // The view for `CdkTree` consists entirely of templates declared in other views. As they are
  // declared elsewhere, they are checked when their declaration points are checked.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CdkTree<T, K = T> implements AfterContentChecked, CollectionViewer, OnDestroy, OnInit {
  /**
   * Subject that emits when the component has been destroyed.
   *
   * 组件被销毁后发出的主体对象。
   *
   */
  private readonly _onDestroy = new Subject<void>();

  /**
   * Differ used to find the changes in the data provided by the data source.
   *
   * 差分器，用于查找数据源所提供的数据的变化。
   *
   */
  private _dataDiffer: IterableDiffer<T>;

  /**
   * Stores the node definition that does not have a when predicate.
   *
   * 存储那些没有 when 谓词的节点定义。
   *
   */
  private _defaultNodeDef: CdkTreeNodeDef<T> | null;

  /**
   * Data subscription
   *
   * 数据订阅
   *
   */
  private _dataSubscription: Subscription | null;

  /**
   * Level of nodes
   *
   * 节点的层级
   *
   */
  private _levels: Map<T, number> = new Map<T, number>();

  /**
   * Provides a stream containing the latest data array to render. Influenced by the tree's
   * stream of view window \(what dataNodes are currently on screen\).
   * Data source can be an observable of data array, or a data array to render.
   *
   * 提供一个包含要渲染的最新数据数组的流。受树的视图流窗口影响（即当前屏幕上有哪些数据节点）。数据源可以是数据数组的可观察对象，也可以是要渲染的数据数组。
   *
   */
  @Input()
  get dataSource(): DataSource<T> | Observable<T[]> | T[] {
    return this._dataSource;
  }
  set dataSource(dataSource: DataSource<T> | Observable<T[]> | T[]) {
    if (this._dataSource !== dataSource) {
      this._switchDataSource(dataSource);
    }
  }
  private _dataSource: DataSource<T> | Observable<T[]> | T[];

  /**
   * The tree controller
   *
   * 树控制器
   *
   */
  @Input() treeControl: TreeControl<T, K>;

  /**
   * Tracking function that will be used to check the differences in data changes. Used similarly
   * to `ngFor` `trackBy` function. Optimize node operations by identifying a node based on its data
   * relative to the function to know if a node should be added/removed/moved.
   * Accepts a function that takes two parameters, `index` and `item`.
   *
   * 跟踪函数，用于检查数据变化的差异。类似于 `ngFor` 的 `trackBy` 函数。
   * 可以优化节点操作，方法是根据该函数处理后的数据来标识一个节点，以了解该节点是否应添加/删除/移动。接受带两个参数 `index` 和 `item` 的函数。
   *
   */
  @Input() trackBy: TrackByFunction<T>;

  // Outlets within the tree's template where the dataNodes will be inserted.
  @ViewChild(CdkTreeNodeOutlet, {static: true}) _nodeOutlet: CdkTreeNodeOutlet;

  /**
   * The tree node template for the tree
   *
   * 树的节点模板
   *
   */
  @ContentChildren(CdkTreeNodeDef, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  _nodeDefs: QueryList<CdkTreeNodeDef<T>>;

  // TODO(tinayuangao): Setup a listener for scrolling, emit the calculated view to viewChange.
  //     Remove the MAX_VALUE in viewChange
  /**
   * Stream containing the latest information on what rows are being displayed on screen.
   * Can be used by the data source to as a heuristic of what data should be provided.
   *
   * 这个流包含哪些节点正显示在屏幕上的最新信息。可以被数据源用作该提供哪些数据的线索。
   *
   */
  readonly viewChange = new BehaviorSubject<{start: number; end: number}>({
    start: 0,
    end: Number.MAX_VALUE,
  });

  constructor(private _differs: IterableDiffers, private _changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this._dataDiffer = this._differs.find([]).create(this.trackBy);
    if (!this.treeControl && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTreeControlMissingError();
    }
  }

  ngOnDestroy() {
    this._nodeOutlet.viewContainer.clear();

    this.viewChange.complete();
    this._onDestroy.next();
    this._onDestroy.complete();

    if (this._dataSource && typeof (this._dataSource as DataSource<T>).disconnect === 'function') {
      (this.dataSource as DataSource<T>).disconnect(this);
    }

    if (this._dataSubscription) {
      this._dataSubscription.unsubscribe();
      this._dataSubscription = null;
    }
  }

  ngAfterContentChecked() {
    const defaultNodeDefs = this._nodeDefs.filter(def => !def.when);
    if (defaultNodeDefs.length > 1 && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTreeMultipleDefaultNodeDefsError();
    }
    this._defaultNodeDef = defaultNodeDefs[0];

    if (this.dataSource && this._nodeDefs && !this._dataSubscription) {
      this._observeRenderChanges();
    }
  }

  // TODO(tinayuangao): Work on keyboard traversal and actions, make sure it's working for RTL
  //     and nested trees.

  /**
   * Switch to the provided data source by resetting the data and unsubscribing from the current
   * render change subscription if one exists. If the data source is null, interpret this by
   * clearing the node outlet. Otherwise start listening for new data.
   *
   * 通过重置数据来切换到所提供的数据源，并取消订阅当前的渲染变更流（如果有）。如果该数据源为 null，就理解为清除该节点的出口地标。否则就开始监听新数据。
   *
   */
  private _switchDataSource(dataSource: DataSource<T> | Observable<T[]> | T[]) {
    if (this._dataSource && typeof (this._dataSource as DataSource<T>).disconnect === 'function') {
      (this.dataSource as DataSource<T>).disconnect(this);
    }

    if (this._dataSubscription) {
      this._dataSubscription.unsubscribe();
      this._dataSubscription = null;
    }

    // Remove the all dataNodes if there is now no data source
    if (!dataSource) {
      this._nodeOutlet.viewContainer.clear();
    }

    this._dataSource = dataSource;
    if (this._nodeDefs) {
      this._observeRenderChanges();
    }
  }

  /**
   * Set up a subscription for the data provided by the data source.
   *
   * 为数据源提供的数据设置订阅。
   *
   */
  private _observeRenderChanges() {
    let dataStream: Observable<readonly T[]> | undefined;

    if (isDataSource(this._dataSource)) {
      dataStream = this._dataSource.connect(this);
    } else if (isObservable(this._dataSource)) {
      dataStream = this._dataSource;
    } else if (Array.isArray(this._dataSource)) {
      dataStream = observableOf(this._dataSource);
    }

    if (dataStream) {
      this._dataSubscription = dataStream
        .pipe(takeUntil(this._onDestroy))
        .subscribe(data => this.renderNodeChanges(data));
    } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw getTreeNoValidDataSourceError();
    }
  }

  /**
   * Check for changes made in the data and render each change \(node added/removed/moved\).
   *
   * 检查数据所做的更改，并渲染每个更改（添加/删除/移动节点）。
   *
   */
  renderNodeChanges(
    data: readonly T[],
    dataDiffer: IterableDiffer<T> = this._dataDiffer,
    viewContainer: ViewContainerRef = this._nodeOutlet.viewContainer,
    parentData?: T,
  ) {
    const changes = dataDiffer.diff(data);
    if (!changes) {
      return;
    }

    changes.forEachOperation(
      (
        item: IterableChangeRecord<T>,
        adjustedPreviousIndex: number | null,
        currentIndex: number | null,
      ) => {
        if (item.previousIndex == null) {
          this.insertNode(data[currentIndex!], currentIndex!, viewContainer, parentData);
        } else if (currentIndex == null) {
          viewContainer.remove(adjustedPreviousIndex!);
          this._levels.delete(item.item);
        } else {
          const view = viewContainer.get(adjustedPreviousIndex!);
          viewContainer.move(view!, currentIndex);
        }
      },
    );

    this._changeDetectorRef.detectChanges();
  }

  /**
   * Finds the matching node definition that should be used for this node data. If there is only
   * one node definition, it is returned. Otherwise, find the node definition that has a when
   * predicate that returns true with the data. If none return true, return the default node
   * definition.
   *
   * 找到与此节点数据相匹配的节点定义。如果只有一个节点定义，就返回它。否则，找到具有 when 谓词并且该谓词返回 true 的节点定义。如果全都不返回 true，则返回默认的节点定义。
   *
   */
  _getNodeDef(data: T, i: number): CdkTreeNodeDef<T> {
    if (this._nodeDefs.length === 1) {
      return this._nodeDefs.first!;
    }

    const nodeDef =
      this._nodeDefs.find(def => def.when && def.when(i, data)) || this._defaultNodeDef;

    if (!nodeDef && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw getTreeMissingMatchingNodeDefError();
    }

    return nodeDef!;
  }

  /**
   * Create the embedded view for the data node template and place it in the correct index location
   * within the data node view container.
   *
   * 为数据节点模板创建嵌入式视图，并把它放在数据节点视图容器的正确索引位置。
   *
   */
  insertNode(nodeData: T, index: number, viewContainer?: ViewContainerRef, parentData?: T) {
    const node = this._getNodeDef(nodeData, index);

    // Node context that will be provided to created embedded view
    const context = new CdkTreeNodeOutletContext<T>(nodeData);

    // If the tree is flat tree, then use the `getLevel` function in flat tree control
    // Otherwise, use the level of parent node.
    if (this.treeControl.getLevel) {
      context.level = this.treeControl.getLevel(nodeData);
    } else if (typeof parentData !== 'undefined' && this._levels.has(parentData)) {
      context.level = this._levels.get(parentData)! + 1;
    } else {
      context.level = 0;
    }
    this._levels.set(nodeData, context.level);

    // Use default tree nodeOutlet, or nested node's nodeOutlet
    const container = viewContainer ? viewContainer : this._nodeOutlet.viewContainer;
    container.createEmbeddedView(node.template, context, index);

    // Set the data to just created `CdkTreeNode`.
    // The `CdkTreeNode` created from `createEmbeddedView` will be saved in static variable
    //     `mostRecentTreeNode`. We get it from static variable and pass the node data to it.
    if (CdkTreeNode.mostRecentTreeNode) {
      CdkTreeNode.mostRecentTreeNode.data = nodeData;
    }
  }
}

/**
 * Tree node for CdkTree. It contains the data in the tree node.
 *
 * CdkTree 的树节点。它包含树节点中的数据。
 *
 */
@Directive({
  selector: 'cdk-tree-node',
  exportAs: 'cdkTreeNode',
  host: {
    'class': 'cdk-tree-node',
    '[attr.aria-expanded]': 'isExpanded',
  },
})
export class CdkTreeNode<T, K = T> implements FocusableOption, OnDestroy, OnInit {
  /**
   * The role of the tree node.
   *
   * 树节点的角色是什么。
   *
   * @deprecated The correct role is 'treeitem', 'group' should not be used. This input will be
   *   removed in a future version.
   *
   * 正确的角色是 'treeitem'，不应该使用 'group'。该输入属性将在以后的版本中删除。
   *
   * @breaking-change 12.0.0 Remove this input
   *
   * 12.0.0 删除该输入属性
   *
   */
  @Input() get role(): 'treeitem' | 'group' {
    return 'treeitem';
  }

  set role(_role: 'treeitem' | 'group') {
    // TODO: move to host after View Engine deprecation
    this._elementRef.nativeElement.setAttribute('role', _role);
  }

  /**
   * The most recently created `CdkTreeNode`. We save it in static variable so we can retrieve it
   * in `CdkTree` and set the data to it.
   *
   * 最近创建的 `CdkTreeNode`。我们把它保存在静态变量中，这样我们就可以在 `CdkTree` 中检索它并把数据设置成它。
   *
   */
  static mostRecentTreeNode: CdkTreeNode<any> | null = null;

  /**
   * Subject that emits when the component has been destroyed.
   *
   * 组件被销毁后发出通知的主体对象。
   *
   */
  protected readonly _destroyed = new Subject<void>();

  /**
   * Emits when the node's data has changed.
   *
   * 当节点数据发生变化时触发。
   *
   */
  readonly _dataChanges = new Subject<void>();

  private _parentNodeAriaLevel: number;

  /**
   * The tree node's data.
   *
   * 树节点的数据。
   *
   */
  get data(): T {
    return this._data;
  }
  set data(value: T) {
    if (value !== this._data) {
      this._data = value;
      this._setRoleFromData();
      this._dataChanges.next();
    }
  }
  protected _data: T;

  get isExpanded(): boolean {
    return this._tree.treeControl.isExpanded(this._data);
  }

  get level(): number {
    // If the treeControl has a getLevel method, use it to get the level. Otherwise read the
    // aria-level off the parent node and use it as the level for this node (note aria-level is
    // 1-indexed, while this property is 0-indexed, so we don't need to increment).
    return this._tree.treeControl.getLevel
      ? this._tree.treeControl.getLevel(this._data)
      : this._parentNodeAriaLevel;
  }

  constructor(protected _elementRef: ElementRef<HTMLElement>, protected _tree: CdkTree<T, K>) {
    CdkTreeNode.mostRecentTreeNode = this as CdkTreeNode<T, K>;
    this.role = 'treeitem';
  }

  ngOnInit(): void {
    this._parentNodeAriaLevel = getParentNodeAriaLevel(this._elementRef.nativeElement);
    this._elementRef.nativeElement.setAttribute('aria-level', `${this.level + 1}`);
  }

  ngOnDestroy() {
    // If this is the last tree node being destroyed,
    // clear out the reference to avoid leaking memory.
    if (CdkTreeNode.mostRecentTreeNode === this) {
      CdkTreeNode.mostRecentTreeNode = null;
    }

    this._dataChanges.complete();
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Focuses the menu item. Implements for FocusableOption.
   *
   * 让此菜单项获得焦点。是对 FocusableOption 的实现。
   *
   */
  focus(): void {
    this._elementRef.nativeElement.focus();
  }

  // TODO: role should eventually just be set in the component host
  protected _setRoleFromData(): void {
    if (
      !this._tree.treeControl.isExpandable &&
      !this._tree.treeControl.getChildren &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw getTreeControlFunctionsMissingError();
    }
    this.role = 'treeitem';
  }
}

function getParentNodeAriaLevel(nodeElement: HTMLElement): number {
  let parent = nodeElement.parentElement;
  while (parent && !isNodeElement(parent)) {
    parent = parent.parentElement;
  }
  if (!parent) {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw Error('Incorrect tree structure containing detached node.');
    } else {
      return -1;
    }
  } else if (parent.classList.contains('cdk-nested-tree-node')) {
    return coerceNumberProperty(parent.getAttribute('aria-level')!);
  } else {
    // The ancestor element is the cdk-tree itself
    return 0;
  }
}

function isNodeElement(element: HTMLElement) {
  const classList = element.classList;
  return !!(classList?.contains('cdk-nested-tree-node') || classList?.contains('cdk-tree'));
}
