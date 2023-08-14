/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  QueryList,
  SkipSelf,
  ViewContainerRef,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  Self,
  InjectionToken,
} from '@angular/core';
import {
  coerceBooleanProperty,
  coerceNumberProperty,
  coerceElement,
  BooleanInput,
} from '@angular/cdk/coercion';
import {Observable, Observer, Subject, merge} from 'rxjs';
import {startWith, take, map, takeUntil, switchMap, tap} from 'rxjs/operators';
import type {
  CdkDragDrop,
  CdkDragEnd,
  CdkDragEnter,
  CdkDragExit,
  CdkDragMove,
  CdkDragStart,
  CdkDragRelease,
} from '../drag-events';
import {CDK_DRAG_HANDLE, CdkDragHandle} from './drag-handle';
import {CDK_DRAG_PLACEHOLDER, CdkDragPlaceholder} from './drag-placeholder';
import {CDK_DRAG_PREVIEW, CdkDragPreview} from './drag-preview';
import {CDK_DRAG_PARENT} from '../drag-parent';
import {DragRef, Point, PreviewContainer} from '../drag-ref';
import type {CdkDropList} from './drop-list';
import {DragDrop} from '../drag-drop';
import {CDK_DRAG_CONFIG, DragDropConfig, DragStartDelay, DragAxis} from './config';
import {assertElementNode} from './assertions';

const DRAG_HOST_CLASS = 'cdk-drag';

/**
 * Injection token that can be used to reference instances of `CdkDropList`. It serves as
 * alternative token to the actual `CdkDropList` class which could cause unnecessary
 * retention of the class and its directive metadata.
 */
export const CDK_DROP_LIST = new InjectionToken<CdkDropList>('CdkDropList');

/**
 * Element that can be moved inside a CdkDropList container.
 *
 * 可以在 CdkDropList 容器内移动的元素。
 *
 */
@Directive({
  selector: '[cdkDrag]',
  exportAs: 'cdkDrag',
  standalone: true,
  host: {
    'class': DRAG_HOST_CLASS,
    '[class.cdk-drag-disabled]': 'disabled',
    '[class.cdk-drag-dragging]': '_dragRef.isDragging()',
  },
  providers: [{provide: CDK_DRAG_PARENT, useExisting: CdkDrag}],
})
export class CdkDrag<T = any> implements AfterViewInit, OnChanges, OnDestroy {
  private readonly _destroyed = new Subject<void>();
  private static _dragInstances: CdkDrag[] = [];

  /**
   * Reference to the underlying drag instance.
   *
   * 对底层拖动实例的引用。
   *
   */
  _dragRef: DragRef<CdkDrag<T>>;

  /**
   * Elements that can be used to drag the draggable item.
   *
   * 可用来拖动此可拖动条目的元素。
   *
   */
  @ContentChildren(CDK_DRAG_HANDLE, {descendants: true}) _handles: QueryList<CdkDragHandle>;

  /**
   * Element that will be used as a template to create the draggable item's preview.
   *
   * 将用作模板以创建可拖动条目预览的元素。
   *
   */
  @ContentChild(CDK_DRAG_PREVIEW) _previewTemplate: CdkDragPreview;

  /**
   * Template for placeholder element rendered to show where a draggable would be dropped.
   *
   * 渲染占位符元素的模板，用于显示可拖动对象将被投放到的位置。
   *
   */
  @ContentChild(CDK_DRAG_PLACEHOLDER) _placeholderTemplate: CdkDragPlaceholder;

  /**
   * Arbitrary data to attach to this drag instance.
   *
   * 要附加到此拖动实例的任意数据。
   *
   */
  @Input('cdkDragData') data: T;

  /**
   * Locks the position of the dragged element along the specified axis.
   *
   * 锁定所拖动元素沿指定轴的位置。
   *
   */
  @Input('cdkDragLockAxis') lockAxis: DragAxis;

