/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Workaround for: https://github.com/bazelbuild/rules_nodejs/issues/1265
/// <reference types="googlemaps" />

import {
  Input,
  OnDestroy,
  OnInit,
  NgZone,
  Directive,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import {GoogleMap} from '../google-map/google-map';

/**
 * Possible data that can be shown on a heatmap layer.
 *
 * 可以在热力图图层上显示的可能数据。
 *
 */
export type HeatmapData =
  google.maps.MVCArray<
    google.maps.LatLng | google.maps.visualization.WeightedLocation | google.maps.LatLngLiteral> |
  (google.maps.LatLng | google.maps.visualization.WeightedLocation | google.maps.LatLngLiteral)[];


/**
 * Angular directive that renders a Google Maps heatmap via the Google Maps JavaScript API.
 *
 * 通过 Google Maps JavaScript API 渲染 Google Maps 热力图的 Angular 指令。
 *
 * See: <https://developers.google.com/maps/documentation/javascript/reference/visualization>
 *
 * 请参阅： <https://developers.google.com/maps/documentation/javascript/reference/visualization>
 *
 */
@Directive({
  selector: 'map-heatmap-layer',
  exportAs: 'mapHeatmapLayer',
})
export class MapHeatmapLayer implements OnInit, OnChanges, OnDestroy {
  /**
   * Data shown on the heatmap.
   * See: <https://developers.google.com/maps/documentation/javascript/reference/visualization>
   *
   * 数据显示在热力图上。请参阅： <https://developers.google.com/maps/documentation/javascript/reference/visualization>
   *
   */
  @Input()
  set data(data: HeatmapData) {
    this._data = data;
  }
  private _data: HeatmapData;

  /**
   * Options used to configure the heatmap. See:
   * developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions
   *
   * 用于配置热力图的选项。请参阅：developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions
   *
   */
  @Input()
  set options(options: Partial<google.maps.visualization.HeatmapLayerOptions>) {
    this._options = options;
  }
  private _options: Partial<google.maps.visualization.HeatmapLayerOptions>;

  /**
   * The underlying google.maps.visualization.HeatmapLayer object.
   *
   * 基础 google.maps.visualization.HeatmapLayer 对象。
   *
   * See: <https://developers.google.com/maps/documentation/javascript/reference/visualization>
   *
   * 请参阅： <https://developers.google.com/maps/documentation/javascript/reference/visualization>
   *
   */
  heatmap?: google.maps.visualization.HeatmapLayer;

  constructor(
    private readonly _googleMap: GoogleMap,
    private _ngZone: NgZone) {}

  ngOnInit() {
    if (this._googleMap._isBrowser) {
      if (!window.google?.maps?.visualization && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw Error(
            'Namespace `google.maps.visualization` not found, cannot construct heatmap. ' +
            'Please install the Google Maps JavaScript API with the "visualization" library: ' +
            'https://developers.google.com/maps/documentation/javascript/visualization');
      }

      // Create the object outside the zone so its events don't trigger change detection.
      // We'll bring it back in inside the `MapEventManager` only for the events that the
      // user has subscribed to.
      this._ngZone.runOutsideAngular(() => {
        this.heatmap = new google.maps.visualization.HeatmapLayer(this._combineOptions());
      });
      this._assertInitialized();
      this.heatmap.setMap(this._googleMap.googleMap!);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    const {_data, heatmap} = this;

    if (heatmap) {
      if (changes['options']) {
        heatmap.setOptions(this._combineOptions());
      }

      if (changes['data'] && _data !== undefined) {
        heatmap.setData(this._normalizeData(_data));
      }
    }
  }

  ngOnDestroy() {
    if (this.heatmap) {
      this.heatmap.setMap(null);
    }
  }

  /**
   * Gets the data that is currently shown on the heatmap.
   * See: developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayer
   *
   * 获取当前在热力图上显示的数据。请参阅：developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayer
   *
   */
  getData(): HeatmapData {
    this._assertInitialized();
    return this.heatmap.getData();
  }

  /**
   * Creates a combined options object using the passed-in options and the individual inputs.
   *
   * 使用传入的选项和各个输入属性来创建组合的选项对象。
   *
   */
  private _combineOptions(): google.maps.visualization.HeatmapLayerOptions {
    const options = this._options || {};
    return {
      ...options,
      data: this._normalizeData(this._data || options.data || []),
      map: this._googleMap.googleMap,
    };
  }

  /**
   * Most Google Maps APIs support both `LatLng` objects and `LatLngLiteral`. The latter is more
   * convenient to write out, because the Google Maps API doesn't have to have been loaded in order
   * to construct them. The `HeatmapLayer` appears to be an exception that only allows a `LatLng`
   * object, or it throws a runtime error. Since it's more convenient and we expect that Angular
   * users will load the API asynchronously, we allow them to pass in a `LatLngLiteral` and we
   * convert it to a `LatLng` object before passing it off to Google Maps.
   *
   * 大多数 Google Maps API 都支持 `LatLng` 对象和 `LatLngLiteral`。后者更方便写出来，因为不必构造 Google Maps API。`HeatmapLayer` 似乎是一个例外，它仅允许 `LatLng` 对象，否则会引发运行时错误。由于它更加方便，并且我们希望 Angular 用户将异步加载该 API，因此我们允许他们传递 LatLngLiteral 并将其转换为 `LatLng` 对象，然后把它传给 Google Maps。
   *
   */
  private _normalizeData(data: HeatmapData) {
    const result: (google.maps.LatLng|google.maps.visualization.WeightedLocation)[] = [];

    data.forEach(item => {
      result.push(isLatLngLiteral(item) ? new google.maps.LatLng(item.lat, item.lng) : item);
    });

    return result;
  }

  /**
   * Asserts that the heatmap object has been initialized.
   *
   * 断言热力图对象已初始化。
   *
   */
  private _assertInitialized(): asserts this is {heatmap: google.maps.visualization.HeatmapLayer} {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!this._googleMap.googleMap) {
        throw Error(
            'Cannot access Google Map information before the API has been initialized. ' +
            'Please wait for the API to load before trying to interact with it.');
      }
      if (!this.heatmap) {
        throw Error(
            'Cannot interact with a Google Map HeatmapLayer before it has been ' +
            'initialized. Please wait for the heatmap to load before trying to interact with it.');
      }
    }
  }
}

/**
 * Asserts that an object is a `LatLngLiteral`.
 *
 * 断言一个对象是 `LatLngLiteral`。
 *
 */
function isLatLngLiteral(value: any): value is google.maps.LatLngLiteral {
  return value && typeof value.lat === 'number' && typeof value.lng === 'number';
}
