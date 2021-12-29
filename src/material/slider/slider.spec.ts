import {BidiModule} from '@angular/cdk/bidi';
import {
  BACKSPACE,
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  UP_ARROW,
  A,
} from '@angular/cdk/keycodes';
import {
  createMouseEvent,
  dispatchEvent,
  dispatchFakeEvent,
  dispatchKeyboardEvent,
  dispatchMouseEvent,
  createKeyboardEvent,
} from '../../cdk/testing/private';
import {Component, DebugElement, Type, ViewChild} from '@angular/core';
import {ComponentFixture, fakeAsync, flush, TestBed} from '@angular/core/testing';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {MatSlider, MatSliderModule} from './index';

describe('MatSlider', () => {
  function createComponent<T>(component: Type<T>): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: [MatSliderModule, ReactiveFormsModule, FormsModule, BidiModule],
      declarations: [component],
    }).compileComponents();

    return TestBed.createComponent<T>(component);
  }

  describe('standard slider', () => {
    let fixture: ComponentFixture<StandardSlider>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let trackFillElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(StandardSlider);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.componentInstance;

      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('should set the default values', () => {
      expect(sliderInstance.value).toBe(0);
      expect(sliderInstance.min).toBe(0);
      expect(sliderInstance.max).toBe(100);
    });

    it('should update the value on mousedown', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.19);

      expect(sliderInstance.value).toBe(19);
    });

    it('should not update when pressing the right mouse button', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.19, 1);

      expect(sliderInstance.value).toBe(0);
    });

    it('should update the value on a slide', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.89);

      expect(sliderInstance.value).toBe(89);
    });

    it('should set the value as min when sliding before the track', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchSlideEventSequence(sliderNativeElement, 0, -1.33);

      expect(sliderInstance.value).toBe(0);
    });

    it('should set the value as max when sliding past the track', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchSlideEventSequence(sliderNativeElement, 0, 1.75);

      expect(sliderInstance.value).toBe(100);
    });

    it('should update the track fill on mousedown', () => {
      expect(trackFillElement.style.transform).toContain('scale3d(0, 1, 1)');

      dispatchMousedownEventSequence(sliderNativeElement, 0.39);
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(0.39, 1, 1)');
    });

    it('should hide the fill element at zero percent', () => {
      expect(trackFillElement.style.display).toBe('none');

      dispatchMousedownEventSequence(sliderNativeElement, 0.39);
      fixture.detectChanges();

      expect(trackFillElement.style.display).toBeFalsy();
    });

    it('should update the track fill on slide', () => {
      expect(trackFillElement.style.transform).toContain('scale3d(0, 1, 1)');

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.86);
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(0.86, 1, 1)');
    });

    it('should add and remove the mat-slider-sliding class when sliding', () => {
      expect(sliderNativeElement.classList).not.toContain('mat-slider-sliding');

      dispatchSlideStartEvent(sliderNativeElement, 0);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).toContain('mat-slider-sliding');

      dispatchSlideEndEvent(sliderNativeElement, 0.34);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).not.toContain('mat-slider-sliding');
    });

    it('should not interrupt sliding by pressing a key', () => {
      expect(sliderNativeElement.classList).not.toContain('mat-slider-sliding');

      dispatchSlideStartEvent(sliderNativeElement, 0);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).toContain('mat-slider-sliding');

      // Any key code will do here. Use A since it isn't associated with other actions.
      dispatchKeyboardEvent(sliderNativeElement, 'keydown', A);
      fixture.detectChanges();
      dispatchKeyboardEvent(sliderNativeElement, 'keyup', A);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).toContain('mat-slider-sliding');

      dispatchSlideEndEvent(sliderNativeElement, 0.34);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).not.toContain('mat-slider-sliding');
    });

    it('should stop dragging if the page loses focus', () => {
      const classlist = sliderNativeElement.classList;

      expect(classlist).not.toContain('mat-slider-sliding');

      dispatchSlideStartEvent(sliderNativeElement, 0);
      fixture.detectChanges();

      expect(classlist).toContain('mat-slider-sliding');

      dispatchSlideEvent(sliderNativeElement, 0.34);
      fixture.detectChanges();

      expect(classlist).toContain('mat-slider-sliding');

      dispatchFakeEvent(window, 'blur');
      fixture.detectChanges();

      expect(classlist).not.toContain('mat-slider-sliding');
    });

    it('should reset active state upon blur', () => {
      sliderInstance._isActive = true;

      dispatchFakeEvent(sliderNativeElement, 'blur');
      fixture.detectChanges();

      expect(sliderInstance._isActive).toBe(false);
    });

    it('should reset thumb gap when blurred on min value', () => {
      sliderInstance._isActive = true;
      sliderInstance.value = 0;
      fixture.detectChanges();

      expect(sliderInstance._getThumbGap()).toBe(10);

      dispatchFakeEvent(sliderNativeElement, 'blur');
      fixture.detectChanges();

      expect(sliderInstance._getThumbGap()).toBe(7);
    });

    it('should have thumb gap when at min value', () => {
      expect(trackFillElement.style.transform).toContain('translateX(-7px)');
    });

    it('should not have thumb gap when not at min value', () => {
      dispatchMousedownEventSequence(sliderNativeElement, 1);
      fixture.detectChanges();

      // Some browsers use '0' and some use '0px', so leave off the closing paren.
      expect(trackFillElement.style.transform).toContain('translateX(0');
    });

    it('should have aria-orientation horizontal', () => {
      expect(sliderNativeElement.getAttribute('aria-orientation')).toEqual('horizontal');
    });

    it('should slide to the max value when the steps do not divide evenly into it', () => {
      sliderInstance.min = 5;
      sliderInstance.max = 100;
      sliderInstance.step = 15;

      dispatchSlideEventSequence(sliderNativeElement, 0, 1);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(100);
    });

    it('should prevent the default action of the `selectstart` event', () => {
      const event = dispatchFakeEvent(sliderNativeElement, 'selectstart');
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
    });

    it('should have a focus indicator', () => {
      expect(sliderNativeElement.classList.contains('mat-focus-indicator')).toBe(true);
    });
  });

  describe('disabled slider', () => {
    let fixture: ComponentFixture<StandardSlider>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let trackFillElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(DisabledSlider);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.componentInstance;
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('should be disabled', () => {
      expect(sliderInstance.disabled).toBeTruthy();
    });

    it('should not change the value on mousedown when disabled', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.63);

      expect(sliderInstance.value).toBe(0);
    });

    it('should not change the value on slide when disabled', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.5);

      expect(sliderInstance.value).toBe(0);
    });

    it('should not emit change when disabled', () => {
      const onChangeSpy = jasmine.createSpy('slider onChange');
      sliderInstance.change.subscribe(onChangeSpy);

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.5);

      expect(onChangeSpy).toHaveBeenCalledTimes(0);
    });

    it('should not add the mat-slider-active class on mousedown when disabled', () => {
      expect(sliderNativeElement.classList).not.toContain('mat-slider-active');

      dispatchMousedownEventSequence(sliderNativeElement, 0.43);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).not.toContain('mat-slider-active');
    });

    it('should not add the mat-slider-sliding class on slide when disabled', () => {
      expect(sliderNativeElement.classList).not.toContain('mat-slider-sliding');

      dispatchSlideStartEvent(sliderNativeElement, 0.46);
      fixture.detectChanges();

      expect(sliderNativeElement.classList).not.toContain('mat-slider-sliding');
    });

    it('should leave thumb gap', () => {
      expect(trackFillElement.style.transform).toContain('translateX(-7px)');
    });

    it('should disable tabbing to the slider', () => {
      expect(sliderNativeElement.tabIndex).toBe(-1);
    });
  });

  describe('slider with set min and max', () => {
    let fixture: ComponentFixture<SliderWithMinAndMax>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let trackFillElement: HTMLElement;
    let ticksContainerElement: HTMLElement;
    let ticksElement: HTMLElement;
    let testComponent: SliderWithMinAndMax;

    beforeEach(() => {
      fixture = createComponent(SliderWithMinAndMax);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      testComponent = fixture.debugElement.componentInstance;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
      ticksContainerElement = <HTMLElement>(
        sliderNativeElement.querySelector('.mat-slider-ticks-container')
      );
      ticksElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-ticks');
    });

    it('should set the default values from the attributes', () => {
      expect(sliderInstance.value).toBe(4);
      expect(sliderInstance.min).toBe(4);
      expect(sliderInstance.max).toBe(6);
    });

    it('should set the correct value on mousedown', () => {
      dispatchMousedownEventSequence(sliderNativeElement, 0.09);
      fixture.detectChanges();

      // Computed by multiplying the difference between the min and the max by the percentage from
      // the mousedown and adding that to the minimum.
      const value = Math.round(4 + 0.09 * (6 - 4));
      expect(sliderInstance.value).toBe(value);
    });

    it('should set the correct value on slide', () => {
      dispatchSlideEventSequence(sliderNativeElement, 0, 0.62);
      fixture.detectChanges();

      // Computed by multiplying the difference between the min and the max by the percentage from
      // the mousedown and adding that to the minimum.
      const value = Math.round(4 + 0.62 * (6 - 4));
      expect(sliderInstance.value).toBe(value);
    });

    it('should snap the fill to the nearest value on mousedown', () => {
      dispatchMousedownEventSequence(sliderNativeElement, 0.68);
      fixture.detectChanges();

      // The closest snap is halfway on the slider.
      expect(trackFillElement.style.transform).toContain('scale3d(0.5, 1, 1)');
    });

    it('should snap the fill to the nearest value on slide', () => {
      dispatchSlideEventSequence(sliderNativeElement, 0, 0.74);
      fixture.detectChanges();

      // The closest snap is at the halfway point on the slider.
      expect(trackFillElement.style.transform).toContain('scale3d(0.5, 1, 1)');
    });

    it('should adjust fill and ticks on mouse enter when min changes', () => {
      testComponent.min = -2;
      fixture.detectChanges();

      dispatchMouseenterEvent(sliderNativeElement);
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(0.75, 1, 1)');
      expect(ticksElement.style.backgroundSize).toBe('75% 2px');
      // Make sure it cuts off the last half tick interval.
      expect(ticksElement.style.transform).toContain('translateX(37.5%)');
      expect(ticksContainerElement.style.transform).toBe('translateX(-37.5%)');
    });

    it('should adjust fill and ticks on mouse enter when max changes', () => {
      testComponent.min = -2;
      fixture.detectChanges();

      testComponent.max = 10;
      fixture.detectChanges();

      dispatchMouseenterEvent(sliderNativeElement);
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(0.5, 1, 1)');
      expect(ticksElement.style.backgroundSize).toBe('50% 2px');
      // Make sure it cuts off the last half tick interval.
      expect(ticksElement.style.transform).toContain('translateX(25%)');
      expect(ticksContainerElement.style.transform).toBe('translateX(-25%)');
    });

    it(
      'should be able to set the min and max values when they are more precise ' + 'than the step',
      () => {
        // Note that we assign min/max with more decimals than the
        // step to ensure that the value doesn't get rounded up.
        testComponent.step = 0.5;
        testComponent.min = 10.15;
        testComponent.max = 50.15;
        fixture.detectChanges();

        dispatchSlideEventSequence(sliderNativeElement, 0.5, 0);
        fixture.detectChanges();

        expect(sliderInstance.value).toBe(10.15);
        expect(sliderInstance.percent).toBe(0);

        dispatchSlideEventSequence(sliderNativeElement, 0.5, 1);
        fixture.detectChanges();

        expect(sliderInstance.value).toBe(50.15);
        expect(sliderInstance.percent).toBe(1);
      },
    );
  });

  describe('slider with set value', () => {
    let fixture: ComponentFixture<SliderWithValue>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;

    beforeEach(() => {
      fixture = createComponent(SliderWithValue);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
    });

    it('should set the default value from the attribute', () => {
      expect(sliderInstance.value).toBe(26);
    });

    it('should set the correct value on mousedown', () => {
      dispatchMousedownEventSequence(sliderNativeElement, 0.92);
      fixture.detectChanges();

      // On a slider with default max and min the value should be approximately equal to the
      // percentage clicked. This should be the case regardless of what the original set value was.
      expect(sliderInstance.value).toBe(92);
    });

    it('should set the correct value on slide', () => {
      dispatchSlideEventSequence(sliderNativeElement, 0, 0.32);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(32);
    });
  });

  describe('slider with set step', () => {
    let fixture: ComponentFixture<SliderWithStep>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let trackFillElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithStep);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('should set the correct step value on mousedown', () => {
      expect(sliderInstance.value).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.13);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(25);
    });

    it('should snap the fill to a step on mousedown', () => {
      dispatchMousedownEventSequence(sliderNativeElement, 0.66);
      fixture.detectChanges();

      // The closest step is at 75% of the slider.
      expect(trackFillElement.style.transform).toContain('scale3d(0.75, 1, 1)');
    });

    it('should set the correct step value on slide', () => {
      dispatchSlideEventSequence(sliderNativeElement, 0, 0.07);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(0);
    });

    it('should snap the thumb and fill to a step on slide', () => {
      dispatchSlideEventSequence(sliderNativeElement, 0, 0.88);
      fixture.detectChanges();

      // The closest snap is at the end of the slider.
      expect(trackFillElement.style.transform).toContain('scale3d(1, 1, 1)');
    });

    it('should not add decimals to the value if it is a whole number', () => {
      fixture.componentInstance.step = 0.1;
      fixture.detectChanges();

      dispatchSlideEventSequence(sliderNativeElement, 0, 1);

      expect(sliderDebugElement.componentInstance.displayValue).toBe(100);
    });

    it('should truncate long decimal values when using a decimal step', () => {
      fixture.componentInstance.step = 0.1;
      fixture.detectChanges();

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.333333);

      expect(sliderInstance.value).toBe(33);
    });

    it('should truncate long decimal values when using a decimal step and the arrow keys', () => {
      fixture.componentInstance.step = 0.1;
      fixture.detectChanges();

      for (let i = 0; i < 3; i++) {
        dispatchKeyboardEvent(sliderNativeElement, 'keydown', UP_ARROW);
      }

      expect(sliderInstance.value).toBe(0.3);
    });

    it('should set the truncated value to the aria-valuetext', () => {
      fixture.componentInstance.step = 0.1;
      fixture.detectChanges();

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.333333);
      fixture.detectChanges();

      expect(sliderNativeElement.getAttribute('aria-valuetext')).toBe('33');
    });

    it('should be able to override the aria-valuetext', () => {
      fixture.componentInstance.step = 0.1;
      fixture.componentInstance.valueText = 'custom';
      fixture.detectChanges();

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.333333);
      fixture.detectChanges();

      expect(sliderNativeElement.getAttribute('aria-valuetext')).toBe('custom');
    });

    it('should be able to clear aria-valuetext', () => {
      fixture.componentInstance.valueText = '';
      fixture.detectChanges();

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.333333);
      fixture.detectChanges();

      expect(sliderNativeElement.getAttribute('aria-valuetext')).toBeFalsy();
    });
  });

  describe('slider with auto ticks', () => {
    let fixture: ComponentFixture<SliderWithAutoTickInterval>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let ticksContainerElement: HTMLElement;
    let ticksElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithAutoTickInterval);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      ticksContainerElement = <HTMLElement>(
        sliderNativeElement.querySelector('.mat-slider-ticks-container')
      );
      ticksElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-ticks');
    });

    it('should set the correct tick separation on mouse enter', () => {
      dispatchMouseenterEvent(sliderNativeElement);
      fixture.detectChanges();

      // Ticks should be 30px apart (therefore 30% for a 100px long slider).
      expect(ticksElement.style.backgroundSize).toBe('30% 2px');
      // Make sure it cuts off the last half tick interval.
      expect(ticksElement.style.transform).toContain('translateX(15%)');
      expect(ticksContainerElement.style.transform).toBe('translateX(-15%)');
    });
  });

  describe('slider with set tick interval', () => {
    let fixture: ComponentFixture<SliderWithSetTickInterval>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let ticksContainerElement: HTMLElement;
    let ticksElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithSetTickInterval);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      ticksContainerElement = <HTMLElement>(
        sliderNativeElement.querySelector('.mat-slider-ticks-container')
      );
      ticksElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-ticks');
    });

    it('should set the correct tick separation on mouse enter', () => {
      dispatchMouseenterEvent(sliderNativeElement);
      fixture.detectChanges();

      // Ticks should be every 18 values (tickInterval of 6 * step size of 3). On a slider 100px
      // long with 100 values, this is 18%.
      expect(ticksElement.style.backgroundSize).toBe('18% 2px');
      // Make sure it cuts off the last half tick interval.
      expect(ticksElement.style.transform).toContain('translateX(9%)');
      expect(ticksContainerElement.style.transform).toBe('translateX(-9%)');
    });

    it('should be able to reset the tick interval after it has been set', () => {
      expect(sliderNativeElement.classList)
        .withContext('Expected element to have ticks initially.')
        .toContain('mat-slider-has-ticks');

      fixture.componentInstance.tickInterval = 0;
      fixture.detectChanges();

      expect(sliderNativeElement.classList).not.toContain(
        'mat-slider-has-ticks',
        'Expected element not to have ticks after reset.',
      );
    });
  });

  describe('slider with thumb label', () => {
    let fixture: ComponentFixture<SliderWithThumbLabel>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let thumbLabelTextElement: Element;

    beforeEach(() => {
      fixture = createComponent(SliderWithThumbLabel);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.componentInstance;
      thumbLabelTextElement = sliderNativeElement.querySelector('.mat-slider-thumb-label-text')!;
    });

    it('should add the thumb label class to the slider container', () => {
      expect(sliderNativeElement.classList).toContain('mat-slider-thumb-label-showing');
    });

    it('should update the thumb label text on mousedown', () => {
      expect(thumbLabelTextElement.textContent).toBe('0');

      dispatchMousedownEventSequence(sliderNativeElement, 0.13);
      fixture.detectChanges();

      // The thumb label text is set to the slider's value. These should always be the same.
      expect(thumbLabelTextElement.textContent).toBe('13');
    });

    it('should update the thumb label text on slide', () => {
      expect(thumbLabelTextElement.textContent).toBe('0');

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.56);
      fixture.detectChanges();

      // The thumb label text is set to the slider's value. These should always be the same.
      expect(thumbLabelTextElement.textContent).toBe(`${sliderInstance.value}`);
    });
  });

  describe('slider with custom thumb label formatting', () => {
    let fixture: ComponentFixture<SliderWithCustomThumbLabelFormatting>;
    let sliderInstance: MatSlider;
    let thumbLabelTextElement: Element;

    beforeEach(() => {
      fixture = createComponent(SliderWithCustomThumbLabelFormatting);
      fixture.detectChanges();

      const sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      const sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.componentInstance;
      thumbLabelTextElement = sliderNativeElement.querySelector('.mat-slider-thumb-label-text')!;
    });

    it('should invoke the passed-in `displayWith` function with the value', () => {
      spyOn(fixture.componentInstance, 'displayWith').and.callThrough();

      sliderInstance.value = 1337;
      fixture.detectChanges();

      expect(fixture.componentInstance.displayWith).toHaveBeenCalledWith(1337);
    });

    it('should format the thumb label based on the passed-in `displayWith` function', () => {
      sliderInstance.value = 200000;
      fixture.detectChanges();

      expect(thumbLabelTextElement.textContent).toBe('200k');
    });
  });

  describe('slider with value property binding', () => {
    let fixture: ComponentFixture<SliderWithOneWayBinding>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let testComponent: SliderWithOneWayBinding;
    let trackFillElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithOneWayBinding);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('should initialize based on bound value', () => {
      expect(sliderInstance.value).toBe(50);
      expect(trackFillElement.style.transform).toContain('scale3d(0.5, 1, 1)');
    });

    it('should update when bound value changes', () => {
      testComponent.val = 75;
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(75);
      expect(trackFillElement.style.transform).toContain('scale3d(0.75, 1, 1)');
    });
  });

  describe('slider with set min and max and a value smaller than min', () => {
    let fixture: ComponentFixture<SliderWithValueSmallerThanMin>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let trackFillElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithValueSmallerThanMin);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.componentInstance;
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('should set the value smaller than the min value', () => {
      expect(sliderInstance.value).toBe(3);
      expect(sliderInstance.min).toBe(4);
      expect(sliderInstance.max).toBe(6);
    });

    it('should set the fill to the min value', () => {
      expect(trackFillElement.style.transform).toContain('scale3d(0, 1, 1)');
    });
  });

  describe('slider with set min and max and a value greater than max', () => {
    let fixture: ComponentFixture<SliderWithValueSmallerThanMin>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let trackFillElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithValueGreaterThanMax);
      fixture.detectChanges();

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.componentInstance;
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('should set the value greater than the max value', () => {
      expect(sliderInstance.value).toBe(7);
      expect(sliderInstance.min).toBe(4);
      expect(sliderInstance.max).toBe(6);
    });

    it('should set the fill to the max value', () => {
      expect(trackFillElement.style.transform).toContain('scale3d(1, 1, 1)');
    });
  });

  describe('slider with change handler', () => {
    let fixture: ComponentFixture<SliderWithChangeHandler>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let testComponent: SliderWithChangeHandler;

    beforeEach(() => {
      fixture = createComponent(SliderWithChangeHandler);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;
      spyOn(testComponent, 'onChange');
      spyOn(testComponent, 'onInput');

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
    });

    it('should emit change on mouseup', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchMousedownEventSequence(sliderNativeElement, 0.2);
      fixture.detectChanges();
      dispatchSlideEndEvent(sliderNativeElement, 0.2);

      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
    });

    it('should emit change on slide', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.4);
      fixture.detectChanges();

      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
    });

    it('should not emit multiple changes for the same value', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchMousedownEventSequence(sliderNativeElement, 0.6);
      dispatchSlideEventSequence(sliderNativeElement, 0.6, 0.6);
      fixture.detectChanges();

      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
    });

    it(
      'should dispatch events when changing back to previously emitted value after ' +
        'programmatically setting value',
      () => {
        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).not.toHaveBeenCalled();

        dispatchMousedownEventSequence(sliderNativeElement, 0.2);
        fixture.detectChanges();

        expect(testComponent.onChange).not.toHaveBeenCalled();
        expect(testComponent.onInput).toHaveBeenCalledTimes(1);

        dispatchSlideEndEvent(sliderNativeElement, 0.2);
        fixture.detectChanges();

        expect(testComponent.onChange).toHaveBeenCalledTimes(1);
        expect(testComponent.onInput).toHaveBeenCalledTimes(1);

        testComponent.slider.value = 0;
        fixture.detectChanges();

        expect(testComponent.onChange).toHaveBeenCalledTimes(1);
        expect(testComponent.onInput).toHaveBeenCalledTimes(1);

        dispatchMousedownEventSequence(sliderNativeElement, 0.2);
        fixture.detectChanges();
        dispatchSlideEndEvent(sliderNativeElement, 0.2);

        expect(testComponent.onChange).toHaveBeenCalledTimes(2);
        expect(testComponent.onInput).toHaveBeenCalledTimes(2);
      },
    );
  });

  describe('slider with input event', () => {
    let fixture: ComponentFixture<SliderWithChangeHandler>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let testComponent: SliderWithChangeHandler;

    beforeEach(() => {
      fixture = createComponent(SliderWithChangeHandler);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;
      spyOn(testComponent, 'onInput');
      spyOn(testComponent, 'onChange');

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
    });

    it('should emit an input event while sliding', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchMouseenterEvent(sliderNativeElement);
      dispatchSlideStartEvent(sliderNativeElement, 0);
      dispatchSlideEvent(sliderNativeElement, 0.5);
      dispatchSlideEvent(sliderNativeElement, 1);
      dispatchSlideEndEvent(sliderNativeElement, 1);

      fixture.detectChanges();

      // The input event should fire twice, because the slider changed two times.
      expect(testComponent.onInput).toHaveBeenCalledTimes(2);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
    });

    it('should emit an input event when clicking', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchMousedownEventSequence(sliderNativeElement, 0.75);
      fixture.detectChanges();
      dispatchSlideEndEvent(sliderNativeElement, 0.75);

      // The `onInput` event should be emitted once due to a single click.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard support', () => {
    let fixture: ComponentFixture<SliderWithChangeHandler>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let testComponent: SliderWithChangeHandler;
    let sliderInstance: MatSlider;

    beforeEach(() => {
      fixture = createComponent(SliderWithChangeHandler);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;
      spyOn(testComponent, 'onInput');
      spyOn(testComponent, 'onChange');

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
    });

    it('should increment slider by 1 on up arrow pressed', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', UP_ARROW);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(1);
    });

    it('should increment slider by 1 on right arrow pressed', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', RIGHT_ARROW);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(1);
    });

    it('should decrement slider by 1 on down arrow pressed', () => {
      sliderInstance.value = 100;

      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', DOWN_ARROW);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(99);
    });

    it('should decrement slider by 1 on left arrow pressed', () => {
      sliderInstance.value = 100;

      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', LEFT_ARROW);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(99);
    });

    it('should increment slider by 10 on page up pressed', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', PAGE_UP);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(10);
    });

    it('should decrement slider by 10 on page down pressed', () => {
      sliderInstance.value = 100;

      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', PAGE_DOWN);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(90);
    });

    it('should set slider to max on end pressed', () => {
      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', END);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(100);
    });

    it('should set slider to min on home pressed', () => {
      sliderInstance.value = 100;

      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', HOME);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).toHaveBeenCalledTimes(1);
      expect(testComponent.onChange).toHaveBeenCalledTimes(1);
      expect(sliderInstance.value).toBe(0);
    });

    it(`should take no action for presses of keys it doesn't care about`, () => {
      sliderInstance.value = 50;

      expect(testComponent.onChange).not.toHaveBeenCalled();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', BACKSPACE);
      fixture.detectChanges();

      // The `onInput` event should be emitted once due to a single keyboard press.
      expect(testComponent.onInput).not.toHaveBeenCalled();
      expect(testComponent.onChange).not.toHaveBeenCalled();
      expect(sliderInstance.value).toBe(50);
    });

    it('should ignore events modifier keys', () => {
      sliderInstance.value = 0;

      [UP_ARROW, DOWN_ARROW, RIGHT_ARROW, LEFT_ARROW, PAGE_DOWN, PAGE_UP, HOME, END].forEach(
        key => {
          const event = createKeyboardEvent('keydown', key, undefined, {alt: true});
          dispatchEvent(sliderNativeElement, event);
          fixture.detectChanges();
          expect(event.defaultPrevented).toBe(false);
        },
      );

      expect(testComponent.onInput).not.toHaveBeenCalled();
      expect(testComponent.onChange).not.toHaveBeenCalled();
      expect(sliderInstance.value).toBe(0);
    });
  });

  describe('slider with direction and invert', () => {
    let fixture: ComponentFixture<SliderWithDirAndInvert>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let testComponent: SliderWithDirAndInvert;

    beforeEach(() => {
      fixture = createComponent(SliderWithDirAndInvert);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;
      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
      sliderNativeElement = sliderDebugElement.nativeElement;
    });

    it('works in inverted mode', () => {
      testComponent.invert = true;
      fixture.detectChanges();

      dispatchMousedownEventSequence(sliderNativeElement, 0.3);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(70);
    });

    it('works in RTL languages', () => {
      testComponent.dir = 'rtl';
      fixture.detectChanges();

      dispatchMousedownEventSequence(sliderNativeElement, 0.3);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(70);
    });

    it('works in RTL languages in inverted mode', () => {
      testComponent.dir = 'rtl';
      testComponent.invert = true;
      fixture.detectChanges();

      dispatchMousedownEventSequence(sliderNativeElement, 0.3);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(30);
    });

    it('should re-render slider with updated style upon directionality change', () => {
      testComponent.dir = 'rtl';
      fixture.detectChanges();

      const initialTrackFillStyles = sliderInstance._getTrackFillStyles();
      const initialTicksContainerStyles = sliderInstance._getTicksContainerStyles();
      const initialTicksStyles = sliderInstance._getTicksStyles();
      const initialThumbContainerStyles = sliderInstance._getThumbContainerStyles();

      testComponent.dir = 'ltr';
      fixture.detectChanges();

      expect(initialTrackFillStyles).not.toEqual(sliderInstance._getTrackFillStyles());
      expect(initialTicksContainerStyles).not.toEqual(sliderInstance._getTicksContainerStyles());
      expect(initialTicksStyles).not.toEqual(sliderInstance._getTicksStyles());
      expect(initialThumbContainerStyles).not.toEqual(sliderInstance._getThumbContainerStyles());
    });

    it('should increment inverted slider by 1 on right arrow pressed', () => {
      testComponent.invert = true;
      fixture.detectChanges();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', RIGHT_ARROW);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(1);
    });

    it('should decrement inverted slider by 1 on left arrow pressed', () => {
      testComponent.invert = true;
      sliderInstance.value = 100;
      fixture.detectChanges();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', LEFT_ARROW);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(99);
    });

    it('should decrement RTL slider by 1 on right arrow pressed', () => {
      testComponent.dir = 'rtl';
      sliderInstance.value = 100;
      fixture.detectChanges();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', RIGHT_ARROW);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(99);
    });

    it('should increment RTL slider by 1 on left arrow pressed', () => {
      testComponent.dir = 'rtl';
      fixture.detectChanges();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', LEFT_ARROW);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(1);
    });

    it('should decrement inverted RTL slider by 1 on right arrow pressed', () => {
      testComponent.dir = 'rtl';
      testComponent.invert = true;
      sliderInstance.value = 100;
      fixture.detectChanges();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', RIGHT_ARROW);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(99);
    });

    it('should increment inverted RTL slider by 1 on left arrow pressed', () => {
      testComponent.dir = 'rtl';
      testComponent.invert = true;
      fixture.detectChanges();

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', LEFT_ARROW);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(1);
    });

    it('should hide last tick when inverted and at min value', () => {
      testComponent.invert = true;
      fixture.detectChanges();

      expect(sliderNativeElement.classList.contains('mat-slider-hide-last-tick'))
        .withContext('last tick should be hidden')
        .toBe(true);
    });
  });

  describe('vertical slider', () => {
    let fixture: ComponentFixture<VerticalSlider>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let trackFillElement: HTMLElement;
    let sliderInstance: MatSlider;
    let testComponent: VerticalSlider;

    beforeEach(() => {
      fixture = createComponent(VerticalSlider);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;
      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
      sliderNativeElement = sliderDebugElement.nativeElement;
      trackFillElement = <HTMLElement>sliderNativeElement.querySelector('.mat-slider-track-fill');
    });

    it('updates value on mousedown', () => {
      dispatchMousedownEventSequence(sliderNativeElement, 0.3);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(70);
    });

    it('updates value on mousedown in inverted mode', () => {
      testComponent.invert = true;
      fixture.detectChanges();

      dispatchMousedownEventSequence(sliderNativeElement, 0.3);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(30);
    });

    it('should update the track fill on mousedown', () => {
      expect(trackFillElement.style.transform).toContain('scale3d(1, 0, 1)');

      dispatchMousedownEventSequence(sliderNativeElement, 0.39);
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(1, 0.61, 1)');
    });

    it('should update the track fill on mousedown in inverted mode', () => {
      testComponent.invert = true;
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(1, 0, 1)');

      dispatchMousedownEventSequence(sliderNativeElement, 0.39);
      fixture.detectChanges();

      expect(trackFillElement.style.transform).toContain('scale3d(1, 0.39, 1)');
    });

    it('should have aria-orientation vertical', () => {
      expect(sliderNativeElement.getAttribute('aria-orientation')).toEqual('vertical');
    });
  });

  describe('tabindex', () => {
    it('should allow setting the tabIndex through binding', () => {
      const fixture = createComponent(SliderWithTabIndexBinding);
      fixture.detectChanges();

      const slider = fixture.debugElement.query(By.directive(MatSlider))!.componentInstance;

      expect(slider.tabIndex)
        .withContext('Expected the tabIndex to be set to 0 by default.')
        .toBe(0);

      fixture.componentInstance.tabIndex = 3;
      fixture.detectChanges();

      expect(slider.tabIndex).withContext('Expected the tabIndex to have been changed.').toBe(3);
    });

    it('should detect the native tabindex attribute', () => {
      const fixture = createComponent(SliderWithNativeTabindexAttr);
      fixture.detectChanges();

      const slider = fixture.debugElement.query(By.directive(MatSlider))!.componentInstance;

      expect(slider.tabIndex)
        .withContext('Expected the tabIndex to be set to the value of the native attribute.')
        .toBe(5);
    });
  });

  describe('slider with ngModel', () => {
    let fixture: ComponentFixture<SliderWithNgModel>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let testComponent: SliderWithNgModel;

    beforeEach(() => {
      fixture = createComponent(SliderWithNgModel);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
    });

    it('should update the model on mouseup', () => {
      expect(testComponent.val).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.76);
      fixture.detectChanges();
      dispatchSlideEndEvent(sliderNativeElement, 0.76);

      expect(testComponent.val).toBe(76);
    });

    it('should update the model on slide', () => {
      expect(testComponent.val).toBe(0);

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.19);
      fixture.detectChanges();

      expect(testComponent.val).toBe(19);
    });

    it('should update the model on keydown', () => {
      expect(testComponent.val).toBe(0);

      dispatchKeyboardEvent(sliderNativeElement, 'keydown', UP_ARROW);
      fixture.detectChanges();

      expect(testComponent.val).toBe(1);
    });

    it('should be able to reset a slider by setting the model back to undefined', fakeAsync(() => {
      expect(testComponent.slider.value).toBe(0);

      testComponent.val = 5;
      fixture.detectChanges();
      flush();

      expect(testComponent.slider.value).toBe(5);

      testComponent.val = undefined;
      fixture.detectChanges();
      flush();

      expect(testComponent.slider.value).toBe(0);
    }));
  });

  describe('slider as a custom form control', () => {
    let fixture: ComponentFixture<SliderWithFormControl>;
    let sliderDebugElement: DebugElement;
    let sliderNativeElement: HTMLElement;
    let sliderInstance: MatSlider;
    let testComponent: SliderWithFormControl;

    beforeEach(() => {
      fixture = createComponent(SliderWithFormControl);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;

      sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
      sliderInstance = sliderDebugElement.injector.get<MatSlider>(MatSlider);
    });

    it('should not update the control when the value is updated', () => {
      expect(testComponent.control.value).toBe(0);

      sliderInstance.value = 11;
      fixture.detectChanges();

      expect(testComponent.control.value).toBe(0);
    });

    it('should update the control on mouseup', () => {
      expect(testComponent.control.value).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.76);
      fixture.detectChanges();
      dispatchSlideEndEvent(sliderNativeElement, 0.76);

      expect(testComponent.control.value).toBe(76);
    });

    it('should update the control on slide', () => {
      expect(testComponent.control.value).toBe(0);

      dispatchSlideEventSequence(sliderNativeElement, 0, 0.19);
      fixture.detectChanges();

      expect(testComponent.control.value).toBe(19);
    });

    it('should update the value when the control is set', () => {
      expect(sliderInstance.value).toBe(0);

      testComponent.control.setValue(7);
      fixture.detectChanges();

      expect(sliderInstance.value).toBe(7);
    });

    it('should update the disabled state when control is disabled', () => {
      expect(sliderInstance.disabled).toBe(false);

      testComponent.control.disable();
      fixture.detectChanges();

      expect(sliderInstance.disabled).toBe(true);
    });

    it('should update the disabled state when the control is enabled', () => {
      sliderInstance.disabled = true;

      testComponent.control.enable();
      fixture.detectChanges();

      expect(sliderInstance.disabled).toBe(false);
    });

    it('should have the correct control state initially and after interaction', () => {
      const sliderControl = testComponent.control;

      // The control should start off valid, pristine, and untouched.
      expect(sliderControl.valid).toBe(true);
      expect(sliderControl.pristine).toBe(true);
      expect(sliderControl.touched).toBe(false);

      // After changing the value, the control should become dirty (not pristine),
      // but remain untouched.
      dispatchMousedownEventSequence(sliderNativeElement, 0.5);
      fixture.detectChanges();
      dispatchSlideEndEvent(sliderNativeElement, 0.5);

      expect(sliderControl.valid).toBe(true);
      expect(sliderControl.pristine).toBe(false);
      expect(sliderControl.touched).toBe(false);

      // If the control has been visited due to interaction, the control should remain
      // dirty and now also be touched.
      sliderInstance._onBlur();
      fixture.detectChanges();

      expect(sliderControl.valid).toBe(true);
      expect(sliderControl.pristine).toBe(false);
      expect(sliderControl.touched).toBe(true);
    });
  });

  describe('slider with a two-way binding', () => {
    let fixture: ComponentFixture<SliderWithTwoWayBinding>;
    let testComponent: SliderWithTwoWayBinding;
    let sliderNativeElement: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(SliderWithTwoWayBinding);
      fixture.detectChanges();

      testComponent = fixture.componentInstance;
      let sliderDebugElement = fixture.debugElement.query(By.directive(MatSlider))!;
      sliderNativeElement = sliderDebugElement.nativeElement;
    });

    it('should sync the value binding in both directions', () => {
      expect(testComponent.value).toBe(0);
      expect(testComponent.slider.value).toBe(0);

      dispatchMousedownEventSequence(sliderNativeElement, 0.1);
      fixture.detectChanges();
      dispatchSlideEndEvent(sliderNativeElement, 0.1);

      expect(testComponent.value).toBe(10);
      expect(testComponent.slider.value).toBe(10);

      testComponent.value = 20;
      fixture.detectChanges();

      expect(testComponent.value).toBe(20);
      expect(testComponent.slider.value).toBe(20);
    });
  });
});

