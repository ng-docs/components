import {FocusKeyManager} from '@angular/cdk/a11y';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {END, HOME, LEFT_ARROW, RIGHT_ARROW, SPACE, TAB} from '@angular/cdk/keycodes';
import {
  createKeyboardEvent,
  dispatchEvent,
  dispatchFakeEvent,
  dispatchKeyboardEvent,
  MockNgZone,
} from '../../cdk/testing/private';
import {
  Component,
  DebugElement,
  NgZone,
  Provider,
  QueryList,
  Type,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {Subject} from 'rxjs';
import {MatChip, MatChipListbox, MatChipOption, MatChipsModule} from './index';

describe('MDC-based MatChipListbox', () => {
  let fixture: ComponentFixture<any>;
  let chipListboxDebugElement: DebugElement;
  let chipListboxNativeElement: HTMLElement;
  let chipListboxInstance: MatChipListbox;
  let testComponent: StandardChipListbox;
  let chips: QueryList<MatChipOption>;
  let manager: FocusKeyManager<MatChip>;
  let zone: MockNgZone;
  let dirChange: Subject<Direction>;

  describe('StandardChipList', () => {
    describe('basic behaviors', () => {
      beforeEach(() => {
        setupStandardListbox();
      });

      it('should add the `mat-mdc-chip-set` class', () => {
        expect(chipListboxNativeElement.classList).toContain('mat-mdc-chip-set');
      });

      it('should not have the aria-selected attribute when it is not selectable', fakeAsync(() => {
        testComponent.selectable = false;
        fixture.detectChanges();
        tick();

        const chipsValid = chips
          .toArray()
          .every(
            chip =>
              !chip.selectable && !chip._elementRef.nativeElement.hasAttribute('aria-selected'),
          );

        expect(chipsValid).toBe(true);
      }));

      it('should toggle the chips disabled state based on whether it is disabled', () => {
        expect(chips.toArray().every(chip => chip.disabled)).toBe(false);

        chipListboxInstance.disabled = true;
        fixture.detectChanges();

        expect(chips.toArray().every(chip => chip.disabled)).toBe(true);

        chipListboxInstance.disabled = false;
        fixture.detectChanges();

        expect(chips.toArray().every(chip => chip.disabled)).toBe(false);
      });

      it('should disable a chip that is added after the listbox became disabled', fakeAsync(() => {
        expect(chips.toArray().every(chip => chip.disabled)).toBe(false);

        chipListboxInstance.disabled = true;
        fixture.detectChanges();

        expect(chips.toArray().every(chip => chip.disabled)).toBe(true);

        fixture.componentInstance.chips.push(5, 6);
        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(chips.toArray().every(chip => chip.disabled)).toBe(true);
      }));

      it('should not set a role on the grid when the list is empty', () => {
        testComponent.chips = [];
        fixture.detectChanges();

        expect(chipListboxNativeElement.hasAttribute('role')).toBe(false);
      });

      it('should not set aria-required when it does not have a role', () => {
        testComponent.chips = [];
        fixture.detectChanges();

        expect(chipListboxNativeElement.hasAttribute('role')).toBe(false);
        expect(chipListboxNativeElement.hasAttribute('aria-required')).toBe(false);
      });
    });

    describe('with selected chips', () => {
      beforeEach(() => {
        fixture = createComponent(SelectedChipListbox);
        fixture.detectChanges();
        chipListboxDebugElement = fixture.debugElement.query(By.directive(MatChipListbox))!;
        chipListboxNativeElement = chipListboxDebugElement.nativeElement;
      });

      it('should not override chips selected', () => {
        const instanceChips = fixture.componentInstance.chips.toArray();

        expect(instanceChips[0].selected)
          .withContext('Expected first option to be selected.')
          .toBe(true);
        expect(instanceChips[1].selected)
          .withContext('Expected second option to be not selected.')
          .toBe(false);
        expect(instanceChips[2].selected)
          .withContext('Expected third option to be selected.')
          .toBe(true);
      });

      it('should have role listbox', () => {
        expect(chipListboxNativeElement.getAttribute('role')).toBe('listbox');
      });

      it('should not have role when empty', () => {
        fixture.componentInstance.foods = [];
        fixture.detectChanges();

        expect(chipListboxNativeElement.getAttribute('role'))
          .withContext('Expect no role attribute')
          .toBeNull();
      });
    });

    describe('focus behaviors', () => {
      beforeEach(() => {
        setupStandardListbox();
        manager = chipListboxInstance._keyManager;
      });

      it('should focus the first chip on focus', () => {
        chipListboxInstance.focus();
        fixture.detectChanges();

        expect(manager.activeItemIndex).toBe(0);
      });

      it('should watch for chip focus', () => {
        let array = chips.toArray();
        let lastIndex = array.length - 1;
        let lastItem = array[lastIndex];

        lastItem.focus();
        fixture.detectChanges();

        expect(manager.activeItemIndex).toBe(lastIndex);
      });

      it('should not be able to become focused when disabled', () => {
        expect(chipListboxInstance.focused)
          .withContext('Expected listbox to not be focused.')
          .toBe(false);

        chipListboxInstance.disabled = true;
        fixture.detectChanges();

        chipListboxInstance.focus();
        fixture.detectChanges();

        expect(chipListboxInstance.focused)
          .withContext('Expected listbox to continue not to be focused')
          .toBe(false);
      });

      it('should remove the tabindex from the listbox if it is disabled', () => {
        expect(chipListboxNativeElement.getAttribute('tabindex')).toBe('0');

        chipListboxInstance.disabled = true;
        fixture.detectChanges();

        expect(chipListboxNativeElement.getAttribute('tabindex')).toBe('-1');
      });

      describe('on chip destroy', () => {
        it('should focus the next item', () => {
          let array = chips.toArray();
          let midItem = array[2];

          // Focus the middle item
          midItem.focus();

          // Destroy the middle item
          testComponent.chips.splice(2, 1);
          fixture.detectChanges();

          // It focuses the 4th item (now at index 2)
          expect(manager.activeItemIndex).toEqual(2);
        });

        it('should focus the previous item', () => {
          let array = chips.toArray();
          let lastIndex = array.length - 1;
          let lastItem = array[lastIndex];

          // Focus the last item
          lastItem.focus();

          // Destroy the last item
          testComponent.chips.pop();
          fixture.detectChanges();
          // It focuses the next-to-last item
          expect(manager.activeItemIndex).toEqual(lastIndex - 1);
        });

        it('should not focus if chip listbox is not focused', () => {
          let array = chips.toArray();
          let midItem = array[2];

          // Focus and blur the middle item
          midItem.focus();
          midItem._blur();
          zone.simulateZoneExit();

          // Destroy the middle item
          testComponent.chips.splice(2, 1);
          fixture.detectChanges();

          // Should not have focus
          expect(chipListboxInstance._keyManager.activeItemIndex).toEqual(-1);
        });

        it('should focus the listbox if the last focused item is removed', () => {
          testComponent.chips = [0];
          fixture.detectChanges();

          spyOn(chipListboxInstance, 'focus');
          chips.last.focus();

          testComponent.chips.pop();
          fixture.detectChanges();

          expect(chipListboxInstance.focus).toHaveBeenCalled();
        });
      });
    });

    describe('keyboard behavior', () => {
      describe('LTR (default)', () => {
        beforeEach(() => {
          setupStandardListbox();
          manager = chipListboxInstance._keyManager;
        });

        it('should focus previous item when press LEFT ARROW', () => {
          let nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
          let lastNativeChip = nativeChips[nativeChips.length - 1] as HTMLElement;

          let array = chips.toArray();
          let lastIndex = array.length - 1;
          let lastItem = array[lastIndex];

          // Focus the last item in the array
          lastItem.focus();
          expect(manager.activeItemIndex).toEqual(lastIndex);

          // Press the LEFT arrow
          dispatchKeyboardEvent(lastNativeChip, 'keydown', LEFT_ARROW);
          chipListboxInstance._blur(); // Simulate focus leaving the listbox and going to the chip.
          fixture.detectChanges();

          // It focuses the next-to-last item
          expect(manager.activeItemIndex).toEqual(lastIndex - 1);
        });

        it('should focus next item when press RIGHT ARROW', () => {
          let nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
          let firstNativeChip = nativeChips[0] as HTMLElement;

          let array = chips.toArray();
          let firstItem = array[0];

          // Focus the last item in the array
          firstItem.focus();
          expect(manager.activeItemIndex).toEqual(0);

          // Press the RIGHT arrow
          dispatchKeyboardEvent(firstNativeChip, 'keydown', RIGHT_ARROW);
          chipListboxInstance._blur(); // Simulate focus leaving the listbox and going to the chip.
          fixture.detectChanges();

          // It focuses the next-to-last item
          expect(manager.activeItemIndex).toEqual(1);
        });

        it('should not handle arrow key events from non-chip elements', () => {
          const initialActiveIndex = manager.activeItemIndex;

          dispatchKeyboardEvent(chipListboxNativeElement, 'keydown', RIGHT_ARROW);
          fixture.detectChanges();

          expect(manager.activeItemIndex)
            .withContext('Expected focused item not to have changed.')
            .toBe(initialActiveIndex);
        });

        it('should focus the first item when pressing HOME', () => {
          const nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
          const lastNativeChip = nativeChips[nativeChips.length - 1] as HTMLElement;
          const HOME_EVENT = createKeyboardEvent('keydown', HOME);
          const array = chips.toArray();
          const lastItem = array[array.length - 1];

          lastItem.focus();
          expect(manager.activeItemIndex).toBe(array.length - 1);

          dispatchEvent(lastNativeChip, HOME_EVENT);
          fixture.detectChanges();

          expect(manager.activeItemIndex).toBe(0);
          expect(HOME_EVENT.defaultPrevented).toBe(true);
        });

        it('should focus the last item when pressing END', () => {
          const nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
          const END_EVENT = createKeyboardEvent('keydown', END);

          expect(manager.activeItemIndex).toBe(-1);

          dispatchEvent(nativeChips[0], END_EVENT);
          fixture.detectChanges();

          expect(manager.activeItemIndex).toBe(chips.length - 1);
          expect(END_EVENT.defaultPrevented).toBe(true);
        });
      });

      describe('RTL', () => {
        beforeEach(() => {
          setupStandardListbox('rtl');
          manager = chipListboxInstance._keyManager;
        });

        it('should focus previous item when press RIGHT ARROW', () => {
          let nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
          let lastNativeChip = nativeChips[nativeChips.length - 1] as HTMLElement;

          let array = chips.toArray();
          let lastIndex = array.length - 1;
          let lastItem = array[lastIndex];

          // Focus the last item in the array
          lastItem.focus();
          expect(manager.activeItemIndex).toEqual(lastIndex);

          // Press the RIGHT arrow
          dispatchKeyboardEvent(lastNativeChip, 'keydown', RIGHT_ARROW);
          chipListboxInstance._blur(); // Simulate focus leaving the listbox and going to the chip.
          fixture.detectChanges();

          // It focuses the next-to-last item
          expect(manager.activeItemIndex).toEqual(lastIndex - 1);
        });

        it('should focus next item when press LEFT ARROW', () => {
          let nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
          let firstNativeChip = nativeChips[0] as HTMLElement;

          let array = chips.toArray();
          let firstItem = array[0];

          // Focus the last item in the array
          firstItem.focus();
          expect(manager.activeItemIndex).toEqual(0);

          // Press the LEFT arrow
          dispatchKeyboardEvent(firstNativeChip, 'keydown', LEFT_ARROW);
          chipListboxInstance._blur(); // Simulate focus leaving the listbox and going to the chip.
          fixture.detectChanges();

          // It focuses the next-to-last item
          expect(manager.activeItemIndex).toEqual(1);
        });

        it('should allow focus to escape when tabbing away', fakeAsync(() => {
          chipListboxInstance._keyManager.onKeydown(createKeyboardEvent('keydown', TAB));

          expect(chipListboxInstance.tabIndex)
            .withContext('Expected tabIndex to be set to -1 temporarily.')
            .toBe(-1);

          tick();

          expect(chipListboxInstance.tabIndex)
            .withContext('Expected tabIndex to be reset back to 0')
            .toBe(0);
        }));

        it(`should use user defined tabIndex`, fakeAsync(() => {
          chipListboxInstance.tabIndex = 4;

          fixture.detectChanges();

          expect(chipListboxInstance.tabIndex)
            .withContext('Expected tabIndex to be set to user defined value 4.')
            .toBe(4);

          chipListboxInstance._keyManager.onKeydown(createKeyboardEvent('keydown', TAB));

          expect(chipListboxInstance.tabIndex)
            .withContext('Expected tabIndex to be set to -1 temporarily.')
            .toBe(-1);

          tick();

          expect(chipListboxInstance.tabIndex)
            .withContext('Expected tabIndex to be reset back to 4')
            .toBe(4);
        }));
      });

      it('should account for the direction changing', () => {
        setupStandardListbox();
        manager = chipListboxInstance._keyManager;

        let nativeChips = chipListboxNativeElement.querySelectorAll('mat-chip-option');
        let firstNativeChip = nativeChips[0] as HTMLElement;

        let array = chips.toArray();
        let firstItem = array[0];

        firstItem.focus();
        expect(manager.activeItemIndex).toBe(0);

        dispatchKeyboardEvent(firstNativeChip, 'keydown', RIGHT_ARROW);
        chipListboxInstance._blur();
        fixture.detectChanges();

        expect(manager.activeItemIndex).toBe(1);

        dirChange.next('rtl');
        fixture.detectChanges();

        dispatchKeyboardEvent(firstNativeChip, 'keydown', RIGHT_ARROW);
        chipListboxInstance._blur();
        fixture.detectChanges();

        expect(manager.activeItemIndex).toBe(0);
      });
    });

    describe('selection logic', () => {
      let nativeChips: HTMLElement[];

      beforeEach(() => {
        fixture = createComponent(BasicChipListbox);
        fixture.detectChanges();

        nativeChips = fixture.debugElement
          .queryAll(By.css('mat-chip-option'))
          .map(chip => chip.nativeElement);

        chipListboxDebugElement = fixture.debugElement.query(By.directive(MatChipListbox))!;
        chipListboxInstance = chipListboxDebugElement.componentInstance;
        chips = chipListboxInstance._chips;
      });

      it('should remove selection if chip has been removed', fakeAsync(() => {
        const instanceChips = fixture.componentInstance.chips;
        const chipListbox = fixture.componentInstance.chipListbox;
        const firstChip = nativeChips[0];
        dispatchKeyboardEvent(firstChip, 'keydown', SPACE);
        fixture.detectChanges();

        expect(instanceChips.first.selected)
          .withContext('Expected first option to be selected.')
          .toBe(true);
        expect(chipListbox.selected)
          .withContext('Expected first option to be selected.')
          .toBe(chips.first);

        fixture.componentInstance.foods = [];
        fixture.detectChanges();
        tick();

        expect(chipListbox.selected)
          .withContext('Expected selection to be removed when option no longer exists.')
          .toBe(undefined);
      }));

      it('should select an option that was added after initialization', () => {
        fixture.componentInstance.foods.push({viewValue: 'Potatoes', value: 'potatoes-8'});
        fixture.detectChanges();

        nativeChips = fixture.debugElement
          .queryAll(By.css('mat-chip-option'))
          .map(chip => chip.nativeElement);
        const lastChip = nativeChips[8];
        dispatchKeyboardEvent(lastChip, 'keydown', SPACE);
        fixture.detectChanges();

        expect(fixture.componentInstance.chipListbox.value)
          .withContext('Expect value contain the value of the last option')
          .toContain('potatoes-8');
        expect(fixture.componentInstance.chips.last.selected)
          .withContext('Expect last option selected')
          .toBeTruthy();
      });

      it('should not select disabled chips', () => {
        const array = chips.toArray();
        const disabledChip = nativeChips[2];
        dispatchKeyboardEvent(disabledChip, 'keydown', SPACE);
        fixture.detectChanges();

        expect(fixture.componentInstance.chipListbox.value)
          .withContext('Expect value to be undefined')
          .toBeUndefined();
        expect(array[2].selected).withContext('Expect disabled chip not selected').toBeFalsy();
        expect(fixture.componentInstance.chipListbox.selected)
          .withContext('Expect no selected chips')
          .toBeUndefined();
      });
    });

    describe('chip list with chip input', () => {
      let nativeChips: HTMLElement[];

      describe('single selection', () => {
        beforeEach(() => {
          fixture = createComponent(BasicChipListbox);
          fixture.detectChanges();

          nativeChips = fixture.debugElement
            .queryAll(By.css('mat-chip-option'))
            .map(chip => chip.nativeElement);
          chips = fixture.componentInstance.chips;
        });

        it('should take an initial view value with reactive forms', fakeAsync(() => {
          fixture.componentInstance.control = new FormControl('pizza-1');
          fixture.detectChanges();
          tick();
          const array = chips.toArray();

          expect(array[1].selected).withContext('Expect pizza-1 chip to be selected').toBeTruthy();

          dispatchKeyboardEvent(nativeChips[1], 'keydown', SPACE);
          fixture.detectChanges();

          expect(array[1].selected)
            .withContext('Expect chip to be not selected after toggle selected')
            .toBeFalsy();
        }));

        it('should set the view value from the form', () => {
          const chipListbox = fixture.componentInstance.chipListbox;
          const array = chips.toArray();

          expect(chipListbox.value)
            .withContext('Expect chip listbox to have no initial value')
            .toBeFalsy();

          fixture.componentInstance.control.setValue('pizza-1');
          fixture.detectChanges();

          expect(array[1].selected).withContext('Expect chip to be selected').toBeTruthy();
        });

        it('should update the form value when the view changes', fakeAsync(() => {
          expect(fixture.componentInstance.control.value)
            .withContext(`Expected the control's value to be empty initially.`)
            .toEqual(null);

          dispatchKeyboardEvent(nativeChips[0], 'keydown', SPACE);
          fixture.detectChanges();

          tick();

          expect(fixture.componentInstance.control.value)
            .withContext(`Expected control's value to be set to the new option.`)
            .toEqual('steak-0');
        }));

        it('should clear the selection when a nonexistent option value is selected', () => {
          const array = chips.toArray();

          fixture.componentInstance.control.setValue('pizza-1');
          fixture.detectChanges();

          expect(array[1].selected)
            .withContext(`Expected chip with the value to be selected.`)
            .toBeTruthy();

          fixture.componentInstance.control.setValue('gibberish');

          fixture.detectChanges();

          expect(array[1].selected)
            .withContext(`Expected chip with the old value not to be selected.`)
            .toBeFalsy();
        });

        it('should clear the selection when the control is reset', () => {
          const array = chips.toArray();

          fixture.componentInstance.control.setValue('pizza-1');
          fixture.detectChanges();

          fixture.componentInstance.control.reset();
          fixture.detectChanges();

          expect(array[1].selected)
            .withContext(`Expected chip with the old value not to be selected.`)
            .toBeFalsy();
        });

        it('should set the control to touched when the chip listbox is touched', fakeAsync(() => {
          expect(fixture.componentInstance.control.touched)
            .withContext('Expected the control to start off as untouched.')
            .toBe(false);

          const nativeChipListbox = fixture.debugElement.query(
            By.css('mat-chip-listbox'),
          )!.nativeElement;
          dispatchFakeEvent(nativeChipListbox, 'blur');
          tick();

          expect(fixture.componentInstance.control.touched)
            .withContext('Expected the control to be touched.')
            .toBe(true);
        }));

        it('should not set touched when a disabled chip listbox is touched', fakeAsync(() => {
          expect(fixture.componentInstance.control.touched)
            .withContext('Expected the control to start off as untouched.')
            .toBe(false);

          fixture.componentInstance.control.disable();
          const nativeChipListbox = fixture.debugElement.query(
            By.css('mat-chip-listbox'),
          )!.nativeElement;
          dispatchFakeEvent(nativeChipListbox, 'blur');
          tick();

          expect(fixture.componentInstance.control.touched)
            .withContext('Expected the control to stay untouched.')
            .toBe(false);
        }));

        it("should set the control to dirty when the chip listbox's value changes in the DOM", () => {
          expect(fixture.componentInstance.control.dirty)
            .withContext(`Expected control to start out pristine.`)
            .toEqual(false);

          dispatchKeyboardEvent(nativeChips[1], 'keydown', SPACE);
          fixture.detectChanges();

          expect(fixture.componentInstance.control.dirty)
            .withContext(`Expected control to be dirty after value was changed by user.`)
            .toEqual(true);
        });

        it('should not set the control to dirty when the value changes programmatically', () => {
          expect(fixture.componentInstance.control.dirty)
            .withContext(`Expected control to start out pristine.`)
            .toEqual(false);

          fixture.componentInstance.control.setValue('pizza-1');

          expect(fixture.componentInstance.control.dirty)
            .withContext(`Expected control to stay pristine after programmatic change.`)
            .toEqual(false);
        });

        it('should be able to programmatically select a falsy option', () => {
          fixture.destroy();
          TestBed.resetTestingModule();

          const falsyFixture = createComponent(FalsyValueChipListbox);
          falsyFixture.detectChanges();

          falsyFixture.componentInstance.control.setValue([0]);
          falsyFixture.detectChanges();
          falsyFixture.detectChanges();

          expect(falsyFixture.componentInstance.chips.first.selected)
            .withContext('Expected first option to be selected')
            .toBe(true);
        });

        it('should not focus the active chip when the value is set programmatically', () => {
          const chipArray = fixture.componentInstance.chips.toArray();

          spyOn(chipArray[4], 'focus').and.callThrough();

          fixture.componentInstance.control.setValue('chips-4');
          fixture.detectChanges();

          expect(chipArray[4].focus).not.toHaveBeenCalled();
        });
      });

      describe('multiple selection', () => {
        beforeEach(() => {
          fixture = createComponent(MultiSelectionChipListbox);
          fixture.detectChanges();

          nativeChips = fixture.debugElement
            .queryAll(By.css('mat-chip-option'))
            .map(chip => chip.nativeElement);
          chips = fixture.componentInstance.chips;
        });

        it('should take an initial view value with reactive forms', () => {
          fixture.componentInstance.control = new FormControl(['pizza-1']);
          fixture.detectChanges();

          const array = chips.toArray();

          expect(array[1].selected).withContext('Expect pizza-1 chip to be selected').toBeTruthy();

          dispatchKeyboardEvent(nativeChips[1], 'keydown', SPACE);
          fixture.detectChanges();

          expect(array[1].selected)
            .withContext('Expect chip to be not selected after toggle selected')
            .toBeFalsy();
        });

        it('should set the view value from the form', () => {
          const chipListbox = fixture.componentInstance.chipListbox;
          const array = chips.toArray();

          expect(chipListbox.value)
            .withContext('Expect chip listbox to have no initial value')
            .toBeFalsy();

          fixture.componentInstance.control.setValue(['pizza-1']);
          fixture.detectChanges();

          expect(array[1].selected).withContext('Expect chip to be selected').toBeTruthy();
        });

        it('should update the form value when the view changes', () => {
          expect(fixture.componentInstance.control.value)
            .withContext(`Expected the control's value to be empty initially.`)
            .toEqual(null);

          dispatchKeyboardEvent(nativeChips[0], 'keydown', SPACE);
          fixture.detectChanges();

          expect(fixture.componentInstance.control.value)
            .withContext(`Expected control's value to be set to the new option.`)
            .toEqual(['steak-0']);
        });

        it('should clear the selection when a nonexistent option value is selected', () => {
          const array = chips.toArray();

          fixture.componentInstance.control.setValue(['pizza-1']);
          fixture.detectChanges();

          expect(array[1].selected)
            .withContext(`Expected chip with the value to be selected.`)
            .toBeTruthy();

          fixture.componentInstance.control.setValue(['gibberish']);

          fixture.detectChanges();

          expect(array[1].selected)
            .withContext(`Expected chip with the old value not to be selected.`)
            .toBeFalsy();
        });

        it('should clear the selection when the control is reset', () => {
          const array = chips.toArray();

          fixture.componentInstance.control.setValue(['pizza-1']);
          fixture.detectChanges();

          fixture.componentInstance.control.reset();
          fixture.detectChanges();

          expect(array[1].selected)
            .withContext(`Expected chip with the old value not to be selected.`)
            .toBeFalsy();
        });
      });
    });
  });

  function createComponent<T>(component: Type<T>, providers: Provider[] = []): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, MatChipsModule],
      declarations: [component],
      providers: [{provide: NgZone, useFactory: () => (zone = new MockNgZone())}, ...providers],
    }).compileComponents();

    return TestBed.createComponent<T>(component);
  }

  function setupStandardListbox(direction: Direction = 'ltr') {
    dirChange = new Subject();
    fixture = createComponent(StandardChipListbox, [
      {
        provide: Directionality,
        useFactory: () => ({
          value: direction.toLowerCase(),
          change: dirChange,
        }),
      },
    ]);
    fixture.detectChanges();

    chipListboxDebugElement = fixture.debugElement.query(By.directive(MatChipListbox))!;
    chipListboxNativeElement = chipListboxDebugElement.nativeElement;
    chipListboxInstance = chipListboxDebugElement.componentInstance;
    testComponent = fixture.debugElement.componentInstance;
    chips = chipListboxInstance._chips;
  }
});

