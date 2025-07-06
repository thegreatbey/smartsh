# smartsh (alias: `sm`)

A tiny cross-shell command runner that enables Unix-style commands and connectors (&&, ||) on any OS or shell, with automatic translation of common Unix commands to native PowerShell equivalents.

## Installation

Use with `npx` (no install):

```bash
# Long name
npx smartsh "echo hello && echo world"

# Shorthand alias (same behaviour)
npx sm "echo hello && echo world"
```

Or install globally:

```bash
# Installs both `smartsh` and `sm` binaries
npm install -g smartsh

# Use either name
sm "echo hello && echo world"
smartsh "echo hello && echo world"
```

## How it works

1. Detects your current shell and (for PowerShell) its version.
2. For PowerShell, translates common Unix commands (rm, mkdir, ls) to PowerShell equivalents.
3. If the shell natively supports && / || (Bash, CMD, PowerShell 7+), the command is run unchanged.
4. For legacy PowerShell (<7) the tool rewrites the command into an equivalent script that uses $? checks to faithfully emulate conditional execution.
5. Executes the (possibly-translated) command, forwarding stdin/stdout/stderr and the exit code.

## Example on legacy PowerShell (<7)

# Using the shorthand in PowerShell
```powershell
> sm "echo ok && echo still-ok || echo failed"
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

# Supported Unix-style commands (translated on PowerShell)

| Unix | Flags | PowerShell equivalent |
|------|-------|----------------------|
| rm   | -f, -r, -rf | Remove-Item (-Force / -Recurse) |
| ls   | (none), -l, -la | Get-ChildItem (-Force) |
| cp   | -r | Copy-Item -Recurse |
| mv   | — | Move-Item |
| mkdir| (none), -p | New-Item -ItemType Directory (-Force) |
| touch| — | New-Item -ItemType File |
| cat  | — | Get-Content |
| grep | -i | Select-String (-CaseSensitive:$false) |
| head | -n N / -N | Select-Object -First N |
| tail | -n N / -N | Select-Object -Last N |
| wc   | -l | Measure-Object -Line |

Yes, that means one-liners like:

```bash
sm "ls -la | grep .js | head -10 > js.txt"
```

…will Just Work™ on PowerShell 5. 