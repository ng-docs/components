// The example-module file will be auto-generated. As soon as the
// examples are being compiled, the module file will be generated.
import {EXAMPLE_COMPONENTS} from './example-module';

/**
 * Example data with information about component name, selector, files used in
 * example, and path to examples.
 *
 * 包含组件名、选择器、示例中使用的文件和示例路径信息的示例数据。
 *
 */
export class ExampleData {
  /**
   * Description of the example.
   *
   * 这个例子的描述。
   *
   */
  description: string;

  /**
   * List of files that are part of this example.
   *
   * 属于这个例子的文件列表。
   *
   */
  exampleFiles: string[];

  /**
   * Selector name of the example component.
   *
   * 示例组件的选择器名称。
   *
   */
  selectorName: string;

  /**
   * Name of the file that contains the example component.
   *
   * 包含这个组件的文件名。
   *
   */
  indexFilename: string;

  /**
   * Names of the components being used in this example.
   *
   * 在这个例子中使用的组件的名称。
   *
   */
  componentNames: string[];

  constructor(example: string) {
    if (!example || !EXAMPLE_COMPONENTS.hasOwnProperty(example)) {
      return;
    }

    const {componentName, files, selector, primaryFile, additionalComponents, title} =
        EXAMPLE_COMPONENTS[example];
    const exampleName = example.replace(/(?:^\w|\b\w)/g, letter => letter.toUpperCase());

    this.exampleFiles = files;
    this.selectorName = selector;
    this.indexFilename = primaryFile;
    this.description = title || exampleName.replace(/[\-]+/g, ' ') + ' Example';
    this.componentNames = [componentName, ...additionalComponents];
  }
}
