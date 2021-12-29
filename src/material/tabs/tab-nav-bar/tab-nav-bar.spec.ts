import {waitForAsync, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Component, ViewChild, ViewChildren, QueryList} from '@angular/core';
import {MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions} from '@angular/material/core';
import {By} from '@angular/platform-browser';
import {dispatchFakeEvent, dispatchMouseEvent} from '../../../cdk/testing/private';
import {Direction, Directionality} from '@angular/cdk/bidi';
import {Subject} from 'rxjs';
import {MatTabLink, MatTabNav, MatTabsModule} from '../index';

describe('MatTabNavBar', () => {
  let dir: Direction = 'ltr';
  let dirChange = new Subject();
  let globalRippleOptions: RippleGlobalOptions;

  beforeEach(
    waitForAsync(() => {
      globalRippleOptions = {};

      TestBed.configureTestingModule({
        imports: [MatTabsModule],
        declarations: [
          SimpleTabNavBarTestApp,
          TabLinkWithNgIf,
          TabLinkWithTabIndexBinding,
          TabLinkWithNativeTabindexAttr,
          TabBarWithInactiveTabsOnInit,
        ],
        providers: [
          {provide: MAT_RIPPLE_GLOBAL_OPTIONS, useFactory: () => globalRippleOptions},
          {provide: Directionality, useFactory: () => ({value: dir, change: dirChange})},
        ],
      });

      TestBed.compileComponents();
    }),
  );

  describe('basic behavior', () => {
    let fixture: ComponentFixture<SimpleTabNavBarTestApp>;

    beforeEach(() => {
      fixture = TestBed.createComponent(SimpleTabNavBarTestApp);
      fixture.detectChanges();
    });

    it('should change active index on click', () => {
      // select the second link
      let tabLink = fixture.debugElement.queryAll(By.css('a'))[1];
      tabLink.nativeElement.click();
      expect(fixture.componentInstance.activeIndex).toBe(1);

      // select the third link
      tabLink = fixture.debugElement.queryAll(By.css('a'))[2];
      tabLink.nativeElement.click();
      expect(fixture.componentInstance.activeIndex).toBe(2);
    });

    it('should add the active class if active', () => {
      const tabLink1 = fixture.debugElement.queryAll(By.css('a'))[0];
      const tabLink2 = fixture.debugElement.queryAll(By.css('a'))[1];
      const tabLinkElements = fixture.debugElement
        .queryAll(By.css('a'))
        .map(tabLinkDebugEl => tabLinkDebugEl.nativeElement);

      tabLink1.nativeElement.click();
      fixture.detectChanges();
      expect(tabLinkElements[0].classList.contains('mat-tab-label-active')).toBeTruthy();
      expect(tabLinkElements[1].classList.contains('mat-tab-label-active')).toBeFalsy();

      tabLink2.nativeElement.click();
      fixture.detectChanges();
      expect(tabLinkElements[0].classList.contains('mat-tab-label-active')).toBeFalsy();
      expect(tabLinkElements[1].classList.contains('mat-tab-label-active')).toBeTruthy();
    });

    it('should toggle aria-current based on active state', () => {
      const tabLink1 = fixture.debugElement.queryAll(By.css('a'))[0];
      const tabLink2 = fixture.debugElement.queryAll(By.css('a'))[1];
      const tabLinkElements = fixture.debugElement
        .queryAll(By.css('a'))
        .map(tabLinkDebugEl => tabLinkDebugEl.nativeElement);

      tabLink1.nativeElement.click();
      fixture.detectChanges();
      expect(tabLinkElements[0].getAttribute('aria-current')).toEqual('page');
      expect(tabLinkElements[1].hasAttribute('aria-current')).toEqual(false);

      tabLink2.nativeElement.click();
      fixture.detectChanges();
      expect(tabLinkElements[0].hasAttribute('aria-current')).toEqual(false);
      expect(tabLinkElements[1].getAttribute('aria-current')).toEqual('page');
    });

    it('should add the disabled class if disabled', () => {
      const tabLinkElements = fixture.debugElement
        .queryAll(By.css('a'))
        .map(tabLinkDebugEl => tabLinkDebugEl.nativeElement);

      expect(tabLinkElements.every(tabLinkEl => !tabLinkEl.classList.contains('mat-tab-disabled')))
        .withContext('Expected every tab link to not have the disabled class initially')
        .toBe(true);

      fixture.componentInstance.disabled = true;
      fixture.detectChanges();

      expect(tabLinkElements.every(tabLinkEl => tabLinkEl.classList.contains('mat-tab-disabled')))
        .withContext('Expected every tab link to have the disabled class if set through binding')
        .toBe(true);
    });

    it('should update aria-disabled if disabled', () => {
      const tabLinkElements = fixture.debugElement
        .queryAll(By.css('a'))
        .map(tabLinkDebugEl => tabLinkDebugEl.nativeElement);

      expect(tabLinkElements.every(tabLink => tabLink.getAttribute('aria-disabled') === 'false'))
        .withContext('Expected aria-disabled to be set to "false" by default.')
        .toBe(true);

      fixture.componentInstance.disabled = true;
      fixture.detectChanges();

      expect(tabLinkElements.every(tabLink => tabLink.getAttribute('aria-disabled') === 'true'))
        .withContext('Expected aria-disabled to be set to "true" if link is disabled.')
        .toBe(true);
    });

    it('should update the tabindex if links are disabled', () => {
      const tabLinkElements = fixture.debugElement
        .queryAll(By.css('a'))
        .map(tabLinkDebugEl => tabLinkDebugEl.nativeElement);

      expect(tabLinkElements.every(tabLink => tabLink.tabIndex === 0))
        .withContext('Expected element to be keyboard focusable by default')
        .toBe(true);

      fixture.componentInstance.disabled = true;
      fixture.detectChanges();

      expect(tabLinkElements.every(tabLink => tabLink.tabIndex === -1))
        .withContext('Expected element to no longer be keyboard focusable if disabled.')
        .toBe(true);
    });

    it('should mark disabled links', () => {
      const tabLinkElement = fixture.debugElement.query(By.css('a'))!.nativeElement;

      expect(tabLinkElement.classList).not.toContain('mat-tab-disabled');

      fixture.componentInstance.disabled = true;
      fixture.detectChanges();

      expect(tabLinkElement.classList).toContain('mat-tab-disabled');
    });

    it('should re-align the ink bar when the direction changes', fakeAsync(() => {
      const inkBar = fixture.componentInstance.tabNavBar._inkBar;

      spyOn(inkBar, 'alignToElement');

      dirChange.next();
      tick();
      fixture.detectChanges();

      expect(inkBar.alignToElement).toHaveBeenCalled();
    }));

    it('should re-align the ink bar when the tabs list change', fakeAsync(() => {
      const inkBar = fixture.componentInstance.tabNavBar._inkBar;

      spyOn(inkBar, 'alignToElement');

      fixture.componentInstance.tabs = [1, 2, 3, 4];
      fixture.detectChanges();
      tick();

      expect(inkBar.alignToElement).toHaveBeenCalled();
    }));

    it('should re-align the ink bar when the tab labels change the width', done => {
      const inkBar = fixture.componentInstance.tabNavBar._inkBar;

      const spy = spyOn(inkBar, 'alignToElement').and.callFake(() => {
        expect(spy.calls.any()).toBe(true);
        done();
      });

      fixture.componentInstance.label = 'label change';
      fixture.detectChanges();

      expect(spy.calls.any()).toBe(false);
    });

    it('should re-align the ink bar when the window is resized', fakeAsync(() => {
      const inkBar = fixture.componentInstance.tabNavBar._inkBar;

      spyOn(inkBar, 'alignToElement');

      dispatchFakeEvent(window, 'resize');
      tick(150);
      fixture.detectChanges();

      expect(inkBar.alignToElement).toHaveBeenCalled();
    }));

    it('should hide the ink bar when all the links are inactive', () => {
      const inkBar = fixture.componentInstance.tabNavBar._inkBar;

      spyOn(inkBar, 'hide');

      fixture.componentInstance.tabLinks.forEach(link => (link.active = false));
      fixture.detectChanges();

      expect(inkBar.hide).toHaveBeenCalled();
    });

    it('should update the focusIndex when a tab receives focus directly', () => {
      const thirdLink = fixture.debugElement.queryAll(By.css('a'))[2];
      dispatchFakeEvent(thirdLink.nativeElement, 'focus');
      fixture.detectChanges();

      expect(fixture.componentInstance.tabNavBar.focusIndex).toBe(2);
    });
  });

  it('should hide the ink bar if no tabs are active on init', fakeAsync(() => {
    const fixture = TestBed.createComponent(TabBarWithInactiveTabsOnInit);
    fixture.detectChanges();
    tick(20); // Angular turns rAF calls into 16.6ms timeouts in tests.
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mat-ink-bar').style.visibility).toBe('hidden');
  }));

  it('should clean up the ripple event handlers on destroy', () => {
    const fixture: ComponentFixture<TabLinkWithNgIf> = TestBed.createComponent(TabLinkWithNgIf);
    fixture.detectChanges();

    const link = fixture.debugElement.nativeElement.querySelector('.mat-tab-link');

    fixture.componentInstance.isDestroyed = true;
    fixture.detectChanges();

    dispatchMouseEvent(link, 'mousedown');

    expect(link.querySelector('.mat-ripple-element'))
      .withContext('Expected no ripple to be created when ripple target is destroyed.')
      .toBeFalsy();
  });

  it('should support the native tabindex attribute', () => {
    const fixture = TestBed.createComponent(TabLinkWithNativeTabindexAttr);
    fixture.detectChanges();

    const tabLink = fixture.debugElement
      .query(By.directive(MatTabLink))!
      .injector.get<MatTabLink>(MatTabLink);

    expect(tabLink.tabIndex)
      .withContext('Expected the tabIndex to be set from the native tabindex attribute.')
      .toBe(5);
  });

  it('should support binding to the tabIndex', () => {
    const fixture = TestBed.createComponent(TabLinkWithTabIndexBinding);
    fixture.detectChanges();

    const tabLink = fixture.debugElement
      .query(By.directive(MatTabLink))!
      .injector.get<MatTabLink>(MatTabLink);

    expect(tabLink.tabIndex)
      .withContext('Expected the tabIndex to be set to 0 by default.')
      .toBe(0);

    fixture.componentInstance.tabIndex = 3;
    fixture.detectChanges();

    expect(tabLink.tabIndex).withContext('Expected the tabIndex to be have been set to 3.').toBe(3);
  });

  it('should select the proper tab, if the tabs come in after init', () => {
    const fixture = TestBed.createComponent(SimpleTabNavBarTestApp);
    const instance = fixture.componentInstance;

    instance.tabs = [];
    instance.activeIndex = 1;
    fixture.detectChanges();

    expect(instance.tabNavBar.selectedIndex).toBe(-1);

    instance.tabs = [0, 1, 2];
    fixture.detectChanges();

    expect(instance.tabNavBar.selectedIndex).toBe(1);
  });

  describe('ripples', () => {
    let fixture: ComponentFixture<SimpleTabNavBarTestApp>;

    beforeEach(() => {
      fixture = TestBed.createComponent(SimpleTabNavBarTestApp);
      fixture.detectChanges();
    });

    it('should be disabled on all tab links when they are disabled on the nav bar', () => {
      expect(fixture.componentInstance.tabLinks.toArray().every(tabLink => !tabLink.rippleDisabled))
        .withContext('Expected every tab link to have ripples enabled')
        .toBe(true);

      fixture.componentInstance.disableRippleOnBar = true;
      fixture.detectChanges();

      expect(fixture.componentInstance.tabLinks.toArray().every(tabLink => tabLink.rippleDisabled))
        .withContext('Expected every tab link to have ripples disabled')
        .toBe(true);
    });

    it('should have the `disableRipple` from the tab take precedence over the nav bar', () => {
      const firstTab = fixture.componentInstance.tabLinks.first;

      expect(firstTab.rippleDisabled)
        .withContext('Expected ripples to be enabled on first tab')
        .toBe(false);

      firstTab.disableRipple = true;
      fixture.componentInstance.disableRippleOnBar = false;
      fixture.detectChanges();

      expect(firstTab.rippleDisabled)
        .withContext('Expected ripples to be disabled on first tab')
        .toBe(true);
    });

    it('should show up for tab link elements on mousedown', () => {
      const tabLink = fixture.debugElement.nativeElement.querySelector('.mat-tab-link');

      dispatchMouseEvent(tabLink, 'mousedown');
      dispatchMouseEvent(tabLink, 'mouseup');

      expect(tabLink.querySelectorAll('.mat-ripple-element').length)
        .withContext('Expected one ripple to show up if user clicks on tab link.')
        .toBe(1);
    });

    it('should be able to disable ripples on an individual tab link', () => {
      const tabLinkDebug = fixture.debugElement.query(By.css('a'))!;
      const tabLinkElement = tabLinkDebug.nativeElement;
      const tabLinkInstance = tabLinkDebug.injector.get<MatTabLink>(MatTabLink);

      tabLinkInstance.disableRipple = true;

      dispatchMouseEvent(tabLinkElement, 'mousedown');
      dispatchMouseEvent(tabLinkElement, 'mouseup');

      expect(tabLinkElement.querySelectorAll('.mat-ripple-element').length)
        .withContext('Expected no ripple to show up if ripples are disabled.')
        .toBe(0);
    });

    it('should be able to disable ripples through global options at runtime', () => {
      expect(fixture.componentInstance.tabLinks.toArray().every(tabLink => !tabLink.rippleDisabled))
        .withContext('Expected every tab link to have ripples enabled')
        .toBe(true);

      globalRippleOptions.disabled = true;

      expect(fixture.componentInstance.tabLinks.toArray().every(tabLink => tabLink.rippleDisabled))
        .withContext('Expected every tab link to have ripples disabled')
        .toBe(true);
    });

    it('should have a focus indicator', () => {
      const tabLinkNativeElements = [
        ...fixture.debugElement.nativeElement.querySelectorAll('.mat-tab-link'),
      ];

      expect(
        tabLinkNativeElements.every(element => element.classList.contains('mat-focus-indicator')),
      ).toBe(true);
    });
  });
});

