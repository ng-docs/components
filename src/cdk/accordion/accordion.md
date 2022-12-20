An accordion is a component with one or more expandable sections. CDK accordion provides a
foundation upon which you can build your own custom accordion component. CDK accordion provides
logic for the accordion interaction pattern without any styles. You can customize the accordion's
appearance based on your application's needs.

手风琴是具有一个或多个可展开分区的组件。 CDK 手风琴提供了一个基础，你可以在此基础上构建自己的自定义手风琴组件。 CDK 手风琴为手风琴交互模式提供了逻辑，没有任何样式。你可以根据应用程序的需要自定义手风琴的外观。

<!-- example(cdk-accordion-overview) -->

### Accessibility

### 无障碍性

The CDK accordion doesn't come with any accessibility treatment, because it doesn't have control
over its markup. We recommend to set the accordion trigger element as a `role="button"` while
the body container as a `role="region"`. Furthermore, the trigger should have `aria-controls`
pointing to the body and `aria-expanded` based on the expanded state, while the body should have
an `aria-labelledby` that points to the header. See the example above for a sample implementation.

CDK 手风琴没有做任何无障碍性处理，因为它无法控制其标记脚本。我们建议将手风琴触发器元素设置为 `role="button"` ，而将正文（body）容器设置为 `role="region"` 。此外，触发器应该有指向正文的 `aria-controls` 和基于展开状态的 `aria-expanded`，而正文应该有一个指向标题的 `aria-labelledby` 。有关示例实现，请参见上面的示例。
