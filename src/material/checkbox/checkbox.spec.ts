import {ComponentFixture, fakeAsync, TestBed, flush, flushMicrotasks} from '@angular/core/testing';
import {FormControl, FormsModule, NgModel, ReactiveFormsModule} from '@angular/forms';
import {Component, DebugElement, ViewChild, Type, ChangeDetectionStrategy} from '@angular/core';
import {By} from '@angular/platform-browser';
import {dispatchFakeEvent} from '../../cdk/testing/private';
import {
  MAT_CHECKBOX_DEFAULT_OPTIONS,
  MatCheckbox,
  MatCheckboxChange,
  MatCheckboxModule,
} from './index';
import {MutationObserverFactory} from '@angular/cdk/observers';
import {ThemePalette} from '@angular/material/core';
import {MatCheckboxDefaultOptions} from './checkbox-config';

describe('MatCheckbox', () => {
  let fixture: ComponentFixture<any>;

  function createComponent<T>(componentType: Type<T>, extraDeclarations: Type<any>[] = []) {
    TestBed.configureTestingModule({
      imports: [MatCheckboxModule, FormsModule, ReactiveFormsModule],
      declarations: [componentType, ...extraDeclarations],
    }).compileComponents();

    return TestBed.createComponent<T>(componentType);
  }

  describe('basic behaviors', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let checkboxInstance: MatCheckbox;
    let testComponent: SingleCheckbox;
    let inputElement: HTMLInputElement;
    let labelElement: HTMLLabelElement;

    beforeEach(() => {
      fixture = createComponent(SingleCheckbox);
      fixture.detectChanges();

      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      checkboxInstance = checkboxDebugElement.componentInstance;
      testComponent = fixture.debugElement.componentInstance;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
      labelElement = <HTMLLabelElement>checkboxNativeElement.querySelector('label');
    });

    it('should add and remove the checked state', () => {
      expect(checkboxInstance.checked).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');
      expect(inputElement.checked).toBe(false);

      testComponent.isChecked = true;
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(true);
      expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');
      expect(inputElement.checked).toBe(true);

      testComponent.isChecked = false;
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');
      expect(inputElement.checked).toBe(false);
    });

    it('should expose the ripple instance', () => {
      expect(checkboxInstance.ripple).toBeTruthy();
    });

    it('should hide the internal SVG', () => {
      const svg = checkboxNativeElement.querySelector('svg')!;
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    it('should add and remove indeterminate state', () => {
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');
      expect(inputElement.checked).toBe(false);
      expect(inputElement.indeterminate).toBe(false);
      expect(inputElement.getAttribute('aria-checked'))
        .withContext('Expect aria-checked to be false')
        .toBe('false');

      testComponent.isIndeterminate = true;
      fixture.detectChanges();

      expect(checkboxNativeElement.classList).toContain('mat-checkbox-indeterminate');
      expect(inputElement.checked).toBe(false);
      expect(inputElement.indeterminate).toBe(true);
      expect(inputElement.getAttribute('aria-checked'))
        .withContext('Expect aria checked to be mixed for indeterminate checkbox')
        .toBe('mixed');

      testComponent.isIndeterminate = false;
      fixture.detectChanges();

      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-indeterminate');
      expect(inputElement.checked).toBe(false);
      expect(inputElement.indeterminate).toBe(false);
    });

    it('should set indeterminate to false when input clicked', fakeAsync(() => {
      testComponent.isIndeterminate = true;
      fixture.detectChanges();

      expect(checkboxInstance.indeterminate).toBe(true);
      expect(inputElement.indeterminate).toBe(true);
      expect(testComponent.isIndeterminate).toBe(true);

      inputElement.click();
      fixture.detectChanges();

      // Flush the microtasks because the forms module updates the model state asynchronously.
      flush();

      // The checked property has been updated from the model and now the view needs
      // to reflect the state change.
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(true);
      expect(inputElement.indeterminate).toBe(false);
      expect(inputElement.checked).toBe(true);
      expect(testComponent.isIndeterminate).toBe(false);

      testComponent.isIndeterminate = true;
      fixture.detectChanges();

      expect(checkboxInstance.indeterminate).toBe(true);
      expect(inputElement.indeterminate).toBe(true);
      expect(inputElement.checked).toBe(true);
      expect(testComponent.isIndeterminate).toBe(true);
      expect(inputElement.getAttribute('aria-checked'))
        .withContext('Expect aria checked to be true')
        .toBe('true');

      inputElement.click();
      fixture.detectChanges();

      // Flush the microtasks because the forms module updates the model state asynchronously.
      flush();

      // The checked property has been updated from the model and now the view needs
      // to reflect the state change.
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
      expect(inputElement.indeterminate).toBe(false);
      expect(inputElement.checked).toBe(false);
      expect(testComponent.isIndeterminate).toBe(false);
    }));

    it('should not set indeterminate to false when checked is set programmatically', () => {
      testComponent.isIndeterminate = true;
      fixture.detectChanges();

      expect(checkboxInstance.indeterminate).toBe(true);
      expect(inputElement.indeterminate).toBe(true);
      expect(testComponent.isIndeterminate).toBe(true);

      testComponent.isChecked = true;
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(true);
      expect(inputElement.indeterminate).toBe(true);
      expect(inputElement.checked).toBe(true);
      expect(testComponent.isIndeterminate).toBe(true);

      testComponent.isChecked = false;
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
      expect(inputElement.indeterminate).toBe(true);
      expect(inputElement.checked).toBe(false);
      expect(testComponent.isIndeterminate).toBe(true);
    });

    it('should change native element checked when check programmatically', () => {
      expect(inputElement.checked).toBe(false);

      checkboxInstance.checked = true;
      fixture.detectChanges();

      expect(inputElement.checked).toBe(true);
    });

    it('should toggle checked state on click', () => {
      expect(checkboxInstance.checked).toBe(false);

      labelElement.click();
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(true);

      labelElement.click();
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
    });

    it('should change from indeterminate to checked on click', fakeAsync(() => {
      testComponent.isChecked = false;
      testComponent.isIndeterminate = true;
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
      expect(checkboxInstance.indeterminate).toBe(true);

      checkboxInstance._onInputClick(<Event>{stopPropagation: () => {}});

      // Flush the microtasks because the indeterminate state will be updated in the next tick.
      flush();

      expect(checkboxInstance.checked).toBe(true);
      expect(checkboxInstance.indeterminate).toBe(false);

      checkboxInstance._onInputClick(<Event>{stopPropagation: () => {}});
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
      expect(checkboxInstance.indeterminate).toBe(false);

      flush();
    }));

    it('should add and remove disabled state', () => {
      expect(checkboxInstance.disabled).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-disabled');
      expect(inputElement.tabIndex).toBe(0);
      expect(inputElement.disabled).toBe(false);

      testComponent.isDisabled = true;
      fixture.detectChanges();

      expect(checkboxInstance.disabled).toBe(true);
      expect(checkboxNativeElement.classList).toContain('mat-checkbox-disabled');
      expect(inputElement.disabled).toBe(true);

      testComponent.isDisabled = false;
      fixture.detectChanges();

      expect(checkboxInstance.disabled).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-disabled');
      expect(inputElement.tabIndex).toBe(0);
      expect(inputElement.disabled).toBe(false);
    });

    it('should not toggle `checked` state upon interation while disabled', () => {
      testComponent.isDisabled = true;
      fixture.detectChanges();

      checkboxNativeElement.click();
      expect(checkboxInstance.checked).toBe(false);
    });

    it('should overwrite indeterminate state when clicked', fakeAsync(() => {
      testComponent.isIndeterminate = true;
      fixture.detectChanges();

      inputElement.click();
      fixture.detectChanges();

      // Flush the microtasks because the indeterminate state will be updated in the next tick.
      flush();

      expect(checkboxInstance.checked).toBe(true);
      expect(checkboxInstance.indeterminate).toBe(false);
    }));

    it('should preserve the user-provided id', () => {
      expect(checkboxNativeElement.id).toBe('simple-check');
      expect(inputElement.id).toBe('simple-check-input');
    });

    it('should generate a unique id for the checkbox input if no id is set', () => {
      testComponent.checkboxId = null;
      fixture.detectChanges();

      expect(checkboxInstance.inputId).toMatch(/mat-checkbox-\d+/);
      expect(inputElement.id).toBe(checkboxInstance.inputId);
    });

    it('should project the checkbox content into the label element', () => {
      const label = <HTMLLabelElement>checkboxNativeElement.querySelector('.mat-checkbox-label');
      expect(label.textContent!.trim()).toBe('Simple checkbox');
    });

    it('should make the host element a tab stop', () => {
      expect(inputElement.tabIndex).toBe(0);
    });

    it('should add a css class to position the label before the checkbox', () => {
      testComponent.labelPos = 'before';
      fixture.detectChanges();

      expect(checkboxNativeElement.classList).toContain('mat-checkbox-label-before');
    });

    it('should not trigger the click event multiple times', () => {
      // By default, when clicking on a label element, a generated click will be dispatched
      // on the associated input element.
      // Since we're using a label element and a visual hidden input, this behavior can led
      // to an issue, where the click events on the checkbox are getting executed twice.

      spyOn(testComponent, 'onCheckboxClick');

      expect(inputElement.checked).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');

      labelElement.click();
      fixture.detectChanges();

      expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');
      expect(inputElement.checked).toBe(true);

      expect(testComponent.onCheckboxClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger a change event when the native input does', fakeAsync(() => {
      spyOn(testComponent, 'onCheckboxChange');

      expect(inputElement.checked).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');

      labelElement.click();
      fixture.detectChanges();

      expect(inputElement.checked).toBe(true);
      expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');

      fixture.detectChanges();
      flush();

      // The change event shouldn't fire, because the value change was not caused
      // by any interaction.
      expect(testComponent.onCheckboxChange).toHaveBeenCalledTimes(1);
    }));

    it('should not trigger the change event by changing the native value', fakeAsync(() => {
      spyOn(testComponent, 'onCheckboxChange');

      expect(inputElement.checked).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');

      testComponent.isChecked = true;
      fixture.detectChanges();

      expect(inputElement.checked).toBe(true);
      expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');

      fixture.detectChanges();
      flush();

      // The change event shouldn't fire, because the value change was not caused
      // by any interaction.
      expect(testComponent.onCheckboxChange).not.toHaveBeenCalled();
    }));

    it('should keep the view in sync if the `checked` value changes inside the `change` listener', fakeAsync(() => {
      spyOn(testComponent, 'onCheckboxChange').and.callFake(() => {
        checkboxInstance.checked = false;
      });

      labelElement.click();
      fixture.detectChanges();
      flush();

      expect(inputElement.checked).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');
    }));

    it('should forward the required attribute', () => {
      testComponent.isRequired = true;
      fixture.detectChanges();

      expect(inputElement.required).toBe(true);

      testComponent.isRequired = false;
      fixture.detectChanges();

      expect(inputElement.required).toBe(false);
    });

    it('should focus on underlying input element when focus() is called', () => {
      expect(document.activeElement).not.toBe(inputElement);

      checkboxInstance.focus();
      fixture.detectChanges();

      expect(document.activeElement).toBe(inputElement);
    });

    it('should forward the value to input element', () => {
      testComponent.checkboxValue = 'basic_checkbox';
      fixture.detectChanges();

      expect(inputElement.value).toBe('basic_checkbox');
    });

    it('should remove the SVG checkmark from the tab order', () => {
      expect(checkboxNativeElement.querySelector('svg')!.getAttribute('focusable')).toBe('false');
    });

    describe('ripple elements', () => {
      it('should show ripples on label mousedown', () => {
        const rippleSelector = '.mat-ripple-element:not(.mat-checkbox-persistent-ripple)';

        expect(checkboxNativeElement.querySelector(rippleSelector)).toBeFalsy();

        dispatchFakeEvent(labelElement, 'mousedown');
        dispatchFakeEvent(labelElement, 'mouseup');

        expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(1);
      });

      it('should not show ripples when disabled', () => {
        const rippleSelector = '.mat-ripple-element:not(.mat-checkbox-persistent-ripple)';
        testComponent.isDisabled = true;
        fixture.detectChanges();

        dispatchFakeEvent(labelElement, 'mousedown');
        dispatchFakeEvent(labelElement, 'mouseup');

        expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(0);

        testComponent.isDisabled = false;
        fixture.detectChanges();

        dispatchFakeEvent(labelElement, 'mousedown');
        dispatchFakeEvent(labelElement, 'mouseup');

        expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(1);
      });

      it('should remove ripple if matRippleDisabled input is set', () => {
        const rippleSelector = '.mat-ripple-element:not(.mat-checkbox-persistent-ripple)';
        testComponent.disableRipple = true;
        fixture.detectChanges();

        dispatchFakeEvent(labelElement, 'mousedown');
        dispatchFakeEvent(labelElement, 'mouseup');

        expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(0);

        testComponent.disableRipple = false;
        fixture.detectChanges();

        dispatchFakeEvent(labelElement, 'mousedown');
        dispatchFakeEvent(labelElement, 'mouseup');

        expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(1);
      });
    });

    describe('color behaviour', () => {
      it('should apply class based on color attribute', () => {
        testComponent.checkboxColor = 'primary';
        fixture.detectChanges();
        expect(checkboxNativeElement.classList.contains('mat-primary')).toBe(true);

        testComponent.checkboxColor = 'accent';
        fixture.detectChanges();
        expect(checkboxNativeElement.classList.contains('mat-accent')).toBe(true);
      });

      it('should not clear previous defined classes', () => {
        checkboxNativeElement.classList.add('custom-class');

        testComponent.checkboxColor = 'primary';
        fixture.detectChanges();

        expect(checkboxNativeElement.classList.contains('mat-primary')).toBe(true);
        expect(checkboxNativeElement.classList.contains('custom-class')).toBe(true);

        testComponent.checkboxColor = 'accent';
        fixture.detectChanges();

        expect(checkboxNativeElement.classList.contains('mat-primary')).toBe(false);
        expect(checkboxNativeElement.classList.contains('mat-accent')).toBe(true);
        expect(checkboxNativeElement.classList.contains('custom-class')).toBe(true);
      });

      it('should default to accent if no color is passed in', () => {
        testComponent.checkboxColor = undefined;
        fixture.detectChanges();
        expect(checkboxNativeElement.classList).toContain('mat-accent');
      });
    });

    describe('state transition css classes', () => {
      it('should transition unchecked -> checked -> unchecked', () => {
        inputElement.click();
        fixture.detectChanges();
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-anim-unchecked-checked');

        inputElement.click();
        fixture.detectChanges();
        expect(checkboxNativeElement.classList).not.toContain(
          'mat-checkbox-anim-unchecked-checked',
        );
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-anim-checked-unchecked');
      });

      it('should transition unchecked -> indeterminate -> unchecked', () => {
        testComponent.isIndeterminate = true;
        fixture.detectChanges();

        expect(checkboxNativeElement.classList).toContain(
          'mat-checkbox-anim-unchecked-indeterminate',
        );

        testComponent.isIndeterminate = false;
        fixture.detectChanges();

        expect(checkboxNativeElement.classList).not.toContain(
          'mat-checkbox-anim-unchecked-indeterminate',
        );
        expect(checkboxNativeElement.classList).toContain(
          'mat-checkbox-anim-indeterminate-unchecked',
        );
      });

      it('should transition indeterminate -> checked', () => {
        testComponent.isIndeterminate = true;
        fixture.detectChanges();

        inputElement.click();
        fixture.detectChanges();

        expect(checkboxNativeElement.classList).not.toContain(
          'mat-checkbox-anim-unchecked-indeterminate',
        );
        expect(checkboxNativeElement.classList).toContain(
          'mat-checkbox-anim-indeterminate-checked',
        );
      });

      it('should not apply transition classes when there is no state change', () => {
        testComponent.isChecked = checkboxInstance.checked;
        fixture.detectChanges();
        expect(checkboxNativeElement).not.toMatch(/^mat\-checkbox\-anim/g);

        testComponent.isIndeterminate = checkboxInstance.indeterminate;
        expect(checkboxNativeElement).not.toMatch(/^mat\-checkbox\-anim/g);
      });

      it('should not initially have any transition classes', () => {
        expect(checkboxNativeElement).not.toMatch(/^mat\-checkbox\-anim/g);
      });

      it('should not have transition classes when animation ends', fakeAsync(() => {
        testComponent.isIndeterminate = true;
        fixture.detectChanges();

        expect(checkboxNativeElement.classList).toContain(
          'mat-checkbox-anim-unchecked-indeterminate',
        );

        flush();

        expect(checkboxNativeElement.classList).not.toContain(
          'mat-checkbox-anim-unchecked-indeterminate',
        );
      }));
    });

    describe(`when MAT_CHECKBOX_CLICK_ACTION is 'check'`, () => {
      beforeEach(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [MatCheckboxModule, FormsModule, ReactiveFormsModule],
          declarations: [SingleCheckbox],
          providers: [{provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: {clickAction: 'check'}}],
        });

        fixture = createComponent(SingleCheckbox);
        fixture.detectChanges();

        checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
        checkboxNativeElement = checkboxDebugElement.nativeElement;
        checkboxInstance = checkboxDebugElement.componentInstance;
        testComponent = fixture.debugElement.componentInstance;

        inputElement = checkboxNativeElement.querySelector('input') as HTMLInputElement;
        labelElement = checkboxNativeElement.querySelector('label') as HTMLLabelElement;
      });

      it('should not set `indeterminate` to false on click if check is set', fakeAsync(() => {
        testComponent.isIndeterminate = true;
        inputElement.click();

        fixture.detectChanges();
        flush();
        fixture.detectChanges();
        expect(inputElement.checked).toBe(true);
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');
        expect(inputElement.indeterminate).toBe(true);
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-indeterminate');
      }));
    });

    describe(`when MAT_CHECKBOX_CLICK_ACTION is 'noop'`, () => {
      beforeEach(() => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [MatCheckboxModule, FormsModule, ReactiveFormsModule],
          declarations: [SingleCheckbox],
          providers: [{provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: {clickAction: 'noop'}}],
        });

        fixture = createComponent(SingleCheckbox);
        fixture.detectChanges();

        checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
        checkboxNativeElement = checkboxDebugElement.nativeElement;
        checkboxInstance = checkboxDebugElement.componentInstance;
        testComponent = fixture.debugElement.componentInstance;
        inputElement = checkboxNativeElement.querySelector('input') as HTMLInputElement;
        labelElement = checkboxNativeElement.querySelector('label') as HTMLLabelElement;
      });

      it('should not change `indeterminate` on click if noop is set', fakeAsync(() => {
        testComponent.isIndeterminate = true;
        inputElement.click();

        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(inputElement.checked).toBe(false);
        expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');
        expect(inputElement.indeterminate).toBe(true);
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-indeterminate');
      }));

      it(`should not change 'checked' or 'indeterminate' on click if noop is set`, fakeAsync(() => {
        testComponent.isChecked = true;
        testComponent.isIndeterminate = true;
        inputElement.click();

        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(inputElement.checked).toBe(true);
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-checked');
        expect(inputElement.indeterminate).toBe(true);
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-indeterminate');

        testComponent.isChecked = false;
        inputElement.click();

        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(inputElement.checked).toBe(false);
        expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-checked');
        expect(inputElement.indeterminate)
          .withContext('indeterminate should not change')
          .toBe(true);
        expect(checkboxNativeElement.classList).toContain('mat-checkbox-indeterminate');
      }));
    });

    it('should have a focus indicator', () => {
      const checkboxRippleNativeElement =
        checkboxNativeElement.querySelector('.mat-checkbox-ripple')!;

      expect(checkboxRippleNativeElement.classList.contains('mat-focus-indicator')).toBe(true);
    });
  });

  describe('with change event and no initial value', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let checkboxInstance: MatCheckbox;
    let testComponent: CheckboxWithChangeEvent;
    let inputElement: HTMLInputElement;
    let labelElement: HTMLLabelElement;

    beforeEach(() => {
      fixture = createComponent(CheckboxWithChangeEvent);
      fixture.detectChanges();

      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      checkboxInstance = checkboxDebugElement.componentInstance;
      testComponent = fixture.debugElement.componentInstance;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
      labelElement = <HTMLLabelElement>checkboxNativeElement.querySelector('label');
    });

    it('should emit the event to the change observable', () => {
      const changeSpy = jasmine.createSpy('onChangeObservable');

      checkboxInstance.change.subscribe(changeSpy);

      fixture.detectChanges();
      expect(changeSpy).not.toHaveBeenCalled();

      // When changing the native `checked` property the checkbox will not fire a change event,
      // because the element is not focused and it's not the native behavior of the input element.
      labelElement.click();
      fixture.detectChanges();

      expect(changeSpy).toHaveBeenCalledTimes(1);
    });

    it('should not emit a DOM event to the change output', fakeAsync(() => {
      fixture.detectChanges();
      expect(testComponent.lastEvent).toBeUndefined();

      // Trigger the click on the inputElement, because the input will probably
      // emit a DOM event to the change output.
      inputElement.click();
      fixture.detectChanges();
      flush();

      // We're checking the arguments type / emitted value to be a boolean, because sometimes the
      // emitted value can be a DOM Event, which is not valid.
      // See angular/angular#4059
      expect(testComponent.lastEvent.checked).toBe(true);
    }));
  });

  describe('aria-label', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let inputElement: HTMLInputElement;

    it('should use the provided aria-label', () => {
      fixture = createComponent(CheckboxWithAriaLabel);
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');

      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-label')).toBe('Super effective');
    });

    it('should not set the aria-label attribute if no value is provided', () => {
      fixture = createComponent(SingleCheckbox);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('with provided aria-labelledby ', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let inputElement: HTMLInputElement;

    it('should use the provided aria-labelledby', () => {
      fixture = createComponent(CheckboxWithAriaLabelledby);
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');

      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-labelledby')).toBe('some-id');
    });

    it('should not assign aria-labelledby if none is provided', () => {
      fixture = createComponent(SingleCheckbox);
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');

      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-labelledby')).toBe(null);
    });
  });

  describe('with provided aria-describedby ', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let inputElement: HTMLInputElement;

    it('should use the provided aria-describedby', () => {
      fixture = createComponent(CheckboxWithAriaDescribedby);
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');

      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-describedby')).toBe('some-id');
    });

    it('should not assign aria-describedby if none is provided', () => {
      fixture = createComponent(SingleCheckbox);
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');

      fixture.detectChanges();
      expect(inputElement.getAttribute('aria-describedby')).toBe(null);
    });
  });

  describe('with provided tabIndex', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let testComponent: CheckboxWithTabIndex;
    let inputElement: HTMLInputElement;

    beforeEach(() => {
      fixture = createComponent(CheckboxWithTabIndex);
      fixture.detectChanges();

      testComponent = fixture.debugElement.componentInstance;
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
    });

    it('should preserve any given tabIndex', () => {
      expect(inputElement.tabIndex).toBe(7);
    });

    it('should preserve given tabIndex when the checkbox is disabled then enabled', () => {
      testComponent.isDisabled = true;
      fixture.detectChanges();

      testComponent.customTabIndex = 13;
      fixture.detectChanges();

      testComponent.isDisabled = false;
      fixture.detectChanges();

      expect(inputElement.tabIndex).toBe(13);
    });
  });

  describe('with native tabindex attribute', () => {
    it('should properly detect native tabindex attribute', fakeAsync(() => {
      fixture = createComponent(CheckboxWithTabindexAttr);
      fixture.detectChanges();

      const checkbox = fixture.debugElement.query(By.directive(MatCheckbox))!
        .componentInstance as MatCheckbox;

      expect(checkbox.tabIndex)
        .withContext('Expected tabIndex property to have been set based on the native attribute')
        .toBe(5);
    }));

    it('should clear the tabindex attribute from the host element', () => {
      fixture = createComponent(CheckboxWithTabindexAttr);
      fixture.detectChanges();

      const checkbox = fixture.debugElement.query(By.directive(MatCheckbox))!.nativeElement;
      expect(checkbox.getAttribute('tabindex')).toBeFalsy();
    });
  });

  describe('using ViewChild', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let testComponent: CheckboxUsingViewChild;

    beforeEach(() => {
      fixture = createComponent(CheckboxUsingViewChild);
      fixture.detectChanges();

      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      testComponent = fixture.debugElement.componentInstance;
    });

    it('should toggle checkbox disabledness correctly', () => {
      const checkboxInstance = checkboxDebugElement.componentInstance;
      const inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
      expect(checkboxInstance.disabled).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-disabled');
      expect(inputElement.tabIndex).toBe(0);
      expect(inputElement.disabled).toBe(false);

      testComponent.isDisabled = true;
      fixture.detectChanges();

      expect(checkboxInstance.disabled).toBe(true);
      expect(checkboxNativeElement.classList).toContain('mat-checkbox-disabled');
      expect(inputElement.disabled).toBe(true);

      testComponent.isDisabled = false;
      fixture.detectChanges();

      expect(checkboxInstance.disabled).toBe(false);
      expect(checkboxNativeElement.classList).not.toContain('mat-checkbox-disabled');
      expect(inputElement.tabIndex).toBe(0);
      expect(inputElement.disabled).toBe(false);
    });

    it('should toggle checkbox ripple disabledness correctly', () => {
      const rippleSelector = '.mat-ripple-element:not(.mat-checkbox-persistent-ripple)';
      const labelElement = checkboxNativeElement.querySelector('label') as HTMLLabelElement;

      testComponent.isDisabled = true;
      fixture.detectChanges();
      dispatchFakeEvent(labelElement, 'mousedown');
      dispatchFakeEvent(labelElement, 'mouseup');
      expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(0);

      testComponent.isDisabled = false;
      fixture.detectChanges();
      dispatchFakeEvent(labelElement, 'mousedown');
      dispatchFakeEvent(labelElement, 'mouseup');
      expect(checkboxNativeElement.querySelectorAll(rippleSelector).length).toBe(1);
    });
  });

  describe('with multiple checkboxes', () => {
    beforeEach(() => {
      fixture = createComponent(MultipleCheckboxes);
      fixture.detectChanges();
    });

    it('should assign a unique id to each checkbox', () => {
      const [firstId, secondId] = fixture.debugElement
        .queryAll(By.directive(MatCheckbox))
        .map(debugElement => debugElement.nativeElement.querySelector('input').id);

      expect(firstId).toMatch(/mat-checkbox-\d+-input/);
      expect(secondId).toMatch(/mat-checkbox-\d+-input/);
      expect(firstId).not.toEqual(secondId);
    });

    it('should not change focus origin if origin not specified', () => {
      const [firstCheckboxDebugEl, secondCheckboxDebugEl] = fixture.debugElement.queryAll(
        By.directive(MatCheckbox),
      );
      fixture.detectChanges();

      const firstCheckboxInstance = firstCheckboxDebugEl.componentInstance as MatCheckbox;
      const secondCheckboxInstance = secondCheckboxDebugEl.componentInstance as MatCheckbox;

      firstCheckboxInstance.focus('mouse');
      secondCheckboxInstance.focus();

      expect(secondCheckboxDebugEl.nativeElement.classList).toContain('cdk-focused');
      expect(secondCheckboxDebugEl.nativeElement.classList).toContain('cdk-mouse-focused');
    });
  });

  describe('with ngModel', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxNativeElement: HTMLElement;
    let checkboxInstance: MatCheckbox;
    let inputElement: HTMLInputElement;
    let ngModel: NgModel;

    beforeEach(() => {
      fixture = createComponent(CheckboxWithNgModel);

      fixture.componentInstance.isRequired = false;
      fixture.detectChanges();

      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      checkboxInstance = checkboxDebugElement.componentInstance;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
      ngModel = checkboxDebugElement.injector.get<NgModel>(NgModel);
    });

    it('should be pristine, untouched, and valid initially', () => {
      expect(ngModel.valid).toBe(true);
      expect(ngModel.pristine).toBe(true);
      expect(ngModel.touched).toBe(false);
    });

    it('should have correct control states after interaction', fakeAsync(() => {
      inputElement.click();
      fixture.detectChanges();

      // Flush the timeout that is being created whenever a `click` event has been fired by
      // the underlying input.
      flush();

      // After the value change through interaction, the control should be dirty, but remain
      // untouched as long as the focus is still on the underlying input.
      expect(ngModel.pristine).toBe(false);
      expect(ngModel.touched).toBe(false);

      // If the input element loses focus, the control should remain dirty but should
      // also turn touched.
      dispatchFakeEvent(inputElement, 'blur');
      fixture.detectChanges();
      flushMicrotasks();

      expect(ngModel.pristine).toBe(false);
      expect(ngModel.touched).toBe(true);
    }));

    it('should mark the element as touched on blur when inside an OnPush parent', fakeAsync(() => {
      fixture.destroy();
      TestBed.resetTestingModule();
      fixture = createComponent(CheckboxWithNgModelAndOnPush);
      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxNativeElement = checkboxDebugElement.nativeElement;
      checkboxInstance = checkboxDebugElement.componentInstance;
      inputElement = <HTMLInputElement>checkboxNativeElement.querySelector('input');
      ngModel = checkboxDebugElement.injector.get<NgModel>(NgModel);

      inputElement.click();
      fixture.detectChanges();
      flush();

      expect(checkboxNativeElement.classList).not.toContain('ng-touched');

      dispatchFakeEvent(inputElement, 'blur');
      fixture.detectChanges();
      flushMicrotasks();
      fixture.detectChanges();

      expect(checkboxNativeElement.classList).toContain('ng-touched');
    }));

    it('should not throw an error when disabling while focused', fakeAsync(() => {
      expect(() => {
        // Focus the input element because after disabling, the `blur` event should automatically
        // fire and not result in a changed after checked exception. Related: #12323
        inputElement.focus();

        // Flush the two nested timeouts from the FocusMonitor that are being created on `focus`.
        flush();

        checkboxInstance.disabled = true;
        fixture.detectChanges();
        flushMicrotasks();
      }).not.toThrow();
    }));

    it('should toggle checked state on click', () => {
      expect(checkboxInstance.checked).toBe(false);

      inputElement.click();
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(true);

      inputElement.click();
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
    });

    it('should validate with RequiredTrue validator', () => {
      fixture.componentInstance.isRequired = true;
      inputElement.click();
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(true);
      expect(ngModel.valid).toBe(true);

      inputElement.click();
      fixture.detectChanges();

      expect(checkboxInstance.checked).toBe(false);
      expect(ngModel.valid).toBe(false);
    });
  });

  describe('with name attribute', () => {
    beforeEach(() => {
      fixture = createComponent(CheckboxWithNameAttribute);
      fixture.detectChanges();
    });

    it('should forward name value to input element', () => {
      const checkboxElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      const inputElement = <HTMLInputElement>checkboxElement.nativeElement.querySelector('input');

      expect(inputElement.getAttribute('name')).toBe('test-name');
    });
  });

  describe('with form control', () => {
    let checkboxDebugElement: DebugElement;
    let checkboxInstance: MatCheckbox;
    let testComponent: CheckboxWithFormControl;
    let inputElement: HTMLInputElement;

    beforeEach(() => {
      fixture = createComponent(CheckboxWithFormControl);
      fixture.detectChanges();

      checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      checkboxInstance = checkboxDebugElement.componentInstance;
      testComponent = fixture.debugElement.componentInstance;
      inputElement = <HTMLInputElement>checkboxDebugElement.nativeElement.querySelector('input');
    });

    it('should toggle the disabled state', () => {
      expect(checkboxInstance.disabled).toBe(false);

      testComponent.formControl.disable();
      fixture.detectChanges();

      expect(checkboxInstance.disabled).toBe(true);
      expect(inputElement.disabled).toBe(true);

      testComponent.formControl.enable();
      fixture.detectChanges();

      expect(checkboxInstance.disabled).toBe(false);
      expect(inputElement.disabled).toBe(false);
    });
  });

  describe('without label', () => {
    let testComponent: CheckboxWithoutLabel;
    let checkboxInnerContainer: HTMLElement;

    beforeEach(() => {
      fixture = createComponent(CheckboxWithoutLabel);

      const checkboxDebugEl = fixture.debugElement.query(By.directive(MatCheckbox))!;

      testComponent = fixture.componentInstance;
      checkboxInnerContainer = checkboxDebugEl.query(
        By.css('.mat-checkbox-inner-container'),
      )!.nativeElement;
    });

    it('should remove margin for checkbox without a label', () => {
      fixture.detectChanges();

      expect(checkboxInnerContainer.classList).toContain(
        'mat-checkbox-inner-container-no-side-margin',
      );
    });

    it('should not remove margin if initial label is set through binding', () => {
      testComponent.label = 'Some content';
      fixture.detectChanges();

      expect(checkboxInnerContainer.classList).not.toContain(
        'mat-checkbox-inner-container-no-side-margin',
      );
    });

    it('should re-add margin if label is added asynchronously', () => {
      fixture.destroy();

      const mutationCallbacks: Function[] = [];

      TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [MatCheckboxModule, FormsModule, ReactiveFormsModule],
          declarations: [CheckboxWithoutLabel],
          providers: [
            {
              provide: MutationObserverFactory,
              useValue: {
                // Stub out the factory that creates mutation observers for the underlying directive
                // to allows us to flush out the callbacks asynchronously.
                create: (callback: Function) => {
                  mutationCallbacks.push(callback);

                  return {
                    observe: () => {},
                    disconnect: () => {},
                  };
                },
              },
            },
          ],
        })
        .compileComponents();

      fixture = createComponent(CheckboxWithoutLabel);
      checkboxInnerContainer = fixture.debugElement.query(
        By.css('.mat-checkbox-inner-container'),
      )!.nativeElement;

      fixture.detectChanges();

      expect(checkboxInnerContainer.classList).toContain(
        'mat-checkbox-inner-container-no-side-margin',
      );

      fixture.componentInstance.label = 'Some content';
      fixture.detectChanges();
      mutationCallbacks.forEach(callback => callback());

      // The MutationObserver from the cdkObserveContent directive detected the content change
      // and notified the checkbox component. The checkbox then marks the component as dirty
      // by calling `markForCheck()`. This needs to be reflected by the component template then.
      fixture.detectChanges();

      expect(checkboxInnerContainer.classList).not.toContain(
        'mat-checkbox-inner-container-no-side-margin',
      );
    });

    it('should not add the "name" attribute if it is not passed in', () => {
      fixture.detectChanges();
      expect(checkboxInnerContainer.querySelector('input')!.hasAttribute('name')).toBe(false);
    });

    it('should not add the "value" attribute if it is not passed in', () => {
      fixture.detectChanges();
      expect(checkboxInnerContainer.querySelector('input')!.hasAttribute('value')).toBe(false);
    });
  });

  describe('label margin', () => {
    it('should properly update margin if label content is projected', () => {
      const mutationCallbacks: Function[] = [];

      TestBed.configureTestingModule({
        providers: [
          {
            provide: MutationObserverFactory,
            useValue: {
              create: (callback: Function) => {
                mutationCallbacks.push(callback);
                return {observe: () => {}, disconnect: () => {}};
              },
            },
          },
        ],
      });

      fixture = createComponent(CheckboxWithProjectedLabel, [TextBindingComponent]);
      fixture.detectChanges();

      const checkboxInnerContainer = fixture.debugElement.query(
        By.css('.mat-checkbox-inner-container'),
      )!.nativeElement;

      // Do not run the change detection for the fixture manually because we want to verify
      // that the checkbox properly toggles the margin class even if the observe content output
      // fires outside of the zone.
      mutationCallbacks.forEach(callback => callback());

      expect(checkboxInnerContainer.classList).not.toContain(
        'mat-checkbox-inner-container-no-side-margin',
      );
    });
  });
});

