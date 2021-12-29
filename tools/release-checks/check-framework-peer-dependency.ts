import {FatalReleaseActionError} from '@angular/dev-infra-private/ng-dev/release/publish/actions-error';
import {error} from '@angular/dev-infra-private/ng-dev/utils/console';
import {SemVer} from 'semver';
import {join} from 'path';
import {existsSync, readFileSync} from 'fs';
import * as chalk from 'chalk';

/** Path to the Bazel file that configures the release output. */
const bzlConfigPath = join(__dirname, '../../packages.bzl');

/**
 * Ensures that the Angular version placeholder has been correctly updated to support
 * given Angular versions. The following rules apply:
 *   `N.x.x` requires Angular `^N.0.0 || (N+1).0.0-0`
 *   `N.0.0-x` requires Angular `^N.0.0-0 || (N+1).0.0-0`
 */
export async function assertValidFrameworkPeerDependency(newVersion: SemVer) {
  const currentVersionRange = _extractAngularVersionPlaceholderOrThrow();
  const isMajorWithPrerelease =
    newVersion.minor === 0 && newVersion.patch === 0 && !!newVersion.prerelease[0];
  const requiredRange = isMajorWithPrerelease
    ? `^${newVersion.major}.0.0-0 || ^${newVersion.major + 1}.0.0-0`
    : `^${newVersion.major}.0.0 || ^${newVersion.major + 1}.0.0-0`;

  if (requiredRange !== currentVersionRange) {
    error(
      chalk.red(
        `  ✘   Cannot stage release. The required Angular version range ` +
          `is invalid. The version range should be: ${requiredRange}`,
      ),
    );
    error(chalk.red(`      Please manually update the version range ` + `in: ${bzlConfigPath}`));
    throw new FatalReleaseActionError();
  }
}

/**
 * Gets the Angular version placeholder from the bazel release config. If
 * the placeholder could not be found, the process will be terminated.
 */
function _extractAngularVersionPlaceholderOrThrow(): string {
  if (!existsSync(bzlConfigPath)) {
    error(
      chalk.red(
        `  ✘   Cannot stage release. Could not find the file which sets ` +
          `the Angular peerDependency placeholder value. Looked for: ${bzlConfigPath}`,
      ),
    );
    throw new FatalReleaseActionError();
  }

  const configFileContent = readFileSync(bzlConfigPath, 'utf8');
  const matches = configFileContent.match(/ANGULAR_PACKAGE_VERSION = ["']([^"']+)/);
  if (!matches || !matches[1]) {
    error(
      chalk.red(
        `  ✘   Cannot stage release. Could not find the ` +
          `"ANGULAR_PACKAGE_VERSION" variable. Please ensure this variable exists. ` +
          `Looked in: ${bzlConfigPath}`,
      ),
    );
    throw new FatalReleaseActionError();
  }
  return matches[1];
}
