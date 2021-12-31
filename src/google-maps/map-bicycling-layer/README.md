# MapBicyclingLayer

# MapBicyclingLayer（地图自行车层）

The `MapBicyclingLayer` component wraps the [`google.maps.BicyclingLayer` class](https://developers.google.com/maps/documentation/javascript/reference/map#BicyclingLayer) from the Google Maps JavaScript API.

这个 `MapBicyclingLayer` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.BicyclingLayer`](https://developers.google.com/maps/documentation/javascript/reference/map#BicyclingLayer) 类。

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
  <map-bicycling-layer></map-bicycling-layer>
</google-map>
```
