# MapRectangle

# MapRectangle（地图矩形）

The `MapRectangle` component wraps the [`google.maps.Rectangle` class](https://developers.google.com/maps/documentation/javascript/reference/polygon#Rectangle) from the Google Maps JavaScript API.

`MapRectangle` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.Rectangle`](https://developers.google.com/maps/documentation/javascript/reference/polygon#Rectangle) 类。

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

  bounds: google.maps.LatLngBoundsLiteral = {
    east: 10,
    north: 10,
    south: -10,
    west: -10,
  };
}
```

```html
<!-- google-maps-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom">
  <map-rectangle [bounds]="bounds"></map-rectangle>
</google-map>
```
