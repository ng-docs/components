/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {EmbeddedViewRef, ElementRef, NgZone, ViewContainerRef, TemplateRef} from '@angular/core';
import {ViewportRuler} from '@angular/cdk/scrolling';
import {Direction} from '@angular/cdk/bidi';
import {
  normalizePassiveListenerOptions,
  _getEventTarget,
  _getShadowRoot,
} from '@angular/cdk/platform';
import {coerceBooleanProperty, coerceElement} from '@angular/cdk/coercion';
import {isFakeMousedownFromScreenReader, isFakeTouchstartFromScreenReader} from '@angular/cdk/a11y';
import {Subscription, Subject, Observable} from 'rxjs';
import type {DropListRef} from './drop-list-ref';
import {DragDropRegistry} from './drag-drop-registry';
import {
  combineTransforms,
  DragCSSStyleDeclaration,
  extendStyles,
  toggleNativeDragInteractions,
  toggleVisibility,
} from './dom/styling';
import {getTransformTransitionDurationInMs} from './dom/transition-duration';
import {getMutableClientRect, adjustClientRect} from './dom/client-rect';
import {ParentPositionTracker} from './dom/parent-position-tracker';
import {deepCloneNode} from './dom/clone-node';

/**
 * Object that can be used to configure the behavior of DragRef.
 *
 * 可以用来配置 DragRef 行为的对象。
 *
 */
export interface DragRefConfig {
  /**
   * Minimum amount of pixels that the user should
   * drag, before the CDK initiates a drag sequence.
   *
   * 在 CDK 启动拖曳序列之前，用户应该拖动的最小像素数。
   *
   */
  dragStartThreshold: number;

  /**
   * Amount the pixels the user should drag before the CDK
   * considers them to have changed the drag direction.
   *
   * 在 CDK 认为改变了拖动方向之前，用户应该拖动的像素数量。
   *
   */
  pointerDirectionChangeThreshold: number;

  /**
   * `z-index` for the absolutely-positioned elements that are created by the drag item.
   *
   * `z-index` 用于为拖动条目创建的绝对定位元素。
   *
   */
  zIndex?: number;

  /**
   * Ref that the current drag item is nested in.
   *
   * 当前拖动条目所嵌套在的父拖动的引用。
   *
   */
  parentDragRef?: DragRef;
}

/**
 * Options that can be used to bind a passive event listener.
 *
 * 可以用来绑定被动事件监听器的参数。
 *
 */
const passiveEventListenerOptions = normalizePassiveListenerOptions({passive: true});

/**
 * Options that can be used to bind an active event listener.
 *
 * 可以用来绑定活动事件监听器的参数。
 *
 */
const activeEventListenerOptions = normalizePassiveListenerOptions({passive: false});

/**
 * Time in milliseconds for which to ignore mouse events, after
 * receiving a touch event. Used to avoid doing double work for
 * touch devices where the browser fires fake mouse events, in
 * addition to touch events.
 *
 * 在收到 touch 事件后，忽略鼠标事件的时间（以毫秒为单位）。用于避免浏览器除了触摸事件之外还触发假鼠标事件导致的双重工作。
 *
 */
const MOUSE_EVENT_IGNORE_TIME = 800;

// TODO(crisbeto): add an API for moving a draggable up/down the
// list programmatically. Useful for keyboard controls.

/**
 * Template that can be used to create a drag helper element \(e.g. a preview or a placeholder\).
 *
 * 可用于创建拖动辅助元素（例如预览或占位符）的模板。
 *
 */
interface DragHelperTemplate<T = any> {
  template: TemplateRef<T> | null;
  viewContainer: ViewContainerRef;
  context: T;
}

/**
 * Template that can be used to create a drag preview element.
 *
 * 可用于创建拖动预览元素的模板。
 *
 */
interface DragPreviewTemplate<T = any> extends DragHelperTemplate<T> {
  matchSize?: boolean;
}

/**
 * Point on the page or within an element.
 *
 * 页面上或元素中的点坐标。
 *
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Inline styles to be set as `!important` while dragging.
 *
 * 拖动时要设置为 `!important` 的内联样式。
 *
 */
const dragImportantProperties = new Set([
  // Needs to be important, because some `mat-table` sets `position: sticky !important`. See #22781.
  'position',
]);

/**
 * Possible places into which the preview of a drag item can be inserted.
 *
 * 可以在其中插入拖动条目预览的可能位置。
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
export type PreviewContainer = 'global' | 'parent' | ElementRef<HTMLElement> | HTMLElement;

/**
 * Reference to a draggable item. Used to manipulate or dispose of the item.
 *
 * 可拖动条目的引用。用来操纵或丢弃条目。
 *
 */
export class DragRef<T = any> {
  /**
   * Element displayed next to the user's pointer while the element is dragged.
   *
   * 当元素被拖动时，会显示在用户指针旁边的元素。
   *
   */
  private _preview: HTMLElement;

  /**
   * Reference to the view of the preview element.
   *
   * 到预览元素视图的引用。
   *
   */
  private _previewRef: EmbeddedViewRef<any> | null;

  /**
   * Container into which to insert the preview.
   *
   * 要将预览插入其中的容器。
   *
   */
  private _previewContainer: PreviewContainer | undefined;

  /**
   * Reference to the view of the placeholder element.
   *
   * 到占位符元素视图的引用。
   *
   */
  private _placeholderRef: EmbeddedViewRef<any> | null;

  /**
   * Element that is rendered instead of the draggable item while it is being sorted.
   *
   * 在被排序时，用来代替可拖动条目进行渲染的元素。
   *
   */
  private _placeholder: HTMLElement;

  /**
   * Coordinates within the element at which the user picked up the element.
   *
   * 用户拿起的元素的元素内坐标。
   *
   */
  private _pickupPositionInElement: Point;

  /**
   * Coordinates on the page at which the user picked up the element.
   *
   * 用户拿起的元素的页面内坐标。
   *
   */
  private _pickupPositionOnPage: Point;

  /**
   * Anchor node used to save the place in the DOM where the element was
   * picked up so that it can be restored at the end of the drag sequence.
   *
   * 锚点节点用来保存 DOM 中拾取元素的位置，以便在拖曳序列结束时恢复它。
   *
   */
  private _anchor: Comment;

  /**
   * CSS `transform` applied to the element when it isn't being dragged. We need a
   * passive transform in order for the dragged element to retain its new position
   * after the user has stopped dragging and because we need to know the relative
   * position in case they start dragging again. This corresponds to `element.style.transform`.
   *
   * CSS `transform` 在拖动的时候会应用于元素。我们需要一个被动变换来让被拖动的元素在用户停止拖动之后保持新的位置，因为我们需要先了解它的相对位置（以防它们再次开始拖动）。这与 `element.style.transform` 相对应。
   *
   */
  private _passiveTransform: Point = {x: 0, y: 0};

  /**
   * CSS `transform` that is applied to the element while it's being dragged.
   *
   * 在被拖动过程中应用于该元素的 CSS `transform`
   *
   */
  private _activeTransform: Point = {x: 0, y: 0};

  /**
   * Inline `transform` value that the element had before the first dragging sequence.
   *
   * 元素在第一个拖曳序列之前的内联 `transform`
   *
   */
  private _initialTransform?: string;

  /**
   * Whether the dragging sequence has been started. Doesn't
   * necessarily mean that the element has been moved.
   *
   * 这个拖曳序列是否已经启动过了。但并不等于这个元素移动过。
   *
   */
  private _hasStartedDragging = false;

  /**
   * Whether the element has moved since the user started dragging it.
   *
   * 元素是否自用户开始拖动以来就已经移动过了。
   *
   */
  private _hasMoved: boolean;

  /**
   * Drop container in which the DragRef resided when dragging began.
   *
   * 当拖曳开始时 DragRef 所在的投放容器。
   *
   */
  private _initialContainer: DropListRef;

  /**
   * Index at which the item started in its initial container.
   *
   * 该条目在其初始容器中的索引。
   *
   */
  private _initialIndex: number;

  /**
   * Cached positions of scrollable parent elements.
   *
   * 可滚动父元素的已缓存位置。
   *
   */
  private _parentPositions: ParentPositionTracker;

  /**
   * Emits when the item is being moved.
   *
   * 移动条目时发出通知。
   *
   */
  private readonly _moveEvents = new Subject<{
    source: DragRef;
    pointerPosition: {x: number; y: number};
    event: MouseEvent | TouchEvent;
    distance: Point;
    delta: {x: -1 | 0 | 1; y: -1 | 0 | 1};
  }>();

