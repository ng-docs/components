/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Converts the specified speed factor into the exact static enter duration.
 *
 * 将指定的速度系数转换为精确的静态输入持续时间。
 *
 */
export function convertSpeedFactorToDuration(factor: number) {
  // Based on the numeric speed factor value that only affected the `enterDuration` we can
  // now calculate the exact `enterDuration`. 450ms is the enter duration without factor.
  return 450 / (factor || 1);
}

/**
 * Creates a runtime TypeScript expression that can be used in order to calculate the duration
 * from the speed factor expression that couldn't be statically analyzed.
 *
 * 创建一个运行时 TypeScript 表达式，可用于根据无法静态分析的速度因子表达式计算持续时间。
 *
 * @param speedFactorValue Speed factor expression that couldn't be statically analyzed.
 *
 * 无法静态分析的速度因子表达式。
 *
 */
export function createSpeedFactorConvertExpression(speedFactorValue: string): string {
  // To be sure that the speed factor value expression is calculated properly, we need to add
  // the according parenthesis.
  return `450 / (${speedFactorValue})`;
}
