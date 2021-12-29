/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, Directive} from '@angular/core';
import {MAT_CHECKBOX_DEFAULT_OPTIONS} from '@angular/material/checkbox';
import {ANIMATION_MODULE_TYPE} from '@angular/platform-browser/animations';
import {ThemePalette} from '@angular/material/core';

export interface Task {
  name: string;
  completed: boolean;
  subtasks?: Task[];
}

@Directive({
  selector: '[clickActionNoop]',
  providers: [{provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: {clickAction: 'noop'}}],
})
export class ClickActionNoop {}

@Directive({
  selector: '[clickActionCheck]',
  providers: [{provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: {clickAction: 'check'}}],
})
export class ClickActionCheck {}

@Directive({
  selector: '[animationsNoop]',
  providers: [{provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations'}],
})
export class AnimationsNoop {}

@Component({
  selector: 'mat-checkbox-demo-nested-checklist',
  styles: [
    `
    li {
      margin-bottom: 4px;
    }
  `,
  ],
  templateUrl: './nested-checklist.html',
})
export class MatCheckboxDemoNestedChecklist {
  tasks: Task[] = [
    {
      name: 'Reminders',
      completed: false,
      subtasks: [
        {name: 'Cook Dinner', completed: false},
        {name: 'Read the Material Design Spec', completed: false},
        {name: 'Upgrade Application to Angular', completed: false},
      ],
    },
    {
      name: 'Groceries',
      completed: false,
      subtasks: [
        {name: 'Organic Eggs', completed: false},
        {name: 'Protein Powder', completed: false},
        {name: 'Almond Meal Flour', completed: false},
      ],
    },
  ];

  allComplete(task: Task): boolean {
    const subtasks = task.subtasks;

    return task.completed || (subtasks != null && subtasks.every(t => t.completed));
  }

  someComplete(tasks: Task[] | undefined | null): boolean {
    if (tasks == null) {
      return false;
    }
    const numComplete = tasks.filter(t => t.completed).length;
    return numComplete > 0 && numComplete < tasks.length;
  }

  setAllCompleted(tasks: Task[] | undefined | null, completed: boolean): void {
    if (tasks == null) {
      return;
    }
    tasks.forEach(t => (t.completed = completed));
  }
}

@Component({
  selector: 'mat-checkbox-demo',
  templateUrl: 'checkbox-demo.html',
  styleUrls: ['checkbox-demo.css'],
})
export class CheckboxDemo {
  isIndeterminate: boolean = false;
  isChecked: boolean = false;
  isDisabled: boolean = false;
  labelPosition: 'after' | 'before' = 'after';
  useAlternativeColor: boolean = false;

  demoRequired = false;
  demoLabelAfter = false;
  demoChecked = false;
  demoDisabled = false;
  demoIndeterminate = false;
  demoLabel: string;
  demoLabelledBy: string;
  demoId: string;
  demoName: string;
  demoValue: string;
  demoColor: ThemePalette = 'primary';
  demoDisableRipple = false;
  demoHideLabel = false;

  printResult() {
    if (this.isIndeterminate) {
      return 'Maybe!';
    }
    return this.isChecked ? 'Yes!' : 'No!';
  }

  checkboxColor() {
    return this.useAlternativeColor ? 'primary' : 'accent';
  }
}
