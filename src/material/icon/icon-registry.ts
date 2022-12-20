/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {
  ErrorHandler,
  Inject,
  Injectable,
  InjectionToken,
  OnDestroy,
  Optional,
  SecurityContext,
  SkipSelf,
} from '@angular/core';
import {DomSanitizer, SafeHtml, SafeResourceUrl} from '@angular/platform-browser';
import {forkJoin, Observable, of as observableOf, throwError as observableThrow} from 'rxjs';
import {catchError, finalize, map, share, tap} from 'rxjs/operators';
import {TrustedHTML, trustedHTMLFromString} from './trusted-types';

/**
 * Returns an exception to be thrown in the case when attempting to
 * load an icon with a name that cannot be found.
 *
 * 当尝试加载一个名字无法找到的图标时，返回一个要抛出的异常。
 *
 * @docs-private
 */
export function getMatIconNameNotFoundError(iconName: string): Error {
  return Error(`Unable to find icon with the name "${iconName}"`);
}

/**
 * Returns an exception to be thrown when the consumer attempts to use
 * `<mat-icon>` without including @angular/common/http.
 *
 * 使用 `<mat-icon>` 但没有导入 @angular/common/http 时，会返回一个异常。
 *
 * @docs-private
 */
export function getMatIconNoHttpProviderError(): Error {
  return Error(
    'Could not find HttpClient provider for use with Angular Material icons. ' +
      'Please include the HttpClientModule from @angular/common/http in your ' +
      'app imports.',
  );
}

/**
 * Returns an exception to be thrown when a URL couldn't be sanitized.
 *
 * 当 URL 无法清理时，返回要抛出的异常。
 *
 * @param url URL that was attempted to be sanitized.
 *
 * 试图清理的 URL
 *
 * @docs-private
 */
export function getMatIconFailedToSanitizeUrlError(url: SafeResourceUrl): Error {
  return Error(
    `The URL provided to MatIconRegistry was not trusted as a resource URL ` +
      `via Angular's DomSanitizer. Attempted URL was "${url}".`,
  );
}

/**
 * Returns an exception to be thrown when a HTML string couldn't be sanitized.
 *
 * 当 HTML 字符串无法清理时，返回抛出的异常。
 *
 * @param literal HTML that was attempted to be sanitized.
 *
 * 试图清理的 HTML。
 *
 * @docs-private
 */
export function getMatIconFailedToSanitizeLiteralError(literal: SafeHtml): Error {
  return Error(
    `The literal provided to MatIconRegistry was not trusted as safe HTML by ` +
      `Angular's DomSanitizer. Attempted literal was "${literal}".`,
  );
}

/**
 * Options that can be used to configure how an icon or the icons in an icon set are presented.
 *
 * 一个选项，可以用来配置如何展示一个图标或图标集。
 *
 */
export interface IconOptions {
  /**
   * View box to set on the icon.
   *
   * 在图标上设置的 viewBox。
   *
   */
  viewBox?: string;

  /**
   * Whether or not to fetch the icon or icon set using HTTP credentials.
   *
   * 是否要使用 HTTP 凭据获取图标或图标集。
   *
   */
  withCredentials?: boolean;
}

/**
 * Function that will be invoked by the icon registry when trying to resolve the
 * URL from which to fetch an icon. The returned URL will be used to make a request for the icon.
 *
 * 尝试解析用来提取图标的 URL 时，图标注册表会调用该函数。返回的 URL 将用于发出图标请求。
 *
 */
export type IconResolver = (
  name: string,
  namespace: string,
) => SafeResourceUrl | SafeResourceUrlWithIconOptions | null;

/**
 * Object that specifies a URL from which to fetch an icon and the options to use for it.
 *
 * 该对象用于指定要提取图标的 URL 以及要使用的图标选项。
 *
 */
export interface SafeResourceUrlWithIconOptions {
  url: SafeResourceUrl;
  options: IconOptions;
}

/**
 * Configuration for an icon, including the URL and possibly the cached SVG element.
 *
 * 图标的配置，包括 URL 和可能缓存过的 SVG 元素。
 *
 * @docs-private
 */
class SvgIconConfig {
  svgElement: SVGElement | null;

  constructor(
    public url: SafeResourceUrl,
    public svgText: TrustedHTML | null,
    public options?: IconOptions,
  ) {}
}

/**
 * Icon configuration whose content has already been loaded.
 *
 * 已加载过内容的图标配置。
 *
 */