// Disable animations and make the slider an even 100px (+ 8px padding on either side)
// so we get nice round values in tests.
const styles = `
  .mat-slider-horizontal { min-width: 116px !important; }
  .mat-slider-vertical { min-height: 116px !important; }
  .mat-slider-track-fill { transition: none !important; }
`;

@Component({
  template: `<mat-slider></mat-slider>`,
  styles: [styles],
})
class StandardSlider {}

@Component({
  template: `<mat-slider disabled></mat-slider>`,
  styles: [styles],
})
class DisabledSlider {}

@Component({
  template: `<mat-slider [min]="min" [max]="max" [step]="step" tickInterval="6"></mat-slider>`,
  styles: [styles],
})
class SliderWithMinAndMax {
  min = 4;
  max = 6;
  step = 1;
}

@Component({
  template: `<mat-slider value="26"></mat-slider>`,
  styles: [styles],
})
class SliderWithValue {}

@Component({
  template: `<mat-slider [step]="step" [valueText]="valueText"></mat-slider>`,
  styles: [styles],
})
class SliderWithStep {
  step = 25;
  valueText: string;
}

@Component({
  template: `<mat-slider step="5" tickInterval="auto"></mat-slider>`,
  styles: [styles],
})
class SliderWithAutoTickInterval {}

