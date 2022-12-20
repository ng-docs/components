# MapMarkerClusterer

# MapMarkerClusterer（地图标记簇）

The `MapMarkerClusterer` component wraps the [`MarkerClusterer` class](https://googlemaps.github.io/js-markerclustererplus/classes/markerclusterer.html) from the [Google Maps JavaScript MarkerClustererPlus Library](https://github.com/googlemaps/js-markerclustererplus). The `MapMarkerClusterer` component displays a cluster of markers that are children of the `<map-marker-clusterer>` tag. Unlike the other Google Maps components, MapMarkerClusterer does not have an `options` input, so any input (listed in the [documentation](https://googlemaps.github.io/js-markerclustererplus/index.html) for the `MarkerClusterer` class) should be set directly.

这个 `MapMarkerClusterer` 组件包装了来自 [Google Maps JavaScript MarkerClustererPlus 库中](https://github.com/googlemaps/js-markerclustererplus)的 [`MarkerClusterer` 类](https://googlemaps.github.io/js-markerclustererplus/classes/markerclusterer.html)。`MapMarkerClusterer` 组件会显示一组标记，它们是 `<map-marker-clusterer>` 标记的子标记。与其他 Google Maps 组件不同，MapMarkerClusterer 没有输入属性 `options`，所以任何输入属性（列在 `MarkerClusterer` 类的[文档](https://googlemaps.github.io/js-markerclustererplus/index.html)中）都应直接设置。

## Loading the Library

## 加载这个库

Like the Google Maps JavaScript API, the MarkerClustererPlus library needs to be loaded separately. This can be accomplished by using this script tag:

像 Google Maps JavaScript API 一样，MarkerClustererPlus 库需要单独加载。这可以通过下列脚本来完成：

```html
<script src="https://unpkg.com/@googlemaps/markerclustererplus/dist/index.min.js"></script>
```

Additional information can be found by looking at [Marker Clustering](https://developers.google.com/maps/documentation/javascript/marker-clustering) in the Google Maps JavaScript API documentation.

通过查看 Google Maps JavaScript API 文档中的 [“标记簇”](https://developers.google.com/maps/documentation/javascript/marker-clustering)，可以找到更多信息。

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
  markerPositions: google.maps.LatLngLiteral[] = [];
  markerClustererImagePath =
      'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m';

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
  <map-marker-clusterer [imagePath]="markerClustererImagePath">
    <map-marker *ngFor="let markerPosition of markerPositions"
                [position]="markerPosition"></map-marker>
  </map-marker-clusterer>
</google-map>
```