type LoadedSvgIconConfig = SvgIconConfig & {svgText: TrustedHTML};

/**
 * Service to register and display icons used by the `<mat-icon>` component.
 *
 * 本服务用来注册和显示供 `<mat-icon>` 组件使用的图标。
 *
 * - Registers icon URLs by namespace and name.
 *
 *   按命名空间和名称注册图标 URL。
 *
 * - Registers icon set URLs by namespace.
 *
 *   按命名空间注册图标集的 URL。
 *
 * - Registers aliases for CSS classes, for use with icon fonts.
 *
 *   为 CSS 类注册别名，用于字体图标。
 *
 * - Loads icons from URLs and extracts individual icons from icon sets.
 *
 *   从 URL 中加载图标，并从图标集中提取各个图标。
 *
 */
@Injectable({providedIn: 'root'})
export class MatIconRegistry implements OnDestroy {
  private _document: Document;

  /**
   * URLs and cached SVG elements for individual icons. Keys are of the format "[namespace]&#x3A;[icon]".
   *
   * 各个图标的 URL 和缓存的 SVG 元素。键的格式为“[namespace]&#x3A;[icon]”。
   */
  private _svgIconConfigs = new Map<string, SvgIconConfig>();

  /**
   * SvgIconConfig objects and cached SVG elements for icon sets, keyed by namespace.
   * Multiple icon sets can be registered under the same namespace.
   *
   * SvgIconConfig 对象和图标集里的缓存 SVG 元素，以名称空间为键。可以在同一个命名空间下注册多个图标集。
   *
   */
  private _iconSetConfigs = new Map<string, SvgIconConfig[]>();

  /**
   * Cache for icons loaded by direct URLs.
   *
   * 通过直接 URL 加载的图标的缓存。
   *
   */
  private _cachedIconsByUrl = new Map<string, SVGElement>();

  /**
   * In-progress icon fetches. Used to coalesce multiple requests to the same URL.
   *
   * 正进行中的图标提取请求。用来把多个请求合并成同一个 URL。
   *
   */
  private _inProgressUrlFetches = new Map<string, Observable<TrustedHTML>>();

  /**
   * Map from font identifiers to their CSS class names. Used for icon fonts.
   *
   * 从字体标识符映射到它们的 CSS 类名。用于字体图标。
   *
   */
  private _fontCssClassesByAlias = new Map<string, string>();

  /**
   * Registered icon resolver functions.
   *
   * 已注册的图标解析器函数。
   *
   */
  private _resolvers: IconResolver[] = [];

  /**
   * The CSS classes to apply when an `<mat-icon>` component has no icon name, url, or font
   * specified. The default 'material-icons' value assumes that the material icon font has been
   * loaded as described at http://google.github.io/material-design-icons/#icon-font-for-the-web
   *
   * 当 `<mat-icon>` 组件没有指定图标名、url 或字体时，要应用的 CSS 类。默认的 “material-icons” 值假定已加载了 Material 字体图标，详见 http://google.github.io/material-design-icons/#icon-font-for-the-web
   *
   */
  private _defaultFontSetClass = ['material-icons', 'mat-ligature-font'];

  constructor(
    @Optional() private _httpClient: HttpClient,
    private _sanitizer: DomSanitizer,
    @Optional() @Inject(DOCUMENT) document: any,
    private readonly _errorHandler: ErrorHandler,
  ) {
    this._document = document;
  }

  /**
   * Registers an icon by URL in the default namespace.
   *
   * 在默认命名空间中用 URL 注册一个图标。
   *
   * @param iconName Name under which the icon should be registered.
   *
   * 图标要注册成的名称。
   *
   * @param url
   */
  addSvgIcon(iconName: string, url: SafeResourceUrl, options?: IconOptions): this {
    return this.addSvgIconInNamespace('', iconName, url, options);
  }

  /**
   * Registers an icon using an HTML string in the default namespace.
   *
   * 在默认命名空间中使用 HTML 字符串注册一个图标。
   *
   * @param iconName Name under which the icon should be registered.
   *
   * 图标要注册成的名称。
   *
   * @param literal SVG source of the icon.
   *
   * 图标的 SVG 源码。
   *
   */
  addSvgIconLiteral(iconName: string, literal: SafeHtml, options?: IconOptions): this {
    return this.addSvgIconLiteralInNamespace('', iconName, literal, options);
  }

