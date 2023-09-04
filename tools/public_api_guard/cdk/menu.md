## API Report File for "components-srcs"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { AfterContentInit } from '@angular/core';
import { BooleanInput } from '@angular/cdk/coercion';
import { ConnectedPosition } from '@angular/cdk/overlay';
import { Directionality } from '@angular/cdk/bidi';
import { ElementRef } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { FocusableOption } from '@angular/cdk/a11y';
import { FocusKeyManager } from '@angular/cdk/a11y';
import { FocusOrigin } from '@angular/cdk/a11y';
import * as i0 from '@angular/core';
import * as i1 from '@angular/cdk/overlay';
import { InjectionToken } from '@angular/core';
import { Injector } from '@angular/core';
import { NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { OnDestroy } from '@angular/core';
import { Optional } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';
import { QueryList } from '@angular/core';
import { Subject } from 'rxjs';
import { TemplatePortal } from '@angular/cdk/portal';
import { TemplateRef } from '@angular/core';
import { ViewContainerRef } from '@angular/core';

// @public
export const CDK_MENU: InjectionToken<Menu>;

// @public
export class CdkContextMenuTrigger extends CdkMenuTriggerBase implements OnDestroy {
    constructor();
    close(): void;
    get disabled(): boolean;
    set disabled(value: BooleanInput);
    open(coordinates: ContextMenuCoordinates): void;
    _openOnContextMenu(event: MouseEvent): void;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkContextMenuTrigger, "[cdkContextMenuTriggerFor]", ["cdkContextMenuTriggerFor"], { "menuTemplateRef": { "alias": "cdkContextMenuTriggerFor"; "required": false; }; "menuPosition": { "alias": "cdkContextMenuPosition"; "required": false; }; "menuData": { "alias": "cdkContextMenuTriggerData"; "required": false; }; "disabled": { "alias": "cdkContextMenuDisabled"; "required": false; }; }, { "opened": "cdkContextMenuOpened"; "closed": "cdkContextMenuClosed"; }, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkContextMenuTrigger, never>;
}

// @public
export class CdkMenu extends CdkMenuBase implements AfterContentInit, OnDestroy {
    constructor();
    readonly closed: EventEmitter<void>;
    _handleKeyEvent(event: KeyboardEvent): void;
    readonly isInline: boolean;
    // (undocumented)
    ngAfterContentInit(): void;
    // (undocumented)
    ngOnDestroy(): void;
    readonly orientation = "vertical";
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenu, "[cdkMenu]", ["cdkMenu"], {}, { "closed": "closed"; }, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenu, never>;
}

// @public
export class CdkMenuBar extends CdkMenuBase implements AfterContentInit {
    _handleKeyEvent(event: KeyboardEvent): void;
    readonly isInline = true;
    // (undocumented)
    ngAfterContentInit(): void;
    readonly orientation = "horizontal";
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuBar, "[cdkMenuBar]", ["cdkMenuBar"], {}, {}, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuBar, never>;
}

// @public
export abstract class CdkMenuBase extends CdkMenuGroup implements Menu, AfterContentInit, OnDestroy {
    protected closeOpenMenu(menu: MenuStackItem, options?: {
        focusParentTrigger?: boolean;
    }): void;
    protected readonly destroyed: Subject<void>;
    protected readonly dir: Directionality | null;
    focusFirstItem(focusOrigin?: FocusOrigin): void;
    focusLastItem(focusOrigin?: FocusOrigin): void;
    _getTabIndex(): 0 | -1 | null;
    id: string;
    isInline: boolean;
    readonly items: QueryList<CdkMenuItem>;
    protected keyManager: FocusKeyManager<CdkMenuItem>;
    protected readonly menuAim: MenuAim | null;
    readonly menuStack: MenuStack;
    readonly nativeElement: HTMLElement;
    // (undocumented)
    ngAfterContentInit(): void;
    // (undocumented)
    ngOnDestroy(): void;
    protected ngZone: NgZone;
    orientation: 'horizontal' | 'vertical';
    protected pointerTracker?: PointerFocusTracker<CdkMenuItem>;
    protected triggerItem?: CdkMenuItem;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuBase, never, never, { "id": { "alias": "id"; "required": false; }; }, {}, ["items"], never, false, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuBase, never>;
}

// @public
export class CdkMenuGroup {
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuGroup, "[cdkMenuGroup]", ["cdkMenuGroup"], {}, {}, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuGroup, never>;
}

// @public
export class CdkMenuItem implements FocusableOption, FocusableElement, Toggler, OnDestroy {
    constructor();
    protected closeOnSpacebarTrigger: boolean;
    protected readonly destroyed: Subject<void>;
    // (undocumented)
    protected readonly _dir: Directionality | null;
    get disabled(): boolean;
    set disabled(value: BooleanInput);
    // (undocumented)
    readonly _elementRef: ElementRef<HTMLElement>;
    focus(): void;
    getLabel(): string;
    getMenu(): Menu | undefined;
    getMenuTrigger(): CdkMenuTrigger | null;
    get hasMenu(): boolean;
    isMenuOpen(): boolean;
    // (undocumented)
    ngOnDestroy(): void;
    // (undocumented)
    protected _ngZone: NgZone;
    _onKeydown(event: KeyboardEvent): void;
    _resetTabIndex(): void;
    _setTabIndex(event?: MouseEvent): void;
    _tabindex: 0 | -1;
    trigger(options?: {
        keepOpen: boolean;
    }): void;
    readonly triggered: EventEmitter<void>;
    typeaheadLabel: string | null;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItem, "[cdkMenuItem]", ["cdkMenuItem"], { "disabled": { "alias": "cdkMenuItemDisabled"; "required": false; }; "typeaheadLabel": { "alias": "cdkMenuitemTypeaheadLabel"; "required": false; }; }, { "triggered": "cdkMenuItemTriggered"; }, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItem, never>;
}

// @public
export class CdkMenuItemCheckbox extends CdkMenuItemSelectable {
    trigger(options?: {
        keepOpen: boolean;
    }): void;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItemCheckbox, "[cdkMenuItemCheckbox]", ["cdkMenuItemCheckbox"], {}, {}, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItemCheckbox, never>;
}

// @public
export class CdkMenuItemRadio extends CdkMenuItemSelectable implements OnDestroy {
    constructor();
    // (undocumented)
    ngOnDestroy(): void;
    trigger(options?: {
        keepOpen: boolean;
    }): void;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItemRadio, "[cdkMenuItemRadio]", ["cdkMenuItemRadio"], {}, {}, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItemRadio, never>;
}

// @public
export abstract class CdkMenuItemSelectable extends CdkMenuItem {
    get checked(): boolean;
    set checked(value: BooleanInput);
    protected closeOnSpacebarTrigger: boolean;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuItemSelectable, never, never, { "checked": { "alias": "cdkMenuItemChecked"; "required": false; }; }, {}, never, never, false, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuItemSelectable, never>;
}

// @public
export class CdkMenuModule {
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuModule, never>;
    // (undocumented)
    static ɵinj: i0.ɵɵInjectorDeclaration<CdkMenuModule>;
    // (undocumented)
    static ɵmod: i0.ɵɵNgModuleDeclaration<CdkMenuModule, never, [typeof i1.OverlayModule, typeof i2.CdkMenuBar, typeof i3.CdkMenu, typeof i4.CdkMenuItem, typeof i5.CdkMenuItemRadio, typeof i6.CdkMenuItemCheckbox, typeof i7.CdkMenuTrigger, typeof i8.CdkMenuGroup, typeof i9.CdkContextMenuTrigger, typeof i10.CdkTargetMenuAim], [typeof i2.CdkMenuBar, typeof i3.CdkMenu, typeof i4.CdkMenuItem, typeof i5.CdkMenuItemRadio, typeof i6.CdkMenuItemCheckbox, typeof i7.CdkMenuTrigger, typeof i8.CdkMenuGroup, typeof i9.CdkContextMenuTrigger, typeof i10.CdkTargetMenuAim]>;
}

// @public
export class CdkMenuTrigger extends CdkMenuTriggerBase implements OnDestroy {
    constructor();
    close(): void;
    getMenu(): Menu | undefined;
    _handleClick(): void;
    open(): void;
    _setHasFocus(hasFocus: boolean): void;
    toggle(): void;
    _toggleOnKeydown(event: KeyboardEvent): void;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuTrigger, "[cdkMenuTriggerFor]", ["cdkMenuTriggerFor"], { "menuTemplateRef": { "alias": "cdkMenuTriggerFor"; "required": false; }; "menuPosition": { "alias": "cdkMenuPosition"; "required": false; }; "menuData": { "alias": "cdkMenuTriggerData"; "required": false; }; }, { "opened": "cdkMenuOpened"; "closed": "cdkMenuClosed"; }, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuTrigger, never>;
}

// @public
export abstract class CdkMenuTriggerBase implements OnDestroy {
    protected childMenu?: Menu;
    readonly closed: EventEmitter<void>;
    protected readonly destroyed: Subject<void>;
    protected getMenuContentPortal(): TemplatePortal<any>;
    readonly injector: Injector;
    protected isElementInsideMenuStack(element: Element): boolean;
    isOpen(): boolean;
    menuData: unknown;
    menuPosition: ConnectedPosition[];
    protected readonly menuStack: MenuStack;
    menuTemplateRef: TemplateRef<unknown> | null;
    // (undocumented)
    ngOnDestroy(): void;
    readonly opened: EventEmitter<void>;
    protected overlayRef: OverlayRef | null;
    registerChildMenu(child: Menu): void;
    protected readonly stopOutsideClicksListener: Observable<void>;
    protected readonly viewContainerRef: ViewContainerRef;
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkMenuTriggerBase, never, never, {}, {}, never, never, false, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkMenuTriggerBase, never>;
}

// @public
export class CdkTargetMenuAim {
    // (undocumented)
    static ɵdir: i0.ɵɵDirectiveDeclaration<CdkTargetMenuAim, "[cdkTargetMenuAim]", ["cdkTargetMenuAim"], {}, {}, never, never, true, never>;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<CdkTargetMenuAim, never>;
}

// @public
export interface CloseOptions {
    focusNextOnEmpty?: FocusNext;
    focusParentTrigger?: boolean;
}

// @public
export type ContextMenuCoordinates = {
    x: number;
    y: number;
};

// @public
export class ContextMenuTracker {
    update(trigger: CdkContextMenuTrigger): void;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<ContextMenuTracker, never>;
    // (undocumented)
    static ɵprov: i0.ɵɵInjectableDeclaration<ContextMenuTracker>;
}

// @public
export interface FocusableElement {
    _elementRef: ElementRef<HTMLElement>;
}

// @public
export const enum FocusNext {
    // (undocumented)
    currentItem = 2,
    // (undocumented)
    nextItem = 0,
    // (undocumented)
    previousItem = 1
}

// @public
export interface Menu extends MenuStackItem {
    focusFirstItem(focusOrigin: FocusOrigin): void;
    focusLastItem(focusOrigin: FocusOrigin): void;
    id: string;
    nativeElement: HTMLElement;
    readonly orientation: 'horizontal' | 'vertical';
}

// @public
export const MENU_AIM: InjectionToken<MenuAim>;

// @public
export const MENU_STACK: InjectionToken<MenuStack>;

// @public
export const MENU_TRIGGER: InjectionToken<CdkMenuTriggerBase>;

// @public
export interface MenuAim {
    initialize(menu: Menu, pointerTracker: PointerFocusTracker<FocusableElement & Toggler>): void;
    toggle(doToggle: () => void): void;
}

// @public
export class MenuStack {
    close(lastItem: MenuStackItem, options?: CloseOptions): void;
    closeAll(options?: CloseOptions): void;
    readonly closed: Observable<MenuStackCloseEvent>;
    closeSubMenuOf(lastItem: MenuStackItem): boolean;
    readonly emptied: Observable<FocusNext | undefined>;
    readonly hasFocus: Observable<boolean>;
    hasInlineMenu(): boolean;
    readonly id: string;
    static inline(orientation: 'vertical' | 'horizontal'): MenuStack;
    inlineMenuOrientation(): "vertical" | "horizontal" | null;
    isEmpty(): boolean;
    length(): number;
    peek(): MenuStackItem | undefined;
    push(menu: MenuStackItem): void;
    setHasFocus(hasFocus: boolean): void;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<MenuStack, never>;
    // (undocumented)
    static ɵprov: i0.ɵɵInjectableDeclaration<MenuStack>;
}

// @public
export interface MenuStackCloseEvent {
    focusParentTrigger?: boolean;
    item: MenuStackItem;
}

// @public
export interface MenuStackItem {
    menuStack?: MenuStack;
}

// @public
export const PARENT_OR_NEW_INLINE_MENU_STACK_PROVIDER: (orientation: 'vertical' | 'horizontal') => {
    provide: InjectionToken<MenuStack>;
    deps: Optional[][];
    useFactory: (parentMenuStack?: MenuStack) => MenuStack;
};

// @public
export const PARENT_OR_NEW_MENU_STACK_PROVIDER: {
    provide: InjectionToken<MenuStack>;
    deps: Optional[][];
    useFactory: (parentMenuStack?: MenuStack) => MenuStack;
};

// @public
export class PointerFocusTracker<T extends FocusableElement> {
    constructor(
    _items: QueryList<T>);
    activeElement?: T;
    destroy(): void;
    readonly entered: Observable<T>;
    readonly exited: Observable<T>;
    previousElement?: T;
}

// @public
export class TargetMenuAim implements MenuAim, OnDestroy {
    initialize(menu: Menu, pointerTracker: PointerFocusTracker<FocusableElement & Toggler>): void;
    // (undocumented)
    ngOnDestroy(): void;
    toggle(doToggle: () => void): void;
    // (undocumented)
    static ɵfac: i0.ɵɵFactoryDeclaration<TargetMenuAim, never>;
    // (undocumented)
    static ɵprov: i0.ɵɵInjectableDeclaration<TargetMenuAim>;
}

// @public
export interface Toggler {
    getMenu(): Menu | undefined;
}

// (No @packageDocumentation comment for this package)

```