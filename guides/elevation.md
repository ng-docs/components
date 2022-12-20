# Applying Elevation

# 应用纵深

[The Material Design specification][material-elevation] gives guidance on expressing elevation on
UI elements by adding shadows. Angular Material provides CSS classes and Sass mixins for adding
these shadows.

[Material Design 规范][material-elevation]提供了关于如何通过添加阴影在 UI 元素上表达纵深的指导。 Angular Material 提供了一些 CSS 类和 Sass mixins，用来添加这些阴影。

[material-elevation]: https://material.io/design/environment/elevation.html

## Elevation CSS classes

## 表示纵深的 CSS 类

The `core-theme` Sass mixin, described in the [theming guide][theming-guide], emits CSS classes for applying
elevation. These classes follow the pattern `mat-elevation-z#`, where `#` is the elevation number
you want, from 0 to 24. These predefined classes use the CSS `box-shadow` settings defined by the
Material Design specification.

[主题指南][theming-guide]中所讲的 `core-theme` Sass mixin，会生成用于控制纵深的 CSS 类。这些类遵循统一的模式 `mat-elevation-z#` ，其中 `#` 是你想用的纵深数字，范围从 0 到 24。这些预定义的类使用 Material Design 规范定义的 `box-shadow` 设置。

You can dynamically change elevation on an element by swapping elevation CSS classes.

你可以通过更换纵深 CSS 类来动态更改元素的纵深。

```html
<div [class.mat-elevation-z2]="!isActive" [class.mat-elevation-z8]="isActive"></div>
```

<!-- example(elevation-overview) -->

[theming-guide]: https://material.angular.io/guide/theming#applying-a-theme-to-components

## Elevation Sass mixins

## 纵深 Sass mixin

In addition to the predefined CSS classes, you can apply elevation styles using the `elevation`
Sass mixin. This mixin accepts a `$zValue` and an optional `$color`. The `$zValue` is a number from
0 to 24, representing the semantic elevation of the element, that controls the intensity of the
box-shadow. You can use the `$color` parameter to further customize the shadow appearance.

除了预定义的 CSS 类之外，你还可以使用 `elevation` Sass mixin 来应用纵深样式。此 mixin 接受 `$zValue` 和可选的 `$color` 参数。`$zValue` 是一个从 0 到 24 的数字，代表元素的语义化纵深，它会控制盒子阴影的强度。你可以使用 `$color` 参数进一步自定义阴影外观。

```scss
@use '@angular/material' as mat;

.my-class-with-default-shadow {
    // Adds a shadow for elevation level 2 with default color and full opacity:
    @include mat.elevation(2);
}

.my-class-with-custom-shadow {
    // Adds a shadow for elevation level 2 with color #e91e63 and 80% of the default opacity:
    @include mat.elevation(2, #e91e63, 0.8);
}
```

### Overridable elevation

### 可覆盖的纵深

When authoring a component, you may want to specify a default elevation that the component consumer
can override. You can accomplish this by using the `overridable-elevation` Sass mixin. This behaves
identically to the `elevation` mixin, except that the styles only apply when the element does not
have a CSS class matching the pattern `mat-elevation-z#`, as described in
[Elevation CSS classes](#elevation-css-classes) above.

在创作组件时，你可能需要指定一个默认纵深，而组件的使用者可以覆盖它。你可以使用 `overridable-elevation` Sass Mixin 来完成此操作。此行为与 `elevation` mixin 的行为相同，但是这些样式只有在元素上没有符合 `mat-elevation-z#` 模式的 CSS 类时才适用，如上面的[纵深 CSS 类](#elevation-css-classes)中所述。

### Animating elevation

### 动画纵深

You can use the `elevation-transition` mixin to add a transition when elevation changes.

你可以使用 `elevation-transition` Mixin 来添加纵深变化时的转场动画。

```scss
@use '@angular/material' as mat;

.my-class {
    @include mat.elevation-transition();
    @include mat.elevation(2);

    &:active {
        @include mat.elevation(8);
  }
}
```