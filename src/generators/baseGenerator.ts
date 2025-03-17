import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { pascalCase, camelCase, paramCase } from 'change-case';
// 注册 helper
Handlebars.registerHelper('pascalCase', (str) => pascalCase(str));
Handlebars.registerHelper('camelCase', (str) => camelCase(str));
Handlebars.registerHelper('paramCase', (str) => paramCase(str));

Handlebars.registerHelper('or', function() {
  return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
});
export abstract class BaseGenerator {
  constructor(protected context: vscode.ExtensionContext) {


  }

  protected async generateFile(templatePath: string, outputPath: string, data: object) {
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    const content = template(data);

    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, content);

    return outputPath;
  }

  protected getTemplatePath(...parts: string[]) {
    return path.join(this.context.extensionPath, 'templates', ...parts);
  }
}
