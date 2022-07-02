/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Workaround for: https://github.com/bazelbuild/rules_nodejs/issues/1265
/// <reference types="google.maps" />

import {Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {map, take, takeUntil} from 'rxjs/operators';

import {GoogleMap} from '../google-map/google-map';
import {MapEventManager} from '../map-event-manager';
import {MapAnchorPoint} from '../map-anchor-point';

/**
 * Angular component that renders a Google Maps info window via the Google Maps JavaScript API.
 *
 * 通过 Google Maps JavaScript API 渲染 Google Maps 信息窗口的 Angular 组件。
 *
 * See developers.google.com/maps/documentation/javascript/reference/info-window
 *
 * 请参阅 developers.google.com/maps/documentation/javascript/reference/info-window
 *
 */
@Directive({
  selector: 'map-info-window',
  exportAs: 'mapInfoWindow',
  host: {'style': 'display: none'},
})
export class MapInfoWindow implements OnInit, OnDestroy {
  private _eventManager = new MapEventManager(this._ngZone);
  private readonly _options = new BehaviorSubject<google.maps.InfoWindowOptions>({});
  private readonly _position = new BehaviorSubject<
    google.maps.LatLngLiteral | google.maps.LatLng | undefined
  >(undefined);
  private readonly _destroy = new Subject<void>();

  /**
   * Underlying google.maps.InfoWindow
   *
   * 基础 google.maps.InfoWindow
   *
   * See developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow
   *
   * 请参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow
   *
   */
  infoWindow?: google.maps.InfoWindow;

  @Input()
  set options(options: google.maps.InfoWindowOptions) {
    this._options.next(options || {});
  }

  @Input()
  set position(position: google.maps.LatLngLiteral | google.maps.LatLng) {
    this._position.next(position);
  }

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.closeclick
   *
   * 请参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.closeclick
   *
   */
  @Output() readonly closeclick: Observable<void> =
    this._eventManager.getLazyEmitter<void>('closeclick');

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.content_changed
   *
   * 参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.content_changed
   *
   */
  @Output() readonly contentChanged: Observable<void> =
    this._eventManager.getLazyEmitter<void>('content_changed');

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.domready
   *
   * 参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.domready
   */
  @Output() readonly domready: Observable<void> =
    this._eventManager.getLazyEmitter<void>('domready');

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.position_changed
   *
   * 参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.position_changed
   *
   */
  @Output() readonly positionChanged: Observable<void> =
    this._eventManager.getLazyEmitter<void>('position_changed');

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.zindex_changed
   *
   * 参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.zindex_changed
   *
   */
  @Output() readonly zindexChanged: Observable<void> =
    this._eventManager.getLazyEmitter<void>('zindex_changed');

  constructor(
    private readonly _googleMap: GoogleMap,
    private _elementRef: ElementRef<HTMLElement>,
    private _ngZone: NgZone,
  ) {}

  ngOnInit() {
    if (this._googleMap._isBrowser) {
      const combinedOptionsChanges = this._combineOptions();

      combinedOptionsChanges.pipe(take(1)).subscribe(options => {
        // Create the object outside the zone so its events don't trigger change detection.
        // We'll bring it back in inside the `MapEventManager` only for the events that the
        // user has subscribed to.
        this._ngZone.runOutsideAngular(() => {
          this.infoWindow = new google.maps.InfoWindow(options);
        });

        this._eventManager.setTarget(this.infoWindow);
      });

      this._watchForOptionsChanges();
      this._watchForPositionChanges();
    }
  }

  ngOnDestroy() {
    this._eventManager.destroy();
    this._destroy.next();
    this._destroy.complete();

    // If no info window has been created on the server, we do not try closing it.
    // On the server, an info window cannot be created and this would cause errors.
    if (this.infoWindow) {
      this.close();
    }
  }

  /**
   * See developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.close
   *
   * 请参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.close
   *
   */
  close() {
    this._assertInitialized();
    this.infoWindow.close();
  }

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.getContent
   *
   * 请参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.getContent
   *
   */
  getContent(): string | Node | null {
    this._assertInitialized();
    return this.infoWindow.getContent() || null;
  }

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.getPosition
   *
   * 参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.getPosition
   *
   */
  getPosition(): google.maps.LatLng | null {
    this._assertInitialized();
    return this.infoWindow.getPosition() || null;
  }

  /**
   * See
   * developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.getZIndex
   *
   * 请参阅 developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow.getZIndex
   *
   */
  getZIndex(): number {
    this._assertInitialized();
    return this.infoWindow.getZIndex();
  }

  /**
   * Opens the MapInfoWindow using the provided anchor. If the anchor is not set,
   * then the position property of the options input is used instead.
   *
   * 使用提供的锚点打开 MapInfoWindow。如果未设置锚点，那么将使用选项输入的 position 属性。
   *
   */
  open(anchor?: MapAnchorPoint, shouldFocus?: boolean) {
    this._assertInitialized();
    const anchorObject = anchor ? anchor.getAnchor() : undefined;

    // Prevent the info window from initializing when trying to reopen on the same anchor.
    // Note that when the window is opened for the first time, the anchor will always be
    // undefined. If that's the case, we have to allow it to open in order to handle the
    // case where the window doesn't have an anchor, but is placed at a particular position.
    if (this.infoWindow.get('anchor') !== anchorObject || !anchorObject) {
      this._elementRef.nativeElement.style.display = '';

      // The config is cast to `any`, because the internal typings are out of date.
      this.infoWindow.open({
        map: this._googleMap.googleMap,
        anchor: anchorObject,
        shouldFocus,
      } as any);
    }
  }

  private _combineOptions(): Observable<google.maps.InfoWindowOptions> {
    return combineLatest([this._options, this._position]).pipe(
      map(([options, position]) => {
        const combinedOptions: google.maps.InfoWindowOptions = {
          ...options,
          position: position || options.position,
          content: this._elementRef.nativeElement,
        };
        return combinedOptions;
      }),
    );
  }

  private _watchForOptionsChanges() {
    this._options.pipe(takeUntil(this._destroy)).subscribe(options => {
      this._assertInitialized();
      this.infoWindow.setOptions(options);
    });
  }

  private _watchForPositionChanges() {
    this._position.pipe(takeUntil(this._destroy)).subscribe(position => {
      if (position) {
        this._assertInitialized();
        this.infoWindow.setPosition(position);
      }
    });
  }

  private _assertInitialized(): asserts this is {infoWindow: google.maps.InfoWindow} {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!this._googleMap.googleMap) {
        throw Error(
          'Cannot access Google Map information before the API has been initialized. ' +
            'Please wait for the API to load before trying to interact with it.',
        );
      }
      if (!this.infoWindow) {
        throw Error(
          'Cannot interact with a Google Map Info Window before it has been ' +
            'initialized. Please wait for the Info Window to load before trying to interact with ' +
            'it.',
        );
      }
    }
  }
}