  /**
   * Registers an icon by URL in the specified namespace.
   *
   * 在指定的命名空间中按 URL 注册一个图标。
   *
   * @param namespace Namespace in which the icon should be registered.
   *
   * 要注册图标的命名空间。
   *
   * @param iconName Name under which the icon should be registered.
   *
   * 图标要注册成的名称。
   *
   * @param url
   */
  addSvgIconInNamespace(
    namespace: string,
    iconName: string,
    url: SafeResourceUrl,
    options?: IconOptions,
  ): this {
    return this._addSvgIconConfig(namespace, iconName, new SvgIconConfig(url, null, options));
  }

  /**
   * Registers an icon resolver function with the registry. The function will be invoked with the
   * name and namespace of an icon when the registry tries to resolve the URL from which to fetch
   * the icon. The resolver is expected to return a `SafeResourceUrl` that points to the icon,
   * an object with the icon URL and icon options, or `null` if the icon is not supported. Resolvers
   * will be invoked in the order in which they have been registered.
   *
   * 用注册表注册一个图标解析器函数。当注册表尝试解析用来获取图标的 URL 时，会以图标名称和命名空间为参数调用该函数。该解析器需要返回一个指向图标的 `SafeResourceUrl`，一个带有图标 URL 和图标选项的对象，如果不支持该图标，则返回 `null`。这些解析器会按照其注册时的顺序进行调用。
   *
   * @param resolver Resolver function to be registered.
   *
   * 要注册的解析器函数。
   *
   */
  addSvgIconResolver(resolver: IconResolver): this {
    this._resolvers.push(resolver);
    return this;
  }

  /**
   * Registers an icon using an HTML string in the specified namespace.
   *
   * 在指定的命名空间中，以 HTML 字符串注册一个图标。
   *
   * @param namespace Namespace in which the icon should be registered.
   *
   * 要注册图标的命名空间。
   *
   * @param iconName Name under which the icon should be registered.
   *
   * 图标要注册成的名称。
   *
   * @param literal SVG source of the icon.
   *
   * 图标的 SVG 源码。
   *
   */
  addSvgIconLiteralInNamespace(
    namespace: string,
    iconName: string,
    literal: SafeHtml,
    options?: IconOptions,
  ): this {
    const cleanLiteral = this._sanitizer.sanitize(SecurityContext.HTML, literal);

    // TODO: add an ngDevMode check
    if (!cleanLiteral) {
      throw getMatIconFailedToSanitizeLiteralError(literal);
    }

    // Security: The literal is passed in as SafeHtml, and is thus trusted.
    const trustedLiteral = trustedHTMLFromString(cleanLiteral);
    return this._addSvgIconConfig(
      namespace,
      iconName,
      new SvgIconConfig('', trustedLiteral, options),
    );
  }

  /**
   * Registers an icon set by URL in the default namespace.
   *
   * 在默认命名空间中通过 URL 注册一个图标集。
   *
   * @param url
   */
  addSvgIconSet(url: SafeResourceUrl, options?: IconOptions): this {
    return this.addSvgIconSetInNamespace('', url, options);
  }

  /**
   * Registers an icon set using an HTML string in the default namespace.
   *
   * 在默认命名空间中，使用 HTML 字符串注册一个图标集。
   *
   * @param literal SVG source of the icon set.
   *
   * 图标集的 SVG 源码。
   *
   */
  addSvgIconSetLiteral(literal: SafeHtml, options?: IconOptions): this {
    return this.addSvgIconSetLiteralInNamespace('', literal, options);
  }

  /**
   * Registers an icon set by URL in the specified namespace.
   *
   * 在指定的命名空间中，使用 HTML 字符串注册一个图标集。
   *
   * @param namespace Namespace in which to register the icon set.
   *
   * 要在其中注册图标集的命名空间。
   *
   * @param url
   */
  addSvgIconSetInNamespace(namespace: string, url: SafeResourceUrl, options?: IconOptions): this {
    return this._addSvgIconSetConfig(namespace, new SvgIconConfig(url, null, options));
  }

