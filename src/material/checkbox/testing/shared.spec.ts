import {Platform} from '@angular/cdk/platform';
import {HarnessLoader} from '@angular/cdk/testing';
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {Component} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatCheckboxHarness} from '@angular/material/checkbox/testing/checkbox-harness';

/**
 * Function that can be used to run the shared checkbox harness tests for either the non-MDC or
 * MDC based checkbox harness.
 */
export function runHarnessTests(
  checkboxModule: typeof MatCheckboxModule,
  checkboxHarness: typeof MatCheckboxHarness,
) {
  let platform: Platform;
  let fixture: ComponentFixture<CheckboxHarnessTest>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [checkboxModule, ReactiveFormsModule],
      declarations: [CheckboxHarnessTest],
    }).compileComponents();

    platform = TestBed.inject(Platform);
    fixture = TestBed.createComponent(CheckboxHarnessTest);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should load all checkbox harnesses', async () => {
    const checkboxes = await loader.getAllHarnesses(checkboxHarness);
    expect(checkboxes.length).toBe(2);
  });

  it('should load checkbox with exact label', async () => {
    const checkboxes = await loader.getAllHarnesses(checkboxHarness.with({label: 'First'}));
    expect(checkboxes.length).toBe(1);
    expect(await checkboxes[0].getLabelText()).toBe('First');
  });

  it('should load checkbox with name', async () => {
    const checkboxes = await loader.getAllHarnesses(checkboxHarness.with({name: 'first-name'}));
    expect(checkboxes.length).toBe(1);
    expect(await checkboxes[0].getLabelText()).toBe('First');
  });

  it('should load checkbox with regex label match', async () => {
    const checkboxes = await loader.getAllHarnesses(checkboxHarness.with({label: /^s/i}));
    expect(checkboxes.length).toBe(1);
    expect(await checkboxes[0].getLabelText()).toBe('Second');
  });

  it('should get checked state', async () => {
    const [checkedCheckbox, uncheckedCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    expect(await checkedCheckbox.isChecked()).toBe(true);
    expect(await uncheckedCheckbox.isChecked()).toBe(false);
  });

  it('should get indeterminate state', async () => {
    const [checkedCheckbox, indeterminateCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    expect(await checkedCheckbox.isIndeterminate()).toBe(false);
    expect(await indeterminateCheckbox.isIndeterminate()).toBe(true);
  });

  it('should get disabled state', async () => {
    const [enabledCheckbox, disabledCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    expect(await enabledCheckbox.isDisabled()).toBe(false);
    expect(await disabledCheckbox.isDisabled()).toBe(true);
  });

  it('should get required state', async () => {
    const [requiredCheckbox, optionalCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    expect(await requiredCheckbox.isRequired()).toBe(true);
    expect(await optionalCheckbox.isRequired()).toBe(false);
  });

  it('should get valid state', async () => {
    const [requiredCheckbox, optionalCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    expect(await optionalCheckbox.isValid()).toBe(true);
    expect(await requiredCheckbox.isValid()).toBe(true);
    await requiredCheckbox.uncheck();
    expect(await requiredCheckbox.isValid()).toBe(false);
  });

  it('should get name', async () => {
    const checkbox = await loader.getHarness(checkboxHarness.with({label: 'First'}));
    expect(await checkbox.getName()).toBe('first-name');
  });

  it('should get value', async () => {
    const checkbox = await loader.getHarness(checkboxHarness.with({label: 'First'}));
    expect(await checkbox.getValue()).toBe('first-value');
  });

  it('should get aria-label', async () => {
    const checkbox = await loader.getHarness(checkboxHarness.with({label: 'First'}));
    expect(await checkbox.getAriaLabel()).toBe('First checkbox');
  });

  it('should get aria-labelledby', async () => {
    const checkbox = await loader.getHarness(checkboxHarness.with({label: 'Second'}));
    expect(await checkbox.getAriaLabelledby()).toBe('second-label');
  });

  it('should get label text', async () => {
    const [firstCheckbox, secondCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    expect(await firstCheckbox.getLabelText()).toBe('First');
    expect(await secondCheckbox.getLabelText()).toBe('Second');
  });

  it('should focus checkbox', async () => {
    const checkbox = await loader.getHarness(checkboxHarness.with({label: 'First'}));
    expect(await checkbox.isFocused()).toBe(false);
    await checkbox.focus();
    expect(await checkbox.isFocused()).toBe(true);
  });

  it('should blur checkbox', async () => {
    const checkbox = await loader.getHarness(checkboxHarness.with({label: 'First'}));
    await checkbox.focus();
    expect(await checkbox.isFocused()).toBe(true);
    await checkbox.blur();
    expect(await checkbox.isFocused()).toBe(false);
  });

  it('should toggle checkbox', async () => {
    fixture.componentInstance.disabled = false;
    const [checkedCheckbox, uncheckedCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    await checkedCheckbox.toggle();
    await uncheckedCheckbox.toggle();
    expect(await checkedCheckbox.isChecked()).toBe(false);
    expect(await uncheckedCheckbox.isChecked()).toBe(true);
  });

  it('should check checkbox', async () => {
    fixture.componentInstance.disabled = false;
    const [checkedCheckbox, uncheckedCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    await checkedCheckbox.check();
    await uncheckedCheckbox.check();
    expect(await checkedCheckbox.isChecked()).toBe(true);
    expect(await uncheckedCheckbox.isChecked()).toBe(true);
  });

  it('should uncheck checkbox', async () => {
    fixture.componentInstance.disabled = false;
    const [checkedCheckbox, uncheckedCheckbox] = await loader.getAllHarnesses(checkboxHarness);
    await checkedCheckbox.uncheck();
    await uncheckedCheckbox.uncheck();
    expect(await checkedCheckbox.isChecked()).toBe(false);
    expect(await uncheckedCheckbox.isChecked()).toBe(false);
  });

  it('should not toggle disabled checkbox', async () => {
    if (platform.FIREFOX) {
      // do run this test on firefox as click events on the label of a disabled checkbox
      // cause the value to be changed. https://bugzilla.mozilla.org/show_bug.cgi?id=1540995
      return;
    }
    const disabledCheckbox = await loader.getHarness(checkboxHarness.with({label: 'Second'}));
    expect(await disabledCheckbox.isChecked()).toBe(false);
    await disabledCheckbox.toggle();
    expect(await disabledCheckbox.isChecked()).toBe(false);
  });
}

@Component({
  template: `
      <mat-checkbox
          [formControl]="ctrl"
          required
          name="first-name"
          value="first-value"
          aria-label="First checkbox">
        First
      </mat-checkbox>
      <mat-checkbox indeterminate="true" [disabled]="disabled" aria-labelledby="second-label">
        Second
      </mat-checkbox>
      <span id="second-label">Second checkbox</span>
  `,
})
class CheckboxHarnessTest {
  ctrl = new FormControl(true);
  disabled = true;
}
