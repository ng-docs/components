/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgModule} from '@angular/core';

import {YouTubePlayer} from './youtube-player';

const COMPONENTS = [YouTubePlayer];

@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS,
})
export class YouTubePlayerModule {}
