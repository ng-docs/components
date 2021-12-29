import {SemVer} from 'semver';
import {checkReleasePackage} from './check-package';
import {BuiltPackage} from '@angular/dev-infra-private/ng-dev/release/config';
import {error} from '@angular/dev-infra-private/ng-dev/utils/console';
import * as chalk from 'chalk';

/** Asserts that the given built packages are valid for public consumption. */
export async function assertValidNpmPackageOutput(
  builtPackages: BuiltPackage[],
  currentVersion: SemVer,
) {
  let passing = true;

  for (const {name, outputPath} of builtPackages) {
    passing = passing && checkReleasePackage(outputPath, name, currentVersion.format());
  }

  if (!passing) {
    error(chalk.red(`  ✘   NPM package output does not pass all release validations.`));
    process.exit(1);
  }
}
