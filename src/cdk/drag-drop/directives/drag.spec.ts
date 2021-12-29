import {Directionality} from '@angular/cdk/bidi';
import {
  createMouseEvent,
  createTouchEvent,
  dispatchEvent,
  dispatchMouseEvent,
  dispatchTouchEvent,
  dispatchFakeEvent,
} from '../../testing/private';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  Provider,
  QueryList,
  Type,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import {TestBed, ComponentFixture, fakeAsync, flush, tick} from '@angular/core/testing';
import {DOCUMENT} from '@angular/common';
import {ViewportRuler, CdkScrollableModule} from '@angular/cdk/scrolling';
import {_supportsShadowDom} from '@angular/cdk/platform';
import {of as observableOf} from 'rxjs';

import {DragDropModule} from '../drag-drop-module';
import {CdkDragDrop, CdkDragEnter, CdkDragStart} from '../drag-events';
import {Point, DragRef, PreviewContainer} from '../drag-ref';
import {extendStyles} from '../drag-styling';
import {moveItemInArray} from '../drag-utils';

import {CdkDrag} from './drag';
import {CDK_DRAG_CONFIG, DragDropConfig} from './config';
import {CdkDragHandle} from './drag-handle';
import {CdkDropList} from './drop-list';
import {CdkDropListGroup} from './drop-list-group';

const ITEM_HEIGHT = 25;
const ITEM_WIDTH = 75;

