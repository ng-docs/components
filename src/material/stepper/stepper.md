Angular Material's stepper provides a wizard-like workflow by dividing content into logical steps.

Angular Material 的步进器通过把内容拆分成一些逻辑步骤，提供了一个向导式的工作流。

Material stepper builds on the foundation of the CDK stepper that is responsible for the logic
that drives a stepped workflow. Material stepper extends the CDK stepper and has Material Design
styling.

Material 步进器基于 CDK 中的步进器 —— 它负责实现驱动步进式工作流的逻辑部分。而 Material 步进器扩展了 CDK 的步进器，让它具有 Material Design 的样式。

### Stepper variants

### 步进器的变体形式

There are two stepper variants: `horizontal` and `vertical`. You can switch between the two using
the `orientation` attribute.

有两个步进器组件：`mat-horizontal-stepper` 和 `mat-vertical-stepper`。
他们可以用相同方式使用，唯一的区别是步进器的方向。

<!-- example(stepper-overview) -->

<!-- example(stepper-vertical) -->

### Labels

### 标签

If a step's label is only text, then the `label` attribute can be used.

如果步进器的标签只是纯文本，那么可以使用 `label` 属性。

<!-- example({"example": "stepper-overview",
              "file": "stepper-overview-example.html",
              "region": "label"}) -->

For more complex labels, add a template with the `matStepLabel` directive inside the
`mat-step`.

对于更复杂的标签，可以在 `mat-step` 的 `matStepLabel` 指令中添加一个模板。

<!-- example({"example": "stepper-editable",
              "file": "stepper-editable-example.html",
              "region": "step-label"}) -->

#### Label position

#### 标签位置

For a horizontal `mat-stepper` it's possible to define the position of the label. `end` is the
default value, while `bottom` will place it under the step icon instead of at its side.
This behaviour is controlled by `labelPosition` property.

`mat-horizontal-stepper` 可以定义标签的位置。`end` 是默认值，而 `bottom` 会把它放在步骤图标的下面而不是侧面。这个行为是由 `labelPosition` 属性控制的。

<!-- example({"example": "stepper-label-position-bottom",
              "file": "stepper-label-position-bottom-example.html",
              "region": "label-position"}) -->

#### Header position

#### 标题位置

If you're using a horizontal stepper, you can control where the stepper's content is positioned
using the `headerPosition` input. By default it's on top of the content, but it can also be placed
under it.

如果你使用的是水平步进器，则可以使用 `headerPosition` 输入属性来控制步进器内容的位置。默认情况下，它位于内容的顶部，但也可以放在其下方。

<!-- example(stepper-header-position) -->

### Stepper buttons

### 步进器按钮

There are two button directives to support navigation between different steps:
`matStepperPrevious` and `matStepperNext`.

有两个按钮指令用来支持不同步骤之间的导航：`matStepperPrevious` 和 `matStepperNext`。

<!-- example({"example": "stepper-label-position-bottom",
              "file": "stepper-label-position-bottom-example.html",
              "region": "buttons"}) -->

### Linear stepper

### 线性步进器

The `linear` attribute can be set on `mat-stepper` to create a linear stepper that requires the
user to complete previous steps before proceeding to following steps. For each `mat-step`, the
`stepControl` attribute can be set to the top level `AbstractControl` that is used to check the
validity of the step.

可以设置 `mat-horizontal-stepper` 和 `mat-vertical-stepper` 的 `linear` 属性来创建线性步进器，它会要求用户必须完成了前面的步骤才能继续。
对于每个 `mat-step`，都可以把它的 `stepControl` 属性设置为一个上级 `AbstractControl` 来检查该步骤的有效性。

There are two possible approaches. One is using a single form for stepper, and the other is
using a different form for each step.

有两种可能的实现方式。一种是为整个步进器使用单一表单，另一种是为每个步骤都使用不同的表单。