@Component({
  template: `
    <mat-chip-listbox [tabIndex]="tabIndex" [selectable]="selectable">
      <mat-chip-option *ngFor="let i of chips" (select)="chipSelect(i)"
        (deselect)="chipDeselect(i)">
        {{name}} {{i + 1}}
      </mat-chip-option>
    </mat-chip-listbox>`,
})
class StandardChipListbox {
  name: string = 'Test';
  selectable: boolean = true;
  chipSelect: (index?: number) => void = () => {};
  chipDeselect: (index?: number) => void = () => {};
  tabIndex: number = 0;
  chips = [0, 1, 2, 3, 4];
}

@Component({
  template: `
      <mat-chip-listbox [formControl]="control" [required]="isRequired"
        [tabIndex]="tabIndexOverride" [selectable]="selectable">
        <mat-chip-option *ngFor="let food of foods" [value]="food.value" [disabled]="food.disabled">
          {{ food.viewValue }}
        </mat-chip-option>
      </mat-chip-listbox>
  `,
})
class BasicChipListbox {
  foods: any[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos', disabled: true},
    {value: 'sandwich-3', viewValue: 'Sandwich'},
    {value: 'chips-4', viewValue: 'Chips'},
    {value: 'eggs-5', viewValue: 'Eggs'},
    {value: 'pasta-6', viewValue: 'Pasta'},
    {value: 'sushi-7', viewValue: 'Sushi'},
  ];
  control = new FormControl();
  isRequired: boolean;
  tabIndexOverride: number;
  selectable: boolean;

