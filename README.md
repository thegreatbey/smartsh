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

---

## smartsh vs. WSL (and why both exist)

**smartsh** is like a **universal plug adapter** — it lets everyday Unix one-liners run *natively* on Windows (PowerShell/CMD) **without** installing a full Linux environment.

**WSL** is more like running a Linux laptop *inside* Windows: perfect when you need the entire Linux tool-chain, but heavyweight when your goal is simply “make `rm -rf dist && npm run build` work everywhere”.

### When should I reach for smartsh?

* You just need tutorial commands like `rm -rf dist && npm run build` to work everywhere.
* Your CI pipeline runs on multiple OSes (GitHub Actions Windows runner, etc.).
* Teammates aren’t comfortable installing/maintaining WSL.
* You’re on a corporate machine where WSL is blocked by policy.

### smartsh in the tool landscape

| Tool | Core idea (plain English) |
|------|---------------------------|
| **smartsh** | “Write your usual shell commands — I’ll translate them so they work everywhere.” |
| **WSL** | “Run a full Linux distro inside Windows.” |
| **shx** | “Do basic Unix file ops (`rm`, `cp`, …) safely in npm scripts on Windows.” |
| **dax-sh / zx / shelljs** | “Write shell-style scripts in JavaScript/TypeScript.” |

### Quick cross-platform snippet

```bash
# Works unchanged on Windows PowerShell <7, Mac, Linux, CI runners…
sm "rm -rf dist && npm run build && cp -r src/* dist/"
```

--- 