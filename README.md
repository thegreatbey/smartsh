# smartsh

A tiny cross-shell command runner that lets you use familiar Unix-style connectors (`&&`, `||`) on any OS or shell.

## Installation

Use with `npx` (no install):

```bash
npx smartsh "echo hello && echo world"
```

Or install globally:

```bash
npm install -g smartsh
smartsh "echo hello && echo world"
```

## How it works

1. Detects your current shell **and** (for PowerShell) its version.
2. If the shell natively supports `&&` / `||` (Bash, CMD, PowerShell 7+), the command is run unchanged.
3. For legacy PowerShell (<7) the tool rewrites the command into an equivalent script that uses `$?` checks to faithfully emulate conditional execution.
4. Executes the (possibly-translated) command, forwarding stdin/stdout/stderr and the exit code.

## Example on legacy PowerShell (<7)

```powershell
> smartsh "echo ok && echo still-ok || echo failed"
# Internally runs something like:
#   echo ok; if ($?) { echo still-ok } ; if (-not $?) { echo failed }
```

## Building locally

```bash
npm install
npm run build
```

The bundled output is generated at `dist/cli.js` and includes a shebang so it can be executed directly.

## Limitations

* On Windows PowerShell/CMD you may need to quote the command string so that the host shell doesn’t interpret the connectors.
* The parser ignores connectors that appear inside single or double quotes, but nested or escaped quotes may not be fully supported. 

### Environment overrides

* `SMARTSH_SHELL` – manually set the shell type (`bash`, `cmd`, or `powershell`) if auto-detection is incorrect.
* `SMARTSH_DEBUG=1` – enable verbose detection/debug logs. 