describe('CdkDrag', () => {
  function createComponent<T>(
    componentType: Type<T>,
    providers: Provider[] = [],
    dragDistance = 0,
    extraDeclarations: Type<any>[] = [],
    encapsulation?: ViewEncapsulation,
  ): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: [DragDropModule, CdkScrollableModule],
      declarations: [componentType, PassthroughComponent, ...extraDeclarations],
      providers: [
        {
          provide: CDK_DRAG_CONFIG,
          useValue: {
            // We default the `dragDistance` to zero, because the majority of the tests
            // don't care about it and drags are a lot easier to simulate when we don't
            // have to deal with thresholds.
            dragStartThreshold: dragDistance,
            pointerDirectionChangeThreshold: 5,
          } as DragDropConfig,
        },
        ...providers,
      ],
    });

    if (encapsulation != null) {
      TestBed.overrideComponent(componentType, {
        set: {encapsulation},
      });
    }

    TestBed.compileComponents();
    return TestBed.createComponent<T>(componentType);
  }

  describe('standalone draggable', () => {
    describe('mouse dragging', () => {
      it('should drag an element freely to a particular position', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();
        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
      }));

      it('should drag an element freely to a particular position when the page is scrolled', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();

        const cleanup = makeScrollable();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        scrollTo(0, 500);
        expect(dragElement.style.transform).toBeFalsy();
        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
        cleanup();
      }));

      it('should continue dragging the element from where it was left off', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();

        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

        dragElementViaMouse(fixture, dragElement, 100, 200);
        expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px)');
      }));

      it('should continue dragging from where it was left off when the page is scrolled', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();

        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        const cleanup = makeScrollable();

        scrollTo(0, 500);
        expect(dragElement.style.transform).toBeFalsy();

        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

        dragElementViaMouse(fixture, dragElement, 100, 200);
        expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px)');

        cleanup();
      }));

      it('should not drag an element with the right mouse button', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        const event = createMouseEvent('mousedown', 50, 100, 2);

        expect(dragElement.style.transform).toBeFalsy();

        dispatchEvent(dragElement, event);
        fixture.detectChanges();

        dispatchMouseEvent(document, 'mousemove', 50, 100);
        fixture.detectChanges();

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();

        expect(dragElement.style.transform).toBeFalsy();
      }));

      it('should not drag the element if it was not moved more than the minimum distance', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable, [], 5);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();
        dragElementViaMouse(fixture, dragElement, 2, 2);
        expect(dragElement.style.transform).toBeFalsy();
      }));

      it('should be able to stop dragging after a double click', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable, [], 5);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();

        dispatchMouseEvent(dragElement, 'mousedown');
        fixture.detectChanges();
        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        dispatchMouseEvent(dragElement, 'mousedown');
        fixture.detectChanges();
        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();

        dragElementViaMouse(fixture, dragElement, 50, 50);
        dispatchMouseEvent(document, 'mousemove', 100, 100);
        fixture.detectChanges();

        expect(dragElement.style.transform).toBeFalsy();
      }));

      it('should preserve the previous `transform` value', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        dragElement.style.transform = 'translateX(-50%)';
        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px) translateX(-50%)');
      }));

      it('should not generate multiple own `translate3d` values', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        dragElement.style.transform = 'translateY(-50%)';

        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px) translateY(-50%)');

        dragElementViaMouse(fixture, dragElement, 100, 200);
        expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px) translateY(-50%)');
      }));

      it('should prevent the `mousedown` action for native draggable elements', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        dragElement.draggable = true;

        const mousedownEvent = createMouseEvent('mousedown', 50, 50);
        Object.defineProperty(mousedownEvent, 'target', {get: () => dragElement});
        spyOn(mousedownEvent, 'preventDefault').and.callThrough();
        dispatchEvent(dragElement, mousedownEvent);
        fixture.detectChanges();

        dispatchMouseEvent(document, 'mousemove', 50, 50);
        fixture.detectChanges();

        expect(mousedownEvent.preventDefault).toHaveBeenCalled();
      }));

      it('should not start dragging an element with a fake mousedown event', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        const event = createMouseEvent('mousedown', 0, 0);

        Object.defineProperties(event, {
          offsetX: {get: () => 0},
          offsetY: {get: () => 0},
        });

        expect(dragElement.style.transform).toBeFalsy();

        dispatchEvent(dragElement, event);
        fixture.detectChanges();

        dispatchMouseEvent(document, 'mousemove', 20, 100);
        fixture.detectChanges();
        dispatchMouseEvent(document, 'mousemove', 50, 100);
        fixture.detectChanges();

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();

        expect(dragElement.style.transform).toBeFalsy();
      }));
    });

    describe('touch dragging', () => {
      it('should drag an element freely to a particular position', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();
        dragElementViaTouch(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
      }));

      it('should drag an element freely to a particular position when the page is scrolled', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();

        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        const cleanup = makeScrollable();

        scrollTo(0, 500);
        expect(dragElement.style.transform).toBeFalsy();
        dragElementViaTouch(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
        cleanup();
      }));

      it('should continue dragging the element from where it was left off', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();

        dragElementViaTouch(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

        dragElementViaTouch(fixture, dragElement, 100, 200);
        expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px)');
      }));

      it('should continue dragging from where it was left off when the page is scrolled', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();

        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        const cleanup = makeScrollable();

        scrollTo(0, 500);
        expect(dragElement.style.transform).toBeFalsy();

        dragElementViaTouch(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

        dragElementViaTouch(fixture, dragElement, 100, 200);
        expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px)');

        cleanup();
      }));

      it('should prevent the default `touchmove` action on the page while dragging', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();

        dispatchTouchEvent(fixture.componentInstance.dragElement.nativeElement, 'touchstart');
        fixture.detectChanges();

        expect(dispatchTouchEvent(document, 'touchmove').defaultPrevented)
          .withContext('Expected initial touchmove to be prevented.')
          .toBe(true);
        expect(dispatchTouchEvent(document, 'touchmove').defaultPrevented)
          .withContext('Expected subsequent touchmose to be prevented.')
          .toBe(true);

        dispatchTouchEvent(document, 'touchend');
        fixture.detectChanges();
      }));

      it('should not prevent `touchstart` action for native draggable elements', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        dragElement.draggable = true;

        const touchstartEvent = createTouchEvent('touchstart', 50, 50);
        Object.defineProperty(touchstartEvent, 'target', {get: () => dragElement});
        spyOn(touchstartEvent, 'preventDefault').and.callThrough();
        dispatchEvent(dragElement, touchstartEvent);
        fixture.detectChanges();

        dispatchTouchEvent(document, 'touchmove');
        fixture.detectChanges();

        expect(touchstartEvent.preventDefault).not.toHaveBeenCalled();
      }));

      it('should not start dragging an element with a fake touchstart event', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        const event = createTouchEvent('touchstart', 50, 50) as TouchEvent;

        Object.defineProperties(event.touches[0], {
          identifier: {get: () => -1},
          radiusX: {get: () => null},
          radiusY: {get: () => null},
        });

        expect(dragElement.style.transform).toBeFalsy();

        dispatchEvent(dragElement, event);
        fixture.detectChanges();

        dispatchTouchEvent(document, 'touchmove', 20, 100);
        fixture.detectChanges();
        dispatchTouchEvent(document, 'touchmove', 50, 100);
        fixture.detectChanges();

        dispatchTouchEvent(document, 'touchend');
        fixture.detectChanges();

        expect(dragElement.style.transform).toBeFalsy();
      }));
    });

    describe('mouse dragging when initial transform is none', () => {
      it('should drag an element freely to a particular position', fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;
        dragElement.style.transform = 'none';

        dragElementViaMouse(fixture, dragElement, 50, 100);
        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
      }));
    });

    it('should dispatch an event when the user has started dragging', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      startDraggingViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement);

      expect(fixture.componentInstance.startedSpy).toHaveBeenCalled();

      const event = fixture.componentInstance.startedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({source: fixture.componentInstance.dragInstance});
    }));

    it('should dispatch an event when the user has stopped dragging', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 5, 10);

      expect(fixture.componentInstance.endedSpy).toHaveBeenCalled();

      const event = fixture.componentInstance.endedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        source: fixture.componentInstance.dragInstance,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should include the drag distance in the ended event', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 25, 30);
      let event = fixture.componentInstance.endedSpy.calls.mostRecent().args[0];

      expect(event).toEqual({
        source: jasmine.anything(),
        distance: {x: 25, y: 30},
        dropPoint: {x: 25, y: 30},
      });

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 40, 50);
      event = fixture.componentInstance.endedSpy.calls.mostRecent().args[0];

      expect(event).toEqual({
        source: jasmine.anything(),
        distance: {x: 40, y: 50},
        dropPoint: {x: 40, y: 50},
      });
    }));

    it('should emit when the user is moving the drag element', () => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const spy = jasmine.createSpy('move spy');
      const subscription = fixture.componentInstance.dragInstance.moved.subscribe(spy);

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 5, 10);
      expect(spy).toHaveBeenCalledTimes(1);

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 10, 20);
      expect(spy).toHaveBeenCalledTimes(2);

      subscription.unsubscribe();
    });

    it('should not emit events if it was not moved more than the minimum distance', () => {
      const fixture = createComponent(StandaloneDraggable, [], 5);
      fixture.detectChanges();

      const moveSpy = jasmine.createSpy('move spy');
      const subscription = fixture.componentInstance.dragInstance.moved.subscribe(moveSpy);

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 2, 2);

      expect(fixture.componentInstance.startedSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.releasedSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.endedSpy).not.toHaveBeenCalled();
      expect(moveSpy).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should emit to `moved` inside the NgZone', () => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const spy = jasmine.createSpy('move spy');
      const subscription = fixture.componentInstance.dragInstance.moved.subscribe(() =>
        spy(NgZone.isInAngularZone()),
      );

      dragElementViaMouse(fixture, fixture.componentInstance.dragElement.nativeElement, 10, 20);
      expect(spy).toHaveBeenCalledWith(true);

      subscription.unsubscribe();
    });

    it('should complete the `moved` stream on destroy', () => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const spy = jasmine.createSpy('move spy');
      const subscription = fixture.componentInstance.dragInstance.moved.subscribe({complete: spy});

      fixture.destroy();
      expect(spy).toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should be able to lock dragging along the x axis', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      fixture.componentInstance.dragInstance.lockAxis = 'x';

      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();

      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 0px, 0px)');

      dragElementViaMouse(fixture, dragElement, 100, 200);
      expect(dragElement.style.transform).toBe('translate3d(150px, 0px, 0px)');
    }));

    it('should be able to lock dragging along the y axis', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      fixture.componentInstance.dragInstance.lockAxis = 'y';

      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();

      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(0px, 100px, 0px)');

      dragElementViaMouse(fixture, dragElement, 100, 200);
      expect(dragElement.style.transform).toBe('translate3d(0px, 300px, 0px)');
    }));

    it('should add a class while an element is being dragged', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const element = fixture.componentInstance.dragElement.nativeElement;

      expect(element.classList).not.toContain('cdk-drag-dragging');

      startDraggingViaMouse(fixture, element);

      expect(element.classList).toContain('cdk-drag-dragging');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();

      expect(element.classList).not.toContain('cdk-drag-dragging');
    }));

    it('should add a class while an element is being dragged with OnPush change detection', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithOnPush);
      fixture.detectChanges();

      const element = fixture.componentInstance.dragElement.nativeElement;

      expect(element.classList).not.toContain('cdk-drag-dragging');

      startDraggingViaMouse(fixture, element);

      expect(element.classList).toContain('cdk-drag-dragging');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();

      expect(element.classList).not.toContain('cdk-drag-dragging');
    }));

    it('should not add a class if item was not dragged more than the threshold', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable, [], 5);
      fixture.detectChanges();

      const element = fixture.componentInstance.dragElement.nativeElement;

      expect(element.classList).not.toContain('cdk-drag-dragging');

      startDraggingViaMouse(fixture, element);

      expect(element.classList).not.toContain('cdk-drag-dragging');
    }));

    it('should be able to set an alternate drag root element', fakeAsync(() => {
      const fixture = createComponent(DraggableWithAlternateRoot);
      fixture.componentInstance.rootElementSelector = '.alternate-root';
      fixture.detectChanges();

      const dragRoot = fixture.componentInstance.dragRoot.nativeElement;
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragRoot.style.transform).toBeFalsy();
      expect(dragElement.style.transform).toBeFalsy();

      dragElementViaMouse(fixture, dragRoot, 50, 100);

      expect(dragRoot.style.transform).toBe('translate3d(50px, 100px, 0px)');
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should be able to set the cdkDrag element as handle if it has a different root element', fakeAsync(() => {
      const fixture = createComponent(DraggableWithAlternateRootAndSelfHandle);
      fixture.detectChanges();

      const dragRoot = fixture.componentInstance.dragRoot.nativeElement;
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragRoot.style.transform).toBeFalsy();
      expect(dragElement.style.transform).toBeFalsy();

      // Try dragging the root. This should be possible since the drag element is the handle.
      dragElementViaMouse(fixture, dragRoot, 50, 100);

      expect(dragRoot.style.transform).toBeFalsy();
      expect(dragElement.style.transform).toBeFalsy();

      // Drag via the drag element which acts as the handle.
      dragElementViaMouse(fixture, dragElement, 50, 100);

      expect(dragRoot.style.transform).toBe('translate3d(50px, 100px, 0px)');
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should be able to set an alternate drag root element for ng-container', fakeAsync(() => {
      const fixture = createComponent(DraggableNgContainerWithAlternateRoot);
      fixture.detectChanges();

      const dragRoot = fixture.componentInstance.dragRoot.nativeElement;

      expect(dragRoot.style.transform).toBeFalsy();

      dragElementViaMouse(fixture, dragRoot, 50, 100);

      expect(dragRoot.style.transform).toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should preserve the initial transform if the root element changes', fakeAsync(() => {
      const fixture = createComponent(DraggableWithAlternateRoot);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const alternateRoot = fixture.componentInstance.dragRoot.nativeElement;

      dragElement.style.transform = 'translateX(-50%)';
      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toContain('translateX(-50%)');

      alternateRoot.style.transform = 'scale(2)';
      fixture.componentInstance.rootElementSelector = '.alternate-root';
      fixture.detectChanges();

      dragElementViaMouse(fixture, alternateRoot, 50, 100);

      expect(alternateRoot.style.transform).not.toContain('translateX(-50%)');
      expect(alternateRoot.style.transform).toContain('scale(2)');
    }));

    it('should handle the root element selector changing after init', fakeAsync(() => {
      const fixture = createComponent(DraggableWithAlternateRoot);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.rootElementSelector = '.alternate-root';
      fixture.detectChanges();

      const dragRoot = fixture.componentInstance.dragRoot.nativeElement;
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragRoot.style.transform).toBeFalsy();
      expect(dragElement.style.transform).toBeFalsy();

      dragElementViaMouse(fixture, dragRoot, 50, 100);

      expect(dragRoot.style.transform).toBe('translate3d(50px, 100px, 0px)');
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should not be able to drag the element if dragging is disabled', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.classList).not.toContain('cdk-drag-disabled');

      fixture.componentInstance.dragInstance.disabled = true;
      fixture.detectChanges();

      expect(dragElement.classList).toContain('cdk-drag-disabled');
      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should enable native drag interactions if dragging is disabled', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const styles = dragElement.style;

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();

      fixture.componentInstance.dragInstance.disabled = true;
      fixture.detectChanges();

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();
    }));

    it('should enable native drag interactions if not dragging', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const styles = dragElement.style;

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();
    }));

    it('should disable native drag interactions if dragging', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const styles = dragElement.style;

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();

      startDraggingViaMouse(fixture, dragElement);
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBe('none');
    }));

    it('should re-enable drag interactions once dragging is over', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const styles = dragElement.style;

      startDraggingViaMouse(fixture, dragElement);
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBe('none');

      dispatchMouseEvent(document, 'mouseup', 50, 100);
      fixture.detectChanges();

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();
    }));

    it('should not stop propagation for the drag sequence start event by default', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      const event = createMouseEvent('mousedown');
      spyOn(event, 'stopPropagation').and.callThrough();

      dispatchEvent(dragElement, event);
      fixture.detectChanges();

      expect(event.stopPropagation).not.toHaveBeenCalled();
    }));

    it('should not throw if destroyed before the first change detection run', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);

      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    }));

    it('should enable native drag interactions on the drag item when there is a handle', () => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      expect(dragElement.style.touchAction).not.toBe('none');
    });

    it('should disable native drag interactions on the drag handle', () => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const styles = fixture.componentInstance.handleElement.nativeElement.style;
      expect(styles.touchAction || (styles as any).webkitUserDrag).toBe('none');
    });

    it('should enable native drag interactions on the drag handle if dragging is disabled', () => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      fixture.componentInstance.draggingDisabled = true;
      fixture.detectChanges();
      const styles = fixture.componentInstance.handleElement.nativeElement.style;
      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();
    });

    it(
      'should enable native drag interactions on the drag handle if dragging is disabled ' +
        'on init',
      () => {
        const fixture = createComponent(StandaloneDraggableWithHandle);
        fixture.componentInstance.draggingDisabled = true;
        fixture.detectChanges();
        const styles = fixture.componentInstance.handleElement.nativeElement.style;
        expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();
      },
    );

    it('should toggle native drag interactions based on whether the handle is disabled', () => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      fixture.componentInstance.handleInstance.disabled = true;
      fixture.detectChanges();
      const styles = fixture.componentInstance.handleElement.nativeElement.style;
      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();

      fixture.componentInstance.handleInstance.disabled = false;
      fixture.detectChanges();
      expect(styles.touchAction || (styles as any).webkitUserDrag).toBe('none');
    });

    it('should be able to reset a freely-dragged item to its initial position', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

      fixture.componentInstance.dragInstance.reset();
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should preserve initial transform after resetting', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      dragElement.style.transform = 'scale(2)';

      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px) scale(2)');

      fixture.componentInstance.dragInstance.reset();
      expect(dragElement.style.transform).toBe('scale(2)');
    }));

    it('should start dragging an item from its initial position after a reset', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
      fixture.componentInstance.dragInstance.reset();

      dragElementViaMouse(fixture, dragElement, 25, 50);
      expect(dragElement.style.transform).toBe('translate3d(25px, 50px, 0px)');
    }));

    it('should not dispatch multiple events for a mouse event right after a touch event', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      // Dispatch a touch sequence.
      dispatchTouchEvent(dragElement, 'touchstart');
      fixture.detectChanges();
      dispatchTouchEvent(dragElement, 'touchend');
      fixture.detectChanges();
      tick();

      // Immediately dispatch a mouse sequence to simulate a fake event.
      startDraggingViaMouse(fixture, dragElement);
      fixture.detectChanges();
      dispatchMouseEvent(dragElement, 'mouseup');
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.startedSpy).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.endedSpy).toHaveBeenCalledTimes(1);
    }));

    it('should round the transform value', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 13.37, 37);
      expect(dragElement.style.transform).toBe('translate3d(13px, 37px, 0px)');
    }));

    it('should allow for dragging to be constrained to an element', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.boundary = '.wrapper';
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');
    }));

    it('should be able to pass in a DOM node as the boundary', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.boundary = fixture.nativeElement.querySelector('.wrapper');
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');
    }));

    it('should adjust the x offset if the boundary becomes narrower after a viewport resize', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      const boundary: HTMLElement = fixture.nativeElement.querySelector('.wrapper');
      fixture.componentInstance.boundary = boundary;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');

      boundary.style.width = '150px';
      dispatchFakeEvent(window, 'resize');
      tick(20);

      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should keep the old position if the boundary is invisible after a resize', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      const boundary: HTMLElement = fixture.nativeElement.querySelector('.wrapper');
      fixture.componentInstance.boundary = boundary;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');

      boundary.style.display = 'none';
      dispatchFakeEvent(window, 'resize');
      tick(20);

      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');
    }));

    it('should handle the element and boundary dimensions changing between drag sequences', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      const boundary: HTMLElement = fixture.nativeElement.querySelector('.wrapper');
      fixture.componentInstance.boundary = boundary;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');

      // Bump the width and height of both the boundary and the drag element.
      boundary.style.width = boundary.style.height = '300px';
      dragElement.style.width = dragElement.style.height = '150px';

      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(150px, 150px, 0px)');
    }));

    it('should adjust the y offset if the boundary becomes shorter after a viewport resize', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      const boundary: HTMLElement = fixture.nativeElement.querySelector('.wrapper');
      fixture.componentInstance.boundary = boundary;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');

      boundary.style.height = '150px';
      dispatchFakeEvent(window, 'resize');
      tick(20);

      expect(dragElement.style.transform).toBe('translate3d(100px, 50px, 0px)');
    }));

    it(
      'should reset the x offset if the boundary becomes narrower than the element ' +
        'after a resize',
      fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        const boundary: HTMLElement = fixture.nativeElement.querySelector('.wrapper');
        fixture.componentInstance.boundary = boundary;
        fixture.detectChanges();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        dragElementViaMouse(fixture, dragElement, 300, 300);
        expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');

        boundary.style.width = '50px';
        dispatchFakeEvent(window, 'resize');
        tick(20);

        expect(dragElement.style.transform).toBe('translate3d(0px, 100px, 0px)');
      }),
    );

    it('should reset the y offset if the boundary becomes shorter than the element after a resize', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      const boundary: HTMLElement = fixture.nativeElement.querySelector('.wrapper');
      fixture.componentInstance.boundary = boundary;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      dragElementViaMouse(fixture, dragElement, 300, 300);
      expect(dragElement.style.transform).toBe('translate3d(100px, 100px, 0px)');

      boundary.style.height = '50px';
      dispatchFakeEvent(window, 'resize');
      tick(20);

      expect(dragElement.style.transform).toBe('translate3d(100px, 0px, 0px)');
    }));

    it('should allow for the position constrain logic to be customized', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      const spy = jasmine.createSpy('constrain position spy').and.returnValue({
        x: 50,
        y: 50,
      } as Point);

      fixture.componentInstance.constrainPosition = spy;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 300, 300);

      expect(spy).toHaveBeenCalledWith(
        jasmine.objectContaining({x: 300, y: 300}),
        jasmine.any(DragRef),
      );
      expect(dragElement.style.transform).toBe('translate3d(50px, 50px, 0px)');
    }));

    it('should throw if drag item is attached to an ng-container', fakeAsync(() => {
      expect(() => {
        createComponent(DraggableOnNgContainer).detectChanges();
        flush();
      }).toThrowError(/^cdkDrag must be attached to an element node/);
    }));

    it('should cancel drag if the mouse moves before the delay is elapsed', fakeAsync(() => {
      // We can't use Jasmine's `clock` because Zone.js interferes with it.
      spyOn(Date, 'now').and.callFake(() => currentTime);
      let currentTime = 0;

      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.dragStartDelay = 1000;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved by default.')
        .toBeFalsy();

      startDraggingViaMouse(fixture, dragElement);
      currentTime += 750;
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      currentTime += 500;
      fixture.detectChanges();

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved if the mouse moved before the delay.')
        .toBeFalsy();
    }));

    it('should enable native drag interactions if mouse moves before the delay', fakeAsync(() => {
      // We can't use Jasmine's `clock` because Zone.js interferes with it.
      spyOn(Date, 'now').and.callFake(() => currentTime);
      let currentTime = 0;

      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.dragStartDelay = 1000;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const styles = dragElement.style;

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved by default.')
        .toBeFalsy();

      startDraggingViaMouse(fixture, dragElement);
      currentTime += 750;
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      currentTime += 500;
      fixture.detectChanges();

      expect(styles.touchAction || (styles as any).webkitUserDrag).toBeFalsy();
    }));

    it('should allow dragging after the drag start delay is elapsed', fakeAsync(() => {
      // We can't use Jasmine's `clock` because Zone.js interferes with it.
      spyOn(Date, 'now').and.callFake(() => currentTime);
      let currentTime = 0;

      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.dragStartDelay = 500;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved by default.')
        .toBeFalsy();

      dispatchMouseEvent(dragElement, 'mousedown');
      fixture.detectChanges();
      currentTime += 750;

      // The first `mousemove` here starts the sequence and the second one moves the element.
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      expect(dragElement.style.transform)
        .withContext('Expected element to be dragged after all the time has passed.')
        .toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should not prevent the default touch action before the delay has elapsed', fakeAsync(() => {
      spyOn(Date, 'now').and.callFake(() => currentTime);
      let currentTime = 0;

      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.dragStartDelay = 500;
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved by default.')
        .toBeFalsy();

      dispatchTouchEvent(dragElement, 'touchstart');
      fixture.detectChanges();
      currentTime += 250;

      expect(dispatchTouchEvent(document, 'touchmove', 50, 100).defaultPrevented).toBe(false);
    }));

    it('should handle the drag delay as a string', fakeAsync(() => {
      // We can't use Jasmine's `clock` because Zone.js interferes with it.
      spyOn(Date, 'now').and.callFake(() => currentTime);
      let currentTime = 0;

      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.dragStartDelay = '500';
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved by default.')
        .toBeFalsy();

      dispatchMouseEvent(dragElement, 'mousedown');
      fixture.detectChanges();
      currentTime += 750;

      // The first `mousemove` here starts the sequence and the second one moves the element.
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      expect(dragElement.style.transform)
        .withContext('Expected element to be dragged after all the time has passed.')
        .toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should be able to configure the drag start delay based on the event type', fakeAsync(() => {
      // We can't use Jasmine's `clock` because Zone.js interferes with it.
      spyOn(Date, 'now').and.callFake(() => currentTime);
      let currentTime = 0;

      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.dragStartDelay = {touch: 500, mouse: 0};
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved by default.')
        .toBeFalsy();

      dragElementViaTouch(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform)
        .withContext('Expected element not to be moved via touch because it has a delay.')
        .toBeFalsy();

      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform)
        .withContext('Expected element to be moved via mouse because it has no delay.')
        .toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should be able to get the current position', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const dragInstance = fixture.componentInstance.dragInstance;

      expect(dragInstance.getFreeDragPosition()).toEqual({x: 0, y: 0});

      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragInstance.getFreeDragPosition()).toEqual({x: 50, y: 100});

      dragElementViaMouse(fixture, dragElement, 100, 200);
      expect(dragInstance.getFreeDragPosition()).toEqual({x: 150, y: 300});
    }));

    it('should be able to set the current position', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.freeDragPosition = {x: 50, y: 100};
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const dragInstance = fixture.componentInstance.dragInstance;

      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
      expect(dragInstance.getFreeDragPosition()).toEqual({x: 50, y: 100});
    }));

    it('should be able to get the up-to-date position as the user is dragging', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const dragInstance = fixture.componentInstance.dragInstance;

      expect(dragInstance.getFreeDragPosition()).toEqual({x: 0, y: 0});

      startDraggingViaMouse(fixture, dragElement);
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      expect(dragInstance.getFreeDragPosition()).toEqual({x: 50, y: 100});

      dispatchMouseEvent(document, 'mousemove', 100, 200);
      fixture.detectChanges();

      expect(dragInstance.getFreeDragPosition()).toEqual({x: 100, y: 200});
    }));

    it('should react to changes in the free drag position', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.freeDragPosition = {x: 50, y: 100};
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

      fixture.componentInstance.freeDragPosition = {x: 100, y: 200};
      fixture.detectChanges();

      expect(dragElement.style.transform).toBe('translate3d(100px, 200px, 0px)');
    }));

    it('should be able to continue dragging after the current position was set', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.componentInstance.freeDragPosition = {x: 50, y: 100};
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

      dragElementViaMouse(fixture, dragElement, 100, 200);

      expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px)');
    }));

    it('should include the dragged distance as the user is dragging', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const spy = jasmine.createSpy('moved spy');
      const subscription = fixture.componentInstance.dragInstance.moved.subscribe(spy);

      startDraggingViaMouse(fixture, dragElement);

      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      let event = spy.calls.mostRecent().args[0];
      expect(event.distance).toEqual({x: 50, y: 100});

      dispatchMouseEvent(document, 'mousemove', 75, 50);
      fixture.detectChanges();

      event = spy.calls.mostRecent().args[0];
      expect(event.distance).toEqual({x: 75, y: 50});

      subscription.unsubscribe();
    }));

    it('should be able to configure the drag input defaults through a provider', fakeAsync(() => {
      const config: DragDropConfig = {
        draggingDisabled: true,
        dragStartDelay: 1337,
        lockAxis: 'y',
        constrainPosition: () => ({x: 1337, y: 42}),
        previewClass: 'custom-preview-class',
        boundaryElement: '.boundary',
        rootElementSelector: '.root',
        previewContainer: 'parent',
      };

      const fixture = createComponent(PlainStandaloneDraggable, [
        {
          provide: CDK_DRAG_CONFIG,
          useValue: config,
        },
      ]);
      fixture.detectChanges();
      const drag = fixture.componentInstance.dragInstance;
      expect(drag.disabled).toBe(true);
      expect(drag.dragStartDelay).toBe(1337);
      expect(drag.lockAxis).toBe('y');
      expect(drag.constrainPosition).toBe(config.constrainPosition);
      expect(drag.previewClass).toBe('custom-preview-class');
      expect(drag.boundaryElement).toBe('.boundary');
      expect(drag.rootElementSelector).toBe('.root');
      expect(drag.previewContainer).toBe('parent');
    }));

    it('should not throw if touches and changedTouches are empty', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      startDraggingViaTouch(fixture, dragElement);
      continueDraggingViaTouch(fixture, 50, 100);

      const event = createTouchEvent('touchend', 50, 100);
      Object.defineProperties(event, {
        touches: {get: () => []},
        changedTouches: {get: () => []},
      });

      expect(() => {
        dispatchEvent(document, event);
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('should update the free drag position if the page is scrolled', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggable);
      fixture.detectChanges();

      const cleanup = makeScrollable();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      startDraggingViaMouse(fixture, dragElement, 0, 0);
      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

      scrollTo(0, 500);
      dispatchFakeEvent(document, 'scroll');
      fixture.detectChanges();
      expect(dragElement.style.transform).toBe('translate3d(50px, 600px, 0px)');

      cleanup();
    }));

    it(
      'should update the free drag position if the user moves their pointer after the page ' +
        'is scrolled',
      fakeAsync(() => {
        const fixture = createComponent(StandaloneDraggable);
        fixture.detectChanges();

        const cleanup = makeScrollable();
        const dragElement = fixture.componentInstance.dragElement.nativeElement;

        expect(dragElement.style.transform).toBeFalsy();
        startDraggingViaMouse(fixture, dragElement, 0, 0);
        dispatchMouseEvent(document, 'mousemove', 50, 100);
        fixture.detectChanges();

        expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

        scrollTo(0, 500);
        dispatchFakeEvent(document, 'scroll');
        fixture.detectChanges();
        dispatchMouseEvent(document, 'mousemove', 50, 200);
        fixture.detectChanges();

        expect(dragElement.style.transform).toBe('translate3d(50px, 700px, 0px)');

        cleanup();
      }),
    );
  });

  describe('draggable with a handle', () => {
    it('should not be able to drag the entire element if it has a handle', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 50, 100);
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should be able to drag an element using its handle', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handle, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should not be able to drag the element if the handle is disabled', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      fixture.componentInstance.handleInstance.disabled = true;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handle, 50, 100);
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should not be able to drag the element if the handle is disabled before init', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithPreDisabledHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handle, 50, 100);
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should not be able to drag using the handle if the element is disabled', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      fixture.componentInstance.dragInstance.disabled = true;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handle, 50, 100);
      expect(dragElement.style.transform).toBeFalsy();
    }));

    it('should be able to use a handle that was added after init', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithDelayedHandle);

      fixture.detectChanges();
      fixture.componentInstance.showHandle = true;
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handle, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should be able to use more than one handle to drag the element', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithMultipleHandles);
      fixture.detectChanges();

      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handles = fixture.componentInstance.handles.map(handle => handle.element.nativeElement);

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handles[1], 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');

      dragElementViaMouse(fixture, handles[0], 100, 200);
      expect(dragElement.style.transform).toBe('translate3d(150px, 300px, 0px)');
    }));

    it('should be able to drag with a handle that is not a direct descendant', fakeAsync(() => {
      const fixture = createComponent(StandaloneDraggableWithIndirectHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, dragElement, 50, 100);

      expect(dragElement.style.transform)
        .withContext('Expected not to be able to drag the element by itself.')
        .toBeFalsy();

      dragElementViaMouse(fixture, handle, 50, 100);
      expect(dragElement.style.transform)
        .withContext('Expected to drag the element by its handle.')
        .toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should disable the tap highlight while dragging via the handle', fakeAsync(() => {
      // This test is irrelevant if the browser doesn't support styling the tap highlight color.
      if (!('webkitTapHighlightColor' in document.body.style)) {
        return;
      }

      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      expect((dragElement.style as any).webkitTapHighlightColor).toBeFalsy();

      startDraggingViaMouse(fixture, handle);

      expect((dragElement.style as any).webkitTapHighlightColor).toBe('transparent');

      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup', 50, 100);
      fixture.detectChanges();

      expect((dragElement.style as any).webkitTapHighlightColor).toBeFalsy();
    }));

    it('should preserve any existing `webkitTapHighlightColor`', fakeAsync(() => {
      // This test is irrelevant if the browser doesn't support styling the tap highlight color.
      if (!('webkitTapHighlightColor' in document.body.style)) {
        return;
      }

      const fixture = createComponent(StandaloneDraggableWithHandle);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handle = fixture.componentInstance.handleElement.nativeElement;

      (dragElement.style as any).webkitTapHighlightColor = 'purple';

      startDraggingViaMouse(fixture, handle);

      expect((dragElement.style as any).webkitTapHighlightColor).toBe('transparent');

      dispatchMouseEvent(document, 'mousemove', 50, 100);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup', 50, 100);
      fixture.detectChanges();

      expect((dragElement.style as any).webkitTapHighlightColor).toBe('purple');
    }));

    it('should throw if drag handle is attached to an ng-container', fakeAsync(() => {
      expect(() => {
        createComponent(DragHandleOnNgContainer).detectChanges();
        flush();
      }).toThrowError(/^cdkDragHandle must be attached to an element node/);
    }));

    it('should be able to drag an element using a handle with a shadow DOM child', fakeAsync(() => {
      if (!_supportsShadowDom()) {
        return;
      }

      const fixture = createComponent(
        StandaloneDraggableWithShadowInsideHandle,
        undefined,
        undefined,
        [ShadowWrapper],
      );
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.dragElement.nativeElement;
      const handleChild = fixture.componentInstance.handleChild.nativeElement;

      expect(dragElement.style.transform).toBeFalsy();
      dragElementViaMouse(fixture, handleChild, 50, 100);
      expect(dragElement.style.transform).toBe('translate3d(50px, 100px, 0px)');
    }));
  });

  describe('in a drop container', () => {
    it('should be able to attach data to the drop container', () => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      expect(fixture.componentInstance.dropInstance.data).toBe(fixture.componentInstance.items);
    });

    it('should register an item with the drop container', () => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const list = fixture.componentInstance.dropInstance;

      spyOn(list, 'addItem').and.callThrough();

      fixture.componentInstance.items.push({value: 'Extra', margin: 0, height: ITEM_HEIGHT});
      fixture.detectChanges();

      expect(list.addItem).toHaveBeenCalledTimes(1);
    });

    it('should remove an item from the drop container', () => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const list = fixture.componentInstance.dropInstance;

      spyOn(list, 'removeItem').and.callThrough();

      fixture.componentInstance.items.pop();
      fixture.detectChanges();

      expect(list.removeItem).toHaveBeenCalledTimes(1);
    });

    it('should return the items sorted by their position in the DOM', () => {
      const fixture = createComponent(DraggableInDropZone);
      const items = fixture.componentInstance.items;
      fixture.detectChanges();

      // Insert a couple of items in the start and the middle so the list gets shifted around.
      items.unshift({value: 'Extra 0', margin: 0, height: ITEM_HEIGHT});
      items.splice(3, 0, {value: 'Extra 1', margin: 0, height: ITEM_HEIGHT});
      fixture.detectChanges();

      expect(
        fixture.componentInstance.dropInstance.getSortedItems().map(item => {
          return item.element.nativeElement.textContent!.trim();
        }),
      ).toEqual(['Extra 0', 'Zero', 'One', 'Extra 1', 'Two', 'Three']);
    });

    it('should sync the drop list inputs with the drop list ref', () => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const dropInstance = fixture.componentInstance.dropInstance;
      const dropListRef = dropInstance._dropListRef;

      expect(dropListRef.lockAxis).toBeFalsy();
      expect(dropListRef.disabled).toBe(false);

      dropInstance.lockAxis = 'x';
      dropInstance.disabled = true;

      dropListRef.beforeStarted.next();

      expect(dropListRef.lockAxis).toBe('x');
      expect(dropListRef.disabled).toBe(true);
    });

    it('should be able to attach data to a drag item', () => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      expect(fixture.componentInstance.dragItems.first.data).toBe(
        fixture.componentInstance.items[0],
      );
    });

    it('should be able to overwrite the drop zone id', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);

      fixture.componentInstance.dropZoneId = 'custom-id';
      fixture.detectChanges();

      const drop = fixture.componentInstance.dropInstance;

      expect(drop.id).toBe('custom-id');
      expect(drop.element.nativeElement.getAttribute('id')).toBe('custom-id');
    }));

    it('should toggle a class when the user starts dragging an item', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const dropZone = fixture.componentInstance.dropInstance;

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-list-dragging');

      startDraggingViaMouse(fixture, item);

      expect(dropZone.element.nativeElement.classList).toContain('cdk-drop-list-dragging');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-dragging');
    }));

    it('should toggle the drop dragging classes if there is nothing to trigger change detection', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithoutEvents);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const dropZone = fixture.componentInstance.dropInstance;

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-list-dragging');
      expect(item.classList).not.toContain('cdk-drag-dragging');

      startDraggingViaMouse(fixture, item);

      expect(dropZone.element.nativeElement.classList).toContain('cdk-drop-list-dragging');
      expect(item.classList).toContain('cdk-drag-dragging');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-dragging');
      expect(item.classList).not.toContain('cdk-drag-dragging');
    }));

    it('should toggle a class when the user starts dragging an item with OnPush change detection', fakeAsync(() => {
      const fixture = createComponent(DraggableInOnPushDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const dropZone = fixture.componentInstance.dropInstance;

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-list-dragging');

      startDraggingViaMouse(fixture, item);

      expect(dropZone.element.nativeElement.classList).toContain('cdk-drop-list-dragging');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-dragging');
    }));

    it('should not toggle dragging class if the element was not dragged more than the threshold', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone, [], 5);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const dropZone = fixture.componentInstance.dropInstance;

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-dragging');

      startDraggingViaMouse(fixture, item);

      expect(dropZone.element.nativeElement.classList).not.toContain('cdk-drop-dragging');
    }));

    it('should dispatch the `dropped` event when an item has been dropped', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.left + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 2,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'One',
        'Two',
        'Zero',
        'Three',
      ]);
    }));

    it('should expose whether an item was dropped over a container', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.left + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event: CdkDragDrop<any> =
        fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event.isPointerOverContainer).toBe(true);
    }));

    it('should expose the drag distance when an item is dropped', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;

      dragElementViaMouse(fixture, firstItem.element.nativeElement, 50, 60);
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event: CdkDragDrop<any> =
        fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event.distance).toEqual({x: 50, y: 60});
      expect(event.dropPoint).toEqual({x: 50, y: 60});
    }));

    it('should expose whether an item was dropped outside of a container', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const containerRect =
        fixture.componentInstance.dropInstance.element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        containerRect.right + 10,
        containerRect.bottom + 10,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event: CdkDragDrop<any> =
        fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event.isPointerOverContainer).toBe(false);
    }));

    it('should dispatch the `sorted` event as an item is being sorted', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(item => item.element.nativeElement);
      const draggedItem = items[0];
      const {top, left} = draggedItem.getBoundingClientRect();

      startDraggingViaMouse(fixture, draggedItem, left, top);

      // Drag over each item one-by-one going downwards.
      for (let i = 1; i < items.length; i++) {
        const elementRect = items[i].getBoundingClientRect();

        dispatchMouseEvent(document, 'mousemove', elementRect.left, elementRect.top + 5);
        fixture.detectChanges();

        expect(fixture.componentInstance.sortedSpy.calls.mostRecent().args[0]).toEqual({
          previousIndex: i - 1,
          currentIndex: i,
          item: fixture.componentInstance.dragItems.first,
          container: fixture.componentInstance.dropInstance,
        });
      }

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it(
      'should not dispatch the `sorted` event when an item is dragged inside ' +
        'a single-item list',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInDropZone);
        fixture.componentInstance.items = [fixture.componentInstance.items[0]];
        fixture.detectChanges();

        const draggedItem = fixture.componentInstance.dragItems.first.element.nativeElement;
        const {top, left} = draggedItem.getBoundingClientRect();

        startDraggingViaMouse(fixture, draggedItem, left, top);

        for (let i = 0; i < 5; i++) {
          dispatchMouseEvent(document, 'mousemove', left, top + 1);
          fixture.detectChanges();

          expect(fixture.componentInstance.sortedSpy).not.toHaveBeenCalled();
        }

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        flush();
      }),
    );

    it('should not move items in a vertical list if the pointer is too far away', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      // Move the cursor all the way to the right so it doesn't intersect along the x axis.
      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.right + 1000,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 0,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: false,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);
    }));

    it('should not move the original element from its initial DOM position', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      let dragElements = Array.from(root.querySelectorAll('.cdk-drag'));

      expect(dragElements.map(el => el.textContent)).toEqual(['Zero', 'One', 'Two', 'Three']);

      // Stub out the original call so the list doesn't get re-rendered.
      // We're testing the DOM order explicitly.
      fixture.componentInstance.droppedSpy.and.callFake(() => {});

      const thirdItemRect = dragElements[2].getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        fixture.componentInstance.dragItems.first.element.nativeElement,
        thirdItemRect.left + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      dragElements = Array.from(root.querySelectorAll('.cdk-drag'));
      expect(dragElements.map(el => el.textContent)).toEqual(['Zero', 'One', 'Two', 'Three']);
    }));

    it('should dispatch the `dropped` event in a horizontal drop zone', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.left + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 2,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'One',
        'Two',
        'Zero',
        'Three',
      ]);
    }));

    it('should dispatch the correct `dropped` event in RTL horizontal drop zone', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone, [
        {
          provide: Directionality,
          useValue: {value: 'rtl', change: observableOf()},
        },
      ]);

      fixture.nativeElement.setAttribute('dir', 'rtl');
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.right - 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 2,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'One',
        'Two',
        'Zero',
        'Three',
      ]);
    }));

    it('should not move items in a horizontal list if pointer is too far away', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      // Move the cursor all the way to the bottom so it doesn't intersect along the y axis.
      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.left + 1,
        thirdItemRect.bottom + 1000,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 0,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: false,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);
    }));

    it('should calculate the index if the list is scrolled while dragging', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();
      const list = fixture.componentInstance.dropInstance.element.nativeElement;

      startDraggingViaMouse(fixture, firstItem.element.nativeElement);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();

      list.scrollTop = ITEM_HEIGHT * 10;
      dispatchFakeEvent(list, 'scroll');
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 12,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: jasmine.any(Boolean),
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should calculate the index if the list is scrolled while dragging inside the shadow DOM', fakeAsync(() => {
      // This test is only relevant for Shadow DOM-supporting browsers.
      if (!_supportsShadowDom()) {
        return;
      }

      const fixture = createComponent(
        DraggableInScrollableVerticalDropZone,
        [],
        undefined,
        [],
        ViewEncapsulation.ShadowDom,
      );
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();
      const list = fixture.componentInstance.dropInstance.element.nativeElement;

      startDraggingViaMouse(fixture, firstItem.element.nativeElement);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();

      list.scrollTop = ITEM_HEIGHT * 10;
      dispatchFakeEvent(list, 'scroll');
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 12,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: jasmine.any(Boolean),
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should calculate the index if the viewport is scrolled while dragging', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);

      for (let i = 0; i < 200; i++) {
        fixture.componentInstance.items.push({
          value: `Extra item ${i}`,
          height: ITEM_HEIGHT,
          margin: 0,
        });
      }

      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, firstItem.element.nativeElement);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();

      scrollTo(0, ITEM_HEIGHT * 10);
      dispatchFakeEvent(document, 'scroll');
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 12,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: jasmine.any(Boolean),
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      scrollTo(0, 0);
    }));

    it('should create a preview element while the item is dragged', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const itemRect = item.getBoundingClientRect();
      const initialParent = item.parentNode;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      const previewRect = preview.getBoundingClientRect();
      const zeroPxRegex = /^0(px)?$/;

      expect(item.parentNode)
        .withContext('Expected element to be moved out into the body')
        .toBe(document.body);
      expect(item.style.position)
        .withContext('Expected element to be removed from layout')
        .toBe('fixed');
      expect(item.style.getPropertyPriority('position'))
        .withContext('Expect element position to be !important')
        .toBe('important');
      // Use a regex here since some browsers normalize 0 to 0px, but others don't.
      // Use a regex here since some browsers normalize 0 to 0px, but others don't.
      expect(item.style.top)
        .withContext('Expected element to be removed from layout')
        .toMatch(zeroPxRegex);
      expect(item.style.left)
        .withContext('Expected element to be removed from layout')
        .toBe('-999em');
      expect(item.style.opacity).withContext('Expected element to be invisible').toBe('0');
      expect(preview).withContext('Expected preview to be in the DOM').toBeTruthy();
      expect(preview.textContent!.trim())
        .withContext('Expected preview content to match element')
        .toContain('One');
      expect(preview.getAttribute('dir'))
        .withContext('Expected preview element to inherit the directionality.')
        .toBe('ltr');
      expect(previewRect.width)
        .withContext('Expected preview width to match element')
        .toBe(itemRect.width);
      expect(previewRect.height)
        .withContext('Expected preview height to match element')
        .toBe(itemRect.height);
      expect(preview.style.pointerEvents)
        .withContext('Expected pointer events to be disabled on the preview')
        .toBe('none');
      expect(preview.style.zIndex)
        .withContext('Expected preview to have a high default zIndex.')
        .toBe('1000');
      // Use a regex here since some browsers normalize 0 to 0px, but others don't.
      // Use a regex here since some browsers normalize 0 to 0px, but others don't.
      expect(preview.style.margin)
        .withContext('Expected the preview margin to be reset.')
        .toMatch(zeroPxRegex);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();

      expect(item.parentNode)
        .withContext('Expected element to be moved back into its old parent')
        .toBe(initialParent);
      expect(item.style.position)
        .withContext('Expected element to be within the layout')
        .toBeFalsy();
      expect(item.style.top).withContext('Expected element to be within the layout').toBeFalsy();
      expect(item.style.left).withContext('Expected element to be within the layout').toBeFalsy();
      expect(item.style.opacity).withContext('Expected element to be visible').toBeFalsy();
      expect(preview.parentNode)
        .withContext('Expected preview to be removed from the DOM')
        .toBeFalsy();
    }));

    it('should be able to configure the preview z-index', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone, [
        {
          provide: CDK_DRAG_CONFIG,
          useValue: {
            dragStartThreshold: 0,
            zIndex: 3000,
          },
        },
      ]);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.style.zIndex).toBe('3000');
    }));

    it('should create the preview inside the fullscreen element when in fullscreen mode', fakeAsync(() => {
      // Provide a limited stub of the document since we can't trigger fullscreen
      // mode in unit tests and there are some issues with doing it in e2e tests.
      const fakeDocument = {
        body: document.body,
        documentElement: document.documentElement,
        fullscreenElement: document.createElement('div'),
        ELEMENT_NODE: Node.ELEMENT_NODE,
        querySelectorAll: function (...args: [string]) {
          return document.querySelectorAll(...args);
        },
        addEventListener: function (
          ...args: [
            string,
            EventListenerOrEventListenerObject,
            (boolean | AddEventListenerOptions | undefined)?,
          ]
        ) {
          document.addEventListener(...args);
        },
        removeEventListener: function (
          ...args: [
            string,
            EventListenerOrEventListenerObject,
            (boolean | AddEventListenerOptions | undefined)?,
          ]
        ) {
          document.addEventListener(...args);
        },
        createComment: (text: string) => document.createComment(text),
      };
      const fixture = createComponent(DraggableInDropZone, [
        {
          provide: DOCUMENT,
          useFactory: () => fakeDocument,
        },
      ]);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      document.body.appendChild(fakeDocument.fullscreenElement);
      startDraggingViaMouse(fixture, item);
      flush();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.parentNode).toBe(fakeDocument.fullscreenElement);
      fakeDocument.fullscreenElement.remove();
    }));

    it('should be able to constrain the preview position', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.componentInstance.boundarySelector = '.cdk-drop-list';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const listRect =
        fixture.componentInstance.dropInstance.element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      startDraggingViaMouse(fixture, item, listRect.right + 50, listRect.bottom + 50);
      flush();
      dispatchMouseEvent(document, 'mousemove', listRect.right + 50, listRect.bottom + 50);
      fixture.detectChanges();

      const previewRect = preview.getBoundingClientRect();

      expect(Math.floor(previewRect.bottom)).toBe(Math.floor(listRect.bottom));
      expect(Math.floor(previewRect.right)).toBe(Math.floor(listRect.right));
    }));

    it('should update the boundary if the page is scrolled while dragging', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.componentInstance.boundarySelector = '.cdk-drop-list';
      fixture.detectChanges();

      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const cleanup = makeScrollable();
      scrollTo(0, 10);
      let listRect = list.getBoundingClientRect(); // Note that we need to measure after scrolling.

      startDraggingViaMouse(fixture, item);
      startDraggingViaMouse(fixture, item, listRect.right, listRect.bottom);
      flush();
      dispatchMouseEvent(document, 'mousemove', listRect.right, listRect.bottom);
      fixture.detectChanges();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      let previewRect = preview.getBoundingClientRect();
      expect(Math.floor(previewRect.bottom)).toBe(Math.floor(listRect.bottom));

      scrollTo(0, 0);
      dispatchFakeEvent(document, 'scroll');
      fixture.detectChanges();
      listRect = list.getBoundingClientRect(); // We need to update these since we've scrolled.
      dispatchMouseEvent(document, 'mousemove', listRect.right, listRect.bottom);
      fixture.detectChanges();
      previewRect = preview.getBoundingClientRect();

      expect(Math.floor(previewRect.bottom)).toBe(Math.floor(listRect.bottom));
      cleanup();
    }));

    it('should update the boundary if a parent is scrolled while dragging', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableParentContainer);
      fixture.componentInstance.boundarySelector = '.cdk-drop-list';
      fixture.detectChanges();

      const container: HTMLElement = fixture.nativeElement.querySelector('.scroll-container');
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const cleanup = makeScrollable('vertical', container);
      container.scrollTop = 10;
      let listRect = list.getBoundingClientRect(); // Note that we need to measure after scrolling.

      startDraggingViaMouse(fixture, item);
      startDraggingViaMouse(fixture, item, listRect.right, listRect.bottom);
      flush();
      dispatchMouseEvent(document, 'mousemove', listRect.right, listRect.bottom);
      fixture.detectChanges();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      let previewRect = preview.getBoundingClientRect();

      // Different browsers round the scroll position differently so
      // assert that the offsets are within a pixel of each other.
      expect(Math.abs(previewRect.bottom - listRect.bottom)).toBeLessThan(2);

      container.scrollTop = 0;
      dispatchFakeEvent(container, 'scroll');
      fixture.detectChanges();
      listRect = list.getBoundingClientRect(); // We need to update these since we've scrolled.
      dispatchMouseEvent(document, 'mousemove', listRect.right, listRect.bottom);
      fixture.detectChanges();
      previewRect = preview.getBoundingClientRect();

      expect(Math.abs(previewRect.bottom - listRect.bottom)).toBeLessThan(2);
      cleanup();
    }));

    it('should update the boundary if a parent is scrolled while dragging inside the shadow DOM', fakeAsync(() => {
      // This test is only relevant for Shadow DOM-supporting browsers.
      if (!_supportsShadowDom()) {
        return;
      }

      const fixture = createComponent(
        DraggableInScrollableParentContainer,
        [],
        undefined,
        [],
        ViewEncapsulation.ShadowDom,
      );
      fixture.componentInstance.boundarySelector = '.cdk-drop-list';
      fixture.detectChanges();

      const container: HTMLElement =
        fixture.nativeElement.shadowRoot.querySelector('.scroll-container');
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const cleanup = makeScrollable('vertical', container);
      container.scrollTop = 10;

      // Note that we need to measure after scrolling.
      let listRect = list.getBoundingClientRect();

      startDraggingViaMouse(fixture, item);
      startDraggingViaMouse(fixture, item, listRect.right, listRect.bottom);
      flush();
      dispatchMouseEvent(document, 'mousemove', listRect.right, listRect.bottom);
      fixture.detectChanges();

      const preview = fixture.nativeElement.shadowRoot.querySelector(
        '.cdk-drag-preview',
      )! as HTMLElement;
      let previewRect = preview.getBoundingClientRect();

      // Different browsers round the scroll position differently so
      // assert that the offsets are within a pixel of each other.
      expect(Math.abs(previewRect.bottom - listRect.bottom)).toBeLessThan(2);

      container.scrollTop = 0;
      dispatchFakeEvent(container, 'scroll');
      fixture.detectChanges();
      listRect = list.getBoundingClientRect(); // We need to update these since we've scrolled.
      dispatchMouseEvent(document, 'mousemove', listRect.right, listRect.bottom);
      fixture.detectChanges();
      previewRect = preview.getBoundingClientRect();

      expect(Math.abs(previewRect.bottom - listRect.bottom)).toBeLessThan(2);
      cleanup();
    }));

    it('should clear the id from the preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      item.id = 'custom-id';

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.getAttribute('id')).toBeFalsy();
    }));

    it('should clone the content of descendant canvas elements', fakeAsync(() => {
      const fixture = createComponent(DraggableWithCanvasInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const sourceCanvas = item.querySelector('canvas') as HTMLCanvasElement;

      // via https://stackoverflow.com/a/17386803/2204158
      // via https://stackoverflow.com/a/17386803/2204158
      expect(
        sourceCanvas
          .getContext('2d')!
          .getImageData(0, 0, sourceCanvas.width, sourceCanvas.height)
          .data.some(channel => channel !== 0),
      )
        .withContext('Expected source canvas to have data.')
        .toBe(true);

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      const previewCanvas = preview.querySelector('canvas')!;

      expect(previewCanvas.toDataURL())
        .withContext('Expected cloned canvas to have the same content as the source.')
        .toBe(sourceCanvas.toDataURL());
    }));

    it('should not throw when cloning an invalid canvas', fakeAsync(() => {
      const fixture = createComponent(DraggableWithInvalidCanvasInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      expect(() => {
        startDraggingViaMouse(fixture, item);
        tick();
      }).not.toThrow();

      expect(document.querySelector('.cdk-drag-preview canvas')).toBeTruthy();
    }));

    it('should clone the content of descendant input elements', fakeAsync(() => {
      const fixture = createComponent(DraggableWithInputsInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const sourceInput = item.querySelector('input')!;
      const sourceTextarea = item.querySelector('textarea')!;
      const sourceSelect = item.querySelector('select')!;
      const value = fixture.componentInstance.inputValue;

      expect(sourceInput.value).toBe(value);
      expect(sourceTextarea.value).toBe(value);
      expect(sourceSelect.value).toBe(value);

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')!;
      const previewInput = preview.querySelector('input')!;
      const previewTextarea = preview.querySelector('textarea')!;
      const previewSelect = preview.querySelector('select')!;

      expect(previewInput.value).toBe(value);
      expect(previewTextarea.value).toBe(value);
      expect(previewSelect.value).toBe(value);
    }));

    it('should preserve checked state for radio inputs in the content', fakeAsync(() => {
      const fixture = createComponent(DraggableWithRadioInputsInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[2].element.nativeElement;
      const sourceRadioInput = item.querySelector<HTMLInputElement>('input[type="radio"]')!;

      expect(sourceRadioInput.checked).toBeTruthy();

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')!;
      const previewRadioInput = preview.querySelector<HTMLInputElement>('input[type="radio"]')!;
      expect(previewRadioInput.checked).toBeTruthy(
        'Expected cloned radio input in preview has the same state as original radio input',
      );

      const placeholder = document.querySelector('.cdk-drag-placeholder')!;
      const placeholderRadioInput =
        placeholder.querySelector<HTMLInputElement>('input[type="radio"]')!;
      expect(placeholderRadioInput.checked).toBeTruthy(
        'Expected cloned radio input in placeholder has the same state as original radio input',
      );

      dispatchMouseEvent(document, 'mouseup');
      // Important to tick with 0 since we don't want to flush any pending timeouts.
      // It also makes sure that all clones have been removed from the DOM.
      tick(0);

      expect(sourceRadioInput.checked)
        .withContext('Expected original radio input has preserved its original checked state')
        .toBeTruthy();
    }));

    it('should clear the ids from descendants of the preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const extraChild = document.createElement('div');
      extraChild.id = 'child-id';
      extraChild.classList.add('preview-child');
      item.appendChild(extraChild);

      startDraggingViaMouse(fixture, item);

      expect(document.querySelectorAll('.preview-child').length).toBeGreaterThan(1);
      expect(document.querySelectorAll('[id="child-id"]').length).toBe(1);
    }));

    it('should not create a preview if the element was not dragged far enough', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone, [], 5);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      expect(document.querySelector('.cdk-drag-preview')).toBeFalsy();
    }));

    it('should pass the proper direction to the preview in rtl', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone, [
        {
          provide: Directionality,
          useValue: {value: 'rtl', change: observableOf()},
        },
      ]);

      fixture.detectChanges();

      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      startDraggingViaMouse(fixture, item);

      expect(document.querySelector('.cdk-drag-preview')!.getAttribute('dir'))
        .withContext('Expected preview element to inherit the directionality.')
        .toBe('rtl');
    }));

    it('should remove the preview if its `transitionend` event timed out', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      // Add a duration since the tests won't include one.
      preview.style.transitionDuration = '500ms';

      // Move somewhere so the draggable doesn't exit immediately.
      dispatchMouseEvent(document, 'mousemove', 50, 50);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      tick(250);

      expect(preview.parentNode)
        .withContext('Expected preview to be in the DOM mid-way through the transition')
        .toBeTruthy();

      tick(500);

      expect(preview.parentNode)
        .withContext('Expected preview to be removed from the DOM if the transition timed out')
        .toBeFalsy();
    }));

    it('should be able to set a single class on a preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.componentInstance.previewClass = 'custom-class';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.classList).toContain('custom-class');
    }));

    it('should be able to set multiple classes on a preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.componentInstance.previewClass = ['custom-class-1', 'custom-class-2'];
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.classList).toContain('custom-class-1');
      expect(preview.classList).toContain('custom-class-2');
    }));

    it('should emit the released event as soon as the item is released', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1];
      const endedSpy = jasmine.createSpy('ended spy');
      const releasedSpy = jasmine.createSpy('released spy');
      const endedSubscription = item.ended.subscribe(endedSpy);
      const releasedSubscription = item.released.subscribe(releasedSpy);

      startDraggingViaMouse(fixture, item.element.nativeElement);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      // Add a duration since the tests won't include one.
      preview.style.transitionDuration = '500ms';

      // Move somewhere so the draggable doesn't exit immediately.
      dispatchMouseEvent(document, 'mousemove', 50, 50);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();

      // Expected the released event to fire immediately upon release.
      expect(releasedSpy).toHaveBeenCalled();
      tick(1000);

      // Expected the ended event to fire once the entire sequence is done.
      expect(endedSpy).toHaveBeenCalled();

      endedSubscription.unsubscribe();
      releasedSubscription.unsubscribe();
    }));

    it('should reset immediately when failed drag happens after a successful one', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const itemInstance = fixture.componentInstance.dragItems.toArray()[1];
      const item = itemInstance.element.nativeElement;
      const spy = jasmine.createSpy('dropped spy');
      const subscription = itemInstance.dropped.subscribe(spy);

      // Do an initial drag and drop sequence.
      dragElementViaMouse(fixture, item, 50, 50);
      tick(0); // Important to tick with 0 since we don't want to flush any pending timeouts.

      expect(spy).toHaveBeenCalledTimes(1);

      // Start another drag.
      startDraggingViaMouse(fixture, item);

      // Add a duration since the tests won't include one.
      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      preview.style.transitionDuration = '500ms';

      // Dispatch the mouseup immediately to simulate the user not moving the element.
      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      tick(0); // Important to tick with 0 since we don't want to flush any pending timeouts.

      expect(spy).toHaveBeenCalledTimes(2);

      subscription.unsubscribe();
    }));

    it('should not wait for transition that are not on the `transform` property', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      preview.style.transition = 'opacity 500ms ease';

      dispatchMouseEvent(document, 'mousemove', 50, 50);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      tick(0);

      expect(preview.parentNode)
        .withContext('Expected preview to be removed from the DOM immediately')
        .toBeFalsy();
    }));

    it('should pick out the `transform` duration if multiple properties are being transitioned', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      preview.style.transition = 'opacity 500ms ease, transform 1000ms ease';

      dispatchMouseEvent(document, 'mousemove', 50, 50);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      tick(500);

      expect(preview.parentNode)
        .withContext('Expected preview to be in the DOM at the end of the opacity transition')
        .toBeTruthy();

      tick(1000);

      expect(preview.parentNode)
        .withContext(
          'Expected preview to be removed from the DOM at the end of the ' + 'transform transition',
        )
        .toBeFalsy();
    }));

    it('should create a placeholder element while the item is dragged', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const initialParent = item.parentNode;

      startDraggingViaMouse(fixture, item);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(placeholder).withContext('Expected placeholder to be in the DOM').toBeTruthy();
      expect(placeholder.parentNode)
        .withContext('Expected placeholder to be inserted into the same parent')
        .toBe(initialParent);
      expect(placeholder.textContent!.trim())
        .withContext('Expected placeholder content to match element')
        .toContain('One');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();

      expect(placeholder.parentNode)
        .withContext('Expected placeholder to be removed from the DOM')
        .toBeFalsy();
    }));

    it('should insert the preview into the `body` if previewContainer is set to `global`', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.componentInstance.previewContainer = 'global';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);
      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.parentNode).toBe(document.body);
    }));

    it('should insert the preview into the parent node if previewContainer is set to `parent`', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.componentInstance.previewContainer = 'parent';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const list = fixture.nativeElement.querySelector('.drop-list');

      startDraggingViaMouse(fixture, item);
      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(list).toBeTruthy();
      expect(preview.parentNode).toBe(list);
    }));

    it('should insert the preview into a particular element, if specified', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const previewContainer = fixture.componentInstance.alternatePreviewContainer;

      expect(previewContainer).toBeTruthy();
      fixture.componentInstance.previewContainer = previewContainer;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, item);
      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.parentNode).toBe(previewContainer.nativeElement);
    }));

    it('should remove the id from the placeholder', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      item.id = 'custom-id';

      startDraggingViaMouse(fixture, item);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(placeholder.getAttribute('id')).toBeFalsy();
    }));

    it('should clear the ids from descendants of the placeholder', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const extraChild = document.createElement('div');
      extraChild.id = 'child-id';
      extraChild.classList.add('placeholder-child');
      item.appendChild(extraChild);

      startDraggingViaMouse(fixture, item);

      expect(document.querySelectorAll('.placeholder-child').length).toBeGreaterThan(1);
      expect(document.querySelectorAll('[id="child-id"]').length).toBe(1);
    }));

    it('should not create placeholder if the element was not dragged far enough', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone, [], 5);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      expect(document.querySelector('.cdk-drag-placeholder')).toBeFalsy();
    }));

    it('should move the placeholder as an item is being sorted down', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      assertDownwardSorting(
        fixture,
        fixture.componentInstance.dragItems.map(item => {
          return item.element.nativeElement;
        }),
      );
    }));

    it('should move the placeholder as an item is being sorted down on a scrolled page', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const cleanup = makeScrollable();

      scrollTo(0, 500);
      assertDownwardSorting(
        fixture,
        fixture.componentInstance.dragItems.map(item => {
          return item.element.nativeElement;
        }),
      );
      cleanup();
    }));

    it('should move the placeholder as an item is being sorted up', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      assertUpwardSorting(
        fixture,
        fixture.componentInstance.dragItems.map(item => {
          return item.element.nativeElement;
        }),
      );
    }));

    it('should move the placeholder as an item is being sorted up on a scrolled page', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const cleanup = makeScrollable();

      scrollTo(0, 500);
      assertUpwardSorting(
        fixture,
        fixture.componentInstance.dragItems.map(item => {
          return item.element.nativeElement;
        }),
      );
      cleanup();
    }));

    it('should move the placeholder as an item is being sorted to the right', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.toArray();
      const draggedItem = items[0].element.nativeElement;
      const {top, left} = draggedItem.getBoundingClientRect();

      startDraggingViaMouse(fixture, draggedItem, left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      // Drag over each item one-by-one going to the right.
      for (let i = 0; i < items.length; i++) {
        const elementRect = items[i].element.nativeElement.getBoundingClientRect();

        // Add a few pixels to the left offset so we get some overlap.
        dispatchMouseEvent(document, 'mousemove', elementRect.left + 5, elementRect.top);
        fixture.detectChanges();
        expect(getElementIndexByPosition(placeholder, 'left')).toBe(i);
      }

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should move the placeholder as an item is being sorted to the left', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.toArray();
      const draggedItem = items[items.length - 1].element.nativeElement;
      const {top, left} = draggedItem.getBoundingClientRect();

      startDraggingViaMouse(fixture, draggedItem, left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      // Drag over each item one-by-one going to the left.
      for (let i = items.length - 1; i > -1; i--) {
        const elementRect = items[i].element.nativeElement.getBoundingClientRect();

        // Remove a few pixels from the right offset so we get some overlap.
        dispatchMouseEvent(document, 'mousemove', elementRect.right - 5, elementRect.top);
        fixture.detectChanges();
        expect(getElementIndexByPosition(placeholder, 'left')).toBe(i);
      }

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it(
      'should lay out the elements correctly, if an element skips multiple positions when ' +
        'sorting vertically',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInDropZone);
        fixture.detectChanges();

        const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
        const draggedItem = items[0];
        const {top, left} = draggedItem.getBoundingClientRect();

        startDraggingViaMouse(fixture, draggedItem, left, top);

        const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
        const targetRect = items[items.length - 1].getBoundingClientRect();

        // Add a few pixels to the top offset so we get some overlap.
        dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.top + 5);
        fixture.detectChanges();

        expect(
          getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()),
        ).toEqual(['One', 'Two', 'Three', 'Zero']);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        flush();
      }),
    );

    it('should lay out the elements correctly, when swapping down with a taller element', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const {top, left} = items[0].getBoundingClientRect();

      fixture.componentInstance.items[0].height = ITEM_HEIGHT * 2;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, items[0], left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
      const target = items[1];
      const targetRect = target.getBoundingClientRect();

      // Add a few pixels to the top offset so we get some overlap.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.top + 5);
      fixture.detectChanges();

      expect(placeholder.style.transform).toBe(`translate3d(0px, ${ITEM_HEIGHT}px, 0px)`);
      expect(target.style.transform).toBe(`translate3d(0px, ${-ITEM_HEIGHT * 2}px, 0px)`);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should lay out the elements correctly, when swapping up with a taller element', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const {top, left} = items[1].getBoundingClientRect();

      fixture.componentInstance.items[1].height = ITEM_HEIGHT * 2;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, items[1], left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
      const target = items[0];
      const targetRect = target.getBoundingClientRect();

      // Add a few pixels to the top offset so we get some overlap.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.bottom - 5);
      fixture.detectChanges();

      expect(placeholder.style.transform).toBe(`translate3d(0px, ${-ITEM_HEIGHT}px, 0px)`);
      expect(target.style.transform).toBe(`translate3d(0px, ${ITEM_HEIGHT * 2}px, 0px)`);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should lay out elements correctly, when swapping an item with margin', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const {top, left} = items[0].getBoundingClientRect();

      fixture.componentInstance.items[0].margin = 12;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, items[0], left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
      const target = items[1];
      const targetRect = target.getBoundingClientRect();

      // Add a few pixels to the top offset so we get some overlap.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.top + 5);
      fixture.detectChanges();

      expect(placeholder.style.transform).toBe(`translate3d(0px, ${ITEM_HEIGHT + 12}px, 0px)`);
      expect(target.style.transform).toBe(`translate3d(0px, ${-ITEM_HEIGHT - 12}px, 0px)`);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it(
      'should lay out the elements correctly, if an element skips multiple positions when ' +
        'sorting horizontally',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInHorizontalDropZone);
        fixture.detectChanges();

        const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
        const draggedItem = items[0];
        const {top, left} = draggedItem.getBoundingClientRect();

        startDraggingViaMouse(fixture, draggedItem, left, top);

        const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
        const targetRect = items[items.length - 1].getBoundingClientRect();

        // Add a few pixels to the left offset so we get some overlap.
        dispatchMouseEvent(document, 'mousemove', targetRect.right - 5, targetRect.top);
        fixture.detectChanges();

        expect(
          getElementSibligsByPosition(placeholder, 'left').map(e => e.textContent!.trim()),
        ).toEqual(['One', 'Two', 'Three', 'Zero']);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        flush();
      }),
    );

    it('should lay out the elements correctly, when swapping to the right with a wider element', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);

      fixture.componentInstance.items[0].width = ITEM_WIDTH * 2;
      fixture.detectChanges();

      const {top, left} = items[0].getBoundingClientRect();
      startDraggingViaMouse(fixture, items[0], left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
      const target = items[1];
      const targetRect = target.getBoundingClientRect();

      dispatchMouseEvent(document, 'mousemove', targetRect.right - 5, targetRect.top);
      fixture.detectChanges();

      expect(placeholder.style.transform).toBe(`translate3d(${ITEM_WIDTH}px, 0px, 0px)`);
      expect(target.style.transform).toBe(`translate3d(${-ITEM_WIDTH * 2}px, 0px, 0px)`);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should lay out the elements correctly, when swapping left with a wider element', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const {top, left} = items[1].getBoundingClientRect();

      fixture.componentInstance.items[1].width = ITEM_WIDTH * 2;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, items[1], left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
      const target = items[0];
      const targetRect = target.getBoundingClientRect();

      dispatchMouseEvent(document, 'mousemove', targetRect.right - 5, targetRect.top);
      fixture.detectChanges();

      expect(placeholder.style.transform).toBe(`translate3d(${-ITEM_WIDTH}px, 0px, 0px)`);
      expect(target.style.transform).toBe(`translate3d(${ITEM_WIDTH * 2}px, 0px, 0px)`);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should lay out elements correctly, when horizontally swapping an item with margin', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const {top, left} = items[0].getBoundingClientRect();

      fixture.componentInstance.items[0].margin = 12;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, items[0], left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;
      const target = items[1];
      const targetRect = target.getBoundingClientRect();

      dispatchMouseEvent(document, 'mousemove', targetRect.right - 5, targetRect.top);
      fixture.detectChanges();

      expect(placeholder.style.transform).toBe(`translate3d(${ITEM_WIDTH + 12}px, 0px, 0px)`);
      expect(target.style.transform).toBe(`translate3d(${-ITEM_WIDTH - 12}px, 0px, 0px)`);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should not swap position for tiny pointer movements', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const draggedItem = items[0];
      const target = items[1];
      const {top, left} = draggedItem.getBoundingClientRect();

      // Bump the height so the pointer doesn't leave after swapping.
      target.style.height = `${ITEM_HEIGHT * 3}px`;

      startDraggingViaMouse(fixture, draggedItem, left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(
        getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()),
      ).toEqual(['Zero', 'One', 'Two', 'Three']);

      const targetRect = target.getBoundingClientRect();
      const pointerTop = targetRect.top + 20;

      // Move over the target so there's a 20px overlap.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, pointerTop);
      fixture.detectChanges();
      expect(getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()))
        .withContext('Expected position to swap.')
        .toEqual(['One', 'Zero', 'Two', 'Three']);

      // Move down a further 1px.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, pointerTop + 1);
      fixture.detectChanges();
      expect(getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()))
        .withContext('Expected positions not to swap.')
        .toEqual(['One', 'Zero', 'Two', 'Three']);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it('should swap position for pointer movements in the opposite direction', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
      const draggedItem = items[0];
      const target = items[1];
      const {top, left} = draggedItem.getBoundingClientRect();

      // Bump the height so the pointer doesn't leave after swapping.
      target.style.height = `${ITEM_HEIGHT * 3}px`;

      startDraggingViaMouse(fixture, draggedItem, left, top);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(
        getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()),
      ).toEqual(['Zero', 'One', 'Two', 'Three']);

      const targetRect = target.getBoundingClientRect();
      const pointerTop = targetRect.top + 20;

      // Move over the target so there's a 20px overlap.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, pointerTop);
      fixture.detectChanges();
      expect(getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()))
        .withContext('Expected position to swap.')
        .toEqual(['One', 'Zero', 'Two', 'Three']);

      // Move up 10px.
      dispatchMouseEvent(document, 'mousemove', targetRect.left, pointerTop - 10);
      fixture.detectChanges();
      expect(getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()))
        .withContext('Expected positions to swap again.')
        .toEqual(['Zero', 'One', 'Two', 'Three']);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
    }));

    it(
      'it should allow item swaps in the same drag direction, if the pointer did not ' +
        'overlap with the sibling item after the previous swap',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInDropZone);
        fixture.detectChanges();

        const items = fixture.componentInstance.dragItems.map(i => i.element.nativeElement);
        const draggedItem = items[0];
        const target = items[items.length - 1];
        const itemRect = draggedItem.getBoundingClientRect();

        startDraggingViaMouse(fixture, draggedItem, itemRect.left, itemRect.top);

        const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

        expect(
          getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()),
        ).toEqual(['Zero', 'One', 'Two', 'Three']);

        let targetRect = target.getBoundingClientRect();

        // Trigger a mouse move coming from the bottom so that the list thinks that we're
        // sorting upwards. This usually how a user would behave with a mouse pointer.
        dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.bottom + 50);
        fixture.detectChanges();
        dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.bottom - 1);
        fixture.detectChanges();

        expect(
          getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()),
        ).toEqual(['One', 'Two', 'Three', 'Zero']);

        // Refresh the rect since the element position has changed.
        targetRect = target.getBoundingClientRect();
        dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.bottom - 1);
        fixture.detectChanges();

        expect(
          getElementSibligsByPosition(placeholder, 'top').map(e => e.textContent!.trim()),
        ).toEqual(['One', 'Two', 'Zero', 'Three']);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        flush();
      }),
    );

    it('should clean up the preview element if the item is destroyed mid-drag', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.parentNode).withContext('Expected preview to be in the DOM').toBeTruthy();
      expect(item.parentNode).withContext('Expected drag item to be in the DOM').toBeTruthy();

      fixture.destroy();

      expect(preview.parentNode)
        .withContext('Expected preview to be removed from the DOM')
        .toBeFalsy();
      expect(item.parentNode)
        .withContext('Expected drag item to be removed from the DOM')
        .toBeFalsy();
    }));

    it('should be able to customize the preview element', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview).toBeTruthy();
      expect(preview.classList).toContain('custom-preview');
      expect(preview.textContent!.trim()).toContain('Custom preview');
    }));

    it('should handle the custom preview being removed', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();
      flush();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      fixture.componentInstance.renderCustomPreview = false;
      fixture.detectChanges();
      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview).toBeTruthy();
      expect(preview.classList).not.toContain('custom-preview');
      expect(preview.textContent!.trim()).not.toContain('Custom preview');
    }));

    it('should be able to constrain the position of a custom preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.componentInstance.boundarySelector = '.cdk-drop-list';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const listRect =
        fixture.componentInstance.dropInstance.element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      startDraggingViaMouse(fixture, item, listRect.right + 50, listRect.bottom + 50);
      flush();
      dispatchMouseEvent(document, 'mousemove', listRect.right + 50, listRect.bottom + 50);
      fixture.detectChanges();

      const previewRect = preview.getBoundingClientRect();

      expect(Math.floor(previewRect.bottom)).toBe(Math.floor(listRect.bottom));
      expect(Math.floor(previewRect.right)).toBe(Math.floor(listRect.right));
    }));

    it('should be able to constrain the preview position with a custom function', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      const spy = jasmine.createSpy('constrain position spy').and.returnValue({
        x: 50,
        y: 50,
      } as Point);

      fixture.componentInstance.constrainPosition = spy;
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      startDraggingViaMouse(fixture, item, 200, 200);
      flush();
      dispatchMouseEvent(document, 'mousemove', 200, 200);
      fixture.detectChanges();

      const previewRect = preview.getBoundingClientRect();

      expect(spy).toHaveBeenCalledWith(
        jasmine.objectContaining({x: 200, y: 200}),
        jasmine.any(DragRef),
      );
      expect(Math.floor(previewRect.top)).toBe(50);
      expect(Math.floor(previewRect.left)).toBe(50);
    }));

    it(
      'should revert the element back to its parent after dragging with a custom ' +
        'preview has stopped',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
        fixture.detectChanges();

        const dragContainer = fixture.componentInstance.dropInstance.element.nativeElement;
        const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

        expect(dragContainer.contains(item))
          .withContext('Expected item to be in container.')
          .toBe(true);

        // The coordinates don't matter.
        dragElementViaMouse(fixture, item, 10, 10);
        flush();
        fixture.detectChanges();

        expect(dragContainer.contains(item))
          .withContext('Expected item to be returned to container.')
          .toBe(true);
      }),
    );

    it('should position custom previews next to the pointer', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item, 50, 50);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.style.transform).toBe('translate3d(50px, 50px, 0px)');
    }));

    it('should keep the preview next to the trigger if the page was scrolled', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();
      const cleanup = makeScrollable();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item, 50, 50);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.style.transform).toBe('translate3d(50px, 50px, 0px)');

      scrollTo(0, 500);
      fixture.detectChanges();

      // Move the pointer a bit so the preview has to reposition.
      dispatchMouseEvent(document, 'mousemove', 55, 55);
      fixture.detectChanges();

      expect(preview.style.transform).toBe('translate3d(55px, 555px, 0px)');

      cleanup();
    }));

    it('should lock position inside a drop container along the x axis', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();

      const item = fixture.componentInstance.dragItems.toArray()[1];
      const element = item.element.nativeElement;

      item.lockAxis = 'x';

      startDraggingViaMouse(fixture, element, 50, 50);

      dispatchMouseEvent(element, 'mousemove', 100, 100);
      fixture.detectChanges();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.style.transform).toBe('translate3d(100px, 50px, 0px)');
    }));

    it('should lock position inside a drop container along the y axis', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();

      const item = fixture.componentInstance.dragItems.toArray()[1];
      const element = item.element.nativeElement;

      item.lockAxis = 'y';

      startDraggingViaMouse(fixture, element, 50, 50);

      dispatchMouseEvent(element, 'mousemove', 100, 100);
      fixture.detectChanges();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.style.transform).toBe('translate3d(50px, 100px, 0px)');
    }));

    it('should inherit the position locking from the drop container', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.detectChanges();

      const element = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      fixture.componentInstance.dropInstance.lockAxis = 'x';

      startDraggingViaMouse(fixture, element, 50, 50);

      dispatchMouseEvent(element, 'mousemove', 100, 100);
      fixture.detectChanges();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview.style.transform).toBe('translate3d(100px, 50px, 0px)');
    }));

    it('should be able to set a class on a custom preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.componentInstance.previewClass = 'custom-class';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      expect(preview.classList).toContain('custom-preview');
      expect(preview.classList).toContain('custom-class');
    }));

    it('should be able to apply the size of the dragged element to a custom preview', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
      fixture.componentInstance.matchPreviewSize = true;
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const itemRect = item.getBoundingClientRect();

      startDraggingViaMouse(fixture, item);

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview).toBeTruthy();
      expect(preview.style.width).toBe(`${itemRect.width}px`);
      expect(preview.style.height).toBe(`${itemRect.height}px`);
    }));

    it(
      'should preserve the pickup position if the custom preview inherits the size of the ' +
        'dragged element',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInDropZoneWithCustomPreview);
        fixture.componentInstance.matchPreviewSize = true;
        fixture.detectChanges();
        const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

        startDraggingViaMouse(fixture, item, 50, 50);

        const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

        expect(preview.style.transform).toBe('translate3d(8px, 33px, 0px)');
      }),
    );

    it('should not have the size of the inserted preview affect the size applied via matchSize', fakeAsync(() => {
      const fixture = createComponent(DraggableInHorizontalFlexDropZoneWithMatchSizePreview);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const itemRect = item.getBoundingClientRect();

      startDraggingViaMouse(fixture, item);
      fixture.detectChanges();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;
      const previewRect = preview.getBoundingClientRect();

      expect(Math.floor(previewRect.width)).toBe(Math.floor(itemRect.width));
      expect(Math.floor(previewRect.height)).toBe(Math.floor(itemRect.height));
    }));

    it('should not throw when custom preview only has text', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomTextOnlyPreview);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      expect(() => {
        startDraggingViaMouse(fixture, item);
      }).not.toThrow();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview).toBeTruthy();
      expect(preview.textContent!.trim()).toContain('Hello One');
    }));

    it('should handle custom preview with multiple root nodes', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomMultiNodePreview);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      expect(() => {
        startDraggingViaMouse(fixture, item);
      }).not.toThrow();

      const preview = document.querySelector('.cdk-drag-preview')! as HTMLElement;

      expect(preview).toBeTruthy();
      expect(preview.textContent!.trim()).toContain('HelloOne');
    }));

    it('should be able to customize the placeholder', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPlaceholder);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(placeholder).toBeTruthy();
      expect(placeholder.classList).toContain('custom-placeholder');
      expect(placeholder.textContent!.trim()).toContain('Custom placeholder');
    }));

    it('should handle the custom placeholder being removed', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPlaceholder);
      fixture.detectChanges();
      flush();

      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      fixture.componentInstance.renderPlaceholder = false;
      fixture.detectChanges();

      startDraggingViaMouse(fixture, item);

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(placeholder).toBeTruthy();
      expect(placeholder.classList).not.toContain('custom-placeholder');
      expect(placeholder.textContent!.trim()).not.toContain('Custom placeholder');
    }));

    it('should measure the custom placeholder after the first change detection', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomPlaceholder);
      fixture.componentInstance.extraPlaceholderClass = 'tall-placeholder';
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const item = dragItems.toArray()[0].element.nativeElement;

      startDraggingViaMouse(fixture, item);

      const thirdItem = dragItems.toArray()[2].element.nativeElement;
      const thirdItemRect = thirdItem.getBoundingClientRect();

      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];
      expect(event.currentIndex).toBe(2);
    }));

    it('should not throw when custom placeholder only has text', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomTextOnlyPlaceholder);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      expect(() => {
        startDraggingViaMouse(fixture, item);
      }).not.toThrow();

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(placeholder).toBeTruthy();
      expect(placeholder.textContent!.trim()).toContain('Hello One');
    }));

    it('should handle custom placeholder with multiple root nodes', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithCustomMultiNodePlaceholder);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      expect(() => {
        startDraggingViaMouse(fixture, item);
      }).not.toThrow();

      const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

      expect(placeholder).toBeTruthy();
      expect(placeholder.textContent!.trim()).toContain('HelloOne');
    }));

    it('should clear the `transform` value from siblings when item is dropped`', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const thirdItem = dragItems.toArray()[2].element.nativeElement;
      const thirdItemRect = thirdItem.getBoundingClientRect();

      startDraggingViaMouse(fixture, firstItem.element.nativeElement);

      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();

      expect(thirdItem.style.transform).toBeTruthy();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(thirdItem.style.transform).toBeFalsy();
    }));

    it('should not move the item if the list is disabled', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const dropElement = fixture.componentInstance.dropInstance.element.nativeElement;

      expect(dropElement.classList).not.toContain('cdk-drop-list-disabled');

      fixture.componentInstance.dropInstance.disabled = true;
      fixture.detectChanges();

      expect(dropElement.classList).toContain('cdk-drop-list-disabled');
      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.right + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);
    }));

    it('should not throw if the `touches` array is empty', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;

      dispatchTouchEvent(item, 'touchstart');
      fixture.detectChanges();

      dispatchTouchEvent(document, 'touchmove');
      fixture.detectChanges();

      dispatchTouchEvent(document, 'touchmove', 50, 50);
      fixture.detectChanges();

      expect(() => {
        const endEvent = createTouchEvent('touchend', 50, 50);
        Object.defineProperty(endEvent, 'touches', {get: () => []});

        dispatchEvent(document, endEvent);
        fixture.detectChanges();
      }).not.toThrow();
    }));

    it('should not move the item if the group is disabled', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZonesViaGroupDirective);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.groupedDragItems[0];

      fixture.componentInstance.groupDisabled = true;
      fixture.detectChanges();

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems[0];
      const thirdItemRect = dragItems[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.right + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);
    }));

    it('should not sort an item if sorting the list is disabled', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const dropInstance = fixture.componentInstance.dropInstance;
      const dragItems = fixture.componentInstance.dragItems;

      dropInstance.sortingDisabled = true;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();
      const targetX = thirdItemRect.left + 1;
      const targetY = thirdItemRect.top + 1;

      startDraggingViaMouse(fixture, firstItem.element.nativeElement);

      const placeholder = document.querySelector('.cdk-drag-placeholder') as HTMLElement;

      dispatchMouseEvent(document, 'mousemove', targetX, targetY);
      fixture.detectChanges();

      expect(getElementIndexByPosition(placeholder, 'top'))
        .withContext('Expected placeholder to stay in place.')
        .toBe(0);

      dispatchMouseEvent(document, 'mouseup', targetX, targetY);
      fixture.detectChanges();

      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 0,
        item: firstItem,
        container: dropInstance,
        previousContainer: dropInstance,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);
    }));

    it('should not throw if an item is removed after dragging has started', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstElement = dragItems.first.element.nativeElement;
      const lastItemRect = dragItems.last.element.nativeElement.getBoundingClientRect();

      // Start dragging.
      startDraggingViaMouse(fixture, firstElement);

      // Remove the last item.
      fixture.componentInstance.items.pop();
      fixture.detectChanges();

      expect(() => {
        // Move the dragged item over where the remove item would've been.
        dispatchMouseEvent(document, 'mousemove', lastItemRect.left + 1, lastItemRect.top + 1);
        fixture.detectChanges();
        flush();
      }).not.toThrow();
    }));

    it('should not be able to start a drag sequence while another one is still active', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const [item, otherItem] = fixture.componentInstance.dragItems.toArray();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      expect(document.querySelectorAll('.cdk-drag-dragging').length)
        .withContext('Expected one item to be dragged initially.')
        .toBe(1);

      startDraggingViaMouse(fixture, otherItem.element.nativeElement);

      expect(document.querySelectorAll('.cdk-drag-dragging').length)
        .withContext('Expected only one item to continue to be dragged.')
        .toBe(1);
    }));

    it('should should be able to disable auto-scrolling', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      fixture.componentInstance.dropInstance.autoScrollDisabled = true;
      fixture.detectChanges();

      expect(list.scrollTop).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width / 2,
        listRect.top + listRect.height,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollTop).toBe(0);
    }));

    it('should auto-scroll down if the user holds their pointer at bottom edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      expect(list.scrollTop).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width / 2,
        listRect.top + listRect.height,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollTop).toBeGreaterThan(0);
    }));

    it('should auto-scroll up if the user holds their pointer at top edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();
      const initialScrollDistance = (list.scrollTop = list.scrollHeight);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', listRect.left + listRect.width / 2, listRect.top);
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollTop).toBeLessThan(initialScrollDistance);
    }));

    it('should auto-scroll right if the user holds their pointer at right edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableHorizontalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      expect(list.scrollLeft).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width,
        listRect.top + listRect.height / 2,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollLeft).toBeGreaterThan(0);
    }));

    it('should auto-scroll left if the user holds their pointer at left edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableHorizontalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();
      const initialScrollDistance = (list.scrollLeft = list.scrollWidth);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', listRect.left, listRect.top + listRect.height / 2);
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollLeft).toBeLessThan(initialScrollDistance);
    }));

    it('should be able to start auto scrolling with a drag boundary', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableHorizontalDropZone);
      fixture.componentInstance.boundarySelector = '.drop-list';
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      expect(list.scrollLeft).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width,
        listRect.top + listRect.height / 2,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollLeft).toBeGreaterThan(0);
    }));

    it('should stop scrolling if the user moves their pointer away', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      expect(list.scrollTop).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width / 2,
        listRect.top + listRect.height,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      const previousScrollTop = list.scrollTop;
      expect(previousScrollTop).toBeGreaterThan(0);

      // Move the pointer away from the edge of the element.
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width / 2,
        listRect.top + listRect.height / 2,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollTop).toBe(previousScrollTop);
    }));

    it('should stop scrolling if the user stops dragging', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      expect(list.scrollTop).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width / 2,
        listRect.top + listRect.height,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      const previousScrollTop = list.scrollTop;
      expect(previousScrollTop).toBeGreaterThan(0);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(list.scrollTop).toBe(previousScrollTop);
    }));

    it('should auto-scroll viewport down if the pointer is close to bottom edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const cleanup = makeScrollable();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const viewportRuler = TestBed.inject(ViewportRuler);
      const viewportSize = viewportRuler.getViewportSize();

      expect(viewportRuler.getViewportScrollPosition().top).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', viewportSize.width / 2, viewportSize.height);
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(viewportRuler.getViewportScrollPosition().top).toBeGreaterThan(0);

      cleanup();
    }));

    it('should auto-scroll viewport up if the pointer is close to top edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const cleanup = makeScrollable();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const viewportRuler = TestBed.inject(ViewportRuler);
      const viewportSize = viewportRuler.getViewportSize();

      scrollTo(0, viewportSize.height * 5);
      const initialScrollDistance = viewportRuler.getViewportScrollPosition().top;
      expect(initialScrollDistance).toBeGreaterThan(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', viewportSize.width / 2, 0);
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(viewportRuler.getViewportScrollPosition().top).toBeLessThan(initialScrollDistance);

      cleanup();
    }));

    it('should auto-scroll viewport right if the pointer is near right edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const cleanup = makeScrollable('horizontal');
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const viewportRuler = TestBed.inject(ViewportRuler);
      const viewportSize = viewportRuler.getViewportSize();

      expect(viewportRuler.getViewportScrollPosition().left).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', viewportSize.width, viewportSize.height / 2);
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(viewportRuler.getViewportScrollPosition().left).toBeGreaterThan(0);

      cleanup();
    }));

    it('should auto-scroll viewport left if the pointer is close to left edge', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      const cleanup = makeScrollable('horizontal');
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const viewportRuler = TestBed.inject(ViewportRuler);
      const viewportSize = viewportRuler.getViewportSize();

      scrollTo(viewportSize.width * 5, 0);
      const initialScrollDistance = viewportRuler.getViewportScrollPosition().left;
      expect(initialScrollDistance).toBeGreaterThan(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', 0, viewportSize.height / 2);
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(viewportRuler.getViewportScrollPosition().left).toBeLessThan(initialScrollDistance);

      cleanup();
    }));

    it(
      'should auto-scroll the list, not the viewport, when the pointer is over the edge of ' +
        'both the list and the viewport',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInScrollableVerticalDropZone);
        fixture.detectChanges();

        const list = fixture.componentInstance.dropInstance.element.nativeElement;
        const viewportRuler = TestBed.inject(ViewportRuler);
        const item = fixture.componentInstance.dragItems.first.element.nativeElement;

        // Position the list so that its top aligns with the viewport top. That way the pointer
        // will both over its top edge and the viewport's. We use top instead of bottom, because
        // bottom behaves weirdly when we run tests on mobile devices.
        list.style.position = 'fixed';
        list.style.left = '50%';
        list.style.top = '0';
        list.style.margin = '0';

        const listRect = list.getBoundingClientRect();
        const cleanup = makeScrollable();

        scrollTo(0, viewportRuler.getViewportSize().height * 5);
        list.scrollTop = 50;

        const initialScrollDistance = viewportRuler.getViewportScrollPosition().top;
        expect(initialScrollDistance).toBeGreaterThan(0);
        expect(list.scrollTop).toBe(50);

        startDraggingViaMouse(fixture, item);
        dispatchMouseEvent(document, 'mousemove', listRect.left + listRect.width / 2, 0);
        fixture.detectChanges();
        tickAnimationFrames(20);

        expect(viewportRuler.getViewportScrollPosition().top).toBe(initialScrollDistance);
        expect(list.scrollTop).toBeLessThan(50);

        cleanup();
      }),
    );

    it(
      'should auto-scroll the viewport, when the pointer is over the edge of both the list ' +
        'and the viewport, if the list cannot be scrolled in that direction',
      fakeAsync(() => {
        const fixture = createComponent(DraggableInScrollableVerticalDropZone);
        fixture.detectChanges();

        const list = fixture.componentInstance.dropInstance.element.nativeElement;
        const viewportRuler = TestBed.inject(ViewportRuler);
        const item = fixture.componentInstance.dragItems.first.element.nativeElement;

        // Position the list so that its top aligns with the viewport top. That way the pointer
        // will both over its top edge and the viewport's. We use top instead of bottom, because
        // bottom behaves weirdly when we run tests on mobile devices.
        list.style.position = 'fixed';
        list.style.left = '50%';
        list.style.top = '0';
        list.style.margin = '0';

        const listRect = list.getBoundingClientRect();
        const cleanup = makeScrollable();

        scrollTo(0, viewportRuler.getViewportSize().height * 5);
        list.scrollTop = 0;

        const initialScrollDistance = viewportRuler.getViewportScrollPosition().top;
        expect(initialScrollDistance).toBeGreaterThan(0);
        expect(list.scrollTop).toBe(0);

        startDraggingViaMouse(fixture, item);
        dispatchMouseEvent(document, 'mousemove', listRect.left + listRect.width / 2, 0);
        fixture.detectChanges();
        tickAnimationFrames(20);

        expect(viewportRuler.getViewportScrollPosition().top).toBeLessThan(initialScrollDistance);
        expect(list.scrollTop).toBe(0);

        cleanup();
      }),
    );

    it('should be able to auto-scroll a parent container', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableParentContainer);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const container = fixture.nativeElement.querySelector('.scroll-container');
      const containerRect = container.getBoundingClientRect();

      expect(container.scrollTop).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        containerRect.left + containerRect.width / 2,
        containerRect.top + containerRect.height,
      );
      fixture.detectChanges();
      tickAnimationFrames(20);

      expect(container.scrollTop).toBeGreaterThan(0);
    }));

    it('should be able to configure the auto-scroll speed', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      fixture.componentInstance.dropInstance.autoScrollStep = 20;
      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const list = fixture.componentInstance.dropInstance.element.nativeElement;
      const listRect = list.getBoundingClientRect();

      expect(list.scrollTop).toBe(0);

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(
        document,
        'mousemove',
        listRect.left + listRect.width / 2,
        listRect.top + listRect.height,
      );
      fixture.detectChanges();
      tickAnimationFrames(10);

      expect(list.scrollTop).toBeGreaterThan(100);
    }));

    it('should pick up descendants inside of containers', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZoneWithContainer);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        firstItem.element.nativeElement,
        thirdItemRect.left + 1,
        thirdItemRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 2,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should not pick up items from descendant drop lists', fakeAsync(() => {
      const fixture = createComponent(NestedDropZones);
      fixture.detectChanges();
      const {dragItems, innerList, outerList} = fixture.componentInstance;
      const innerClasses = innerList.nativeElement.classList;
      const outerClasses = outerList.nativeElement.classList;
      const draggingClass = 'cdk-drop-list-dragging';

      expect(innerClasses).not.toContain(
        draggingClass,
        'Expected inner list to start off as not dragging.',
      );
      expect(outerClasses).not.toContain(
        draggingClass,
        'Expected outer list to start off as not dragging.',
      );

      startDraggingViaMouse(fixture, dragItems.first.element.nativeElement);
      fixture.detectChanges();

      expect(innerClasses)
        .withContext('Expected inner list to be dragging.')
        .toContain(draggingClass);
      expect(outerClasses).not.toContain(draggingClass, 'Expected outer list to not be dragging.');
    }));

    it('should be able to re-enable a disabled drop list', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const tryDrag = () => {
        const firstItem = dragItems.first;
        const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();
        dragElementViaMouse(
          fixture,
          firstItem.element.nativeElement,
          thirdItemRect.left + 1,
          thirdItemRect.top + 1,
        );
        flush();
        fixture.detectChanges();
      };

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      fixture.componentInstance.dropInstance.disabled = true;
      fixture.detectChanges();
      tryDrag();

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      fixture.componentInstance.dropInstance.disabled = false;
      fixture.detectChanges();
      tryDrag();

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'One',
        'Two',
        'Zero',
        'Three',
      ]);
    }));

    it('should be able to configure the drop input defaults through a provider', fakeAsync(() => {
      const config: DragDropConfig = {
        draggingDisabled: true,
        sortingDisabled: true,
        listAutoScrollDisabled: true,
        listOrientation: 'horizontal',
        lockAxis: 'y',
      };

      const fixture = createComponent(PlainStandaloneDropList, [
        {
          provide: CDK_DRAG_CONFIG,
          useValue: config,
        },
      ]);
      fixture.detectChanges();
      const list = fixture.componentInstance.dropList;
      expect(list.disabled).toBe(true);
      expect(list.sortingDisabled).toBe(true);
      expect(list.autoScrollDisabled).toBe(true);
      expect(list.orientation).toBe('horizontal');
      expect(list.lockAxis).toBe('y');
    }));

    it('should disable scroll snapping while the user is dragging', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const styles: any = fixture.componentInstance.dropInstance.element.nativeElement.style;

      // This test only applies to browsers that support scroll snapping.
      if (!('scrollSnapType' in styles) && !('msScrollSnapType' in styles)) {
        return;
      }

      expect(styles.scrollSnapType || styles.msScrollSnapType).toBeFalsy();

      startDraggingViaMouse(fixture, item);

      expect(styles.scrollSnapType || styles.msScrollSnapType).toBe('none');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(styles.scrollSnapType || styles.msScrollSnapType).toBeFalsy();
    }));

    it('should restore the previous inline scroll snap value', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      const styles: any = fixture.componentInstance.dropInstance.element.nativeElement.style;

      // This test only applies to browsers that support scroll snapping.
      if (!('scrollSnapType' in styles) && !('msScrollSnapType' in styles)) {
        return;
      }

      styles.scrollSnapType = styles.msScrollSnapType = 'block';
      expect(styles.scrollSnapType || styles.msScrollSnapType).toBe('block');

      startDraggingViaMouse(fixture, item);

      expect(styles.scrollSnapType || styles.msScrollSnapType).toBe('none');

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(styles.scrollSnapType || styles.msScrollSnapType).toBe('block');
    }));

    it('should be able to start dragging again if the dragged item is destroyed', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();

      let item = fixture.componentInstance.dragItems.first;
      startDraggingViaMouse(fixture, item.element.nativeElement);
      expect(document.querySelector('.cdk-drop-list-dragging'))
        .withContext('Expected to drag initially.')
        .toBeTruthy();

      fixture.componentInstance.items = [
        {value: 'Five', height: ITEM_HEIGHT, margin: 0},
        {value: 'Six', height: ITEM_HEIGHT, margin: 0},
      ];
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
      expect(document.querySelector('.cdk-drop-list-dragging'))
        .withContext('Expected not to be dragging after item is destroyed.')
        .toBeFalsy();

      item = fixture.componentInstance.dragItems.first;
      startDraggingViaMouse(fixture, item.element.nativeElement);

      expect(document.querySelector('.cdk-drop-list-dragging'))
        .withContext('Expected to be able to start a new drag sequence.')
        .toBeTruthy();

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);
    }));

    it('should make the placeholder available in the start event', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const item = fixture.componentInstance.dragItems.toArray()[1].element.nativeElement;
      let placeholder: HTMLElement | undefined;

      fixture.componentInstance.startedSpy.and.callFake((event: CdkDragStart) => {
        placeholder = event.source.getPlaceholderElement();
      });

      startDraggingViaMouse(fixture, item);
      expect(placeholder).toBeTruthy();
    }));

    it('should not move item into position not allowed by the sort predicate', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const dragItems = fixture.componentInstance.dragItems;
      const spy = jasmine.createSpy('sort predicate spy').and.returnValue(false);
      fixture.componentInstance.dropInstance.sortPredicate = spy;

      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      const firstItem = dragItems.first;
      const thirdItemRect = dragItems.toArray()[2].element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, firstItem.element.nativeElement);
      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(2, firstItem, fixture.componentInstance.dropInstance);
      expect(dragItems.map(drag => drag.element.nativeElement.textContent!.trim())).toEqual([
        'Zero',
        'One',
        'Two',
        'Three',
      ]);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      // Assert the event like this, rather than `toHaveBeenCalledWith`, because Jasmine will
      // go into an infinite loop trying to stringify the event, if the test fails.
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 0,
        item: firstItem,
        container: fixture.componentInstance.dropInstance,
        previousContainer: fixture.componentInstance.dropInstance,
        isPointerOverContainer: jasmine.any(Boolean),
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should not call the sort predicate for the same index', fakeAsync(() => {
      const fixture = createComponent(DraggableInDropZone);
      fixture.detectChanges();
      const spy = jasmine.createSpy('sort predicate spy').and.returnValue(true);
      fixture.componentInstance.dropInstance.sortPredicate = spy;

      const item = fixture.componentInstance.dragItems.first.element.nativeElement;
      const itemRect = item.getBoundingClientRect();

      startDraggingViaMouse(fixture, item);
      dispatchMouseEvent(document, 'mousemove', itemRect.left + 10, itemRect.top + 10);
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    }));

    it('should throw if drop list is attached to an ng-container', fakeAsync(() => {
      expect(() => {
        createComponent(DropListOnNgContainer).detectChanges();
        flush();
      }).toThrowError(/^cdkDropList must be attached to an element node/);
    }));

    it('should preserve the original `transform` of items in the list', fakeAsync(() => {
      const fixture = createComponent(DraggableInScrollableVerticalDropZone);
      fixture.detectChanges();
      const items = fixture.componentInstance.dragItems.map(item => item.element.nativeElement);
      items.forEach(element => (element.style.transform = 'rotate(180deg)'));
      const thirdItemRect = items[2].getBoundingClientRect();
      const hasInitialTransform = (element: HTMLElement) =>
        element.style.transform.indexOf('rotate(180deg)') > -1;

      startDraggingViaMouse(fixture, items[0]);
      fixture.detectChanges();
      const preview = document.querySelector('.cdk-drag-preview') as HTMLElement;
      const placeholder = fixture.nativeElement.querySelector('.cdk-drag-placeholder');

      expect(items.every(hasInitialTransform))
        .withContext('Expected items to preserve transform when dragging starts.')
        .toBe(true);
      expect(hasInitialTransform(preview))
        .withContext('Expected preview to preserve transform when dragging starts.')
        .toBe(true);
      expect(hasInitialTransform(placeholder))
        .withContext('Expected placeholder to preserve transform when dragging starts.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', thirdItemRect.left + 1, thirdItemRect.top + 1);
      fixture.detectChanges();
      expect(items.every(hasInitialTransform))
        .withContext('Expected items to preserve transform while dragging.')
        .toBe(true);
      expect(hasInitialTransform(preview))
        .withContext('Expected preview to preserve transform while dragging.')
        .toBe(true);
      expect(hasInitialTransform(placeholder))
        .withContext('Expected placeholder to preserve transform while dragging.')
        .toBe(true);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();
      expect(items.every(hasInitialTransform))
        .withContext('Expected items to preserve transform when dragging stops.')
        .toBe(true);
      expect(hasInitialTransform(preview))
        .withContext('Expected preview to preserve transform when dragging stops.')
        .toBe(true);
      expect(hasInitialTransform(placeholder))
        .withContext('Expected placeholder to preserve transform when dragging stops.')
        .toBe(true);
    }));
  });

  describe('in a connected drop container', () => {
    it('should dispatch the `dropped` event when an item has been dropped into a new container', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const item = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        item.element.nativeElement,
        targetRect.left + 1,
        targetRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item,
        container: fixture.componentInstance.dropInstances.toArray()[1],
        previousContainer: fixture.componentInstance.dropInstances.first,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should be able to move the element over a new container and return it', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][1];
      const initialRect = item.element.nativeElement.getBoundingClientRect();
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

      expect(placeholder).toBeTruthy();
      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be inside the first container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();

      expect(dropZones[1].contains(placeholder))
        .withContext('Expected placeholder to be inside second container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', initialRect.left + 1, initialRect.top + 1);
      fixture.detectChanges();

      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be back inside first container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
    }));

    it(
      'should be able to move the element over a new container and return it to the initial ' +
        'one, even if it no longer matches the enterPredicate',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();

        const groups = fixture.componentInstance.groupedDragItems;
        const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const initialRect = item.element.nativeElement.getBoundingClientRect();
        const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

        fixture.componentInstance.dropInstances.first.enterPredicate = () => false;
        fixture.detectChanges();

        startDraggingViaMouse(fixture, item.element.nativeElement);

        const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

        expect(placeholder).toBeTruthy();
        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be inside the first container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to be inside second container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mousemove', initialRect.left + 1, initialRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be back inside first container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();

        expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
      }),
    );

    it('should transfer the DOM element from one drop zone to another', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems.slice();
      const element = groups[0][1].element.nativeElement;
      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const targetRect = groups[1][1].element.nativeElement.getBoundingClientRect();

      // Use coordinates of [1] item corresponding to [2] item
      // after dragged item is removed from first container
      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 2, // dragged item should replace the [2] item (see comment above)
        item: groups[0][1],
        container: dropInstances[1],
        previousContainer: dropInstances[0],
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should not be able to transfer an item into a container that is not in `connectedTo`', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);

      fixture.detectChanges();
      fixture.componentInstance.dropInstances.forEach(d => (d.connectedTo = []));
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems.slice();
      const element = groups[0][1].element.nativeElement;
      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top + 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 1,
        item: groups[0][1],
        container: dropInstances[0],
        previousContainer: dropInstances[0],
        isPointerOverContainer: false,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should not be able to transfer an item that does not match the `enterPredicate`', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);

      fixture.detectChanges();
      fixture.componentInstance.dropInstances.forEach(d => (d.enterPredicate = () => false));
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems.slice();
      const element = groups[0][1].element.nativeElement;
      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top + 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 1,
        item: groups[0][1],
        container: dropInstances[0],
        previousContainer: dropInstances[0],
        isPointerOverContainer: false,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should call the `enterPredicate` with the item and the container it is entering', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const spy = jasmine.createSpy('enterPredicate spy').and.returnValue(true);
      const groups = fixture.componentInstance.groupedDragItems.slice();
      const dragItem = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dropInstances[1].enterPredicate = spy;
      fixture.detectChanges();

      dragElementViaMouse(
        fixture,
        dragItem.element.nativeElement,
        targetRect.left + 1,
        targetRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(dragItem, dropInstances[1]);
    }));

    it('should be able to start dragging after an item has been transferred', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const element = groups[0][1].element.nativeElement;
      const dropZone = fixture.componentInstance.dropInstances.toArray()[1].element.nativeElement;
      const targetRect = dropZone.getBoundingClientRect();

      // Drag the element into the drop zone and move it to the top.
      [1, -1].forEach(offset => {
        dragElementViaMouse(fixture, element, targetRect.left + offset, targetRect.top + offset);
        flush();
        fixture.detectChanges();
      });

      assertDownwardSorting(fixture, Array.from(dropZone.querySelectorAll('.cdk-drag')));
    }));

    it('should be able to return the last item inside its initial container', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);

      // Make sure there's only one item in the first list.
      fixture.componentInstance.todo = ['things'];
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][0];
      const initialRect = item.element.nativeElement.getBoundingClientRect();
      const targetRect = groups[1][0].element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

      expect(placeholder).toBeTruthy();

      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be inside the first container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();

      expect(dropZones[1].contains(placeholder))
        .withContext('Expected placeholder to be inside second container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', initialRect.left + 1, initialRect.top + 1);
      fixture.detectChanges();

      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be back inside first container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
    }));

    it('should update drop zone after element has entered', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);

      // Make sure there's only one item in the first list.
      fixture.componentInstance.todo = ['things'];
      fixture.detectChanges();

      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][0];
      const initialTargetZoneRect = dropZones[1].getBoundingClientRect();
      const targetElement = groups[1][groups[1].length - 1].element.nativeElement;
      let targetRect = targetElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

      expect(placeholder).toBeTruthy();

      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();

      expect(targetElement.previousSibling === placeholder)
        .withContext('Expected placeholder to be inside second container before last item.')
        .toBe(true);

      // Update target rect
      targetRect = targetElement.getBoundingClientRect();
      expect(initialTargetZoneRect.bottom <= targetRect.top)
        .withContext('Expected target rect to be outside of initial target zone rect')
        .toBe(true);

      // Swap with target
      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.bottom - 1);
      fixture.detectChanges();

      // Drop and verify item drop positon and coontainer
      dispatchMouseEvent(document, 'mouseup', targetRect.left + 1, targetRect.bottom - 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 0,
        currentIndex: 3,
        item: item,
        container: dropInstances[1],
        previousContainer: dropInstances[0],
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should enter as first child if entering from top', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);

      // Make sure there's only one item in the first list.
      fixture.componentInstance.todo = ['things'];
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][0];

      // Add some initial padding as the target drop zone
      dropZones[1].style.paddingTop = '10px';

      const targetRect = dropZones[1].getBoundingClientRect();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

      expect(placeholder).toBeTruthy();

      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be inside the first container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.top);
      fixture.detectChanges();

      expect(dropZones[1].firstElementChild === placeholder)
        .withContext('Expected placeholder to be first child inside second container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mouseup');
    }));

    it('should enter as last child if entering from top in reversed container', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);

      // Make sure there's only one item in the first list.
      fixture.componentInstance.todo = ['things'];
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][0];

      // Add some initial padding as the target drop zone
      const targetDropZoneStyle = dropZones[1].style;
      targetDropZoneStyle.paddingTop = '10px';
      targetDropZoneStyle.display = 'flex';
      targetDropZoneStyle.flexDirection = 'column-reverse';

      const targetRect = dropZones[1].getBoundingClientRect();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

      expect(placeholder).toBeTruthy();

      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be inside the first container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mousemove', targetRect.left, targetRect.top);
      fixture.detectChanges();

      expect(dropZones[1].lastChild === placeholder)
        .withContext('Expected placeholder to be last child inside second container.')
        .toBe(true);

      dispatchMouseEvent(document, 'mouseup');
    }));

    it('should not throw when entering from the top with an intermediate sibling present', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZonesWithIntermediateSibling);

      // Make sure there's only one item in the first list.
      fixture.componentInstance.todo = ['things'];
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][0];

      // Add some initial padding as the target drop zone
      dropZones[1].style.paddingTop = '10px';
      const targetRect = dropZones[1].getBoundingClientRect();

      expect(() => {
        dragElementViaMouse(fixture, item.element.nativeElement, targetRect.left, targetRect.top);
        flush();
        fixture.detectChanges();
      }).not.toThrow();
    }));

    it('should assign a default id on each drop zone', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      expect(
        fixture.componentInstance.dropInstances.toArray().every(dropZone => {
          return !!dropZone.id && !!dropZone.element.nativeElement.getAttribute('id');
        }),
      ).toBe(true);
    }));

    it('should be able to connect two drop zones by id', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const dropInstances = fixture.componentInstance.dropInstances.toArray();

      dropInstances[0].id = 'todo';
      dropInstances[1].id = 'done';
      dropInstances[0].connectedTo = ['done'];
      dropInstances[1].connectedTo = ['todo'];
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const element = groups[0][1].element.nativeElement;
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top + 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item: groups[0][1],
        container: dropInstances[1],
        previousContainer: dropInstances[0],
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should be able to connect two drop zones using the drop list group', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZonesViaGroupDirective);
      fixture.detectChanges();

      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const groups = fixture.componentInstance.groupedDragItems;
      const element = groups[0][1].element.nativeElement;
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top + 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item: groups[0][1],
        container: dropInstances[1],
        previousContainer: dropInstances[0],
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should be able to pass a single id to `connectedTo`', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const dropInstances = fixture.componentInstance.dropInstances.toArray();

      dropInstances[1].id = 'done';
      dropInstances[0].connectedTo = ['done'];
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const element = groups[0][1].element.nativeElement;
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top + 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item: groups[0][1],
        container: dropInstances[1],
        previousContainer: dropInstances[0],
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it(
      'should return DOM element to its initial container after it is dropped, in a container ' +
        'with one draggable item',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZonesWithSingleItems);
        fixture.detectChanges();

        const items = fixture.componentInstance.dragItems.toArray();
        const item = items[0];
        const targetRect = items[1].element.nativeElement.getBoundingClientRect();
        const dropContainers = fixture.componentInstance.dropInstances.map(
          drop => drop.element.nativeElement,
        );

        expect(dropContainers[0].contains(item.element.nativeElement))
          .withContext('Expected DOM element to be in first container')
          .toBe(true);
        expect(item.dropContainer)
          .withContext('Expected CdkDrag to be in first container in memory')
          .toBe(fixture.componentInstance.dropInstances.first);

        dragElementViaMouse(
          fixture,
          item.element.nativeElement,
          targetRect.left + 1,
          targetRect.top + 1,
        );
        flush();
        fixture.detectChanges();

        expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

        const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

        expect(event).toEqual({
          previousIndex: 0,
          currentIndex: 0,
          item,
          container: fixture.componentInstance.dropInstances.toArray()[1],
          previousContainer: fixture.componentInstance.dropInstances.first,
          isPointerOverContainer: true,
          distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
          dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
        });

        expect(dropContainers[0].contains(item.element.nativeElement))
          .withContext('Expected DOM element to be returned to first container')
          .toBe(true);
        expect(item.dropContainer)
          .withContext('Expected CdkDrag to be returned to first container in memory')
          .toBe(fixture.componentInstance.dropInstances.first);
      }),
    );

    it(
      'should be able to return an element to its initial container in the same sequence, ' +
        'even if it is not connected to the current container',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();

        const groups = fixture.componentInstance.groupedDragItems;
        const dropInstances = fixture.componentInstance.dropInstances.toArray();
        const dropZones = dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const initialRect = item.element.nativeElement.getBoundingClientRect();
        const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

        // Change the `connectedTo` so the containers are only connected one-way.
        dropInstances[0].connectedTo = dropInstances[1];
        dropInstances[1].connectedTo = [];

        startDraggingViaMouse(fixture, item.element.nativeElement);
        fixture.detectChanges();

        const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

        expect(placeholder).toBeTruthy();
        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be inside the first container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to be inside second container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mousemove', initialRect.left + 1, initialRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be back inside first container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();

        expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
      }),
    );

    it('should not add child drop lists to the same group as their parents', fakeAsync(() => {
      const fixture = createComponent(NestedDropListGroups);
      const component = fixture.componentInstance;
      fixture.detectChanges();

      expect(Array.from(component.group._items)).toEqual([component.listOne, component.listTwo]);
    }));

    it('should not be able to drop an element into a container that is under another element', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems.slice();
      const element = groups[0][1].element.nativeElement;
      const dropInstances = fixture.componentInstance.dropInstances.toArray();
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();
      const coverElement = document.createElement('div');
      const targetGroupRect = dropInstances[1].element.nativeElement.getBoundingClientRect();

      // Add an extra element that covers the target container.
      fixture.nativeElement.appendChild(coverElement);
      extendStyles(coverElement.style, {
        position: 'fixed',
        top: targetGroupRect.top + 'px',
        left: targetGroupRect.left + 'px',
        bottom: targetGroupRect.bottom + 'px',
        right: targetGroupRect.right + 'px',
        background: 'orange',
      });

      dragElementViaMouse(fixture, element, targetRect.left + 1, targetRect.top + 1);
      flush();
      fixture.detectChanges();

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toBeTruthy();
      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 1,
        item: groups[0][1],
        container: dropInstances[0],
        previousContainer: dropInstances[0],
        isPointerOverContainer: false,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should set a class when a container can receive an item', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = fixture.componentInstance.groupedDragItems[0][1];

      expect(dropZones.every(c => !c.classList.contains('cdk-drop-list-receiving')))
        .withContext('Expected neither of the containers to have the class.')
        .toBe(true);

      startDraggingViaMouse(fixture, item.element.nativeElement);
      fixture.detectChanges();

      expect(dropZones[0].classList).not.toContain(
        'cdk-drop-list-receiving',
        'Expected source container not to have the receiving class.',
      );

      expect(dropZones[1].classList)
        .withContext('Expected target container to have the receiving class.')
        .toContain('cdk-drop-list-receiving');
    }));

    it('should toggle the `receiving` class when the item enters a new list', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      expect(dropZones.every(c => !c.classList.contains('cdk-drop-list-receiving')))
        .withContext('Expected neither of the containers to have the class.')
        .toBe(true);

      startDraggingViaMouse(fixture, item.element.nativeElement);

      expect(dropZones[0].classList).not.toContain(
        'cdk-drop-list-receiving',
        'Expected source container not to have the receiving class.',
      );

      expect(dropZones[1].classList)
        .withContext('Expected target container to have the receiving class.')
        .toContain('cdk-drop-list-receiving');

      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();

      expect(dropZones[0].classList)
        .withContext('Expected old container to have the receiving class after exiting.')
        .toContain('cdk-drop-list-receiving');

      expect(dropZones[1].classList)
        .not.withContext('Expected new container not to have the receiving class after exiting.')
        .toContain('cdk-drop-list-receiving');
    }));

    it('should not set the receiving class if the item does not match the enter predicate', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();
      fixture.componentInstance.dropInstances.toArray()[1].enterPredicate = () => false;

      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const item = fixture.componentInstance.groupedDragItems[0][1];

      expect(dropZones.every(c => !c.classList.contains('cdk-drop-list-receiving')))
        .withContext('Expected neither of the containers to have the class.')
        .toBe(true);

      startDraggingViaMouse(fixture, item.element.nativeElement);
      fixture.detectChanges();

      expect(dropZones.every(c => !c.classList.contains('cdk-drop-list-receiving')))
        .withContext('Expected neither of the containers to have the class.')
        .toBe(true);
    }));

    it(
      'should set the receiving class on the source container, even if the enter predicate ' +
        'does not match',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();
        fixture.componentInstance.dropInstances.toArray()[0].enterPredicate = () => false;

        const groups = fixture.componentInstance.groupedDragItems;
        const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

        expect(dropZones.every(c => !c.classList.contains('cdk-drop-list-receiving')))
          .withContext('Expected neither of the containers to have the class.')
          .toBe(true);

        startDraggingViaMouse(fixture, item.element.nativeElement);

        expect(dropZones[0].classList)
          .not.withContext('Expected source container not to have the receiving class.')
          .toContain('cdk-drop-list-receiving');

        expect(dropZones[1].classList)
          .withContext('Expected target container to have the receiving class.')
          .toContain('cdk-drop-list-receiving');

        dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[0].classList)
          .withContext('Expected old container to have the receiving class after exiting.')
          .toContain('cdk-drop-list-receiving');

        expect(dropZones[1].classList).not.toContain(
          'cdk-drop-list-receiving',
          'Expected new container not to have the receiving class after exiting.',
        );
      }),
    );

    it(
      'should be able to move the item over an intermediate container before ' +
        'dropping it into the final one',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();

        const dropInstances = fixture.componentInstance.dropInstances.toArray();
        dropInstances[0].connectedTo = [dropInstances[1], dropInstances[2]];
        dropInstances[1].connectedTo = [];
        dropInstances[2].connectedTo = [];
        fixture.detectChanges();

        const groups = fixture.componentInstance.groupedDragItems;
        const dropZones = dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const intermediateRect = dropZones[1].getBoundingClientRect();
        const finalRect = dropZones[2].getBoundingClientRect();

        startDraggingViaMouse(fixture, item.element.nativeElement);

        const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

        expect(placeholder).toBeTruthy();
        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be inside the first container.')
          .toBe(true);

        dispatchMouseEvent(
          document,
          'mousemove',
          intermediateRect.left + 1,
          intermediateRect.top + 1,
        );
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to be inside second container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mousemove', finalRect.left + 1, finalRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[2].contains(placeholder))
          .withContext('Expected placeholder to be inside third container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

        expect(event).toBeTruthy();
        expect(event).toEqual(
          jasmine.objectContaining({
            previousIndex: 1,
            currentIndex: 0,
            item: groups[0][1],
            container: dropInstances[2],
            previousContainer: dropInstances[0],
            isPointerOverContainer: false,
            distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
            dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
          }),
        );
      }),
    );

    it(
      'should not be able to move an item into a drop container that the initial container is ' +
        'not connected to by passing it over an intermediate one that is',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();

        const dropInstances = fixture.componentInstance.dropInstances.toArray();
        dropInstances[0].connectedTo = [dropInstances[1]];
        dropInstances[1].connectedTo = [dropInstances[0], dropInstances[2]];
        dropInstances[2].connectedTo = [dropInstances[1]];
        fixture.detectChanges();

        const groups = fixture.componentInstance.groupedDragItems;
        const dropZones = dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const intermediateRect = dropZones[1].getBoundingClientRect();
        const finalRect = dropZones[2].getBoundingClientRect();

        startDraggingViaMouse(fixture, item.element.nativeElement);

        const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

        expect(placeholder).toBeTruthy();
        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be inside the first container.')
          .toBe(true);

        dispatchMouseEvent(
          document,
          'mousemove',
          intermediateRect.left + 1,
          intermediateRect.top + 1,
        );
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to be inside second container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mousemove', finalRect.left + 1, finalRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to remain in the second container.')
          .toBe(true);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

        expect(event).toBeTruthy();
        expect(event).toEqual(
          jasmine.objectContaining({
            previousIndex: 1,
            currentIndex: 1,
            item: groups[0][1],
            container: dropInstances[1],
            previousContainer: dropInstances[0],
            isPointerOverContainer: false,
          }),
        );
      }),
    );

    it(
      'should return the item to its initial position, if sorting in the source container ' +
        'was disabled',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();

        const groups = fixture.componentInstance.groupedDragItems;
        const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

        fixture.componentInstance.dropInstances.first.sortingDisabled = true;
        startDraggingViaMouse(fixture, item.element.nativeElement);

        const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

        expect(placeholder).toBeTruthy();
        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be inside the first container.')
          .toBe(true);
        expect(getElementIndexByPosition(placeholder, 'top'))
          .withContext('Expected placeholder to be at item index.')
          .toBe(1);

        dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to be inside second container.')
          .toBe(true);
        expect(getElementIndexByPosition(placeholder, 'top'))
          .withContext('Expected placeholder to be at the target index.')
          .toBe(3);

        const firstInitialSiblingRect = groups[0][0].element.nativeElement.getBoundingClientRect();

        // Return the item to an index that is different from the initial one.
        dispatchMouseEvent(
          document,
          'mousemove',
          firstInitialSiblingRect.left + 1,
          firstInitialSiblingRect.top + 1,
        );
        fixture.detectChanges();

        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be back inside first container.')
          .toBe(true);
        expect(getElementIndexByPosition(placeholder, 'top'))
          .withContext('Expected placeholder to be back at the initial index.')
          .toBe(1);

        dispatchMouseEvent(document, 'mouseup');
        fixture.detectChanges();

        expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
      }),
    );

    it(
      'should enter an item into the correct index when returning to the initial container, if ' +
        'sorting is enabled',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedDropZones);
        fixture.detectChanges();

        const groups = fixture.componentInstance.groupedDragItems;
        const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
        const item = groups[0][1];
        const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

        // Explicitly enable just in case.
        fixture.componentInstance.dropInstances.first.sortingDisabled = false;
        startDraggingViaMouse(fixture, item.element.nativeElement);

        const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

        expect(placeholder).toBeTruthy();
        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be inside the first container.')
          .toBe(true);
        expect(getElementIndexByPosition(placeholder, 'top'))
          .withContext('Expected placeholder to be at item index.')
          .toBe(1);

        dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[1].contains(placeholder))
          .withContext('Expected placeholder to be inside second container.')
          .toBe(true);
        expect(getElementIndexByPosition(placeholder, 'top'))
          .withContext('Expected placeholder to be at the target index.')
          .toBe(3);

        const nextTargetRect = groups[0][3].element.nativeElement.getBoundingClientRect();

        // Return the item to an index that is different from the initial one.
        dispatchMouseEvent(document, 'mousemove', nextTargetRect.left + 1, nextTargetRect.top + 1);
        fixture.detectChanges();

        expect(dropZones[0].contains(placeholder))
          .withContext('Expected placeholder to be back inside first container.')
          .toBe(true);
        expect(getElementIndexByPosition(placeholder, 'top'))
          .withContext('Expected placeholder to be at the index at which it entered.')
          .toBe(2);
      }),
    );

    it('should return the last item to initial position when dragging back into a container with disabled sorting', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const dropZones = fixture.componentInstance.dropInstances.map(d => d.element.nativeElement);
      const lastIndex = groups[0].length - 1;
      const lastItem = groups[0][lastIndex];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      fixture.componentInstance.dropInstances.first.sortingDisabled = true;
      startDraggingViaMouse(fixture, lastItem.element.nativeElement);

      const placeholder = dropZones[0].querySelector('.cdk-drag-placeholder')!;

      expect(placeholder).toBeTruthy();
      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be inside the first container.')
        .toBe(true);
      expect(getElementIndexByPosition(placeholder, 'top'))
        .withContext('Expected placeholder to be at item index.')
        .toBe(lastIndex);

      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();

      expect(dropZones[1].contains(placeholder))
        .withContext('Expected placeholder to be inside second container.')
        .toBe(true);
      expect(getElementIndexByPosition(placeholder, 'top'))
        .withContext('Expected placeholder to be at the target index.')
        .toBe(3);

      const firstInitialSiblingRect = groups[0][0].element.nativeElement.getBoundingClientRect();

      // Return the item to an index that is different from the initial one.
      dispatchMouseEvent(
        document,
        'mousemove',
        firstInitialSiblingRect.left,
        firstInitialSiblingRect.top,
      );
      fixture.detectChanges();

      expect(dropZones[0].contains(placeholder))
        .withContext('Expected placeholder to be back inside first container.')
        .toBe(true);
      expect(getElementIndexByPosition(placeholder, 'top'))
        .withContext('Expected placeholder to be back at the initial index.')
        .toBe(lastIndex);

      dispatchMouseEvent(document, 'mouseup');
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).not.toHaveBeenCalled();
    }));

    it(
      'should toggle a class when dragging an item inside a wrapper component component ' +
        'with OnPush change detection',
      fakeAsync(() => {
        const fixture = createComponent(ConnectedWrappedDropZones, [], 0, [
          WrappedDropContainerComponent,
        ]);
        fixture.detectChanges();

        const [startZone, targetZone] = fixture.nativeElement.querySelectorAll('.cdk-drop-list');
        const item = startZone.querySelector('.cdk-drag');
        const targetRect = targetZone.getBoundingClientRect();

        expect(startZone.classList).not.toContain(
          'cdk-drop-list-dragging',
          'Expected start not to have dragging class on init.',
        );
        expect(targetZone.classList).not.toContain(
          'cdk-drop-list-dragging',
          'Expected target not to have dragging class on init.',
        );

        startDraggingViaMouse(fixture, item);

        expect(startZone.classList)
          .withContext('Expected start to have dragging class after dragging has started.')
          .toContain('cdk-drop-list-dragging');
        expect(targetZone.classList)
          .not.withContext('Expected target not to have dragging class after dragging has started.')
          .toContain('cdk-drop-list-dragging');

        dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
        fixture.detectChanges();

        expect(startZone.classList)
          .not.withContext(
            'Expected start not to have dragging class once item has been moved over.',
          )
          .toContain('cdk-drop-list-dragging');
        expect(targetZone.classList)
          .withContext('Expected target to have dragging class once item has been moved over.')
          .toContain('cdk-drop-list-dragging');
      }),
    );

    it('should dispatch an event when an item enters a new container', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const item = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      startDraggingViaMouse(fixture, item.element.nativeElement);

      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();

      const containerEnterEvent = fixture.componentInstance.enteredSpy.calls.mostRecent().args[0];
      const itemEnterEvent = fixture.componentInstance.itemEnteredSpy.calls.mostRecent().args[0];
      const expectedEvent: CdkDragEnter = {
        container: fixture.componentInstance.dropInstances.toArray()[1],
        item: item,
        currentIndex: 2,
      };

      expect(containerEnterEvent).toEqual(expectedEvent);
      expect(itemEnterEvent).toEqual(expectedEvent);
    }));

    it('should not throw if dragging was interrupted as a result of the entered event', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const item = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      fixture.componentInstance.enteredSpy.and.callFake(() => {
        fixture.componentInstance.todo = [];
        fixture.detectChanges();
      });

      expect(() => {
        dragElementViaMouse(
          fixture,
          item.element.nativeElement,
          targetRect.left + 1,
          targetRect.top + 1,
        );
        flush();
        fixture.detectChanges();
      }).not.toThrow();
    }));

    it('should be able to drop into a new container after scrolling into view', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      // Make the page scrollable and scroll the items out of view.
      const cleanup = makeScrollable();
      scrollTo(0, 4000);
      dispatchFakeEvent(document, 'scroll');
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const item = groups[0][1];

      // Start dragging and then scroll the elements back into view.
      startDraggingViaMouse(fixture, item.element.nativeElement);
      scrollTo(0, 0);
      dispatchFakeEvent(document, 'scroll');

      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();
      dispatchMouseEvent(document, 'mousemove', targetRect.left + 1, targetRect.top + 1);
      dispatchMouseEvent(document, 'mouseup', targetRect.left + 1, targetRect.top + 1);
      fixture.detectChanges();
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item,
        container: fixture.componentInstance.dropInstances.toArray()[1],
        previousContainer: fixture.componentInstance.dropInstances.first,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });

      cleanup();
    }));

    it('should be able to drop into a new container inside the Shadow DOM', fakeAsync(() => {
      // This test is only relevant for Shadow DOM-supporting browsers.
      if (!_supportsShadowDom()) {
        return;
      }

      const fixture = createComponent(
        ConnectedDropZones,
        [],
        undefined,
        [],
        ViewEncapsulation.ShadowDom,
      );
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const item = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        item.element.nativeElement,
        targetRect.left + 1,
        targetRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item,
        container: fixture.componentInstance.dropInstances.toArray()[1],
        previousContainer: fixture.componentInstance.dropInstances.first,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should be able to drop into a new container inside the Shadow DOM and ngIf', fakeAsync(() => {
      // This test is only relevant for Shadow DOM-supporting browsers.
      if (!_supportsShadowDom()) {
        return;
      }

      const fixture = createComponent(ConnectedDropZonesInsideShadowRootWithNgIf);
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const item = groups[0][1];
      const targetRect = groups[1][2].element.nativeElement.getBoundingClientRect();

      dragElementViaMouse(
        fixture,
        item.element.nativeElement,
        targetRect.left + 1,
        targetRect.top + 1,
      );
      flush();
      fixture.detectChanges();

      expect(fixture.componentInstance.droppedSpy).toHaveBeenCalledTimes(1);

      const event = fixture.componentInstance.droppedSpy.calls.mostRecent().args[0];

      expect(event).toEqual({
        previousIndex: 1,
        currentIndex: 3,
        item,
        container: fixture.componentInstance.dropInstances.toArray()[1],
        previousContainer: fixture.componentInstance.dropInstances.first,
        isPointerOverContainer: true,
        distance: {x: jasmine.any(Number), y: jasmine.any(Number)},
        dropPoint: {x: jasmine.any(Number), y: jasmine.any(Number)},
      });
    }));

    it('should not throw if its next sibling is removed while dragging', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZonesWithSingleItems);
      fixture.detectChanges();

      const items = fixture.componentInstance.dragItems.toArray();
      const item = items[0];
      const nextSibling = items[1].element.nativeElement;
      const extraSibling = document.createElement('div');
      const targetRect = nextSibling.getBoundingClientRect();

      // Manually insert an element after the node to simulate an external package.
      nextSibling.parentNode!.insertBefore(extraSibling, nextSibling);

      dragElementViaMouse(
        fixture,
        item.element.nativeElement,
        targetRect.left + 1,
        targetRect.top + 1,
      );

      // Remove the extra node after the element was dropped, but before the animation is over.
      extraSibling.remove();

      expect(() => {
        flush();
        fixture.detectChanges();
      }).not.toThrow();
    }));

    it('should warn when the connected container ID does not exist', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();

      fixture.componentInstance.dropInstances.first.connectedTo = 'does-not-exist';
      fixture.detectChanges();

      const groups = fixture.componentInstance.groupedDragItems;
      const element = groups[0][1].element.nativeElement;

      spyOn(console, 'warn');
      dragElementViaMouse(fixture, element, 0, 0);
      flush();
      fixture.detectChanges();

      expect(console.warn).toHaveBeenCalledWith(
        `CdkDropList could not find connected drop ` + `list with id "does-not-exist"`,
      );
    }));

    it('should not be able to start a drag sequence while a connected container is active', fakeAsync(() => {
      const fixture = createComponent(ConnectedDropZones);
      fixture.detectChanges();
      const item = fixture.componentInstance.groupedDragItems[0][0];
      const itemInOtherList = fixture.componentInstance.groupedDragItems[1][0];

      startDraggingViaMouse(fixture, item.element.nativeElement);

      expect(document.querySelectorAll('.cdk-drag-dragging').length)
        .withContext('Expected one item to be dragged initially.')
        .toBe(1);

      startDraggingViaMouse(fixture, itemInOtherList.element.nativeElement);

      expect(document.querySelectorAll('.cdk-drag-dragging').length)
        .withContext('Expected only one item to continue to be dragged.')
        .toBe(1);
    }));

    it('should insert the preview inside the shadow root by default', fakeAsync(() => {
      // This test is only relevant for Shadow DOM-supporting browsers.
      if (!_supportsShadowDom()) {
        return;
      }

      const fixture = createComponent(
        ConnectedDropZones,
        [],
        undefined,
        [],
        ViewEncapsulation.ShadowDom,
      );
      fixture.detectChanges();
      const item = fixture.componentInstance.groupedDragItems[0][1];

      startDraggingViaMouse(fixture, item.element.nativeElement);
      fixture.detectChanges();

      // `querySelector` doesn't descend into the shadow DOM so we can assert that the preview
      // isn't at its default location by searching for it at the `document` level.
      expect(document.querySelector('.cdk-drag-preview')).toBeFalsy();
    }));
  });

  describe('with nested drags', () => {
    it('should not move draggable container when dragging child (multitouch)', fakeAsync(() => {
      const fixture = createComponent(NestedDragsComponent, [], 10);
      fixture.detectChanges();

      // First finger drags container (less then threshold)
      startDraggingViaTouch(fixture, fixture.componentInstance.container.nativeElement);
      continueDraggingViaTouch(fixture, 2, 0);

      // Second finger drags container
      startDraggingViaTouch(fixture, fixture.componentInstance.container.nativeElement);
      continueDraggingViaTouch(fixture, 0, 10);
      continueDraggingViaTouch(fixture, 0, 20);

      // First finger releases
      stopDraggingViaTouch(fixture, 0, 20);
      // Second finger releases
      stopDraggingViaTouch(fixture, 0, 10);

      // Container spies worked
      const containerDragStartedCount =
        fixture.componentInstance.containerDragStartedSpy.calls.count();
      const containerDragMovedCount = fixture.componentInstance.containerDragMovedSpy.calls.count();
      const containerDragReleasedCount =
        fixture.componentInstance.containerDragReleasedSpy.calls.count();

      expect(containerDragStartedCount).toBeGreaterThan(0);
      expect(containerDragMovedCount).toBeGreaterThan(0);
      expect(containerDragReleasedCount).toBeGreaterThan(0);

      // Drag item
      startDraggingViaTouch(fixture, fixture.componentInstance.item.nativeElement);
      continueDraggingViaTouch(fixture, 20, 20);
      continueDraggingViaTouch(fixture, 40, 40);
      stopDraggingViaTouch(fixture, 60, 60);

      // Spies on item worked
      expect(fixture.componentInstance.itemDragStartedSpy).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.itemDragMovedSpy).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.itemDragReleasedSpy).toHaveBeenCalledTimes(1);

      // Spies on container stay intact
      expect(fixture.componentInstance.containerDragStartedSpy).toHaveBeenCalledTimes(
        containerDragStartedCount,
      );
      expect(fixture.componentInstance.containerDragMovedSpy).toHaveBeenCalledTimes(
        containerDragMovedCount,
      );
      expect(fixture.componentInstance.containerDragReleasedSpy).toHaveBeenCalledTimes(
        containerDragReleasedCount,
      );
    }));

    it('should stop event propagation when dragging a nested item', fakeAsync(() => {
      const fixture = createComponent(NestedDragsComponent);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.item.nativeElement;

      const event = createMouseEvent('mousedown');
      spyOn(event, 'stopPropagation').and.callThrough();

      dispatchEvent(dragElement, event);
      fixture.detectChanges();

      expect(event.stopPropagation).toHaveBeenCalled();
    }));

    it('should stop event propagation when dragging item nested via ng-template', fakeAsync(() => {
      const fixture = createComponent(NestedDragsThroughTemplate);
      fixture.detectChanges();
      const dragElement = fixture.componentInstance.item.nativeElement;

      const event = createMouseEvent('mousedown');
      spyOn(event, 'stopPropagation').and.callThrough();

      dispatchEvent(dragElement, event);
      fixture.detectChanges();

      expect(event.stopPropagation).toHaveBeenCalled();
    }));
  });
});

