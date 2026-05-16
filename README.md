<p align="center">
  <img src="smartsh_icon_optim.png" alt="smartsh logo" width="200"/>
</p>

# smartsh (alias: `sm`)

A tiny cross-shell command runner that enables Unix-style commands and connectors (&&, ||) on any OS or shell, with automatic translation of common Unix commands to native PowerShell equivalents.

---

````markdown
# ⚡ Smartsh (`sm`) – Universal Cross-Shell Command Translator

[![Install](https://img.shields.io/badge/Install-npm%20i%20--g%20smartsh-CB3837?logo=npm)](https://www.npmjs.com/package/smartsh)
[![npm version](https://img.shields.io/npm/v/smartsh?logo=npm)](https://www.npmjs.com/package/smartsh)
[![Downloads](https://img.shields.io/npm/dm/smartsh)](https://www.npmjs.com/package/smartsh)
[![Install size](https://packagephobia.com/badge?p=smartsh)](https://packagephobia.com/result?p=smartsh)
[![Build & Publish](https://img.shields.io/github/actions/workflow/status/thegreatbey/smartsh/publish.yml?branch=main&label=Build%20%26%20Publish)](https://github.com/thegreatbey/smartsh/actions/workflows/publish.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/thegreatbey/smartsh/test-npm.yml?branch=main&label=Tests)](https://github.com/thegreatbey/smartsh/actions/workflows/test-npm.yml)
[![License: MIT](https://img.shields.io/npm/l/smartsh)](LICENSE)



---

### **Write Once. Run Anywhere.**
Run **Unix commands on Windows** and **Windows commands on Unix/macOS** without rewriting scripts.

---

## ✅ Features
- **Full Bidirectional Translation**  
  - Unix → PowerShell/CMD  
  - PowerShell/CMD → Unix  
- **Cross-Shell Connectors**  
  Handles `&&`, `||`, pipes, and redirections  
- **Command Coverage**  
  - 171 Unix → PowerShell  
  - 70 Unix → CMD  
  - 484 Windows → Unix reverse translations  
- **Lightweight**  
  - Built: **~904 KB**  
  - Published: **~190 KB**  
- **Zero runtime dependencies**  
- Tested: **252 tests passing**

---

## 📦 Install
```bash
# Global install (npm)
npm install -g smartsh

# Global install (Bun — same package from the npm registry)
bun add -g smartsh

# Or use without install
npx smartsh "rm -rf dist && npm run build"
bunx smartsh "rm -rf dist && bun run build"
````

---

## 🚀 Usage

### Unix → Windows

```bash
sm "rm -rf dist && npm run build"

# PowerShell output:
Remove-Item -Recurse -Force dist; if ($?) { npm run build }
```

### Windows → Unix

```bash
sm --reverse "Remove-Item -Recurse -Force dist; npm run build"
# Output:
rm -rf dist && npm run build
```

---

## 🖥 CLI Options

| Flag               | Description                        |
| ------------------ | ---------------------------------- |
| `--reverse`        | Translate Windows → Unix           |
| `--target <shell>` | Force a target shell               |
| `--translate-only` | Show translation without execution |
| `--debug`          | Verbose logs                       |

---

## 🔍 Examples

```bash
# Unix → Windows (PowerShell)
sm "ls -la | grep .ts && echo Done"
# -> Get-ChildItem -Force | Select-String '.ts'; if ($?) { echo Done }

# Windows → Unix
sm --reverse "Get-ChildItem | Select-String .ts; echo Done"
# -> ls | grep .ts && echo Done
```

---

## 🧪 Tests

```bash
bun install
bun run test
# 16 files, 252 tests — all passing
```

---

## ⚡ Why Smartsh?

| Feature          | Smartsh | shx | cross-env |
| ---------------- | ------- | --- | --------- |
| Unix→Windows     | ✅       | ✅   | ❌         |
| Windows→Unix     | ✅       | ❌   | ❌         |
| Handles &&, \|\| | ✅       | ✅   | ❌         |
| Lightweight      | ✅       | ✅   | ✅         |

---

## 🔥 What’s Cool

* ✅ **Bidirectional Translation Added**
* ✅ **PowerShell → Unix + CMD → Unix support**
* ✅ **484 reverse mappings**
* ✅ **Size optimization: \~190 KB published**
* ✅ **252 tests passing, including bidirectional coverage**

---

## 🛠 Dev Commands

Use **`bun install`** once after cloning; **`bun.lock`** is the source of truth (no `package-lock.json`, no `pnpm-lock.yaml`).

### Clean old builds

**Windows PowerShell**

```powershell
Remove-Item .\smartsh-*.tgz -Force
Remove-Item .\dist -Recurse -Force
```

**Windows CMD**

```cmd
del smartsh-*.tgz
rmdir /S /Q dist
```

**Unix**

```bash
rm -rf smartsh-*.tgz dist
```

### Build & Publish

```bash
npm version patch
bun run build
git add -A
git commit -m "update bidirectional support"
git push origin main
npm publish --access public
```

---

## 📜 License

MIT © 2025 cavani21 & Smartsh Contributors

```
Command Coverage Details
Smartsh doesn’t have equal coverage in every direction. Here’s why:

Why CMD Coverage is Smaller
CMD is a very limited shell compared to PowerShell.

Many Unix utilities (grep, awk, sed, etc.) have no direct CMD equivalent.

CMD lacks advanced flags, pipelines, and scripting capabilities.

Result: Only basic commands (file ops, directory listing) are supported for CMD.

Recommendation: PowerShell is the preferred Windows target.

Why Windows → Unix Has Higher Count
Reverse mapping combines PowerShell + CMD → Unix.

PowerShell commands often have multiple flag combinations that map to shorter Unix equivalents:

Remove-Item -Recurse -Force → rm -rf

Get-ChildItem → ls

Each variation counts as a separate mapping.

CMD adds additional mappings (e.g., copy → cp, move → mv).

Result: More total translations when going Windows → Unix.

```

| Direction         | Count |
| ----------------- | ----- |
| Unix → PowerShell | 171   |
| Unix → CMD        | 70    |
| Windows → Unix    | 484   |

```

Command Coverage
Unix → PowerShell: 171 commands

Unix → CMD: 70 commands

Windows → Unix: 484 translations

Why CMD coverage is smaller?
CMD is very limited compared to PowerShell, so only basic commands (like copy, move, del) are supported.

Why Windows → Unix has more?
Reverse mapping combines PowerShell + CMD and accounts for multiple flag variations, resulting in a higher count.

```
