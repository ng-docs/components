# V9 HammerJS migration

# V9 HammerJS 的迁移

Angular Material, as of version 9, no longer requires HammerJS for any component. Components which
previously depended on HammerJS no longer provide a [`HAMMER_GESTURE_CONFIG`][1] that will
enable use of HammerJS events in templates.

在版本 9 中，Angular Material 的任何组件都不再需要 HammerJS。以前依赖于 HammerJS 的组件不再提供[`HAMMER_GESTURE_CONFIG`][1]，以便能在模板中使用 HammerJS 事件。 

Additionally, the `GestureConfig` export from `@angular/material/core` has been marked as
deprecated and will be removed in version 10.

此外，来自 `@angular/material/core` 的 `GestureConfig` 导出已被标记为弃用，并将在版本 10 中删除。

## Why is a migration needed?

## 为何需要进行迁移？

Since HammerJS previously was a requirement for a few Angular Material components, projects might
have installed `HammerJS` exclusively for Angular Material. Since HammerJS is no longer needed when
updating to v9, the dependency on HammerJS can be removed if it's not used directly in your
application.

HammerJS 以前只是少数 Angular Material 组件所需要的，所以项目可能要专门为 Angular Material 安装 `HammerJS`。由于在更新到 v9 时不再需要 HammerJS，如果它没有直接在你的应用中使用，就可以删除对 HammerJS 的依赖。

In some cases, projects use HammerJS events in templates while relying on Angular Material
modules to set up the HammerJS event plugin. Since this is no longer the case in version 9,
such projects need to manually configure the HammerJS event plugin in order to continue using
these HammerJS events.

在某些情况下，项目会在模板中使用 HammerJS 事件，从而依赖 Angular Material 模块来设置 HammerJS 事件插件。由于版本 9 中情况发生了变化，所以这些项目需要手动配置 HammerJS 事件插件才能继续使用这些 HammerJS 事件。

## What does the migration do?

## 本迁移是做什么的？

The migration automatically removes HammerJS from your project if HammerJS is not used.

如果没有使用 HammerJS，迁移会自动从项目中删除 HammerJS。

Additionally, Angular Material's `GestureConfig` \(now deprecated\) defined custom HammerJS gestures.
If your application directly uses any of these gestures, the migration will introduce a new
application-specific configuration for these custom gestures, removing the dependency on Angular
Material's `GestureConfig`.

此外，Angular Material 的 `GestureConfig`（已废弃）定义了一些自定义 HammerJS 手势。如果你的应用程序直接使用这些手势，本迁移将为这些自定义手势引入新的特定于应用程序的配置，取消对 Angular Material 中 `GestureConfig` 的依赖。

Finally, if your application uses any of the custom HammerJS gestures provided by Angular Material's
`GestureConfig`, or the default HammerJS gestures, the migration will add an import for Angular's
new `HammerModule`, which enabled HammerJS event bindings. These bindings were previously enabled
by default in Angular versions 8 and below.

最后，如果你的应用使用 Angular Material 中 `GestureConfig` 提供的任何自定义 HammerJS 手势，或默认的 HammerJS 手势，本迁移就会添加一个对 `HammerModule` 的新导入，它启用了 HammerJS 事件绑定。Angular 8 及以下版本默认启用了这些绑定。