describe('MatCheckboxDefaultOptions', () => {
  describe('when MAT_CHECKBOX_DEFAULT_OPTIONS overridden', () => {
    function configure(defaults: MatCheckboxDefaultOptions) {
      TestBed.configureTestingModule({
        imports: [MatCheckboxModule, FormsModule],
        declarations: [SingleCheckbox, SimpleCheckbox],
        providers: [{provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: defaults}],
      });

      TestBed.compileComponents();
    }

    it('should override default color in component', () => {
      configure({color: 'primary'});
      const fixture: ComponentFixture<SimpleCheckbox> = TestBed.createComponent(SimpleCheckbox);
      fixture.detectChanges();
      const checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      expect(checkboxDebugElement.nativeElement.classList).toContain('mat-primary');
    });

    it('should not override explicit input bindings', () => {
      configure({color: 'primary'});
      const fixture: ComponentFixture<SingleCheckbox> = TestBed.createComponent(SingleCheckbox);
      fixture.componentInstance.checkboxColor = 'warn';
      fixture.detectChanges();
      const checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      expect(checkboxDebugElement.nativeElement.classList).not.toContain('mat-primary');
      expect(checkboxDebugElement.nativeElement.classList).toContain('mat-warn');
      expect(checkboxDebugElement.nativeElement.classList).toContain('mat-warn');
    });

    it('should default to accent if config does not specify color', () => {
      configure({clickAction: 'noop'});
      const fixture: ComponentFixture<SimpleCheckbox> = TestBed.createComponent(SimpleCheckbox);
      fixture.detectChanges();
      const checkboxDebugElement = fixture.debugElement.query(By.directive(MatCheckbox))!;
      expect(checkboxDebugElement.nativeElement.classList).toContain('mat-accent');
    });
  });
});