@Component({
  template: `
    <div class="wrapper" style="width: 200px; height: 200px; background: green;">
      <div
        cdkDrag
        [cdkDragBoundary]="boundary"
        [cdkDragStartDelay]="dragStartDelay"
        [cdkDragConstrainPosition]="constrainPosition"
        [cdkDragFreeDragPosition]="freeDragPosition"
        (cdkDragStarted)="startedSpy($event)"
        (cdkDragReleased)="releasedSpy($event)"
        (cdkDragEnded)="endedSpy($event)"
        #dragElement
        style="width: 100px; height: 100px; background: red;"></div>
    </div>
  `,
})
class StandaloneDraggable {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
  startedSpy = jasmine.createSpy('started spy');
  endedSpy = jasmine.createSpy('ended spy');
  releasedSpy = jasmine.createSpy('released spy');
  boundary: string | HTMLElement;
  dragStartDelay: number | string | {touch: number; mouse: number};
  constrainPosition: (point: Point) => Point;
  freeDragPosition?: {x: number; y: number};
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkDrag #dragElement style="width: 100px; height: 100px; background: red;"></div>
  `,
})
class StandaloneDraggableWithOnPush {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
}

@Component({
  template: `
    <div #dragElement cdkDrag [cdkDragDisabled]="draggingDisabled"
      style="width: 100px; height: 100px; background: red; position: relative">
      <div #handleElement cdkDragHandle style="width: 10px; height: 10px; background: green;"></div>
    </div>
  `,
})
class StandaloneDraggableWithHandle {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('handleElement') handleElement: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
  @ViewChild(CdkDragHandle) handleInstance: CdkDragHandle;
  draggingDisabled = false;
}

@Component({
  template: `
    <div #dragElement cdkDrag
      style="width: 100px; height: 100px; background: red; position: relative">
      <div
        #handleElement
        cdkDragHandle
        [cdkDragHandleDisabled]="disableHandle"
        style="width: 10px; height: 10px; background: green;"></div>
    </div>
  `,
})
class StandaloneDraggableWithPreDisabledHandle {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('handleElement') handleElement: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
  disableHandle = true;
}

@Component({
  template: `
    <div #dragElement cdkDrag
      style="width: 100px; height: 100px; background: red; position: relative">
      <div
        #handleElement
        *ngIf="showHandle"
        cdkDragHandle style="width: 10px; height: 10px; background: green;"></div>
    </div>
  `,
})
class StandaloneDraggableWithDelayedHandle {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('handleElement') handleElement: ElementRef<HTMLElement>;
  showHandle = false;
}

@Component({
  template: `
    <div #dragElement cdkDrag
      style="width: 100px; height: 100px; background: red; position: relative">

