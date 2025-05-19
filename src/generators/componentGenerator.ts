import { BaseGenerator } from './baseGenerator';
import * as vscode from 'vscode';
import { pascalCase, paramCase } from 'change-case';

import path from 'path';
import fs from 'fs';

export class ComponentGenerator extends BaseGenerator {
  private targetPath: any;
  private existingModulePath?: string;
  private existingRoutingModulePath?: string;
  private existingServicePath?: string;

  constructor(protected context: vscode.ExtensionContext, targetPath?: string, existingModulePath?: string) {
    super(context);
    this.targetPath = targetPath;
    this.existingModulePath = existingModulePath;


    // 如果存在模块文件，尝试找到对应的路由模块文件和服务文件
    if (existingModulePath) {
      // 检查路由模块文件
      this.existingRoutingModulePath = existingModulePath.replace('.module.ts', '-routing.module.ts');

      if (!fs.existsSync(this.existingRoutingModulePath)) {
        this.existingRoutingModulePath = undefined;
      }

      // 检查服务文件
      this.existingServicePath = existingModulePath.replace('.module.ts', '.service.ts');
      if (!fs.existsSync(this.existingServicePath)) {
        this.existingServicePath = undefined;
      }
    }
  }

  async updateExistingModule(modulePath: string, componentName: string, hasDetailComponent: boolean) {
    try {
      const content = await fs.promises.readFile(modulePath, 'utf-8');

      // 构建导入语句
      let importStatements = `import { ${pascalCase(componentName)}Component } from './${componentName}/${componentName}.component';`;

      // 如果有详情组件，添加详情组件的导入
      if (hasDetailComponent) {
        importStatements += `\nimport { ${pascalCase(componentName)}DetailComponent } from './${componentName}/detail/${componentName}-detail.component';`;
      }

      // 使用正则匹配所有import语句和@NgModule之间的内容
      const withImports = content.replace(
        /(import[\s\S]*?;)(\s*)(@NgModule)/,
        `$1\n\n${importStatements}\n\n$3`
      );

      // 检查并处理声明中的逗号
      const declarationsMatch = withImports.match(/(declarations:\s*\[\s*[\s\S]*?)(\s*\])/);
      if (declarationsMatch) {
        const declarations = declarationsMatch[1];
        const lastComponent = declarations.trim().slice(-1);
        const needsComma = lastComponent !== '[' && lastComponent !== ',';

        // 构建声明语句，包括主组件和详情组件
        let declarationStatement = `${needsComma ? ',' : ''}\n        ${pascalCase(componentName)}Component`;

        // 如果有详情组件，添加详情组件的声明
        if (hasDetailComponent) {
          declarationStatement += `,\n        ${pascalCase(componentName)}DetailComponent`;
        }

        declarationStatement += ',';

        const finalContent = withImports.replace(
          /(declarations:\s*\[\s*[\s\S]*?)(\s*\])/,
          `$1${declarationStatement}$2`
        );

        await fs.promises.writeFile(modulePath, finalContent);
        return true;
      }
    } catch (error) {
      console.error('更新模块文件失败:', error);
      return false; // 返回失败
    }
  }

  // 新增方法：更新路由模块文件
  async updateExistingRoutingModule(routingModulePath: string, componentName: string, moduleName: string) {
    try {
      const content = await fs.promises.readFile(routingModulePath, 'utf-8');

      // 1. 添加组件导入语句
      const importStatement = `import { ${pascalCase(componentName)}Component } from './${componentName}/${componentName}.component';`;

      const withImports = content.replace(
        /(import[\s\S]*?;)(\s*)(const routes)/,
        `$1\n${importStatement}\n\n$3`
      );

      // 2. 添加路由配置
      // 查找路由数组
      const routesMatch = withImports.match(/(const\s+routes\s*:\s*Routes\s*=\s*\[)([\s\S]*?)(\s*\];)/);

      if (routesMatch) {
        const routesStart = routesMatch[1];
        const routesContent = routesMatch[2];
        const routesEnd = routesMatch[3];

        // 检查是否需要添加逗号
        const needsComma = routesContent.trim().length > 0 && !routesContent.trim().endsWith(',');

        // 构建新的路由配置
        const newRoute = `
    {
        path: '${paramCase(componentName)}',
        component: ${pascalCase(componentName)}Component,
        data: { reuse: true }
    }`;

        // 组合新的路由数组内容
        const newRoutesContent = routesStart + routesContent + (needsComma ? ',' : '') + newRoute + routesEnd;

        // 更新文件内容 - 只替换路由数组部分，保留其他内容
        const finalContent = withImports.replace(
          /(const\s+routes\s*:\s*Routes\s*=\s*\[)([\s\S]*?)(\s*\];)/,
          newRoutesContent
        );

        // 更新文件内容
        await fs.promises.writeFile(routingModulePath, finalContent);
        return true;
      }

      return false;
    } catch (error) {
      console.error('更新路由模块失败:', error);
      return false;
    }
  }

