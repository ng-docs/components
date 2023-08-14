# Angular Google Maps component

# Angular Google Maps 组件

This component provides a Google Maps Angular component that implements the
[Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/tutorial).
File any bugs against the [angular/components repo](https://github.com/angular/components/issues).

该组件提供了一个用于实现 [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/tutorial) 的 Google Maps Angular 组件。请到 [angular/components 仓库提交](https://github.com/angular/components/issues)任何 BUG。

## Installation

## 安装

To install, run `npm install @angular/google-maps`.

## Getting the API Key

## 获取 API 秘钥

Follow [these steps](https://developers.google.com/maps/gmp-get-started) to get an API key that can be used to load Google Maps.

按照[以下步骤操作](https://developers.google.com/maps/gmp-get-started)，获取可用于加载 Google 地图的 API 密钥。

## Loading the API

The API can be loaded when the component is actually used by using the Angular HttpClient jsonp
method to make sure that the component doesn't load until after the API has loaded.

当实际使用组件时，可以通过使用 Angular HttpClient 的 jsonp 方法来加载此 API，以确保该组件会在 API 加载完之后再加载。

```typescript
// google-maps-demo.module.ts

import { NgModule } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

import { GoogleMapsDemoComponent } from './google-maps-demo.component';

@NgModule({
  declarations: [
    GoogleMapsDemoComponent,
  ],
  imports: [
    CommonModule,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule,
  ],
  exports: [
    GoogleMapsDemoComponent,
  ],
})
export class GoogleMapsDemoModule {}

// google-maps-demo.component.ts

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'google-maps-demo',
  templateUrl: './google-maps-demo.component.html',
})
export class GoogleMapsDemoComponent {
  apiLoaded: Observable<boolean>;

  constructor(httpClient: HttpClient) {
    // If you're using the `<map-heatmap-layer>` directive, you also have to include the `visualization` library 
    // when loading the Google Maps API. To do so, you can add `&libraries=visualization` to the script URL:
    // https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization

    this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=YOUR_KEY_HERE', 'callback')
        .pipe(
          map(() => true),
          catchError(() => of(false)),
        );
  }
}
```

```html
<!-- google-maps-demo.component.html -->

<div *ngIf="apiLoaded | async">
  <google-map></google-map>
</div>
```

## Components

## 组件

- [`GoogleMap`](./google-map/README.md)
- [`MapMarker`](./map-marker/README.md)
- [`MapInfoWindow`](./map-info-window/README.md)
- [`MapPolyline`](./map-polyline/README.md)
- [`MapPolygon`](./map-polygon/README.md)
- [`MapRectangle`](./map-rectangle/README.md)
- [`MapCircle`](./map-circle/README.md)
- [`MapGroundOverlay`](./map-ground-overlay/README.md)
- [`MapKmlLayer`](./map-kml-layer/README.md)
- [`MapTrafficLayer`](./map-traffic-layer/README.md)
- [`MapTransitLayer`](./map-transit-layer/README.md)
- [`MapBicyclingLayer`](./map-bicycling-layer/README.md)
- [`MapDirectionsRenderer`](./map-directions-renderer/README.md)
- [`MapHeatmapLayer`](./map-heatmap-layer/README.md)

## Services

## 服务

- [`MapGeocoder`](./map-geocoder/README.md)

## The Options Input

## 输入属性 `options`

The Google Maps components implement all of the options for their respective objects from the
Google Maps JavaScript API through an `options` input, but they also have specific inputs for some
of the most common options. For example, the Google Maps component could have its options set either
in with a google.maps.MapOptions object:

Google Maps 组件通过输入属性 `options` 为 Google Maps JavaScript API 中的所有选项实现了相应的对象，但它们也为一些最常用的选项提供了专门的输入属性。例如，Google Maps 组件可以使用 google.maps.MapOptions 对象设置其选项：

```html
<google-map [options]="options"></google-map>
```

```typescript
options: google.maps.MapOptions = {
  center: {lat: 40, lng: -20},
  zoom: 4
};
```

It can also have individual options set for some of the most common options:

也可以为一些最常用的选项设置一些单独的选项：

```html
<google-map [center]="center"
            [zoom]="zoom"></google-map>
```

```typescript
center: google.maps.LatLngLiteral = {lat: 40, lng: -20};
zoom = 4;
```

Not every option has its own input. See the API for each component to see if the option has a
dedicated input or if it should be set in the options input.

并非每个选项都有自己的输入属性。查看每个组件的 API，了解该选项是否具有专用输入属性，还是应该在输入属性 options 中进行设置。