  /**
   * Selector that will be used to determine the root draggable element, starting from
   * the `cdkDrag` element and going up the DOM. Passing an alternate root element is useful
   * when trying to enable dragging on an element that you might not have access to.
   *
   * 本选择器用于在 DOM 树中从本 `cdkDrag` 元素往上找，以确定其根级可拖动元素。当尝试在可能无法访问的元素上启动拖动时，传递一个备用根元素是很有用的。
   *
   */
  @Input('cdkDragRootElement') rootElementSelector: string;

  /**
   * Node or selector that will be used to determine the element to which the draggable's
   * position will be constrained. If a string is passed in, it'll be used as a selector that
   * will be matched starting from the element's parent and going up the DOM until a match
   * has been found.
   *
   * 本节点或选择器将用于确定用来限制可拖动对象位置的元素。如果传入了一个字符串，它将用作选择器，该选择器将从元素的父级开始一直沿 DOM 进行匹配，直到找到匹配项为止。
   *
   */
  @Input('cdkDragBoundary') boundaryElement: string | ElementRef<HTMLElement> | HTMLElement;

  /**
   * Amount of milliseconds to wait after the user has put their
   * pointer down before starting to drag the element.
   *
   * 用户在开始拖动元素之前把指针放下之后要等待的毫秒数。
   *
   */
  @Input('cdkDragStartDelay') dragStartDelay: DragStartDelay;

  /**
   * Sets the position of a `CdkDrag` that is outside of a drop container.
   * Can be used to restore the element's position for a returning user.
   *
   * 设置投放容器外部的 `CdkDrag` 的位置。可用于为返回的用户恢复元素的位置。
   *
   */
  @Input('cdkDragFreeDragPosition') freeDragPosition: Point;

  /**
   * Whether starting to drag this element is disabled.
   *
   * 是否已禁止拖动此元素。
   *
   */
  @Input('cdkDragDisabled')
  get disabled(): boolean {
    return this._disabled || (this.dropContainer && this.dropContainer.disabled);
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._dragRef.disabled = this._disabled;
  }
  private _disabled: boolean;

  /**
   * Function that can be used to customize the logic of how the position of the drag item
   * is limited while it's being dragged. Gets called with a point containing the current position
   * of the user's pointer on the page, a reference to the item being dragged and its dimensions.
   * Should return a point describing where the item should be rendered.
   *
   * 本函数用于自定义在拖动条目时如何限制其位置的逻辑。使用用户指针在页面上的当前位置进行调用（正在被拖曳的条目的引用及其规格）。要返回描述该条目应该出现在哪里的点。
   */
  @Input('cdkDragConstrainPosition') constrainPosition?: (
    userPointerPosition: Point,
    dragRef: DragRef,
    dimensions: ClientRect,
    pickupPositionInElement: Point,
  ) => Point;

  /**
   * Class to be added to the preview element.
   *
   * 要添加到预览元素中的类。
   *
   */
  @Input('cdkDragPreviewClass') previewClass: string | string[];

  /**
   * Configures the place into which the preview of the item will be inserted. Can be configured
   * globally through `CDK_DROP_LIST`. Possible values:
   *
   * 配置条目预览的插入位置。可以通过 `CDK_DROP_LIST` 进行全局配置。可能的值有：
   *
   * - `global` - Preview will be inserted at the bottom of the `<body>`. The advantage is that
   *   you don't have to worry about `overflow: hidden` or `z-index`, but the item won't retain
   *   its inherited styles.
   *
   *   `global` —— 预览将插入在 `<body>` 的底部。优点是你不必担心 `overflow: hidden` 或 `z-index`，但条目不会保留其继承的样式。
   *
   * - `parent` - Preview will be inserted into the parent of the drag item. The advantage is that
   *   inherited styles will be preserved, but it may be clipped by `overflow: hidden` or not be
   *   visible due to `z-index`. Furthermore, the preview is going to have an effect over selectors
   *   like `:nth-child` and some flexbox configurations.
   *
   *   `parent` —— 预览将插入到拖动条目的父级中。优点是已继承的样式将被保留，但可能会被 `overflow: hidden` 裁剪，由于 `z-index` 而变得不可见。此外，该预览将对选择器如 `:nth-child` 和一些 flexbox 配置产生影响。
   *
   * - `ElementRef<HTMLElement> | HTMLElement` - Preview will be inserted into a specific element.
   *   Same advantages and disadvantages as `parent`.
   *
   *   `ElementRef<HTMLElement> | HTMLElement` 预览将插入到特定元素中。具有和 `parent` 一样的优点和缺点。
   *
   */
  @Input('cdkDragPreviewContainer') previewContainer: PreviewContainer;

