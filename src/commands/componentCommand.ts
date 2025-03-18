import * as vscode from 'vscode';
import { ComponentGenerator } from '../generators/componentGenerator';
import { ConfigPanel } from '../webviews/configPanel';
import path from 'path';

export function registerComponentCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand('cgat.generateComponent', async (uri: vscode.Uri) => {

    // 使用右键点击的路径
    const targetPath = uri.fsPath;
    console.log('🚀 -> returnvscode.commands.registerCommand -> targetPath:', targetPath);
    const nearestModule = await findNearestModule(targetPath);
    console.log('🚀 -> returnvscode.commands.registerCommand -> nearestModule:', nearestModule);
    
    // 打开配置面板
    ConfigPanel.show(context, {
      targetPath,
      existingModulePath: nearestModule
    });
    
  });
}
async function findNearestModule(targetPath: string): Promise<string | undefined> {
  const files = await vscode.workspace.findFiles('**/*.module.ts');
  let nearestModule;
  let shortestDistance = Infinity;
  
  for (const file of files) {
    const modulePath = file.fsPath;
    const distance = getPathDistance(targetPath, modulePath);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestModule = modulePath;
    }
  }
  
  return nearestModule;
}

function getPathDistance(path1: string, path2: string): number {
  const relativePath = path.relative(path1, path2);
  return relativePath.split(path.sep).length;
}
