import { BaseGenerator } from './baseGenerator';
import * as vscode from 'vscode';
import { pascalCase, paramCase } from 'change-case';

import path from 'path';

export class ComponentGenerator extends BaseGenerator {
  async generate(config: any) {
    console.log('🚀 -> ComponentGenerator -> generate -> config:', config);

    const data = {
      componentName: paramCase(config.basic.componentName),
      pascalCaseComponentName: pascalCase(config.basic.componentName),
      selectorPrefix: config.basic.selectorPrefix,
      generateModule: config.pre.generateModule,
      filters: config.filters,
      buttons: config.buttons
    };
    console.log('🚀 -> ComponentGenerator -> generate -> data:', data);

    const targetPath = await this.getTargetPath();
    const pathName = `${config.basic.componentName}/${config.basic.componentName}`;
    const detailPathName = `${config.basic.componentName}/detail/${config.basic.componentName}`;
    const files = [
      { template: 'component/basic.component.ts.hbs', output: `${pathName}.component.ts` },
      { template: 'component/basic.component.html.hbs', output: `${pathName}.component.html` },
      { template: 'component/basic.component.less.hbs', output: `${pathName}.component.less` },

    ];
    // 根据配置添加模块文件
    if (data.generateModule) {
      files.push(
        {
          template: 'module/basic.module.ts.hbs',
          output: `${pathName}.module.ts`
        },
        {
          template: 'service/basic.service.ts.hbs',
          output: `${pathName}.service.ts`
        },
        {
          template: 'module/basic-routing.module.ts.hbs',
          output: `${pathName}-routing.module.ts`
        }
      );
    }
    if (data.buttons.hasAddButton) {
      files.push(
        {
          template: 'component/detail/detail.component.ts.hbs',
          output: `${detailPathName}-detail.component.ts`
        },
        {
          template: 'component/detail/detail.component.html.hbs',
          output: `${detailPathName}-detail.component.html`
        },
        {
          template: 'component/detail/detail.component.less.hbs',
          output: `${detailPathName}-detail.component.less`
        }
      );
    }
    const createdFiles = [];
    for (const file of files) {
      const outputPath = path.join(targetPath, file.output);
      await this.generateFile(
        this.getTemplatePath(file.template),
        outputPath,
        data
      );
      createdFiles.push(outputPath);
    }

    return createdFiles;
  }

  private async getTargetPath() {
    // 获取当前激活文件所在目录
    const activeEditor = vscode.window.activeTextEditor;
    return activeEditor
      ? path.dirname(activeEditor.document.fileName)
      : vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }
}