  /**
   * Keeps track of the direction in which the user is dragging along each axis.
   *
   * 跟踪用户沿着每个轴拖动的方向。
   *
   */
  private _pointerDirectionDelta: {x: -1 | 0 | 1; y: -1 | 0 | 1};

  /**
   * Pointer position at which the last change in the delta occurred.
   *
   * 在最后一次改变方向之后的指针位置。
   *
   */
  private _pointerPositionAtLastDirectionChange: Point;

  /**
   * Position of the pointer at the last pointer event.
   *
   * 指向最后一次指针事件的位置。
   *
   */
  private _lastKnownPointerPosition: Point;

  /**
   * Root DOM node of the drag instance. This is the element that will
   * be moved around as the user is dragging.
   *
   * 该拖放实例的根 DOM 节点。这是当用户拖动时会被移动的元素。
   *
   */
  private _rootElement: HTMLElement;

  /**
   * Nearest ancestor SVG, relative to which coordinates are calculated if dragging SVGElement
   *
   * 最近的祖先 SVG，如果要拖动 SVGElement，就会相对于它来计算坐标
   *
   */
  private _ownerSVGElement: SVGSVGElement | null;

  /**
   * Inline style value of `-webkit-tap-highlight-color` at the time the
   * dragging was started. Used to restore the value once we're done dragging.
   *
   * 拖动开始时的 `-webkit-tap-highlight-color` 内联样式值。拖拉完毕后，用来恢复该值。
   *
   */
  private _rootElementTapHighlight: string;

  /**
   * Subscription to pointer movement events.
   *
   * 订阅指针移动事件。
   *
   */
  private _pointerMoveSubscription = Subscription.EMPTY;

  /**
   * Subscription to the event that is dispatched when the user lifts their pointer.
   *
   * 订阅当用户放开指针时派发的事件。
   *
   */
  private _pointerUpSubscription = Subscription.EMPTY;

  /**
   * Subscription to the viewport being scrolled.
   *
   * 到视口滚动事件的订阅。
   *
   */
  private _scrollSubscription = Subscription.EMPTY;

  /**
   * Subscription to the viewport being resized.
   *
   * 到视口正在调整大小事件的订阅。
   *
   */
  private _resizeSubscription = Subscription.EMPTY;

  /**
   * Time at which the last touch event occurred. Used to avoid firing the same
   * events multiple times on touch devices where the browser will fire a fake
   * mouse event for each touch event, after a certain time.
   *
   * 最后一次触摸事件发生的时间。用来避免在触摸设备上多次触发相同的事件，因为浏览器会在一定时间后触发每个触摸事件的假鼠标事件。
   *
   */
  private _lastTouchEventTime: number;

  /**
   * Time at which the last dragging sequence was started.
   *
   * 上一次拖曳序列开始的时间。
   *
   */
  private _dragStartTime: number;

  /**
   * Cached reference to the boundary element.
   *
   * 对边界元素的缓存引用。
   *
   */
  private _boundaryElement: HTMLElement | null = null;

  /**
   * Whether the native dragging interactions have been enabled on the root element.
   *
   * 是否在根元素上启用了原生拖动交互。
   *
   */
  private _nativeInteractionsEnabled = true;

  /**
   * Client rect of the root element when the dragging sequence has started.
   *
   * 此拖动序列开始时根元素的客户区矩形。
   *
   */
  private _initialClientRect?: ClientRect;

  /**
   * Cached dimensions of the preview element. Should be read via `_getPreviewRect`.
   *
   * 缓存的预览元素规格。应该通过 `_getPreviewRect` 读取。
   *
   */
  private _previewRect?: ClientRect;

  /**
   * Cached dimensions of the boundary element.
   *
   * 缓存的边界元素规格。
   *
   */
  private _boundaryRect?: ClientRect;

  /**
   * Element that will be used as a template to create the draggable item's preview.
   *
   * 该元素将被用作模板来创建可拖动条目的预览。
   *
   */
  private _previewTemplate?: DragPreviewTemplate | null;

  /**
   * Template for placeholder element rendered to show where a draggable would be dropped.
   *
   * 占位符元素的模板，用于展示可拖动对象的投放位置。
   *
   */
  private _placeholderTemplate?: DragHelperTemplate | null;

  /**
   * Elements that can be used to drag the draggable item.
   *
   * 可以用来拖动条目的元素。
   *
   */
  private _handles: HTMLElement[] = [];

  /**
   * Registered handles that are currently disabled.
   *
   * 当前禁用的已注册把手。
   *
   */
  private _disabledHandles = new Set<HTMLElement>();

  /**
   * Droppable container that the draggable is a part of.
   *
   * 此可拖动对象所属的可拖动容器。
   *
   */
  private _dropContainer?: DropListRef;

  /**
   * Layout direction of the item.
   *
   * 该条目的布局方向。
   *
   */
  private _direction: Direction = 'ltr';

  /**
   * Ref that the current drag item is nested in.
   *
   * 当前拖动条目嵌套于的父拖动的引用。
   *
   */
  private _parentDragRef: DragRef<unknown> | null;

  /**
   * Cached shadow root that the element is placed in. `null` means that the element isn't in
   * the shadow DOM and `undefined` means that it hasn't been resolved yet. Should be read via
   * `_getShadowRoot`, not directly.
   *
   * 该元素所在的缓存的 Shadow DOM 根。`null` 表示该元素不在 shadow DOM 中，`undefined` 表示它尚未解析。应该通过 `_getShadowRoot` 读取，而不是直接读取。
   *
   */
  private _cachedShadowRoot: ShadowRoot | null | undefined;

  /**
   * Axis along which dragging is locked.
   *
   * 拖动时锁定的轴。
   *
   */
  lockAxis: 'x' | 'y';

  /**
   * Amount of milliseconds to wait after the user has put their
   * pointer down before starting to drag the element.
   *
   * 用户在开始拖动元素之前把指针放下之后要等待的毫秒数。
   *
   */
  dragStartDelay: number | {touch: number; mouse: number} = 0;

  /**
   * Class to be added to the preview element.
   *
   * 要添加到预览元素中的类。
   *
   */
  previewClass: string | string[] | undefined;

  /**
   * Whether starting to drag this element is disabled.
   *
   * 是否已禁止拖动此元素。
   *
   */
  get disabled(): boolean {
    return this._disabled || !!(this._dropContainer && this._dropContainer.disabled);
  }
  set disabled(value: boolean) {
    const newValue = coerceBooleanProperty(value);

    if (newValue !== this._disabled) {
      this._disabled = newValue;
      this._toggleNativeDragInteractions();
      this._handles.forEach(handle => toggleNativeDragInteractions(handle, newValue));
    }
  }
  private _disabled = false;

  /**
   * Emits as the drag sequence is being prepared.
   *
   * 当拖曳序列准备就绪时触发。
   *
   */
  readonly beforeStarted = new Subject<void>();

  /**
   * Emits when the user starts dragging the item.
   *
   * 当用户开始拖动该条目时会触发。
   *
   */
  readonly started = new Subject<{source: DragRef; event: MouseEvent | TouchEvent}>();

  /**
   * Emits when the user has released a drag item, before any animations have started.
   *
   * 当用户释放了一个拖动条目时触发。位于任何动画开始之前。
   *
   */
  readonly released = new Subject<{source: DragRef; event: MouseEvent | TouchEvent}>();

  /**
   * Emits when the user stops dragging an item in the container.
   *
   * 当用户停止拖动容器中的某个条目时，会发出本通知。
   *
   */
  readonly ended = new Subject<{
    source: DragRef;
    distance: Point;
    dropPoint: Point;
    event: MouseEvent | TouchEvent;
  }>();

  /**
   * Emits when the user has moved the item into a new container.
   *
   * 当用户把本条目移到新容器中时发出通知。
   *
   */
  readonly entered = new Subject<{container: DropListRef; item: DragRef; currentIndex: number}>();

  /**
   * Emits when the user removes the item its container by dragging it into another container.
   *
   * 当用户通过把拖动条目从所在的容器移到另一个容器中时，就会触发。
   *
   */
  readonly exited = new Subject<{container: DropListRef; item: DragRef}>();

  /**
   * Emits when the user drops the item inside a container.
   *
   * 当用户把条目放到容器中时，就会触发。
   *
   */
  readonly dropped = new Subject<{
    previousIndex: number;
    currentIndex: number;
    item: DragRef;
    container: DropListRef;
    previousContainer: DropListRef;
    distance: Point;
    dropPoint: Point;
    isPointerOverContainer: boolean;
    event: MouseEvent | TouchEvent;
  }>();

