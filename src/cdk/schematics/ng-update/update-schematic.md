# ng-update schematic

# ng-update 原理图（schematic）

**Note** The CDK ng-update schematic is the foundation for the Angular Material update schematic.
This is achieved by making the ng-update code for the CDK as reusable as possible.

**注意**：CDK ng-update 原理图是 Angular Material "更新"（update）原理图的基础。这是通过让 CDK 的 ng-update 代码尽量可复用来实现的。

This document also applies for the Angular Material `ng-update`.

本文档也适用于 Angular Material `ng-update`。

---

The `ng-update` schematic consists of multiple migration entry-points where every entry-point
targets a specific Angular CDK or Angular Material version.

`ng-update` 原理图由多个迁移入口点组成，每个入口点都以一个特定的 Angular CDK 或 Angular Material 版本为目标。

As of right now, we have multiple migration entry-points that handle the breaking changes for a
given target version:

到目前为止，我们有多个迁移入口点来处理指定目标版本的重大变更：

| Target Version | Description            |
|----------------|------------------------|
| 目标版本       | 说明                               |
| V6 | Upgrade from any version to v6.0.0 |
| V6             | 从任意版本升级到v6.0.0             |
| V7 | Upgrade from any version to v7.0.0 |
| V7             | 从任意版本升级到v7.0.0             |
| V8 | Upgrade from any version to v8.0.0 |
| V8 | 从任意版本升级到 v8.0.0 |
| V9 | Upgrade from any version to v9.0.0 |
| V9 | 从任意版本升级到 v9.0.0 |

Note that the migrations run _in order_ if multiple versions are implicitly targeted. For
example, consider an application which uses Angular Material v5.0.0. In case the developer runs
`ng update`, the Angular CLI **only** installs V7 and runs the V6 and V7 migrations _in order_.

注意，如果有多个可隐式升级的目标版本，那么这些迁移就会*按顺序*运行。比如，在用 Angular Material v5.0.0 的应用时，如果开发人员运行了 `ng update`，那么 Angular CLI **只会**安装 V7，并*按顺序*进行 V6 和 V7 版本的迁移。

This shows that we technically need to keep all migrations in the code base because
the CLI usually only installs the latest version and expects all migrations for past
major versions to be present.

这是为了说明为何我们在技术上需要在本代码库中保留所有的迁移，因为 CLI 通常只安装最新的版本，并期望其中包括过去所有主要版本的迁移。

## Update concept

## "更新"的概念

The goal of the update schematic is to automatically migrate code that is affected by breaking
changes of the target version. Most of the time we can apply such automatic migrations, but
there are also a few breaking changes that cannot be migrated automatically.

"更新"原理图的目标是自动迁移那些被目标版本的重大变更影响到的代码。大多数情况下，我们可以使用这种自动迁移，但也有一些无法自动迁移的重大变更。

In that case, our goal should be to notify the developer about the breaking change that needs
attention.

在这种情况下，我们的目标应该是让开发人员注意那些需要开发人员关注的重大变更。

## Transforming TypeScript files

## 转换 TypeScript 文件

In order to automatically migrate TypeScript source files, we take advantage of the TypeScript
Compiler API which allows us to parse and work with the AST of project source files. We built
a small framework for analyzing and updating project source files that is called `update-tool`.

The `update-tool` has been specifically built with the goal of being extremely fast and
flexible. This tool had to be built because our initial `ng update` implementation which
used `tslint` had various issues:

* No support for HTML templates and stylesheets (workaround was needed)
* Reruns all upgrade lint rules after file has been updated (significant performance issue for projects with a lot of files)
* Recreates the TypeScript program each time a source file has been updated (significant memory pressure for big TypeScript projects, causing OOM exceptions)
* TSLint recursively visits the nodes of all source files for each upgrade lint rule (performance issue)
* TSLint is not guaranteed to be installed in CLI projects. See: https://github.com/angular/angular-cli/issues/14555
* TSLint replacements lead to memory leaks due to the retained TypeScript nodes
* No way to have a *global analysis* phase since lint rules are only able to visit source files.
* No flexibility. i.e.
  * No way to ensure source files are only analyzed a single time
  * No way to implement a progress bar
  * No easy way to add support for HTML templates or stylesheets