Alternatively, if you don't want to use the Angular forms, you can pass in the `completed` property
to each of the steps which won't allow the user to continue until it becomes `true`. Note that if
both `completed` and `stepControl` are set, the `stepControl` will take precedence.

另外，如果你不想使用 Angular 的表单，也可以为每个步骤传入一个 `completed` 属性，在它变为 `true` 之前，都会阻止用户前进。
注意，如果同时设置了 `completed` 和 `stepControl`，那么 `stepControl` 优先。

#### Using a single form

#### 使用单一表单

When using a single form for the stepper, `matStepperPrevious` and `matStepperNext` have to be
set to `type="button"` in order to prevent submission of the form before all steps
are completed.

当步进器使用单一表单时，`matStepperPrevious` 和 `matStepperNext` 所在的元素都应该设置为 `type="button"`，以防止在完成了所有步骤之前提交该表单。

```html
<form [formGroup]="formGroup">
  <mat-stepper formArrayName="formArray" linear>
    <mat-step formGroupName="0" [stepControl]="formArray.get([0])">
      ...
      <div>
        <button mat-button matStepperNext type="button">Next</button>
      </div>
    </mat-step>
    <mat-step formGroupName="1" [stepControl]="formArray.get([1])">
      ...
      <div>
        <button mat-button matStepperPrevious type="button">Back</button>
        <button mat-button matStepperNext type="button">Next</button>
      </div>
    </mat-step>
    ...
  </mat-stepper>
</form>
```

#### Using a different form for each step

#### 为每个步骤使用不同的表单

```html
<mat-stepper orientation="vertical" linear>
  <mat-step [stepControl]="formGroup1">
    <form [formGroup]="formGroup1">
      ...
    </form>
  </mat-step>
  <mat-step [stepControl]="formGroup2">
    <form [formGroup]="formGroup2">
      ...
    </form>
  </mat-step>
</mat-stepper>
```

### Types of steps

### 步骤的类型

#### Optional step

#### 可选步骤

If completion of a step in linear stepper is not required, then the `optional` attribute can be set
on `mat-step`.

如果线性步进器中的某个步骤不是必须完成的，可以在那个 `mat-step` 上设置 `optional` 属性。

<!-- example({"example": "stepper-optional",
              "file": "stepper-optional-example.html",
              "region": "optional"}) -->

#### Editable step

#### 可编辑的步骤

By default, steps are editable, which means users can return to previously completed steps and
edit their responses. `editable="false"` can be set on `mat-step` to change the default.

默认情况下，每个步骤都是可编辑的，也就是说用户可以回到前一个已经完成的步骤，并编辑他们的回复。可以设置 `mat-step` 的 `editable="true"` 来修改这种默认行为。

<!-- example({"example": "stepper-editable",
              "file": "stepper-editable-example.html",
              "region": "editable"}) -->

#### Completed step

#### 已完成的步骤

By default, the `completed` attribute of a step returns `true` if the step is valid (in case of
linear stepper) and the user has interacted with the step. The user, however, can also override
this default `completed` behavior by setting the `completed` attribute as needed.

默认情况下，如果步骤是有效的（对于线性步进器），并且用户已经与该步骤进行过互动，那么该步骤的 `completed` 属性就会是 `true`。
不过，用户可以通过按需设置 `completed` 属性，来改写这种默认的 `completed` 行为。

#### Overriding icons

#### 改写图标

By default, the step headers will use the `create` and `done` icons from the Material design icon
set via `<mat-icon>` elements. If you want to provide a different set of icons, you can do so
by placing a `matStepperIcon` for each of the icons that you want to override. The `index`,
`active`, and `optional` values of the individual steps are available through template variables:

默认情况下，步骤头中会通过 `<mat-icon>` 元素来设置 Material Design 中的 `create` 和 `done` 图标。
如果你要提供另一个图标集，则可以为要覆盖的图标单独设置 `matStepperIcon`。每个步骤的 `index`、`active` 和 `optional`
的值都可以通过模板变量进行访问：

