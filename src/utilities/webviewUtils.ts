import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 获取Webview资源的完整URI路径
 * @param webview Webview实例
 * @param extensionUri 插件根URI
 * @param pathSegments 路径片段
 */
export function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathSegments: string[]
): vscode.Uri {
  return webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionUri.fsPath, ...pathSegments))
  );
}

/**
 * 获取非编译资源的原始文件路径
 * @param context 插件上下文
 * @param relativePath 相对路径
 */
export function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
