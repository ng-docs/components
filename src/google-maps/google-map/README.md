# GoogleMap

# 谷歌地图

The `GoogleMap` component wraps the [`google.maps.Map` class](https://developers.google.com/maps/documentation/javascript/reference/map) from the Google Maps JavaScript API. You can configure the map via the component's inputs. The `options` input accepts a full [`google.maps.MapOptions` object](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions), and the component additionally offers convenience inputs for setting the `center` and `zoom` of the map without needing an entire `google.maps.MapOptions` object. The `height` and `width` inputs accept a string to set the size of the Google map. [Events](https://developers.google.com/maps/documentation/javascript/reference/map#Map.bounds_changed) can be bound using the outputs of the `GoogleMap` component, although events have the same name as native mouse events (e.g. `mouseenter`) have been prefixed with "map" as to not collide with the native mouse events. Other members on the `google.maps.Map` object are available on the `GoogleMap` component and can be accessed using the [`ViewChild` decorator](https://angular.io/api/core/ViewChild).

`GoogleMap` 组件包装了来自 Google Maps JavaScript API 的 [`google.maps.Map`](https://developers.google.com/maps/documentation/javascript/reference/map) 类。你可以通过该组件的输入属性配置此地图。输入属性 `options` 接受一个完整的 [`google.maps.MapOptions` 对象](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions)，该组件还提供了方便的输入方式，用于设置此地图的 `center` 和 `zoom`，而不需要整个 `google.maps.MapOptions` 对象。输入属性 `height` 和 `width` 接受一个字符串来设置 Google 地图的大小。[事件](https://developers.google.com/maps/documentation/javascript/reference/map#Map.bounds_changed)可以绑定到 `GoogleMap` 组件的输出，虽然事件的名字与原生鼠标事件（例如 `mouseenter` ）同名，但带有 `map` 前缀，以免与原生鼠标事件冲突。`google.maps.Map` 对象上的其它成员可以在 `GoogleMap` 组件上找到，并通过 [`ViewChild` 装饰器](https://angular.cn/api/core/ViewChild)进行访问。

## Example

## 例子

```typescript
// google-maps-demo.module.ts

import {NgModule} from '@angular/core';
import {GoogleMapsModule} from '@angular/google-maps';

import {GoogleMapDemo} from './google-map-demo';

@NgModule({
  imports: [
    GoogleMapsModule,
  ],
  declarations: [GoogleMapDemo],
})
export class GoogleMapDemoModule {
}

// google-maps-demo.component.ts
import {Component} from '@angular/core';

@Component({
  selector: 'google-map-demo',
  templateUrl: 'google-map-demo.html',
})
export class GoogleMapDemo {

  center: google.maps.LatLngLiteral = {lat: 24, lng: 12};
  zoom = 4;
  display: google.maps.LatLngLiteral;

  moveMap(event: google.maps.MapMouseEvent) {
    this.center = (event.latLng.toJSON());
  }

  move(event: google.maps.MapMouseEvent) {
    this.display = event.latLng.toJSON();
  }
}
```

```html
<!-- google-maps-demo.component.html -->
<google-map height="400px"
            width="750px"
            [center]="center"
            [zoom]="zoom"
            (mapClick)="moveMap($event)"
            (mapMousemove)="move($event)">
</google-map>

<div>Latitude: {{display?.lat}}</div>
<div>Longitude: {{display?.lng}}</div>
```
