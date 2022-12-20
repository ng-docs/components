/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, inject, Injectable, InjectionToken, NgZone, OnDestroy} from '@angular/core';
import {fromEvent, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {FocusableElement, PointerFocusTracker} from './pointer-focus-tracker';
import {Menu} from './menu-interface';
import {throwMissingMenuReference, throwMissingPointerFocusTracker} from './menu-errors';

/**
 * MenuAim is responsible for determining if a sibling menuitem's menu should be closed when a
 * Toggler item is hovered into. It is up to the hovered in item to call the MenuAim service in
 * order to determine if it may perform its close actions.
 *
 * MenuAim （菜单瞄准器）负责确定当悬停在切换器（Toggler）菜单项时是否应关闭其同级菜单项的子菜单。使用所悬停的菜单项来调用 MenuAim 服务以确定它是否可以执行其关闭操作。
 *
 */
export interface MenuAim {
  /**
   * Set the Menu and its PointerFocusTracker.
   *
   * 设置菜单及其 PointerFocusTracker。
   *
   * @param menu The menu that this menu aim service controls.
   *
   * 该 MenuAim 服务所控制的菜单。
   *
   * @param pointerTracker The `PointerFocusTracker` for the given menu.
   *
   * 给定菜单的 `PointerFocusTracker` 。
   *
   */
  initialize(menu: Menu, pointerTracker: PointerFocusTracker<FocusableElement & Toggler>): void;

  /**
   * Calls the `doToggle` callback when it is deemed that the user is not moving towards
   * the submenu.
   *
   * 当认为用户没有移向子菜单时调用 `doToggle` 回调。
   *
   * @param doToggle the function called when the user is not moving towards the submenu.
   *
   * 当用户没有移向子菜单时调用的函数。
   *
   */
  toggle(doToggle: () => void): void;
}

/**
 * Injection token used for an implementation of MenuAim.
 *
 * 用于实现 MenuAim 的注入令牌。
 *
 */
export const MENU_AIM = new InjectionToken<MenuAim>('cdk-menu-aim');

/**
 * Capture every nth mouse move event.
 *
 * 每 n 个鼠标移动事件捕获一个。
 *
 */
const MOUSE_MOVE_SAMPLE_FREQUENCY = 3;

/**
 * The number of mouse move events to track.
 *
 * 要跟踪的鼠标移动事件的数量。
 *
 */
const NUM_POINTS = 5;

/**
 * How long to wait before closing a sibling menu if a user stops short of the submenu they were
 * predicted to go into.
 *
 * 如果用户在预期要进入的子菜单前停下来，在关闭同级菜单之前要等待多长时间。
 *
 */
const CLOSE_DELAY = 300;

/**
 * An element which when hovered over may open or close a menu.
 *
 * 一个元素，当悬停在其上时可以打开或关闭菜单。
 *
 */
export interface Toggler {
  /**
   * Gets the open menu, or undefined if no menu is open.
   *
   * 获取所打开的菜单，如果没有打开菜单，则为 undefined。
   *
   */
  getMenu(): Menu | undefined;
}

/**
 * Calculate the slope between point a and b.
 *
 * 计算点 a 和 b 之间的斜率。
 *
 */
function getSlope(a: Point, b: Point) {
  return (b.y - a.y) / (b.x - a.x);
}

/**
 * Calculate the y intercept for the given point and slope.
 *
 * 计算给定点位和斜率的 y 截距。
 *
 */
function getYIntercept(point: Point, slope: number) {
  return point.y - slope * point.x;
}

/**
 * Represents a coordinate of mouse travel.
 *
 * 表示鼠标移动的坐标。
 *
 */
type Point = {x: number; y: number};

/**
 * Whether the given mouse trajectory line defined by the slope and y intercept falls within the
 * submenu as defined by `submenuPoints`
 *
 * 由斜率和 y 截距定义的给定鼠标轨迹线是否在 `submenuPoints` 定义的子菜单内
 *
 * @param submenuPoints the submenu DOMRect points.
 *
 * 子菜单的 DOMRect 点。
 *
 * @param m the slope of the trajectory line.
 *
 * 轨迹线的斜率。
 *
 * @param b the y intercept of the trajectory line.
 *
 * 轨迹线的 y 截距。
 *
 * @return true if any point on the line falls within the submenu.
 *
 * 如果线上的任何点落在子菜单内，则为 true。
 *
 */
function isWithinSubmenu(submenuPoints: DOMRect, m: number, b: number) {
  const {left, right, top, bottom} = submenuPoints;

  // Check for intersection with each edge of the submenu (left, right, top, bottom)
  // by fixing one coordinate to that edge's coordinate (either x or y) and checking if the
  // other coordinate is within bounds.
  return (
    (m * left + b >= top && m * left + b <= bottom) ||
    (m * right + b >= top && m * right + b <= bottom) ||
    ((top - b) / m >= left && (top - b) / m <= right) ||
    ((bottom - b) / m >= left && (bottom - b) / m <= right)
  );
}

/**
 * TargetMenuAim predicts if a user is moving into a submenu. It calculates the
 * trajectory of the user's mouse movement in the current menu to determine if the
 * mouse is moving towards an open submenu.
 *
 * TargetMenuAim 会预测用户是否正在进入子菜单。它计算用户鼠标在当前菜单中移动的轨迹，以确定鼠标是否正在向打开的子菜单移动。
 *
 * The determination is made by calculating the slope of the users last NUM_POINTS moves where each
 * pair of points determines if the trajectory line points into the submenu. It uses consensus
 * approach by checking if at least NUM_POINTS / 2 pairs determine that the user is moving towards
 * to submenu.
 *
 * 通过计算用户最后 NUM_POINTS 移动的斜率来确定，其中每对点确定轨迹线是否指向子菜单。它使用的方法是检查是否至少有 NUM_POINTS / 2 对来确定用户正在移至子菜单来。
 *
 */
@Injectable()
export class TargetMenuAim implements MenuAim, OnDestroy {
  /**
   * The Angular zone.
   *
   * Angular 区域（Zone）。
   *
   */
  private readonly _ngZone = inject(NgZone);

  /**
   * The last NUM_POINTS mouse move events.
   *
   * 最后 NUM_POINTS 个鼠标移动事件。
   *
   */
  private readonly _points: Point[] = [];

  /**
   * Reference to the root menu in which we are tracking mouse moves.
   *
   * 引用我们在其中跟踪鼠标移动的根菜单。
   *
   */
  private _menu: Menu;

  /**
   * Reference to the root menu's mouse manager.
   *
   * 对根菜单的鼠标管理器的引用。
   *
   */
  private _pointerTracker: PointerFocusTracker<Toggler & FocusableElement>;

  /**
   * The id associated with the current timeout call waiting to resolve.
   *
   * 与当前等待解析的超时调用关联的 id。
   *
   */
  private _timeoutId: number | null;

  /**
   * Emits when this service is destroyed.
   *
   * 当此服务被销毁时发出。
   *
   */
  private readonly _destroyed: Subject<void> = new Subject();

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * Set the Menu and its PointerFocusTracker.
   *
   * 设置菜单及其 PointerFocusTracker。
   *
   * @param menu The menu that this menu aim service controls.
   *
   * 该 MenuAim 服务控制的菜单。
   *
   * @param pointerTracker The `PointerFocusTracker` for the given menu.
   *
   * 给定菜单的 `PointerFocusTracker` 。
   *
   */
  initialize(menu: Menu, pointerTracker: PointerFocusTracker<FocusableElement & Toggler>) {
    this._menu = menu;
    this._pointerTracker = pointerTracker;
    this._subscribeToMouseMoves();
  }

  /**
   * Calls the `doToggle` callback when it is deemed that the user is not moving towards
   * the submenu.
   *
   * 当认为用户没有向子菜单移动时调用 `doToggle` 回调。
   *
   * @param doToggle the function called when the user is not moving towards the submenu.
   *
   * 当用户没有移向子菜单时要调用的函数。
   *
   */
  toggle(doToggle: () => void) {
    // If the menu is horizontal the sub-menus open below and there is no risk of premature
    // closing of any sub-menus therefore we automatically resolve the callback.
    if (this._menu.orientation === 'horizontal') {
      doToggle();
    }

    this._checkConfigured();

    const siblingItemIsWaiting = !!this._timeoutId;
    const hasPoints = this._points.length > 1;

    if (hasPoints && !siblingItemIsWaiting) {
      if (this._isMovingToSubmenu()) {
        this._startTimeout(doToggle);
      } else {
        doToggle();
      }
    } else if (!siblingItemIsWaiting) {
      doToggle();
    }
  }

  /**
   * Start the delayed toggle handler if one isn't running already.
   *
   * 如果尚未运行延迟切换处理程序，则启动延迟切换处理程序。
   *
   * The delayed toggle handler executes the `doToggle` callback after some period of time iff the
   * users mouse is on an item in the current menu.
   *
   * 如果用户鼠标位于当前菜单中的某个菜单项上，延迟切换处理程序会在一段时间后执行 `doToggle` 回调。
   *
   * @param doToggle the function called when the user is not moving towards the submenu.
   *
   * 当用户没有移向子菜单时要调用的函数。
   *
   */
  private _startTimeout(doToggle: () => void) {
    // If the users mouse is moving towards a submenu we don't want to immediately resolve.
    // Wait for some period of time before determining if the previous menu should close in
    // cases where the user may have moved towards the submenu but stopped on a sibling menu
    // item intentionally.
    const timeoutId = setTimeout(() => {
      // Resolve if the user is currently moused over some element in the root menu
      if (this._pointerTracker!.activeElement && timeoutId === this._timeoutId) {
        doToggle();
      }
      this._timeoutId = null;
    }, CLOSE_DELAY) as any as number;

    this._timeoutId = timeoutId;
  }

  /**
   * Whether the user is heading towards the open submenu.
   *
   * 用户是否正在前往打开的子菜单。
   *
   */
  private _isMovingToSubmenu() {
    const submenuPoints = this._getSubmenuBounds();
    if (!submenuPoints) {
      return false;
    }

    let numMoving = 0;
    const currPoint = this._points[this._points.length - 1];
    // start from the second last point and calculate the slope between each point and the last
    // point.
    for (let i = this._points.length - 2; i >= 0; i--) {
      const previous = this._points[i];
      const slope = getSlope(currPoint, previous);
      if (isWithinSubmenu(submenuPoints, slope, getYIntercept(currPoint, slope))) {
        numMoving++;
      }
    }
    return numMoving >= Math.floor(NUM_POINTS / 2);
  }

  /**
   * Get the bounding DOMRect for the open submenu.
   *
   * 获取打开的子菜单的边界 DOMRect。
   *
   */
  private _getSubmenuBounds(): DOMRect | undefined {
    return this._pointerTracker?.previousElement?.getMenu()?.nativeElement.getBoundingClientRect();
  }

  /**
   * Check if a reference to the PointerFocusTracker and menu element is provided.
   *
   * 检查是否提供了对 PointerFocusTracker 和菜单元素的引用。
   *
   * @throws an error if neither reference is provided.
   *
   * 如果没有提供参考，则会出错。
   *
   */
  private _checkConfigured() {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!this._pointerTracker) {
        throwMissingPointerFocusTracker();
      }
      if (!this._menu) {
        throwMissingMenuReference();
      }
    }
  }

  /**
   * Subscribe to the root menus mouse move events and update the tracked mouse points.
   *
   * 订阅根菜单鼠标移动事件并更新跟踪的鼠标点。
   *
   */
  private _subscribeToMouseMoves() {
    this._ngZone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(this._menu.nativeElement, 'mousemove')
        .pipe(
          filter((_: MouseEvent, index: number) => index % MOUSE_MOVE_SAMPLE_FREQUENCY === 0),
          takeUntil(this._destroyed),
        )
        .subscribe((event: MouseEvent) => {
          this._points.push({x: event.clientX, y: event.clientY});
          if (this._points.length > NUM_POINTS) {
            this._points.shift();
          }
        });
    });
  }
}

/**
 * CdkTargetMenuAim is a provider for the TargetMenuAim service. It can be added to an
 * element with either the `cdkMenu` or `cdkMenuBar` directive and child menu items.
 *
 * CdkTargetMenuAim 是 TargetMenuAim 服务的提供者。它可以通过 `cdkMenu` 或 `cdkMenuBar` 指令和子菜单项添加到元素中。
 *
 */
@Directive({
  selector: '[cdkTargetMenuAim]',
  exportAs: 'cdkTargetMenuAim',
  standalone: true,
  providers: [{provide: MENU_AIM, useClass: TargetMenuAim}],
})
export class CdkTargetMenuAim {}
