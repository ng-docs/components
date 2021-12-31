# MapTransitLayer

# MapTransitLayer（地图交通层）

The `MapTransitLayer` component wraps the [`google.maps.TransitLayer` class](https://developers.google.com/maps/documentation/javascript/reference/map#TransitLayer) from the Google Maps JavaScript API.

`MapTransitLayer` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.TransitLayer`](https://developers.google.com/maps/documentation/javascript/reference/map#TransitLayer) 类。

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
  <map-transit-layer></map-transit-layer>
</google-map>
```