@Component({
  template: `<mat-slider step="3" [tickInterval]="tickInterval"></mat-slider>`,
  styles: [styles],
})
class SliderWithSetTickInterval {
  tickInterval = 6;
}

@Component({
  template: `<mat-slider thumbLabel></mat-slider>`,
  styles: [styles],
})
class SliderWithThumbLabel {}

@Component({
  template: `<mat-slider min="1" max="100000" [displayWith]="displayWith" thumbLabel></mat-slider>`,
  styles: [styles],
})
class SliderWithCustomThumbLabelFormatting {
  displayWith(value: number) {
    if (value >= 1000) {
      return value / 1000 + 'k';
    }

    return value;
  }
}

@Component({
  template: `<mat-slider [value]="val"></mat-slider>`,
  styles: [styles],
})
class SliderWithOneWayBinding {
  val = 50;
}

@Component({
  template: `<mat-slider [formControl]="control"></mat-slider>`,
  styles: [styles],
})
class SliderWithFormControl {
  control = new FormControl(0);
}

@Component({
  template: `<mat-slider [(ngModel)]="val"></mat-slider>`,
  styles: [styles],
})
class SliderWithNgModel {
  @ViewChild(MatSlider) slider: MatSlider;
  val: number | undefined = 0;
}

@Component({
  template: `<mat-slider value="3" min="4" max="6"></mat-slider>`,
  styles: [styles],
})
class SliderWithValueSmallerThanMin {}

