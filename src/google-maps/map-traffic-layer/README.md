# MapTrafficLayer

# MapTrafficLayer（地图交通指挥层）

The `MapTrafficLayer` component wraps the [`google.maps.TrafficLayer` class](https://developers.google.com/maps/documentation/javascript/reference/map#TrafficLayer) from the Google Maps JavaScript API. `autoRefresh` is true by default.

`MapTrafficLayer` 组件包装了来自 Google Maps JavaScript API 中的 [`google.maps.TrafficLayer`](https://developers.google.com/maps/documentation/javascript/reference/map#TrafficLayer)  类。其 `autoRefresh` 属性默认为 true。

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
}
```

```html
<!-- google-maps-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom">
  <map-traffic-layer [autoRefresh]="false"></map-traffic-layer>
</google-map>
```
