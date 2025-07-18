import * as vscode from 'vscode';
import { spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	console.log('smartsh extension is now active!');

	// Register command to run smartsh commands
	let runCommand = vscode.commands.registerCommand('smartsh.runCommand', async () => {
		const command = await vscode.window.showInputBox({
			prompt: 'Enter smartsh command to run',
			placeHolder: 'echo hello && echo world'
		});

		if (!command) {
			return;
		}

		// Create terminal and run command
		const terminal = vscode.window.createTerminal('smartsh');
		terminal.show();
		terminal.sendText(`smartsh "${command}"`);
	});

	// Register command to translate commands
	let translateCommand = vscode.commands.registerCommand('smartsh.translateCommand', async () => {
		const command = await vscode.window.showInputBox({
			prompt: 'Enter command to translate',
			placeHolder: 'ls -la | grep .js'
		});

		if (!command) {
			return;
		}

		try {
			// Run smartsh with --translate-only flag
			const result = await new Promise<string>((resolve, reject) => {
				const child = spawn('smartsh', ['--translate-only', command], {
					stdio: ['pipe', 'pipe', 'pipe']
				});

				let output = '';
				let error = '';

				child.stdout.on('data', (data) => {
					output += data.toString();
				});

				child.stderr.on('data', (data) => {
					error += data.toString();
				});

				child.on('close', (code) => {
					if (code === 0) {
						resolve(output.trim());
					} else {
						reject(new Error(error || `smartsh exited with code ${code}`));
					}
				});

				child.on('error', (err) => {
					reject(err);
				});
			});

			// Show translated command in new document
			const doc = await vscode.workspace.openTextDocument({
				content: `# Original: ${command}\n# Translated:\n${result}`,
				language: 'powershell'
			});
			await vscode.window.showTextDocument(doc);

		} catch (error) {
			vscode.window.showErrorMessage(`Translation failed: ${error}`);
		}
	});

	context.subscriptions.push(runCommand, translateCommand);
}

export function deactivate() {} 