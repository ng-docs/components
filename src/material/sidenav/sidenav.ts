/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  forwardRef,
  Inject,
  Input,
  ViewEncapsulation,
  QueryList,
  ElementRef,
  NgZone,
} from '@angular/core';
import {MatDrawer, MatDrawerContainer, MatDrawerContent, MAT_DRAWER_CONTAINER} from './drawer';
import {matDrawerAnimations} from './drawer-animations';
import {
  BooleanInput,
  coerceBooleanProperty,
  coerceNumberProperty,
  NumberInput,
} from '@angular/cdk/coercion';
import {ScrollDispatcher, CdkScrollable} from '@angular/cdk/scrolling';

@Component({
  selector: 'mat-sidenav-content',
  template: '<ng-content></ng-content>',
  host: {
    'class': 'mat-drawer-content mat-sidenav-content',
    '[style.margin-left.px]': '_container._contentMargins.left',
    '[style.margin-right.px]': '_container._contentMargins.right',
    'ngSkipHydration': '',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: CdkScrollable,
      useExisting: MatSidenavContent,
    },
  ],
})
export class MatSidenavContent extends MatDrawerContent {
  constructor(
    changeDetectorRef: ChangeDetectorRef,
    @Inject(forwardRef(() => MatSidenavContainer)) container: MatSidenavContainer,
    elementRef: ElementRef<HTMLElement>,
    scrollDispatcher: ScrollDispatcher,
    ngZone: NgZone,
  ) {
    super(changeDetectorRef, container, elementRef, scrollDispatcher, ngZone);
  }
}

@Component({
  selector: 'mat-sidenav',
  exportAs: 'matSidenav',
  templateUrl: 'drawer.html',
  animations: [matDrawerAnimations.transformDrawer],
  host: {
    'class': 'mat-drawer mat-sidenav',
    'tabIndex': '-1',
    // must prevent the browser from aligning text based on value
    '[attr.align]': 'null',
    '[class.mat-drawer-end]': 'position === "end"',
    '[class.mat-drawer-over]': 'mode === "over"',
    '[class.mat-drawer-push]': 'mode === "push"',
    '[class.mat-drawer-side]': 'mode === "side"',
    '[class.mat-drawer-opened]': 'opened',
    '[class.mat-sidenav-fixed]': 'fixedInViewport',
    '[style.top.px]': 'fixedInViewport ? fixedTopGap : null',
    '[style.bottom.px]': 'fixedInViewport ? fixedBottomGap : null',
    'ngSkipHydration': '',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatSidenav extends MatDrawer {
  /**
   * Whether the sidenav is fixed in the viewport.
   *
   * 侧边导航是否在视口中是固定的。
   *
   */
  @Input()
  get fixedInViewport(): boolean {
    return this._fixedInViewport;
  }
  set fixedInViewport(value: BooleanInput) {
    this._fixedInViewport = coerceBooleanProperty(value);
  }
  private _fixedInViewport = false;

  /**
   * The gap between the top of the sidenav and the top of the viewport when the sidenav is in fixed
   * mode.
   *
   * 当侧边导航处于固定模式时，侧边导航顶部与视口顶部之间的间隙。
   *
   */
  @Input()
  get fixedTopGap(): number {
    return this._fixedTopGap;
  }
  set fixedTopGap(value: NumberInput) {
    this._fixedTopGap = coerceNumberProperty(value);
  }
  private _fixedTopGap = 0;

  /**
   * The gap between the bottom of the sidenav and the bottom of the viewport when the sidenav is in
   * fixed mode.
   *
   * 当侧边导航处于固定模式时，侧边导航底部与视口底部之间的间隙。
   *
   */
  @Input()
  get fixedBottomGap(): number {
    return this._fixedBottomGap;
  }
  set fixedBottomGap(value: NumberInput) {
    this._fixedBottomGap = coerceNumberProperty(value);
  }
  private _fixedBottomGap = 0;
}

@Component({
  selector: 'mat-sidenav-container',
  exportAs: 'matSidenavContainer',
  templateUrl: 'sidenav-container.html',
  styleUrls: ['drawer.css'],
  host: {
    'class': 'mat-drawer-container mat-sidenav-container',
    '[class.mat-drawer-container-explicit-backdrop]': '_backdropOverride',
    'ngSkipHydration': '',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: MAT_DRAWER_CONTAINER,
      useExisting: MatSidenavContainer,
    },
  ],
})
export class MatSidenavContainer extends MatDrawerContainer {
  @ContentChildren(MatSidenav, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  // We need an initializer here to avoid a TS error.
  override _allDrawers: QueryList<MatSidenav> = undefined!;

  // We need an initializer here to avoid a TS error.
  @ContentChild(MatSidenavContent) override _content: MatSidenavContent = undefined!;
}