  /**
   * Emits when the user starts dragging the item.
   *
   * 当用户开始拖动该条目时会触发。
   *
   */
  @Output('cdkDragStarted') readonly started: EventEmitter<CdkDragStart> =
    new EventEmitter<CdkDragStart>();

  /**
   * Emits when the user has released a drag item, before any animations have started.
   *
   * 当用户释放了一个拖动条目时触发。位于任何动画开始之前。
   *
   */
  @Output('cdkDragReleased') readonly released: EventEmitter<CdkDragRelease> =
    new EventEmitter<CdkDragRelease>();

  /**
   * Emits when the user stops dragging an item in the container.
   *
   * 当用户停止拖动容器中的某个条目时，会发出本通知。
   *
   */
  @Output('cdkDragEnded') readonly ended: EventEmitter<CdkDragEnd> = new EventEmitter<CdkDragEnd>();

  /**
   * Emits when the user has moved the item into a new container.
   *
   * 当用户把本条目移到新容器中时发出通知。
   *
   */
  @Output('cdkDragEntered') readonly entered: EventEmitter<CdkDragEnter<any>> = new EventEmitter<
    CdkDragEnter<any>
  >();

  /**
   * Emits when the user removes the item its container by dragging it into another container.
   *
   * 当用户通过把拖动条目从所在的容器移到另一个容器中时，就会触发。
   *
   */
  @Output('cdkDragExited') readonly exited: EventEmitter<CdkDragExit<any>> = new EventEmitter<
    CdkDragExit<any>
  >();

  /**
   * Emits when the user drops the item inside a container.
   *
   * 当用户把条目放到容器中时，就会触发。
   *
   */
  @Output('cdkDragDropped') readonly dropped: EventEmitter<CdkDragDrop<any>> = new EventEmitter<
    CdkDragDrop<any>
  >();

  /**
   * Emits as the user is dragging the item. Use with caution,
   * because this event will fire for every pixel that the user has dragged.
   *
   * 当用户正在拖动该条目时会触发。请谨慎使用，因为此事件会在用户拖动每一个像素时触发。
   *
   */
  @Output('cdkDragMoved')
  readonly moved: Observable<CdkDragMove<T>> = new Observable(
    (observer: Observer<CdkDragMove<T>>) => {
      const subscription = this._dragRef.moved
        .pipe(
          map(movedEvent => ({
            source: this,
            pointerPosition: movedEvent.pointerPosition,
            event: movedEvent.event,
            delta: movedEvent.delta,
            distance: movedEvent.distance,
          })),
        )
        .subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    },
  );