      <passthrough-component>
        <div
          #handleElement
          cdkDragHandle
          style="width: 10px; height: 10px; background: green;"></div>
      </passthrough-component>
    </div>
  `,
})
class StandaloneDraggableWithIndirectHandle {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('handleElement') handleElement: ElementRef<HTMLElement>;
}

@Component({
  selector: 'shadow-wrapper',
  template: '<ng-content></ng-content>',
  encapsulation: ViewEncapsulation.ShadowDom,
})
class ShadowWrapper {}

@Component({
  template: `
    <div #dragElement cdkDrag style="width: 100px; height: 100px; background: red;">
      <div cdkDragHandle style="width: 10px; height: 10px;">
        <shadow-wrapper>
          <div #handleChild style="width: 10px; height: 10px; background: green;"></div>
        </shadow-wrapper>
      </div>
    </div>
  `,
})
class StandaloneDraggableWithShadowInsideHandle {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('handleChild') handleChild: ElementRef<HTMLElement>;
}

@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
    .cdk-drag-handle {
      position: absolute;
      top: 0;
      background: green;
      width: 10px;
      height: 10px;
    }
  `,
  ],
  template: `
    <div #dragElement cdkDrag
      style="width: 100px; height: 100px; background: red; position: relative">
      <div cdkDragHandle style="left: 0;"></div>
      <div cdkDragHandle style="right: 0;"></div>
    </div>
  `,
})
class StandaloneDraggableWithMultipleHandles {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChildren(CdkDragHandle) handles: QueryList<CdkDragHandle>;
}

