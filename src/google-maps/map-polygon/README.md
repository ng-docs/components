# MapPolygon

# MapPolygon（地图多边形）

The `MapPolygon` component wraps the [`google.maps.Polygon` class](https://developers.google.com/maps/documentation/javascript/reference/polygon#Polygon) from the Google Maps JavaScript API.

`MapPolygon` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.Polygon`](https://developers.google.com/maps/documentation/javascript/reference/polygon#Polygon) 类。

## Example

## 例子

```typescript
// google-maps-demo.component.ts
import {Component} from '@angular/core';

@Component({
  selector: 'google-map-demo',
  templateUrl: 'google-map-demo.html',
})
export class GoogleMapDemo {
  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 4;

  vertices: google.maps.LatLngLiteral[] = [
    {lat: 13, lng: 13},
    {lat: -13, lng: 0},
    {lat: 13, lng: -13},
  ];
}
```

```html
<!-- google-maps-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom">
  <map-polygon [paths]="vertices"></map-polygon>
</google-map>
```
