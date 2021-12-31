# MapHeatmapLayer

# MapHeatmapLayer（地图热力图图层）

The `MapHeatmapLayer` directive wraps the [`google.maps.visualization.HeatmapLayer` class](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayer) from the Google Maps Visualization JavaScript API. It displays
a heatmap layer on the map when it is a content child of a `GoogleMap` component. Like `GoogleMap`,
this directive offers an `options` input as well as a convenience input for passing in the `data`
that is shown on the heatmap.

`MapHeatmapLayer` 指令包装了来自 Google Maps Visualization JavaScript API 的 [`google.maps.visualization.HeatmapLayer` 类](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayer) 。当它是 `GoogleMap` 组件的内容子级时，它会在地图上显示热力图图层。与 `GoogleMap` 一样，该指令提供了一个输入属性 `options` 和一个便利输入属性，用于传入显示在热力图上的 `data` 。

## Requirements

## 要求

In order to render a heatmap, the Google Maps JavaScript API has to be loaded with the
`visualization` library. To load the library, you have to add `&libraries=visualization` to the
script that loads the Google Maps API. E.g.

为了渲染热力图，必须使用 `visualization` 库加载 Google Maps JavaScript API。要加载库，你必须将 `&libraries=visualization` 添加到加载 Google Maps API 的脚本中。例如

**Before:**

**之前：**

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
```

**After:**

**之后：**

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization"></script>
```

More information: <https://developers.google.com/maps/documentation/javascript/heatmaplayer>

更多信息，参见 <https://developers.google.com/maps/documentation/javascript/heatmaplayer>。

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
  center = {lat: 37.774546, lng: -122.433523};
  zoom = 12;
  heatmapOptions = {radius: 5};
  heatmapData = [
    {lat: 37.782, lng: -122.447},
    {lat: 37.782, lng: -122.445},
    {lat: 37.782, lng: -122.443},
    {lat: 37.782, lng: -122.441},
    {lat: 37.782, lng: -122.439},
    {lat: 37.782, lng: -122.437},
    {lat: 37.782, lng: -122.435},
    {lat: 37.785, lng: -122.447},
    {lat: 37.785, lng: -122.445},
    {lat: 37.785, lng: -122.443},
    {lat: 37.785, lng: -122.441},
    {lat: 37.785, lng: -122.439},
    {lat: 37.785, lng: -122.437},
    {lat: 37.785, lng: -122.435}
  ];
}
```

```html
<!-- google-map-demo.component.html -->
<google-map height="400px" width="750px" [center]="center" [zoom]="zoom">
  <map-heatmap-layer [data]="heatmapData" [options]="heatmapOptions"></map-heatmap-layer>
</google-map>
```
