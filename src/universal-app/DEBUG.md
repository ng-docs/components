### Debugging the pre-rendered HTML file

### 调试预先渲染的 HTML 文件

Since the pre-rendered HTML file is built through a Bazel test target, the
generated HTML file will not be stored in a folder of the repository. Instead,
the file will be stored in the `bazel-out` folder.

由于预先渲染的 HTML 文件是通过 Bazel 测试目标构建的，因此生成的 HTML 文件不会存储在代码仓库的文件夹中。相反，该文件将存储在 `bazel-out` 文件夹中。

You can retrieve the path to the file by either running:

你可以运行以下命令来取得该文件的路径：

* `bazel test //src/universal-app:server_test --test_output=all`
* `echo $(bazel info bazel-bin)/src/universal-app/index-prerendered.html`