  /**
   * Registers an icon set using an HTML string in the specified namespace.
   *
   * 在指定的命名空间中，使用 HTML 字符串注册一个图标集。
   *
   * @param namespace Namespace in which to register the icon set.
   *
   * 要在其中注册图标集的命名空间。
   *
   * @param literal SVG source of the icon set.
   *
   * 图标集的 SVG 源码。
   *
   */
  addSvgIconSetLiteralInNamespace(
    namespace: string,
    literal: SafeHtml,
    options?: IconOptions,
  ): this {
    const cleanLiteral = this._sanitizer.sanitize(SecurityContext.HTML, literal);

    if (!cleanLiteral) {
      throw getMatIconFailedToSanitizeLiteralError(literal);
    }

    // Security: The literal is passed in as SafeHtml, and is thus trusted.
    const trustedLiteral = trustedHTMLFromString(cleanLiteral);
    return this._addSvgIconSetConfig(namespace, new SvgIconConfig('', trustedLiteral, options));
  }

  /**
   * Defines an alias for CSS class names to be used for icon fonts. Creating an matIcon
   * component with the alias as the fontSet input will cause the class name to be applied
   * to the `<mat-icon>` element.
   *
   * 为要用作字体图标的 CSS 类名定义一个别名。用此别名作为输入属性 fontSet 来创建 matIcon 组件会导致这个类名被应用到 `<mat-icon>` 元素中。
   *
   * If the registered font is a ligature font, then don't forget to also include the special
   * class `mat-ligature-font` to allow the usage via attribute. So register like this:
   *
   * 如果注册的字体是合字字体，那么不要忘记还要包括特殊类 `mat-ligature-font` 以允许通过属性使用它。所以要像这样注册：
   *
   * ```ts
   * iconRegistry.registerFontClassAlias('f1', 'font1 mat-ligature-font');
   * ```
   *
   * And use like this:
   *
   * 并像这样使用：
   *
   * ```html
   * <mat-icon fontSet="f1" fontIcon="home"></mat-icon>
   * ```
   *
   * @param alias Alias for the font.
   *
   * 该字体的别名。
   *
   * @param classNames Class names override to be used instead of the alias.
   *
   * 用于代替别名进行改写的类名。
   *
   */
  registerFontClassAlias(alias: string, classNames: string = alias): this {
    this._fontCssClassesByAlias.set(alias, classNames);
    return this;
  }

  /**
   * Returns the CSS class name associated with the alias by a previous call to
   * registerFontClassAlias. If no CSS class has been associated, returns the alias unmodified.
   *
   * 返回与先前调用 registerFontClassAlias 返回的别名相关联的 CSS 类名。如果没有关联的 CSS 类，则直接返回别名。
   *
   */
  classNameForFontAlias(alias: string): string {
    return this._fontCssClassesByAlias.get(alias) || alias;
  }

  /**
   * Sets the CSS classes to be used for icon fonts when an `<mat-icon>` component does not
   * have a fontSet input value, and is not loading an icon by name or URL.
   *
   * 当 `<mat-icon>` 组件的输入属性 fontSet 没有值，并且不是在按名字或 URL 加载图标时，设置要用于字体图标的 CSS 类名。
   *
   * @param className
   */
  setDefaultFontSetClass(...classNames: string[]): this {
    this._defaultFontSetClass = classNames;
    return this;
  }

  /**
   * Returns the CSS classes to be used for icon fonts when an `<mat-icon>` component does not
   * have a fontSet input value, and is not loading an icon by name or URL.
   *
   * 当 `<mat-icon>` 组件的输入属性 fontSet 没有值，并且不是在按名字或 URL 加载图标时，返回用于字体图标的 CSS 类名。
   *
   */
  getDefaultFontSetClass(): string[] {
    return this._defaultFontSetClass;
  }

  /**
   * Returns an Observable that produces the icon (as an `<svg>` DOM element) from the given URL.
   * The response from the URL may be cached so this will not always cause an HTTP request, but
   * the produced element will always be a new copy of the originally fetched icon. (That is,
   * it will not contain any modifications made to elements previously returned).
   *
   * 返回一个 Observable，用于根据指定的 URL 生成图标（比如 `<svg>` DOM 元素）。该 URL 的响应可能会被缓存，所以这并不总会导致 HTTP 请求，但是所生成的元素始终是原来获得的图标的新副本。（也就是说，它不会对以前返回的元素做任何修改）。
   *
   * @param safeUrl URL from which to fetch the SVG icon.
   *
   * 要从中获取 SVG 图标的 URL。
   *
   */
  getSvgIconFromUrl(safeUrl: SafeResourceUrl): Observable<SVGElement> {
    const url = this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeUrl);

    if (!url) {
      throw getMatIconFailedToSanitizeUrlError(safeUrl);
    }

    const cachedIcon = this._cachedIconsByUrl.get(url);

    if (cachedIcon) {
      return observableOf(cloneSvg(cachedIcon));
    }