  /**
   * Emits as the user is dragging the item. Use with caution,
   * because this event will fire for every pixel that the user has dragged.
   *
   * 当用户正在拖动该条目时会触发。请谨慎使用，因为此事件会在用户拖动每一个像素时触发。
   *
   */
  readonly moved: Observable<{
    source: DragRef;
    pointerPosition: {x: number; y: number};
    event: MouseEvent | TouchEvent;
    distance: Point;
    delta: {x: -1 | 0 | 1; y: -1 | 0 | 1};
  }> = this._moveEvents;

  /**
   * Arbitrary data that can be attached to the drag item.
   *
   * 可以附加到拖动条目上的任意数据。
   *
   */
  data: T;

  /**
   * Function that can be used to customize the logic of how the position of the drag item
   * is limited while it's being dragged. Gets called with a point containing the current position
   * of the user's pointer on the page, a reference to the item being dragged and its dimensions.
   * Should return a point describing where the item should be rendered.
   *
   * 本函数用于自定义在拖动条目时如何限制其位置的逻辑。使用用户指针在页面上的当前位置进行调用（正在被拖曳的条目的引用及其规格）。要返回描述该条目应该出现在哪里的点。
   *
   */
  constrainPosition?: (
    userPointerPosition: Point,
    dragRef: DragRef,
    dimensions: ClientRect,
    pickupPositionInElement: Point,
  ) => Point;

  constructor(
    element: ElementRef<HTMLElement> | HTMLElement,
    private _config: DragRefConfig,
    private _document: Document,
    private _ngZone: NgZone,
    private _viewportRuler: ViewportRuler,
    private _dragDropRegistry: DragDropRegistry<DragRef, DropListRef>,
  ) {
    this.withRootElement(element).withParent(_config.parentDragRef || null);
    this._parentPositions = new ParentPositionTracker(_document);
    _dragDropRegistry.registerDragItem(this);
  }

  /**
   * Returns the element that is being used as a placeholder
   * while the current element is being dragged.
   *
   * 在拖动当前元素的同时，返回当前占位符所在的元素。
   *
   */
  getPlaceholderElement(): HTMLElement {
    return this._placeholder;
  }

  /**
   * Returns the root draggable element.
   *
   * 返回可拖动条目的根元素。
   *
   */
  getRootElement(): HTMLElement {
    return this._rootElement;
  }

  /**
   * Gets the currently-visible element that represents the drag item.
   * While dragging this is the placeholder, otherwise it's the root element.
   *
   * 获取代表该拖动条目的当前可见元素。拖动期间是其占位符，其它时候是其根元素。
   *
   */
  getVisibleElement(): HTMLElement {
    return this.isDragging() ? this.getPlaceholderElement() : this.getRootElement();
  }

  /**
   * Registers the handles that can be used to drag the element.
   *
   * 注册可以用来拖动元素的手柄。
   *
   */
  withHandles(handles: (HTMLElement | ElementRef<HTMLElement>)[]): this {
    this._handles = handles.map(handle => coerceElement(handle));
    this._handles.forEach(handle => toggleNativeDragInteractions(handle, this.disabled));
    this._toggleNativeDragInteractions();

    // Delete any lingering disabled handles that may have been destroyed. Note that we re-create
    // the set, rather than iterate over it and filter out the destroyed handles, because while
    // the ES spec allows for sets to be modified while they're being iterated over, some polyfills
    // use an array internally which may throw an error.
    const disabledHandles = new Set<HTMLElement>();
    this._disabledHandles.forEach(handle => {
      if (this._handles.indexOf(handle) > -1) {
        disabledHandles.add(handle);
      }
    });
    this._disabledHandles = disabledHandles;
    return this;
  }

  /**
   * Registers the template that should be used for the drag preview.
   *
   * 注册要用作拖动预览的模板。
   *
   * @param template Template that from which to stamp out the preview.
   *
   * 用来生成预览图的模板。
   *
   */
  withPreviewTemplate(template: DragPreviewTemplate | null): this {
    this._previewTemplate = template;
    return this;
  }

  /**
   * Registers the template that should be used for the drag placeholder.
   *
   * 注册要用作拖动占位符的模板。
   *
   * @param template Template that from which to stamp out the placeholder.
   *
   * 用来生成占位符的模板。
   *
   */
  withPlaceholderTemplate(template: DragHelperTemplate | null): this {
    this._placeholderTemplate = template;
    return this;
  }

  /**
   * Sets an alternate drag root element. The root element is the element that will be moved as
   * the user is dragging. Passing an alternate root element is useful when trying to enable
   * dragging on an element that you might not have access to.
   *
   * 设置备用的拖动根元素。根元素是用户拖动时会被移动的元素。当你尝试在你可能无权访问的元素上启用拖曳时，传入一个备用的根元素是很有用的。
   *
   */
  withRootElement(rootElement: ElementRef<HTMLElement> | HTMLElement): this {
    const element = coerceElement(rootElement);

    if (element !== this._rootElement) {
      if (this._rootElement) {
        this._removeRootElementListeners(this._rootElement);
      }

      this._ngZone.runOutsideAngular(() => {
        element.addEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
        element.addEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
        element.addEventListener('dragstart', this._nativeDragStart, activeEventListenerOptions);
      });
      this._initialTransform = undefined;
      this._rootElement = element;
    }

    if (typeof SVGElement !== 'undefined' && this._rootElement instanceof SVGElement) {
      this._ownerSVGElement = this._rootElement.ownerSVGElement;
    }

    return this;
  }

  /**
   * Element to which the draggable's position will be constrained.
   *
   * 用于进行可拖动位置限制的元素。
   *
   */
  withBoundaryElement(boundaryElement: ElementRef<HTMLElement> | HTMLElement | null): this {
    this._boundaryElement = boundaryElement ? coerceElement(boundaryElement) : null;
    this._resizeSubscription.unsubscribe();
    if (boundaryElement) {
      this._resizeSubscription = this._viewportRuler
        .change(10)
        .subscribe(() => this._containInsideBoundaryOnResize());
    }
    return this;
  }

  /**
   * Sets the parent ref that the ref is nested in.
   *
   * 设置嵌套引用的父引用。
   *
   */
  withParent(parent: DragRef<unknown> | null): this {
    this._parentDragRef = parent;
    return this;
  }

  /**
   * Removes the dragging functionality from the DOM element.
   *
   * 从 DOM 元素中移除拖动功能。
   *
   */
  dispose() {
    this._removeRootElementListeners(this._rootElement);

    // Do this check before removing from the registry since it'll
    // stop being considered as dragged once it is removed.
    if (this.isDragging()) {
      // Since we move out the element to the end of the body while it's being
      // dragged, we have to make sure that it's removed if it gets destroyed.
      this._rootElement?.remove();
    }

    this._anchor?.remove();
    this._destroyPreview();
    this._destroyPlaceholder();
    this._dragDropRegistry.removeDragItem(this);
    this._removeSubscriptions();
    this.beforeStarted.complete();
    this.started.complete();
    this.released.complete();
    this.ended.complete();
    this.entered.complete();
    this.exited.complete();
    this.dropped.complete();
    this._moveEvents.complete();
    this._handles = [];
    this._disabledHandles.clear();
    this._dropContainer = undefined;
    this._resizeSubscription.unsubscribe();
    this._parentPositions.clear();
    this._boundaryElement =
      this._rootElement =
      this._ownerSVGElement =
      this._placeholderTemplate =
      this._previewTemplate =
      this._anchor =
      this._parentDragRef =
        null!;
  }

  /**
   * Checks whether the element is currently being dragged.
   *
   * 检查当前是否正在拖动该元素。
   *
   */
  isDragging(): boolean {
    return this._hasStartedDragging && this._dragDropRegistry.isDragging(this);
  }

  /**
   * Resets a standalone drag item to its initial position.
   *
   * 将一个独立的拖动条目重置到初始位置。
   *
   */
  reset(): void {
    this._rootElement.style.transform = this._initialTransform || '';
    this._activeTransform = {x: 0, y: 0};
    this._passiveTransform = {x: 0, y: 0};
  }

  /**
   * Sets a handle as disabled. While a handle is disabled, it'll capture and interrupt dragging.
   *
   * 禁用拖动手柄。当手柄被禁用时，它会捕获并中止拖动操作。
   *
   * @param handle Handle element that should be disabled.
   *
   * 要被禁用的手柄元素。
   *
   */
  disableHandle(handle: HTMLElement) {
    if (!this._disabledHandles.has(handle) && this._handles.indexOf(handle) > -1) {
      this._disabledHandles.add(handle);
      toggleNativeDragInteractions(handle, true);
    }
  }