<!-- example({"example": "stepper-states",
              "file": "stepper-states-example.html",
              "region": "override-icons"}) -->

Note that you aren't limited to using the `mat-icon` component when providing custom icons.

注意，要想提供自定义图标，你不一定非要用 `mat-icon` 组件。

### Controlling the stepper animation

### 控制步进器动画

You can control the duration of the stepper's animation using the `animationDuration` input. If you
want to disable the animation completely, you can do so by setting the properties to `0ms`.

你可以使用 `animationDuration` 输入属性来控制步进器动画的持续时间。如果要完全禁用动画，可以通过将此属性设置为 `0ms` 来实现。

<!-- example(stepper-animations) -->

#### Step States

#### 步骤的状态

You can set the state of a step to whatever you want. The given state by default maps to an icon.
However, it can be overridden the same way as mentioned above.

你可以随意设置某个步骤的状态。默认情况下，指定的状态会映射到一个图标。不过，你也同样可以像前面所说的那样去覆盖它。

<!-- example({"example": "stepper-states",
              "file": "stepper-states-example.html",
              "region": "states"}) -->

In order to use the custom step states, you must add the `displayDefaultIndicatorType` option to
the global default stepper options which can be specified by providing a value for
`STEPPER_GLOBAL_OPTIONS` in your application's root module.

为了使用自定义的步骤状态，你必须把 `displayDefaultIndicatorType` 选项添加到全局的默认步进器选项中。你可以通过在应用的根模块中给 `STEPPER_GLOBAL_OPTIONS` 令牌提供一个值来指定它。

```ts
@NgModule({
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false }
    }
  ]
})
```

<!-- example(stepper-states) -->

### Error State

### 错误状态

If you want to show an error when the user moved past a step that hasn't been filled out correctly,
you can set the error message through the `errorMessage` input and configure the stepper to show
errors via the `showError` option in the `STEPPER_GLOBAL_OPTIONS` injection token. Note that since
`linear` steppers prevent a user from advancing past an invalid step to begin with, this setting
will not affect steppers marked as `linear`.

如果要在用户移过一个尚未正确填写的步骤时显示错误，可以通过输入属性 `errorMessage` 设置错误信息。并且通过 `STEPPER_GLOBAL_OPTIONS` 令牌中的 `showError` 选项配置步进器显示错误的方式。请注意，由于 `linear` 步进器会阻止用户跳过无效的步骤，因此该设置不会影响标记为 `linear` 的步进器。

```ts
@NgModule({
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true }
    }
  ]
})
```

<!-- example(stepper-errors) -->

### Lazy rendering

### 延迟渲染

By default, the stepper will render all of it's content when it's initialized. If you have some
content that you want to defer until the particular step is opened, you can put it inside
an `ng-template` with the `matStepContent` attribute.

默认情况下，步进器将在初始化时渲染其所有内容。如果你有一些内容要推迟到打开特定步骤之前才渲染，你可以将其放入具有 `matStepContent` 属性的 `ng-template` 中。

<!-- example(stepper-lazy-content) -->

### Responsive stepper

### 响应式步进器

If your app supports a wide variety of screens and a stepper's layout doesn't fit a particular
screen size, you can control its `orientation` dynamically to change the layout based on the
viewport.

如果你的应用支持多种屏幕并且步进器的布局不适合特定的屏幕尺寸，你可以动态控制其 `orientation` 以根据视口更改布局。

<!-- example(stepper-responsive) -->

### Keyboard interaction

### 键盘交互