/** Simple component for testing a single checkbox. */
@Component({
  template: `
  <div (click)="parentElementClicked = true" (keyup)="parentElementKeyedUp = true">
    <mat-checkbox
        [id]="checkboxId"
        [required]="isRequired"
        [labelPosition]="labelPos"
        [checked]="isChecked"
        [(indeterminate)]="isIndeterminate"
        [disabled]="isDisabled"
        [color]="checkboxColor"
        [disableRipple]="disableRipple"
        [value]="checkboxValue"
        (click)="onCheckboxClick($event)"
        (change)="onCheckboxChange($event)">
      Simple checkbox
    </mat-checkbox>
  </div>`,
})
class SingleCheckbox {
  labelPos: 'before' | 'after' = 'after';
  isChecked: boolean = false;
  isRequired: boolean = false;
  isIndeterminate: boolean = false;
  isDisabled: boolean = false;
  disableRipple: boolean = false;
  parentElementClicked: boolean = false;
  parentElementKeyedUp: boolean = false;
  checkboxId: string | null = 'simple-check';
  checkboxColor: ThemePalette = 'primary';
  checkboxValue: string = 'single_checkbox';

  onCheckboxClick: (event?: Event) => void = () => {};
  onCheckboxChange: (event?: MatCheckboxChange) => void = () => {};
}

