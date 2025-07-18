#!/usr/bin/env node
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/tokenize.ts
import { parse as shellParse } from "shell-quote";
function tokenizeWithPos(cmd) {
  const tokens = [];
  let cursor = 0;
  for (const tok of shellParse(cmd)) {
    if (typeof tok === "object" && "op" in tok) {
      const op = tok.op;
      if (op === "glob") {
        const pattern = tok.pattern;
        const idx = cmd.indexOf(pattern, cursor);
        tokens.push({ value: pattern, start: idx, end: idx + pattern.length });
        cursor = idx + pattern.length;
      } else {
        const idx = cmd.indexOf(op, cursor);
        tokens.push({ value: op, start: idx, end: idx + op.length });
        cursor = idx + op.length;
      }
    } else {
      const strTok = String(tok);
      const idx = cmd.indexOf(strTok, cursor);
      const qt = tok == null ? void 0 : tok.quote;
      const quoteChar = qt === "'" || qt === '"' ? qt : void 0;
      tokens.push({ value: strTok, start: idx, end: idx + strTok.length, quoteType: quoteChar });
      cursor = idx + strTok.length;
    }
  }
  return tokens;
}
function isRedirectionToken(val) {
  return /^(\d*>>?&?\d*|[<>]{1,2}|&>?)$/.test(val);
}
function tagTokenRoles(tokens) {
  const out = [];
  let expectCmd = true;
  for (const t of tokens) {
    if (OPS.has(t.value)) {
      out.push({ ...t, role: "op" });
      expectCmd = true;
      continue;
    }
    if (isRedirectionToken(t.value)) {
      out.push({ ...t, role: "arg" });
      continue;
    }
    if (expectCmd) {
      out.push({ ...t, role: "cmd" });
      expectCmd = false;
      continue;
    }
    if (t.value.startsWith("-") && t.value.length > 1 && t.quoteType === void 0) {
      out.push({ ...t, role: "flag" });
    } else {
      out.push({ ...t, role: "arg" });
    }
  }
  return out;
}
var OPS;
var init_tokenize = __esm({
  "src/tokenize.ts"() {
    "use strict";
    OPS = /* @__PURE__ */ new Set(["&&", "||", "|", ";", "|&"]);
  }
});

