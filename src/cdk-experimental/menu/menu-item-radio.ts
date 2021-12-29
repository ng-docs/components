/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {UniqueSelectionDispatcher} from '@angular/cdk/collections';
import {Directive, OnDestroy, ElementRef, Self, Optional, Inject, NgZone} from '@angular/core';
import {Directionality} from '@angular/cdk/bidi';
import {CdkMenuItemSelectable} from './menu-item-selectable';
import {CdkMenuItem} from './menu-item';
import {CdkMenuItemTrigger} from './menu-item-trigger';
import {CDK_MENU, Menu} from './menu-interface';
import {MENU_AIM, MenuAim} from './menu-aim';

/**
 * A directive providing behavior for the "menuitemradio" ARIA role, which behaves similarly to
 * a conventional radio-button. Any sibling `CdkMenuItemRadio` instances within the same `CdkMenu`
 * or `CdkMenuGroup` comprise a radio group with unique selection enforced.
 */
@Directive({
  selector: '[cdkMenuItemRadio]',
  exportAs: 'cdkMenuItemRadio',
  host: {
    '[tabindex]': '_tabindex',
    'type': 'button',
    'role': 'menuitemradio',
    '[attr.aria-checked]': 'checked || null',
    '[attr.aria-disabled]': 'disabled || null',
  },
  providers: [
    {provide: CdkMenuItemSelectable, useExisting: CdkMenuItemRadio},
    {provide: CdkMenuItem, useExisting: CdkMenuItemSelectable},
  ],
})
export class CdkMenuItemRadio extends CdkMenuItemSelectable implements OnDestroy {
  /** Function to unregister the selection dispatcher */
  private _removeDispatcherListener: () => void;

  constructor(
    private readonly _selectionDispatcher: UniqueSelectionDispatcher,
    element: ElementRef<HTMLElement>,
    ngZone: NgZone,
    @Optional() @Inject(CDK_MENU) parentMenu?: Menu,
    @Optional() @Inject(MENU_AIM) menuAim?: MenuAim,
    @Optional() dir?: Directionality,
    /** Reference to the CdkMenuItemTrigger directive if one is added to the same element */
    // `CdkMenuItemRadio` is commonly used in combination with a `CdkMenuItemTrigger`.
    // tslint:disable-next-line: lightweight-tokens
    @Self() @Optional() menuTrigger?: CdkMenuItemTrigger,
  ) {
    super(element, ngZone, parentMenu, menuAim, dir, menuTrigger);

    this._registerDispatcherListener();
  }

  /** Configure the unique selection dispatcher listener in order to toggle the checked state  */
  private _registerDispatcherListener() {
    this._removeDispatcherListener = this._selectionDispatcher.listen(
      (id: string, name: string) => (this.checked = this.id === id && this.name === name),
    );
  }

  /** Toggles the checked state of the radio-button. */
  override trigger() {
    super.trigger();

    if (!this.disabled) {
      this._selectionDispatcher.notify(this.id, this.name);
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._removeDispatcherListener();
  }
}
