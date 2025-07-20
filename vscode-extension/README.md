# Smartsh VS Code Extension

A VS Code extension that provides real-time translation of Unix commands to PowerShell, making it easier to work with cross-platform shell scripts.

## Features

- **Command Palette Integration**: Translate Unix commands via `Ctrl+Shift+P`
- **Live Translation Preview**: Hover over Unix commands to see PowerShell equivalents
- **Selection Translation**: Right-click selected text to translate it
- **IntelliSense**: Get command suggestions and documentation
- **Status Bar**: Shows current shell type
- **Command Completion**: Auto-complete for supported Unix commands

## Commands

- `Smartsh: Translate Unix Command` - Open input box to translate a command
- `Smartsh: Translate Selected Text` - Translate selected text in the editor

## Usage

1. **Command Palette**: Press `Ctrl+Shift+P` and type "Smartsh"
2. **Hover Preview**: Hover over Unix commands in shell scripts
3. **Right-click**: Select text and right-click to translate
4. **Auto-complete**: Type Unix commands to get suggestions

## Supported Commands

The extension supports 46+ Unix commands including:
- File operations: `ls`, `rm`, `cp`, `mv`, `mkdir`, `touch`
- Text processing: `cat`, `grep`, `head`, `tail`, `wc`, `sort`, `uniq`
- System utilities: `ps`, `kill`, `df`, `du`, `pwd`, `date`
- Network tools: `curl`, `wget`, `ping`, `netstat`, `ssh`
- File compression: `tar`, `gzip`, `gunzip`
- And many more!

## Configuration

- `smartsh.enableLivePreview`: Enable/disable hover preview (default: true)
- `smartsh.showStatusBar`: Show/hide status bar indicator (default: true)

## Development

```bash
cd vscode-extension
npm install
npm run compile
```

Press `F5` in VS Code to run the extension in debug mode.

## Building

```bash
npm run compile
```

## Publishing

```bash
vsce package
vsce publish
``` 