All of these problems that `tslint` had, have been solved when we built the
`update-tool`. The tool currently has the following differences compared to `tslint`:

* Abstraction of file system and ability to run migrations programmatically.
  * Migrations can run in the CLI and in google3.
  * Migrations can run standalone outside of `ng update`
* Integrated support for the HTML templates and stylesheets
* Only runs migrations once per source file.
  * Even if a source file is part of multiple TypeScript projects.
* Program is only created once per TypeScript project. Also the type checker is only retrieved once.
* Migration failures are guaranteed to not retain `ts.Node` instances (avoiding a common tslint memory leak)
* Replacements are performed within the virtual file system (best practice for schematics)
* TypeScript program is only recursively visited **once**
* Full flexibility (e.g. allowing us to implement a progress bar)
* Possibility to have a *global analysis* phase (unlike with tslint where only individual source files can be analyzed)

There also other various concepts for transforming TypeScript source files, but most of them
don't provide a simple API for replacements and reporting. Read more about the possible
approaches below:

还有其他各种用于转换 TypeScript 源文件的概念，但是大多数概念都没有为替换和报告提供简单的API。对可能的方式作如下详细分析：

|Description | Evaluation |
|------------|------------|
| 说明                            | 评价                                                                                                                           |
| Regular Expressions | Too brittle. No type checking possible. Regular Expression _can_ be used in combination with some real AST walking |
| 正则表达式                      | 太脆弱了。不能检查类型。正则表达式*可以*和一些真正的 AST walk 一起使用                                                             |
| TypeScript transforms (no emit) | This would be a good solution but there is no API to serialize the transformed AST into source code without using the `ts.Printer`. The printer can be used to serialize the AST but it breaks formatting, code style and more. This is not acceptable for a migration. |

### Upgrade data for target versions

### 升级目标版本的数据

The upgrade data for migrations is separated based on the target version. This is necessary in
order to allow migrations run sequentially. For example:

迁移的升级数据是按照目标版本分开的。为了按顺序运行迁移，这是必要的。例如：

* In V6: `onChange` has been renamed to `changed`

  在 V6 中：`onChange` 已重命名为 `changed`

* In V7: `changed` has been renamed to `onValueChange`

  在 V7 中：`changed` 已重命名为 `onValueChange`

If we would not run the migrations in order, or don't separate the upgrade data, we would not be
able to properly handle the migrations for each target version. e.g. someone is on
5.0.0 and *only* wants to upgrade to 6.0.0. In that case he would end up with `onValueChange`
because the non-separated upgrade data would just include: _`onChange` => `onValueChange`_

如果不按顺序运行迁移，或者不分开这些升级数据，我们就无法正确处理向每个目标版本的迁移。例如，某人在 5.0.0 上，只想升级到 6.0.0。在这种情况下，他最终得到 `onValueChange` 因为如果不分开它们，升级数据就只包括：*`onChange` => `onValueChange`*

Also besides separating the upgrade data based on the target version, we split the upgrade data
based on the type of code that is affected by these migrations:

此外，除了按照目标版本分离升级数据之外，我们还要根据受这些迁移影响的代码类型拆分升级数据：

