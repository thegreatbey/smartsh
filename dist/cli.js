#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/tokenize.ts
function tokenizeWithPos(cmd) {
  const tokens = [];
  let i = 0;
  while (i < cmd.length) {
    while (i < cmd.length && /\s/.test(cmd[i])) {
      i++;
    }
    if (i >= cmd.length) break;
    const start = i;
    let value = "";
    let quoteType = void 0;
    if (cmd[i] === "'" || cmd[i] === '"') {
      quoteType = cmd[i];
      const quoteChar = cmd[i];
      value = cmd[i];
      i++;
      while (i < cmd.length && cmd[i] !== quoteChar) {
        value += cmd[i];
        i++;
      }
      if (i < cmd.length) {
        value += cmd[i];
        i++;
      }
    } else if (cmd[i] === "\\" && i + 1 < cmd.length && isOperatorStart(cmd[i + 1])) {
      value = cmd[i] + cmd[i + 1];
      i += 2;
    } else if (cmd[i] === "`" && i + 1 < cmd.length && isOperatorStart(cmd[i + 1])) {
      if (cmd[i + 1] === "&" && i + 2 < cmd.length && cmd[i + 2] === "`" && i + 3 < cmd.length && cmd[i + 3] === "&") {
        value = cmd[i] + cmd[i + 1] + cmd[i + 2] + cmd[i + 3];
        i += 4;
      } else if (cmd[i + 1] === "|" && i + 2 < cmd.length && cmd[i + 2] === "`" && i + 3 < cmd.length && cmd[i + 3] === "|") {
        value = cmd[i] + cmd[i + 1] + cmd[i + 2] + cmd[i + 3];
        i += 4;
      } else {
        value = cmd[i] + cmd[i + 1];
        i += 2;
      }
    } else if (isOperator(cmd, i)) {
      const op = extractOperator(cmd, i);
      value = op;
      i += op.length;
    } else {
      while (i < cmd.length && !/\s/.test(cmd[i]) && !isOperatorStart(cmd[i])) {
        value += cmd[i];
        i++;
      }
    }
    if (i === start) {
      value = cmd[i];
      i++;
    }
    if (value) {
      tokens.push({
        value,
        start,
        end: i,
        quoteType
      });
    }
  }
  return tokens;
}
function isOperatorStart(char) {
  return ["<", ">", "|", "&", ";", "(", ")", "{", "}"].includes(char);
}
function isOperator(cmd, pos) {
  const operators = ["&&", "||", "|&", "<<", ">>", "|", ";", "<", ">", "(", ")", "{", "}"];
  for (const op of operators) {
    if (cmd.substring(pos, pos + op.length) === op) {
      return true;
    }
  }
  return false;
}
function extractOperator(cmd, pos) {
  const operators = ["&&", "||", "|&", "<<", ">>", "|", ";", "<", ">", "(", ")", "{", "}"];
  for (const op of operators) {
    if (cmd.substring(pos, pos + op.length) === op) {
      return op;
    }
  }
  return cmd[pos];
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
      let braceDepth = 1;
      while (braceDepth > 0 && j + 1 < tokens.length) {
        j++;
        const token = tokens[j];
        combined += token;
        for (const char of token) {
          if (char === "{") braceDepth++;
          if (char === "}") braceDepth--;
        }
      }
      out.push(combined);
      i = j;
      continue;
    }
    if (tokens[i].startsWith("${")) {
      let combined = tokens[i];
      let j = i;
      let braceDepth = 1;
      for (const char of combined) {
        if (char === "{") braceDepth++;
        if (char === "}") braceDepth--;
      }
      while (braceDepth > 0 && j + 1 < tokens.length) {
        j++;
        const token = tokens[j];
        combined += token;
        for (const char of token) {
          if (char === "{") braceDepth++;
          if (char === "}") braceDepth--;
        }
      }
      out.push(combined);
      i = j;
      continue;
    }
    out.push(tokens[i]);
  }
  return out;
}
function mergeHereDocs(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "<" && i + 1 < tokens.length && tokens[i + 1] === "<") {
      let combined = tokens[i] + tokens[i + 1];
      let j = i + 1;
      if (j + 1 < tokens.length) {
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
function mergeProcessSubs(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === "<" && i + 1 < tokens.length && tokens[i + 1] === "(") {
      let combined = tokens[i] + tokens[i + 1];
      let j = i + 1;
      let parenDepth = 1;
      while (parenDepth > 0 && j + 1 < tokens.length) {
        j++;
        const token = tokens[j];
        combined += token;
        for (const char of token) {
          if (char === "(") parenDepth++;
          if (char === ")") parenDepth--;
        }
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
  const mergedSubs = mergeProcessSubs(mergeHereDocs(mergeCommandSubs(mergeEnvExp(tokens))));
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
  if (cmd === "rsync") {
    const hasArchive = earlyFlagTokens.includes("-a") || earlyFlagTokens.includes("-av");
    const hasVerbose = earlyFlagTokens.includes("-v");
    const hasRecurse = earlyFlagTokens.includes("-r");
    if (hasArchive || hasRecurse) {
      const targetArgs = earlyArgTokens;
      return smartJoinEnhanced(["Copy-Item", "-Recurse", ...targetArgs]);
    }
    return segment;
  }
  if (cmd === "du") {
    const hasHuman = earlyFlagTokens.includes("-h");
    const hasSummarize = earlyFlagTokens.includes("-s");
    const targetArgs = earlyArgTokens;
    if (hasSummarize) {
      return smartJoinEnhanced([
        "Get-ChildItem",
        "-Recurse",
        ...targetArgs,
        "|",
        "Measure-Object",
        "-Property",
        "Length",
        "-Sum"
      ]);
    } else if (hasHuman) {
      return smartJoinEnhanced([
        "Get-Item",
        ...targetArgs,
        "|",
        "Select-Object",
        "Name,",
        "@{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}}"
      ]);
    }
    return smartJoinEnhanced(["Get-ChildItem", "-Recurse", ...targetArgs, "|", "Measure-Object", "-Property", "Length", "-Sum"]);
  }
  if (cmd === "systemctl" && tokens.length >= 2) {
    const action = tokens[1];
    const serviceName = tokens[2];
    switch (action) {
      case "start":
        return smartJoinEnhanced(["Start-Service", serviceName]);
      case "stop":
        return smartJoinEnhanced(["Stop-Service", serviceName]);
      case "restart":
        return smartJoinEnhanced(["Restart-Service", serviceName]);
      case "status":
        return smartJoinEnhanced(["Get-Service", serviceName]);
      case "enable":
        return smartJoinEnhanced(["Set-Service", "-Name", serviceName, "-StartupType", "Automatic"]);
      case "disable":
        return smartJoinEnhanced(["Set-Service", "-Name", serviceName, "-StartupType", "Disabled"]);
      case "reload":
        return smartJoinEnhanced(["Restart-Service", serviceName]);
      default:
        return segment;
    }
  }
  if (cmd === "chmod") {
    const mode = tokens[1];
    const targetArgs = earlyArgTokens;
    if (mode && /^\d{3,4}$/.test(mode)) {
      const permissions = mode.slice(-3);
      const owner = permissions[0];
      const group = permissions[1];
      const other = permissions[2];
      let icaclsPerms = "";
      if (owner >= "7") icaclsPerms += "F";
      else if (owner >= "6") icaclsPerms += "M";
      else if (owner >= "4") icaclsPerms += "R";
      else if (owner >= "2") icaclsPerms += "W";
      else if (owner >= "1") icaclsPerms += "X";
      return smartJoinEnhanced(["icacls", ...targetArgs, "/grant", "Everyone:" + icaclsPerms]);
    }
    return segment;
  }
  if (cmd === "chown") {
    const owner = tokens[1];
    const targetArgs = earlyArgTokens;
    if (owner && owner.includes(":")) {
      const [user, group] = owner.split(":");
      return smartJoinEnhanced(["icacls", ...targetArgs, "/setowner", user]);
    } else if (owner) {
      return smartJoinEnhanced(["icacls", ...targetArgs, "/setowner", owner]);
    }
    return segment;
  }
  if (cmd === "ln") {
    const hasSymbolic = earlyFlagTokens.includes("-s");
    const targetArgs = earlyArgTokens;
    if (hasSymbolic) {
      return smartJoinEnhanced(["New-Item", "-ItemType", "SymbolicLink", "-Target", targetArgs[0], "-Name", targetArgs[1]]);
    } else {
      return smartJoinEnhanced(["New-Item", "-ItemType", "HardLink", "-Target", targetArgs[0], "-Name", targetArgs[1]]);
    }
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
    const stripQuote2 = (s) => s.startsWith("'") || s.startsWith('"') ? s.slice(1, -1) : s;
    const from = stripQuote2(fromTok);
    const to = stripQuote2(toTok);
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
  if (cmd === "less" || cmd === "more") {
    const restArgs = earlyArgTokens;
    const hasLineNumbers = earlyFlagTokens.includes("-N");
    const psPart = hasLineNumbers ? 'Get-Content | ForEach-Object { $i++; "$i`t$_" } | Out-Host -Paging' : "Get-Content | Out-Host -Paging";
    return smartJoinEnhanced([psPart, ...restArgs]);
  }
  if (cmd === "ping") {
    const target = earlyArgTokens[0];
    if (!target) return segment;
    const count = earlyFlagTokens.includes("-c") ? tokens[tokens.indexOf("-c") + 1] || "4" : "4";
    const interval = earlyFlagTokens.includes("-i") ? tokens[tokens.indexOf("-i") + 1] || "1" : "1";
    return `Test-Connection -ComputerName ${target} -Count ${count} -Delay ${interval}`;
  }
  if (cmd === "top") {
    const count = earlyFlagTokens.includes("-n") ? tokens[tokens.indexOf("-n") + 1] || "20" : "20";
    const processId = earlyFlagTokens.includes("-p") ? tokens[tokens.indexOf("-p") + 1] : void 0;
    if (processId) {
      return `Get-Process -Id ${processId} | Select-Object Id,ProcessName,CPU,WorkingSet,PrivateMemorySize`;
    } else {
      return `Get-Process | Sort-Object CPU -Descending | Select-Object -First ${count} | Format-Table Id,ProcessName,CPU,WorkingSet,PrivateMemorySize -AutoSize`;
    }
  }
  if (cmd === "rmdir") {
    const hasRecurse = earlyFlagTokens.includes("-p");
    const hasVerbose = earlyFlagTokens.includes("-v");
    const targetArgs = earlyArgTokens;
    if (hasRecurse) {
      return smartJoinEnhanced(["Remove-Item", "-Directory", "-Recurse", ...targetArgs]);
    } else {
      return smartJoinEnhanced(["Remove-Item", "-Directory", ...targetArgs]);
    }
  }
  if (cmd === "uptime") {
    return '(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | ForEach-Object { "Uptime: $($_.Days) days, $($_.Hours) hours, $($_.Minutes) minutes" }';
  }
  if (cmd === "free") {
    const isHumanReadable = earlyFlagTokens.includes("-h");
    const isMB = earlyFlagTokens.includes("-m");
    if (isHumanReadable || isMB) {
      return `Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | ForEach-Object { "Available Memory: $([math]::Round($_.CookedValue, 2)) MB" }`;
    } else {
      return "Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | Select-Object InstanceName,CookedValue";
    }
  }
  if (cmd === "nl") {
    const restArgs = earlyArgTokens;
    if (restArgs.length > 0) {
      return `Get-Content ${restArgs.join(" ")} | ForEach-Object { $i++; "$i	$_" }`;
    } else {
      return 'Get-Content | ForEach-Object { $i++; "$i	$_" }';
    }
  }
  if (cmd === "sudo") {
    const restArgs = earlyArgTokens;
    if (restArgs.length > 0) {
      const subCommand = restArgs[0];
      const subArgs = restArgs.slice(1);
      const translatedSubCommand = translateSingleUnixSegment([subCommand, ...subArgs].join(" "));
      return `Start-Process powershell -Verb RunAs -ArgumentList "-Command", "${translatedSubCommand}"`;
    }
    return segment;
  }
  if (cmd === "netstat") {
    const hasListen = earlyFlagTokens.includes("-l") || earlyFlagTokens.includes("-a");
    const hasNumeric = earlyFlagTokens.includes("-n");
    if (hasListen) {
      return "Get-NetTCPConnection -State Listen | Format-Table LocalAddress,LocalPort,RemoteAddress,RemotePort,State -AutoSize";
    } else if (hasNumeric) {
      return "Get-NetTCPConnection | Format-Table LocalAddress,LocalPort,RemoteAddress,RemotePort,State -AutoSize";
    } else {
      return "Get-NetTCPConnection | Select-Object -First 20 | Format-Table LocalAddress,LocalPort,RemoteAddress,RemotePort,State -AutoSize";
    }
  }
  if (cmd === "gzip") {
    const hasDecompress = earlyFlagTokens.includes("-d");
    const hasRecurse = earlyFlagTokens.includes("-r");
    const hasForce = earlyFlagTokens.includes("-f");
    const targetArgs = earlyArgTokens;
    if (hasDecompress) {
      if (targetArgs.length > 0) {
        return `Expand-Archive -Path ${targetArgs.join(" ")} -DestinationPath . -Force`;
      }
    } else {
      if (targetArgs.length > 0) {
        const forceFlag = hasForce ? "-Force" : "";
        return `Compress-Archive -Path ${targetArgs.join(" ")} -DestinationPath ${targetArgs[0]}.zip ${forceFlag}`;
      }
    }
  }
  if (cmd === "gunzip") {
    const hasForce = earlyFlagTokens.includes("-f");
    const hasList = earlyFlagTokens.includes("-l");
    const targetArgs = earlyArgTokens;
    if (hasList) {
      return `Get-ChildItem ${targetArgs.join(" ")} | ForEach-Object { Write-Host "Archive: $($_.Name)" }`;
    } else if (targetArgs.length > 0) {
      const forceFlag = hasForce ? "-Force" : "";
      return `Expand-Archive -Path ${targetArgs.join(" ")} -DestinationPath . ${forceFlag}`;
    }
  }
  if (cmd === "mktemp") {
    const hasDirectory = earlyFlagTokens.includes("-d");
    const targetArgs = earlyArgTokens;
    if (hasDirectory) {
      return `New-Item -ItemType Directory -Path $env:TEMP -Name ([System.IO.Path]::GetRandomFileName())`;
    } else {
      return `New-TemporaryFile`;
    }
  }
  if (cmd === "dig") {
    const hasShort = earlyFlagTokens.includes("+short");
    const hasTrace = earlyFlagTokens.includes("+trace");
    const hasReverse = earlyFlagTokens.includes("-x");
    const targetArgs = earlyArgTokens;
    if (hasShort && targetArgs.length > 0) {
      return `Resolve-DnsName ${targetArgs[0]} -Type A | Select-Object -ExpandProperty IPAddress`;
    } else if (hasTrace && targetArgs.length > 0) {
      return `Resolve-DnsName ${targetArgs[0]} -Type NS`;
    } else if (hasReverse && targetArgs.length > 0) {
      return `Resolve-DnsName ${targetArgs[0]} -Type PTR`;
    } else if (targetArgs.length > 0) {
      return `Resolve-DnsName ${targetArgs[0]}`;
    }
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
  const stripQuote = (s) => s.startsWith("'") || s.startsWith('"') ? s.slice(1, -1) : s;
  const processedArgTokens = argTokens.map(stripQuote);
  const psCommand = `${mapping.ps}${psFlags}`.trim();
  return smartJoinEnhanced([psCommand, ...processedArgTokens]);
}
var RM_MAPPING, MKDIR_MAPPING, LS_MAPPING, CP_MAPPING, MV_MAPPING, TOUCH_MAPPING, GREP_MAPPING, CAT_MAPPING, WHICH_MAPPING, SORT_MAPPING, UNIQ_MAPPING, FIND_MAPPING, PWD_MAPPING, DATE_MAPPING, CLEAR_MAPPING, PS_MAPPING, KILL_MAPPING, DF_MAPPING, HOSTNAME_MAPPING, DIRNAME_MAPPING, BASENAME_MAPPING, TEE_MAPPING, TAR_MAPPING, CURL_MAPPING, WGET_MAPPING, DIFF_MAPPING, SPLIT_MAPPING, PASTE_MAPPING, RSYNC_MAPPING, CHMOD_MAPPING, CHOWN_MAPPING, LN_MAPPING, DU_MAPPING, SYSTEMCTL_MAPPING, LESS_MAPPING, MORE_MAPPING, PING_MAPPING, TOP_MAPPING, RMDIR_MAPPING, UPTIME_MAPPING, FREE_MAPPING, NETSTAT_MAPPING, SSH_MAPPING, GZIP_MAPPING, GUNZIP_MAPPING, JOBS_MAPPING, BG_MAPPING, FG_MAPPING, NICE_MAPPING, NOHUP_MAPPING, CHGRP_MAPPING, UMASK_MAPPING, MKTEMP_MAPPING, REALPATH_MAPPING, JOIN_MAPPING, COMM_MAPPING, EXPAND_MAPPING, UNEXPAND_MAPPING, FOLD_MAPPING, FMT_MAPPING, TELNET_MAPPING, NC_MAPPING, DIG_MAPPING, NSLOOKUP_MAPPING, MAKE_MAPPING, GCC_MAPPING, GPP_MAPPING, GIT_MAPPING, APT_MAPPING, APT_GET_MAPPING, YUM_MAPPING, DNF_MAPPING, BREW_MAPPING, UNAME_MAPPING, ID_MAPPING, GROUPS_MAPPING, WHO_MAPPING, W_MAPPING, REV_MAPPING, TAC_MAPPING, COLUMN_MAPPING, PR_MAPPING, CSPLIT_MAPPING, TSORT_MAPPING, SHUTDOWN_MAPPING, REBOOT_MAPPING, HALT_MAPPING, POWEROFF_MAPPING, USERADD_MAPPING, USERDEL_MAPPING, PASSWD_MAPPING, SU_MAPPING, SUDO_MAPPING, BASE_MAPPINGS, EXTRA_MAPPINGS, MAPPINGS, originalSmartJoin;
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
        "-type": "",
        // we ignore -type for now
        "-delete": ""
        // handled specially in translation logic
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
    TAR_MAPPING = {
      unix: "tar",
      ps: "tar",
      // Use native tar if available, otherwise preserve
      flagMap: {
        "-c": "-c",
        "-x": "-x",
        "-f": "-f",
        "-z": "-z",
        "-j": "-j",
        "-v": "-v",
        "-t": "-t"
      },
      forceArgs: true
    };
    CURL_MAPPING = {
      unix: "curl",
      ps: "Invoke-WebRequest",
      flagMap: {
        "-o": "-OutFile",
        "-O": "-OutFile",
        "-s": "-UseBasicParsing",
        "-L": "-MaximumRedirection",
        "-H": "-Headers",
        "-d": "-Body",
        "-X": "-Method",
        "-k": "-SkipCertificateCheck"
      },
      forceArgs: true
    };
    WGET_MAPPING = {
      unix: "wget",
      ps: "Invoke-WebRequest",
      flagMap: {
        "-O": "-OutFile",
        "-o": "-OutFile",
        "-q": "-UseBasicParsing",
        "-c": "-Resume",
        "-r": "-Recurse",
        "-np": "-NoParent",
        "-k": "-ConvertLinks"
      },
      forceArgs: true
    };
    DIFF_MAPPING = {
      unix: "diff",
      ps: "Compare-Object",
      flagMap: {
        "-u": "-Unified",
        "-r": "-Recurse",
        "-i": "-CaseInsensitive",
        "-w": "-IgnoreWhiteSpace",
        "-B": "-IgnoreBlankLines"
      },
      forceArgs: true
    };
    SPLIT_MAPPING = {
      unix: "split",
      ps: "Split-Content",
      flagMap: {
        "-l": "-LineCount",
        "-b": "-ByteCount",
        "-n": "-Number"
      },
      forceArgs: true
    };
    PASTE_MAPPING = {
      unix: "paste",
      ps: "Join-Object",
      flagMap: {
        "-d": "-Delimiter",
        "-s": "-Serial"
      },
      forceArgs: true
    };
    RSYNC_MAPPING = {
      unix: "rsync",
      ps: "Copy-Item",
      flagMap: {
        "-a": "-Recurse",
        // archive mode (recursive + preserve attributes)
        "-v": "-Verbose",
        // verbose
        "-r": "-Recurse",
        // recursive
        "-u": "-Force",
        // update (skip newer files)
        "-n": "-WhatIf",
        // dry run
        "-P": "-PassThru"
        // progress + partial
      },
      forceArgs: true
    };
    CHMOD_MAPPING = {
      unix: "chmod",
      ps: "icacls",
      flagMap: {
        "-R": "/T",
        // recursive
        "-v": "/Q"
        // verbose (quiet in icacls)
      },
      forceArgs: true
    };
    CHOWN_MAPPING = {
      unix: "chown",
      ps: "icacls",
      flagMap: {
        "-R": "/T",
        // recursive
        "-v": "/Q"
        // verbose (quiet in icacls)
      },
      forceArgs: true
    };
    LN_MAPPING = {
      unix: "ln",
      ps: "New-Item",
      flagMap: {
        "-s": "-ItemType SymbolicLink",
        // symbolic link
        "-f": "-Force",
        // force
        "-v": "-Verbose"
        // verbose
      },
      forceArgs: true
    };
    DU_MAPPING = {
      unix: "du",
      ps: "Get-ChildItem",
      flagMap: {
        "-h": "-Recurse",
        // human readable (handled in translation)
        "-s": "-Recurse",
        // summarize
        "-a": "-Recurse",
        // all files
        "-c": "-Recurse"
        // total
      },
      forceArgs: true
    };
    SYSTEMCTL_MAPPING = {
      unix: "systemctl",
      ps: "Get-Service",
      // default fallback
      flagMap: {
        "start": "Start-Service",
        "stop": "Stop-Service",
        "restart": "Restart-Service",
        "status": "Get-Service",
        "enable": "Set-Service -StartupType Automatic",
        "disable": "Set-Service -StartupType Disabled",
        "reload": "Restart-Service"
      },
      forceArgs: true
    };
    LESS_MAPPING = {
      unix: "less",
      ps: "Get-Content | Out-Host -Paging",
      flagMap: {
        "-N": "-LineNumber",
        "-M": "",
        // show more info (handled in translation)
        "-R": ""
        // raw control chars (handled in translation)
      },
      forceArgs: false
    };
    MORE_MAPPING = {
      unix: "more",
      ps: "Get-Content | Out-Host -Paging",
      flagMap: {
        "-N": "-LineNumber",
        "-c": "",
        // clear screen (handled in translation)
        "-p": ""
        // pattern search (handled in translation)
      },
      forceArgs: false
    };
    PING_MAPPING = {
      unix: "ping",
      ps: "Test-Connection",
      flagMap: {
        "-c": "-Count",
        "-i": "-Interval",
        "-t": "-TimeoutSeconds",
        "-W": "-TimeoutSeconds",
        "-s": "-BufferSize",
        "-l": "-BufferSize"
      },
      forceArgs: true
    };
    TOP_MAPPING = {
      unix: "top",
      ps: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20",
      flagMap: {
        "-n": "-First",
        "-p": "-Id",
        "-u": "-IncludeUserName"
      },
      forceArgs: false
    };
    RMDIR_MAPPING = {
      unix: "rmdir",
      ps: "Remove-Item -Directory",
      flagMap: {
        "-p": "-Recurse",
        "-v": "-Verbose"
      },
      forceArgs: true
    };
    UPTIME_MAPPING = {
      unix: "uptime",
      ps: "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime",
      flagMap: {},
      forceArgs: false
    };
    FREE_MAPPING = {
      unix: "free",
      ps: "Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | Select-Object InstanceName,CookedValue",
      flagMap: {
        "-h": "",
        // human readable (handled in translation)
        "-m": ""
        // MB format (handled in translation)
      },
      forceArgs: false
    };
    NETSTAT_MAPPING = {
      unix: "netstat",
      ps: "Get-NetTCPConnection",
      flagMap: {
        "-t": "-State Listen",
        "-u": "-State Listen",
        "-l": "-State Listen",
        "-n": "-State Listen",
        "-a": "-State Listen",
        "-p": "-State Listen"
      },
      forceArgs: false
    };
    SSH_MAPPING = {
      unix: "ssh",
      ps: "ssh",
      flagMap: {
        "-p": "-p",
        "-i": "-i",
        "-o": "-o",
        "-L": "-L",
        "-D": "-D"
      },
      forceArgs: true
    };
    GZIP_MAPPING = {
      unix: "gzip",
      ps: "Compress-Archive",
      flagMap: {
        "-d": "-DestinationPath",
        "-r": "-Recurse",
        "-f": "-Force",
        "-v": "-Verbose"
      },
      forceArgs: false
    };
    GUNZIP_MAPPING = {
      unix: "gunzip",
      ps: "Expand-Archive",
      flagMap: {
        "-f": "-Force",
        "-v": "-Verbose",
        "-l": "-ListOnly"
      },
      forceArgs: false
    };
    JOBS_MAPPING = {
      unix: "jobs",
      ps: "Get-Job",
      flagMap: {
        "-l": "-IncludeChildJob",
        "-p": "-Id",
        "-r": "-State Running",
        "-s": "-State Stopped"
      },
      forceArgs: false
    };
    BG_MAPPING = {
      unix: "bg",
      ps: "Resume-Job",
      flagMap: {},
      forceArgs: false
    };
    FG_MAPPING = {
      unix: "fg",
      ps: "Receive-Job",
      flagMap: {},
      forceArgs: false
    };
    NICE_MAPPING = {
      unix: "nice",
      ps: "Start-Process",
      flagMap: {
        "-n": "-Priority"
      },
      forceArgs: true
    };
    NOHUP_MAPPING = {
      unix: "nohup",
      ps: "Start-Process",
      flagMap: {
        "-n": "-NoNewWindow"
      },
      forceArgs: true
    };
    CHGRP_MAPPING = {
      unix: "chgrp",
      ps: "icacls",
      flagMap: {
        "-R": "/T",
        "-v": "/Q"
      },
      forceArgs: true
    };
    UMASK_MAPPING = {
      unix: "umask",
      ps: "Get-ChildItem",
      flagMap: {
        "-S": ""
      },
      forceArgs: false
    };
    MKTEMP_MAPPING = {
      unix: "mktemp",
      ps: "New-TemporaryFile",
      flagMap: {
        "-d": "",
        "-u": ""
      },
      forceArgs: false
    };
    REALPATH_MAPPING = {
      unix: "realpath",
      ps: "Resolve-Path",
      flagMap: {
        "-q": "-Quiet",
        "-s": "-Relative"
      },
      forceArgs: true
    };
    JOIN_MAPPING = {
      unix: "join",
      ps: "Join-Object",
      flagMap: {
        "-1": "-JoinProperty",
        "-2": "-MergeProperty",
        "-t": "-Delimiter"
      },
      forceArgs: true
    };
    COMM_MAPPING = {
      unix: "comm",
      ps: "Compare-Object",
      flagMap: {
        "-1": "-IncludeEqual",
        "-2": "-IncludeEqual",
        "-3": "-IncludeEqual"
      },
      forceArgs: true
    };
    EXPAND_MAPPING = {
      unix: "expand",
      ps: "Get-Content",
      flagMap: {
        "-t": "-TabSize",
        "-i": "-Initial"
      },
      forceArgs: true
    };
    UNEXPAND_MAPPING = {
      unix: "unexpand",
      ps: "Get-Content",
      flagMap: {
        "-a": "-All",
        "-t": "-TabSize"
      },
      forceArgs: true
    };
    FOLD_MAPPING = {
      unix: "fold",
      ps: "Get-Content",
      flagMap: {
        "-b": "-Bytes",
        "-s": "-Spaces",
        "-w": "-Width"
      },
      forceArgs: true
    };
    FMT_MAPPING = {
      unix: "fmt",
      ps: "Get-Content",
      flagMap: {
        "-w": "-Width",
        "-g": "-Goal",
        "-p": "-Prefix"
      },
      forceArgs: true
    };
    TELNET_MAPPING = {
      unix: "telnet",
      ps: "Test-NetConnection",
      flagMap: {
        "-p": "-Port",
        "-l": "-LocalAddress"
      },
      forceArgs: true
    };
    NC_MAPPING = {
      unix: "nc",
      ps: "Test-NetConnection",
      flagMap: {
        "-v": "-Verbose",
        "-w": "-TimeoutSeconds",
        "-l": "-Listen",
        "-p": "-Port"
      },
      forceArgs: true
    };
    DIG_MAPPING = {
      unix: "dig",
      ps: "Resolve-DnsName",
      flagMap: {
        "+short": "-Type A",
        "+trace": "-Type NS",
        "-x": "-Type PTR"
      },
      forceArgs: true
    };
    NSLOOKUP_MAPPING = {
      unix: "nslookup",
      ps: "Resolve-DnsName",
      flagMap: {
        "-type": "-Type",
        "-port": "-Port"
      },
      forceArgs: true
    };
    MAKE_MAPPING = {
      unix: "make",
      ps: "make",
      flagMap: {
        "-j": "-j",
        "-f": "-f",
        "-C": "-C",
        "clean": "clean",
        "install": "install"
      },
      forceArgs: false
    };
    GCC_MAPPING = {
      unix: "gcc",
      ps: "gcc",
      flagMap: {
        "-o": "-o",
        "-c": "-c",
        "-g": "-g",
        "-Wall": "-Wall",
        "-std": "-std"
      },
      forceArgs: true
    };
    GPP_MAPPING = {
      unix: "g++",
      ps: "g++",
      flagMap: {
        "-o": "-o",
        "-c": "-c",
        "-g": "-g",
        "-Wall": "-Wall",
        "-std": "-std"
      },
      forceArgs: true
    };
    GIT_MAPPING = {
      unix: "git",
      ps: "git",
      flagMap: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "status": "status",
        "log": "log",
        "branch": "branch",
        "checkout": "checkout"
      },
      forceArgs: false
    };
    APT_MAPPING = {
      unix: "apt",
      ps: "winget",
      flagMap: {
        "install": "install",
        "remove": "uninstall",
        "update": "upgrade",
        "upgrade": "upgrade",
        "search": "search",
        "list": "list"
      },
      forceArgs: false
    };
    APT_GET_MAPPING = {
      unix: "apt-get",
      ps: "winget",
      flagMap: {
        "install": "install",
        "remove": "uninstall",
        "update": "upgrade",
        "upgrade": "upgrade",
        "search": "search",
        "list": "list"
      },
      forceArgs: false
    };
    YUM_MAPPING = {
      unix: "yum",
      ps: "winget",
      flagMap: {
        "install": "install",
        "remove": "uninstall",
        "update": "upgrade",
        "upgrade": "upgrade",
        "search": "search",
        "list": "list"
      },
      forceArgs: false
    };
    DNF_MAPPING = {
      unix: "dnf",
      ps: "winget",
      flagMap: {
        "install": "install",
        "remove": "uninstall",
        "update": "upgrade",
        "upgrade": "upgrade",
        "search": "search",
        "list": "list"
      },
      forceArgs: false
    };
    BREW_MAPPING = {
      unix: "brew",
      ps: "winget",
      flagMap: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "upgrade",
        "upgrade": "upgrade",
        "search": "search",
        "list": "list"
      },
      forceArgs: false
    };
    UNAME_MAPPING = {
      unix: "uname",
      ps: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory",
      flagMap: {
        "-a": "-a",
        "-r": "-r",
        "-m": "-m",
        "-n": "-n",
        "-p": "-p",
        "-s": "-s"
      },
      forceArgs: false
    };
    ID_MAPPING = {
      unix: "id",
      ps: "Get-Process -Id $PID | Select-Object ProcessName, Id, UserName",
      flagMap: {
        "-u": "-u",
        "-g": "-g",
        "-G": "-G",
        "-n": "-n",
        "-r": "-r"
      },
      forceArgs: false
    };
    GROUPS_MAPPING = {
      unix: "groups",
      ps: "Get-LocalGroup | Select-Object Name, Description",
      flagMap: {},
      forceArgs: false
    };
    WHO_MAPPING = {
      unix: "who",
      ps: "Get-Process | Where-Object {$_.ProcessName -like '*explorer*' -or $_.ProcessName -like '*winlogon*'} | Select-Object ProcessName, Id, UserName",
      flagMap: {
        "-a": "-a",
        "-b": "-b",
        "-d": "-d",
        "-H": "-H",
        "-i": "-i",
        "-l": "-l",
        "-p": "-p",
        "-r": "-r",
        "-t": "-t",
        "-u": "-u"
      },
      forceArgs: false
    };
    W_MAPPING = {
      unix: "w",
      ps: "Get-Process | Where-Object {$_.ProcessName -like '*explorer*' -or $_.ProcessName -like '*winlogon*'} | Select-Object ProcessName, Id, UserName, CPU, WorkingSet",
      flagMap: {
        "hide": "-h",
        "noheader": "-s",
        "short": "-s",
        "users": "-u"
      },
      forceArgs: false
    };
    REV_MAPPING = {
      unix: "rev",
      ps: "Get-Content $args | ForEach-Object { [string]::Join('', ($_.ToCharArray() | Sort-Object -Descending)) }",
      flagMap: {},
      forceArgs: false
    };
    TAC_MAPPING = {
      unix: "tac",
      ps: "Get-Content $args | Sort-Object -Descending",
      flagMap: {
        "before": "-b",
        "regex": "-r",
        "separator": "-s"
      },
      forceArgs: false
    };
    COLUMN_MAPPING = {
      unix: "column",
      ps: "Get-Content $args | Format-Table -AutoSize",
      flagMap: {
        "separator": "-s",
        "table": "-t",
        "width": "-w"
      },
      forceArgs: false
    };
    PR_MAPPING = {
      unix: "pr",
      ps: "Get-Content $args | Format-List",
      flagMap: {
        "columns": "-c",
        "double": "-d",
        "formfeed": "-f",
        "header": "-h",
        "length": "-l",
        "merge": "-m",
        "number": "-n",
        "output": "-o",
        "page": "-p",
        "separator": "-s",
        "width": "-w"
      },
      forceArgs: false
    };
    CSPLIT_MAPPING = {
      unix: "csplit",
      ps: 'Get-Content $args | ForEach-Object { if ($_ -match $pattern) { $i++; Set-Content "split$i.txt" -Value $_ } }',
      flagMap: {
        "prefix": "-f",
        "digits": "-n",
        "keep": "-k",
        "quiet": "-q",
        "suppress": "-s"
      },
      forceArgs: false
    };
    TSORT_MAPPING = {
      unix: "tsort",
      ps: "Get-Content $args | Sort-Object",
      flagMap: {},
      forceArgs: false
    };
    SHUTDOWN_MAPPING = {
      unix: "shutdown",
      ps: "Stop-Computer",
      flagMap: {
        "halt": "-h",
        "poweroff": "-P",
        "reboot": "-r",
        "cancel": "-c",
        "time": "-t"
      },
      forceArgs: false
    };
    REBOOT_MAPPING = {
      unix: "reboot",
      ps: "Restart-Computer",
      flagMap: {
        "force": "-f",
        "now": "-n"
      },
      forceArgs: false
    };
    HALT_MAPPING = {
      unix: "halt",
      ps: "Stop-Computer -Force",
      flagMap: {
        "force": "-f",
        "poweroff": "-p",
        "reboot": "-r"
      },
      forceArgs: false
    };
    POWEROFF_MAPPING = {
      unix: "poweroff",
      ps: "Stop-Computer -Force",
      flagMap: {
        "force": "-f",
        "halt": "-h",
        "reboot": "-r"
      },
      forceArgs: false
    };
    USERADD_MAPPING = {
      unix: "useradd",
      ps: "New-LocalUser",
      flagMap: {
        "comment": "-c",
        "home": "-d",
        "expire": "-e",
        "gecos": "-g",
        "groups": "-G",
        "system": "-r",
        "shell": "-s",
        "uid": "-u"
      },
      forceArgs: false
    };
    USERDEL_MAPPING = {
      unix: "userdel",
      ps: "Remove-LocalUser",
      flagMap: {
        "force": "-f",
        "remove": "-r"
      },
      forceArgs: false
    };
    PASSWD_MAPPING = {
      unix: "passwd",
      ps: "Set-LocalUser -Password (Read-Host -AsSecureString 'Enter new password')",
      flagMap: {
        "delete": "-d",
        "expire": "-e",
        "force": "-f",
        "lock": "-l",
        "unlock": "-u"
      },
      forceArgs: false
    };
    SU_MAPPING = {
      unix: "su",
      ps: "Start-Process powershell -Verb RunAs",
      flagMap: {
        "command": "-c",
        "login": "-l",
        "preserve": "-p",
        "shell": "-s"
      },
      forceArgs: false
    };
    SUDO_MAPPING = {
      unix: "sudo",
      ps: "Start-Process powershell -Verb RunAs -ArgumentList",
      flagMap: {
        "command": "-c",
        "login": "-l",
        "preserve": "-p",
        "shell": "-s",
        "user": "-u",
        "group": "-g"
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
      TEE_MAPPING,
      TAR_MAPPING,
      CURL_MAPPING,
      WGET_MAPPING,
      DIFF_MAPPING,
      SPLIT_MAPPING,
      PASTE_MAPPING,
      RSYNC_MAPPING,
      CHMOD_MAPPING,
      CHOWN_MAPPING,
      LN_MAPPING,
      DU_MAPPING,
      SYSTEMCTL_MAPPING,
      LESS_MAPPING,
      MORE_MAPPING,
      PING_MAPPING,
      TOP_MAPPING,
      RMDIR_MAPPING,
      UPTIME_MAPPING,
      FREE_MAPPING,
      NETSTAT_MAPPING,
      SSH_MAPPING,
      GZIP_MAPPING,
      GUNZIP_MAPPING,
      JOBS_MAPPING,
      BG_MAPPING,
      FG_MAPPING,
      NICE_MAPPING,
      NOHUP_MAPPING,
      CHGRP_MAPPING,
      UMASK_MAPPING,
      MKTEMP_MAPPING,
      REALPATH_MAPPING,
      JOIN_MAPPING,
      COMM_MAPPING,
      EXPAND_MAPPING,
      UNEXPAND_MAPPING,
      FOLD_MAPPING,
      FMT_MAPPING,
      TELNET_MAPPING,
      NC_MAPPING,
      DIG_MAPPING,
      NSLOOKUP_MAPPING,
      MAKE_MAPPING,
      GCC_MAPPING,
      GPP_MAPPING,
      GIT_MAPPING,
      APT_MAPPING,
      APT_GET_MAPPING,
      YUM_MAPPING,
      DNF_MAPPING,
      BREW_MAPPING,
      UNAME_MAPPING,
      ID_MAPPING,
      GROUPS_MAPPING,
      WHO_MAPPING,
      W_MAPPING,
      REV_MAPPING,
      TAC_MAPPING,
      COLUMN_MAPPING,
      PR_MAPPING,
      CSPLIT_MAPPING,
      TSORT_MAPPING,
      SHUTDOWN_MAPPING,
      REBOOT_MAPPING,
      HALT_MAPPING,
      POWEROFF_MAPPING,
      USERADD_MAPPING,
      USERDEL_MAPPING,
      PASSWD_MAPPING,
      SU_MAPPING,
      SUDO_MAPPING
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
  const suggestions = [];
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
        unsupported.push(`${trimmed} (unknown command: '${c}')`);
        const cmdSuggestions = getCommandSuggestions(c);
        if (cmdSuggestions.length > 0) {
          suggestions.push(`  Did you mean: ${cmdSuggestions.join(", ")}?`);
        }
        continue;
      }
      const allowedFlags = STATIC_ALLOWED_FLAGS[c] ?? DYNAMIC_ALLOWED_FLAGS[c];
      if (allowedFlags) {
        const flagToks = tokens.filter((t) => t.role === "flag");
        for (const fTok of flagToks) {
          if (!allowedFlags.has(fTok.value)) {
            unsupported.push(`${trimmed} (unsupported flag: '${fTok.value}' for '${c}')`);
            const flagSuggestions = getFlagSuggestions(c, fTok.value, allowedFlags);
            if (flagSuggestions.length > 0) {
              suggestions.push(`  Available flags for '${c}': ${Array.from(allowedFlags).join(", ")}`);
            }
            break;
          }
        }
      }
    }
  }
  return { unsupported, suggestions };
}
function getCommandSuggestions(unknownCmd) {
  const allCommands = [...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS];
  const suggestions = [];
  for (const cmd of allCommands) {
    if (cmd.length >= 3 && (cmd.includes(unknownCmd) || unknownCmd.includes(cmd) || Math.abs(cmd.length - unknownCmd.length) <= 2)) {
      suggestions.push(cmd);
      if (suggestions.length >= 3) break;
    }
  }
  return suggestions;
}
function getFlagSuggestions(cmd, unknownFlag, allowedFlags) {
  const suggestions = [];
  for (const flag of Array.from(allowedFlags)) {
    if (flag.includes(unknownFlag) || unknownFlag.includes(flag)) {
      suggestions.push(flag);
      if (suggestions.length >= 3) break;
    }
  }
  return suggestions;
}
function debugLog(...args) {
  if (DEBUG) {
    console.log("[smartsh/sm debug]", ...args);
  }
}
function getPowerShellVersionSync() {
  const { execSync } = require("child_process");
  const candidates = ["powershell", "pwsh"];
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
    const finalResult = handleBacktickEscapedOperators(unixTranslated);
    if (shell.supportsConditionalConnectors) {
      return finalResult;
    }
    return translateForLegacyPowerShell(finalResult);
  }
  return command;
}
function handleBacktickEscapedOperators(cmd) {
  return cmd.replace(/`&`&/g, "'&&'").replace(/`\|`\|/g, "'||'");
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
    console.log("src/translate.ts LOADED");
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
      "echo",
      "nl"
    ];
    SUPPORTED_COMMANDS = /* @__PURE__ */ new Set([...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS]);
    OVERRIDE_SHELL = (_a = process.env.SMARTSH_SHELL) == null ? void 0 : _a.toLowerCase();
    DEBUG = process.env.SMARTSH_DEBUG === "1" || process.env.SMARTSH_DEBUG === "true";
  }
});

