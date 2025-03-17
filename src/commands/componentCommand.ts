import * as vscode from 'vscode';
import { ComponentGenerator } from '../generators/componentGenerator';
import { ConfigPanel } from '../webviews/configPanel';

export function registerComponentCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand('cgat.generateComponent', async (uri: vscode.Uri) => {

    // 使用右键点击的路径
    const targetPath = uri.fsPath;
    console.log('🚀 -> returnvscode.commands.registerCommand -> targetPath:', targetPath);
    // 打开配置面板
    ConfigPanel.show(context, targetPath);
  });
}