    return this._loadSvgIconFromConfig(new SvgIconConfig(safeUrl, null)).pipe(
      tap(svg => this._cachedIconsByUrl.set(url!, svg)),
      map(svg => cloneSvg(svg)),
    );
  }

  /**
   * Returns an Observable that produces the icon (as an `<svg>` DOM element) with the given name
   * and namespace. The icon must have been previously registered with addIcon or addIconSet;
   * if not, the Observable will throw an error.
   *
   * 返回一个 Observable，用于根据指定的 URL 生成图标（比如 `<svg>` DOM 元素）。该图标必须先前已经使用 addIcon 或 addIconSet 注册过；如果没有，这个 Observable 就会抛出一个错误。
   *
   * @param name Name of the icon to be retrieved.
   *
   * 要检索的图标名称。
   *
   * @param namespace Namespace in which to look for the icon.
   *
   * 要在其中查找图标的命名空间。
   *
   */
  getNamedSvgIcon(name: string, namespace: string = ''): Observable<SVGElement> {
    const key = iconKey(namespace, name);
    let config = this._svgIconConfigs.get(key);

    // Return (copy of) cached icon if possible.
    if (config) {
      return this._getSvgFromConfig(config);
    }

    // Otherwise try to resolve the config from one of the resolver functions.
    config = this._getIconConfigFromResolvers(namespace, name);

    if (config) {
      this._svgIconConfigs.set(key, config);
      return this._getSvgFromConfig(config);
    }

    // See if we have any icon sets registered for the namespace.
    const iconSetConfigs = this._iconSetConfigs.get(namespace);

    if (iconSetConfigs) {
      return this._getSvgFromIconSetConfigs(name, iconSetConfigs);
    }

    return observableThrow(getMatIconNameNotFoundError(key));
  }

  ngOnDestroy() {
    this._resolvers = [];
    this._svgIconConfigs.clear();
    this._iconSetConfigs.clear();
    this._cachedIconsByUrl.clear();
  }

  /**
   * Returns the cached icon for a SvgIconConfig if available, or fetches it from its URL if not.
   *
   * 如果可用的话，返回 SvgIconConfig 的缓存图标；如果不可用，则从它的 URL 中获取它。
   *
   */
  private _getSvgFromConfig(config: SvgIconConfig): Observable<SVGElement> {
    if (config.svgText) {
      // We already have the SVG element for this icon, return a copy.
      return observableOf(cloneSvg(this._svgElementFromConfig(config as LoadedSvgIconConfig)));
    } else {
      // Fetch the icon from the config's URL, cache it, and return a copy.
      return this._loadSvgIconFromConfig(config).pipe(map(svg => cloneSvg(svg)));
    }
  }

  /**
   * Attempts to find an icon with the specified name in any of the SVG icon sets.
   * First searches the available cached icons for a nested element with a matching name, and
   * if found copies the element to a new `<svg>` element. If not found, fetches all icon sets
   * that have not been cached, and searches again after all fetches are completed.
   * The returned Observable produces the SVG element if possible, and throws
   * an error if no icon with the specified name can be found.
   *
   * 尝试在任何一个 SVG 图标集中找到一个具有指定名字的图标。首先会在可用的缓存图标中搜索名称能匹配的嵌套元素，如果找到，则把该元素复制到新的 `<svg>` 元素中。如果找不到，则获取所有尚未缓存的图标集，并在全部获取完后再次搜索。如果找到，返回的 Observable 就会发出 SVG 元素，否则就抛出一个错误。
   *
   */
  private _getSvgFromIconSetConfigs(
    name: string,
    iconSetConfigs: SvgIconConfig[],
  ): Observable<SVGElement> {
    // For all the icon set SVG elements we've fetched, see if any contain an icon with the
    // requested name.
    const namedIcon = this._extractIconWithNameFromAnySet(name, iconSetConfigs);

    if (namedIcon) {
      // We could cache namedIcon in _svgIconConfigs, but since we have to make a copy every
      // time anyway, there's probably not much advantage compared to just always extracting
      // it from the icon set.
      return observableOf(namedIcon);
    }

    // Not found in any cached icon sets. If there are icon sets with URLs that we haven't
    // fetched, fetch them now and look for iconName in the results.
    const iconSetFetchRequests: Observable<TrustedHTML | null>[] = iconSetConfigs
      .filter(iconSetConfig => !iconSetConfig.svgText)
      .map(iconSetConfig => {
        return this._loadSvgIconSetFromConfig(iconSetConfig).pipe(
          catchError((err: HttpErrorResponse) => {
            const url = this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, iconSetConfig.url);

            // Swallow errors fetching individual URLs so the
            // combined Observable won't necessarily fail.
            const errorMessage = `Loading icon set URL: ${url} failed: ${err.message}`;
            this._errorHandler.handleError(new Error(errorMessage));
            return observableOf(null);
          }),
        );
      });

    // Fetch all the icon set URLs. When the requests complete, every IconSet should have a
    // cached SVG element (unless the request failed), and we can check again for the icon.
    return forkJoin(iconSetFetchRequests).pipe(
      map(() => {
        const foundIcon = this._extractIconWithNameFromAnySet(name, iconSetConfigs);

        // TODO: add an ngDevMode check
        if (!foundIcon) {
          throw getMatIconNameNotFoundError(name);
        }

        return foundIcon;
      }),
    );
  }

  /**
   * Searches the cached SVG elements for the given icon sets for a nested icon element whose "id"
   * tag matches the specified name. If found, copies the nested element to a new SVG element and
   * returns it. Returns null if no matching element is found.
   *
   * 在指定图标集的缓存 SVG 元素中搜索 “id” 标签与指定名称相匹配的嵌套图标元素。如果找到，就把嵌套元素复制到一个新的 SVG 元素中并返回它。如果找不到，则返回 null。
   *
   */
  private _extractIconWithNameFromAnySet(
    iconName: string,
    iconSetConfigs: SvgIconConfig[],
  ): SVGElement | null {
    // Iterate backwards, so icon sets added later have precedence.
    for (let i = iconSetConfigs.length - 1; i >= 0; i--) {
      const config = iconSetConfigs[i];

      // Parsing the icon set's text into an SVG element can be expensive. We can avoid some of
      // the parsing by doing a quick check using `indexOf` to see if there's any chance for the
      // icon to be in the set. This won't be 100% accurate, but it should help us avoid at least
      // some of the parsing.
      if (config.svgText && config.svgText.toString().indexOf(iconName) > -1) {
        const svg = this._svgElementFromConfig(config as LoadedSvgIconConfig);
        const foundIcon = this._extractSvgIconFromSet(svg, iconName, config.options);
        if (foundIcon) {
          return foundIcon;
        }
      }
    }
    return null;
  }

  /**
   * Loads the content of the icon URL specified in the SvgIconConfig and creates an SVG element
   * from it.
   *
   * 加载 SvgIconConfig 中指定的图标 URL 的内容，并从中创建一个 SVG 元素。
   *
   */
  private _loadSvgIconFromConfig(config: SvgIconConfig): Observable<SVGElement> {
    return this._fetchIcon(config).pipe(
      tap(svgText => (config.svgText = svgText)),
      map(() => this._svgElementFromConfig(config as LoadedSvgIconConfig)),
    );
  }

  /**
   * Loads the content of the icon set URL specified in the
   * SvgIconConfig and attaches it to the config.
   *
   * 加载 SvgIconConfig 中指定的图标集 URL 的内容，并把它附着到配置对象中。
   *
   */
  private _loadSvgIconSetFromConfig(config: SvgIconConfig): Observable<TrustedHTML | null> {
    if (config.svgText) {
      return observableOf(null);
    }

    return this._fetchIcon(config).pipe(tap(svgText => (config.svgText = svgText)));
  }

  /**
   * Searches the cached element of the given SvgIconConfig for a nested icon element whose "id"
   * tag matches the specified name. If found, copies the nested element to a new SVG element and
   * returns it. Returns null if no matching element is found.
   *
   * 在指定的 SvgIconConfig 的缓存元素中搜索 “id” 标签与指定名称匹配的嵌套图标元素。如果找到，就把嵌套元素复制到一个新的 SVG 元素中并返回它。如果找不到，则返回 null。
   *
   */
  private _extractSvgIconFromSet(
    iconSet: SVGElement,
    iconName: string,
    options?: IconOptions,
  ): SVGElement | null {
    // Use the `id="iconName"` syntax in order to escape special
    // characters in the ID (versus using the #iconName syntax).
    const iconSource = iconSet.querySelector(`[id="${iconName}"]`);

    if (!iconSource) {
      return null;
    }

    // Clone the element and remove the ID to prevent multiple elements from being added
    // to the page with the same ID.
    const iconElement = iconSource.cloneNode(true) as Element;
    iconElement.removeAttribute('id');

    // If the icon node is itself an <svg> node, clone and return it directly. If not, set it as
    // the content of a new <svg> node.
    if (iconElement.nodeName.toLowerCase() === 'svg') {
      return this._setSvgAttributes(iconElement as SVGElement, options);
    }

    // If the node is a <symbol>, it won't be rendered so we have to convert it into <svg>. Note
    // that the same could be achieved by referring to it via <use href="#id">, however the <use>
    // tag is problematic on Firefox, because it needs to include the current page path.
    if (iconElement.nodeName.toLowerCase() === 'symbol') {
      return this._setSvgAttributes(this._toSvgElement(iconElement), options);
    }

    // createElement('SVG') doesn't work as expected; the DOM ends up with
    // the correct nodes, but the SVG content doesn't render. Instead we
    // have to create an empty SVG node using innerHTML and append its content.
    // Elements created using DOMParser.parseFromString have the same problem.
    // http://stackoverflow.com/questions/23003278/svg-innerhtml-in-firefox-can-not-display
    const svg = this._svgElementFromString(trustedHTMLFromString('<svg></svg>'));
    // Clone the node so we don't remove it from the parent icon set element.
    svg.appendChild(iconElement);

    return this._setSvgAttributes(svg, options);
  }

  /**
   * Creates a DOM element from the given SVG string.
   *
   * 根据指定的 SVG 字符串创建一个 DOM 元素。
   *
   */
  private _svgElementFromString(str: TrustedHTML): SVGElement {
    const div = this._document.createElement('DIV');
    div.innerHTML = str as unknown as string;
    const svg = div.querySelector('svg') as SVGElement;

    // TODO: add an ngDevMode check
    if (!svg) {
      throw Error('<svg> tag not found');
    }

    return svg;
  }

  /**
   * Converts an element into an SVG node by cloning all of its children.
   *
   * 通过克隆其所有子元素，把一个元素转换成一个 SVG 节点。
   *
   */
  private _toSvgElement(element: Element): SVGElement {
    const svg = this._svgElementFromString(trustedHTMLFromString('<svg></svg>'));
    const attributes = element.attributes;

    // Copy over all the attributes from the `symbol` to the new SVG, except the id.
    for (let i = 0; i < attributes.length; i++) {
      const {name, value} = attributes[i];

      if (name !== 'id') {
        svg.setAttribute(name, value);
      }
    }

    for (let i = 0; i < element.childNodes.length; i++) {
      if (element.childNodes[i].nodeType === this._document.ELEMENT_NODE) {
        svg.appendChild(element.childNodes[i].cloneNode(true));
      }
    }

    return svg;
  }

  /**
   * Sets the default attributes for an SVG element to be used as an icon.
   *
   * 设置要用作图标的 SVG 元素的默认属性。
   *
   */
  private _setSvgAttributes(svg: SVGElement, options?: IconOptions): SVGElement {
    svg.setAttribute('fit', '');
    svg.setAttribute('height', '100%');
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('focusable', 'false'); // Disable IE11 default behavior to make SVGs focusable.

    if (options && options.viewBox) {
      svg.setAttribute('viewBox', options.viewBox);
    }

    return svg;
  }

  /**
   * Returns an Observable which produces the string contents of the given icon. Results may be
   * cached, so future calls with the same URL may not cause another HTTP request.
   *
   * 返回一个 Observable，它生成指定图标的字符串内容。这些结果可能会被缓存，所以将来使用相同的 URL 调用它时可能不会导致其它 HTTP 请求。
   *
   */
  private _fetchIcon(iconConfig: SvgIconConfig): Observable<TrustedHTML> {
    const {url: safeUrl, options} = iconConfig;
    const withCredentials = options?.withCredentials ?? false;

    if (!this._httpClient) {
      throw getMatIconNoHttpProviderError();
    }

    // TODO: add an ngDevMode check
    if (safeUrl == null) {
      throw Error(`Cannot fetch icon from URL "${safeUrl}".`);
    }

    const url = this._sanitizer.sanitize(SecurityContext.RESOURCE_URL, safeUrl);

    // TODO: add an ngDevMode check
    if (!url) {
      throw getMatIconFailedToSanitizeUrlError(safeUrl);
    }

    // Store in-progress fetches to avoid sending a duplicate request for a URL when there is
    // already a request in progress for that URL. It's necessary to call share() on the
    // Observable returned by http.get() so that multiple subscribers don't cause multiple XHRs.
    const inProgressFetch = this._inProgressUrlFetches.get(url);

    if (inProgressFetch) {
      return inProgressFetch;
    }

    const req = this._httpClient.get(url, {responseType: 'text', withCredentials}).pipe(
      map(svg => {
        // Security: This SVG is fetched from a SafeResourceUrl, and is thus
        // trusted HTML.
        return trustedHTMLFromString(svg);
      }),
      finalize(() => this._inProgressUrlFetches.delete(url)),
      share(),
    );

    this._inProgressUrlFetches.set(url, req);
    return req;
  }

  /**
   * Registers an icon config by name in the specified namespace.
   *
   * 在指定的命名空间中按名称注册一个图标配置。
   *
   * @param namespace Namespace in which to register the icon config.
   *
   * 要在其中注册图标配置的命名空间。
   *
   * @param iconName Name under which to register the config.
   *
   * 用来注册配置的名字。
   *
   * @param config Config to be registered.
   *
   * 要注册的配置。
   *
   */
  private _addSvgIconConfig(namespace: string, iconName: string, config: SvgIconConfig): this {
    this._svgIconConfigs.set(iconKey(namespace, iconName), config);
    return this;
  }

  /**
   * Registers an icon set config in the specified namespace.
   *
   * 在指定的命名空间中注册一个图标集配置。
   *
   * @param namespace Namespace in which to register the icon config.
   *
   * 要在其中注册图标集配置的命名空间。
   *
   * @param config Config to be registered.
   *
   * 要注册的配置。
   *
   */
  private _addSvgIconSetConfig(namespace: string, config: SvgIconConfig): this {
    const configNamespace = this._iconSetConfigs.get(namespace);

    if (configNamespace) {
      configNamespace.push(config);
    } else {
      this._iconSetConfigs.set(namespace, [config]);
    }

    return this;
  }

  /**
   * Parses a config's text into an SVG element.
   *
   * 把配置文本解析成 SVG 元素。
   *
   */
  private _svgElementFromConfig(config: LoadedSvgIconConfig): SVGElement {
    if (!config.svgElement) {
      const svg = this._svgElementFromString(config.svgText);
      this._setSvgAttributes(svg, config.options);
      config.svgElement = svg;
    }

    return config.svgElement;
  }

  /**
   * Tries to create an icon config through the registered resolver functions.
   *
   * 尝试通过已注册的解析器函数创建一个图标配置。
   *
   */
  private _getIconConfigFromResolvers(namespace: string, name: string): SvgIconConfig | undefined {
    for (let i = 0; i < this._resolvers.length; i++) {
      const result = this._resolvers[i](name, namespace);

      if (result) {
        return isSafeUrlWithOptions(result)
          ? new SvgIconConfig(result.url, null, result.options)
          : new SvgIconConfig(result, null);
      }
    }

    return undefined;
  }
}