  /**
   * Enables a handle, if it has been disabled.
   *
   * 启用一个已被禁用的手柄。
   *
   * @param handle Handle element to be enabled.
   *
   * 要启用的手柄。
   *
   */
  enableHandle(handle: HTMLElement) {
    if (this._disabledHandles.has(handle)) {
      this._disabledHandles.delete(handle);
      toggleNativeDragInteractions(handle, this.disabled);
    }
  }

  /**
   * Sets the layout direction of the draggable item.
   *
   * 设置可拖动条目的布局方向。
   *
   */
  withDirection(direction: Direction): this {
    this._direction = direction;
    return this;
  }

  /**
   * Sets the container that the item is part of.
   *
   * 设置该条目所属的容器。
   *
   */
  _withDropContainer(container: DropListRef) {
    this._dropContainer = container;
  }

  /**
   * Gets the current position in pixels the draggable outside of a drop container.
   *
   * 获取可拖动元素在投放容器外部的当前位置（以像素为单位）。
   *
   */
  getFreeDragPosition(): Readonly<Point> {
    const position = this.isDragging() ? this._activeTransform : this._passiveTransform;
    return {x: position.x, y: position.y};
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
  setFreeDragPosition(value: Point): this {
    this._activeTransform = {x: 0, y: 0};
    this._passiveTransform.x = value.x;
    this._passiveTransform.y = value.y;

    if (!this._dropContainer) {
      this._applyRootElementTransform(value.x, value.y);
    }

    return this;
  }

  /**
   * Sets the container into which to insert the preview element.
   *
   * 设置要在其中插入预览元素的容器。
   *
   * @param value Container into which to insert the preview.
   *
   * 要将预览插入其中的容器。
   *
   */
  withPreviewContainer(value: PreviewContainer): this {
    this._previewContainer = value;
    return this;
  }

  /**
   * Updates the item's sort order based on the last-known pointer position.
   *
   * 根据最近知道的指针位置更新本条目的排序顺序。
   *
   */
  _sortFromLastPointerPosition() {
    const position = this._lastKnownPointerPosition;

    if (position && this._dropContainer) {
      this._updateActiveDropContainer(this._getConstrainedPointerPosition(position), position);
    }
  }

  /**
   * Unsubscribes from the global subscriptions.
   *
   * 取消所有全局订阅。
   *
   */
  private _removeSubscriptions() {
    this._pointerMoveSubscription.unsubscribe();
    this._pointerUpSubscription.unsubscribe();
    this._scrollSubscription.unsubscribe();
  }

  /**
   * Destroys the preview element and its ViewRef.
   *
   * 销毁这个预览元素及其 ViewRef。
   *
   */
  private _destroyPreview() {
    this._preview?.remove();
    this._previewRef?.destroy();
    this._preview = this._previewRef = null!;
  }

  /**
   * Destroys the placeholder element and its ViewRef.
   *
   * 销毁占位符元素及其 ViewRef。
   *
   */
  private _destroyPlaceholder() {
    this._placeholder?.remove();
    this._placeholderRef?.destroy();
    this._placeholder = this._placeholderRef = null!;
  }

  /**
   * Handler for the `mousedown`/`touchstart` events.
   *
   * `mousedown` / `touchstart` 事件的处理程序。
   *
   */
  private _pointerDown = (event: MouseEvent | TouchEvent) => {
    this.beforeStarted.next();

    // Delegate the event based on whether it started from a handle or the element itself.
    if (this._handles.length) {
      const targetHandle = this._getTargetHandle(event);

      if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
        this._initializeDragSequence(targetHandle, event);
      }
    } else if (!this.disabled) {
      this._initializeDragSequence(this._rootElement, event);
    }
  };

  /**
   * Handler that is invoked when the user moves their pointer after they've initiated a drag.
   *
   * 当用户启动拖曳后移动指针时调用的处理函数。
   *
   */
  private _pointerMove = (event: MouseEvent | TouchEvent) => {
    const pointerPosition = this._getPointerPositionOnPage(event);

    if (!this._hasStartedDragging) {
      const distanceX = Math.abs(pointerPosition.x - this._pickupPositionOnPage.x);
      const distanceY = Math.abs(pointerPosition.y - this._pickupPositionOnPage.y);
      const isOverThreshold = distanceX + distanceY >= this._config.dragStartThreshold;

      // Only start dragging after the user has moved more than the minimum distance in either
      // direction. Note that this is preferable over doing something like `skip(minimumDistance)`
      // in the `pointerMove` subscription, because we're not guaranteed to have one move event
      // per pixel of movement (e.g. if the user moves their pointer quickly).
      if (isOverThreshold) {
        const isDelayElapsed = Date.now() >= this._dragStartTime + this._getDragStartDelay(event);
        const container = this._dropContainer;

        if (!isDelayElapsed) {
          this._endDragSequence(event);
          return;
        }

        // Prevent other drag sequences from starting while something in the container is still
        // being dragged. This can happen while we're waiting for the drop animation to finish
        // and can cause errors, because some elements might still be moving around.
        if (!container || (!container.isDragging() && !container.isReceiving())) {
          // Prevent the default action as soon as the dragging sequence is considered as
          // "started" since waiting for the next event can allow the device to begin scrolling.
          event.preventDefault();
          this._hasStartedDragging = true;
          this._ngZone.run(() => this._startDragSequence(event));
        }
      }

      return;
    }

    // We prevent the default action down here so that we know that dragging has started. This is
    // important for touch devices where doing this too early can unnecessarily block scrolling,
    // if there's a dragging delay.
    event.preventDefault();

    const constrainedPointerPosition = this._getConstrainedPointerPosition(pointerPosition);
    this._hasMoved = true;
    this._lastKnownPointerPosition = pointerPosition;
    this._updatePointerDirectionDelta(constrainedPointerPosition);

    if (this._dropContainer) {
      this._updateActiveDropContainer(constrainedPointerPosition, pointerPosition);
    } else {
      // If there's a position constraint function, we want the element's top/left to be at the
      // specific position on the page. Use the initial position as a reference if that's the case.
      const offset = this.constrainPosition ? this._initialClientRect! : this._pickupPositionOnPage;
      const activeTransform = this._activeTransform;
      activeTransform.x = constrainedPointerPosition.x - offset.x + this._passiveTransform.x;
      activeTransform.y = constrainedPointerPosition.y - offset.y + this._passiveTransform.y;
      this._applyRootElementTransform(activeTransform.x, activeTransform.y);
    }

    // Since this event gets fired for every pixel while dragging, we only
    // want to fire it if the consumer opted into it. Also we have to
    // re-enter the zone because we run all of the events on the outside.
    if (this._moveEvents.observers.length) {
      this._ngZone.run(() => {
        this._moveEvents.next({
          source: this,
          pointerPosition: constrainedPointerPosition,
          event,
          distance: this._getDragDistance(constrainedPointerPosition),
          delta: this._pointerDirectionDelta,
        });
      });
    }
  };

  /**
   * Handler that is invoked when the user lifts their pointer up, after initiating a drag.
   *
   * 当用户在启动拖曳时把抬起指针时调用的处理程序。
   *
   */
  private _pointerUp = (event: MouseEvent | TouchEvent) => {
    this._endDragSequence(event);
  };

  /**
   * Clears subscriptions and stops the dragging sequence.
   *
   * 清除订阅并停止拖曳序列。
   *
   * @param event Browser event object that ended the sequence.
   *
   * 停止该序列的浏览器事件对象
   *
   */
  private _endDragSequence(event: MouseEvent | TouchEvent) {
    // Note that here we use `isDragging` from the service, rather than from `this`.
    // The difference is that the one from the service reflects whether a dragging sequence
    // has been initiated, whereas the one on `this` includes whether the user has passed
    // the minimum dragging threshold.
    if (!this._dragDropRegistry.isDragging(this)) {
      return;
    }

    this._removeSubscriptions();
    this._dragDropRegistry.stopDragging(this);
    this._toggleNativeDragInteractions();

    if (this._handles) {
      (this._rootElement.style as DragCSSStyleDeclaration).webkitTapHighlightColor =
        this._rootElementTapHighlight;
    }

    if (!this._hasStartedDragging) {
      return;
    }

    this.released.next({source: this, event});

    if (this._dropContainer) {
      // Stop scrolling immediately, instead of waiting for the animation to finish.
      this._dropContainer._stopScrolling();
      this._animatePreviewToPlaceholder().then(() => {
        this._cleanupDragArtifacts(event);
        this._cleanupCachedDimensions();
        this._dragDropRegistry.stopDragging(this);
      });
    } else {
      // Convert the active transform into a passive one. This means that next time
      // the user starts dragging the item, its position will be calculated relatively
      // to the new passive transform.
      this._passiveTransform.x = this._activeTransform.x;
      const pointerPosition = this._getPointerPositionOnPage(event);
      this._passiveTransform.y = this._activeTransform.y;
      this._ngZone.run(() => {
        this.ended.next({
          source: this,
          distance: this._getDragDistance(pointerPosition),
          dropPoint: pointerPosition,
          event,
        });
      });
      this._cleanupCachedDimensions();
      this._dragDropRegistry.stopDragging(this);
    }
  }

