// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { registerComponentCommand } from './commands/componentCommand';
import { ConfigPanel } from './webviews/configPanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cgat" is now active!');

	 // 注册命令
	 context.subscriptions.push(
		registerComponentCommand(context),
		vscode.commands.registerCommand('cgat.openConfig', () => {
		  ConfigPanel.show(context);
		})
	 );
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
