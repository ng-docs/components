# MapGeocoder

# MapGeocoder（地图地理编码器）

The `MapGeocoder`, like the `google.maps.Geocoder`, has a single method, `geocode`. Normally, the
`google.maps.Geocoder` takes two arguments, a `google.maps.GeocoderRequest` and a callback that
takes the `google.maps.GeocoderResult` and `google.maps.GeocoderStatus` as arguments.
The `MapGeocoder.geocode` method takes the `google.maps.GeocoderRequest` as the single
argument, and returns an `Observable` of a `MapGeocoderResponse`, which is an interface defined as
follows:

`MapGeocoder` 与 `google.maps.Geocoder` 一样，只有一个方法 `geocode` 。通常， `google.maps.Geocoder` 接受两个参数，一个 `google.maps.GeocoderRequest` 和一个将 `google.maps.GeocoderResult` 和 `google.maps.GeocoderStatus` 作为参数的回调。 `MapGeocoder.geocode` 方法以 `google.maps.GeocoderRequest` 作为单个参数，并返回一个 `MapGeocoderResponse` 的 `Observable` ，它的接口定义如下：

```typescript
export interface MapGeocoderResponse {
  status: google.maps.GeocoderStatus;
  results: google.maps.GeocoderResult[];
}
```

## Loading the Library

## 加载库

Using the `MapGeocoder` requires the Geocoding API to be enabled in Google Cloud Console on the
same project as the one set up for the Google Maps JavaScript API, and requires an API key that
has billing enabled. See [here](https://developers.google.com/maps/documentation/javascript/geocoding#GetStarted) for details.

使用 `MapGeocoder` 需要在与设置 Google Maps JavaScript API 的项目相同的项目上的 Google Cloud Console 中启用 Geocoding API，并且需要一个已启用计费的 API 密钥。有关详细信息，请参见[此处](https://developers.google.com/maps/documentation/javascript/geocoding#GetStarted)。

## Example

## 例子

```typescript
// google-maps-demo.component.ts
import {Component} from '@angular/core';
import {MapGeocoder} from '@angular/google-maps';

@Component({
  selector: 'google-map-demo',
  templateUrl: 'google-map-demo.html',
})
export class GoogleMapDemo {
  constructor(geocoder: MapGeocoder) {
    geocoder.geocode({
      address: '1600 Amphitheatre Parkway, Mountain View, CA'
    }).subscribe(({results}) => {
      console.log(results);
    });
  }
}
```