// src/cli.ts
init_translate();
var import_node_child_process = require("child_process");

// src/config.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var import_node_os = __toESM(require("os"));
init_unixMappings();
function readJson(filePath) {
  try {
    const txt = import_node_fs.default.readFileSync(filePath, "utf8");
    return JSON.parse(txt);
  } catch {
    return null;
  }
}
function initConfig() {
  const home = import_node_os.default.homedir();
  const candidates = [
    import_node_path.default.join(home, ".smartshrc"),
    import_node_path.default.join(home, ".smartshrc.json"),
    import_node_path.default.join(home, ".smartshrc.js"),
    import_node_path.default.join(home, ".smartshrc.cjs")
  ];
  let cfg = null;
  for (const p of candidates) {
    if (import_node_fs.default.existsSync(p)) {
      if (p.endsWith(".js") || p.endsWith(".cjs")) {
        try {
          const mod = require(p);
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

// src/cli.ts
var TOOL_NAME = "smartsh";
function runInShell(shellInfo, command) {
  if (shellInfo.type === "powershell") {
    let exe = "powershell";
    if (shellInfo.version && shellInfo.version >= 7) {
      try {
        require("child_process").execSync("pwsh -Version", { stdio: "ignore" });
        exe = "pwsh";
      } catch {
        exe = "powershell";
      }
    }
    const child2 = (0, import_node_child_process.spawn)(exe, ["-NoProfile", "-Command", command], {
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
  const child = (0, import_node_child_process.spawn)(command, {
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
  let dryRun = false;
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
    if (arg === "--dry-run") {
      dryRun = true;
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
    if (res.suggestions.length > 0) {
      console.error("\n\u{1F4A1} Suggestions:");
      for (const suggestion of res.suggestions) {
        console.error(suggestion);
      }
    }
    process.exit(1);
  }
  const commandToRun = translateCommand(originalCommand, shellInfo);
  if (translateOnly || dryRun) {
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
if (require.main === module) {
  main();
}