const DROP_ZONE_FIXTURE_TEMPLATE = `
  <div
    cdkDropList
    class="drop-list scroll-container"
    style="width: 100px; background: pink;"
    [id]="dropZoneId"
    [cdkDropListData]="items"
    (cdkDropListSorted)="sortedSpy($event)"
    (cdkDropListDropped)="droppedSpy($event)">
    <div
      *ngFor="let item of items"
      cdkDrag
      [cdkDragData]="item"
      [cdkDragBoundary]="boundarySelector"
      [cdkDragPreviewClass]="previewClass"
      [cdkDragPreviewContainer]="previewContainer"
      [style.height.px]="item.height"
      [style.margin-bottom.px]="item.margin"
      (cdkDragStarted)="startedSpy($event)"
      style="width: 100%; background: red;">{{item.value}}</div>
  </div>

  <div #alternatePreviewContainer></div>
`;

@Component({template: DROP_ZONE_FIXTURE_TEMPLATE})
class DraggableInDropZone implements AfterViewInit {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  @ViewChild(CdkDropList) dropInstance: CdkDropList;
  @ViewChild('alternatePreviewContainer') alternatePreviewContainer: ElementRef<HTMLElement>;
  items = [
    {value: 'Zero', height: ITEM_HEIGHT, margin: 0},
    {value: 'One', height: ITEM_HEIGHT, margin: 0},
    {value: 'Two', height: ITEM_HEIGHT, margin: 0},
    {value: 'Three', height: ITEM_HEIGHT, margin: 0},
  ];
  dropZoneId = 'items';
  boundarySelector: string;
  previewClass: string | string[];
  sortedSpy = jasmine.createSpy('sorted spy');
  droppedSpy = jasmine.createSpy('dropped spy').and.callFake((event: CdkDragDrop<string[]>) => {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  });
  startedSpy = jasmine.createSpy('started spy');
  previewContainer: PreviewContainer = 'global';