  constructor(
    /**
     * Element that the draggable is attached to.
     *
     * 此可拖动对象要附着到的元素。
     *
     */
    public element: ElementRef<HTMLElement>,
    /**
     * Droppable container that the draggable is a part of.
     *
     * 此可拖动对象所属的可拖动容器。
     *
     */
    @Inject(CDK_DROP_LIST) @Optional() @SkipSelf() public dropContainer: CdkDropList,
    /**
     * @deprecated `_document` parameter no longer being used and will be removed.
     * @breaking-change 12.0.0
     */
    @Inject(DOCUMENT) _document: any,
    private _ngZone: NgZone,
    private _viewContainerRef: ViewContainerRef,
    @Optional() @Inject(CDK_DRAG_CONFIG) config: DragDropConfig,
    @Optional() private _dir: Directionality,
    dragDrop: DragDrop,
    private _changeDetectorRef: ChangeDetectorRef,
    @Optional() @Self() @Inject(CDK_DRAG_HANDLE) private _selfHandle?: CdkDragHandle,
    @Optional() @SkipSelf() @Inject(CDK_DRAG_PARENT) private _parentDrag?: CdkDrag,
  ) {
    this._dragRef = dragDrop.createDrag(element, {
      dragStartThreshold:
        config && config.dragStartThreshold != null ? config.dragStartThreshold : 5,
      pointerDirectionChangeThreshold:
        config && config.pointerDirectionChangeThreshold != null
          ? config.pointerDirectionChangeThreshold
          : 5,
      zIndex: config?.zIndex,
    });
    this._dragRef.data = this;

    // We have to keep track of the drag instances in order to be able to match an element to
    // a drag instance. We can't go through the global registry of `DragRef`, because the root
    // element could be different.
    CdkDrag._dragInstances.push(this);

    if (config) {
      this._assignDefaults(config);
    }

    // Note that usually the container is assigned when the drop list is picks up the item, but in
    // some cases (mainly transplanted views with OnPush, see #18341) we may end up in a situation
    // where there are no items on the first change detection pass, but the items get picked up as
    // soon as the user triggers another pass by dragging. This is a problem, because the item would
    // have to switch from standalone mode to drag mode in the middle of the dragging sequence which
    // is too late since the two modes save different kinds of information. We work around it by
    // assigning the drop container both from here and the list.
    if (dropContainer) {
      this._dragRef._withDropContainer(dropContainer._dropListRef);
      dropContainer.addItem(this);
    }

    this._syncInputs(this._dragRef);
    this._handleEvents(this._dragRef);
  }

  /**
   * Returns the element that is being used as a placeholder
   * while the current element is being dragged.
   *
   * 返回在拖动当前元素时要用作占位符的元素。
   *
   */
  getPlaceholderElement(): HTMLElement {
    return this._dragRef.getPlaceholderElement();
  }

  /**
   * Returns the root draggable element.
   *
   * 返回可拖动条目的根元素。
   *
   */
  getRootElement(): HTMLElement {
    return this._dragRef.getRootElement();
  }

  /**
   * Resets a standalone drag item to its initial position.
   *
   * 将一个独立的拖动条目重置到初始位置。
   *
   */
  reset(): void {
    this._dragRef.reset();
  }

  /**
   * Gets the pixel coordinates of the draggable outside of a drop container.
   *
   * 获取可拖动对象在投放容器外的像素坐标。
   *
   */
  getFreeDragPosition(): Readonly<Point> {
    return this._dragRef.getFreeDragPosition();
  }

  /**
   * Sets the current position in pixels the draggable outside of a drop container.
   *
   * 设置可拖动元素在投放容器外部的当前位置（以像素为单位）。
   *
   * @param value New position to be set.
   *
   * 要设置的新位置。
   *
   */
  setFreeDragPosition(value: Point): void {
    this._dragRef.setFreeDragPosition(value);
  }

