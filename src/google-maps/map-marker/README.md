# MapMarker

# MapMarker（地图标记）

The `MapMarker` component wraps the [`google.maps.Marker` class](https://developers.google.com/maps/documentation/javascript/reference/marker#Marker) from the Google Maps JavaScript API. The `MapMarker` component displays a marker on the map when it is a content child of a `GoogleMap` component. Like `GoogleMap`, this component offers an `options` input as well as convenience inputs for `position`, `title`, `label`, and `clickable`, and supports all `google.maps.Marker` events as outputs.

`MapMarker` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.Marker`](https://developers.google.com/maps/documentation/javascript/reference/marker#Marker) 类。当 `MapMarker` 是 `GoogleMap` 组件的内容子组件时，就会在地图上显示一个标记。像 `GoogleMap` 一样，该组件也提供了一个输入属性 `options` 和一些便利输入属性 `position`、`title`、`label` 和 `clickable`，并把所有 `google.maps.Marker` 事件作为输出属性。

## Example

## 例子

```typescript
// google-map-demo.component.ts
import {Component} from '@angular/core';

@Component({
  selector: 'google-map-demo',
  templateUrl: 'google-map-demo.html',
})
export class GoogleMapDemo {

  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 4;
  markerOptions: google.maps.MarkerOptions = {draggable: false};
  markerPositions: google.maps.LatLngLiteral[] = [];

  addMarker(event: google.maps.MapMouseEvent) {
    this.markerPositions.push(event.latLng.toJSON());
  }
}
```

```html
<!-- google-map-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom"
            (mapClick)="addMarker($event)">
  <map-marker *ngFor="let markerPosition of markerPositions"
              [position]="markerPosition"
              [options]="markerOptions"></map-marker>
</google-map>
```