* See here: [src/material/schematics/update/material/data](https://github.com/angular/components/tree/master/src/material/schematics/update/material/data)

  看这里： [src/lib/schematics/update/material/data](https://github.com/angular/material2/tree/master/src/lib/schematics/update/material/data)
### Adding upgrade data

### 添加升级数据

Adding upgrade data is now a **mandatory** step before breaking changes should be merged
into `upstream`.  For simple and common breaking changes, there should be already an upgrade
data file that just needs the new change inserted.

现在，添加升级数据是一个**强制性的**步骤，之后就应该把这些重大变更合并回 `upstream`。对于简单和常见的重大变更，应该已经有了一个升级数据文件，只需再插入新的变更即可。

In case there is no upgrade data for a breaking change, we need to evaluate if there should be
a single `misc` migration that is tied to that specific breaking change, or if we should
create a new migration that accepts upgrade data (as other configurable migrations).

如果没有重大变更的升级数据，我们就要评估是否要写一个此重大变更专用的 `misc` 迁移，或者是否应该创建一个接受升级数据的新迁移（就像其它可配置迁移一样）。

---

**Example**: Adding upgrade data for a property rename
**Scenario**: In Angular Material V7.0.0, we rename `MatRipple#color` to `MatRipple#newColor`.

**示例**：为属性重命名添加升级数据  
**场景**：在 Angular Material V7.0.0 中，我们把 `MatRipple#color` 重命名为 `MatRipple#newColor` 。

First, look for an existing upgrade data file that covers similar breaking changes. In that case
an existing upgrade data file for `property-names` already exists. Insert the new breaking change
within the proper `VersionTarget`.

首先，查找包含类似重大变更的现有升级数据文件。在这种情况下，`property-names` 的现有升级数据文件已经存在。在适当的 `VersionTarget` 中插入新的重大变更数据。

_src/material/schematics/ng-update/material/data/property-names.ts_
```ts
export const propertyNames: VersionChanges<MaterialPropertyNameData> = {
  [TargetVersion.V7]: [
    {
      pr: '{PULL_REQUEST_LINK_FOR_BREAKING_CHANGE}',
      changes: [
        {
          replace: 'color',
          replaceWith: 'newColor',
          limitedTo: {
            classes: ['MatRipple']
          }
        }
      ]
    }
  ],
   ...
};
```
Once the data is inserted into the upgrade data file, the update schematic will properly migrate
`MatRipple#color` to `MatRipple#newColor` if someone upgrades to Angular Material V7.0.0.

把这些数据插入到升级数据文件中之后，如果有人要升级到 Angular Material V7.0.0，那么"更新"原理图就会把 `MatRipple#color` 正确地迁移到 `MatRipple#newColor`。

But that's not all. It's encouraged to add a test-case for the new migration data. In this case,
a test case already exists for the type of migration and we just need to add our breaking change
to it. Read more about adding a test case in the next section.

但那还不是全部。我们鼓励为新的迁移数据添加一个测试用例。在这种情况下，已经存在一个针对迁移类型的测试用例了，我们只需要把我们的重大变更加入其中。欲知详情，请参阅下一节的"添加测试用例"。

### Adding a breaking change to a test case

### 为测试用例添加一个重大变更

Considering we added a breaking change to the update schematic, it's encouraged to add a proper
test case for the new change that has been added.

由于我们已经在"更新"原理图中添加了一个重大变更，最好也为添加的这个新变更添加一个合适的测试用例。

In the scenario where a property from `MatRipple` has been renamed in V7, we don't need to create
a new test-case file because there is already a test case for the `property-names` upgrade data.
In that case, we just need to add the breaking change to the existing test case.

在来自 `MatRipple` 的属性已经在 V7 中重命名的情况下，我们不需要创建一个新的测试用例文件，因为已经有了针对 `property-names` 升级数据的测试用例。这种情况下，我们只需要对现有的测试用例添加重大变更即可。

_src/material/schematics/ng-update/test-cases/v7/property-names_input.ts_
```ts
...

/**
 * Mock definitions. This test case does not have access to @angular/material.
 */
class MatRipple {
  color: string;
}

/*
 * Actual test cases using the previously defined definitions.
 */
class A implements OnInit {
  constructor(private a: MatRipple) {}

  ngOnInit() {
    this.a.color = 'primary';
  }
}
```

_src/material/schematics/ng-update/test-cases/v7/property-names_expected_output.ts_
```ts
...

/**
 * Mock definitions. This test case does not have access to @angular/material.
 */
class MatRipple {
  color: string;
}

/*
 * Actual test cases using the previously defined definitions.
 */
class A implements OnInit {
  constructor(private a: MatRipple) {}

  ngOnInit() {
    this.a.newColor = 'primary';
  }
}
```

**Note**: The `_input.ts` file will be just transformed by the V7 migrations and compared to
the `_expected_output.ts` file. This means that it's necessary to also include the no longer
valid mock declarations to the expected output file.

**注意** ：`_input.ts`文件只会被 V7 的迁移所转换，并与 `_expected_output.ts` 文件进行比较。这意味着还需要在预期的输出文件中包含已经失效的 mock 声明。

