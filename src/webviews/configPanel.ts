import * as vscode from 'vscode';
import { getUri } from '../utilities/webviewUtils';
import { ComponentGenerator } from '../generators/componentGenerator';

export class ConfigPanel {
  public static currentPanel: ConfigPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(context);
    this._setupWebviewHooks(context);
  }

  private _getWebviewContent(context: vscode.ExtensionContext) {
    const stylesUri = getUri(this._panel.webview, context.extensionUri, ["media", "styles.css"]);
    const scriptUri = getUri(this._panel.webview, context.extensionUri, ["media", "main.js"]);

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="${stylesUri}">
      </head>
      <body>
        <div class="container">
          <h1>CGAT 配置</h1>
          <form id="configForm">
            <div class="section">
              <h2>前置配置</h2>
              <div class="form-group">
                <input type="checkbox" name="generateModule" checked />
                <label>生成模块(包含路由、服务)</label>
              </div>
            </div>
            <div class="section">
              <h2>基础设置</h2>
              <div class="form-group">
                <label>组件名称：</label>
                <input type="text" name="componentName" required />
              </div>
              <div class="form-group">
                <label>选择器前缀：</label>
                <input type="text" name="selectorPrefix" value="yzf" />
              </div>
            </div>

            <div class="section">
              <h2>筛选设置</h2>
              <div class="form-group">
                <input type="checkbox" name="hasCompanyFilter" />
                <label>启用企业筛选</label>
              </div>
              <div class="form-group">
                <input type="checkbox" name="hasDateFilter" />
                <label>启用日期筛选</label>
              </div>
              <div class="form-group">
                <input type="checkbox" name="hasAdvancedFilter" />
                <label>启用高级筛选</label>
              </div>
            </div>

            <div class="section">
              <h2>按钮设置</h2>
              <div class="form-group">
                <input type="checkbox" name="hasAddButton" checked onchange="toggleDetailConfig()" />
                <label>启用新增按钮</label>
              </div>
              <div class="form-group">
                <input type="checkbox" name="hasDeleteButton" checked />
                <label>启用删除按钮</label>
              </div>
              <div class="form-group">
                <input type="checkbox" name="hasImportButton" />
                <label>启用导入按钮</label>
              </div>
              <div class="form-group">
                <input type="checkbox" name="hasExportButton" />
                <label>启用导出按钮</label>
              </div>
            </div>
            <div id="detailConfig" class="section">
              <h2>新增/编辑详情配置</h2>
              <div class="form-group">
                <label>弹窗类型：</label>
                <div class="radio-group">
                  <input type="radio" name="detailType" value="drawer" checked />
                  <label>nzDrawer</label>
                  <input type="radio" name="detailType" value="modal" />
                  <label>nzModal</label>
                </div>
              </div>
              <div class="form-group">
                <label>实现方式：</label>
                <div class="radio-group">
                  <input type="radio" name="detailImplement" value="template" checked />
                  <label>template</label>
                  <input type="radio" name="detailImplement" value="component" />
                  <label>component</label>
                </div>
              </div>
            </div>
            <div class="button-group">
              <button type="submit" id="saveConfig">保存配置</button>
              <button type="button" id="generateComponent">生成组件</button>
            </div>
          </form>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _setupWebviewHooks(context: vscode.ExtensionContext) {
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        console.log('🚀 -> ConfigPanel -> message:', message);
        const config = {
          pre: {
            generateModule: message.generateModule === 'on',
          },
          basic: {
            componentName: message.componentName,
            selectorPrefix: message.selectorPrefix
          },
          filters: {
            hasCompanyFilter: message.hasCompanyFilter === 'on',
            hasDateFilter: message.hasDateFilter === 'on',
            hasAdvancedFilter: message.hasAdvancedFilter === 'on'
          },
          buttons: {
            hasAddButton: message.hasAddButton === 'on',
            hasDeleteButton: message.hasDeleteButton === 'on',
            hasImportButton: message.hasImportButton === 'on',
            hasExportButton: message.hasExportButton === 'on'
          },
          detail: {
            type: message.detailType,
            implement: message.detailImplement
          }
        };
        switch (message.command) {
          case 'saveConfig':
            await vscode.workspace.getConfiguration('cgat').update(
              'componentConfig',
              config,
              vscode.ConfigurationTarget.Global
            );
            vscode.window.showInformationMessage('配置已保存');
            break;
          case 'generateComponent':
            if (!message.componentName) {
              vscode.window.showErrorMessage('请输入组件名称');
              return;
            }
            await vscode.workspace.getConfiguration('cgat').update(
              'componentConfig',
              config,
              vscode.ConfigurationTarget.Global
            );
            const generator = new ComponentGenerator(context);
            try {
              const files = await generator.generate(config);
              vscode.window.showInformationMessage(`组件 ${message.componentName} 生成成功!`);
            } catch (error: any) {
              vscode.window.showErrorMessage(`组件生成失败: ${error.message}`);
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  }

  public static show(context: vscode.ExtensionContext) {
    if (ConfigPanel.currentPanel) {
      ConfigPanel.currentPanel._panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'cgatConfig',
      'CGAT 配置',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    ConfigPanel.currentPanel = new ConfigPanel(panel, context);
  }
}