  @ViewChild(MatChipListbox) chipListbox: MatChipListbox;
  @ViewChildren(MatChipOption) chips: QueryList<MatChipOption>;
}

@Component({
  template: `
      <mat-chip-listbox [multiple]="true" [formControl]="control"
        [required]="isRequired"
        [tabIndex]="tabIndexOverride" [selectable]="selectable">
        <mat-chip-option *ngFor="let food of foods" [value]="food.value" [disabled]="food.disabled">
          {{ food.viewValue }}
        </mat-chip-option>
      </mat-chip-listbox>
  `,
})
class MultiSelectionChipListbox {
  foods: any[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos', disabled: true},
    {value: 'sandwich-3', viewValue: 'Sandwich'},
    {value: 'chips-4', viewValue: 'Chips'},
    {value: 'eggs-5', viewValue: 'Eggs'},
    {value: 'pasta-6', viewValue: 'Pasta'},
    {value: 'sushi-7', viewValue: 'Sushi'},
  ];
  control = new FormControl();
  isRequired: boolean;
  tabIndexOverride: number;
  selectable: boolean;

  @ViewChild(MatChipListbox) chipListbox: MatChipListbox;
  @ViewChildren(MatChipOption) chips: QueryList<MatChipOption>;
}

@Component({
  template: `
      <mat-chip-listbox [formControl]="control">
        <mat-chip-option *ngFor="let food of foods" [value]="food.value">
          {{ food.viewValue }}
        </mat-chip-option>
      </mat-chip-listbox>
  `,
})
class FalsyValueChipListbox {
  foods: any[] = [
    {value: 0, viewValue: 'Steak'},
    {value: 1, viewValue: 'Pizza'},
  ];
  control = new FormControl();
  @ViewChildren(MatChipOption) chips: QueryList<MatChipOption>;
}

@Component({
  template: `
    <mat-chip-listbox>
        <mat-chip-option *ngFor="let food of foods" [value]="food.value" [selected]="food.selected">
            {{ food.viewValue }}
        </mat-chip-option>
    </mat-chip-listbox>
  `,
})
class SelectedChipListbox {
  foods: any[] = [
    {value: 0, viewValue: 'Steak', selected: true},
    {value: 1, viewValue: 'Pizza', selected: false},
    {value: 2, viewValue: 'Pasta', selected: true},
  ];
  @ViewChildren(MatChipOption) chips: QueryList<MatChipOption>;
}
