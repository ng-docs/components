// The example-module file will be auto-generated. As soon as the
// examples are being compiled, the module file will be generated.
import {EXAMPLE_COMPONENTS} from './example-module';

/**
 * Example data with information about component name, selector, files used in
 * example, and path to examples.
 *
 * 示例数据，包含有关组件名称、选择器、示例中使用的文件和示例路径的信息。
 *
 */
export class ExampleData {
  /**
   * Description of the example.
   *
   * 示例说明。
   *
   */
  description: string;

  /**
   * List of files that are part of this example.
   *
   * 作为此示例一部分的文件列表。
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
   * 包含示例组件的文件的名称。
   *
   */
  indexFilename: string;

  /**
   * Names of the components being used in this example.
   *
   * 此示例中使用的组件的名称。
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
