/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {BooleanInput, coerceBooleanProperty} from '@angular/cdk/coercion';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewChecked,
  Attribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ErrorHandler,
  inject,
  Inject,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {CanColor, ThemePalette, mixinColor} from '@angular/material/core';
import {Subscription} from 'rxjs';
import {take} from 'rxjs/operators';

import {MatIconRegistry} from './icon-registry';

// Boilerplate for applying mixins to MatIcon.
/** @docs-private */
const _MatIconBase = mixinColor(
  class {
    constructor(public _elementRef: ElementRef) {}
  },
);

/**
 * Default options for `mat-icon`.
 *
 * `mat-icon` 的默认选项。
 *
 */
export interface MatIconDefaultOptions {
  /**
   * Default color of the icon.
   *
   * 图标的默认颜色。
   *
   */
  color?: ThemePalette;
  /**
   * Font set that the icon is a part of.
   *
   * 该图标所属的字体集。
   *
   */
  fontSet?: string;
}

/**
 * Injection token to be used to override the default options for `mat-icon`.
 *
 * 用于覆盖 `mat-icon` 的默认选项的注入令牌。
 *
 */
export const MAT_ICON_DEFAULT_OPTIONS = new InjectionToken<MatIconDefaultOptions>(
  'MAT_ICON_DEFAULT_OPTIONS',
);

/**
 * Injection token used to provide the current location to `MatIcon`.
 * Used to handle server-side rendering and to stub out during unit tests.
 *
 * 注入令牌，用于为 `MatIcon` 提供当前的 location 对象。用于处理服务器端的渲染，以及在单元测试中作为桩使用。
 *
 * @docs-private
 */
export const MAT_ICON_LOCATION = new InjectionToken<MatIconLocation>('mat-icon-location', {
  providedIn: 'root',
  factory: MAT_ICON_LOCATION_FACTORY,
});

/**
 * Stubbed out location for `MatIcon`.
 *
 * 供 `MatIcon` 使用的 location 桩。
 *
 * @docs-private
 */
export interface MatIconLocation {
  getPathname: () => string;
}

/** @docs-private */
export function MAT_ICON_LOCATION_FACTORY(): MatIconLocation {
  const _document = inject(DOCUMENT);
  const _location = _document ? _document.location : null;

  return {
    // Note that this needs to be a function, rather than a property, because Angular
    // will only resolve it once, but we want the current path on each call.
    getPathname: () => (_location ? _location.pathname + _location.search : ''),
  };
}
/**
 * SVG attributes that accept a FuncIRI \(e.g. `url(<something>)`\).
 *
 * 可接受 FuncIRI（例如 `url(<something>)` ）的 SVG 属性。
 *
 */
const funcIriAttributes = [
  'clip-path',
  'color-profile',
  'src',
  'cursor',
  'fill',
  'filter',
  'marker',
  'marker-start',
  'marker-mid',
  'marker-end',
  'mask',
  'stroke',
];

/**
 * Selector that can be used to find all elements that are using a `FuncIRI`.
 *
 * 可以用来查找所有正在使用 `FuncIRI` 元素的选择器。
 *
 */
const funcIriAttributeSelector = funcIriAttributes.map(attr => `[${attr}]`).join(', ');

/**
 * Regex that can be used to extract the id out of a FuncIRI.
 *
 * 可以用来从 FuncIRI 中提取 id 的正则表达式。
 *
 */
