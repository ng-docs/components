/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directionality} from '@angular/cdk/bidi';
import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  Input,
  OnDestroy,
  Optional,
  QueryList,
  ViewEncapsulation,
} from '@angular/core';
import {HasTabIndex, mixinTabIndex} from '@angular/material-experimental/mdc-core';
import {deprecated} from '@material/chips';
import {merge, Observable, Subject, Subscription} from 'rxjs';
import {startWith, takeUntil} from 'rxjs/operators';
import {MatChip, MatChipEvent} from './chip';

let uid = 0;

/**
 * Boilerplate for applying mixins to MatChipSet.
 * @docs-private
 */
abstract class MatChipSetBase {
  abstract disabled: boolean;
  constructor(_elementRef: ElementRef) {}
}
const _MatChipSetMixinBase = mixinTabIndex(MatChipSetBase);

/**
 * Basic container component for the MatChip component.
 *
 * Extended by MatChipListbox and MatChipGrid for different interaction patterns.
 */
@Component({
  selector: 'mat-chip-set',
  template: '<ng-content></ng-content>',
  styleUrls: ['chips.css'],
  host: {
    'class': 'mat-mdc-chip-set mdc-chip-set',
    '[attr.role]': 'role',
    // TODO: replace this binding with use of AriaDescriber
    '[attr.aria-describedby]': '_ariaDescribedby || null',
    '[id]': '_uid',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatChipSet
  extends _MatChipSetMixinBase
  implements AfterContentInit, AfterViewInit, HasTabIndex, OnDestroy
{
  /** Subscription to remove changes in chips. */
  private _chipRemoveSubscription: Subscription | null;

  /** Subscription to destroyed events in chips. */
  private _chipDestroyedSubscription: Subscription | null;

  /** Subscription to chip interactions. */
  private _chipInteractionSubscription: Subscription | null;

  /**
   * When a chip is destroyed, we store the index of the destroyed chip until the chips
   * query list notifies about the update. This is necessary because we cannot determine an
   * appropriate chip that should receive focus until the array of chips updated completely.
   */
  protected _lastDestroyedChipIndex: number | null = null;

  /** The MDC foundation containing business logic for MDC chip-set. */
  protected _chipSetFoundation: deprecated.MDCChipSetFoundation;

  /** Subject that emits when the component has been destroyed. */
  protected _destroyed = new Subject<void>();

  /**
   * Implementation of the MDC chip-set adapter interface.
   * These methods are called by the chip set foundation.
   */
  protected _chipSetAdapter: deprecated.MDCChipSetAdapter = {
    hasClass: className => this._hasMdcClass(className),
    // No-op. We keep track of chips via ContentChildren, which will be updated when a chip is
    // removed.
    removeChipAtIndex: () => {},
    // No-op for base chip set. MatChipListbox overrides the adapter to provide this method.
    selectChipAtIndex: () => {},
    getIndexOfChipById: (id: string) => this._chips.toArray().findIndex(chip => chip.id === id),
    focusChipPrimaryActionAtIndex: () => {},
    focusChipTrailingActionAtIndex: () => {},
    removeFocusFromChipAtIndex: () => {},
    isRTL: () => !!this._dir && this._dir.value === 'rtl',
    getChipListCount: () => this._chips.length,
    // TODO(mmalerba): Implement using LiveAnnouncer.
    announceMessage: () => {},
  };

  /** The aria-describedby attribute on the chip list for improved a11y. */
  _ariaDescribedby: string;

  /** Uid of the chip set */
  _uid: string = `mat-mdc-chip-set-${uid++}`;

  /**
   * Map from class to whether the class is enabled.
   * Enabled classes are set on the MDC chip-set div.
   */
  _mdcClasses: {[key: string]: boolean} = {};

  /** Whether the chip set is disabled. */
  @Input()
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
    this._syncChipsState();
  }
  protected _disabled: boolean = false;

  /** Whether the chip list contains chips or not. */
  get empty(): boolean {
    return this._chips.length === 0;
  }

  /** The ARIA role applied to the chip set. */
  @Input()
  get role(): string | null {
    if (this._role) {
      return this._role;
    } else {
      return this.empty ? null : 'presentation';
    }
  }

  set role(value: string | null) {
    this._role = value;
  }
  private _role: string | null = null;

  /** Whether any of the chips inside of this chip-set has focus. */
  get focused(): boolean {
    return this._hasFocusedChip();
  }

  /** Combined stream of all of the child chips' remove events. */
  get chipRemoveChanges(): Observable<MatChipEvent> {
    return merge(...this._chips.map(chip => chip.removed));
  }

  /** Combined stream of all of the child chips' remove events. */
  get chipDestroyedChanges(): Observable<MatChipEvent> {
    return merge(...this._chips.map(chip => chip.destroyed));
  }

  /** Combined stream of all of the child chips' interaction events. */
  get chipInteractionChanges(): Observable<string> {
    return merge(...this._chips.map(chip => chip.interaction));
  }

  /** The chips that are part of this chip set. */
  @ContentChildren(MatChip, {
    // We need to use `descendants: true`, because Ivy will no longer match
    // indirect descendants if it's left as false.
    descendants: true,
  })
  _chips: QueryList<MatChip>;

  constructor(
    protected _elementRef: ElementRef,
    protected _changeDetectorRef: ChangeDetectorRef,
    @Optional() protected _dir: Directionality,
  ) {
    super(_elementRef);
    this._chipSetFoundation = new deprecated.MDCChipSetFoundation(this._chipSetAdapter);
  }

  ngAfterViewInit() {
    this._chipSetFoundation.init();
  }

  ngAfterContentInit() {
    this._chips.changes.pipe(startWith(null), takeUntil(this._destroyed)).subscribe(() => {
      if (this.disabled) {
        // Since this happens after the content has been
        // checked, we need to defer it to the next tick.
        Promise.resolve().then(() => {
          this._syncChipsState();
        });
      }

      this._resetChips();
    });
  }

  ngOnDestroy() {
    this._dropSubscriptions();
    this._destroyed.next();
    this._destroyed.complete();
    this._chipSetFoundation.destroy();
  }

  /** Checks whether any of the chips is focused. */
  protected _hasFocusedChip() {
    return this._chips && this._chips.some(chip => chip._hasFocus());
  }

  /** Syncs the chip-set's state with the individual chips. */
  protected _syncChipsState() {
    if (this._chips) {
      this._chips.forEach(chip => {
        chip.disabled = this._disabled;
        chip._changeDetectorRef.markForCheck();
      });
    }
  }

  /** Sets whether the given CSS class should be applied to the MDC chip. */
  protected _setMdcClass(cssClass: string, active: boolean) {
    const classes = this._elementRef.nativeElement.classList;
    active ? classes.add(cssClass) : classes.remove(cssClass);
    this._changeDetectorRef.markForCheck();
  }

  /** Adapter method that returns true if the chip set has the given MDC class. */
  protected _hasMdcClass(className: string) {
    return this._elementRef.nativeElement.classList.contains(className);
  }

  /** Updates subscriptions to chip events. */
  private _resetChips() {
    this._dropSubscriptions();
    this._subscribeToChipEvents();
  }

  /** Subscribes to events on the child chips. */
  protected _subscribeToChipEvents() {
    this._listenToChipsRemove();
    this._listenToChipsDestroyed();
    this._listenToChipsInteraction();
  }

  /** Subscribes to chip removal events. */
  private _listenToChipsRemove() {
    this._chipRemoveSubscription = this.chipRemoveChanges.subscribe((event: MatChipEvent) => {
      this._chipSetFoundation.handleChipRemoval({
        chipId: event.chip.id,
        // TODO(mmalerba): Add removal message.
        removedAnnouncement: null,
      });
    });
  }

  /** Subscribes to chip destroyed events. */
  private _listenToChipsDestroyed() {
    this._chipDestroyedSubscription = this.chipDestroyedChanges.subscribe((event: MatChipEvent) => {
      const chip = event.chip;
      const chipIndex: number = this._chips.toArray().indexOf(event.chip);

      // In case the chip that will be removed is currently focused, we temporarily store
      // the index in order to be able to determine an appropriate sibling chip that will
      // receive focus.
      if (this._isValidIndex(chipIndex) && chip._hasFocus()) {
        this._lastDestroyedChipIndex = chipIndex;
      }
    });
  }

  /** Subscribes to chip interaction events. */
  private _listenToChipsInteraction() {
    this._chipInteractionSubscription = this.chipInteractionChanges.subscribe((id: string) => {
      this._chipSetFoundation.handleChipInteraction({chipId: id});
    });
  }

  /** Unsubscribes from all chip events. */
  protected _dropSubscriptions() {
    if (this._chipRemoveSubscription) {
      this._chipRemoveSubscription.unsubscribe();
      this._chipRemoveSubscription = null;
    }

    if (this._chipInteractionSubscription) {
      this._chipInteractionSubscription.unsubscribe();
      this._chipInteractionSubscription = null;
    }

    if (this._chipDestroyedSubscription) {
      this._chipDestroyedSubscription.unsubscribe();
      this._chipDestroyedSubscription = null;
    }
  }

  /** Dummy method for subclasses to override. Base chip set cannot be focused. */
  focus() {}

  /**
   * Utility to ensure all indexes are valid.
   *
   * @param index The index to be checked.
   * @returns True if the index is valid for our list of chips.
   */
  protected _isValidIndex(index: number): boolean {
    return index >= 0 && index < this._chips.length;
  }

  /** Checks whether an event comes from inside a chip element. */
  protected _originatesFromChip(event: Event): boolean {
    return this._checkForClassInHierarchy(event, 'mdc-chip');
  }

  /**
   * Checks whether an event comes from inside a chip element in the editing
   * state.
   */
  protected _originatesFromEditingChip(event: Event): boolean {
    return this._checkForClassInHierarchy(event, 'mdc-chip--editing');
  }

  private _checkForClassInHierarchy(event: Event, className: string) {
    let currentElement = event.target as HTMLElement | null;

    while (currentElement && currentElement !== this._elementRef.nativeElement) {
      // Null check the classList, because IE and Edge don't support it on all elements.
      if (currentElement.classList && currentElement.classList.contains(className)) {
        return true;
      }

      currentElement = currentElement.parentElement;
    }

    return false;
  }
}
