/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {coerceNumberProperty, NumberInput} from '@angular/cdk/coercion';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  Optional,
  Output,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectorRef,
} from '@angular/core';
import {CanColor, mixinColor} from '@angular/material/core';
import {
  MatProgressBarDefaultOptions,
  MAT_PROGRESS_BAR_DEFAULT_OPTIONS,
  ProgressAnimationEnd,
  ProgressBarMode,
  MAT_PROGRESS_BAR_LOCATION,
  MatProgressBarLocation,
} from '@angular/material/progress-bar';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {fromEvent, Observable, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';

// TODO(josephperrott): Add ARIA attributes for progress bar "for".

// Boilerplate for applying mixins to MatProgressBar.
/** @docs-private */
const _MatProgressBarBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  },
  'primary',
);

/** Counter used to generate unique IDs for progress bars. */
let progressbarId = 0;

/**
 * `<mat-progress-bar>` component.
 * @deprecated Use `MatProgressBar` from `@angular/material/progress-bar` instead. See https://material.angular.io/guide/mdc-migration for information about migrating.
 * @breaking-change 17.0.0
 */
@Component({
  selector: 'mat-progress-bar',
  exportAs: 'matProgressBar',
  host: {
    'role': 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    // set tab index to -1 so screen readers will read the aria-label
    // Note: there is a known issue with JAWS that does not read progressbar aria labels on FireFox
    'tabindex': '-1',
    '[attr.aria-valuenow]': '(mode === "indeterminate" || mode === "query") ? null : value',
    '[attr.mode]': 'mode',
    'class': 'mat-progress-bar',
    '[class._mat-animation-noopable]': '_isNoopAnimation',
  },
  inputs: ['color'],
  templateUrl: 'progress-bar.html',
  styleUrls: ['progress-bar.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MatLegacyProgressBar
  extends _MatProgressBarBase
  implements CanColor, AfterViewInit, OnDestroy
{
  constructor(
    elementRef: ElementRef,
    private _ngZone: NgZone,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) public _animationMode?: string,
    /**
     * @deprecated `location` parameter to be made required.
     * @breaking-change 8.0.0
     */
    @Optional() @Inject(MAT_PROGRESS_BAR_LOCATION) location?: MatProgressBarLocation,
    @Optional()
    @Inject(MAT_PROGRESS_BAR_DEFAULT_OPTIONS)
    defaults?: MatProgressBarDefaultOptions,
    /**
     * @deprecated `_changeDetectorRef` parameter to be made required.
     * @breaking-change 11.0.0
     */
    private _changeDetectorRef?: ChangeDetectorRef,
  ) {
    super(elementRef);

    // We need to prefix the SVG reference with the current path, otherwise they won't work
    // in Safari if the page has a `<base>` tag. Note that we need quotes inside the `url()`,
    // because named route URLs can contain parentheses (see #12338). Also we don't use `Location`
    // since we can't tell the difference between whether the consumer is using the hash location
    // strategy or not, because `Location` normalizes both `/#/foo/bar` and `/foo/bar` to
    // the same thing.
    const path = location ? location.getPathname().split('#')[0] : '';
    this._rectangleFillValue = `url('${path}#${this.progressbarId}')`;
    this._isNoopAnimation = _animationMode === 'NoopAnimations';

    if (defaults) {
      if (defaults.color) {
        this.color = this.defaultColor = defaults.color;
      }

      this.mode = defaults.mode || this.mode;
    }
  }

  /** Flag that indicates whether NoopAnimations mode is set to true. */
  _isNoopAnimation = false;

  /** Value of the progress bar. Defaults to zero. Mirrored to aria-valuenow. */
  @Input()
  get value(): number {
    return this._value;
  }
  set value(v: NumberInput) {
    this._value = clamp(coerceNumberProperty(v) || 0);

    // @breaking-change 11.0.0 Remove null check for _changeDetectorRef.
    this._changeDetectorRef?.markForCheck();
  }
  private _value: number = 0;

  /** Buffer value of the progress bar. Defaults to zero. */
  @Input()
  get bufferValue(): number {
    return this._bufferValue;
  }
  set bufferValue(v: number) {
    this._bufferValue = clamp(v || 0);

    // @breaking-change 11.0.0 Remove null check for _changeDetectorRef.
    this._changeDetectorRef?.markForCheck();
  }
  private _bufferValue: number = 0;

  @ViewChild('primaryValueBar') _primaryValueBar: ElementRef;

  /**
   * Event emitted when animation of the primary progress bar completes. This event will not
   * be emitted when animations are disabled, nor will it be emitted for modes with continuous
   * animations (indeterminate and query).
   */
  @Output() readonly animationEnd = new EventEmitter<ProgressAnimationEnd>();

  /** Reference to animation end subscription to be unsubscribed on destroy. */
  private _animationEndSubscription: Subscription = Subscription.EMPTY;

  /**
   * Mode of the progress bar.
   *
   * Input must be one of these values: determinate, indeterminate, buffer, query, defaults to
   * 'determinate'.
   * Mirrored to mode attribute.
   */
  @Input() mode: ProgressBarMode = 'determinate';

  /** ID of the progress bar. */
  progressbarId = `mat-progress-bar-${progressbarId++}`;

  /** Attribute to be used for the `fill` attribute on the internal `rect` element. */
  _rectangleFillValue: string;

  /** Gets the current transform value for the progress bar's primary indicator. */
  _primaryTransform() {
    // We use a 3d transform to work around some rendering issues in iOS Safari. See #19328.
    const scale = this.value / 100;
    return {transform: `scale3d(${scale}, 1, 1)`};
  }

  /**
   * Gets the current transform value for the progress bar's buffer indicator. Only used if the
   * progress mode is set to buffer, otherwise returns an undefined, causing no transformation.
   */
  _bufferTransform() {
    if (this.mode === 'buffer') {
      // We use a 3d transform to work around some rendering issues in iOS Safari. See #19328.
      const scale = this.bufferValue / 100;
      return {transform: `scale3d(${scale}, 1, 1)`};
    }
    return null;
  }

  ngAfterViewInit() {
    // Run outside angular so change detection didn't get triggered on every transition end
    // instead only on the animation that we care about (primary value bar's transitionend)
    this._ngZone.runOutsideAngular(() => {
      const element = this._primaryValueBar.nativeElement;

      this._animationEndSubscription = (
        fromEvent(element, 'transitionend') as Observable<TransitionEvent>
      )
        .pipe(filter((e: TransitionEvent) => e.target === element))
        .subscribe(() => {
          if (this.animationEnd.observers.length === 0) {
            return;
          }

          if (this.mode === 'determinate' || this.mode === 'buffer') {
            this._ngZone.run(() => this.animationEnd.next({value: this.value}));
          }
        });
    });
  }

  ngOnDestroy() {
    this._animationEndSubscription.unsubscribe();
  }
}

/** Clamps a value to be between two numbers, by default 0 and 100. */
function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}