  ngAfterViewInit() {
    // Normally this isn't in the zone, but it can cause major performance regressions for apps
    // using `zone-patch-rxjs` because it'll trigger a change detection when it unsubscribes.
    this._ngZone.runOutsideAngular(() => {
      // We need to wait for the zone to stabilize, in order for the reference
      // element to be in the proper place in the DOM. This is mostly relevant
      // for draggable elements inside portals since they get stamped out in
      // their original DOM position and then they get transferred to the portal.
      this._ngZone.onStable.pipe(take(1), takeUntil(this._destroyed)).subscribe(() => {
        this._updateRootElement();
        this._setupHandlesListener();

        if (this.freeDragPosition) {
          this._dragRef.setFreeDragPosition(this.freeDragPosition);
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const rootSelectorChange = changes['rootElementSelector'];
    const positionChange = changes['freeDragPosition'];

    // We don't have to react to the first change since it's being
    // handled in `ngAfterViewInit` where it needs to be deferred.
    if (rootSelectorChange && !rootSelectorChange.firstChange) {
      this._updateRootElement();
    }

    // Skip the first change since it's being handled in `ngAfterViewInit`.
    if (positionChange && !positionChange.firstChange && this.freeDragPosition) {
      this._dragRef.setFreeDragPosition(this.freeDragPosition);
    }
  }

  ngOnDestroy() {
    if (this.dropContainer) {
      this.dropContainer.removeItem(this);
    }

    const index = CdkDrag._dragInstances.indexOf(this);
    if (index > -1) {
      CdkDrag._dragInstances.splice(index, 1);
    }

    // Unnecessary in most cases, but used to avoid extra change detections with `zone-paths-rxjs`.
    this._ngZone.runOutsideAngular(() => {
      this._destroyed.next();
      this._destroyed.complete();
      this._dragRef.dispose();
    });
  }

  /**
   * Syncs the root element with the `DragRef`.
   *
   * 将根元素与 `DragRef` 同步。
   *
   */
  private _updateRootElement() {
    const element = this.element.nativeElement as HTMLElement;
    let rootElement = element;
    if (this.rootElementSelector) {
      rootElement =
        element.closest !== undefined
          ? (element.closest(this.rootElementSelector) as HTMLElement)
          : // Comment tag doesn't have closest method, so use parent's one.
            (element.parentElement?.closest(this.rootElementSelector) as HTMLElement);
    }

    if (rootElement && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      assertElementNode(rootElement, 'cdkDrag');
    }

    this._dragRef.withRootElement(rootElement || element);
  }

  /**
   * Gets the boundary element, based on the `boundaryElement` value.
   *
   * 基于 `boundaryElement` 的值获取限界元素。
   *
   */
  private _getBoundaryElement() {
    const boundary = this.boundaryElement;

    if (!boundary) {
      return null;
    }

    if (typeof boundary === 'string') {
      return this.element.nativeElement.closest<HTMLElement>(boundary);
    }

    return coerceElement(boundary);
  }

  /**
   * Syncs the inputs of the CdkDrag with the options of the underlying DragRef.
   *
   * 将 CdkDrag 的输入与底层 DragRef 的选项同步。
   *
   */
  private _syncInputs(ref: DragRef<CdkDrag<T>>) {
    ref.beforeStarted.subscribe(() => {
      if (!ref.isDragging()) {
        const dir = this._dir;
        const dragStartDelay = this.dragStartDelay;
        const placeholder = this._placeholderTemplate
          ? {
              template: this._placeholderTemplate.templateRef,
              context: this._placeholderTemplate.data,
              viewContainer: this._viewContainerRef,
            }
          : null;
        const preview = this._previewTemplate
          ? {
              template: this._previewTemplate.templateRef,
              context: this._previewTemplate.data,
              matchSize: this._previewTemplate.matchSize,
              viewContainer: this._viewContainerRef,
            }
          : null;

        ref.disabled = this.disabled;
        ref.lockAxis = this.lockAxis;
        ref.dragStartDelay =
          typeof dragStartDelay === 'object' && dragStartDelay
            ? dragStartDelay
            : coerceNumberProperty(dragStartDelay);
        ref.constrainPosition = this.constrainPosition;
        ref.previewClass = this.previewClass;
        ref
          .withBoundaryElement(this._getBoundaryElement())
          .withPlaceholderTemplate(placeholder)
          .withPreviewTemplate(preview)
          .withPreviewContainer(this.previewContainer || 'global');

        if (dir) {
          ref.withDirection(dir.value);
        }
      }
    });

    // This only needs to be resolved once.
    ref.beforeStarted.pipe(take(1)).subscribe(() => {
      // If we managed to resolve a parent through DI, use it.
      if (this._parentDrag) {
        ref.withParent(this._parentDrag._dragRef);
        return;
      }

      // Otherwise fall back to resolving the parent by looking up the DOM. This can happen if
      // the item was projected into another item by something like `ngTemplateOutlet`.
      let parent = this.element.nativeElement.parentElement;
      while (parent) {
        if (parent.classList.contains(DRAG_HOST_CLASS)) {
          ref.withParent(
            CdkDrag._dragInstances.find(drag => {
              return drag.element.nativeElement === parent;
            })?._dragRef || null,
          );
          break;
        }
        parent = parent.parentElement;
      }
    });
  }

  /**
   * Handles the events from the underlying `DragRef`.
   *
   * 处理来自底层 `DragRef` 的事件。
   *
   */
  private _handleEvents(ref: DragRef<CdkDrag<T>>) {
    ref.started.subscribe(startEvent => {
      this.started.emit({source: this, event: startEvent.event});

      // Since all of these events run outside of change detection,
      // we need to ensure that everything is marked correctly.
      this._changeDetectorRef.markForCheck();
    });

    ref.released.subscribe(releaseEvent => {
      this.released.emit({source: this, event: releaseEvent.event});
    });

    ref.ended.subscribe(endEvent => {
      this.ended.emit({
        source: this,
        distance: endEvent.distance,
        dropPoint: endEvent.dropPoint,
        event: endEvent.event,
      });

      // Since all of these events run outside of change detection,
      // we need to ensure that everything is marked correctly.
      this._changeDetectorRef.markForCheck();
    });

    ref.entered.subscribe(enterEvent => {
      this.entered.emit({
        container: enterEvent.container.data,
        item: this,
        currentIndex: enterEvent.currentIndex,
      });
    });

    ref.exited.subscribe(exitEvent => {
      this.exited.emit({
        container: exitEvent.container.data,
        item: this,
      });
    });

    ref.dropped.subscribe(dropEvent => {
      this.dropped.emit({
        previousIndex: dropEvent.previousIndex,
        currentIndex: dropEvent.currentIndex,
        previousContainer: dropEvent.previousContainer.data,
        container: dropEvent.container.data,
        isPointerOverContainer: dropEvent.isPointerOverContainer,
        item: this,
        distance: dropEvent.distance,
        dropPoint: dropEvent.dropPoint,
        event: dropEvent.event,
      });
    });
  }

  /**
   * Assigns the default input values based on a provided config object.
   *
   * 根据所提供的配置对象赋值给默认输入。
   *
   */
  private _assignDefaults(config: DragDropConfig) {
    const {
      lockAxis,
      dragStartDelay,
      constrainPosition,
      previewClass,
      boundaryElement,
      draggingDisabled,
      rootElementSelector,
      previewContainer,
    } = config;

    this.disabled = draggingDisabled == null ? false : draggingDisabled;
    this.dragStartDelay = dragStartDelay || 0;

    if (lockAxis) {
      this.lockAxis = lockAxis;
    }

    if (constrainPosition) {
      this.constrainPosition = constrainPosition;
    }

    if (previewClass) {
      this.previewClass = previewClass;
    }

    if (boundaryElement) {
      this.boundaryElement = boundaryElement;
    }

    if (rootElementSelector) {
      this.rootElementSelector = rootElementSelector;
    }

    if (previewContainer) {
      this.previewContainer = previewContainer;
    }
  }

  /**
   * Sets up the listener that syncs the handles with the drag ref.
   *
   * 设置将拖动抓手与拖动引用同步的侦听器。
   *
   */
  private _setupHandlesListener() {
    // Listen for any newly-added handles.
    this._handles.changes
      .pipe(
        startWith(this._handles),
        // Sync the new handles with the DragRef.
        tap((handles: QueryList<CdkDragHandle>) => {
          const childHandleElements = handles
            .filter(handle => handle._parentDrag === this)
            .map(handle => handle.element);

          // Usually handles are only allowed to be a descendant of the drag element, but if
          // the consumer defined a different drag root, we should allow the drag element
          // itself to be a handle too.
          if (this._selfHandle && this.rootElementSelector) {
            childHandleElements.push(this.element);
          }

          this._dragRef.withHandles(childHandleElements);
        }),
        // Listen if the state of any of the handles changes.
        switchMap((handles: QueryList<CdkDragHandle>) => {
          return merge(
            ...handles.map(item => {
              return item._stateChanges.pipe(startWith(item));
            }),
          ) as Observable<CdkDragHandle>;
        }),
        takeUntil(this._destroyed),
      )
      .subscribe(handleInstance => {
        // Enabled/disable the handle that changed in the DragRef.
        const dragRef = this._dragRef;
        const handle = handleInstance.element.nativeElement;
        handleInstance.disabled ? dragRef.disableHandle(handle) : dragRef.enableHandle(handle);
      });
  }
}