  /**
   * Starts the dragging sequence.
   *
   * 开始拖曳序列。
   *
   */
  private _startDragSequence(event: MouseEvent | TouchEvent) {
    if (isTouchEvent(event)) {
      this._lastTouchEventTime = Date.now();
    }

    this._toggleNativeDragInteractions();

    const dropContainer = this._dropContainer;

    if (dropContainer) {
      const element = this._rootElement;
      const parent = element.parentNode as HTMLElement;
      const placeholder = (this._placeholder = this._createPlaceholderElement());
      const anchor = (this._anchor = this._anchor || this._document.createComment(''));

      // Needs to happen before the root element is moved.
      const shadowRoot = this._getShadowRoot();

      // Insert an anchor node so that we can restore the element's position in the DOM.
      parent.insertBefore(anchor, element);

      // There's no risk of transforms stacking when inside a drop container so
      // we can keep the initial transform up to date any time dragging starts.
      this._initialTransform = element.style.transform || '';

      // Create the preview after the initial transform has
      // been cached, because it can be affected by the transform.
      this._preview = this._createPreviewElement();

      // We move the element out at the end of the body and we make it hidden, because keeping it in
      // place will throw off the consumer's `:last-child` selectors. We can't remove the element
      // from the DOM completely, because iOS will stop firing all subsequent events in the chain.
      toggleVisibility(element, false, dragImportantProperties);
      this._document.body.appendChild(parent.replaceChild(placeholder, element));
      this._getPreviewInsertionPoint(parent, shadowRoot).appendChild(this._preview);
      this.started.next({source: this, event}); // Emit before notifying the container.
      dropContainer.start();
      this._initialContainer = dropContainer;
      this._initialIndex = dropContainer.getItemIndex(this);
    } else {
      this.started.next({source: this, event});
      this._initialContainer = this._initialIndex = undefined!;
    }

    // Important to run after we've called `start` on the parent container
    // so that it has had time to resolve its scrollable parents.
    this._parentPositions.cache(dropContainer ? dropContainer.getScrollableParents() : []);
  }

  /**
   * Sets up the different variables and subscriptions
   * that will be necessary for the dragging sequence.
   *
   * 设置拖曳序列所需的不同变量和订阅。
   *
   * @param referenceElement Element that started the drag sequence.
   *
   * 启动拖曳序列的元素
   *
   * @param event Browser event object that started the sequence.
   *
   * 启动本序列的浏览器事件对象。
   *
   */
  private _initializeDragSequence(referenceElement: HTMLElement, event: MouseEvent | TouchEvent) {
    // Stop propagation if the item is inside another
    // draggable so we don't start multiple drag sequences.
    if (this._parentDragRef) {
      event.stopPropagation();
    }

    const isDragging = this.isDragging();
    const isTouchSequence = isTouchEvent(event);
    const isAuxiliaryMouseButton = !isTouchSequence && (event as MouseEvent).button !== 0;
    const rootElement = this._rootElement;
    const target = _getEventTarget(event);
    const isSyntheticEvent =
      !isTouchSequence &&
      this._lastTouchEventTime &&
      this._lastTouchEventTime + MOUSE_EVENT_IGNORE_TIME > Date.now();
    const isFakeEvent = isTouchSequence
      ? isFakeTouchstartFromScreenReader(event as TouchEvent)
      : isFakeMousedownFromScreenReader(event as MouseEvent);

    // If the event started from an element with the native HTML drag&drop, it'll interfere
    // with our own dragging (e.g. `img` tags do it by default). Prevent the default action
    // to stop it from happening. Note that preventing on `dragstart` also seems to work, but
    // it's flaky and it fails if the user drags it away quickly. Also note that we only want
    // to do this for `mousedown` since doing the same for `touchstart` will stop any `click`
    // events from firing on touch devices.
    if (target && (target as HTMLElement).draggable && event.type === 'mousedown') {
      event.preventDefault();
    }

    // Abort if the user is already dragging or is using a mouse button other than the primary one.
    if (isDragging || isAuxiliaryMouseButton || isSyntheticEvent || isFakeEvent) {
      return;
    }

    // If we've got handles, we need to disable the tap highlight on the entire root element,
    // otherwise iOS will still add it, even though all the drag interactions on the handle
    // are disabled.
    if (this._handles.length) {
      const rootStyles = rootElement.style as DragCSSStyleDeclaration;
      this._rootElementTapHighlight = rootStyles.webkitTapHighlightColor || '';
      rootStyles.webkitTapHighlightColor = 'transparent';
    }

    this._hasStartedDragging = this._hasMoved = false;

    // Avoid multiple subscriptions and memory leaks when multi touch
    // (isDragging check above isn't enough because of possible temporal and/or dimensional delays)
    this._removeSubscriptions();
    this._initialClientRect = this._rootElement.getBoundingClientRect();
    this._pointerMoveSubscription = this._dragDropRegistry.pointerMove.subscribe(this._pointerMove);
    this._pointerUpSubscription = this._dragDropRegistry.pointerUp.subscribe(this._pointerUp);
    this._scrollSubscription = this._dragDropRegistry
      .scrolled(this._getShadowRoot())
      .subscribe(scrollEvent => this._updateOnScroll(scrollEvent));

    if (this._boundaryElement) {
      this._boundaryRect = getMutableClientRect(this._boundaryElement);
    }

    // If we have a custom preview we can't know ahead of time how large it'll be so we position
    // it next to the cursor. The exception is when the consumer has opted into making the preview
    // the same size as the root element, in which case we do know the size.
    const previewTemplate = this._previewTemplate;
    this._pickupPositionInElement =
      previewTemplate && previewTemplate.template && !previewTemplate.matchSize
        ? {x: 0, y: 0}
        : this._getPointerPositionInElement(this._initialClientRect, referenceElement, event);
    const pointerPosition =
      (this._pickupPositionOnPage =
      this._lastKnownPointerPosition =
        this._getPointerPositionOnPage(event));
    this._pointerDirectionDelta = {x: 0, y: 0};
    this._pointerPositionAtLastDirectionChange = {x: pointerPosition.x, y: pointerPosition.y};
    this._dragStartTime = Date.now();
    this._dragDropRegistry.startDragging(this, event);
  }

  /**
   * Cleans up the DOM artifacts that were added to facilitate the element being dragged.
   *
   * 清理所添加的 DOM 内容，以方便拖动该元素。
   *
   */
  private _cleanupDragArtifacts(event: MouseEvent | TouchEvent) {
    // Restore the element's visibility and insert it at its old position in the DOM.
    // It's important that we maintain the position, because moving the element around in the DOM
    // can throw off `NgFor` which does smart diffing and re-creates elements only when necessary,
    // while moving the existing elements in all other cases.
    toggleVisibility(this._rootElement, true, dragImportantProperties);
    this._anchor.parentNode!.replaceChild(this._rootElement, this._anchor);

    this._destroyPreview();
    this._destroyPlaceholder();
    this._initialClientRect =
      this._boundaryRect =
      this._previewRect =
      this._initialTransform =
        undefined;

    // Re-enter the NgZone since we bound `document` events on the outside.
    this._ngZone.run(() => {
      const container = this._dropContainer!;
      const currentIndex = container.getItemIndex(this);
      const pointerPosition = this._getPointerPositionOnPage(event);
      const distance = this._getDragDistance(pointerPosition);
      const isPointerOverContainer = container._isOverContainer(
        pointerPosition.x,
        pointerPosition.y,
      );

      this.ended.next({source: this, distance, dropPoint: pointerPosition, event});
      this.dropped.next({
        item: this,
        currentIndex,
        previousIndex: this._initialIndex,
        container: container,
        previousContainer: this._initialContainer,
        isPointerOverContainer,
        distance,
        dropPoint: pointerPosition,
        event,
      });
      container.drop(
        this,
        currentIndex,
        this._initialIndex,
        this._initialContainer,
        isPointerOverContainer,
        distance,
        pointerPosition,
        event,
      );
      this._dropContainer = this._initialContainer;
    });
  }