  constructor(protected _elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Firefox preserves the `scrollTop` value from previous similar containers. This
    // could throw off test assertions and result in flaky results.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=959812.
    this.dropInstance.element.nativeElement.scrollTop = 0;
  }
}

@Component({
  template: DROP_ZONE_FIXTURE_TEMPLATE,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DraggableInOnPushDropZone extends DraggableInDropZone {}

@Component({
  template: DROP_ZONE_FIXTURE_TEMPLATE,

  // Note that it needs a margin to ensure that it's not flush against the viewport
  // edge which will cause the viewport to scroll, rather than the list.
  styles: [
    `
    .drop-list {
      max-height: 200px;
      overflow: auto;
      margin: 10vw 0 0 10vw;
    }
  `,
  ],
})
class DraggableInScrollableVerticalDropZone extends DraggableInDropZone {
  constructor(elementRef: ElementRef) {
    super(elementRef);

    for (let i = 0; i < 60; i++) {
      this.items.push({value: `Extra item ${i}`, height: ITEM_HEIGHT, margin: 0});
    }
  }
}

@Component({
  template: `
    <div
      #scrollContainer
      class="scroll-container"
      cdkScrollable>${DROP_ZONE_FIXTURE_TEMPLATE}</div>`,

  // Note that it needs a margin to ensure that it's not flush against the viewport
  // edge which will cause the viewport to scroll, rather than the list.
  styles: [
    `
    .scroll-container {
      max-height: 200px;
      overflow: auto;
      margin: 10vw 0 0 10vw;
    }
  `,
  ],
})
class DraggableInScrollableParentContainer extends DraggableInDropZone implements AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer: ElementRef<HTMLElement>;

  constructor(elementRef: ElementRef) {
    super(elementRef);

    for (let i = 0; i < 60; i++) {
      this.items.push({value: `Extra item ${i}`, height: ITEM_HEIGHT, margin: 0});
    }
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();

    // Firefox preserves the `scrollTop` value from previous similar containers. This
    // could throw off test assertions and result in flaky results.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=959812.
    this.scrollContainer.nativeElement.scrollTop = 0;
  }
}

@Component({
  // Note that we need the blank `ngSwitch` below to hit the code path that we're testing.
  template: `
    <div
      cdkDropList
      class="drop-list scroll-container"
      style="width: 100px; background: pink;"
      [id]="dropZoneId"
      [cdkDropListData]="items"
      (cdkDropListSorted)="sortedSpy($event)"
      (cdkDropListDropped)="droppedSpy($event)">
        <ng-container [ngSwitch]="true">
          <div
            *ngFor="let item of items"
            cdkDrag
            [cdkDragData]="item"
            [cdkDragBoundary]="boundarySelector"
            [style.height.px]="item.height"
            [style.margin-bottom.px]="item.margin"
            style="width: 100%; background: red;">{{item.value}}</div>
        </ng-container>
    </div>
  `,
})
class DraggableInDropZoneWithContainer extends DraggableInDropZone {}

// Use inline blocks here to avoid flexbox issues and not to have to flip floats in rtl.
const HORIZONTAL_FIXTURE_STYLES = `
  .cdk-drop-list {
    display: block;
    width: 500px;
    background: pink;
    font-size: 0;
  }

  .cdk-drag {
    height: ${ITEM_HEIGHT * 2}px;
    background: red;
    display: inline-block;
  }
`;

const HORIZONTAL_FIXTURE_TEMPLATE = `
  <div
    class="drop-list scroll-container"
    cdkDropList
    cdkDropListOrientation="horizontal"
    [cdkDropListData]="items"
    (cdkDropListDropped)="droppedSpy($event)">
    <div
      *ngFor="let item of items"
      [style.width.px]="item.width"
      [style.margin-right.px]="item.margin"
      [cdkDragBoundary]="boundarySelector"
      cdkDrag>{{item.value}}</div>
  </div>
`;

@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [HORIZONTAL_FIXTURE_STYLES],
  template: HORIZONTAL_FIXTURE_TEMPLATE,
})
class DraggableInHorizontalDropZone implements AfterViewInit {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  @ViewChild(CdkDropList) dropInstance: CdkDropList;
  items = [
    {value: 'Zero', width: ITEM_WIDTH, margin: 0},
    {value: 'One', width: ITEM_WIDTH, margin: 0},
    {value: 'Two', width: ITEM_WIDTH, margin: 0},
    {value: 'Three', width: ITEM_WIDTH, margin: 0},
  ];
  boundarySelector: string;
  droppedSpy = jasmine.createSpy('dropped spy').and.callFake((event: CdkDragDrop<string[]>) => {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  });

