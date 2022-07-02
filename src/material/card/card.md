`<mat-card>` is a content container for text, photos, and actions in the context of a single subject.

`<mat-card>` 是一个内容容器，可以包含文本、图片，并可在其上下文中表现得像一个单一主体。

<!-- example(card-overview) -->

### Basic card sections

### 基本卡片分节

The most basic card needs only an `<mat-card>` element with some content. However, Angular Material
provides a number of preset sections that you can use inside of an `<mat-card>`:

最基本的卡片只需要一个带有某些内容的 `<mat-card>` 元素。
不过，Angular Material 也提供了几个预定义的分节，你可以把它们用在 `<mat-card>` 中：

| Element | Description |
| ------- | ----------- |
| 元素 | 说明 |
| `<mat-card-title>` | Card title |
| `<mat-card-title>` | 卡片标题 |
| `<mat-card-subtitle>` | Card subtitle |
| `<mat-card-subtitle>` | 卡片小标题 |
| `<mat-card-content>` | Primary card content. Intended for blocks of text |
| `<mat-card-content>` | 主卡片内容。一般为文本块 |
| `<img mat-card-image>` | Card image. Stretches the image to the container width |
| `<img mat-card-image>` | 卡片图片。此图片会拉伸至容器宽度 |
| `<mat-card-actions>` | Container for buttons at the bottom of the card |
| `<mat-card-actions>` | 卡片底部按钮的容器 |
| `<mat-card-footer>` | Section anchored to the bottom of the card |
| `<mat-card-footer>` | 钉在卡片底部的小节 |

These elements primary serve as pre-styled content containers without any additional APIs. 
However, the `align` property on `<mat-card-actions>` can be used to position the actions at the 
`'start'` or `'end'` of the container.  

这些元素主要扮演一个具有预定义样式的内容容器，而没有额外的 API。
不过，`<mat-card-actions>` 上的 `align` 属性可用于把这些按钮定位在容器的起点（`'start'`）或末尾（`'end'`）。

### Card headers

### 卡片头

In addition to the aforementioned sections, `<mat-card-header>` gives the ability to add a rich
header to a card. This header can contain:

除了前面提到的这些小节之外，`<mat-card-header>` 还可以让我们为卡片添加各种头部，包括：

| Element | Description |
| ------- | ----------- |
| 元素 | 说明 |
| `<mat-card-title>` | A title within the header |
| `<mat-card-title>` | 头部的标题 |
| `<mat-card-subtitle>` | A subtitle within the header |
| `<mat-card-subtitle>` | 头部的小标题 |
| `<img mat-card-avatar>` | An image used as an avatar within the header |
| `<img mat-card-avatar>` | 头部用作头像的图片 |

### Title groups

### 标题组

`<mat-card-title-group>` can be used to combine a title, subtitle, and image into a single section.
This element can contain:

`<mat-card-title-group>` 可用来把标题、小标题、图片组合进单个小节中。此元素可以包含：

* `<mat-card-title>`

* `<mat-card-subtitle>`

* One of:

  下列之一：

  - `<img mat-card-sm-image>`

  - `<img mat-card-md-image>`

  - `<img mat-card-lg-image>`

### Accessibility

### 无障碍性

Cards serve a wide variety of scenarios and may contain many different types of content.
Due to this flexible nature, the appropriate accessibility treatment depends on how you use
`<mat-card>`.

卡片可用在很多场景中，还能包含很多种不同类型的内容。
由于其动态性，它无障碍性是否合适，取决于如何使用 `<mat-card>`。

#### Group, region, and landmarks

#### 分组、区域和界标

There are several ARIA roles that communicate that a portion of the UI represents some semantically
meaningful whole. Depending on what the content of the card means to your application, you can apply
one of [`role="group"`][role-group], [`role="region"`][role-region], or
[one of the landmark roles][aria-landmarks] to the `<mat-card>` element.

有几个 ARIA 角色用来表示界面上的某些部分在语义上是一些有意义的整体。
这取决于卡片的内容在你的应用中的意义，`<mat-card>` 元素上通常会应用 [`role="group"`][0]、[`role="region"`][1] 或 [某个界标角色][2]。

You do not need to apply a role when using a card as a purely decorative container that does not
convey a meaningful grouping of related content for a single subject. In these cases, the content
of the card should follow standard practices for document content.

当卡片用作纯装饰性容器时，不需要指定角色。也就是说，该容器不能作为单个主体为相关内容传达有意义的信息。
在这些情况下，卡片的内容应该遵循文档内容的标准实践。

#### Focus

#### 焦点

Depending on how cards are used, it may be appropriate to apply a `tabindex` to the `<mat-card>`
element. 

根据卡片的用途，可能需要为 `<mat-card>` 元素添加一个 `tabindex` 属性。

* If cards are a primary mechanism through which user interacts with the application, `tabindex="0"`
  may be appropriate.

  如果卡片是用户与应用交互的主要方式，那么最好使用 `tabindex="0"`。

* If attention can be sent to the card, but it's not part of the document flow, `tabindex="-1"` may
  be appropriate.

  如果该卡片可以吸引注意力，但它不是文档流的一部分，那么最好使用 `tabindex="-1"`。

* If the card acts as a purely decorative container, it does not need to be tabbable. In this case,
  the card content should follow normal best practices for tab order.

  如果该卡片扮演一个纯装饰性容器，那么它不需要能 `tab` 进来。这种情况下，卡片内容应该遵循关于安排 `tab` 顺序的标准实践。

Always test your application to verify the behavior that works best for your users.

多多测试你的应用程序以验证最适合你的用户的行为。

[role-group]: https://www.w3.org/TR/wai-aria/#group

[role-region]: https://www.w3.org/TR/wai-aria/#region

[aria-landmarks]: https://www.w3.org/TR/wai-aria/#landmark