# MapPolyline

# MapPolyline（地图折线）

The `MapPolyline` component wraps the [`google.maps.Polyline` class](https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline) from the Google Maps JavaScript API.

`MapPolyline` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.Polyline`](https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline) 类。

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
  <map-polyline [path]="vertices"></map-polyline>
</google-map>
```