  constructor(protected _elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Firefox preserves the `scrollLeft` value from previous similar containers. This
    // could throw off test assertions and result in flaky results.
    // See: https://bugzilla.mozilla.org/show_bug.cgi?id=959812.
    this._elementRef.nativeElement.querySelector('.scroll-container').scrollLeft = 0;
  }
}

@Component({
  template: HORIZONTAL_FIXTURE_TEMPLATE,

  // Note that it needs a margin to ensure that it's not flush against the viewport
  // edge which will cause the viewport to scroll, rather than the list.
  styles: [
    HORIZONTAL_FIXTURE_STYLES,
    `
    .drop-list {
      max-width: 300px;
      margin: 10vw 0 0 10vw;
      overflow: auto;
      white-space: nowrap;
    }
  `,
  ],
})
class DraggableInScrollableHorizontalDropZone extends DraggableInHorizontalDropZone {
  constructor(elementRef: ElementRef) {
    super(elementRef);

    for (let i = 0; i < 60; i++) {
      this.items.push({value: `Extra item ${i}`, width: ITEM_WIDTH, margin: 0});
    }
  }
}

@Component({
  template: `
    <div cdkDropList style="width: 100px; background: pink;">
      <div
        *ngFor="let item of items"
        cdkDrag
        [cdkDragConstrainPosition]="constrainPosition"
        [cdkDragBoundary]="boundarySelector"
        [cdkDragPreviewClass]="previewClass"
        style="width: 100%; height: ${ITEM_HEIGHT}px; background: red;">
          {{item}}

          <ng-container *ngIf="renderCustomPreview">
            <ng-template cdkDragPreview [matchSize]="matchPreviewSize">
              <div
                class="custom-preview"
                style="width: 50px; height: 50px; background: purple;">Custom preview</div>
            </ng-template>
          </ng-container>
      </div>
    </div>
  `,
})
class DraggableInDropZoneWithCustomPreview {
  @ViewChild(CdkDropList) dropInstance: CdkDropList;
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two', 'Three'];
  boundarySelector: string;
  renderCustomPreview = true;
  matchPreviewSize = false;
  previewClass: string | string[];
  constrainPosition: (point: Point) => Point;
}

@Component({
  template: `
    <div cdkDropList style="width: 100px; background: pink;">
      <div
        *ngFor="let item of items"
        cdkDrag
        [cdkDragConstrainPosition]="constrainPosition"
        [cdkDragBoundary]="boundarySelector"
        style="width: 100%; height: ${ITEM_HEIGHT}px; background: red;">
          {{item}}
          <ng-template cdkDragPreview>Hello {{item}}</ng-template>
      </div>
    </div>
  `,
})
class DraggableInDropZoneWithCustomTextOnlyPreview {
  @ViewChild(CdkDropList) dropInstance: CdkDropList;
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two', 'Three'];
}

@Component({
  template: `
    <div cdkDropList style="width: 100px; background: pink;">
      <div
        *ngFor="let item of items"
        cdkDrag
        style="width: 100%; height: ${ITEM_HEIGHT}px; background: red;">
          {{item}}
          <ng-template cdkDragPreview>
            <span>Hello</span>
            <span>{{item}}</span>
          </ng-template>
      </div>
    </div>
  `,
})
class DraggableInDropZoneWithCustomMultiNodePreview {
  @ViewChild(CdkDropList) dropInstance: CdkDropList;
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two', 'Three'];
}

@Component({
  template: `
    <div
      cdkDropList
      (cdkDropListDropped)="droppedSpy($event)"
      style="width: 100px; background: pink;">
      <div *ngFor="let item of items" cdkDrag
        style="width: 100%; height: ${ITEM_HEIGHT}px; background: red;">
          {{item}}
          <ng-container *ngIf="renderPlaceholder">
            <div
              class="custom-placeholder"
              [ngClass]="extraPlaceholderClass"
              *cdkDragPlaceholder>Custom placeholder</div>
          </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
    .tall-placeholder {
      height: ${ITEM_HEIGHT * 3}px;
    }
  `,
  ],
})
class DraggableInDropZoneWithCustomPlaceholder {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two', 'Three'];
  renderPlaceholder = true;
  extraPlaceholderClass = '';
  droppedSpy = jasmine.createSpy('dropped spy');
}

@Component({
  template: `
    <div cdkDropList style="width: 100px; background: pink;">
      <div *ngFor="let item of items" cdkDrag
        style="width: 100%; height: ${ITEM_HEIGHT}px; background: red;">
          {{item}}
          <ng-template cdkDragPlaceholder>Hello {{item}}</ng-template>
      </div>
    </div>
  `,
})
class DraggableInDropZoneWithCustomTextOnlyPlaceholder {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two', 'Three'];
}

@Component({
  template: `
    <div cdkDropList style="width: 100px; background: pink;">
      <div *ngFor="let item of items" cdkDrag
        style="width: 100%; height: ${ITEM_HEIGHT}px; background: red;">
          {{item}}
          <ng-template cdkDragPlaceholder>
            <span>Hello</span>
            <span>{{item}}</span>
          </ng-template>
      </div>
    </div>
  `,
})
class DraggableInDropZoneWithCustomMultiNodePlaceholder {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two', 'Three'];
}

const CONNECTED_DROP_ZONES_STYLES = [
  `
  .cdk-drop-list {
    display: block;
    width: 100px;
    min-height: ${ITEM_HEIGHT}px;
    background: hotpink;
  }

  .cdk-drag {
    display: block;
    height: ${ITEM_HEIGHT}px;
    background: red;
  }
`,
];

const CONNECTED_DROP_ZONES_TEMPLATE = `
  <div
    cdkDropList
    #todoZone="cdkDropList"
    [cdkDropListData]="todo"
    [cdkDropListConnectedTo]="[doneZone]"
    (cdkDropListDropped)="droppedSpy($event)"
    (cdkDropListEntered)="enteredSpy($event)">
    <div
      [cdkDragData]="item"
      (cdkDragEntered)="itemEnteredSpy($event)"
      *ngFor="let item of todo"
      cdkDrag>{{item}}</div>
  </div>

  <div
    cdkDropList
    #doneZone="cdkDropList"
    [cdkDropListData]="done"
    [cdkDropListConnectedTo]="[todoZone]"
    (cdkDropListDropped)="droppedSpy($event)"
    (cdkDropListEntered)="enteredSpy($event)">
    <div
      [cdkDragData]="item"
      (cdkDragEntered)="itemEnteredSpy($event)"
      *ngFor="let item of done"
      cdkDrag>{{item}}</div>
  </div>

  <div
    cdkDropList
    #extraZone="cdkDropList"
    [cdkDropListData]="extra"
    (cdkDropListDropped)="droppedSpy($event)"
    (cdkDropListEntered)="enteredSpy($event)">
    <div
      [cdkDragData]="item"
      (cdkDragEntered)="itemEnteredSpy($event)"
      *ngFor="let item of extra"
      cdkDrag>{{item}}</div>
  </div>
`;

