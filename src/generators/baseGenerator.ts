import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { pascalCase, camelCase, paramCase } from 'change-case';
// 注册 helper
// 驼峰式命名，如：'hello-world' -> 'HelloWorld'
Handlebars.registerHelper('pascalCase', (str) => pascalCase(str));
// 首字母小写的驼峰式命名，如：'hello-world' -> 'helloWorld'
Handlebars.registerHelper('camelCase', (str) => camelCase(str));
// 连字符命名（kebab-case），如：'helloWorld' -> 'hello-world'
Handlebars.registerHelper('paramCase', (str) => paramCase(str));
// 大写加下划线命名（UPPER_SNAKE_CASE），如：'helloWorld' -> 'HELLO_WORLD'
Handlebars.registerHelper('upperSnakeCase', (str) => {
  const kebabCase = paramCase(str);
  return kebabCase.replace(/-/g, '_').toUpperCase();
});

Handlebars.registerHelper('or', function() {
  return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
});
Handlebars.registerHelper('and', function() {
  return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
});
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});
Handlebars.registerHelper('not', function (a, b) {
  return a !== b;
});
export abstract class BaseGenerator {
  constructor(protected context: vscode.ExtensionContext) {


  }
  protected async findModuleFile(directory: string): Promise<string | undefined> {
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(directory, '**/*.module.ts')
    );
    return files[0]?.fsPath;
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
