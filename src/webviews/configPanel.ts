import * as vscode from 'vscode';
import { getUri } from '../utilities/webviewUtils';
import { ComponentGenerator } from '../generators/componentGenerator';
import * as path from 'path';
import * as fs from 'fs';

export interface ConfigPanelOptions {
  targetPath?: string;
  existingModulePath?: string;
}
export class ConfigPanel {
  public static currentPanel: ConfigPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _targetPath: string | undefined;
  private _existingModulePath: string | undefined;
  private _existingModuleName: string | undefined;

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, options: ConfigPanelOptions = {}) {
    this._panel = panel;
    this._targetPath = options?.targetPath;
    this._existingModulePath = options?.existingModulePath || '';
    const pathParts = this._existingModulePath.replace(/\\/g, '/').split('/');
    this._existingModuleName = pathParts[pathParts.length - 1].replace('.module.ts', '');
    this._panel.webview.html = this._getWebviewContent(context);
    this._setupWebviewHooks(context);
    // 添加面板关闭事件监听
    this._panel.onDidDispose(
      () => {
        ConfigPanel.currentPanel = undefined;
      },
      null,
      context.subscriptions
    );
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
              <h2>生成路径</h2>
              <div class="form-group">
                <label>目标路径：</label>
                ${this._targetPath ?
        `<span id="targetPath">${this._targetPath}</span>` :
        `<input type="text" name="targetPath" required />
                 <button type="button" id="selectPath">选择路径</button>`
      }
              </div>
            </div>
            <div class="section">
              <h2>基础设置</h2>
              <div class="module-row">
                <div class="form-row">
                  <div class="form-group">
                    <input type="checkbox" name="generateModule" checked />
                    <label>生成模块(包含路由、服务)</label>
                  </div>
                  <div class="form-group" id="moduleNameGroup">
                    <label>模块名称：</label>
                    <input type="text" name="moduleName" value="" />
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>组件名称：</label>
                  <input type="text" name="componentName" required />
                </div>
                <div class="form-group">
                  <label>业务名称：</label>
                  <input type="text" name="businessName" />
                </div>
                <div class="form-group">
                  <label>选择器前缀：</label>
                  <input type="text" name="selectorPrefix" value="yzf" />
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>页面设置</h2>
              <!-- Tab 导航 -->
              <div class="tab-container">
                <div class="tab-nav">
                  <button type="button" class="tab-btn active" data-tab="filter-tab">筛选设置</button>
                  <button type="button" class="tab-btn" data-tab="button-tab">按钮设置</button>
                  <button type="button" class="tab-btn" data-tab="table-tab">表格设置</button>
                </div>
                
                <!-- Tab 内容 -->
                <div class="tab-content">
                  <!-- 筛选设置 Tab -->
                  <div id="filter-tab" class="tab-pane active">
                    <div class="section tab-section">
                      <div class="form-group">
                        <input type="checkbox" name="hasCompanyFilter" checked />
                        <label>企业筛选</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasDateFilter" checked/>
                        <label>日期筛选</label>
                      </div>
                      
                      <div class="form-group">
                        <input type="checkbox" name="hasInputFilter"/>
                        <label>输入筛选</label>
                      </div>
                      
                      <!-- 高级筛选部分 -->
                      <div class="filter-group">
                        <div class="filter-header">
                          <div class="form-group">
                            <input type="checkbox" name="hasAdvancedFilter" checked id="hasAdvancedFilter"/>
                            <label>高级筛选</label>
                          </div>
                        </div>
                        
                        <div class="filter-options" id="advancedFilterOptions">
                          <div class="filter-option-row">
                            <div class="form-group radio-group">
                              <input type="radio" name="advancedFilterType" value="legacy" id="legacyAdvancedFilter" checked/>
                              <label for="legacyAdvancedFilter">yzf-filter-badge</label>
                              </div>
                              <div class="filter-description">原高级筛选，目前广泛使用的组件</div>
                            </div> 
                            <div class="filter-option-row">
                              <div class="form-group radio-group">
                                <input type="radio" name="advancedFilterType" value="new" id="newAdvancedFilter" />
                                <label for="newAdvancedFilter">yzf-filter-box</label>
                              </div>
                              <div class="filter-description">新高级筛选，新UI，支持更多筛选类型和更好的用户体验</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 按钮设置 Tab -->
                  <div id="button-tab" class="tab-pane">
                    <div class="section tab-section">
                      <div class="form-group">
                        <input type="checkbox" name="hasAddButton" checked onchange="toggleDetailConfig()" />
                        <label>新增</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasDeleteButton" checked />
                        <label>批量删除</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasImportButton" />
                        <label>导入</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasExportButton" />
                        <label>批量导出</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasBatchFilterButton" />
                        <label>批量筛选</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasBatchEnableButton" />
                        <label>批量启用禁用</label>
                      </div>
                      
                      <div id="detailConfig">
                        <h3>新增/编辑详情配置</h3>
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
                    </div>
                  </div>
                  
                  <!-- 表格设置 Tab -->
                  <div id="table-tab" class="tab-pane">
                    <div class="section tab-section">
                      <div class="form-group">
                        <input type="checkbox" name="hasEnhanceTable" />
                        <label>新表格（enhance-table）</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasTableSelection" />
                        <label>多选</label>
                      </div>
                      <div class="form-group table-selection-option" style="display:none">
                        <input type="checkbox" name="hasTableCrossPageSelection" />
                        <label>全页选&跨页选</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasTablePolling" />
                        <label>列表轮询</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasTableEditButton" checked />
                        <label>编辑按钮</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasTableDeleteButton" checked />
                        <label>删除按钮</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasTableViewButton" checked />
                        <label>详情按钮</label>
                      </div>
                      <div class="form-group">
                        <input type="checkbox" name="hasTableEnableButton" />
                        <label>启用禁用按钮</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="section">
                <h2>
                  文件目录预览
                  <div class="tip-container">
                    <span class="tip root">*红色</span>代表根目录，
                    <span class="tip new">*绿色</span>代表新增目录/文件，
                    <span class="tip existing">*黄色</span>代表现有目录/文件
                  </div>
                </h2>
                <div id="filePreview" class="file-preview">
                  <!-- 动态生成的目录结构 -->
                </div>
              </div>
  
              <div class="button-group">
                <button type="submit" id="saveConfig">保存配置</button>
                <button type="button" id="generateComponent">生成组件</button>
              </div>
            </div>


          </form>
        </div>
        <script>
          window.existingModuleName = '${this._existingModuleName || ''}';
        </script>
        <script src="${scriptUri}"></script>
        <script>
          window.addEventListener('message', (event) => {
            if (event.data.command === 'open-devtools') {
              // 调用Chrome开发者工具（仅适用于Electron环境）
              if (typeof require !== 'undefined') {
                require('electron').remote.getCurrentWebContents().openDevTools();
              }
            }
          });
          // 通知插件Webview已加载完成
          // vscode.postMessage({ command: 'webview-ready' });
        </script>
      </body>
      </html>`;
  }

  private _setupWebviewHooks(context: vscode.ExtensionContext) {
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === 'webview-ready') {
          this._panel.webview.postMessage({ command: 'open-devtools' });
        }
        console.log('🚀 -> ConfigPanel -> message:', message);
        const config = {
          pre: {
            generateModule: message.generateModule === 'on',
            moduleName: message.moduleName
          },
          basic: {
            componentName: message.componentName,
            selectorPrefix: message.selectorPrefix,
            businessName: message.businessName || '',
          },
          filters: {
            hasCompanyFilter: message.hasCompanyFilter === 'on',
            hasDateFilter: message.hasDateFilter === 'on',
            hasInputFilter: message.hasInputFilter === 'on',
            hasAdvancedFilter: message.hasAdvancedFilter === 'on',
            advancedFilterType: message.hasAdvancedFilter === 'on' ? message.advancedFilterType : null
          },
          buttons: {
            hasAddButton: message.hasAddButton === 'on',
            hasDeleteButton: message.hasDeleteButton === 'on',
            hasImportButton: message.hasImportButton === 'on',
            hasExportButton: message.hasExportButton === 'on',
            hasBatchFilterButton: message.hasBatchFilterButton === 'on',
            hasBatchEnableButton: message.hasBatchEnableButton === 'on',
          },
          table: {
            hasEnhanceTable: message.hasEnhanceTable === 'on',
            hasSelection: message.hasTableSelection === 'on',
            hasCrossPageSelection: message.hasTableCrossPageSelection === 'on',
            hasPolling: message.hasTablePolling === 'on',
            hasEditButton: message.hasTableEditButton === 'on',
            hasDeleteButton: message.hasTableDeleteButton === 'on',
            hasViewButton: message.hasTableViewButton === 'on',
            hasEnableButton: message.hasTableEnableButton === 'on'
          },
          detail: {
            type: message.detailType,
            implement: message.detailImplement
          }
        };
        switch (message.command) {
          case 'selectPath':
            const result = await vscode.window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              title: '选择组件生成路径'
            });
            if (result && result[0]) {
              this._targetPath = result[0].fsPath;
              this._panel.webview.html = this._getWebviewContent(context);
            }
            break;
          case 'saveConfig':
            await vscode.workspace.getConfiguration('cgat').update(
              'componentConfig',
              config,
              vscode.ConfigurationTarget.Global
            );
            vscode.window.showInformationMessage('配置已保存');
            break;
          case 'generateComponent':
            if (!this._targetPath) {
              vscode.window.showErrorMessage('请选择生成路径');
              return;
            } 
            if (!message.componentName) {
              vscode.window.showErrorMessage('请输入组件名称');
              return;
            }
            
            // 保存配置
            await vscode.workspace.getConfiguration('cgat').update(
              'componentConfig',
              config,
              vscode.ConfigurationTarget.Global
            );
            
            // 检查目标路径是否已经存在模块文件
            let existingModulePath = this._existingModulePath;
            const moduleName = message.moduleName || message.componentName;
            
            if (config.pre.generateModule) {
              const potentialModulePath = path.join(this._targetPath, `${moduleName}/${moduleName}.module.ts`);
              
              // 使用fs模块检查文件是否存在
              if (fs.existsSync(potentialModulePath)) {
                // 如果模块文件已存在，询问用户是否要使用现有模块
                const useExisting = await vscode.window.showInformationMessage(
                  `检测到目标路径已存在模块 ${moduleName}.module.ts，是否使用现有模块？`,
                  '使用现有模块', '重新生成'
                );
                
                if (useExisting === '使用现有模块') {
                  // 更新配置，使用现有模块
                  config.pre.generateModule = false;
                  existingModulePath = potentialModulePath;
                  this._existingModulePath = potentialModulePath;
                  
                  // 更新模块名称
                  const pathParts = potentialModulePath.replace(/\\/g, '/').split('/');
                  this._existingModuleName = pathParts[pathParts.length - 1].replace('.module.ts', '');
                  
                  // 重要：更新目标路径为模块所在目录，确保组件生成在正确位置
                  this._targetPath = path.dirname(potentialModulePath);
                }
              }
            } else if (existingModulePath) {
              // 如果用户选择使用现有模块但没有通过上面的检测流程
              // 确保目标路径是模块所在目录
              this._targetPath = path.dirname(existingModulePath);
              console.log('🚀 -> Using existing module path as target:', this._targetPath);
            }
            
            // 创建生成器实例，传入可能更新后的existingModulePath
            const generator = new ComponentGenerator(context, this._targetPath, existingModulePath);
            
            try {
              // 接收生成结果
              const result = await generator.generate(config);
              
              // 获取模块名称（无论是新生成的还是现有的）
              const displayModuleName = config.pre.generateModule 
                ? moduleName 
                : this._existingModuleName;

              // 显示主要成功消息
              setTimeout(() => {
                vscode.window.showInformationMessage(`组件 ${message.componentName} 生成成功!`);
                
                // 统一显示模块相关消息
                setTimeout(() => {
                  vscode.window.showInformationMessage(`组件在 ${displayModuleName}.module.ts 中声明成功!`);
                }, 300);
                
                setTimeout(() => {
                  vscode.window.showInformationMessage(`组件在 ${displayModuleName}-routing.module.ts 中路由声明成功!`);
                }, 400);
                
                setTimeout(() => {
                  vscode.window.showInformationMessage(`组件相关接口在 ${displayModuleName}.service.ts 中更新成功!`);
                }, 700);
              }, 200);
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

  public static show(context: vscode.ExtensionContext, options?:
    {
      targetPath: any,
      existingModulePath?: any,
    }
  ) {
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

    ConfigPanel.currentPanel = new ConfigPanel(panel, context, options);
  }
}