const funcIriPattern = /^url\(['"]?#(.*?)['"]?\)$/;

/**
 * Component to display an icon. It can be used in the following ways:
 *
 * 要显示图标的组件。它可以通过以下方式使用：
 *
 * - Specify the svgIcon input to load an SVG icon from a URL previously registered with the
 *   addSvgIcon, addSvgIconInNamespace, addSvgIconSet, or addSvgIconSetInNamespace methods of
 *   MatIconRegistry. If the svgIcon value contains a colon it is assumed to be in the format
 *   "[namespace]&#x3A;[name]", if not the value will be the name of an icon in the default namespace.
 *   Examples:
 *     `<mat-icon svgIcon="left-arrow"></mat-icon>
 *     <mat-icon svgIcon="animals:cat"></mat-icon>`
 *
 *   指定输入属性 svgIcon，用于从之前使用 MatIconRegistry 的 addSvgIcon，addSvgIconInNamespace，addSvgIconSet 或 addSvgIconSetInNamespace 方法注册的 URL 中加载 SVG 图标。如果 svgIcon 的值包含冒号，则假定其格式为“[namespace]&#x3A;[name]”，否则把该值视为默认命名空间中某个图标的名字。例如：
 *     `<mat-icon svgIcon="left-arrow"></mat-icon>
 *     <mat-icon svgIcon="animals:cat"></mat-icon>`
 *
 * - Use a font ligature as an icon by putting the ligature text in the `fontIcon` attribute or the
 *   content of the `<mat-icon>` component. If you register a custom font class, don't forget to also
 *   include the special class `mat-ligature-font`. It is recommended to use the attribute alternative
 *   to prevent the ligature text to be selectable and to appear in search engine results.
 *   By default, the Material icons font is used as described at
 *   http://google.github.io/material-design-icons/#icon-font-for-the-web. You can specify an
 *   alternate font by setting the fontSet input to either the CSS class to apply to use the
 *   desired font, or to an alias previously registered with MatIconRegistry.registerFontClassAlias.
 *   Examples:
 *     `<mat-icon fontIcon="home"></mat-icon>
 *     <mat-icon>home</mat-icon>
 *     <mat-icon fontSet="myfont" fontIcon="sun"></mat-icon>
 *     <mat-icon fontSet="myfont">sun</mat-icon>`
 *
 *   通过将合字文本放在 `fontIcon` 属性或 `<mat-icon>` 组件的内容中，将合字字体用作图标。如果你注册了自定义字体类，请不要忘记还要包括特殊类 `mat-ligature-font` 。建议使用替代属性来防止合字文本被选中以及出现在搜索引擎结果中。默认情况下，使用 http://google.github.io/material-design-icons/#icon-font-for-the-web 中所述的 Material 图标字体。你可以通过将 fontSet 输入设置为要应用以使用所需字体的 CSS 类或之前使用 MatIconRegistry.registerFontClassAlias 注册的别名来指定备用字体。示例： `<mat-icon fontIcon="home"></mat-icon> <mat-icon>home</mat-icon> <mat-icon fontSet="myfont" fontIcon="sun"></mat-icon> <mat-icon fontSet="myfont">sun</mat-icon>`
 *
 * - Specify a font glyph to be included via CSS rules by setting the fontSet input to specify the
 *   font, and the fontIcon input to specify the icon. Typically the fontIcon will specify a
 *   CSS class which causes the glyph to be displayed via a :before selector, as in
 *   https://fortawesome.github.io/Font-Awesome/examples/
 *   Example:
 *     `<mat-icon fontSet="fa" fontIcon="alarm"></mat-icon>`
 *
 *   指定要通过 CSS 规则包含的字体字形，方法是设置输入属性 fontSet 以指定字体，并使用输入属性 fontIcon 来指定图标。通常，fontIcon 会指定一个 CSS 类，它会让这个字形通过 :before 选择器显示出来，就像 https://fortawesome.github.io/Font-Awesome/examples/ 中一样，例如： `<mat-icon fontSet="fa" fontIcon="alarm"></mat-icon`
 *
 */
@Component({
  template: '<ng-content></ng-content>',
  selector: 'mat-icon',
  exportAs: 'matIcon',
  styleUrls: ['icon.css'],
  inputs: ['color'],
  host: {
    'role': 'img',
    'class': 'mat-icon notranslate',
    '[attr.data-mat-icon-type]': '_usingFontIcon() ? "font" : "svg"',
    '[attr.data-mat-icon-name]': '_svgName || fontIcon',
    '[attr.data-mat-icon-namespace]': '_svgNamespace || fontSet',
    '[attr.fontIcon]': '_usingFontIcon() ? fontIcon : null',
    '[class.mat-icon-inline]': 'inline',
    '[class.mat-icon-no-color]': 'color !== "primary" && color !== "accent" && color !== "warn"',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatIcon extends _MatIconBase implements OnInit, AfterViewChecked, CanColor, OnDestroy {
  /**
   * Whether the icon should be inlined, automatically sizing the icon to match the font size of
   * the element the icon is contained in.
   *
   * 该图标是否应该内联，这会自动调整图标大小以匹配图标所在元素的字体大小。
   *
   */
  @Input()
  get inline(): boolean {
    return this._inline;
  }
  set inline(inline: BooleanInput) {
    this._inline = coerceBooleanProperty(inline);
  }
  private _inline: boolean = false;

  /**
   * Name of the icon in the SVG icon set.
   *
   * SVG 图标集中的图标名称。
   *
   */
  @Input()
  get svgIcon(): string {
    return this._svgIcon;
  }
  set svgIcon(value: string) {
    if (value !== this._svgIcon) {
      if (value) {
        this._updateSvgIcon(value);
      } else if (this._svgIcon) {
        this._clearSvgElement();
      }
      this._svgIcon = value;
    }
  }
  private _svgIcon: string;

  /**
   * Font set that the icon is a part of.
   *
   * 该图标所属的字体集。
   *
   */
  @Input()
  get fontSet(): string {
    return this._fontSet;
  }
  set fontSet(value: string) {
    const newValue = this._cleanupFontValue(value);

    if (newValue !== this._fontSet) {
      this._fontSet = newValue;
      this._updateFontIconClasses();
    }
  }
  private _fontSet: string;

  /**
   * Name of an icon within a font set.
   *
   * 字体集中图标的名称。
   *
   */
  @Input()
  get fontIcon(): string {
    return this._fontIcon;
  }
  set fontIcon(value: string) {
    const newValue = this._cleanupFontValue(value);

    if (newValue !== this._fontIcon) {
      this._fontIcon = newValue;
      this._updateFontIconClasses();
    }
  }
  private _fontIcon: string;

  private _previousFontSetClass: string[] = [];
  private _previousFontIconClass: string;

  _svgName: string | null;
  _svgNamespace: string | null;

  /**
   * Keeps track of the current page path.
   *
   * 跟踪当前的页面路径。
   *
   */
  private _previousPath?: string;

  /**
   * Keeps track of the elements and attributes that we've prefixed with the current path.
   *
   * 跟踪那些我们以当前路径作为前缀的元素和属性。
   *
   */
  private _elementsWithExternalReferences?: Map<Element, {name: string; value: string}[]>;

  /**
   * Subscription to the current in-progress SVG icon request.
   *
   * 订阅当前正在进行的 SVG 图标请求。
   *
   */
  private _currentIconFetch = Subscription.EMPTY;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    private _iconRegistry: MatIconRegistry,
    @Attribute('aria-hidden') ariaHidden: string,
    @Inject(MAT_ICON_LOCATION) private _location: MatIconLocation,
    private readonly _errorHandler: ErrorHandler,
    @Optional()
    @Inject(MAT_ICON_DEFAULT_OPTIONS)
    defaults?: MatIconDefaultOptions,
  ) {
    super(elementRef);

    if (defaults) {
      if (defaults.color) {
        this.color = this.defaultColor = defaults.color;
      }

      if (defaults.fontSet) {
        this.fontSet = defaults.fontSet;
      }
    }

    // If the user has not explicitly set aria-hidden, mark the icon as hidden, as this is
    // the right thing to do for the majority of icon use-cases.
    if (!ariaHidden) {
      elementRef.nativeElement.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Splits an svgIcon binding value into its icon set and icon name components.
   * Returns a 2-element array of [(icon set), (icon name)].
   * The separator for the two fields is ':'. If there is no separator, an empty
   * string is returned for the icon set and the entire value is returned for
   * the icon name. If the argument is falsy, returns an array of two empty strings.
   * Throws an error if the name contains two or more ':' separators.
   * Examples:
   *   `'social:cake' -> ['social', 'cake']
   *   'penguin' -> ['', 'penguin']
   *   null -> ['', '']
   *   'a:b:c' -> (throws Error)`
   *
   * 把一个 svgIcon 绑定值拆分成它的图标集和图标名称组件。返回一个 [(图标集), (图标名称)] 结构的双元素数组。这两个字段之间的分隔符是 ':'。如果没有分隔符，则为图标集返回一个空字符串，并为图标名返回整个值。如果参数为假值，则返回一个包含两个空字符串的数组。如果名字中包含两个或多个“:”分隔符，就会抛出一个错误。例如：
   *   `'social:cake' -> ['social', 'cake']
   *   'penguin' -> ['', 'penguin']
   *   null -> ['', '']
   *   'a:b:c' -> (throws Error)`
   *
   */
  private _splitIconName(iconName: string): [string, string] {
    if (!iconName) {
      return ['', ''];
    }
    const parts = iconName.split(':');
    switch (parts.length) {
      case 1:
        return ['', parts[0]]; // Use default namespace.
      case 2:
        return <[string, string]>parts;
      default:
        throw Error(`Invalid icon name: "${iconName}"`); // TODO: add an ngDevMode check
    }
  }

  ngOnInit() {
    // Update font classes because ngOnChanges won't be called if none of the inputs are present,
    // e.g. <mat-icon>arrow</mat-icon> In this case we need to add a CSS class for the default font.
    this._updateFontIconClasses();
  }

  ngAfterViewChecked() {
    const cachedElements = this._elementsWithExternalReferences;

    if (cachedElements && cachedElements.size) {
      const newPath = this._location.getPathname();

      // We need to check whether the URL has changed on each change detection since
      // the browser doesn't have an API that will let us react on link clicks and
      // we can't depend on the Angular router. The references need to be updated,
      // because while most browsers don't care whether the URL is correct after
      // the first render, Safari will break if the user navigates to a different
      // page and the SVG isn't re-rendered.
      if (newPath !== this._previousPath) {
        this._previousPath = newPath;
        this._prependPathToReferences(newPath);
      }
    }
  }

  ngOnDestroy() {
    this._currentIconFetch.unsubscribe();

    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }
  }

  _usingFontIcon(): boolean {
    return !this.svgIcon;
  }

  private _setSvgElement(svg: SVGElement) {
    this._clearSvgElement();

    // Note: we do this fix here, rather than the icon registry, because the
    // references have to point to the URL at the time that the icon was created.
    const path = this._location.getPathname();
    this._previousPath = path;
    this._cacheChildrenWithExternalReferences(svg);
    this._prependPathToReferences(path);
    this._elementRef.nativeElement.appendChild(svg);
  }

  private _clearSvgElement() {
    const layoutElement: HTMLElement = this._elementRef.nativeElement;
    let childCount = layoutElement.childNodes.length;

    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }

    // Remove existing non-element child nodes and SVGs, and add the new SVG element. Note that
    // we can't use innerHTML, because IE will throw if the element has a data binding.
    while (childCount--) {
      const child = layoutElement.childNodes[childCount];

      // 1 corresponds to Node.ELEMENT_NODE. We remove all non-element nodes in order to get rid
      // of any loose text nodes, as well as any SVG elements in order to remove any old icons.
      if (child.nodeType !== 1 || child.nodeName.toLowerCase() === 'svg') {
        child.remove();
      }
    }
  }

  private _updateFontIconClasses() {
    if (!this._usingFontIcon()) {
      return;
    }

    const elem: HTMLElement = this._elementRef.nativeElement;
    const fontSetClasses = (
      this.fontSet
        ? this._iconRegistry.classNameForFontAlias(this.fontSet).split(/ +/)
        : this._iconRegistry.getDefaultFontSetClass()
    ).filter(className => className.length > 0);

    this._previousFontSetClass.forEach(className => elem.classList.remove(className));
    fontSetClasses.forEach(className => elem.classList.add(className));
    this._previousFontSetClass = fontSetClasses;

    if (
      this.fontIcon !== this._previousFontIconClass &&
      !fontSetClasses.includes('mat-ligature-font')
    ) {
      if (this._previousFontIconClass) {
        elem.classList.remove(this._previousFontIconClass);
      }
      if (this.fontIcon) {
        elem.classList.add(this.fontIcon);
      }
      this._previousFontIconClass = this.fontIcon;
    }
  }

  /**
   * Cleans up a value to be used as a fontIcon or fontSet.
   * Since the value ends up being assigned as a CSS class, we
   * have to trim the value and omit space-separated values.
   *
   * 清理一个值，用作 fontIcon 或 fontSet。由于该值最终被赋值为一个 CSS 类，我们不得不修剪它并省略空格分隔的值。
   *
   */
  private _cleanupFontValue(value: string) {
    return typeof value === 'string' ? value.trim().split(' ')[0] : value;
  }

  /**
   * Prepends the current path to all elements that have an attribute pointing to a `FuncIRI`
   * reference. This is required because WebKit browsers require references to be prefixed with
   * the current path, if the page has a `base` tag.
   *
   * 在所有具有指向 `FuncIRI` 引用属性的元素前面加上当前路径。如果当前页面含有 `base` 标签，那么 WebKit 的浏览器就会要求引用带有当前路径的前缀。
   *
   */
  private _prependPathToReferences(path: string) {
    const elements = this._elementsWithExternalReferences;

    if (elements) {
      elements.forEach((attrs, element) => {
        attrs.forEach(attr => {
          element.setAttribute(attr.name, `url('${path}#${attr.value}')`);
        });
      });
    }
  }

  /**
   * Caches the children of an SVG element that have `url()`
   * references that we need to prefix with the current path.
   *
   * 缓存 SVG 元素中带有 `url()` 引用的子元素，我们需要用当前路径作为前缀。
   *
   */
  private _cacheChildrenWithExternalReferences(element: SVGElement) {
    const elementsWithFuncIri = element.querySelectorAll(funcIriAttributeSelector);
    const elements = (this._elementsWithExternalReferences =
      this._elementsWithExternalReferences || new Map());

    for (let i = 0; i < elementsWithFuncIri.length; i++) {
      funcIriAttributes.forEach(attr => {
        const elementWithReference = elementsWithFuncIri[i];
        const value = elementWithReference.getAttribute(attr);
        const match = value ? value.match(funcIriPattern) : null;

        if (match) {
          let attributes = elements.get(elementWithReference);

          if (!attributes) {
            attributes = [];
            elements.set(elementWithReference, attributes);
          }

          attributes!.push({name: attr, value: match[1]});
        }
      });
    }
  }

  /**
   * Sets a new SVG icon with a particular name.
   *
   * 设置一个带有特定名字的新 SVG 图标。
   *
   */
  private _updateSvgIcon(rawName: string | undefined) {
    this._svgNamespace = null;
    this._svgName = null;
    this._currentIconFetch.unsubscribe();

    if (rawName) {
      const [namespace, iconName] = this._splitIconName(rawName);

      if (namespace) {
        this._svgNamespace = namespace;
      }

      if (iconName) {
        this._svgName = iconName;
      }

      this._currentIconFetch = this._iconRegistry
        .getNamedSvgIcon(iconName, namespace)
        .pipe(take(1))
        .subscribe(
          svg => this._setSvgElement(svg),
          (err: Error) => {
            const errorMessage = `Error retrieving icon ${namespace}:${iconName}! ${err.message}`;
            this._errorHandler.handleError(new Error(errorMessage));
          },
        );
    }
  }
}