  /**
   * Updates the item's position in its drop container, or moves it
   * into a new one, depending on its current drag position.
   *
   * 根据当前的拖动位置更新条目在投放容器中的位置，或者把它移动到新的位置。
   *
   */
  private _updateActiveDropContainer({x, y}: Point, {x: rawX, y: rawY}: Point) {
    // Drop container that draggable has been moved into.
    let newContainer = this._initialContainer._getSiblingContainerFromPosition(this, x, y);

    // If we couldn't find a new container to move the item into, and the item has left its
    // initial container, check whether the it's over the initial container. This handles the
    // case where two containers are connected one way and the user tries to undo dragging an
    // item into a new container.
    if (
      !newContainer &&
      this._dropContainer !== this._initialContainer &&
      this._initialContainer._isOverContainer(x, y)
    ) {
      newContainer = this._initialContainer;
    }

    if (newContainer && newContainer !== this._dropContainer) {
      this._ngZone.run(() => {
        // Notify the old container that the item has left.
        this.exited.next({item: this, container: this._dropContainer!});
        this._dropContainer!.exit(this);
        // Notify the new container that the item has entered.
        this._dropContainer = newContainer!;
        this._dropContainer.enter(
          this,
          x,
          y,
          newContainer === this._initialContainer &&
            // If we're re-entering the initial container and sorting is disabled,
            // put item the into its starting index to begin with.
            newContainer.sortingDisabled
            ? this._initialIndex
            : undefined,
        );
        this.entered.next({
          item: this,
          container: newContainer!,
          currentIndex: newContainer!.getItemIndex(this),
        });
      });
    }

    // Dragging may have been interrupted as a result of the events above.
    if (this.isDragging()) {
      this._dropContainer!._startScrollingIfNecessary(rawX, rawY);
      this._dropContainer!._sortItem(this, x, y, this._pointerDirectionDelta);

      if (this.constrainPosition) {
        this._applyPreviewTransform(x, y);
      } else {
        this._applyPreviewTransform(
          x - this._pickupPositionInElement.x,
          y - this._pickupPositionInElement.y,
        );
      }
    }
  }

  /**
   * Creates the element that will be rendered next to the user's pointer
   * and will be used as a preview of the element that is being dragged.
   *
   * 创建一个会渲染在用户指针旁边的元素，并把它当作被拖动元素的预览。
   *
   */
  private _createPreviewElement(): HTMLElement {
    const previewConfig = this._previewTemplate;
    const previewClass = this.previewClass;
    const previewTemplate = previewConfig ? previewConfig.template : null;
    let preview: HTMLElement;

    if (previewTemplate && previewConfig) {
      // Measure the element before we've inserted the preview
      // since the insertion could throw off the measurement.
      const rootRect = previewConfig.matchSize ? this._initialClientRect : null;
      const viewRef = previewConfig.viewContainer.createEmbeddedView(
        previewTemplate,
        previewConfig.context,
      );
      viewRef.detectChanges();
      preview = getRootNode(viewRef, this._document);
      this._previewRef = viewRef;
      if (previewConfig.matchSize) {
        matchElementSize(preview, rootRect!);
      } else {
        preview.style.transform = getTransform(
          this._pickupPositionOnPage.x,
          this._pickupPositionOnPage.y,
        );
      }
    } else {
      preview = deepCloneNode(this._rootElement);
      matchElementSize(preview, this._initialClientRect!);

      if (this._initialTransform) {
        preview.style.transform = this._initialTransform;
      }
    }

    extendStyles(
      preview.style,
      {
        // It's important that we disable the pointer events on the preview, because
        // it can throw off the `document.elementFromPoint` calls in the `CdkDropList`.
        'pointer-events': 'none',
        // We have to reset the margin, because it can throw off positioning relative to the viewport.
        'margin': '0',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'z-index': `${this._config.zIndex || 1000}`,
      },
      dragImportantProperties,
    );

    toggleNativeDragInteractions(preview, false);
    preview.classList.add('cdk-drag-preview');
    preview.setAttribute('dir', this._direction);

    if (previewClass) {
      if (Array.isArray(previewClass)) {
        previewClass.forEach(className => preview.classList.add(className));
      } else {
        preview.classList.add(previewClass);
      }
    }

    return preview;
  }

  /**
   * Animates the preview element from its current position to the location of the drop placeholder.
   *
   * 预览元素从当前位置移到投放占位符位置的动画。
   *
   * @returns Promise that resolves when the animation completes.
   *
   * 在动画完成时会解析的 Promise。
   *
   */
  private _animatePreviewToPlaceholder(): Promise<void> {
    // If the user hasn't moved yet, the transitionend event won't fire.
    if (!this._hasMoved) {
      return Promise.resolve();
    }

    const placeholderRect = this._placeholder.getBoundingClientRect();

    // Apply the class that adds a transition to the preview.
    this._preview.classList.add('cdk-drag-animating');

    // Move the preview to the placeholder position.
    this._applyPreviewTransform(placeholderRect.left, placeholderRect.top);

    // If the element doesn't have a `transition`, the `transitionend` event won't fire. Since
    // we need to trigger a style recalculation in order for the `cdk-drag-animating` class to
    // apply its style, we take advantage of the available info to figure out whether we need to
    // bind the event in the first place.
    const duration = getTransformTransitionDurationInMs(this._preview);

    if (duration === 0) {
      return Promise.resolve();
    }

    return this._ngZone.runOutsideAngular(() => {
      return new Promise(resolve => {
        const handler = ((event: TransitionEvent) => {
          if (
            !event ||
            (_getEventTarget(event) === this._preview && event.propertyName === 'transform')
          ) {
            this._preview?.removeEventListener('transitionend', handler);
            resolve();
            clearTimeout(timeout);
          }
        }) as EventListenerOrEventListenerObject;

        // If a transition is short enough, the browser might not fire the `transitionend` event.
        // Since we know how long it's supposed to take, add a timeout with a 50% buffer that'll
        // fire if the transition hasn't completed when it was supposed to.
        const timeout = setTimeout(handler as Function, duration * 1.5);
        this._preview.addEventListener('transitionend', handler);
      });
    });
  }

  /**
   * Creates an element that will be shown instead of the current element while dragging.
   *
   * 拖动时，会创建一个要显示的元素，而不是当前元素。
   *
   */
  private _createPlaceholderElement(): HTMLElement {
    const placeholderConfig = this._placeholderTemplate;
    const placeholderTemplate = placeholderConfig ? placeholderConfig.template : null;
    let placeholder: HTMLElement;

    if (placeholderTemplate) {
      this._placeholderRef = placeholderConfig!.viewContainer.createEmbeddedView(
        placeholderTemplate,
        placeholderConfig!.context,
      );
      this._placeholderRef.detectChanges();
      placeholder = getRootNode(this._placeholderRef, this._document);
    } else {
      placeholder = deepCloneNode(this._rootElement);
    }

    // Stop pointer events on the preview so the user can't
    // interact with it while the preview is animating.
    placeholder.style.pointerEvents = 'none';
    placeholder.classList.add('cdk-drag-placeholder');
    return placeholder;
  }

  /**
   * Figures out the coordinates at which an element was picked up.
   *
   * 找出拾取元素时的坐标。
   *
   * @param referenceElement Element that initiated the dragging.
   *
   * 那些引发了拖曳的元素。
   *
   * @param event Event that initiated the dragging.
   *
   * 那些引发了拖曳的事件。
   *
   */
  private _getPointerPositionInElement(
    elementRect: ClientRect,
    referenceElement: HTMLElement,
    event: MouseEvent | TouchEvent,
  ): Point {
    const handleElement = referenceElement === this._rootElement ? null : referenceElement;
    const referenceRect = handleElement ? handleElement.getBoundingClientRect() : elementRect;
    const point = isTouchEvent(event) ? event.targetTouches[0] : event;
    const scrollPosition = this._getViewportScrollPosition();
    const x = point.pageX - referenceRect.left - scrollPosition.left;
    const y = point.pageY - referenceRect.top - scrollPosition.top;

    return {
      x: referenceRect.left - elementRect.left + x,
      y: referenceRect.top - elementRect.top + y,
    };
  }

