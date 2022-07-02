/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component} from '@angular/core';
import {EXAMPLE_COMPONENTS} from '@angular/components-examples';
import {ExampleList} from '../example/example-list';

/**
 * Renders all material examples listed in the generated EXAMPLE_COMPONENTS.
 *
 * 渲染生成的 EXAMPLE_COMPONENTS 中列出的所有材质示例。
 *
 */
@Component({
  template: `<material-example-list [ids]="examples"></material-example-list>`,
  standalone: true,
  imports: [ExampleList],
})
export class ExamplesPage {
  examples = Object.keys(EXAMPLE_COMPONENTS);
}