@Component({
  template: `<mat-slider value="7" min="4" max="6"></mat-slider>`,
  styles: [styles],
})
class SliderWithValueGreaterThanMax {}

@Component({
  template: `<mat-slider (change)="onChange($event)" (input)="onInput($event)"></mat-slider>`,
  styles: [styles],
})
class SliderWithChangeHandler {
  onChange() {}
  onInput() {}

  @ViewChild(MatSlider) slider: MatSlider;
}

@Component({
  template: `<div [dir]="dir"><mat-slider [invert]="invert" tickInterval="5"></mat-slider></div>`,
  styles: [styles],
})
class SliderWithDirAndInvert {
  dir = 'ltr';
  invert = false;
}

@Component({
  template: `<mat-slider vertical [invert]="invert"></mat-slider>`,
  styles: [styles],
})
class VerticalSlider {
  invert = false;
}

@Component({
  template: `<mat-slider [tabIndex]="tabIndex"></mat-slider>`,
  styles: [styles],
})
class SliderWithTabIndexBinding {
  tabIndex: number;
}

@Component({
  template: `<mat-slider tabindex="5"></mat-slider>`,
  styles: [styles],
})
class SliderWithNativeTabindexAttr {
  tabIndex: number;
}

@Component({
  template: '<mat-slider [(value)]="value"></mat-slider>',
  styles: [styles],
})
class SliderWithTwoWayBinding {
  @ViewChild(MatSlider) slider: MatSlider;
  value = 0;
}

