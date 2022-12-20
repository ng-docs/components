import {Injector, Type, createNgModuleRef} from '@angular/core';
import {EXAMPLE_COMPONENTS} from '../example-module';

/**
 * Asynchronously loads the specified example and returns its component and
 * an injector instantiated from the containing example module.
 *
 * 异步加载指定示例并返回其组件和从包含它的示例模块实例化的注入器。
 *
 * This is used in the `dev-app` and `e2e-app` and assumes ESBuild having created
 * entry-points for the example modules under the `<host>/bundles/` URL.
 *
 * 这用于 `dev-app` 和 `e2e-app` ，并假设 ESBuild 已经为 `<host>/bundles/` URL 下的示例模块创建了入口点。
 *
 */
export async function loadExample(
  name: string,
  injector: Injector,
): Promise<{component: Type<any>; injector: Injector}> {
  const {componentName, module} = EXAMPLE_COMPONENTS[name];
  const moduleExports = await import(
    `/bundles/components-examples/${module.importSpecifier}/index.js`
  );
  const moduleType: Type<any> = moduleExports[module.name];
  const componentType: Type<any> = moduleExports[componentName];
  const moduleRef = createNgModuleRef(moduleType, injector);

  return {
    component: componentType,
    injector: moduleRef.injector,
  };
}
