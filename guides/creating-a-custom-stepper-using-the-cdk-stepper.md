# Creating a custom stepper using the CDK stepper

# 用 CDK 步进器创建一个自定义步进器

The [CDK stepper](https://material.angular.io/cdk/stepper/overview) allows to build a custom stepper which you can completely style yourself without any specific Material Design styling.

[CDK 步进器](https://material.angular.cn/cdk/stepper/overview)允许建立一个自定义的步进器，你可以完全使用自己的样式，不用任何 Material Design 特有的样式。

In this guide, we'll learn how we can build our own custom stepper using the CDK stepper. Here is what we'll build by the end of this guide:

在本指南中，我们将学习如何使用 CDK 步进器构建自己的自定义步进器。以下是本指南会做出的成品：

<!-- example(cdk-custom-stepper-without-form) -->

## Create our custom stepper component

## 创建我们的自定义步进器组件

Now we are ready to create our custom stepper component. Therefore, we need to create a new Angular component which extends `CdkStepper`:

现在，我们准备创建自定义步进器组件。因此，我们需要创建一个扩展了 `CdkStepper` 的新 Angular 组件：

**custom-stepper.component.ts**

```ts
@Component({
  selector: "app-custom-stepper",
  templateUrl: "./custom-stepper.component.html",
  styleUrls: ["./custom-stepper.component.css"],
  // This custom stepper provides itself as CdkStepper so that it can be recognized
  // by other components.
  providers: [{ provide: CdkStepper, useExisting: CustomStepperComponent }]
})
export class CustomStepperComponent extends CdkStepper {
  onClick(index: number): void {
    this.selectedIndex = index;
  }
}
```

After we've extended our component class from `CdkStepper` we can now access different properties from this class like `linear`, `selectedIndex` and `steps` which are defined in the [API documentation](https://material.angular.io/cdk/stepper/api#CdkStepper).

在从 `CdkStepper` 扩展出一个组件类之后，可以从这个类访问不同的属性，比如 `linear`、`selectedIndex` 和 `steps`。这些属性的定义位于这个 [API 文档](https://material.angular.cn/cdk/stepper/api#CdkStepper)中。

This is the HTML template of our custom stepper component:

这是我们自定义步进器组件的 HTML 模板：

**custom-stepper.component.html**

```html
<section class="container">
  <header><h2>Step {{selectedIndex + 1}}/{{steps.length}}</h2></header>

  <div [style.display]="selected ? 'block' : 'none'">
    <!-- Content from the CdkStep is projected here -->
    <ng-container [ngTemplateOutlet]="selected.content"></ng-container>
  </div>

  <footer class="step-navigation-bar">
    <button class="nav-button" cdkStepperPrevious>&larr;</button>
    <button
      class="step"
      *ngFor="let step of steps; let i = index;"
      [ngClass]="{'active': selectedIndex === i}"
      (click)="onClick(i)"
    >
      Step {{i + 1}}
    </button>
    <button class="nav-button" cdkStepperNext>&rarr;</button>
  </footer>
</section>
```

In the `app.component.css` file we can now style the stepper however we want:

在 `app.component.css` 文件中，我们可以为步进器添加所希望的样式了：

**custom-stepper.component.css**

```css
.example-container {
  border: 1px solid black;
  padding: 10px;
  margin: 10px;
}

.example-step-navigation-bar {
  display: flex;
  justify-content: flex-start;
  margin-top: 10px;
}

.example-active {
  color: blue;
}

.example-step {
  background: transparent;
  border: 0;
  margin: 0 10px;
  padding: 10px;
  color: black;
}

.example-step.example-active {
  color: blue;
  border-bottom: 1px solid blue;
}

.example-nav-button {
  background: transparent;
  border: 0;
}
```

## Using our new custom stepper component

## 使用我们新的自定义步进器组件

Now we are ready to use our new custom stepper component and fill it with steps. Therefore, we can, for example, add it to our `app.component.html` and define some steps:

现在，我们已准备好使用新的自定义步进器组件了，并且用一些步骤填充它。我们可以把它添加到 `app.component.html` 中，并定义一些步骤：

**app.component.html**

```html
<app-custom-stepper>
  <cdk-step><p>This is any content of "Step 1"</p></cdk-step>
  <cdk-step><p>This is any content of "Step 2"</p></cdk-step>
</app-custom-stepper>
```

As you can see in this example, each step needs to be wrapped inside a `<cdk-step>` tag.

如你所见，在这个例子中，各个步骤都需要包裹在一个 `<cdk-step>` 标记里。

If you want to iterate over your steps and use your own custom component you can do it, for example, this way:

你可以迭代这些步骤并使用这个自定义组件了，例子如下：

```html
<app-custom-stepper>
  <cdk-step *ngFor="let step of mySteps; let stepIndex = index">
    <my-step-component [step]="step"></my-step-component>
  </cdk-step>
</app-custom-stepper>
```

## Linear mode

## 线性模式

The above example allows the user to freely navigate between all steps. The `CdkStepper` additionally provides the linear mode which requires the user to complete previous steps before proceeding.

上面的例子允许用户在所有步骤之间自由导航。此外，`CdkStepper` 还提供了线性模式，它可以要求用户在继续之前必须完成之前的步骤。

A simple example without using forms could look this way:

一个不涉及表单的简单例子是这样的：

**app.component.html**

```html
<app-custom-stepper linear>
  <cdk-step editable="false" [completed]="completed">
    <input type="text" name="a" value="Cannot proceed to next step" />
    <button (click)="completeStep()">Complete step</button>
  </cdk-step>
  <cdk-step editable="false">
    <input type="text" name="b" value="b" />
  </cdk-step>
</app-custom-stepper>
```

**app.component.ts**

```ts
export class AppComponent {
  completed = false;

  completeStep(): void {
    this.completed = true;
  }
}
```