  /**
   * Determines the point of the page that was touched by the user.
   *
   * 确定用户触摸到的页面坐标。
   *
   */
  private _getPointerPositionOnPage(event: MouseEvent | TouchEvent): Point {
    const scrollPosition = this._getViewportScrollPosition();
    const point = isTouchEvent(event)
      ? // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
        // Also note that on real devices we're guaranteed for either `touches` or `changedTouches`
        // to have a value, but Firefox in device emulation mode has a bug where both can be empty
        // for `touchstart` and `touchend` so we fall back to a dummy object in order to avoid
        // throwing an error. The value returned here will be incorrect, but since this only
        // breaks inside a developer tool and the value is only used for secondary information,
        // we can get away with it. See https://bugzilla.mozilla.org/show_bug.cgi?id=1615824.
        event.touches[0] || event.changedTouches[0] || {pageX: 0, pageY: 0}
      : event;

    const x = point.pageX - scrollPosition.left;
    const y = point.pageY - scrollPosition.top;

    // if dragging SVG element, try to convert from the screen coordinate system to the SVG
    // coordinate system
    if (this._ownerSVGElement) {
      const svgMatrix = this._ownerSVGElement.getScreenCTM();
      if (svgMatrix) {
        const svgPoint = this._ownerSVGElement.createSVGPoint();
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(svgMatrix.inverse());
      }
    }

    return {x, y};
  }

  /**
   * Gets the pointer position on the page, accounting for any position constraints.
   *
   * 获取页面上的指针位置，考虑了任何位置约束。
   *
   */
  private _getConstrainedPointerPosition(point: Point): Point {
    const dropContainerLock = this._dropContainer ? this._dropContainer.lockAxis : null;
    let {x, y} = this.constrainPosition
      ? this.constrainPosition(point, this, this._initialClientRect!, this._pickupPositionInElement)
      : point;

    if (this.lockAxis === 'x' || dropContainerLock === 'x') {
      y = this._pickupPositionOnPage.y;
    } else if (this.lockAxis === 'y' || dropContainerLock === 'y') {
      x = this._pickupPositionOnPage.x;
    }

    if (this._boundaryRect) {
      const {x: pickupX, y: pickupY} = this._pickupPositionInElement;
      const boundaryRect = this._boundaryRect;
      const {width: previewWidth, height: previewHeight} = this._getPreviewRect();
      const minY = boundaryRect.top + pickupY;
      const maxY = boundaryRect.bottom - (previewHeight - pickupY);
      const minX = boundaryRect.left + pickupX;
      const maxX = boundaryRect.right - (previewWidth - pickupX);

      x = clamp(x, minX, maxX);
      y = clamp(y, minY, maxY);
    }

    return {x, y};
  }

  /**
   * Updates the current drag delta, based on the user's current pointer position on the page.
   *
   * 根据用户在页面上当前的指针位置，更新当前的拖曳增量。
   *
   */
  private _updatePointerDirectionDelta(pointerPositionOnPage: Point) {
    const {x, y} = pointerPositionOnPage;
    const delta = this._pointerDirectionDelta;
    const positionSinceLastChange = this._pointerPositionAtLastDirectionChange;

    // Amount of pixels the user has dragged since the last time the direction changed.
    const changeX = Math.abs(x - positionSinceLastChange.x);
    const changeY = Math.abs(y - positionSinceLastChange.y);

    // Because we handle pointer events on a per-pixel basis, we don't want the delta
    // to change for every pixel, otherwise anything that depends on it can look erratic.
    // To make the delta more consistent, we track how much the user has moved since the last
    // delta change and we only update it after it has reached a certain threshold.
    if (changeX > this._config.pointerDirectionChangeThreshold) {
      delta.x = x > positionSinceLastChange.x ? 1 : -1;
      positionSinceLastChange.x = x;
    }

    if (changeY > this._config.pointerDirectionChangeThreshold) {
      delta.y = y > positionSinceLastChange.y ? 1 : -1;
      positionSinceLastChange.y = y;
    }

    return delta;
  }

  /**
   * Toggles the native drag interactions, based on how many handles are registered.
   *
   * 根据已注册的手柄数量，来切换原生的拖放交互。
   *
   */
  private _toggleNativeDragInteractions() {
    if (!this._rootElement || !this._handles) {
      return;
    }

    const shouldEnable = this._handles.length > 0 || !this.isDragging();

    if (shouldEnable !== this._nativeInteractionsEnabled) {
      this._nativeInteractionsEnabled = shouldEnable;
      toggleNativeDragInteractions(this._rootElement, shouldEnable);
    }
  }

  /**
   * Removes the manually-added event listeners from the root element.
   *
   * 从根元素中删除手工添加的事件监听器。
   *
   */
  private _removeRootElementListeners(element: HTMLElement) {
    element.removeEventListener('mousedown', this._pointerDown, activeEventListenerOptions);
    element.removeEventListener('touchstart', this._pointerDown, passiveEventListenerOptions);
    element.removeEventListener('dragstart', this._nativeDragStart, activeEventListenerOptions);
  }

  /**
   * Applies a `transform` to the root element, taking into account any existing transforms on it.
   *
   * 对根元素应用一个 `transform`，包括它上面的所有转换。
   *
   * @param x New transform value along the X axis.
   *
   * 沿 X 轴的新变换值。
   *
   * @param y New transform value along the Y axis.
   *
   * 沿 Y 轴的新变换值。
   *
   */
  private _applyRootElementTransform(x: number, y: number) {
    const transform = getTransform(x, y);
    const styles = this._rootElement.style;

    // Cache the previous transform amount only after the first drag sequence, because
    // we don't want our own transforms to stack on top of each other.
    // Should be excluded none because none + translate3d(x, y, x) is invalid css
    if (this._initialTransform == null) {
      this._initialTransform =
        styles.transform && styles.transform != 'none' ? styles.transform : '';
    }

    // Preserve the previous `transform` value, if there was one. Note that we apply our own
    // transform before the user's, because things like rotation can affect which direction
    // the element will be translated towards.
    styles.transform = combineTransforms(transform, this._initialTransform);
  }

  /**
   * Applies a `transform` to the preview, taking into account any existing transforms on it.
   *
   * 应用一个 `transform` 到预览对象，计入其任何现有的转换。
   *
   * @param x New transform value along the X axis.
   *
   * 沿 X 轴的新变换值。
   *
   * @param y New transform value along the Y axis.
   *
   * 沿 Y 轴的新变换值。
   *
   */
  private _applyPreviewTransform(x: number, y: number) {
    // Only apply the initial transform if the preview is a clone of the original element, otherwise
    // it could be completely different and the transform might not make sense anymore.
    const initialTransform = this._previewTemplate?.template ? undefined : this._initialTransform;
    const transform = getTransform(x, y);
    this._preview.style.transform = combineTransforms(transform, initialTransform);
  }

  /**
   * Gets the distance that the user has dragged during the current drag sequence.
   *
   * 获取当前拖曳序列中用户拖动的距离。
   *
   * @param currentPosition Current position of the user's pointer.
   *
   * 用户指针的当前位置。
   *
   */
  private _getDragDistance(currentPosition: Point): Point {
    const pickupPosition = this._pickupPositionOnPage;

    if (pickupPosition) {
      return {x: currentPosition.x - pickupPosition.x, y: currentPosition.y - pickupPosition.y};
    }

    return {x: 0, y: 0};
  }

  /**
   * Cleans up any cached element dimensions that we don't need after dragging has stopped.
   *
   * 清理拖动停止后我们不再需要的所有缓存元素规格。
   *
   */
  private _cleanupCachedDimensions() {
    this._boundaryRect = this._previewRect = undefined;
    this._parentPositions.clear();
  }

  /**
   * Checks whether the element is still inside its boundary after the viewport has been resized.
   * If not, the position is adjusted so that the element fits again.
   *
   * 调整视口大小后，检查该元素是否仍在其边界内。否则，调整元素的位置，以便再次适合它。
   *
   */
  private _containInsideBoundaryOnResize() {
    let {x, y} = this._passiveTransform;

    if ((x === 0 && y === 0) || this.isDragging() || !this._boundaryElement) {
      return;
    }

    // Note: don't use `_clientRectAtStart` here, because we want the latest position.
    const elementRect = this._rootElement.getBoundingClientRect();
    const boundaryRect = this._boundaryElement.getBoundingClientRect();

    // It's possible that the element got hidden away after dragging (e.g. by switching to a
    // different tab). Don't do anything in this case so we don't clear the user's position.
    if (
      (boundaryRect.width === 0 && boundaryRect.height === 0) ||
      (elementRect.width === 0 && elementRect.height === 0)
    ) {
      return;
    }

    const leftOverflow = boundaryRect.left - elementRect.left;
    const rightOverflow = elementRect.right - boundaryRect.right;
    const topOverflow = boundaryRect.top - elementRect.top;
    const bottomOverflow = elementRect.bottom - boundaryRect.bottom;

    // If the element has become wider than the boundary, we can't
    // do much to make it fit so we just anchor it to the left.
    if (boundaryRect.width > elementRect.width) {
      if (leftOverflow > 0) {
        x += leftOverflow;
      }

      if (rightOverflow > 0) {
        x -= rightOverflow;
      }
    } else {
      x = 0;
    }

    // If the element has become taller than the boundary, we can't
    // do much to make it fit so we just anchor it to the top.
    if (boundaryRect.height > elementRect.height) {
      if (topOverflow > 0) {
        y += topOverflow;
      }

      if (bottomOverflow > 0) {
        y -= bottomOverflow;
      }
    } else {
      y = 0;
    }

    if (x !== this._passiveTransform.x || y !== this._passiveTransform.y) {
      this.setFreeDragPosition({y, x});
    }
  }

