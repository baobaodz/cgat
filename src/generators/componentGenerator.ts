import { BaseGenerator } from './baseGenerator';
import * as vscode from 'vscode';
import { pascalCase, paramCase } from 'change-case';

import path from 'path';
import fs from 'fs';

export class ComponentGenerator extends BaseGenerator {
  private targetPath: any;
  private existingModulePath?: string;
  constructor(protected context: vscode.ExtensionContext, targetPath?: string, existingModulePath?: string) {
    super(context);
    this.targetPath = targetPath;
    this.existingModulePath = existingModulePath;
  }
  async updateExistingModule(modulePath: string, componentName: string) {
    const content = await fs.promises.readFile(modulePath, 'utf-8');

    // 构建导入语句
    const importStatement = `import { ${pascalCase(componentName)}Component } from './${componentName}/${componentName}.component';`;

    // 使用正则匹配所有import语句和@NgModule之间的内容
    const withImports = content.replace(
      /(import[\s\S]*?;)(\s*)(@NgModule)/,
      `$1\n\n${importStatement}\n\n$3`
    );
    // 检查并处理声明中的逗号
    const declarationsMatch = withImports.match(/(declarations:\s*\[\s*[\s\S]*?)(\s*\])/);
    if (declarationsMatch) {
      const declarations = declarationsMatch[1];
      const lastComponent = declarations.trim().slice(-1);
      const needsComma = lastComponent !== '[' && lastComponent !== ',';

      const declarationStatement = `${needsComma ? ',' : ''}\n        ${pascalCase(componentName)}Component,`;

      const finalContent = withImports.replace(
        /(declarations:\s*\[\s*[\s\S]*?)(\s*\])/,
        `$1${declarationStatement}$2`
      );

      await fs.promises.writeFile(modulePath, finalContent);
    }
  }


  async generate(config: any) {
    console.log('🚀 -> ComponentGenerator -> generate -> config:', config);
    // 只有在不生成模块时才更新已有模块
    if (!config.pre.generateModule && this.existingModulePath) {
      await this.updateExistingModule(
        this.existingModulePath,
        config.basic.componentName
      );
    }
    const data = {
      componentName: paramCase(config.basic.componentName),
      pascalCaseComponentName: pascalCase(config.basic.componentName),
      selectorPrefix: config.basic.selectorPrefix,
      generateModule: config.pre.generateModule,
      moduleName: config.pre.moduleName || config.basic.componentName,
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
      console.log('🚀 -> ComponentGenerator -> generate -> outputPath:', outputPath);
      await this.generateFile(
        this.getTemplatePath(file.template),
        outputPath,
        data
      );
      createdFiles.push(outputPath);
    }
    return createdFiles;
  }

}