/** Simple component for testing an MatCheckbox with required ngModel. */
@Component({
  template: `<mat-checkbox [required]="isRequired" [(ngModel)]="isGood">Be good</mat-checkbox>`,
})
class CheckboxWithNgModel {
  isGood: boolean = false;
  isRequired: boolean = true;
}

@Component({
  template: `<mat-checkbox [required]="isRequired" [(ngModel)]="isGood">Be good</mat-checkbox>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CheckboxWithNgModelAndOnPush extends CheckboxWithNgModel {}

/** Simple test component with multiple checkboxes. */
@Component({
  template: `
    <mat-checkbox>Option 1</mat-checkbox>
    <mat-checkbox>Option 2</mat-checkbox>
  `,
})
class MultipleCheckboxes {}

/** Simple test component with tabIndex */
@Component({
  template: `
    <mat-checkbox
        [tabIndex]="customTabIndex"
        [disabled]="isDisabled">
    </mat-checkbox>`,
})
class CheckboxWithTabIndex {
  customTabIndex: number = 7;
  isDisabled: boolean = false;
}

/** Simple test component that accesses MatCheckbox using ViewChild. */
@Component({
  template: `
    <mat-checkbox></mat-checkbox>`,
})
class CheckboxUsingViewChild {
  @ViewChild(MatCheckbox) checkbox: MatCheckbox;

  set isDisabled(value: boolean) {
    this.checkbox.disabled = value;
  }
}

/** Simple test component with an aria-label set. */
@Component({
  template: `<mat-checkbox aria-label="Super effective"></mat-checkbox>`,
})
class CheckboxWithAriaLabel {}

/** Simple test component with an aria-label set. */
@Component({
  template: `<mat-checkbox aria-labelledby="some-id"></mat-checkbox>`,
})
class CheckboxWithAriaLabelledby {}

/** Simple test component with an aria-describedby set. */
@Component({
  template: `<mat-checkbox aria-describedby="some-id"></mat-checkbox>`,
})
class CheckboxWithAriaDescribedby {}

/** Simple test component with name attribute */
@Component({
  template: `<mat-checkbox name="test-name"></mat-checkbox>`,
})
class CheckboxWithNameAttribute {}

/** Simple test component with change event */
@Component({
  template: `<mat-checkbox (change)="lastEvent = $event"></mat-checkbox>`,
})
class CheckboxWithChangeEvent {
  lastEvent: MatCheckboxChange;
}

/** Test component with reactive forms */
@Component({
  template: `<mat-checkbox [formControl]="formControl"></mat-checkbox>`,
})
class CheckboxWithFormControl {
  formControl = new FormControl();
}

/** Test component without label */
@Component({
  template: `<mat-checkbox>{{ label }}</mat-checkbox>`,
})
class CheckboxWithoutLabel {
  label: string;
}

/** Test component with the native tabindex attribute. */
@Component({
  template: `<mat-checkbox tabindex="5"></mat-checkbox>`,
})
class CheckboxWithTabindexAttr {}

/** Test component that uses another component for its label. */
@Component({
  template: `<mat-checkbox><some-text></some-text></mat-checkbox>`,
})
class CheckboxWithProjectedLabel {}

/** Component that renders some text through a binding. */
@Component({
  selector: 'some-text',
  template: '<span>{{text}}</span>',
})
class TextBindingComponent {
  text: string = 'Some text';
}

/** Test component with a simple checkbox with no inputs. */
@Component({template: `<mat-checkbox></mat-checkbox>`})
class SimpleCheckbox {}
