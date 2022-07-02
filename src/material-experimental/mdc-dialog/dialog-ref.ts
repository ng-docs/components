/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {MatDialogRef as NonMdcDialogRef} from '@angular/material/dialog';

/**
 * Reference to a dialog opened via the MatDialog service.
 *
 * 通过 MatDialog 服务打开的对话框的引用。
 *
 */
export class MatDialogRef<T, R = any> extends NonMdcDialogRef<T, R> {}
