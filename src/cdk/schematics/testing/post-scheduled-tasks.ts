/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {EngineHost, TaskExecutor, TaskScheduler} from '@angular-devkit/schematics';
import {SchematicTestRunner} from '@angular-devkit/schematics/testing';
import {from as observableFrom, Observable} from 'rxjs';
import {concatMap, filter, last} from 'rxjs/operators';

/**
 * Due to the fact that the Angular devkit does not support running scheduled tasks from a
 * schematic that has been launched through the TestRunner, we need to manually find the task
 * executor for the given task name and run all scheduled instances.
 *
 * 由于 Angular devkit 不支持通过 TestRunner 启动的原理图中运行计划的任务，因此我们需要手动找到给定任务名称的任务执行程序，并运行所有计划的实例。
 *
 * Note that this means that there can be multiple tasks with the same name. The observable emits
 * only when all tasks finished executing.
 *
 * 请注意，这意味着可以有多个具有相同名称的任务。当所有任务完成执行时，可观察对象才发出通知。
 *
 */
export function runPostScheduledTasks(
  runner: SchematicTestRunner,
  taskName: string,
): Observable<any> {
  // Workaround until there is a public API to run scheduled tasks in the @angular-devkit.
  // See: https://github.com/angular/angular-cli/issues/11739
  const host = runner.engine['_host'] as EngineHost<{}, {}>;
  const tasks = runner.engine['_taskSchedulers'] as TaskScheduler[];
  const createTaskExecutor = (name: string) =>
    host.createTaskExecutor(name) as any as Observable<TaskExecutor<any>>;

  return observableFrom(tasks).pipe(
    concatMap(scheduler => scheduler.finalize()),
    filter(task => task.configuration.name === taskName),
    concatMap(task => {
      return createTaskExecutor(task.configuration.name).pipe(
        concatMap(executor => executor(task.configuration.options, task.context)),
      );
    }),
    // Only emit the last emitted value because there can be multiple tasks with the same name.
    // The observable should only emit a value if all tasks completed.
    last(),
  );
}
