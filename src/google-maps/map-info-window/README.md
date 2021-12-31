## MapInfoWindow

## MapInfoWindow（地图信息窗口）

The `MapInfoWindow` component wraps the [`google.maps.InfoWindow` class](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow) from the Google Maps JavaScript API. The `MapInfoWindow` has an `options` input as well as a convenience `position` input. Content for the `MapInfoWindow` is the inner HTML of the component, and will keep the structure and css styling of any content that is put there when it is displayed as an info window on the map.

这个 `MapInfoWindow` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.InfoWindow`](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindow) 类。`MapInfoWindow` 还有一个输入属性 `options` 和一个便利输入属性 `position`。`MapInfoWindow` 的内容是该组件的内部 HTML，当它在地图上显示为一个信息窗口时，会保留所有内容的结构和 CSS 样式。

To display the `MapInfoWindow`, it must be a child of a `GoogleMap` component, and it must have its `open` method called, so a reference to `MapInfoWindow` will need to be loaded using the [`ViewChild` decorator](https://angular.io/api/core/ViewChild). The `open` method accepts an `MapMarker` as an optional input, if you want to anchor the `MapInfoWindow` to a `MapMarker`.

要显示 `MapInfoWindow`，它必须是 `GoogleMap` 组件的子组件，并且必须有一个名叫 `open` 的方法，所以对 `MapInfoWindow` 的引用需要使用 [`ViewChild` 装饰器](https://angular.cn/api/core/ViewChild)进行加载。如果你想把这个 `MapInfoWindow` 锚定到 `MapMarker`，可以给 `open` 方法传入一个 `MapMarker` 作为可选输入。

## Example

## 例子

```typescript
// google-maps-demo.component.ts
import {Component, ViewChild} from '@angular/core';
import {MapInfoWindow, MapMarker} from '@angular/google-maps';

@Component({
  selector: 'google-map-demo',
  templateUrl: 'google-map-demo.html',
})
export class GoogleMapDemo {
  @ViewChild(MapInfoWindow) infoWindow: MapInfoWindow;

  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  markerPositions: google.maps.LatLngLiteral[] = [];
  zoom = 4;

  addMarker(event: google.maps.MapMouseEvent) {
    this.markerPositions.push(event.latLng.toJSON());
  }

  openInfoWindow(marker: MapMarker) {
    this.infoWindow.open(marker);
  }
}
```

```html
<!-- google-maps-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom"
            (mapClick)="addMarker($event)">
  <map-marker #marker="mapMarker"
              *ngFor="let markerPosition of markerPositions"
              [position]="markerPosition"
              (mapClick)="openInfoWindow(marker)"></map-marker>
  <map-info-window>Info Window content</map-info-window>
</google-map>
```