If your application provides a custom [`HAMMER_GESTURE_CONFIG`][1] and also references the
deprecated Angular Material `GestureConfig`, the migration will print a warning about
ambiguous usage. The migration cannot migrate your project automatically and manual changes
are required. Read more [in the dedicated section](#the-migration-reported-ambiguous-usage-what-should-i-do).

如果你的应用提供了一个自定义的 [`HAMMER_GESTURE_CONFIG`][1]，并且引用了那个已弃用的 Angular Material `GestureConfig`，那么本迁移就会打印一个关于有歧义用法的警告。本迁移无法自动迁移该项目，需要手动修改。欲知详情，参见[专门的章节](#the-migration-reported-ambiguous-usage-what-should-i-do)。

## How does the schematic remove HammerJS?

## 原理图如何去掉 HammerJS？

HammerJS can be set up in many ways. The migration handles the most common cases, covering
approaches recommended by Angular Material in the past. The migration performs the following steps:

HammerJS 可以通过多种方式进行设置。本迁移可以处理最常见的情况，包括过去 Angular Materials 推荐的方法。迁移的执行过程如下：

*1.* Remove `hammerjs` from your project `package.json`.

*1.* 从项目的 `package.json` 中删除 `hammerjs`。

```json
{
  "dependencies": {
    "hammerjs": "..."
  }
}
```

*2.* Remove script imports to `hammerjs` in the `index.html` file.

*2.* 删除 `index.html` 文件中对 `hammerjs` 的导入。

```html
<script src="https://my-cdn.io/hammer.min.js"></script>
```

*3.* Remove [side-effect imports][2] to `hammerjs`.

*3.*删除到 `hammerjs` 的[副作用导入][2]。

```typescript
import 'hammerjs';
```

The migration cannot automatically remove HammerJS from tests. Please manually clean up
the test setup and resolve any test issues. Read more in a
[dedicated section for test migration](#how-to-migrate-my-tests).

迁移不能自动从测试中删除 HammerJS。请手动清理测试的设置代码并解决所有测试问题。阅读[专题文章](#how-to-migrate-my-tests)以了解测试迁移的更多内容。

## How do I migrate references to the deprecated `GestureConfig`?

## 如何迁移到已弃用的 `GestureConfig` 的引用？

The `GestureConfig` can be consumed in multiple ways. The migration covers the most common cases.
The most common case is that an `NgModule` in your application directly provides `GestureConfig`:

`GestureConfig` 可以通过多种方式使用。迁移涵盖了最常见的情况。最常见的情况是应用中的某个 `NgModule` 直接提供了 `GestureConfig` ：

```typescript
import {GestureConfig} from '@angular/material/core';

@NgModule({
  ...
  providers: [
    {provide: HAMMER_GESTURE_CONFIG, useClass: GestureConfig}
  ],
})
export class AppModule {}
```

If this pattern is found in your project, it usually means that a component relies on the
deprecated `GestureConfig` in order to use HammerJS events in the template. If this is the case,
the migration automatically creates a new gesture config which supports the used HammerJS
events. All references to the deprecated gesture config will be rewritten to the newly created one.

如果你的项目中发现了这种模式，通常就意味着组件依赖于弃用的 `GestureConfig` 才能在模板中使用 HammerJS 事件。如果是这种情况，本迁移就会自动创建一个新的手势配置，它支持使用过的 HammerJS 事件。所有对弃用手势配置的引用都会被重写成新创建的那个。

If no event from the deprecated config is used, the provider declaration can be safely removed
from the module. This is automatically done by the migration.

如果没有使用已弃用配置中的任何事件，就可以安全地从模块中删除提供者声明。这是迁移过程中自动完成的。

There are other patterns where the deprecated `GestureConfig` is extended, injected or used
in combination with a different custom gesture config. These patterns cannot be handled
automatically, but the migration will report such patterns and ask you to perform manual cleanup.

还有一些模式对弃用的 `GestureConfig` 进行了扩展、注入或与其他自定义手势配置组合使用。这些模式无法自动处理，但是本迁移会报告这些模式，并要求你进行手动清理。

<a name="test-migration"></a>

## How to migrate my tests?

## 如何迁移我的测试？

Components in your project might use Angular Material components which previously depended
upon HammerJS. There might be unit tests for these components which also test gesture functionality
of the Angular Material components. For such unit tests, identify all failing gesture tests. Then
you should rework these tests to dispatch proper events, in order to simulate gestures, or
delete the tests. Specifically gesture tests for the `<mat-slide-toggle>` should be removed.
This is because the `<mat-slide-toggle>` no longer supports gestures.

你项目中的组件可能会使用之前依赖于 HammerJS 的 Angular Material 组件。这些组件可能还有单元测试，它们也测试了 Angular Material 组件的手势功能。对于这样的单元测试，要确定所有失败的手势测试。然后，你应该重新修改这些测试来发送适当的事件，以模拟手势，或删除这些测试。特别是应该删除 `<mat-slide-toggle>` 的手势测试，这是因为 `<mat-slide-toggle>` 不再支持手势了。

If some unit tests depend on the deprecated Angular Material `GestureConfig` to simulate gesture
events, the reference should either be removed and tests reworked to use DOM events, or the
reference should be changed to the new gesture config created by the migration.

如果某些单元测试依赖于弃用的 Angular Material `GestureConfig` 来模拟手势事件，那么该引用应该被删除，并且重新编写这些测试来使用这些 DOM 事件，或者应该把其引用改为该迁移所创建的新手势配置。

If HammerJS has been removed from your project by the migration, you might need to refactor
the test setup that provides HammerJS. This is usually done in your test main file \(usually
in `src/test.ts`\) where `hammerjs` may be imported.

如果 HammerJS 已经被本迁移从项目中移除了，你可能需要重构提供 HammerJS 的测试设置代码。这通常是在测试主文件（通常是 `src/test.ts` ）中完成的，`hammerjs` 可能是在那里导入的。

```typescript
import 'hammerjs';
```

<a name="what-to-do-ambiguous-usage"></a>

## The migration reported ambiguous usage. What should I do?

## 本迁移报告了“有歧义用法”。我该怎么办？

**Case 1**: It detected that a HammerJS event provided by the deprecated `GestureConfig` is
used in a component template. This is because the migration relies on static analysis to detect
event bindings and can never guarantee that an event binding is bound to the Hammer gesture
plugin, or to an actual `@Output`. For example:

**案例 1**：它检测到组件模板中使用了已弃用的 `GestureConfig` 所提供的 HammerJS 事件。这是因为本迁移依赖于静态分析来检测事件绑定，并且永远不能保证没有事件绑定用到了 Hammer 手势插件，或者绑定到实际的 `@Output`。例如：

```html
<image-rotator (rotate)="onRotate()"></image-rotator>
```

In the example above, `rotate` could be an event from the deprecated `GestureConfig`, or an
`@Output` from `<image-rotator>`. The migration warns you about this to raise awareness that it
might have _incorrectly kept_ HammerJS. Please check if you can remove HammerJS from the project
manually.

在上面的例子中， `rotate` 可能是来自已弃用的 `GestureConfig` 的事件，也可以是来自 `<image-rotator>` 的 `@Output`。这次移植会警告你这件事，以提高人们对它可能*错误地保留了* HammerJS 的认识。请检查你是否可以手动从项目中删除 HammerJS。

**Case 2**: The deprecated Angular Material `GestureConfig` is used in combination with a
custom [`HAMMER_GESTURE_CONFIG`][1]. This case is ambiguous because the migration is unable
to detect whether a given HammerJS event binding corresponds to the custom gesture config, or to
the deprecated Angular Material gesture config. If such a warning has been reported, check
if you can remove the references to the deprecated `GestureConfig`, or if you need to update your
existing, custom gesture config to handle the events provided by the deprecated Angular Material
`GestureConfig`.

**案例 2**：弃用的 Angular Material `GestureConfig` 与自定义 [`HAMMER_GESTURE_CONFIG`][1] 结合使用。这种情况有歧义，因为迁移无法检测给定的 HammerJS 事件绑定是对应于自定义手势配置，还是对应于弃用的 Angular Material 手势配置。如果报告了这样的警告，请检查你是否可以移除对弃用的 `GestureConfig` 的引用，或者你是否需要更新现有的自定义手势配置来处理弃用的 Angular Material `GestureConfig` 所提供的事件。

[1]: https://v9.angular.io/api/platform-browser/HammerGestureConfig

[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Import_a_module_for_its_side_effects_only