  async generate(config: any) {
    console.log('🚀 -> ComponentGenerator -> generate -> config:', config);

    // 创建结果对象
    const result: {
      files: string[],
      moduleUpdated: boolean | undefined,
      routingUpdated: boolean | undefined,
      serviceUpdated: boolean | undefined
    } = {
      files: [],
      moduleUpdated: false,
      routingUpdated: false,
      serviceUpdated: false
    };

    // 确定正确的模块名称
    let moduleName = config.pre.moduleName || config.basic.componentName;

    // 如果不生成模块但有现有模块，使用现有模块的名称
    if (!config.pre.generateModule && this.existingModulePath) {
      moduleName = path.basename(this.existingModulePath, '.module.ts');

      // 更新现有模块
      const hasDetailComponent = config.buttons.hasAddButton || config.table.hasEditButton;
      const moduleUpdated = await this.updateExistingModule(
        this.existingModulePath,
        config.basic.componentName,
        hasDetailComponent
      );
      result.moduleUpdated = moduleUpdated;

      // 如果存在路由模块文件，也更新它
      if (this.existingRoutingModulePath) {
        const routingUpdated = await this.updateExistingRoutingModule(
          this.existingRoutingModulePath,
          config.basic.componentName,
          moduleName
        );
        result.routingUpdated = routingUpdated;
      }

      // 如果存在服务文件，也更新它
      if (this.existingServicePath) {
        const serviceUpdated = await this.updateExistingService(
          this.existingServicePath,
          config.basic.componentName,
          moduleName,
          config
        );
        result.serviceUpdated = serviceUpdated;
      }
    }

    const data = {
      componentName: paramCase(config.basic.componentName),
      pascalCaseComponentName: pascalCase(config.basic.componentName),
      selectorPrefix: config.basic.selectorPrefix,
      generateModule: config.pre.generateModule,
      moduleName: moduleName, // 使用正确的模块名称
      businessName: config.basic.businessName,
      filters: config.filters,
      buttons: config.buttons,
      detail: config.detail,
      table: config.table,
    };
    console.log('🚀 -> ComponentGenerator -> generate -> data:', data);
    const files = [];
    const baseComponentPath = data.generateModule ?
      `${data.moduleName}/${data.componentName}/${data.componentName}` :
      `${data.componentName}/${data.componentName}`;
    const baseDetailComponentPath = data.generateModule ?
      `${data.moduleName}/${data.componentName}` :
      `${data.componentName}`;

    const detailComponentPath = `${baseDetailComponentPath}/detail/${data.componentName}`;

    // 添加基础组件文件
    const baseComponentFiles = [
      { template: 'component/basic.component.ts.hbs', output: `${baseComponentPath}.component.ts` },
      { template: 'component/basic.component.html.hbs', output: `${baseComponentPath}.component.html` },
      { template: 'component/basic.component.less.hbs', output: `${baseComponentPath}.component.less` }
    ];

    files.push(...baseComponentFiles);

    // 添加模块相关文件
    if (data.generateModule) {
      const moduleFiles = [
        { template: 'module/basic.module.ts.hbs', output: `${data.moduleName}/${data.moduleName}.module.ts` },
        { template: 'service/basic.service.ts.hbs', output: `${data.moduleName}/${data.moduleName}.service.ts` },
        { template: 'module/basic-routing.module.ts.hbs', output: `${data.moduleName}/${data.moduleName}-routing.module.ts` },
        { template: 'const/basic.const.ts.hbs', output: `${data.moduleName}/${data.moduleName}.const.ts` }
      ];
      files.push(...moduleFiles);
    }

    // 添加详情组件文件
    if (data.buttons.hasAddButton) {
      const detailFiles = [
        { template: 'component/detail/detail.component.ts.hbs', output: `${detailComponentPath}-detail.component.ts` },
        { template: 'component/detail/detail.component.html.hbs', output: `${detailComponentPath}-detail.component.html` },
        { template: 'component/detail/detail.component.less.hbs', output: `${detailComponentPath}-detail.component.less` }
      ];
      files.push(...detailFiles);
    }

    const createdFiles = [];
    for (const file of files) {
      const outputPath = path.join(this.targetPath, file.output);
      await this.generateFile(
        this.getTemplatePath(file.template),
        outputPath,
        data
      );
      createdFiles.push(outputPath);
    }
    result.files = createdFiles;
    return result;
  }

