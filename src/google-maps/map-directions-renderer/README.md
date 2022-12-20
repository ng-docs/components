# MapDirectionsRenderer

# MapDirectionsRenderer（地图方向渲染器）

The `MapDirectionsRenderer` component wraps the [`google.maps.DirectionsRenderer` class](https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsRenderer) from the Google Maps JavaScript API. This can easily be used with the `MapDirectionsService` that wraps [`google.maps.DirectionsService`](https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsService) which is designed to be used with Angular by returning an `Observable` response and works inside the Angular Zone.

`MapDirectionsRenderer` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.DirectionsRenderer` 类](https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsRenderer)。这可以很容易地与封装了 [`google.maps.DirectionsService`](https://developers.google.com/maps/documentation/javascript/reference/directions#DirectionsService) 的 `MapDirectionsService` 一起使用，该服务旨在通过返回 `Observable` 响应体与 Angular 一起使用，并在 Angular Zone 内工作。

The `MapDirectionsService`, like the `google.maps.DirectionsService`, has a single method, `route`. Normally, the `google.maps.DirectionsService` takes two arguments, a `google.maps.DirectionsRequest` and a callback that takes the `google.maps.DirectionsResult` and `google.maps.DirectionsStatus` as arguments. The `MapDirectionsService` route method takes the `google.maps.DirectionsRequest` as the single argument, and returns an `Observable` of a `MapDirectionsResponse`, which is an interface defined as follows:

`MapDirectionsService` 与 `google.maps.DirectionsService` 一样，有一个方法 `route` 。通常， `google.maps.DirectionsService` 接受两个参数，一个 `google.maps.DirectionsRequest` 和一个将 `google.maps.DirectionsResult` 和 `google.maps.DirectionsStatus` 作为参数的回调。 `MapDirectionsService` 的 `route` 方法将 `google.maps.DirectionsRequest` 作为单个参数，并返回一个 `MapDirectionsResponse` 的 `Observable` ，它的接口定义如下：

```typescript
export interface MapDirectionsResponse {
  status: google.maps.DirectionsStatus;
  result?: google.maps.DirectionsResult;
}
```

The most common use-case for the component and class would be to use the `MapDirectionsService` to request a route between two points on the map, and then render them on the map using the `MapDirectionsRenderer`.

组件和类的最常见用例是使用 `MapDirectionsService` 请求地图上两点之间的路线，然后使用 `MapDirectionsRenderer` 在地图上渲染它们。

## Loading the Library

## 加载库

Using the `MapDirectionsService` requires the Directions API to be enabled in Google Cloud Console on the same project as the one set up for the Google Maps JavaScript API, and requires an API key that has billing enabled. See [here](https://developers.google.com/maps/documentation/javascript/directions#GetStarted) for details.

使用 `MapDirectionsService` 需要在与设置 Google Maps JavaScript API 的项目相同的项目上的 Google Cloud Console 中启用 Directions API，并且需要一个启用了计费的 API 密钥。有关详细信息，请参见[此处](https://developers.google.com/maps/documentation/javascript/directions#GetStarted)。

## Example

## 例子

```typescript
// google-maps-demo.component.ts
import {MapDirectionsService} from '@angular/google-maps';
import {Component} from '@angular/core';

@Component({
  selector: 'google-map-demo',
  templateUrl: 'google-map-demo.html',
})
export class GoogleMapDemo {
  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 4;

  readonly directionsResults$: Observable<google.maps.DirectionsResult|undefined>;

  constructor(mapDirectionsService: MapDirectionsService) {
    const request: google.maps.DirectionsRequest = {
      destination: {lat: 12, lng: 4},
      origin: {lat: 14, lng: 8},
      travelMode: google.maps.TravelMode.DRIVING
    };
    this.directionsResults$ = mapDirectionsService.route(request).pipe(map(response => response.result));
  }
}
```

```html
<!-- google-maps-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom">
  <map-directions-renderer *ngIf="(directionsResults$ | async) as directionsResults"
                           [directions]="directionsResults"></map-directions-renderer>
</google-map>
```
