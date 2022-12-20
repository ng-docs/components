# Angular YouTube Player component

# Angular 的 YouTube 播放器组件

This component provides a simple angular wrapper around the embed [YouTube player API](https://developers.google.com/youtube/iframe_api_reference). File any bugs against the [angular/components repo](https://github.com/angular/components/issues).

该组件为内嵌 [YouTube 播放器 API](https://developers.google.com/youtube/iframe_api_reference) 提供了一个简单的 Angular 包装器。如果发现任何 BUG 请提交到 [angular/components 仓库](https://github.com/angular/components/issues)。

## Installation

## 安装

To install, run `npm install @angular/youtube-player`.

要安装它，请运行 `npm install @angular/youtube-player`。

## Usage

## 用法

Follow the following instructions for setting up the YouTube player component:

请遵循以下步骤设置 YouTube 播放器组件：

- First, follow the [instructions for installing the API script](https://developers.google.com/youtube/iframe_api_reference#Getting_Started).

  首先，按照[安装 API 脚本的说明](https://developers.google.com/youtube/iframe_api_reference#Getting_Started)进行操作。

- Then make sure the API is available before bootstrapping the YouTube Player component.

  然后，在启动 YouTube Player 组件之前，请确保该 API 已然可用。

- Provide the video id by extracting it from the video URL.

  提供从视频网址中提取出来的视频 ID。

## Example

## 例子

If your video is found at https://www.youtube.com/watch?v=PRQCAL_RMVo, then your video id is `PRQCAL_RMVo`.

如果你的视频是在 https://www.youtube.com/watch?v=PRQCAL_RMVo 上找到的，那么你的视频 ID 就是 `PRQCAL_RMVo`。

```typescript
// example-module.ts
import {NgModule, Component, OnInit} from '@angular/core';
import {YouTubePlayerModule} from '@angular/youtube-player';

@NgModule({
  imports: [YouTubePlayerModule],
  declarations: [YoutubePlayerExample],
})
export class YoutubePlayerExampleModule {
}

let apiLoaded = false;

// example-component.ts
@Component({
  template: '<youtube-player videoId="PRQCAL_RMVo"></youtube-player>',
  selector: 'youtube-player-example',
})
class YoutubePlayerExample implements OnInit {
  ngOnInit() {
    if (!apiLoaded) {
      // This code loads the IFrame Player API code asynchronously, according to the instructions at
      // https://developers.google.com/youtube/iframe_api_reference#Getting_Started
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      apiLoaded = true;
    }
  }
}
```

## API

Check out the [source](./youtube-player.ts) to read the API.

查看[源代码](./youtube-player.ts)来阅读此 API。