// src/unixMappings.ts
function addExtraMappings(maps) {
  for (const m of maps) {
    if (BASE_MAPPINGS.some((x) => x.unix === m.unix) || EXTRA_MAPPINGS.some((x) => x.unix === m.unix)) continue;
    EXTRA_MAPPINGS.push(m);
  }
}
function smartJoin(tokens) {
  const merged = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (/^\d+$/.test(tok) && i + 1 < tokens.length) {
      const op = tokens[i + 1];
      if (op === ">" || op === ">>" || op === ">&" || op === ">|" || op === "<&" || op === ">>&") {
        let combined = tok + op;
        let skip = 1;
        if ((op === ">&" || op === "<&") && i + 2 < tokens.length && /^\d+$/.test(tokens[i + 2])) {
          combined += tokens[i + 2];
          skip = 2;
        }
        merged.push(combined);
        i += skip;
        continue;
      }
    }
    merged.push(tok);
  }
  return merged.join(" ");
}
function mergeCommandSubs(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "$" && i + 1 < tokens.length && tokens[i + 1] === "(") {
      let depth = 0;
      let j = i + 1;
      for (; j < tokens.length; j++) {
        if (tokens[j] === "(") {
          depth++;
        } else if (tokens[j] === ")") {
          depth--;
          if (depth < 0) {
            break;
          }
        }
      }
      if (j < tokens.length) {
        const combined = tokens.slice(i, j + 1).join("");
        out.push(combined);
        i = j;
        continue;
      }
    }
    if (tokens[i].startsWith("$(")) {
      let combined = tokens[i];
      let j = i;
      while (!combined.endsWith(")") && j + 1 < tokens.length) {
        j++;
        combined += tokens[j];
      }
      out.push(combined);
      i = j;
      continue;
    }
    out.push(tokens[i]);
  }
  return out;
}
function mergeEnvExp(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "$" && i + 1 < tokens.length && tokens[i + 1].startsWith("{")) {
      let combined = tokens[i] + tokens[i + 1];
      let j = i + 1;
      while (!combined.endsWith("}") && j + 1 < tokens.length) {
        j++;
        combined += tokens[j];
      }
      out.push(combined);
      i = j;
      continue;
    }
    if (tokens[i].startsWith("${")) {
      let combined = tokens[i];
      let j = i;
      while (!combined.endsWith("}") && j + 1 < tokens.length) {
        j++;
        combined += tokens[j];
      }
      out.push(combined);
      i = j;
      continue;
    }
    out.push(tokens[i]);
  }
  return out;
}
function smartJoinEnhanced(tokens) {
  const mergedSubs = mergeCommandSubs(mergeEnvExp(tokens));
  const out = originalSmartJoin(mergedSubs);
  return out.replace(/\$\s+\(/g, "$(").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
}
function translateSingleUnixSegment(segment) {
  if (segment.includes("${")) {
    return segment;
  }
  const trimmed = segment.trim();
  if (trimmed.startsWith("(") || trimmed.startsWith("{")) {
    return segment;
  }
  const roleTokens = tagTokenRoles(tokenizeWithPos(segment));
  if (roleTokens.length === 0) return segment;
  let hasHereDoc = roleTokens.some((t) => t.value === "<<");
  const tokensValues = roleTokens.map((t) => t.value);
  for (let i = 0; i < tokensValues.length - 1; i++) {
    if (tokensValues[i] === "<" && tokensValues[i + 1] === "<") {
      hasHereDoc || (hasHereDoc = true);
      break;
    }
  }
  if (hasHereDoc) {
    return segment;
  }
  const tokens = roleTokens.map((t) => t.value);
  const earlyFlagTokens = roleTokens.filter((t) => t.role === "flag").map((t) => t.value);
  const earlyArgTokens = roleTokens.filter((t) => t.role === "arg").map((t) => t.value);
  const cmdToken = roleTokens.find((t) => t.role === "cmd");
  if (!cmdToken) return segment;
  const cmd = cmdToken.value;
  if (cmd === "head" || cmd === "tail") {
    let count;
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (/^-\d+$/.test(tok)) {
        count = parseInt(tok.slice(1), 10);
        break;
      }
      if (tok === "-n" && i + 1 < tokens.length) {
        count = parseInt(tokens[i + 1], 10);
        break;
      }
      if (tok === "-c" && i + 1 < tokens.length) {
        count = parseInt(tokens[i + 1], 10);
        break;
      }
      if (/^-n\d+$/.test(tok)) {
        count = parseInt(tok.slice(2), 10);
        break;
      }
      if (/^-c\d+$/.test(tok)) {
        count = parseInt(tok.slice(2), 10);
        break;
      }
    }
    if (!count || isNaN(count)) return segment;
    const flag = cmd === "head" ? "-First" : "-Last";
    const targetArgs = roleTokens.slice(1).filter((t) => {
      if (t.role === "flag") return false;
      if (t.value === String(count)) return false;
      return true;
    }).map((t) => t.value);
    const psCmd = `Select-Object ${flag} ${count}`;
    return smartJoinEnhanced([psCmd, ...targetArgs]);
  }
  if (cmd === "wc" && tokens.length >= 2 && tokens[1] === "-l") {
    const restArgs = tokens.slice(2);
    return smartJoinEnhanced(["Measure-Object -Line", ...restArgs]);
  }
  if (cmd === "sleep" && tokens.length >= 2) {
    const duration = tokens[1];
    if (/^\d+$/.test(duration)) {
      return `Start-Sleep ${duration}`;
    }
  }
  if (cmd === "whoami") {
    return "$env:USERNAME";
  }
  if (cmd === "sed" && tokens.length >= 2) {
    const script = tokens[1];
    const unq = script.startsWith("'") || script.startsWith('"') ? script.slice(1, -1) : script;
    if (unq.startsWith("s")) {
      const delim = unq[1];
      const parts = unq.slice(2).split(delim);
      if (parts.length >= 2) {
        const pattern = parts[0];
        const replacement = parts[1];
        const restArgs = tokens.slice(2);
        const psPart = `-replace '${pattern}','${replacement}'`;
        return smartJoinEnhanced([psPart, ...restArgs]);
      }
    }
    if (tokens.length >= 3 && tokens[1] === "-n") {
      const scriptTok = tokens[2];
      const uq = scriptTok.startsWith("'") || scriptTok.startsWith('"') ? scriptTok.slice(1, -1) : scriptTok;
      const mLine = uq.match(/^(\d+)p$/);
      if (mLine) {
        const idx = parseInt(mLine[1], 10) - 1;
        if (idx >= 0) {
          const restArgs = tokens.slice(3);
          const psPart = `Select-Object -Index ${idx}`;
          return smartJoinEnhanced([psPart, ...restArgs]);
        }
      }
    }
  }
  if (cmd === "awk" && tokens.length >= 2) {
    const scriptTok = tokens[1];
    const unq = scriptTok.startsWith("'") || scriptTok.startsWith('"') ? scriptTok.slice(1, -1) : scriptTok;
    const m = unq.match(/^\{\s*print\s+\$(\d+)\s*\}$/);
    if (m) {
      const fieldIdx = parseInt(m[1], 10);
      if (!isNaN(fieldIdx) && fieldIdx >= 1) {
        const zeroBased = fieldIdx - 1;
        const restArgs = tokens.slice(2);
        const psPart = `ForEach-Object { $_.Split()[${zeroBased}] }`;
        return smartJoinEnhanced([psPart, ...restArgs]);
      }
    }
  }
  if (cmd === "cut") {
    let delim;
    let fieldNum;
    const otherArgs = [];
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === "-d" && i + 1 < tokens.length) {
        delim = tokens[i + 1];
        i++;
        continue;
      }
      if (tok.startsWith("-d") && tok.length > 2) {
        delim = tok.slice(2);
        continue;
      }
      if (tok === "-f" && i + 1 < tokens.length) {
        const val = parseInt(tokens[i + 1], 10);
        if (!isNaN(val)) fieldNum = val;
        i++;
        continue;
      }
      if (tok.startsWith("-f") && tok.length > 2) {
        const val = parseInt(tok.slice(2), 10);
        if (!isNaN(val)) fieldNum = val;
        continue;
      }
      otherArgs.push(tok);
    }
    if (fieldNum !== void 0) {
      const fieldIdx = fieldNum - 1;
      const delimExpr = delim ? delim.replace(/^['"]|['"]$/g, "") : "	";
      const psPart = `ForEach-Object { $_.Split('${delimExpr}')[${fieldIdx}] }`;
      return smartJoinEnhanced([psPart, ...otherArgs]);
    }
  }
  if (cmd === "tr" && tokens.length >= 3) {
    const fromTok = tokens[1];
    const toTok = tokens[2];
    const stripQuote = (s) => s.startsWith("'") || s.startsWith('"') ? s.slice(1, -1) : s;
    const from = stripQuote(fromTok);
    const to = stripQuote(toTok);
    if (from.length === to.length && from.length === 1) {
      const psPart = `ForEach-Object { $_.Replace('${from}','${to}') }`;
      const rest = tokens.slice(3);
      return smartJoinEnhanced([psPart, ...rest]);
    }
    if (from.length === to.length) {
      const psPart = `ForEach-Object { $_ -replace '[${from}]','${to.length === 1 ? to : `[${to}]`}' }`;
      const rest = tokens.slice(3);
      return smartJoinEnhanced([psPart, ...rest]);
    }
  }
  if (cmd === "uniq" && earlyFlagTokens.includes("-c")) {
    const restArgs = earlyArgTokens;
    const psPart = 'Group-Object | ForEach-Object { "$($_.Count) $($_.Name)" }';
    return smartJoinEnhanced([psPart, ...restArgs]);
  }
  if (cmd === "sort" && earlyFlagTokens.includes("-n")) {
    const restArgs = earlyArgTokens;
    const psPart = "Sort-Object { [double]$_ }";
    return smartJoinEnhanced([psPart, ...restArgs]);
  }
  if (cmd === "find") {
    let pathArg;
    let filterPattern;
    let wantDelete = false;
    let wantExecEcho = false;
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (!tok.startsWith("-")) {
        if (!pathArg) {
          pathArg = tok;
        }
        continue;
      }
      if (tok === "-name" && i + 1 < tokens.length) {
        filterPattern = tokens[i + 1];
        i++;
        continue;
      }
      if (tok === "-delete") {
        wantDelete = true;
        continue;
      }
      if (tok === "-exec" && i + 2 < tokens.length && tokens[i + 1] === "echo") {
        wantExecEcho = true;
        while (i + 1 < tokens.length && tokens[i + 1] !== ";" && tokens[i + 1] !== "\\;") {
          i++;
        }
        continue;
      }
    }
    const parts = ["Get-ChildItem", pathArg ?? "", "-Recurse"].filter(Boolean);
    if (filterPattern) {
      const unq = filterPattern.replace(/^['\"]|['\"]$/g, "");
      parts.push("-Filter", unq);
    }
    let pipeline = parts.join(" ");
    if (wantDelete) {
      pipeline += " | Remove-Item";
      return pipeline;
    }
    if (wantExecEcho) {
      pipeline += " | ForEach-Object { echo $_ }";
      return pipeline;
    }
  }
  if (cmd === "xargs") {
    let idx = 1;
    const flagZero = tokens[1] === "-0";
    if (flagZero) idx = 2;
    const subCmd = tokens[idx];
    if (!subCmd) return segment;
    const subArgs = tokens.slice(idx + 1);
    const psCmd = ["ForEach-Object {", subCmd, ...subArgs, "$_", "}"];
    return smartJoinEnhanced(psCmd);
  }
  const mapping = [...BASE_MAPPINGS, ...EXTRA_MAPPINGS].find((m) => m.unix === cmd);
  if (!mapping) return segment;
  const flagTokens = earlyFlagTokens;
  const argTokens = earlyArgTokens;
  let psFlags = "";
  for (const flagTok of flagTokens) {
    const mapped = mapping.flagMap[flagTok];
    if (mapped !== void 0) {
      if (mapped) psFlags += " " + mapped;
    } else {
      return segment;
    }
  }
  if (mapping.forceArgs && argTokens.length === 0) {
    return segment;
  }
  const psCommand = `${mapping.ps}${psFlags}`.trim();
  return smartJoinEnhanced([psCommand, ...argTokens]);
}
var RM_MAPPING, MKDIR_MAPPING, LS_MAPPING, CP_MAPPING, MV_MAPPING, TOUCH_MAPPING, GREP_MAPPING, CAT_MAPPING, WHICH_MAPPING, SORT_MAPPING, UNIQ_MAPPING, FIND_MAPPING, PWD_MAPPING, DATE_MAPPING, CLEAR_MAPPING, PS_MAPPING, KILL_MAPPING, DF_MAPPING, HOSTNAME_MAPPING, DIRNAME_MAPPING, BASENAME_MAPPING, TEE_MAPPING, BASE_MAPPINGS, EXTRA_MAPPINGS, MAPPINGS, originalSmartJoin;
var init_unixMappings = __esm({
  "src/unixMappings.ts"() {
    "use strict";
    init_tokenize();
    RM_MAPPING = {
      unix: "rm",
      ps: "Remove-Item",
      flagMap: {
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force",
        "-r": "-Recurse",
        "-f": "-Force"
      },
      forceArgs: true
    };
    MKDIR_MAPPING = {
      unix: "mkdir",
      ps: "New-Item -ItemType Directory",
      flagMap: {
        "-p": "-Force"
      }
    };
    LS_MAPPING = {
      unix: "ls",
      ps: "Get-ChildItem",
      flagMap: {
        "-la": "-Force",
        "-al": "-Force",
        "-a": "-Force",
        "-l": ""
      }
    };
    CP_MAPPING = {
      unix: "cp",
      ps: "Copy-Item",
      flagMap: {
        "-r": "-Recurse",
        "-R": "-Recurse",
        "-f": "-Force",
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force"
      },
      forceArgs: true
    };
    MV_MAPPING = {
      unix: "mv",
      ps: "Move-Item",
      flagMap: {},
      forceArgs: true
    };
    TOUCH_MAPPING = {
      unix: "touch",
      ps: "New-Item -ItemType File",
      flagMap: {},
      forceArgs: true
    };
    GREP_MAPPING = {
      unix: "grep",
      ps: "Select-String",
      flagMap: {
        "-i": "-CaseSensitive:$false",
        "-n": "-LineNumber",
        "-in": "-CaseSensitive:$false -LineNumber",
        "-ni": "-CaseSensitive:$false -LineNumber",
        "-v": "-NotMatch",
        "-iv": "-CaseSensitive:$false -NotMatch",
        "-vn": "-CaseSensitive:$false -LineNumber",
        "-vni": "-CaseSensitive:$false -NotMatch -LineNumber",
        "-q": "-Quiet",
        "-iq": "-CaseSensitive:$false -Quiet",
        "-qi": "-CaseSensitive:$false -Quiet",
        "-E": "",
        "-F": "-SimpleMatch"
      },
      forceArgs: true
    };
    CAT_MAPPING = {
      unix: "cat",
      ps: "Get-Content",
      flagMap: {},
      forceArgs: true
    };
    WHICH_MAPPING = {
      unix: "which",
      ps: "Get-Command",
      flagMap: {},
      forceArgs: true
    };
    SORT_MAPPING = {
      unix: "sort",
      ps: "Sort-Object",
      flagMap: {},
      forceArgs: false
    };
    UNIQ_MAPPING = {
      unix: "uniq",
      ps: "Select-Object -Unique",
      flagMap: {},
      forceArgs: false
    };
    FIND_MAPPING = {
      unix: "find",
      ps: "Get-ChildItem -Recurse",
      flagMap: {
        "-name": "-Filter",
        // maps -name pattern
        "-type": ""
        // we ignore -type for now
      },
      forceArgs: true
    };
    PWD_MAPPING = {
      unix: "pwd",
      ps: "Get-Location",
      flagMap: {},
      forceArgs: false
    };
    DATE_MAPPING = {
      unix: "date",
      ps: "Get-Date",
      flagMap: {},
      forceArgs: false
    };
    CLEAR_MAPPING = {
      unix: "clear",
      ps: "Clear-Host",
      flagMap: {},
      forceArgs: false
    };
    PS_MAPPING = {
      unix: "ps",
      ps: "Get-Process",
      flagMap: {},
      forceArgs: false
    };
    KILL_MAPPING = {
      unix: "kill",
      ps: "Stop-Process",
      flagMap: {
        "-9": "-Force"
      },
      forceArgs: true
    };
    DF_MAPPING = {
      unix: "df",
      ps: "Get-PSDrive",
      flagMap: {
        "-h": ""
        // human-readable not needed
      },
      forceArgs: false
    };
    HOSTNAME_MAPPING = {
      unix: "hostname",
      ps: "$env:COMPUTERNAME",
      flagMap: {},
      forceArgs: false
    };
    DIRNAME_MAPPING = {
      unix: "dirname",
      ps: "Split-Path -Parent",
      flagMap: {},
      forceArgs: true
    };
    BASENAME_MAPPING = {
      unix: "basename",
      ps: "Split-Path -Leaf",
      flagMap: {},
      forceArgs: true
    };
    TEE_MAPPING = {
      unix: "tee",
      ps: "Tee-Object -FilePath",
      flagMap: {
        "-a": "-Append"
      },
      forceArgs: true
    };
    BASE_MAPPINGS = [
      RM_MAPPING,
      MKDIR_MAPPING,
      LS_MAPPING,
      CP_MAPPING,
      MV_MAPPING,
      TOUCH_MAPPING,
      GREP_MAPPING,
      CAT_MAPPING,
      WHICH_MAPPING,
      SORT_MAPPING,
      UNIQ_MAPPING,
      FIND_MAPPING,
      PWD_MAPPING,
      DATE_MAPPING,
      CLEAR_MAPPING,
      PS_MAPPING,
      KILL_MAPPING,
      DF_MAPPING,
      HOSTNAME_MAPPING,
      DIRNAME_MAPPING,
      BASENAME_MAPPING,
      TEE_MAPPING
    ];
    EXTRA_MAPPINGS = [];
    MAPPINGS = [...BASE_MAPPINGS, ...EXTRA_MAPPINGS];
    originalSmartJoin = smartJoin;
  }
});

// src/translate.ts
var translate_exports = {};
__export(translate_exports, {
  __test_splitByConnectors: () => splitByConnectors,
  detectShell: () => detectShell,
  lintCommand: () => lintCommand,
  translateCommand: () => translateCommand
});
function lintCommand(cmd) {
  const unsupported = [];
  const STATIC_ALLOWED_FLAGS = Object.fromEntries(
    MAPPINGS.map((m) => [m.unix, new Set(Object.keys(m.flagMap))])
  );
  const DYNAMIC_ALLOWED_FLAGS = {
    uniq: /* @__PURE__ */ new Set(["-c"]),
    sort: /* @__PURE__ */ new Set(["-n"]),
    cut: /* @__PURE__ */ new Set(["-d", "-f"]),
    tr: /* @__PURE__ */ new Set([]),
    find: /* @__PURE__ */ new Set(["-name", "-type", "-delete", "-exec"]),
    xargs: /* @__PURE__ */ new Set(["-0"]),
    sed: /* @__PURE__ */ new Set(["-n"])
  };
  const connectorParts = splitByConnectors(cmd).filter((p) => p !== "&&" && p !== "||");
  for (const part of connectorParts) {
    const pipeParts = splitByPipe(part);
    for (const seg of pipeParts) {
      const trimmed = seg.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("(") || trimmed.startsWith("{")) continue;
      const tokens = tagTokenRoles(tokenizeWithPos(trimmed));
      const cmdTok = tokens.find((t) => t.role === "cmd");
      if (!cmdTok) continue;
      const c = cmdTok.value;
      if (!SUPPORTED_COMMANDS.has(c)) {
        unsupported.push(`${trimmed} (unknown command)`);
        continue;
      }
      const allowedFlags = STATIC_ALLOWED_FLAGS[c] ?? DYNAMIC_ALLOWED_FLAGS[c];
      if (allowedFlags) {
        const flagToks = tokens.filter((t) => t.role === "flag");
        for (const fTok of flagToks) {
          if (!allowedFlags.has(fTok.value)) {
            unsupported.push(`${trimmed} (unsupported flag: ${fTok.value})`);
            break;
          }
        }
      }
    }
  }
  return { unsupported };
}
function debugLog(...args) {
  if (DEBUG) {
    console.log("[smartsh/sm debug]", ...args);
  }
}
function getPowerShellVersionSync() {
  const { execSync } = __require("child_process");
  const candidates = ["pwsh", "powershell"];
  for (const cmd of candidates) {
    try {
      const output = execSync(
        `${cmd} -NoProfile -Command "$PSVersionTable.PSVersion.Major"`,
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
          windowsHide: true,
          timeout: 3e3
        }
      ).trim();
      const major = parseInt(output, 10);
      if (!isNaN(major)) {
        debugLog(`Detected PowerShell version ${major} via '${cmd}'.`);
        return major;
      }
    } catch (err) {
      if ((err == null ? void 0 : err.code) !== "ENOENT" && DEBUG) {
        console.error("[smartsh debug]", `Failed to probe '${cmd}':`, err.message ?? err);
      }
    }
  }
  debugLog("Unable to determine PowerShell version.");
  return null;
}
function detectShell() {
  var _a2, _b;
  if (OVERRIDE_SHELL) {
    debugLog(`Using shell override: ${OVERRIDE_SHELL}`);
    if (OVERRIDE_SHELL === "powershell") {
      const version = getPowerShellVersionSync();
      return {
        type: "powershell",
        version,
        supportsConditionalConnectors: version !== null && version >= 7
      };
    }
    return {
      type: OVERRIDE_SHELL,
      supportsConditionalConnectors: true
    };
  }
  if (process.platform === "win32") {
    const isCmd = Boolean(process.env.PROMPT) && !process.env.PSModulePath;
    if (isCmd) {
      debugLog("Detected CMD via PROMPT env.");
      return { type: "cmd", supportsConditionalConnectors: true };
    }
    if (process.env.PSModulePath) {
      const version2 = getPowerShellVersionSync();
      return {
        type: "powershell",
        version: version2,
        supportsConditionalConnectors: version2 !== null && version2 >= 7
      };
    }
    const comspec = (_a2 = process.env.ComSpec) == null ? void 0 : _a2.toLowerCase();
    if (comspec == null ? void 0 : comspec.includes("cmd.exe")) {
      debugLog("Detected CMD via ComSpec path.");
      return { type: "cmd", supportsConditionalConnectors: true };
    }
    const shellEnv = (_b = process.env.SHELL) == null ? void 0 : _b.toLowerCase();
    if (shellEnv && shellEnv.includes("bash")) {
      debugLog("Detected Bash on Windows via SHELL env:", shellEnv);
      return { type: "bash", supportsConditionalConnectors: true };
    }
    const version = getPowerShellVersionSync();
    return {
      type: "powershell",
      version,
      supportsConditionalConnectors: version !== null && version >= 7
    };
  }
  const shellPath = process.env.SHELL;
  if (shellPath) {
    debugLog(`Detected Unix shell via SHELL env: ${shellPath}`);
  }
  return { type: "bash", supportsConditionalConnectors: true };
}
function translateCommand(command, shell) {
  if (shell.type === "powershell") {
    const parts = splitByConnectors(command).map((part) => {
      if (part === "&&" || part === "||") return part;
      const pipeParts = splitByPipe(part);
      const translatedPipeParts = pipeParts.map(translateSingleUnixSegment);
      return translatedPipeParts.join(" | ");
    });
    const unixTranslated = parts.join(" ");
    if (shell.supportsConditionalConnectors) {
      return unixTranslated;
    }
    return translateForLegacyPowerShell(unixTranslated);
  }
  return command;
}
function splitByConnectors(cmd) {
  const parts = [];
  const tokens = tokenizeWithPos(cmd);
  let segmentStart = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  for (const t of tokens) {
    if (t.value === "(") parenDepth++;
    else if (t.value === ")") parenDepth = Math.max(0, parenDepth - 1);
    else if (t.value === "{") braceDepth++;
    else if (t.value === "}") braceDepth = Math.max(0, braceDepth - 1);
    if (parenDepth === 0 && braceDepth === 0 && (t.value === "&&" || t.value === "||")) {
      const chunk = cmd.slice(segmentStart, t.start).trim();
      if (chunk) parts.push(chunk);
      parts.push(t.value);
      segmentStart = t.end;
    }
  }
  const last = cmd.slice(segmentStart).trim();
  if (last) parts.push(last);
  return parts;
}
function splitByPipe(segment) {
  const tokens = tokenizeWithPos(segment);
  const parts = [];
  let lastPos = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  for (const t of tokens) {
    if (t.value === "(") {
      parenDepth++;
    } else if (t.value === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (t.value === "{") {
      braceDepth++;
    } else if (t.value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
    }
    if (parenDepth === 0 && braceDepth === 0 && t.value === "|") {
      const chunk = segment.slice(lastPos, t.start).trim();
      if (chunk) parts.push(chunk);
      lastPos = t.end;
    }
  }
  const tail = segment.slice(lastPos).trim();
  if (tail) parts.push(tail);
  return parts;
}
function translateForLegacyPowerShell(command) {
  const tokens = splitByConnectors(command);
  if (tokens.length === 0) return command;
  let script = tokens[0];
  for (let i = 1; i < tokens.length; i += 2) {
    const connector = tokens[i];
    const nextCmd = tokens[i + 1];
    if (connector === "&&") {
      script += `; if ($?) { ${nextCmd} }`;
    } else {
      script += `; if (-not $?) { ${nextCmd} }`;
    }
  }
  return script;
}
var DYNAMIC_CMDS, SUPPORTED_COMMANDS, _a, OVERRIDE_SHELL, DEBUG;
var init_translate = __esm({
  "src/translate.ts"() {
    "use strict";
    init_unixMappings();
    init_tokenize();
    init_unixMappings();
    DYNAMIC_CMDS = [
      "head",
      "tail",
      "wc",
      "sleep",
      "whoami",
      "sed",
      "awk",
      "cut",
      "tr",
      "uniq",
      "sort",
      "find",
      "xargs",
      "echo"
    ];
    SUPPORTED_COMMANDS = /* @__PURE__ */ new Set([...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS]);
    OVERRIDE_SHELL = (_a = process.env.SMARTSH_SHELL) == null ? void 0 : _a.toLowerCase();
    DEBUG = process.env.SMARTSH_DEBUG === "1" || process.env.SMARTSH_DEBUG === "true";
  }
});

// src/config.ts
import fs from "fs";
import path from "path";
import os from "os";
function readJson(filePath) {
  try {
    const txt = fs.readFileSync(filePath, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
function initConfig() {
  const home = os.homedir();
  const candidates = [
    path.join(home, ".smartshrc"),
    path.join(home, ".smartshrc.json"),
    path.join(home, ".smartshrc.js"),
    path.join(home, ".smartshrc.cjs")
  ];
  let cfg = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      if (p.endsWith(".js") || p.endsWith(".cjs")) {
        try {
          const mod = __require(p);
          if (typeof mod === "function") {
            cfg = mod({ addExtraMappings });
          } else {
            cfg = mod;
          }
        } catch {
          cfg = null;
        }
      } else {
        cfg = readJson(p);
      }
      if (cfg) break;
    }
  }
  if ((cfg == null ? void 0 : cfg.mappings) && Array.isArray(cfg.mappings)) {
    addExtraMappings(cfg.mappings);
  }
}
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    init_unixMappings();
  }
});