@Component({
  encapsulation: ViewEncapsulation.None,
  styles: CONNECTED_DROP_ZONES_STYLES,
  template: CONNECTED_DROP_ZONES_TEMPLATE,
})
class ConnectedDropZones implements AfterViewInit {
  @ViewChildren(CdkDrag) rawDragItems: QueryList<CdkDrag>;
  @ViewChildren(CdkDropList) dropInstances: QueryList<CdkDropList>;

  groupedDragItems: CdkDrag[][] = [];
  todo = ['Zero', 'One', 'Two', 'Three'];
  done = ['Four', 'Five', 'Six'];
  extra = [];
  droppedSpy = jasmine.createSpy('dropped spy');
  enteredSpy = jasmine.createSpy('entered spy');
  itemEnteredSpy = jasmine.createSpy('item entered spy');

  ngAfterViewInit() {
    this.dropInstances.forEach((dropZone, index) => {
      if (!this.groupedDragItems[index]) {
        this.groupedDragItems.push([]);
      }

      this.groupedDragItems[index].push(...dropZone.getSortedItems());
    });
  }
}

@Component({
  encapsulation: ViewEncapsulation.ShadowDom,
  styles: CONNECTED_DROP_ZONES_STYLES,
  template: `<div *ngIf="true">${CONNECTED_DROP_ZONES_TEMPLATE}</div>`,
})
class ConnectedDropZonesInsideShadowRootWithNgIf extends ConnectedDropZones {}

@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
    .cdk-drop-list {
      display: block;
      width: 100px;
      min-height: ${ITEM_HEIGHT}px;
      background: hotpink;
    }

    .cdk-drag {
      display: block;
      height: ${ITEM_HEIGHT}px;
      background: red;
    }
  `,
  ],
  template: `
    <div cdkDropListGroup [cdkDropListGroupDisabled]="groupDisabled">
      <div
        cdkDropList
        [cdkDropListData]="todo"
        (cdkDropListDropped)="droppedSpy($event)">
        <div [cdkDragData]="item" *ngFor="let item of todo" cdkDrag>{{item}}</div>
      </div>

      <div
        cdkDropList
        [cdkDropListData]="done"
        (cdkDropListDropped)="droppedSpy($event)">
        <div [cdkDragData]="item" *ngFor="let item of done" cdkDrag>{{item}}</div>
      </div>
    </div>
  `,
})
class ConnectedDropZonesViaGroupDirective extends ConnectedDropZones {
  groupDisabled = false;
}

@Component({
  template: `
    <div #dragRoot class="alternate-root" style="width: 200px; height: 200px; background: hotpink">
      <div
        cdkDrag
        [cdkDragRootElement]="rootElementSelector"
        #dragElement
        style="width: 100px; height: 100px; background: red;"></div>
    </div>
  `,
})
class DraggableWithAlternateRoot {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('dragRoot') dragRoot: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
  rootElementSelector: string;
}

@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
    .cdk-drop-list {
      display: block;
      width: 100px;
      min-height: ${ITEM_HEIGHT}px;
      background: hotpink;
    }

    .cdk-drag {
      display: block;
      height: ${ITEM_HEIGHT}px;
      background: red;
    }
  `,
  ],
  template: `
    <div
      cdkDropList
      #todoZone="cdkDropList"
      [cdkDropListConnectedTo]="[doneZone]"
      (cdkDropListDropped)="droppedSpy($event)">
      <div cdkDrag>One</div>
    </div>

    <div
      cdkDropList
      #doneZone="cdkDropList"
      [cdkDropListConnectedTo]="[todoZone]"
      (cdkDropListDropped)="droppedSpy($event)">
      <div cdkDrag>Two</div>
    </div>
  `,
})
class ConnectedDropZonesWithSingleItems {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  @ViewChildren(CdkDropList) dropInstances: QueryList<CdkDropList>;

  droppedSpy = jasmine.createSpy('dropped spy');
}

@Component({
  template: `
    <div cdkDropListGroup #group="cdkDropListGroup">
      <div cdkDropList #listOne="cdkDropList">
        <div cdkDropList #listThree="cdkDropList"></div>
        <div cdkDropList #listFour="cdkDropList"></div>
      </div>

      <div cdkDropList #listTwo="cdkDropList"></div>
    </div>
  `,
})
class NestedDropListGroups {
  @ViewChild('group') group: CdkDropListGroup<CdkDropList>;
  @ViewChild('listOne') listOne: CdkDropList;
  @ViewChild('listTwo') listTwo: CdkDropList;
}

@Component({
  template: `
    <ng-container cdkDrag></ng-container>
  `,
})
class DraggableOnNgContainer {}

@Component({
  template: `
    <div cdkDrag>
      <ng-container cdkDragHandle></ng-container>
    </div>
  `,
})
class DragHandleOnNgContainer {}

@Component({
  template: `
    <ng-container cdkDropList></ng-container>
  `,
})
class DropListOnNgContainer {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div cdkDropList style="width: 100px; background: pink;">
      <div *ngFor="let item of items"
        cdkDrag
        [style.height.px]="item.height"
        style="width: 100%; background: red;">{{item.value}}</div>
    </div>
  `,
})
class DraggableInDropZoneWithoutEvents {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  @ViewChild(CdkDropList) dropInstance: CdkDropList;
  items = [
    {value: 'Zero', height: ITEM_HEIGHT},
    {value: 'One', height: ITEM_HEIGHT},
    {value: 'Two', height: ITEM_HEIGHT},
    {value: 'Three', height: ITEM_HEIGHT},
  ];
}

@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
    .cdk-drop-list {
      display: block;
      width: 100px;
      min-height: ${ITEM_HEIGHT}px;
      background: hotpink;
    }

    .cdk-drag {
      display: block;
      height: ${ITEM_HEIGHT}px;
      background: red;
    }
  `,
  ],
  template: `
    <div cdkDropListGroup>
      <wrapped-drop-container [items]="todo"></wrapped-drop-container>
      <wrapped-drop-container [items]="done"></wrapped-drop-container>
    </div>
  `,
})
class ConnectedWrappedDropZones {
  todo = ['Zero', 'One', 'Two', 'Three'];
  done = ['Four', 'Five', 'Six'];
}

@Component({
  template: `
    <div
      class="drop-list scroll-container"
      cdkDropList
      style="width: 100px; background: pink;"
      [id]="dropZoneId"
      [cdkDropListData]="items"
      (cdkDropListSorted)="sortedSpy($event)"
      (cdkDropListDropped)="droppedSpy($event)">
      <div
        *ngFor="let item of items"
        cdkDrag
        [cdkDragData]="item"
        [style.height.px]="item.height"
        [style.margin-bottom.px]="item.margin"
        style="width: 100%; background: red;">
          {{item.value}}
          <canvas width="100px" height="100px"></canvas>
        </div>
    </div>
  `,
})
class DraggableWithCanvasInDropZone extends DraggableInDropZone implements AfterViewInit {
  constructor(elementRef: ElementRef<HTMLElement>) {
    super(elementRef);
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    const canvases = this._elementRef.nativeElement.querySelectorAll('canvas');

    // Add a circle to all the canvases.
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const context = canvas.getContext('2d')!;
      context.beginPath();
      context.arc(50, 50, 40, 0, 2 * Math.PI);
      context.stroke();
    }
  }
}

@Component({
  template: `
    <div
      class="drop-list scroll-container"
      cdkDropList
      style="width: 100px; background: pink;"
      [id]="dropZoneId"
      [cdkDropListData]="items"
      (cdkDropListSorted)="sortedSpy($event)"
      (cdkDropListDropped)="droppedSpy($event)">
      <div
        *ngFor="let item of items"
        cdkDrag
        [cdkDragData]="item"
        [style.height.px]="item.height"
        [style.margin-bottom.px]="item.margin"
        style="width: 100%; background: red;">
          {{item.value}}
          <canvas width="0" height="0"></canvas>
        </div>
    </div>
  `,
})
class DraggableWithInvalidCanvasInDropZone extends DraggableInDropZone {}

/**
 * Component that passes through whatever content is projected into it.
 * Used to test having drag elements being projected into a component.
 */
@Component({
  selector: 'passthrough-component',
  template: '<ng-content></ng-content>',
})
class PassthroughComponent {}

/** Component that wraps a drop container and uses OnPush change detection. */
@Component({
  selector: 'wrapped-drop-container',
  template: `
    <div cdkDropList [cdkDropListData]="items">
      <div *ngFor="let item of items" cdkDrag>{{item}}</div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WrappedDropContainerComponent {
  @Input() items: string[];
}

@Component({
  styles: [
    `
    :host {
      height: 400px;
      width: 400px;
      position: absolute;
    }
    .container {
      height: 200px;
      width: 200px;
      position: absolute;
    }
    .item {
      height: 50px;
      width: 50px;
      position: absolute;
    }
  `,
  ],
  template: `
    <div
      cdkDrag
      #container
      class="container"
      (cdkDragStarted)="containerDragStartedSpy($event)"
      (cdkDragMoved)="containerDragMovedSpy($event)"
      (cdkDragReleased)="containerDragReleasedSpy($event)">
      <div
        cdkDrag
        class="item"
        #item
        (cdkDragStarted)="itemDragStartedSpy($event)"
        (cdkDragMoved)="itemDragMovedSpy($event)"
        (cdkDragReleased)="itemDragReleasedSpy($event)">
      </div>
    </div>`,
})
class NestedDragsComponent {
  @ViewChild('container') container: ElementRef;
  @ViewChild('item') item: ElementRef;

  containerDragStartedSpy = jasmine.createSpy('container drag started spy');
  containerDragMovedSpy = jasmine.createSpy('container drag moved spy');
  containerDragReleasedSpy = jasmine.createSpy('container drag released spy');
  itemDragStartedSpy = jasmine.createSpy('item drag started spy');
  itemDragMovedSpy = jasmine.createSpy('item drag moved spy');
  itemDragReleasedSpy = jasmine.createSpy('item drag released spy');
}

@Component({
  styles: [
    `
    :host {
      height: 400px;
      width: 400px;
      position: absolute;
    }
    .container {
      height: 200px;
      width: 200px;
      position: absolute;
    }
    .item {
      height: 50px;
      width: 50px;
      position: absolute;
    }
  `,
  ],
  template: `
    <div
      cdkDrag
      #container
      class="container"
      (cdkDragStarted)="containerDragStartedSpy($event)"
      (cdkDragMoved)="containerDragMovedSpy($event)"
      (cdkDragReleased)="containerDragReleasedSpy($event)">
      <ng-container [ngTemplateOutlet]="itemTemplate"></ng-container>
    </div>

    <ng-template #itemTemplate>
      <div
        cdkDrag
        class="item"
        #item
        (cdkDragStarted)="itemDragStartedSpy($event)"
        (cdkDragMoved)="itemDragMovedSpy($event)"
        (cdkDragReleased)="itemDragReleasedSpy($event)">
      </div>
    </ng-template>
  `,
})
class NestedDragsThroughTemplate {
  @ViewChild('container') container: ElementRef;
  @ViewChild('item') item: ElementRef;
}

@Component({
  styles: [
    `
    .drop-list {
      width: 100px;
      background: pink;
    }
  `,
  ],
  template: `
    <div cdkDropList class="drop-list" #outerList>
      <div cdkDropList class="drop-list" #innerList>
        <div
          *ngFor="let item of items"
          cdkDrag
          style="width: 100%; background: red; height: ${ITEM_HEIGHT}px;">{{item}}</div>
      </div>
    </div>
  `,
})
class NestedDropZones {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  @ViewChild('outerList') outerList: ElementRef<HTMLElement>;
  @ViewChild('innerList') innerList: ElementRef<HTMLElement>;
  items = ['Zero', 'One', 'Two', 'Three'];
}

@Component({
  template: `<div cdkDrag></div>`,
})
class PlainStandaloneDraggable {
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
}

@Component({
  template: `<div cdkDropList></div>`,
})
class PlainStandaloneDropList {
  @ViewChild(CdkDropList) dropList: CdkDropList;
}

@Component({
  styles: [
    `
    .list {
      display: flex;
      width: 100px;
      flex-direction: row;
    }

    .item {
      display: flex;
      flex-grow: 1;
      flex-basis: 0;
      min-height: 50px;
    }
  `,
  ],
  template: `
    <div class="list" cdkDropList cdkDropListOrientation="horizontal">
      <div *ngFor="let item of items" class="item" cdkDrag>
        {{item}}

        <ng-template cdkDragPreview [matchSize]="true">
          <div class="item">{{item}}</div>
        </ng-template>
      </div>
    </div>
  `,
})
class DraggableInHorizontalFlexDropZoneWithMatchSizePreview {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = ['Zero', 'One', 'Two'];
}

@Component({
  styles: CONNECTED_DROP_ZONES_STYLES,
  template: `
    <div
      cdkDropList
      #todoZone="cdkDropList"
      [cdkDropListData]="todo"
      [cdkDropListConnectedTo]="[doneZone]"
      (cdkDropListDropped)="droppedSpy($event)"
      (cdkDropListEntered)="enteredSpy($event)">
      <div
        [cdkDragData]="item"
        (cdkDragEntered)="itemEnteredSpy($event)"
        *ngFor="let item of todo"
        cdkDrag>{{item}}</div>
    </div>

    <div
      cdkDropList
      #doneZone="cdkDropList"
      [cdkDropListData]="done"
      [cdkDropListConnectedTo]="[todoZone]"
      (cdkDropListDropped)="droppedSpy($event)"
      (cdkDropListEntered)="enteredSpy($event)">

      <div>Hello there</div>
      <div>
        <div
          [cdkDragData]="item"
          (cdkDragEntered)="itemEnteredSpy($event)"
          *ngFor="let item of done"
          cdkDrag>{{item}}</div>
      </div>
    </div>
  `,
})
class ConnectedDropZonesWithIntermediateSibling extends ConnectedDropZones {}

@Component({
  template: `
    <div #dragRoot class="alternate-root" style="width: 200px; height: 200px; background: hotpink">
      <div
        cdkDrag
        cdkDragRootElement=".alternate-root"
        cdkDragHandle
        #dragElement
        style="width: 100px; height: 100px; background: red;"></div>
    </div>
  `,
})
class DraggableWithAlternateRootAndSelfHandle {
  @ViewChild('dragElement') dragElement: ElementRef<HTMLElement>;
  @ViewChild('dragRoot') dragRoot: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
}

@Component({
  template: `
    <div
      cdkDropList
      class="drop-list scroll-container"
      style="width: 100px; background: pink;"
      [id]="dropZoneId"
      [cdkDropListData]="items"
      (cdkDropListSorted)="sortedSpy($event)"
      (cdkDropListDropped)="droppedSpy($event)">
      <div
        *ngFor="let item of items"
        cdkDrag
        [cdkDragData]="item"
        [style.height.px]="item.height"
        [style.margin-bottom.px]="item.margin"
        style="width: 100%; background: red;">
          {{item.value}}
          <input [value]="inputValue"/>
          <textarea [value]="inputValue"></textarea>
          <select [value]="inputValue">
            <option value="goodbye">Goodbye</option>
            <option value="hello">Hello</option>
          </select>
        </div>
    </div>
  `,
})
class DraggableWithInputsInDropZone extends DraggableInDropZone {
  inputValue = 'hello';
}

@Component({
  template: `
    <div
      cdkDropList
      class="drop-list scroll-container"
      [cdkDropListData]="items">
      <div
        *ngFor="let item of items"
        cdkDrag
        [cdkDragData]="item">
          {{item.id}}
          <input type="radio" name="radio" [checked]="item.checked"/>
        </div>
    </div>
  `,
})
class DraggableWithRadioInputsInDropZone {
  @ViewChildren(CdkDrag) dragItems: QueryList<CdkDrag>;
  items = [
    {id: 1, checked: false},
    {id: 2, checked: false},
    {id: 3, checked: true},
  ];
}

@Component({
  template: `
    <div #dragRoot class="alternate-root" style="width: 200px; height: 200px; background: hotpink">
      <ng-container cdkDrag cdkDragRootElement=".alternate-root">
        <div style="width: 100px; height: 100px; background: red;"></div>
      </ng-container>
    </div>
  `,
})
class DraggableNgContainerWithAlternateRoot {
  @ViewChild('dragRoot') dragRoot: ElementRef<HTMLElement>;
  @ViewChild(CdkDrag) dragInstance: CdkDrag;
}

/**
 * Drags an element to a position on the page using the mouse.
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
function dragElementViaMouse(
  fixture: ComponentFixture<any>,
  element: Element,
  x: number,
  y: number,
) {
  startDraggingViaMouse(fixture, element);

  dispatchMouseEvent(document, 'mousemove', x, y);
  fixture.detectChanges();

  dispatchMouseEvent(document, 'mouseup', x, y);
  fixture.detectChanges();
}

/**
 * Dispatches the events for starting a drag sequence.
 * @param fixture Fixture on which to run change detection.
 * @param element Element on which to dispatch the events.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
function startDraggingViaMouse(
  fixture: ComponentFixture<any>,
  element: Element,
  x?: number,
  y?: number,
) {
  dispatchMouseEvent(element, 'mousedown', x, y);
  fixture.detectChanges();

  dispatchMouseEvent(document, 'mousemove', x, y);
  fixture.detectChanges();
}

/**
 * Drags an element to a position on the page using a touch device.
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
function dragElementViaTouch(
  fixture: ComponentFixture<any>,
  element: Element,
  x: number,
  y: number,
) {
  startDraggingViaTouch(fixture, element);
  continueDraggingViaTouch(fixture, x, y);
  stopDraggingViaTouch(fixture, x, y);
}

/**
 * @param fixture Fixture on which to run change detection.
 * @param element Element which is being dragged.
 */
function startDraggingViaTouch(fixture: ComponentFixture<any>, element: Element) {
  dispatchTouchEvent(element, 'touchstart');
  fixture.detectChanges();

  dispatchTouchEvent(document, 'touchmove');
  fixture.detectChanges();
}

/**
 * @param fixture Fixture on which to run change detection.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
function continueDraggingViaTouch(fixture: ComponentFixture<any>, x: number, y: number) {
  dispatchTouchEvent(document, 'touchmove', x, y);
  fixture.detectChanges();
}

/**
 * @param fixture Fixture on which to run change detection.
 * @param x Position along the x axis to which to drag the element.
 * @param y Position along the y axis to which to drag the element.
 */
function stopDraggingViaTouch(fixture: ComponentFixture<any>, x: number, y: number) {
  dispatchTouchEvent(document, 'touchend', x, y);
  fixture.detectChanges();
}

/** Gets the index of an element among its siblings, based on their position on the page. */
function getElementIndexByPosition(element: Element, direction: 'top' | 'left') {
  return getElementSibligsByPosition(element, direction).indexOf(element);
}

/** Gets the siblings of an element, sorted by their position on the page. */
function getElementSibligsByPosition(element: Element, direction: 'top' | 'left') {
  return element.parentElement
    ? Array.from(element.parentElement.children).sort((a, b) => {
        return a.getBoundingClientRect()[direction] - b.getBoundingClientRect()[direction];
      })
    : [];
}

/**
 * Adds a large element to the page in order to make it scrollable.
 * @returns Function that should be used to clean up after the test is done.
 */
function makeScrollable(
  direction: 'vertical' | 'horizontal' = 'vertical',
  element = document.body,
) {
  const veryTallElement = document.createElement('div');
  veryTallElement.style.width = direction === 'vertical' ? '100%' : '4000px';
  veryTallElement.style.height = direction === 'vertical' ? '2000px' : '5px';
  element.appendChild(veryTallElement);

  return () => {
    scrollTo(0, 0);
    veryTallElement.remove();
  };
}

/**
 * Asserts that sorting an element down works correctly.
 * @param fixture Fixture against which to run the assertions.
 * @param items Array of items against which to test sorting.
 */
function assertDownwardSorting(fixture: ComponentFixture<any>, items: Element[]) {
  const draggedItem = items[0];
  const {top, left} = draggedItem.getBoundingClientRect();

  startDraggingViaMouse(fixture, draggedItem, left, top);

  const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

  // Drag over each item one-by-one going downwards.
  for (let i = 0; i < items.length; i++) {
    const elementRect = items[i].getBoundingClientRect();

    // Add a few pixels to the top offset so we get some overlap.
    dispatchMouseEvent(document, 'mousemove', elementRect.left, elementRect.top + 5);
    fixture.detectChanges();
    expect(getElementIndexByPosition(placeholder, 'top')).toBe(i);
  }

  dispatchMouseEvent(document, 'mouseup');
  fixture.detectChanges();
  flush();
}

/**
 * Asserts that sorting an element up works correctly.
 * @param fixture Fixture against which to run the assertions.
 * @param items Array of items against which to test sorting.
 */
function assertUpwardSorting(fixture: ComponentFixture<any>, items: Element[]) {
  const draggedItem = items[items.length - 1];
  const {top, left} = draggedItem.getBoundingClientRect();

  startDraggingViaMouse(fixture, draggedItem, left, top);

  const placeholder = document.querySelector('.cdk-drag-placeholder')! as HTMLElement;

  // Drag over each item one-by-one going upwards.
  for (let i = items.length - 1; i > -1; i--) {
    const elementRect = items[i].getBoundingClientRect();

    // Remove a few pixels from the bottom offset so we get some overlap.
    dispatchMouseEvent(document, 'mousemove', elementRect.left, elementRect.bottom - 5);
    fixture.detectChanges();
    expect(getElementIndexByPosition(placeholder, 'top')).toBe(i);
  }

  dispatchMouseEvent(document, 'mouseup');
  fixture.detectChanges();
  flush();
}

/** Ticks the specified amount of `requestAnimationFrame`-s. */
function tickAnimationFrames(amount: number) {
  tick(16.6 * amount); // Angular turns rAF calls into 16.6ms timeouts in tests.
}
