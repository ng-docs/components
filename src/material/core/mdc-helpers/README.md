[MDC Web](https://github.com/material-components/material-components-web) is a vanilla JS library
that implements Material Design components. We are experimenting with what it would look like to
build Angular Material components on top of MDC Web. The current best practices for working with MDC
in the Angular Material repo are tracked here.

## Importing from MDC Web

## 从 MDC Web 导入

TypeScript imports should import from the top-level of the appropriate package (e.g.
`import {MDCCheckboxAdapter} from '@material/checkbox'`). This ensures that the import works
regardless of whether we are importing from the ES Modules or the bundled MDC code.

TypeScript 导入应该从适当包的顶层导入（例如 `import {MDCCheckboxAdapter} from '@material/checkbox'` ）。这确保无论我们是从 ES 模块还是从捆绑的 MDC 代码导入，导入都能正常进行。

## CSS overrides

## CSS 覆盖

Ideally Angular Material will not override any of MDC Web's CSS. However there may be times when it
is necessary. If a CSS override is necessary, clearly document in a comment why that is the case.
Also note if there is an open issue in the MDC repo to make changes so that the override won't be
needed.

理想情况下，Angular Material 不会覆盖任何 MDC Web 的 CSS。但是，有时可能有必要。如果需要 CSS 覆盖，请在注释中清楚地记录为什么会这样。另请注意 MDC 存储库中是否存在未解决的问题以进行更改，那样可能不需要覆盖。