@Component({
  selector: 'test-app',
  template: `
    <nav mat-tab-nav-bar [disableRipple]="disableRippleOnBar">
      <a mat-tab-link
         *ngFor="let tab of tabs; let index = index"
         [active]="activeIndex === index"
         [disabled]="disabled"
         (click)="activeIndex = index">
        Tab link {{label}}
      </a>
    </nav>
  `,
})
class SimpleTabNavBarTestApp {
  @ViewChild(MatTabNav) tabNavBar: MatTabNav;
  @ViewChildren(MatTabLink) tabLinks: QueryList<MatTabLink>;

  label = '';
  disabled = false;
  disableRippleOnBar = false;
  tabs = [0, 1, 2];

  activeIndex = 0;
}

@Component({
  template: `
    <nav mat-tab-nav-bar>
      <a mat-tab-link *ngIf="!isDestroyed">Link</a>
    </nav>
  `,
})
class TabLinkWithNgIf {
  isDestroyed = false;
}

@Component({
  template: `
    <nav mat-tab-nav-bar>
      <a mat-tab-link [tabIndex]="tabIndex">TabIndex Link</a>
    </nav>
  `,
})
class TabLinkWithTabIndexBinding {
  tabIndex = 0;
}

@Component({
  template: `
    <nav mat-tab-nav-bar>
      <a mat-tab-link tabindex="5">Link</a>
    </nav>
  `,
})
class TabLinkWithNativeTabindexAttr {}

@Component({
  template: `
    <nav mat-tab-nav-bar>
      <a mat-tab-link *ngFor="let tab of tabs" [active]="false">Tab link {{label}}</a>
    </nav>
  `,
})
class TabBarWithInactiveTabsOnInit {
  tabs = [0, 1, 2];
}
