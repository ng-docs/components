import {dispatchKeyboardEvent, createKeyboardEvent, dispatchEvent} from '../../cdk/testing/private';
import {Component, DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {SPACE, ENTER, TAB} from '@angular/cdk/keycodes';
import {MatChip, MatChipsModule} from './index';

describe('MDC-based Chip Remove', () => {
  let fixture: ComponentFixture<TestChip>;
  let testChip: TestChip;
  let chipDebugElement: DebugElement;
  let chipNativeElement: HTMLElement;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [MatChipsModule],
        declarations: [TestChip],
      });

      TestBed.compileComponents();
    }),
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(TestChip);
      testChip = fixture.debugElement.componentInstance;
      fixture.detectChanges();

      chipDebugElement = fixture.debugElement.query(By.directive(MatChip))!;
      chipNativeElement = chipDebugElement.nativeElement;
    }),
  );

  describe('basic behavior', () => {
    it('should apply a CSS class to the remove icon', () => {
      let buttonElement = chipNativeElement.querySelector('button')!;

      expect(buttonElement.classList).toContain('mat-mdc-chip-remove');
    });

    it('should ensure that the button cannot submit its parent form', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      expect(buttonElement.getAttribute('type')).toBe('button');
    });

    it('should not set the `type` attribute on non-button elements', () => {
      const buttonElement = chipNativeElement.querySelector('span.mat-mdc-chip-remove')!;

      expect(buttonElement.hasAttribute('type')).toBe(false);
    });

    it('should emit (removed) event when exit animation is complete', () => {
      let buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      spyOn(testChip, 'didRemove');
      buttonElement.click();
      fixture.detectChanges();

      expect(testChip.didRemove).toHaveBeenCalled();
    });

    it('should not start MDC exit animation if parent chip is disabled', () => {
      let buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      testChip.disabled = true;
      fixture.detectChanges();

      buttonElement.click();
      fixture.detectChanges();

      expect(chipNativeElement.classList.contains('mdc-chip--exit')).toBe(false);
    });

    it('should not make the element aria-hidden when it is focusable', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      expect(buttonElement.getAttribute('tabindex')).toBe('0');
      expect(buttonElement.hasAttribute('aria-hidden')).toBe(false);
    });

    it('should prevent the default SPACE action', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      const event = dispatchKeyboardEvent(buttonElement, 'keydown', SPACE);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
    });

    it('should not prevent the default SPACE action when a modifier key is pressed', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      const event = createKeyboardEvent('keydown', SPACE, undefined, {shift: true});
      dispatchEvent(buttonElement, event);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(false);
    });

    it('should prevent the default ENTER action', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      const event = dispatchKeyboardEvent(buttonElement, 'keydown', ENTER);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(true);
    });

    it('should not prevent the default ENTER action when a modifier key is pressed', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      const event = createKeyboardEvent('keydown', ENTER, undefined, {shift: true});
      dispatchEvent(buttonElement, event);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBe(false);
    });

    it('should not remove on any key press', () => {
      let buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      spyOn(testChip, 'didRemove');
      dispatchKeyboardEvent(buttonElement, 'keydown', TAB);
      fixture.detectChanges();

      expect(testChip.didRemove).not.toHaveBeenCalled();
    });

    it('should have a focus indicator', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      expect(buttonElement.classList.contains('mat-mdc-focus-indicator')).toBe(true);
    });
  });
});

@Component({
  template: `
    <mat-chip
      [removable]="removable"
      [disabled]="disabled"
      (removed)="didRemove()">
      <button matChipRemove></button>
      <span matChipRemove></span>
    </mat-chip>
  `,
})
class TestChip {
  removable: boolean;
  disabled = false;

  didRemove() {}
}