// src/cli.ts
import { spawn } from "child_process";
var require_cli = __commonJS({
  "src/cli.ts"(exports, module) {
    init_translate();
    init_config();
    var TOOL_NAME = "smartsh";
    function runInShell(shellInfo, command) {
      if (shellInfo.type === "powershell") {
        const exe = shellInfo.version && shellInfo.version >= 7 ? "pwsh" : "powershell";
        const child2 = spawn(exe, ["-NoProfile", "-Command", command], {
          stdio: "inherit"
        });
        child2.on("error", (err) => {
          console.error(`${TOOL_NAME}: Failed to start command:`, err);
        });
        child2.on("exit", (code, signal) => {
          if (signal) process.kill(process.pid, signal);
          else process.exit(code ?? 0);
        });
        return;
      }
      let shellOption = true;
      if (shellInfo.type === "cmd") {
        shellOption = "cmd.exe";
      }
      const child = spawn(command, {
        shell: shellOption,
        stdio: "inherit"
      });
      child.on("error", (err) => {
        console.error(`${TOOL_NAME}: Failed to start command:`, err);
      });
      child.on("exit", (code, signal) => {
        if (signal) process.kill(process.pid, signal);
        else process.exit(code ?? 0);
      });
    }
    function main() {
      initConfig();
      const rawArgs = process.argv.slice(2);
      let translateOnly = false;
      const cmdParts = [];
      let i = 0;
      let lintOnly = false;
      let completionShell = null;
      for (; i < rawArgs.length; i++) {
        const arg = rawArgs[i];
        if (arg === "--translate-only" || arg === "-t") {
          translateOnly = true;
          continue;
        }
        if (arg === "--lint" || arg === "-l") {
          lintOnly = true;
          continue;
        }
        if (arg === "--debug" || arg === "-d") {
          process.env.SMARTSH_DEBUG = "1";
          continue;
        }
        if (arg.startsWith("--completion")) {
          if (arg.includes("=")) {
            completionShell = arg.split("=")[1];
          } else if (i + 1 < rawArgs.length) {
            completionShell = rawArgs[i + 1];
            i++;
          }
          continue;
        }
        cmdParts.push(arg);
      }
      if (completionShell) {
        const script = generateCompletionScript(completionShell);
        if (!script) {
          console.error(`${TOOL_NAME}: Unknown shell '${completionShell}'. Supported shells: bash, zsh, powershell`);
          process.exit(1);
        }
        console.log(script);
        process.exit(0);
      }
      if (cmdParts.length === 0) {
        console.error(
          `${TOOL_NAME}: No command provided. Usage: ${TOOL_NAME} [--translate-only] [--debug] "echo hello && echo world"`
        );
        process.exit(1);
      }
      const originalCommand = cmdParts.join(" ");
      const shellInfo = detectShell();
      if (lintOnly) {
        const { lintCommand: lintCommand2 } = (init_translate(), __toCommonJS(translate_exports));
        const res = lintCommand2(originalCommand);
        if (res.unsupported.length === 0) {
          console.log("\u2714 All segments are supported.");
          process.exit(0);
        }
        console.error("\u2716 Unsupported segments detected:");
        for (const seg of res.unsupported) {
          console.error("  -", seg);
        }
        process.exit(1);
      }
      const commandToRun = translateCommand(originalCommand, shellInfo);
      if (translateOnly) {
        console.log(commandToRun);
        return;
      }
      runInShell(shellInfo, commandToRun);
    }
    function generateCompletionScript(shell) {
      const flags = [
        "--translate-only",
        "-t",
        "--lint",
        "-l",
        "--debug",
        "-d",
        "--completion"
      ];
      switch (shell) {
        case "bash":
          return `# bash completion for smartsh
_smartsh_complete() {
  local cur="\${COMP_WORDS[COMP_CWORD]}"
  local opts="${flags.join(" ")}"
  COMPREPLY=( $(compgen -W "$opts" -- $cur) )
  return 0
}
complete -F _smartsh_complete smartsh sm`;
        case "zsh":
          return `#compdef smartsh sm
_arguments '*::options:->options'
case $state in
  options)
    local opts=(
      '--translate-only[Translate but do not execute]'
      '-t[Translate but do not execute]'
      '--lint[Lint command for unsupported segments]'
      '-l[Lint command]'
      '--debug[Enable debug output]'
      '-d[Enable debug output]'
      '--completion=[Generate completion script]:shell:(bash zsh powershell)'
    )
    _describe 'options' opts
  ;;
esac`;
        case "powershell":
        case "pwsh":
          return `# PowerShell completion for smartsh
Register-ArgumentCompleter -CommandName smartsh, sm -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    $opts = ${flags.map((f) => `'${f}'`).join(", ")}
    $opts | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterName', $_)
    }
}`;
        default:
          return null;
      }
    }
    if (__require.main === module) {
      main();
    }
  }
});
export default require_cli();
