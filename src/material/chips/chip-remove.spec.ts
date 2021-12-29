import {Component, DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatChip, MatChipsModule} from './index';

describe('Chip Remove', () => {
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
      const buttonElement = chipNativeElement.querySelector('button')!;

      expect(buttonElement.classList).toContain('mat-chip-remove');
    });

    it('should ensure that the button cannot submit its parent form', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      expect(buttonElement.getAttribute('type')).toBe('button');
    });

    it('should not set the `type` attribute on non-button elements', () => {
      const buttonElement = chipNativeElement.querySelector('span.mat-chip-remove')!;

      expect(buttonElement.hasAttribute('type')).toBe(false);
    });

    it('should emit (removed) on click', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      testChip.removable = true;
      fixture.detectChanges();

      spyOn(testChip, 'didRemove');

      buttonElement.click();
      fixture.detectChanges();

      expect(testChip.didRemove).toHaveBeenCalled();
    });

    it('should not remove if parent chip is disabled', () => {
      const buttonElement = chipNativeElement.querySelector('button')!;

      testChip.disabled = true;
      testChip.removable = true;
      fixture.detectChanges();

      spyOn(testChip, 'didRemove');

      buttonElement.click();
      fixture.detectChanges();

      expect(testChip.didRemove).not.toHaveBeenCalled();
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
