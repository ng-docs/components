import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {BlockScrollStrategyE2eModule} from './block-scroll-strategy/block-scroll-strategy-e2e-module';
import {ButtonToggleE2eModule} from './button-toggle/button-toggle-e2e-module';
import {CardE2eModule} from './card/card-e2e-module';
import {ComponentHarnessE2eModule} from './component-harness/component-harness-e2e-module';
import {E2eApp} from './e2e-app';
import {E2eAppModule} from './e2e-app/e2e-app-module';
import {ExpansionE2eModule} from './expansion/expansion-e2e-module';
import {GridListE2eModule} from './grid-list/grid-list-e2e-module';
import {IconE2eModule} from './icon/icon-e2e-module';
import {ListE2eModule} from './list/list-e2e-module';
import {ButtonE2eModule} from './button/button-e2e-module';
import {CheckboxE2eModule} from './checkbox/checkbox-e2e-module';
import {DialogE2eModule} from './dialog/dialog-e2e-module';
import {MenuE2eModule} from './menu/menu-e2e-module';
import {ProgressBarE2eModule} from './progress-bar/progress-bar-e2e-module';
import {ProgressSpinnerE2eModule} from './progress-spinner/progress-spinner-module';
import {RadioE2eModule} from './radio/radio-e2e-module';
import {SlideToggleE2eModule} from './slide-toggle/slide-toggle-e2e-module';
import {SliderE2eModule} from './slider/slider-e2e-module';
import {TableE2eModule} from './table/table-e2e-module';
import {TabsE2eModule} from './tabs/tabs-e2e-module';
import {E2E_APP_ROUTES} from './routes';
import {SidenavE2eModule} from './sidenav/sidenav-e2e-module';
import {StepperE2eModule} from './stepper/stepper-e2e-module';
import {ToolbarE2eModule} from './toolbar/toolbar-e2e-module';
import {VirtualScrollE2eModule} from './virtual-scroll/virtual-scroll-e2e-module';

/** We allow for animations to be explicitly enabled in certain e2e tests. */
const enableAnimations = window.location.search.includes('animations=true');

@NgModule({
  imports: [
    BrowserModule,
    E2eAppModule,
    BrowserAnimationsModule.withConfig({disableAnimations: !enableAnimations}),
    RouterModule.forRoot(E2E_APP_ROUTES),

    // E2E demos
    BlockScrollStrategyE2eModule,
    ButtonToggleE2eModule,
    CardE2eModule,
    ComponentHarnessE2eModule,
    ExpansionE2eModule,
    GridListE2eModule,
    IconE2eModule,
    ListE2eModule,
    ButtonE2eModule,
    CheckboxE2eModule,
    DialogE2eModule,
    MenuE2eModule,
    ProgressBarE2eModule,
    ProgressSpinnerE2eModule,
    RadioE2eModule,
    SliderE2eModule,
    SlideToggleE2eModule,
    TableE2eModule,
    TabsE2eModule,
    SidenavE2eModule,
    StepperE2eModule,
    ToolbarE2eModule,
    VirtualScrollE2eModule,
  ],
  declarations: [E2eApp],
  bootstrap: [E2eApp],
})
export class MainModule {}
