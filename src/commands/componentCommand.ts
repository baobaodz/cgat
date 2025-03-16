import * as vscode from 'vscode';
import { ComponentGenerator } from '../generators/componentGenerator';

export function registerComponentCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand('cgat.generateComponent', async () => {
    const componentName = await vscode.window.showInputBox({
      prompt: '请输入组件名称（英文）',
      validateInput: value => {
        if (!/^[a-zA-Z-]+$/.test(value)) {
          return '组件名称只能包含字母和横线';
        }
        return null;
      }
    });

    if (componentName) {
      const generator = new ComponentGenerator(context);
      try {
        const files = await generator.generate(componentName);
        vscode.window.showInformationMessage(
          `成功生成组件文件：\n${files.join('\n')}`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`组件生成失败：${error.message}`);
      }
    }
  });
}
