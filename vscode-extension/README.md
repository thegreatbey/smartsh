# smartsh VS Code Extension

A VS Code extension that integrates with the smartsh cross-shell command runner.

## Features

- **Run smartsh commands**: Execute smartsh commands directly from VS Code
- **Translate commands**: See how Unix commands translate to PowerShell equivalents

## Commands

- `smartsh: Run Command` - Opens a terminal and runs a smartsh command
- `smartsh: Translate Command` - Shows the PowerShell translation of a Unix command

## Requirements

- smartsh must be installed globally (`npm install -g smartsh`)
- VS Code 1.74.0 or higher

## Usage

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "smartsh" to see available commands
3. Choose either "Run Command" or "Translate Command"
4. Enter your command when prompted

## Development

```bash
npm install
npm run compile
```

Press F5 to launch extension development host. 