/**
 * Dispatches a mousedown event sequence (consisting of moueseenter, mousedown) from an element.
 * Note: The mouse event truncates the position for the event.
 * @param sliderElement The mat-slider element from which the event will be dispatched.
 * @param percentage The percentage of the slider where the event should occur. Used to find the
 * physical location of the pointer.
 * @param button Button that should be held down when starting to drag the slider.
 */
function dispatchMousedownEventSequence(
  sliderElement: HTMLElement,
  percentage: number,
  button = 0,
): void {
  const trackElement = sliderElement.querySelector('.mat-slider-wrapper')!;
  const dimensions = trackElement.getBoundingClientRect();
  const x = dimensions.left + dimensions.width * percentage;
  const y = dimensions.top + dimensions.height * percentage;

  dispatchMouseenterEvent(sliderElement);
  dispatchEvent(sliderElement, createMouseEvent('mousedown', x, y, button));
}

/**
 * Dispatches a slide event sequence (consisting of slidestart, slide, slideend) from an element.
 * @param sliderElement The mat-slider element from which the event will be dispatched.
 * @param startPercent The percentage of the slider where the slide will begin.
 * @param endPercent The percentage of the slider where the slide will end.
 */
function dispatchSlideEventSequence(
  sliderElement: HTMLElement,
  startPercent: number,
  endPercent: number,
): void {
  dispatchMouseenterEvent(sliderElement);
  dispatchSlideStartEvent(sliderElement, startPercent);
  dispatchSlideEvent(sliderElement, startPercent);
  dispatchSlideEvent(sliderElement, endPercent);
  dispatchSlideEndEvent(sliderElement, endPercent);
}