  async updateExistingService(servicePath: string, componentName: string, moduleName: string, config: any) {
    try {
      const content = await fs.promises.readFile(servicePath, 'utf-8');

      // 检查文件是否已经包含该组件的方法
      const componentMethodRegex = new RegExp(`get${pascalCase(componentName)}List`);
      if (componentMethodRegex.test(content)) {
        console.log(`Service 文件已包含 ${componentName} 的方法，跳过更新`);
        return false;
      }

      // 构建基础方法 - 列表和详情方法总是需要的
      let newMethods = `
    get${pascalCase(componentName)}List(params: any) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/list\`;
        return this.ajax.request(url, {
            method: 'post',
            params: params
        });
    }

    get${pascalCase(componentName)}Detail(id) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/detail/\${id}\`;
        return this.ajax.request(url, {
            method: 'get',
        });
    }`;

      // 根据配置添加其他方法
      // 如果有新增/编辑按钮，添加新增和更新方法
      if (config.buttons.hasAddButton || config.table.hasEditButton) {
        newMethods += `
  
    add${pascalCase(componentName)}(params: any) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/add\`;
        return this.ajax.request(url, {
            method: 'post',
            params: params
        });
    }
  
    update${pascalCase(componentName)}(params: any) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/update\`;
        return this.ajax.request(url, {
            method: 'post',
            params: params
        });
    }`;
      }

      // 如果有删除按钮，添加删除方法
      if (config.buttons.hasDeleteButton || config.table.hasDeleteButton) {
        newMethods += `
  
    delete${pascalCase(componentName)}(id) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/delete/\${id}\`;
        return this.ajax.request(url, {
            method: 'post',
        });
    }`;
      }

      // 如果有导出按钮，添加导出方法
      if (config.buttons.hasExportButton) {
        newMethods += `
  
    exportAll${pascalCase(componentName)}(params: any) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/exportAll\`;
        return this.ajax.request(url, {
            method: 'post',
            params: params
        });
    }
        
    exportSelect${pascalCase(componentName)}(params: any) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/exportSelect\`;
        return this.ajax.request(url, {
            method: 'post',
            params: params
        });
    }`;
      }

      // 如果有导入按钮，添加导入方法
      if (config.buttons.hasImportButton) {
        newMethods += `
  
    import${pascalCase(componentName)}(params: any) {
        const url = \`\${this.prefix}/${moduleName}/${paramCase(componentName)}/import\`;
        return this.ajax.request(url, {
            method: 'post',
            params: params
        });
    }`;
      }

      // 查找类的结束位置
      const classEndMatch = content.match(/}(\s*)$/);
      if (!classEndMatch) {
        console.error('无法找到 Service 类的结束位置');
        return false;
      }

      // 在类的结束位置前插入新方法
      const updatedContent = content.replace(
        /}(\s*)$/,
        `${newMethods}\n}$1`
      );

      // 写入更新后的内容
      await fs.promises.writeFile(servicePath, updatedContent);
      return true;
    } catch (error) {
      console.error('更新 Service 文件失败:', error);
      return false;
    }
  }
}
