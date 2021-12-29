/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Workaround for: https://github.com/bazelbuild/rules_nodejs/issues/1265
/// <reference types="youtube" />

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

import {
  combineLatest,
  ConnectableObservable,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  of as observableOf,
  OperatorFunction,
  pipe,
  Subject,
  of,
  BehaviorSubject,
  fromEventPattern,
} from 'rxjs';

import {
  combineLatest as combineLatestOp,
  distinctUntilChanged,
  filter,
  map,
  publish,
  scan,
  skipWhile,
  startWith,
  take,
  takeUntil,
  withLatestFrom,
  switchMap,
  tap,
  mergeMap,
} from 'rxjs/operators';

declare global {
  interface Window {
    YT: typeof YT | undefined;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export const DEFAULT_PLAYER_WIDTH = 640;
export const DEFAULT_PLAYER_HEIGHT = 390;

// The native YT.Player doesn't expose the set videoId, but we need it for
// convenience.
interface Player extends YT.Player {
  videoId?: string;
  playerVars?: YT.PlayerVars;
}

// The player isn't fully initialized when it's constructed.
// The only field available is destroy and addEventListener.
type UninitializedPlayer = Pick<Player, 'videoId' | 'playerVars' | 'destroy' | 'addEventListener'>;

/**
 * Object used to store the state of the player if the
 * user tries to interact with the API before it has been loaded.
 *
 * 如果用户在加载 API 之前尝试与 API 进行交互，则该对象用于存储播放器的状态。
 *
 */
interface PendingPlayerState {
  playbackState?: YT.PlayerState.PLAYING | YT.PlayerState.PAUSED | YT.PlayerState.CUED;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
  seek?: {seconds: number; allowSeekAhead: boolean};
}

/**
 * Angular component that renders a YouTube player via the YouTube player
 * iframe API.
 *
 * 用于通过 YouTube 播放器的 iframe API 渲染 YouTube 播放器的 Angular 组件。
 *
 * @see https://developers.google.com/youtube/iframe_api_reference
 */
@Component({
  selector: 'youtube-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // This div is *replaced* by the YouTube player embed.
  template: '<div #youtubeContainer></div>',
})
export class YouTubePlayer implements AfterViewInit, OnDestroy, OnInit {
  /**
   * Whether we're currently rendering inside a browser.
   *
   * 我们目前是否正在浏览器中渲染。
   *
   */
  private _isBrowser: boolean;
  private readonly _youtubeContainer = new Subject<HTMLElement>();
  private readonly _destroyed = new Subject<void>();
  private _player: Player | undefined;
  private _existingApiReadyCallback: (() => void) | undefined;
  private _pendingPlayerState: PendingPlayerState | undefined;
  private readonly _playerChanges = new BehaviorSubject<UninitializedPlayer | undefined>(undefined);

  /**
   * YouTube Video ID to view
   *
   * 要观看的 YouTube 视频 ID
   *
   */
  @Input()
  get videoId(): string | undefined {
    return this._videoId.value;
  }
  set videoId(videoId: string | undefined) {
    this._videoId.next(videoId);
  }
  private readonly _videoId = new BehaviorSubject<string | undefined>(undefined);

  /**
   * Height of video player
   *
   * 视频播放器的高度
   *
   */
  @Input()
  get height(): number | undefined {
    return this._height.value;
  }
  set height(height: number | undefined) {
    this._height.next(height || DEFAULT_PLAYER_HEIGHT);
  }
  private readonly _height = new BehaviorSubject<number>(DEFAULT_PLAYER_HEIGHT);

  /**
   * Width of video player
   *
   * 视频播放器的宽度
   *
   */
  @Input()
  get width(): number | undefined {
    return this._width.value;
  }
  set width(width: number | undefined) {
    this._width.next(width || DEFAULT_PLAYER_WIDTH);
  }
  private readonly _width = new BehaviorSubject<number>(DEFAULT_PLAYER_WIDTH);

  /**
   * The moment when the player is supposed to start playing
   *
   * 播放器应该开始播放的时刻
   *
   */
  @Input()
  set startSeconds(startSeconds: number | undefined) {
    this._startSeconds.next(startSeconds);
  }
  private readonly _startSeconds = new BehaviorSubject<number | undefined>(undefined);

  /**
   * The moment when the player is supposed to stop playing
   *
   * 播放器应该停止播放时刻
   *
   */
  @Input()
  set endSeconds(endSeconds: number | undefined) {
    this._endSeconds.next(endSeconds);
  }
  private readonly _endSeconds = new BehaviorSubject<number | undefined>(undefined);

  /**
   * The suggested quality of the player
   *
   * 播放器建议的播放品质
   *
   */
  @Input()
  set suggestedQuality(suggestedQuality: YT.SuggestedVideoQuality | undefined) {
    this._suggestedQuality.next(suggestedQuality);
  }
  private readonly _suggestedQuality = new BehaviorSubject<YT.SuggestedVideoQuality | undefined>(
    undefined,
  );

  /**
   * Extra parameters used to configure the player. See:
   * <https://developers.google.com/youtube/player_parameters.html?playerVersion=HTML5#Parameters>
   *
   * 用于配置播放器的额外参数。请参阅：<https://developers.google.com/youtube/player_parameters.html?playerVersion=HTML5#Parameters>
   */
  @Input()
  get playerVars(): YT.PlayerVars | undefined {
    return this._playerVars.value;
  }
  set playerVars(playerVars: YT.PlayerVars | undefined) {
    this._playerVars.next(playerVars);
  }
  private _playerVars = new BehaviorSubject<YT.PlayerVars | undefined>(undefined);

  /**
   * Whether the iframe will attempt to load regardless of the status of the api on the
   * page. Set this to true if you don't want the `onYouTubeIframeAPIReady` field to be
   * set on the global window.
   *
   * 无论页面上的 api 状态如何，iframe 都会尝试加载。如果你不希望在全局 window 对象中设置 `onYouTubeIframeAPIReady` 字段，则把它设为 `true`。
   *
   */
  @Input() showBeforeIframeApiLoads: boolean | undefined;

  /**
   * Outputs are direct proxies from the player itself.
   *
   * 直接代理给播放器自身的输出事件。
   *
   */
  @Output() readonly ready: Observable<YT.PlayerEvent> =
    this._getLazyEmitter<YT.PlayerEvent>('onReady');

  @Output() readonly stateChange: Observable<YT.OnStateChangeEvent> =
    this._getLazyEmitter<YT.OnStateChangeEvent>('onStateChange');

  @Output() readonly error: Observable<YT.OnErrorEvent> =
    this._getLazyEmitter<YT.OnErrorEvent>('onError');

  @Output() readonly apiChange: Observable<YT.PlayerEvent> =
    this._getLazyEmitter<YT.PlayerEvent>('onApiChange');

  @Output() readonly playbackQualityChange: Observable<YT.OnPlaybackQualityChangeEvent> =
    this._getLazyEmitter<YT.OnPlaybackQualityChangeEvent>('onPlaybackQualityChange');

  @Output() readonly playbackRateChange: Observable<YT.OnPlaybackRateChangeEvent> =
    this._getLazyEmitter<YT.OnPlaybackRateChangeEvent>('onPlaybackRateChange');

  /**
   * The element that will be replaced by the iframe.
   *
   * 那个将被 iframe 取代的元素。
   *
   */
  @ViewChild('youtubeContainer')
  youtubeContainer: ElementRef<HTMLElement>;

  constructor(private _ngZone: NgZone, @Inject(PLATFORM_ID) platformId: Object) {
    this._isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    // Don't do anything if we're not in a browser environment.
    if (!this._isBrowser) {
      return;
    }

    let iframeApiAvailableObs: Observable<boolean> = observableOf(true);
    if (!window.YT || !window.YT.Player) {
      if (this.showBeforeIframeApiLoads && (typeof ngDevMode === 'undefined' || ngDevMode)) {
        throw new Error(
          'Namespace YT not found, cannot construct embedded youtube player. ' +
            'Please install the YouTube Player API Reference for iframe Embeds: ' +
            'https://developers.google.com/youtube/iframe_api_reference',
        );
      }

      const iframeApiAvailableSubject = new Subject<boolean>();
      this._existingApiReadyCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        if (this._existingApiReadyCallback) {
          this._existingApiReadyCallback();
        }
        this._ngZone.run(() => iframeApiAvailableSubject.next(true));
      };
      iframeApiAvailableObs = iframeApiAvailableSubject.pipe(take(1), startWith(false));
    }

    // An observable of the currently loaded player.
    const playerObs = createPlayerObservable(
      this._youtubeContainer,
      this._videoId,
      iframeApiAvailableObs,
      this._width,
      this._height,
      this._playerVars,
      this._ngZone,
    ).pipe(
      tap(player => {
        // Emit this before the `waitUntilReady` call so that we can bind to
        // events that happen as the player is being initialized (e.g. `onReady`).
        this._playerChanges.next(player);
      }),
      waitUntilReady(player => {
        // Destroy the player if loading was aborted so that we don't end up leaking memory.
        if (!playerIsReady(player)) {
          player.destroy();
        }
      }),
      takeUntil(this._destroyed),
      publish(),
    );

    // Set up side effects to bind inputs to the player.
    playerObs.subscribe(player => {
      this._player = player;

      if (player && this._pendingPlayerState) {
        this._initializePlayer(player, this._pendingPlayerState);
      }

      this._pendingPlayerState = undefined;
    });

    bindSizeToPlayer(playerObs, this._width, this._height);

    bindSuggestedQualityToPlayer(playerObs, this._suggestedQuality);

    bindCueVideoCall(
      playerObs,
      this._videoId,
      this._startSeconds,
      this._endSeconds,
      this._suggestedQuality,
      this._destroyed,
    );

    // After all of the subscriptions are set up, connect the observable.
    (playerObs as ConnectableObservable<Player>).connect();
  }

  ngAfterViewInit() {
    this._youtubeContainer.next(this.youtubeContainer.nativeElement);
  }

  ngOnDestroy() {
    if (this._player) {
      this._player.destroy();
      window.onYouTubeIframeAPIReady = this._existingApiReadyCallback;
    }

    this._playerChanges.complete();
    this._videoId.complete();
    this._height.complete();
    this._width.complete();
    this._startSeconds.complete();
    this._endSeconds.complete();
    this._suggestedQuality.complete();
    this._youtubeContainer.complete();
    this._playerVars.complete();
    this._destroyed.next();
    this._destroyed.complete();
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#playVideo>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#playVideo>
   */
  playVideo() {
    if (this._player) {
      this._player.playVideo();
    } else {
      this._getPendingState().playbackState = YT.PlayerState.PLAYING;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#pauseVideo>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#pauseVideo>
   */
  pauseVideo() {
    if (this._player) {
      this._player.pauseVideo();
    } else {
      this._getPendingState().playbackState = YT.PlayerState.PAUSED;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#stopVideo>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#stopVideo>
   */
  stopVideo() {
    if (this._player) {
      this._player.stopVideo();
    } else {
      // It seems like YouTube sets the player to CUED when it's stopped.
      this._getPendingState().playbackState = YT.PlayerState.CUED;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#seekTo>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#seekTo>
   */
  seekTo(seconds: number, allowSeekAhead: boolean) {
    if (this._player) {
      this._player.seekTo(seconds, allowSeekAhead);
    } else {
      this._getPendingState().seek = {seconds, allowSeekAhead};
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#mute>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#mute>
   */
  mute() {
    if (this._player) {
      this._player.mute();
    } else {
      this._getPendingState().muted = true;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#unMute>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#unMute>
   */
  unMute() {
    if (this._player) {
      this._player.unMute();
    } else {
      this._getPendingState().muted = false;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#isMuted>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#isMuted>
   */
  isMuted(): boolean {
    if (this._player) {
      return this._player.isMuted();
    }

    if (this._pendingPlayerState) {
      return !!this._pendingPlayerState.muted;
    }

    return false;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#setVolume>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#setVolume>
   */
  setVolume(volume: number) {
    if (this._player) {
      this._player.setVolume(volume);
    } else {
      this._getPendingState().volume = volume;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getVolume>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getVolume>
   */
  getVolume(): number {
    if (this._player) {
      return this._player.getVolume();
    }

    if (this._pendingPlayerState && this._pendingPlayerState.volume != null) {
      return this._pendingPlayerState.volume;
    }

    return 0;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#setPlaybackRate>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#setPlaybackRate>
   */
  setPlaybackRate(playbackRate: number) {
    if (this._player) {
      return this._player.setPlaybackRate(playbackRate);
    } else {
      this._getPendingState().playbackRate = playbackRate;
    }
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getPlaybackRate>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getPlaybackRate>
   */
  getPlaybackRate(): number {
    if (this._player) {
      return this._player.getPlaybackRate();
    }

    if (this._pendingPlayerState && this._pendingPlayerState.playbackRate != null) {
      return this._pendingPlayerState.playbackRate;
    }

    return 0;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates>
   */
  getAvailablePlaybackRates(): number[] {
    return this._player ? this._player.getAvailablePlaybackRates() : [];
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getVideoLoadedFraction>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getVideoLoadedFraction>
   */
  getVideoLoadedFraction(): number {
    return this._player ? this._player.getVideoLoadedFraction() : 0;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getPlayerState>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getPlayerState>
   */
  getPlayerState(): YT.PlayerState | undefined {
    if (!this._isBrowser || !window.YT) {
      return undefined;
    }

    if (this._player) {
      return this._player.getPlayerState();
    }

    if (this._pendingPlayerState && this._pendingPlayerState.playbackState != null) {
      return this._pendingPlayerState.playbackState;
    }

    return YT.PlayerState.UNSTARTED;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getCurrentTime>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getCurrentTime>
   */
  getCurrentTime(): number {
    if (this._player) {
      return this._player.getCurrentTime();
    }

    if (this._pendingPlayerState && this._pendingPlayerState.seek) {
      return this._pendingPlayerState.seek.seconds;
    }

    return 0;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getPlaybackQuality>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getPlaybackQuality>
   */
  getPlaybackQuality(): YT.SuggestedVideoQuality {
    return this._player ? this._player.getPlaybackQuality() : 'default';
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getAvailableQualityLevels>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getAvailableQualityLevels>
   */
  getAvailableQualityLevels(): YT.SuggestedVideoQuality[] {
    return this._player ? this._player.getAvailableQualityLevels() : [];
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getDuration>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getDuration>
   */
  getDuration(): number {
    return this._player ? this._player.getDuration() : 0;
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getVideoUrl>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getVideoUrl>
   */
  getVideoUrl(): string {
    return this._player ? this._player.getVideoUrl() : '';
  }

  /**
   * See <https://developers.google.com/youtube/iframe_api_reference#getVideoEmbedCode>
   *
   * 参见 <https://developers.google.com/youtube/iframe_api_reference#getVideoEmbedCode>
   */
  getVideoEmbedCode(): string {
    return this._player ? this._player.getVideoEmbedCode() : '';
  }

  /**
   * Gets an object that should be used to store the temporary API state.
   *
   * 获取一个用于存放临时 API 状态的对象。
   *
   */
  private _getPendingState(): PendingPlayerState {
    if (!this._pendingPlayerState) {
      this._pendingPlayerState = {};
    }

    return this._pendingPlayerState;
  }

  /**
   * Initializes a player from a temporary state.
   *
   * 从临时状态初始化某个播放器。
   *
   */
  private _initializePlayer(player: YT.Player, state: PendingPlayerState): void {
    const {playbackState, playbackRate, volume, muted, seek} = state;

    switch (playbackState) {
      case YT.PlayerState.PLAYING:
        player.playVideo();
        break;
      case YT.PlayerState.PAUSED:
        player.pauseVideo();
        break;
      case YT.PlayerState.CUED:
        player.stopVideo();
        break;
    }

    if (playbackRate != null) {
      player.setPlaybackRate(playbackRate);
    }

    if (volume != null) {
      player.setVolume(volume);
    }

    if (muted != null) {
      muted ? player.mute() : player.unMute();
    }

    if (seek != null) {
      player.seekTo(seek.seconds, seek.allowSeekAhead);
    }
  }

  /**
   * Gets an observable that adds an event listener to the player when a user subscribes to it.
   *
   * 获取一个可观察对象，它会在用户订阅时为播放器添加一个事件监听器。
   *
   */
  private _getLazyEmitter<T extends YT.PlayerEvent>(name: keyof YT.Events): Observable<T> {
    // Start with the stream of players. This way the events will be transferred
    // over to the new player if it gets swapped out under-the-hood.
    return this._playerChanges.pipe(
      // Switch to the bound event. `switchMap` ensures that the old event is removed when the
      // player is changed. If there's no player, return an observable that never emits.
      switchMap(player => {
        return player
          ? fromEventPattern<T>(
              (listener: (event: T) => void) => {
                player.addEventListener(name, listener);
              },
              (listener: (event: T) => void) => {
                // The API seems to throw when we try to unbind from a destroyed player and it doesn't
                // expose whether the player has been destroyed so we have to wrap it in a try/catch to
                // prevent the entire stream from erroring out.
                try {
                  if ((player as Player).removeEventListener!) {
                    (player as Player).removeEventListener(name, listener);
                  }
                } catch {}
              },
            )
          : observableOf<T>();
      }),
      // By default we run all the API interactions outside the zone
      // so we have to bring the events back in manually when they emit.
      (source: Observable<T>) =>
        new Observable<T>(observer =>
          source.subscribe({
            next: value => this._ngZone.run(() => observer.next(value)),
            error: error => observer.error(error),
            complete: () => observer.complete(),
          }),
        ),
      // Ensures that everything is cleared out on destroy.
      takeUntil(this._destroyed),
    );
  }
}

/**
 * Listens to changes to the given width and height and sets it on the player.
 *
 * 监听指定宽度和高度的变化情况，并在播放器上进行设置。
 *
 */
function bindSizeToPlayer(
  playerObs: Observable<YT.Player | undefined>,
  widthObs: Observable<number>,
  heightObs: Observable<number>,
) {
  return combineLatest([playerObs, widthObs, heightObs]).subscribe(
    ([player, width, height]) => player && player.setSize(width, height),
  );
}

/**
 * Listens to changes from the suggested quality and sets it on the given player.
 *
 * 监听建议质量的变化情况，并把它设置在指定的播放器上。
 *
 */
function bindSuggestedQualityToPlayer(
  playerObs: Observable<YT.Player | undefined>,
  suggestedQualityObs: Observable<YT.SuggestedVideoQuality | undefined>,
) {
  return combineLatest([playerObs, suggestedQualityObs]).subscribe(
    ([player, suggestedQuality]) =>
      player && suggestedQuality && player.setPlaybackQuality(suggestedQuality),
  );
}

/**
 * Returns an observable that emits the loaded player once it's ready. Certain properties/methods
 * won't be available until the iframe finishes loading.
 *
 * 返回一个可观察对象，它会在所加载的播放器就绪后发出通知。在 iframe 完成加载之前，某些属性/方法是不可用的。
 *
 * @param onAbort Callback function that will be invoked if the player loading was aborted before
 * it was able to complete. Can be used to clean up any loose references.
 *
 * 在播放器加载完成前被中止的情况下会调用这个回调函数。可以用来清理任何宽松的引用。
 *
 */
function waitUntilReady(
  onAbort: (player: UninitializedPlayer) => void,
): OperatorFunction<UninitializedPlayer | undefined, Player | undefined> {
  return mergeMap(player => {
    if (!player) {
      return observableOf<Player | undefined>(undefined);
    }
    if (playerIsReady(player)) {
      return observableOf(player as Player);
    }

    // Since removeEventListener is not on Player when it's initialized, we can't use fromEvent.
    // The player is not initialized fully until the ready is called.
    return new Observable<Player>(emitter => {
      let aborted = false;
      let resolved = false;
      const onReady = (event: YT.PlayerEvent) => {
        resolved = true;

        if (!aborted) {
          event.target.removeEventListener('onReady', onReady);
          emitter.next(event.target);
        }
      };

      player.addEventListener('onReady', onReady);

      return () => {
        aborted = true;

        if (!resolved) {
          onAbort(player);
        }
      };
    }).pipe(take(1), startWith(undefined));
  });
}

/**
 * Create an observable for the player based on the given options.
 *
 * 基于指定的选项为播放器创建一个可观察对象。
 *
 */
function createPlayerObservable(
  youtubeContainer: Observable<HTMLElement>,
  videoIdObs: Observable<string | undefined>,
  iframeApiAvailableObs: Observable<boolean>,
  widthObs: Observable<number>,
  heightObs: Observable<number>,
  playerVarsObs: Observable<YT.PlayerVars | undefined>,
  ngZone: NgZone,
): Observable<UninitializedPlayer | undefined> {
  const playerOptions = combineLatest([videoIdObs, playerVarsObs]).pipe(
    withLatestFrom(combineLatest([widthObs, heightObs])),
    map(([constructorOptions, sizeOptions]) => {
      const [videoId, playerVars] = constructorOptions;
      const [width, height] = sizeOptions;
      return videoId ? {videoId, playerVars, width, height} : undefined;
    }),
  );

  return combineLatest([youtubeContainer, playerOptions, of(ngZone)]).pipe(
    skipUntilRememberLatest(iframeApiAvailableObs),
    scan(syncPlayerState, undefined),
    distinctUntilChanged(),
  );
}

/**
 * Skips the given observable until the other observable emits true, then emit the latest.
 *
 * 跳过指定的可观察对象，直到另一个可观察对象发出 true 后发出最后一条数据。
 *
 */
function skipUntilRememberLatest<T>(notifier: Observable<boolean>): MonoTypeOperatorFunction<T> {
  return pipe(
    combineLatestOp(notifier),
    skipWhile(([_, doneSkipping]) => !doneSkipping),
    map(([value]) => value),
  );
}

/**
 * Destroy the player if there are no options, or create the player if there are options.
 *
 * 如果没有选项则销毁播放器；如果有选项，则自动创建播放器。
 *
 */
function syncPlayerState(
  player: UninitializedPlayer | undefined,
  [container, videoOptions, ngZone]: [HTMLElement, YT.PlayerOptions | undefined, NgZone],
): UninitializedPlayer | undefined {
  if (player && videoOptions && player.playerVars !== videoOptions.playerVars) {
    // The player needs to be recreated if the playerVars are different.
    player.destroy();
  } else if (!videoOptions) {
    if (player) {
      // Destroy the player if the videoId was removed.
      player.destroy();
    }
    return;
  } else if (player) {
    return player;
  }

  // Important! We need to create the Player object outside of the `NgZone`, because it kicks
  // off a 250ms setInterval which will continually trigger change detection if we don't.
  const newPlayer: UninitializedPlayer = ngZone.runOutsideAngular(
    () => new YT.Player(container, videoOptions),
  );
  newPlayer.videoId = videoOptions.videoId;
  newPlayer.playerVars = videoOptions.playerVars;
  return newPlayer;
}

/**
 * Call cueVideoById if the videoId changes, or when start or end seconds change. cueVideoById will
 * change the loaded video id to the given videoId, and set the start and end times to the given
 * start/end seconds.
 *
 * 如果 videoId 发生了变化，或者 start 或 end 的描述发生了变化，就调用 cueVideoById。
 * cueVideoById 会把已加载的视频 id 更改为指定的 videoId，并把开始时间和结束时间设置为指定的开始/结束时间。
 *
 */
function bindCueVideoCall(
  playerObs: Observable<Player | undefined>,
  videoIdObs: Observable<string | undefined>,
  startSecondsObs: Observable<number | undefined>,
  endSecondsObs: Observable<number | undefined>,
  suggestedQualityObs: Observable<YT.SuggestedVideoQuality | undefined>,
  destroyed: Observable<void>,
) {
  const cueOptionsObs = combineLatest([startSecondsObs, endSecondsObs]).pipe(
    map(([startSeconds, endSeconds]) => ({startSeconds, endSeconds})),
  );

  // Only respond to changes in cue options if the player is not running.
  const filteredCueOptions = cueOptionsObs.pipe(
    filterOnOther(playerObs, player => !!player && !hasPlayerStarted(player)),
  );

  // If the video id changed, there's no reason to run 'cue' unless the player
  // was initialized with a different video id.
  const changedVideoId = videoIdObs.pipe(
    filterOnOther(playerObs, (player, videoId) => !!player && player.videoId !== videoId),
  );

  // If the player changed, there's no reason to run 'cue' unless there are cue options.
  const changedPlayer = playerObs.pipe(
    filterOnOther(
      combineLatest([videoIdObs, cueOptionsObs]),
      ([videoId, cueOptions], player) =>
        !!player &&
        (videoId != player.videoId || !!cueOptions.startSeconds || !!cueOptions.endSeconds),
    ),
  );

  merge(changedPlayer, changedVideoId, filteredCueOptions)
    .pipe(
      withLatestFrom(combineLatest([playerObs, videoIdObs, cueOptionsObs, suggestedQualityObs])),
      map(([_, values]) => values),
      takeUntil(destroyed),
    )
    .subscribe(([player, videoId, cueOptions, suggestedQuality]) => {
      if (!videoId || !player) {
        return;
      }
      player.videoId = videoId;
      player.cueVideoById({
        videoId,
        suggestedQuality,
        ...cueOptions,
      });
    });
}

function hasPlayerStarted(player: YT.Player): boolean {
  const state = player.getPlayerState();
  return state !== YT.PlayerState.UNSTARTED && state !== YT.PlayerState.CUED;
}

function playerIsReady(player: UninitializedPlayer): player is Player {
  return 'getPlayerStatus' in player;
}

/**
 * Combines the two observables temporarily for the filter function.
 *
 * 暂时把这两个可观察对象组合起来，供过滤函数用。
 *
 */
function filterOnOther<R, T>(
  otherObs: Observable<T>,
  filterFn: (t: T, r?: R) => boolean,
): MonoTypeOperatorFunction<R> {
  return pipe(
    withLatestFrom(otherObs),
    filter(([value, other]) => filterFn(other, value)),
    map(([value]) => value),
  );
}