/**
 * Dispatches a slide event from an element.
 * @param sliderElement The mat-slider element from which the event will be dispatched.
 * @param percent The percentage of the slider where the slide will happen.
 */
function dispatchSlideEvent(sliderElement: HTMLElement, percent: number): void {
  const trackElement = sliderElement.querySelector('.mat-slider-wrapper')!;
  const dimensions = trackElement.getBoundingClientRect();
  const x = dimensions.left + dimensions.width * percent;
  const y = dimensions.top + dimensions.height * percent;
  dispatchMouseEvent(document, 'mousemove', x, y);
}

/**
 * Dispatches a slidestart event from an element.
 * @param sliderElement The mat-slider element from which the event will be dispatched.
 * @param percent The percentage of the slider where the slide will begin.
 */
function dispatchSlideStartEvent(sliderElement: HTMLElement, percent: number): void {
  const trackElement = sliderElement.querySelector('.mat-slider-wrapper')!;
  const dimensions = trackElement.getBoundingClientRect();
  const x = dimensions.left + dimensions.width * percent;
  const y = dimensions.top + dimensions.height * percent;
  dispatchMouseenterEvent(sliderElement);
  dispatchMouseEvent(sliderElement, 'mousedown', x, y);
}

/**
 * Dispatches a slideend event from an element.
 * @param sliderElement The mat-slider element from which the event will be dispatched.
 * @param percent The percentage of the slider where the slide will end.
 */
function dispatchSlideEndEvent(sliderElement: HTMLElement, percent: number): void {
  const trackElement = sliderElement.querySelector('.mat-slider-wrapper')!;
  const dimensions = trackElement.getBoundingClientRect();
  const x = dimensions.left + dimensions.width * percent;
  const y = dimensions.top + dimensions.height * percent;
  dispatchMouseEvent(document, 'mouseup', x, y);
}

/**
 * Dispatches a mouseenter event from an element.
 * Note: The mouse event truncates the position for the event.
 * @param element The element from which the event will be dispatched.
 */
function dispatchMouseenterEvent(element: HTMLElement): void {
  const dimensions = element.getBoundingClientRect();
  const y = dimensions.top;
  const x = dimensions.left;
  dispatchMouseEvent(element, 'mouseenter', x, y);
}
