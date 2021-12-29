/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as path from 'path';

/**
 * Resolves a given path through Bazel while respecting the specified parent directory.
 * Usually `require.resolve` could just be used for resolving runfiles relatively, but support
 * for this has been removed and absolute manifest paths or the runfile helpers are now needed
 * on Windows. This helper provides a resolution method that works the same on all platforms.
 *
 * 在指定的父目录的同时解析通过 Bazel 给定的路径。通常 `require.resolve` 只能用于相对解析运行文件，但是对此的支持已删除，现在 Windows 上需要绝对清单路径或运行文件助手。该助手提供了一种在所有平台上都一样的解析方法。
 *
 */
export function resolveBazelPath(parent: string, relativePath: string) {
  if (process.env['RUNFILES_MANIFEST_ONLY'] !== '1') {
    return path.join(parent, relativePath);
  }
  // Note: We don't want to import this outside of this function as the runfile helpers are
  // quite large we don't want to load them for every import to `../testing/private`.
  const {runfiles} = require('@bazel/runfiles');
  const projectDirs = [
    // Workspace symlinked into `@npm//:node_modules/`.
    path.join(runfiles.resolve('npm/node_modules'), runfiles.workspace),
    // Workspace bazel-bin directory.
    runfiles.resolve(runfiles.workspace),
  ];

  for (const projectDir of projectDirs) {
    const relativeParent = path.relative(projectDir, parent);
    const workspacePath = path.join(relativeParent, relativePath).replace(/\\/g, '/');

    try {
      // In newer versions `resolveWorkspaceRelative` throws an error if it doesn't succeed.
      const result = runfiles.resolveWorkspaceRelative(workspacePath);

      if (result) {
        return result;
      }
    } catch {}
  }

  throw Error(`Could not resolve path. Looked in: ${projectDirs.join(', ')}`);
}