/** @docs-private */
export function ICON_REGISTRY_PROVIDER_FACTORY(
  parentRegistry: MatIconRegistry,
  httpClient: HttpClient,
  sanitizer: DomSanitizer,
  errorHandler: ErrorHandler,
  document?: any,
) {
  return parentRegistry || new MatIconRegistry(httpClient, sanitizer, document, errorHandler);
}

/** @docs-private */
export const ICON_REGISTRY_PROVIDER = {
  // If there is already an MatIconRegistry available, use that. Otherwise, provide a new one.
  provide: MatIconRegistry,
  deps: [
    [new Optional(), new SkipSelf(), MatIconRegistry],
    [new Optional(), HttpClient],
    DomSanitizer,
    ErrorHandler,
    [new Optional(), DOCUMENT as InjectionToken<any>],
  ],
  useFactory: ICON_REGISTRY_PROVIDER_FACTORY,
};

/**
 * Clones an SVGElement while preserving type information.
 *
 * 克隆 SVGElement，同时保留类型信息。
 *
 */
function cloneSvg(svg: SVGElement): SVGElement {
  return svg.cloneNode(true) as SVGElement;
}

/**
 * Returns the cache key to use for an icon namespace and name.
 *
 * 返回要用于图标命名空间和图标名称的缓存键。
 *
 */
function iconKey(namespace: string, name: string) {
  return namespace + ':' + name;
}

function isSafeUrlWithOptions(value: any): value is SafeResourceUrlWithIconOptions {
  return !!(value.url && value.options);
}
