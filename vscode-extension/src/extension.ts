import * as vscode from 'vscode';
import { translateCommand, detectShell } from 'smartsh';

export function activate(context: vscode.ExtensionContext) {
  console.log('Smartsh extension is now active!');

  // Register command to translate Unix commands
  let translateCommandDisposable = vscode.commands.registerCommand('smartsh.translateCommand', async () => {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter Unix command to translate',
      placeHolder: 'e.g., ls -la | grep .js'
    });

    if (input) {
      const shell = detectShell();
      const translated = translateCommand(input, shell);
      
      // Show the translation
      const document = await vscode.workspace.openTextDocument({
        content: `# Original Unix Command:\n${input}\n\n# Translated to ${shell.type}:\n${translated}`,
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document);
    }
  });

  // Register command to translate selected text
  let translateSelectionDisposable = vscode.commands.registerCommand('smartsh.translateSelection', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text.trim()) {
      vscode.window.showWarningMessage('No text selected');
      return;
    }

    const shell = detectShell();
    const translated = translateCommand(text, shell);

    // Replace the selection with the translated command
    await editor.edit(editBuilder => {
      editBuilder.replace(selection, translated);
    });

    vscode.window.showInformationMessage(`Translated to ${shell.type}`);
  });

  // Status bar item to show current shell
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = `$(terminal) ${detectShell().type}`;
  statusBarItem.tooltip = 'Current shell type (Smartsh)';
  statusBarItem.show();

  // Register hover provider for live translation preview
  const hoverProvider = vscode.languages.registerHoverProvider(['shellscript', 'bash'], {
    provideHover(document, position, token) {
      const range = document.getWordRangeAtPosition(position);
      if (!range) return;

      const word = document.getText(range);
      
      // Check if it looks like a Unix command
      const unixCommands = [
        'ls', 'rm', 'cp', 'mv', 'mkdir', 'touch', 'cat', 'grep', 'head', 'tail',
        'wc', 'sort', 'uniq', 'find', 'xargs', 'echo', 'pwd', 'cd', 'ps', 'kill',
        'df', 'du', 'chmod', 'chown', 'tar', 'curl', 'wget', 'ping', 'netstat',
        'ssh', 'gzip', 'gunzip', 'less', 'more', 'nl', 'top', 'uptime', 'free'
      ];

      if (unixCommands.includes(word)) {
        const shell = detectShell();
        const translated = translateCommand(word, shell);
        
        return new vscode.Hover([
          `**Unix Command**: \`${word}\``,
          `**${shell.type} equivalent**: \`${translated}\``
        ]);
      }
    }
  });

  // Register completion provider for command suggestions
  const completionProvider = vscode.languages.registerCompletionItemProvider(['shellscript', 'bash'], {
    provideCompletionItems(document, position, token, context) {
      const completionItems: vscode.CompletionItem[] = [];
      
      const commands = [
        { name: 'ls', detail: 'List directory contents', documentation: 'Get-ChildItem' },
        { name: 'rm', detail: 'Remove files/directories', documentation: 'Remove-Item' },
        { name: 'cp', detail: 'Copy files/directories', documentation: 'Copy-Item' },
        { name: 'mv', detail: 'Move files/directories', documentation: 'Move-Item' },
        { name: 'mkdir', detail: 'Create directory', documentation: 'New-Item -ItemType Directory' },
        { name: 'touch', detail: 'Create empty file', documentation: 'New-Item -ItemType File' },
        { name: 'cat', detail: 'Display file contents', documentation: 'Get-Content' },
        { name: 'grep', detail: 'Search text patterns', documentation: 'Select-String' },
        { name: 'head', detail: 'Show first lines', documentation: 'Select-Object -First' },
        { name: 'tail', detail: 'Show last lines', documentation: 'Select-Object -Last' },
        { name: 'wc', detail: 'Word/line count', documentation: 'Measure-Object' },
        { name: 'ping', detail: 'Network connectivity', documentation: 'Test-Connection' },
        { name: 'top', detail: 'Process monitoring', documentation: 'Get-Process' },
        { name: 'uptime', detail: 'System uptime', documentation: 'Get system uptime' },
        { name: 'free', detail: 'Memory usage', documentation: 'Get memory info' }
      ];

      commands.forEach(cmd => {
        const item = new vscode.CompletionItem(cmd.name, vscode.CompletionItemKind.Function);
        item.detail = cmd.detail;
        item.documentation = new vscode.MarkdownString(`**PowerShell equivalent**: \`${cmd.documentation}\``);
        completionItems.push(item);
      });

      return completionItems;
    }
  }, '');

  // Register all disposables
  context.subscriptions.push(
    translateCommandDisposable,
    translateSelectionDisposable,
    statusBarItem,
    hoverProvider,
    completionProvider
  );
}

export function deactivate() {
  console.log('Smartsh extension is now deactivated!');
} 