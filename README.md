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

### CLI flags

| Flag | Shorthand | Purpose |
|------|-----------|---------|
| `--translate-only` | `-t` | Print the translated command but don’t execute it (useful for debugging). |
| `--lint` | `-l` | Check a command for unsupported segments/flags. Exits with code 1 if anything can’t be translated. |
| `--debug` | `-d` | Enable verbose shell-detection and translation logs. |
| `--completion <shell>` | — | Output a shell-completion script for `bash`, `zsh`, or `powershell`. |

Example lint check:

```bash
sm --lint "ls | foocmd bar"
# ✖ Unsupported segments detected:
#   - foocmd bar
```

Generate a completion script:

```bash
# Bash example
smartsh --completion bash > /etc/bash_completion.d/smartsh

# Zsh example (oh-my-zsh)
smartsh --completion zsh > ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/_smartsh

# PowerShell example
smartsh --completion pwsh | Out-File -Encoding ASCII $PROFILE\smartsh-completion.ps1
source $PROFILE\smartsh-completion.ps1
```

### Extending via ~/.smartshrc

You can register additional translations without touching the core package.  Create a JSON file in your home directory named **`.smartshrc`** or **`.smartshrc.json`**:

```jsonc
{
  "mappings": [
    {
      "unix": "foo",
      "ps": "Write-Host foo",
      "flagMap": {}
    },
    {
      "unix": "bar",
      "ps": "Invoke-Something",
      "flagMap": {
        "-q": "-Quiet"
      },
      "forceArgs": true
    }
  ]
}
```

Fields are identical to the built-in mapping objects (see source).  When `smartsh` starts it loads this file and merges your mappings with the built-ins; duplicates by `unix` name are ignored.

#### Using a JavaScript plugin

If you need more dynamic logic you can create `~/.smartshrc.js` (CommonJS) that exports either:

1. **An object** with the same shape as the JSON example above.
2. **A function** that receives a helpers object and can call `addExtraMappings` directly.

Example:

```js
// ~/.smartshrc.js
module.exports = ({ addExtraMappings }) => {
  addExtraMappings([
    {
      unix: "hello",
      ps: "Write-Host 'Hello from plugin'",
      flagMap: {}
    }
  ]);
  // can also return JSON-style config
  return { mappings: [] };
};
```

Changes take effect the next time you run `smartsh`.

---

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