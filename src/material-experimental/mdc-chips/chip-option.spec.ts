import {Directionality} from '@angular/cdk/bidi';
import {SPACE} from '@angular/cdk/keycodes';
import {createKeyboardEvent, dispatchFakeEvent} from '../../cdk/testing/private';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {waitForAsync, ComponentFixture, fakeAsync, flush, TestBed} from '@angular/core/testing';
import {
  MAT_RIPPLE_GLOBAL_OPTIONS,
  RippleGlobalOptions,
} from '@angular/material-experimental/mdc-core';
import {By} from '@angular/platform-browser';
import {deprecated} from '@material/chips';
import {Subject} from 'rxjs';
import {
  MatChipEvent,
  MatChipListbox,
  MatChipOption,
  MatChipSelectionChange,
  MatChipsModule,
} from './index';

describe('MDC-based Option Chips', () => {
  let fixture: ComponentFixture<any>;
  let chipDebugElement: DebugElement;
  let chipNativeElement: HTMLElement;
  let chipInstance: MatChipOption;
  let globalRippleOptions: RippleGlobalOptions;
  let dir = 'ltr';

  beforeEach(
    waitForAsync(() => {
      globalRippleOptions = {};
      TestBed.configureTestingModule({
        imports: [MatChipsModule],
        declarations: [SingleChip],
        providers: [
          {provide: MAT_RIPPLE_GLOBAL_OPTIONS, useFactory: () => globalRippleOptions},
          {
            provide: Directionality,
            useFactory: () => ({
              value: dir,
              change: new Subject(),
            }),
          },
        ],
      });

      TestBed.compileComponents();
    }),
  );

  describe('MatChipOption', () => {
    let testComponent: SingleChip;

    beforeEach(() => {
      fixture = TestBed.createComponent(SingleChip);
      fixture.detectChanges();

      chipDebugElement = fixture.debugElement.query(By.directive(MatChipOption))!;
      chipNativeElement = chipDebugElement.nativeElement;
      chipInstance = chipDebugElement.injector.get<MatChipOption>(MatChipOption);
      testComponent = fixture.debugElement.componentInstance;
    });

    describe('basic behaviors', () => {
      it('adds the `mat-chip` class', () => {
        expect(chipNativeElement.classList).toContain('mat-mdc-chip');
      });

      it('emits focus only once for multiple clicks', () => {
        let counter = 0;
        chipInstance._onFocus.subscribe(() => {
          counter++;
        });

        chipNativeElement.focus();
        chipNativeElement.focus();
        fixture.detectChanges();

        expect(counter).toBe(1);
      });

      it('emits destroy on destruction', () => {
        spyOn(testComponent, 'chipDestroy').and.callThrough();

        // Force a destroy callback
        testComponent.shouldShow = false;
        fixture.detectChanges();

        expect(testComponent.chipDestroy).toHaveBeenCalledTimes(1);
      });

      it('allows color customization', () => {
        expect(chipNativeElement.classList).toContain('mat-primary');

        testComponent.color = 'warn';
        fixture.detectChanges();

        expect(chipNativeElement.classList).not.toContain('mat-primary');
        expect(chipNativeElement.classList).toContain('mat-warn');
      });

      it('allows selection', () => {
        spyOn(testComponent, 'chipSelectionChange');
        expect(chipNativeElement.classList).not.toContain('mat-mdc-chip-selected');

        testComponent.selected = true;
        fixture.detectChanges();

        expect(chipNativeElement.classList).toContain('mat-mdc-chip-selected');
        expect(testComponent.chipSelectionChange).toHaveBeenCalledWith({
          source: chipInstance,
          isUserInput: false,
          selected: true,
        });
      });

      it('should not prevent the default click action', () => {
        const event = dispatchFakeEvent(chipNativeElement, 'click');
        fixture.detectChanges();

        expect(event.defaultPrevented).toBe(false);
      });

      it('should prevent the default click action when the chip is disabled', () => {
        chipInstance.disabled = true;
        fixture.detectChanges();

        const event = dispatchFakeEvent(chipNativeElement, 'click');
        fixture.detectChanges();

        expect(event.defaultPrevented).toBe(true);
      });

      it('should not dispatch `selectionChange` event when deselecting a non-selected chip', () => {
        chipInstance.deselect();

        const spy = jasmine.createSpy('selectionChange spy');
        const subscription = chipInstance.selectionChange.subscribe(spy);

        chipInstance.deselect();

        expect(spy).not.toHaveBeenCalled();
        subscription.unsubscribe();
      });

      it('should not dispatch `selectionChange` event when selecting a selected chip', () => {
        chipInstance.select();

        const spy = jasmine.createSpy('selectionChange spy');
        const subscription = chipInstance.selectionChange.subscribe(spy);

        chipInstance.select();

        expect(spy).not.toHaveBeenCalled();
        subscription.unsubscribe();
      });

      it(
        'should not dispatch `selectionChange` event when selecting a selected chip via ' +
          'user interaction',
        () => {
          chipInstance.select();

          const spy = jasmine.createSpy('selectionChange spy');
          const subscription = chipInstance.selectionChange.subscribe(spy);

          chipInstance.selectViaInteraction();

          expect(spy).not.toHaveBeenCalled();
          subscription.unsubscribe();
        },
      );

      it('should not dispatch `selectionChange` through setter if the value did not change', () => {
        chipInstance.selected = false;

        const spy = jasmine.createSpy('selectionChange spy');
        const subscription = chipInstance.selectionChange.subscribe(spy);

        chipInstance.selected = false;

        expect(spy).not.toHaveBeenCalled();
        subscription.unsubscribe();
      });

      it('should be able to disable ripples through ripple global options at runtime', () => {
        expect(chipInstance._isRippleDisabled())
          .withContext('Expected chip ripples to be enabled.')
          .toBe(false);

        globalRippleOptions.disabled = true;

        expect(chipInstance._isRippleDisabled())
          .withContext('Expected chip ripples to be disabled.')
          .toBe(true);
      });
    });

    describe('keyboard behavior', () => {
      describe('when selectable is true', () => {
        beforeEach(() => {
          testComponent.selectable = true;
          fixture.detectChanges();
        });

        it('should selects/deselects the currently focused chip on SPACE', () => {
          const SPACE_EVENT = createKeyboardEvent('keydown', SPACE);
          const CHIP_SELECTED_EVENT: MatChipSelectionChange = {
            source: chipInstance,
            isUserInput: true,
            selected: true,
          };

          const CHIP_DESELECTED_EVENT: MatChipSelectionChange = {
            source: chipInstance,
            isUserInput: true,
            selected: false,
          };

          spyOn(testComponent, 'chipSelectionChange');

          // Use the spacebar to select the chip
          chipInstance._keydown(SPACE_EVENT);
          fixture.detectChanges();

          expect(chipInstance.selected).toBeTruthy();
          expect(testComponent.chipSelectionChange).toHaveBeenCalledTimes(1);
          expect(testComponent.chipSelectionChange).toHaveBeenCalledWith(CHIP_SELECTED_EVENT);

          // Use the spacebar to deselect the chip
          chipInstance._keydown(SPACE_EVENT);
          fixture.detectChanges();

          expect(chipInstance.selected).toBeFalsy();
          expect(testComponent.chipSelectionChange).toHaveBeenCalledTimes(2);
          expect(testComponent.chipSelectionChange).toHaveBeenCalledWith(CHIP_DESELECTED_EVENT);
        });

        it('should have correct aria-selected in single selection mode', () => {
          expect(chipNativeElement.hasAttribute('aria-selected')).toBe(false);

          testComponent.selected = true;
          fixture.detectChanges();

          expect(chipNativeElement.getAttribute('aria-selected')).toBe('true');
        });

        it('should have the correct aria-selected in multi-selection mode', fakeAsync(() => {
          testComponent.chipList.multiple = true;
          flush();
          fixture.detectChanges();
          expect(chipNativeElement.getAttribute('aria-selected')).toBe('false');

          testComponent.selected = true;
          fixture.detectChanges();

          expect(chipNativeElement.getAttribute('aria-selected')).toBe('true');
        }));

        it('should disable focus on the checkmark', fakeAsync(() => {
          // The checkmark is only shown in multi selection mode.
          testComponent.chipList.multiple = true;
          flush();
          fixture.detectChanges();

          const checkmark = chipNativeElement.querySelector('.mdc-chip__checkmark-svg')!;
          expect(checkmark.getAttribute('focusable')).toBe('false');
        }));
      });

      describe('when selectable is false', () => {
        beforeEach(() => {
          testComponent.selectable = false;
          fixture.detectChanges();
        });

        it('SPACE ignores selection', () => {
          const SPACE_EVENT = createKeyboardEvent('keydown', SPACE);

          spyOn(testComponent, 'chipSelectionChange');

          // Use the spacebar to attempt to select the chip
          chipInstance._keydown(SPACE_EVENT);
          fixture.detectChanges();

          expect(chipInstance.selected).toBeFalsy();
          expect(testComponent.chipSelectionChange).not.toHaveBeenCalled();
        });

        it('should not have the aria-selected attribute', () => {
          expect(chipNativeElement.hasAttribute('aria-selected')).toBe(false);
        });
      });

      it('should update the aria-label for disabled chips', () => {
        expect(chipNativeElement.getAttribute('aria-disabled')).toBe('false');

        testComponent.disabled = true;
        fixture.detectChanges();

        expect(chipNativeElement.getAttribute('aria-disabled')).toBe('true');
      });
    });

    it('should hide the leading icon when initialized as selected', () => {
      // We need to recreate the fixture before change detection has
      // run so we can capture the behavior we're testing for.
      fixture.destroy();
      fixture = TestBed.createComponent(SingleChip);
      testComponent = fixture.debugElement.componentInstance;
      testComponent.selected = true;
      fixture.detectChanges();
      chipDebugElement = fixture.debugElement.query(By.directive(MatChipOption))!;
      chipNativeElement = chipDebugElement.nativeElement;
      chipInstance = chipDebugElement.injector.get<MatChipOption>(MatChipOption);

      const avatar = fixture.nativeElement.querySelector('.avatar');
      expect(avatar.classList).toContain(deprecated.chipCssClasses.HIDDEN_LEADING_ICON);
    });

    it('should have a focus indicator', () => {
      expect(chipNativeElement.classList.contains('mat-mdc-focus-indicator')).toBe(true);
    });
  });
});

@Component({
  template: `
    <mat-chip-listbox>
      <div *ngIf="shouldShow">
        <mat-chip-option [selectable]="selectable"
                 [color]="color" [selected]="selected" [disabled]="disabled"
                 (focus)="chipFocus($event)" (destroyed)="chipDestroy($event)"
                 (selectionChange)="chipSelectionChange($event)">
          <span class="avatar" matChipAvatar></span>
          {{name}}
        </mat-chip-option>
      </div>
    </mat-chip-listbox>`,
})
class SingleChip {
  @ViewChild(MatChipListbox) chipList: MatChipListbox;
  disabled: boolean = false;
  name: string = 'Test';
  color: string = 'primary';
  selected: boolean = false;
  selectable: boolean = true;
  shouldShow: boolean = true;

  chipFocus: (event?: MatChipEvent) => void = () => {};
  chipDestroy: (event?: MatChipEvent) => void = () => {};
  chipSelectionChange: (event?: MatChipSelectionChange) => void = () => {};
}