| Keyboard shortcut      | Action                          |
| ---------------------- | ------------------------------- |
| 键盘快捷键             | 操作                            |
| <kbd>Left Arrow</kbd>  | Focus the previous step header. |
| <kbd>Left Arrow</kbd>  | 聚焦上一步标题。                |
| <kbd>Right Arrow</kbd> | Focus the next step header.     |
| <kbd>Right Arrow</kbd> | 聚焦下一步标题。                |
| <kbd>Enter</kbd>       | Select the focused step.        |
| <kbd>Enter</kbd>       | 选择聚焦的步骤。                |
| <kbd>Space</kbd>       | Select the focused step.        |
| <kbd>Space</kbd>       | 选择聚焦的步骤。                |

  <kbd>TAB</kbd>+<kbd>SHIFT</kbd>：焦点移到上一个可捕获焦点的元素上

### Localizing labels

### 本地化标签

Labels used by the stepper are provided through `MatStepperIntl`. Localization of these messages
can be done by providing a subclass with translated values in your application root module.

步进器所用的标签是通过 `MatStepperIntl` 提供的。要想对这些消息进行本地化，可以在应用的根模块中提供它的一个带翻译值的子类。

```ts
@NgModule({
  imports: [MatStepperModule],
  providers: [
    {provide: MatStepperIntl, useClass: MyIntl},
  ],
})
export class MyApp {}
```

<!-- example(stepper-intl) -->

### Accessibility

### 无障碍性

The stepper is treated as a tabbed view for accessibility purposes, so it is given
`role="tablist"` by default. The header of step that can be clicked to select the step
is given `role="tab"`, and the content that can be expanded upon selection is given
`role="tabpanel"`. `aria-selected` attribute of step header is automatically set based on
step selection change.

从无障碍性的角度看，步进器和选项卡视图是一样的，所以默认会为它指定 `role="tablist"`。
步骤的头可以点击，以选择该步骤，所以指定 `role="tab"`，其内容可以在选中时展开，所以指定 `role="tabpanel"`。
步骤头的 `aria-selected` 属性和步骤内容的 `aria-expanded` 属性会根据其选中状态的变化进行自动设置。

The stepper and each step should be given a meaningful label via `aria-label` or `aria-labelledby`.

步进器和每个步骤都应该通过 `aria-label` 或 `aria-labelledby` 给出一个有意义的标签。

Prefer vertical steppers when building for small screen sizes, as horizontal
steppers typically take up significantly more horizontal space thus introduce
horizontal scrolling. Applications with multiple scrolling dimensions make
content harder to consume for some users. See the [Responsive Stepper section](#responsive-stepper)
above for an example on building a stepper that adjusts its layout based on
viewport size.

在为小屏幕尺寸构建时更喜欢垂直步进器，因为水平步进器通常会占用更多的水平空间，从而引入水平滚动。具有多个滚动维度的应用程序会使某些用户更难以消费内容。有关构建基于视口大小调整其布局的步进器的示例，请参阅上面的[响应式步进器部分](#responsive-stepper)。

#### Forms

#### 表单

Steppers often contain forms and form controls. If validation errors inside of a
stepper's form prevents moving to another step, make sure that your form
controls communicate error messages to assistive technology. This helps the user
know why they can't advance to another step. You can accomplish this by using
`<mat-error>` with `<mat-form-field>`, or by using an ARIA live region.

步进器通常会包含表单和表单控件。如果步进器表单中的验证错误阻止了移动到另一个步骤，请确保你的表单控件将错误消息传达给辅助技术。这有助于用户了解为什么他们不能前进到另一个步骤。你可以通过将 `<mat-error>` 与 `<mat-form-field>` 结合使用或使用 ARIA 实时区域来完成此操作。

When a step contains a forms validation error, `MatStepper` will display the
error in the step's header if specified. See the [Error State section](#error-state)
for an example of a stepper with an error message. For non-linear steppers, you
should use an ARIA live region to announce error messages when users navigate
away from a step with an error message.

当某个步骤包含表单验证错误时，`MatStepper` 将在步骤的标题中显示错误（如果指定过）。有关带有错误消息的步进器示例，请参阅[错误状态部分](#error-state)。对于非线性步进器，当用户离开带有错误消息的步骤时，你应该使用 ARIA 实时区域来播报错误消息。
