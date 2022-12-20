import {runHarnessTests} from '@angular/material/progress-spinner/testing/shared.spec';
import {MatProgressSpinnerHarness} from './progress-spinner-harness';
import {MatProgressSpinnerModule} from '../index';

describe('MDC-based MatProgressSpinnerHarness', () => {
  runHarnessTests(MatProgressSpinnerModule, MatProgressSpinnerHarness);
});