  /**
   * Gets the drag start delay, based on the event type.
   *
   * 根据事件类型获取拖曳的起始延迟。
   *
   */
  private _getDragStartDelay(event: MouseEvent | TouchEvent): number {
    const value = this.dragStartDelay;

    if (typeof value === 'number') {
      return value;
    } else if (isTouchEvent(event)) {
      return value.touch;
    }

    return value ? value.mouse : 0;
  }

  /**
   * Updates the internal state of the draggable element when scrolling has occurred.
   *
   * 当滚动时，会更新可拖动元素的内部状态。
   *
   */
  private _updateOnScroll(event: Event) {
    const scrollDifference = this._parentPositions.handleScroll(event);

    if (scrollDifference) {
      const target = _getEventTarget<HTMLElement | Document>(event)!;

      // ClientRect dimensions are based on the scroll position of the page and its parent
      // node so we have to update the cached boundary ClientRect if the user has scrolled.
      if (
        this._boundaryRect &&
        target !== this._boundaryElement &&
        target.contains(this._boundaryElement)
      ) {
        adjustClientRect(this._boundaryRect, scrollDifference.top, scrollDifference.left);
      }

      this._pickupPositionOnPage.x += scrollDifference.left;
      this._pickupPositionOnPage.y += scrollDifference.top;

      // If we're in free drag mode, we have to update the active transform, because
      // it isn't relative to the viewport like the preview inside a drop list.
      if (!this._dropContainer) {
        this._activeTransform.x -= scrollDifference.left;
        this._activeTransform.y -= scrollDifference.top;
        this._applyRootElementTransform(this._activeTransform.x, this._activeTransform.y);
      }
    }
  }

  /**
   * Gets the scroll position of the viewport.
   *
   * 获取视口的滚动位置。
   *
   */
  private _getViewportScrollPosition() {
    return (
      this._parentPositions.positions.get(this._document)?.scrollPosition ||
      this._parentPositions.getViewportScrollPosition()
    );
  }

  /**
   * Lazily resolves and returns the shadow root of the element. We do this in a function, rather
   * than saving it in property directly on init, because we want to resolve it as late as possible
   * in order to ensure that the element has been moved into the shadow DOM. Doing it inside the
   * constructor might be too early if the element is inside of something like `ngFor` or `ngIf`.
   *
   * 惰性解析并返回该元素的 Shadow DOM 根。我们在函数中执行此操作，而不是直接在初始化时保存在属性中，因为我们希望尽可能晚地解析它，以确保该元素已被移入了 shadow DOM 中。如果元素位于 `ngFor` 或 `ngIf` 的内部，那么在构造函数中执行此操作可能为时过早了。
   *
   */
  private _getShadowRoot(): ShadowRoot | null {
    if (this._cachedShadowRoot === undefined) {
      this._cachedShadowRoot = _getShadowRoot(this._rootElement);
    }

    return this._cachedShadowRoot;
  }

  /**
   * Gets the element into which the drag preview should be inserted.
   *
   * 获取应将拖动预览插入其中的元素。
   *
   */
  private _getPreviewInsertionPoint(
    initialParent: HTMLElement,
    shadowRoot: ShadowRoot | null,
  ): HTMLElement {
    const previewContainer = this._previewContainer || 'global';

    if (previewContainer === 'parent') {
      return initialParent;
    }

    if (previewContainer === 'global') {
      const documentRef = this._document;

      // We can't use the body if the user is in fullscreen mode,
      // because the preview will render under the fullscreen element.
      // TODO(crisbeto): dedupe this with the `FullscreenOverlayContainer` eventually.
      return (
        shadowRoot ||
        documentRef.fullscreenElement ||
        (documentRef as any).webkitFullscreenElement ||
        (documentRef as any).mozFullScreenElement ||
        (documentRef as any).msFullscreenElement ||
        documentRef.body
      );
    }

    return coerceElement(previewContainer);
  }

  /**
   * Lazily resolves and returns the dimensions of the preview.
   *
   * 惰性解析并返回预览的尺寸。
   *
   */
  private _getPreviewRect(): ClientRect {
    // Cache the preview element rect if we haven't cached it already or if
    // we cached it too early before the element dimensions were computed.
    if (!this._previewRect || (!this._previewRect.width && !this._previewRect.height)) {
      this._previewRect = this._preview
        ? this._preview.getBoundingClientRect()
        : this._initialClientRect!;
    }

    return this._previewRect;
  }

  /**
   * Handles a native `dragstart` event.
   *
   * 处理原生的 `dragstart` 事件。
   *
   */
  private _nativeDragStart = (event: DragEvent) => {
    if (this._handles.length) {
      const targetHandle = this._getTargetHandle(event);

      if (targetHandle && !this._disabledHandles.has(targetHandle) && !this.disabled) {
        event.preventDefault();
      }
    } else if (!this.disabled) {
      // Usually this isn't necessary since the we prevent the default action in `pointerDown`,
      // but some cases like dragging of links can slip through (see #24403).
      event.preventDefault();
    }
  };

  /**
   * Gets a handle that is the target of an event.
   *
   * 获取作为事件目标的句柄。
   *
   */
  private _getTargetHandle(event: Event): HTMLElement | undefined {
    return this._handles.find(handle => {
      return event.target && (event.target === handle || handle.contains(event.target as Node));
    });
  }
}

/**
 * Gets a 3d `transform` that can be applied to an element.
 *
 * 获取一个可以应用于元素 `transform`
 *
 * @param x Desired position of the element along the X axis.
 *
 * 元素在 X 轴上的所需位置。
 *
 * @param y Desired position of the element along the Y axis.
 *
 * 元素在 Y 轴上的所需位置。
 *
 */
function getTransform(x: number, y: number): string {
  // Round the transforms since some browsers will
  // blur the elements for sub-pixel transforms.
  return `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
}

/**
 * Clamps a value between a minimum and a maximum.
 *
 * 在最小值和最大值之间夹取一个值。
 *
 */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Determines whether an event is a touch event.
 *
 * 确定某个事件是否触摸事件。
 *
 */
function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  // This function is called for every pixel that the user has dragged so we need it to be
  // as fast as possible. Since we only bind mouse events and touch events, we can assume
  // that if the event's name starts with `t`, it's a touch event.
  return event.type[0] === 't';
}

/**
 * Gets the root HTML element of an embedded view.
 * If the root is not an HTML element it gets wrapped in one.
 *
 * 获取嵌入视图的根 HTML 元素。如果它的根不是 HTML 元素，就会给它包装一个。
 *
 */
function getRootNode(viewRef: EmbeddedViewRef<any>, _document: Document): HTMLElement {
  const rootNodes: Node[] = viewRef.rootNodes;

  if (rootNodes.length === 1 && rootNodes[0].nodeType === _document.ELEMENT_NODE) {
    return rootNodes[0] as HTMLElement;
  }

  const wrapper = _document.createElement('div');
  rootNodes.forEach(node => wrapper.appendChild(node));
  return wrapper;
}

/**
 * Matches the target element's size to the source's size.
 *
 * 把目标元素的大小适配到源的大小。
 *
 * @param target Element that needs to be resized.
 *
 * 需要调整大小的元素。
 *
 * @param sourceRect Dimensions of the source element.
 *
 * 源元素的规格。
 *
 */
function matchElementSize(target: HTMLElement, sourceRect: ClientRect): void {
  target.style.width = `${sourceRect.width}px`;
  target.style.height = `${sourceRect.height}px`;
  target.style.transform = getTransform(sourceRect.left, sourceRect.top);
}
