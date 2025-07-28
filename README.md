# smartsh (alias: `sm`)

A tiny cross-shell command runner that enables Unix-style commands and connectors (&&, ||) on any OS or shell, with automatic translation of common Unix commands to native PowerShell equivalents.

Smartsh v0.3.7:

---

````markdown
# ⚡ Smartsh (`sm`) – Universal Cross-Shell Command Translator

[![npm version](https://img.shields.io/npm/v/smartsh.svg)](https://www.npmjs.com/package/smartsh)
[![Tests](https://img.shields.io/badge/tests-251%20passing-brightgreen.svg)](#)
[![Size](https://img.shields.io/badge/size-~190KB-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](#)

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
- Tested: **251 tests passing**

---

## 📦 Install
```bash
# Global install
npm install -g smartsh

# Or use without install
npx smartsh "rm -rf dist && npm run build"
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
pnpm test
# 16 files, 251 tests — all passing
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

## 🔥 What’s New in v0.3.7

* ✅ **Bidirectional Translation Added**
* ✅ **PowerShell → Unix + CMD → Unix support**
* ✅ **484 reverse mappings**
* ✅ **Size optimization: \~190 KB published**
* ✅ **251 tests passing, including bidirectional coverage**

---

## 🛠 Dev Commands

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
pnpm build
git add -A
git commit -m "update bidirectional support"
git push origin main
npm publish --access public
```

---

## 📜 License

MIT © 2025 Smartsh Contributors

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
