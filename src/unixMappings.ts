import { tokenizeWithPos, tagTokenRoles } from "./tokenize";

export interface CommandMapping {
  unix: string;
  ps: string;
  flagMap: Record<string, string>; // maps a unix flag (or combo) to ps flags
  forceArgs?: boolean; // if true command requires at least one argument
}

const RM_MAPPING: CommandMapping = {
  unix: "rm",
  ps: "Remove-Item",
  flagMap: {
    "-rf": "-Recurse -Force",
    "-fr": "-Recurse -Force",
    "-r": "-Recurse",
    "-f": "-Force",
  },
  forceArgs: true,
};

const MKDIR_MAPPING: CommandMapping = {
  unix: "mkdir",
  ps: "New-Item -ItemType Directory",
  flagMap: {
    "-p": "-Force",
  },
};

const LS_MAPPING: CommandMapping = {
  unix: "ls",
  ps: "Get-ChildItem",
  flagMap: {
    "-la": "-Force",
    "-al": "-Force",
    "-a": "-Force",
    "-l": "",
  },
};

const CP_MAPPING: CommandMapping = {
  unix: "cp",
  ps: "Copy-Item",
  flagMap: {
    "-r": "-Recurse",
    "-R": "-Recurse",
    "-f": "-Force",
    "-rf": "-Recurse -Force",
    "-fr": "-Recurse -Force",
  },
  forceArgs: true,
};

const MV_MAPPING: CommandMapping = {
  unix: "mv",
  ps: "Move-Item",
  flagMap: {},
  forceArgs: true,
};

const TOUCH_MAPPING: CommandMapping = {
  unix: "touch",
  ps: "New-Item -ItemType File",
  flagMap: {},
  forceArgs: true,
};

const GREP_MAPPING: CommandMapping = {
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
    "-F": "-SimpleMatch",
  },
  forceArgs: true,
};

const CAT_MAPPING: CommandMapping = {
  unix: "cat",
  ps: "Get-Content",
  flagMap: {},
  forceArgs: true,
};

const WHICH_MAPPING: CommandMapping = {
  unix: "which",
  ps: "Get-Command",
  flagMap: {},
  forceArgs: true,
};

const SORT_MAPPING: CommandMapping = {
  unix: "sort",
  ps: "Sort-Object",
  flagMap: {},
  forceArgs: false,
};

const UNIQ_MAPPING: CommandMapping = {
  unix: "uniq",
  ps: "Select-Object -Unique",
  flagMap: {},
  forceArgs: false,
};

const FIND_MAPPING: CommandMapping = {
  unix: "find",
  ps: "Get-ChildItem -Recurse",
  flagMap: {
    "-name": "-Filter", // maps -name pattern
    "-type": "", // we ignore -type for now
  },
  forceArgs: true,
};

const PWD_MAPPING: CommandMapping = {
  unix: "pwd",
  ps: "Get-Location",
  flagMap: {},
  forceArgs: false,
};

const DATE_MAPPING: CommandMapping = {
  unix: "date",
  ps: "Get-Date",
  flagMap: {},
  forceArgs: false,
};

const CLEAR_MAPPING: CommandMapping = {
  unix: "clear",
  ps: "Clear-Host",
  flagMap: {},
  forceArgs: false,
};

const PS_MAPPING: CommandMapping = {
  unix: "ps",
  ps: "Get-Process",
  flagMap: {},
  forceArgs: false,
};

const KILL_MAPPING: CommandMapping = {
  unix: "kill",
  ps: "Stop-Process",
  flagMap: {
    "-9": "-Force",
  },
  forceArgs: true,
};

const DF_MAPPING: CommandMapping = {
  unix: "df",
  ps: "Get-PSDrive",
  flagMap: {
    "-h": "", // human-readable not needed
  },
  forceArgs: false,
};

const HOSTNAME_MAPPING: CommandMapping = {
  unix: "hostname",
  ps: "$env:COMPUTERNAME",
  flagMap: {},
  forceArgs: false,
};

const DIRNAME_MAPPING: CommandMapping = {
  unix: "dirname",
  ps: "Split-Path -Parent",
  flagMap: {},
  forceArgs: true,
};

const BASENAME_MAPPING: CommandMapping = {
  unix: "basename",
  ps: "Split-Path -Leaf",
  flagMap: {},
  forceArgs: true,
};

const TEE_MAPPING: CommandMapping = {
  unix: "tee",
  ps: "Tee-Object -FilePath",
  flagMap: {
    "-a": "-Append",
  },
  forceArgs: true,
};

export const MAPPINGS: CommandMapping[] = [
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
];

function smartJoin(tokens: string[]): string {
  const merged: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    // Pattern: N >  or N >>  or N >& etc. Merge numeric fd with operator (and possibly target fd)
    if (/^\d+$/.test(tok) && i + 1 < tokens.length) {
      const op = tokens[i + 1];
      if (op === ">" || op === ">>" || op === ">&" || op === ">|" || op === "<&" || op === ">>&") {
        let combined = tok + op;
        let skip = 1;
        // Handle forms like 2>&1 where next token after op is also a number
        if ((op === ">&" || op === "<&") && i + 2 < tokens.length && /^\d+$/.test(tokens[i + 2])) {
          combined += tokens[i + 2];
          skip = 2;
        }
        merged.push(combined);
        i += skip; // Skip the operator (and maybe the target fd)
        continue;
      }
    }

    merged.push(tok);
  }
  return merged.join(" ");
}

// Helper to merge command substitution sequences like $, (, ..., ) into a single token.
function mergeCommandSubs(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    // Case 1: tokens split as "$", "(", ...
    if (tokens[i] === "$" && i + 1 < tokens.length && tokens[i + 1] === "(") {
      let depth = 0;
      let j = i + 1;
      for (; j < tokens.length; j++) {
        if (tokens[j] === "(") {
          depth++;
        } else if (tokens[j] === ")") {
          depth--;
          if (depth < 0) {
            // closing for the opening just before loop (depth becomes -1)
            break;
          }
        }
      }
      if (j < tokens.length) {
        const combined = tokens.slice(i, j + 1).join("");
        out.push(combined);
        i = j; // skip until after ')'
        continue;
      }
    }
    // Case 2: token already starts with '$(', need to merge until matching ')'
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

function mergeEnvExp(tokens: string[]): string[] {
  const out: string[] = [];
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

// Wrap previous smartJoin merging with command substitution merge first
const originalSmartJoin = smartJoin;
function smartJoinEnhanced(tokens: string[]): string {
  const mergedSubs = mergeCommandSubs(mergeEnvExp(tokens));
  const out = originalSmartJoin(mergedSubs);
  return out.replace(/\$\s+\(/g, "$(").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
}

function isRedirToken(val: string): boolean {
  return /^(\d*>>?&?\d*|[<>]{1,2}|&>?)$/.test(val);
}

export function translateSingleUnixSegment(segment: string): string {
  if (segment.includes("${")) {
    return segment;
  }

  const trimmed = segment.trim();
  if (trimmed.startsWith("(") || trimmed.startsWith("{")) {
    return segment;
  }

  // Tokenise using the shared helpers so quoting/escaping rules are consistent across the codebase.
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

  // redirection tokens remain classified as arguments, so they automatically
  // flow through the argTokens array below.

  const tokens = roleTokens.map((t) => t.value);
  // Precompute flag + arg tokens for dynamic rules that need them early
  const earlyFlagTokens = roleTokens.filter((t) => t.role === "flag").map((t) => t.value);
  const earlyArgTokens = roleTokens.filter((t) => t.role === "arg").map((t) => t.value);

  // First command token gives us the Unix command name
  const cmdToken = roleTokens.find((t) => t.role === "cmd");
  if (!cmdToken) return segment;
  const cmd = cmdToken.value;

  // -----------------------------
  // Dynamic translations
  // -----------------------------

  // head / tail
  if (cmd === "head" || cmd === "tail") {
    let count: number | undefined;
    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (/^-\d+$/.test(tok)) {
        count = parseInt(tok.slice(1), 10);
        break;
      }
      // -n 10   OR   -c 10  (bytes)  — we translate both the same way
      if (tok === "-n" && i + 1 < tokens.length) {
        count = parseInt(tokens[i + 1], 10);
        break;
      }
      if (tok === "-c" && i + 1 < tokens.length) {
        count = parseInt(tokens[i + 1], 10);
        break;
      }
      // compact forms: -n10 or -c10
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
    const targetArgs = roleTokens
      .slice(1) // drop cmd token
      .filter((t) => {
        if (t.role === "flag") return false;
        if (t.value === String(count)) return false;
        return true;
      })
      .map((t) => t.value);

    const psCmd = `Select-Object ${flag} ${count}`;
    return smartJoinEnhanced([psCmd, ...targetArgs]);
  }

  // wc -l
  if (cmd === "wc" && tokens.length >= 2 && tokens[1] === "-l") {
    const restArgs = tokens.slice(2);
    return smartJoinEnhanced(["Measure-Object -Line", ...restArgs]);
  }

  // sleep N
  if (cmd === "sleep" && tokens.length >= 2) {
    const duration = tokens[1];
    if (/^\d+$/.test(duration)) {
      return `Start-Sleep ${duration}`;
    }
  }

  // whoami
  if (cmd === "whoami") {
    return "$env:USERNAME";
  }

  // sed 's/old/new/'   (very naive implementation)
  if (cmd === "sed" && tokens.length >= 2) {
    const script = tokens[1];
    const unq = script.startsWith("'") || script.startsWith("\"") ? script.slice(1, -1) : script;
    if (unq.startsWith("s")) {
      const delim = unq[1];
      const parts = unq.slice(2).split(delim);
      if (parts.length >= 2) {
        const pattern = parts[0];
        const replacement = parts[1];
        const restArgs = tokens.slice(2);
        // Ignore flags (e.g., 'g') since -replace is global by default in PowerShell
        const psPart = `-replace '${pattern}','${replacement}'`;
        return smartJoinEnhanced([psPart, ...restArgs]);
      }
    }
    // sed -n 'Np'  (print specific line number)
    if (tokens.length >= 3 && tokens[1] === "-n") {
      const scriptTok = tokens[2];
      const uq = scriptTok.startsWith("'") || scriptTok.startsWith("\"") ? scriptTok.slice(1, -1) : scriptTok;
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

  // awk '{print $N}'  (only supports single field extract)
  if (cmd === "awk" && tokens.length >= 2) {
    const scriptTok = tokens[1];
    const unq = scriptTok.startsWith("'") || scriptTok.startsWith("\"") ? scriptTok.slice(1, -1) : scriptTok;
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

  // cut -d <delim> -f N   (only supports single field number)
  if (cmd === "cut") {
    let delim: string | undefined;
    let fieldNum: number | undefined;
    const otherArgs: string[] = [];

    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === "-d" && i + 1 < tokens.length) {
        delim = tokens[i + 1];
        i++; // skip arg value
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
      // accumulate as non-flag arg
      otherArgs.push(tok);
    }

    if (fieldNum !== undefined) {
      const fieldIdx = fieldNum - 1;
      const delimExpr = delim ? delim.replace(/^['"]|['"]$/g, "") : "\t"; // default tab
      const psPart = `ForEach-Object { $_.Split('${delimExpr}')[${fieldIdx}] }`;
      return smartJoinEnhanced([psPart, ...otherArgs]);
    }
  }

  // tr 'a' 'b' (basic single-char sets)
  if (cmd === "tr" && tokens.length >= 3) {
    const fromTok = tokens[1];
    const toTok = tokens[2];
    const stripQuote = (s: string) => (s.startsWith("'") || s.startsWith("\"") ? s.slice(1, -1) : s);
    const from = stripQuote(fromTok);
    const to = stripQuote(toTok);
    if (from.length === to.length && from.length === 1) {
      const psPart = `ForEach-Object { $_.Replace('${from}','${to}') }`;
      const rest = tokens.slice(3);
      return smartJoinEnhanced([psPart, ...rest]);
    }
    // simple set same length >1 translate using -replace char class
    if (from.length === to.length) {
      const psPart = `ForEach-Object { $_ -replace '[${from}]','${(to.length === 1 ? to : `[${to}]`)}' }`;
      const rest = tokens.slice(3);
      return smartJoinEnhanced([psPart, ...rest]);
    }
  }

  // uniq -c (count duplicates) – naive implementation
  if (cmd === "uniq" && earlyFlagTokens.includes("-c")) {
    const restArgs = earlyArgTokens;
    const psPart = "Group-Object | ForEach-Object { \"$($_.Count) $($_.Name)\" }";
    return smartJoinEnhanced([psPart, ...restArgs]);
  }

  // sort -n  (numeric sort)
  if (cmd === "sort" && earlyFlagTokens.includes("-n")) {
    const restArgs = earlyArgTokens;
    const psPart = "Sort-Object { [double]$_ }";
    return smartJoinEnhanced([psPart, ...restArgs]);
  }

  // find quick translations (-delete | -exec echo {})
  if (cmd === "find") {
    let pathArg: string | undefined;
    let filterPattern: string | undefined;
    let wantDelete = false;
    let wantExecEcho = false;

    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i];
      if (!tok.startsWith("-")) {
        // treat first non-flag as path (e.g., . or src)
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
        // look ahead for '{}' and terminating ';' or '\;' but we just flag echo
        wantExecEcho = true;
        // Skip until we see ';' or '\;'
        while (i + 1 < tokens.length && tokens[i + 1] !== ";" && tokens[i + 1] !== "\\;") {
          i++;
        }
        continue;
      }
    }

    const parts: string[] = ["Get-ChildItem", pathArg ?? "", "-Recurse"].filter(Boolean);
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

  // xargs basic translation (optional -0) -> ForEach-Object { cmd args $_ }
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
  // -----------------------------

  // -----------------------------
  // Static table-driven mappings
  // -----------------------------

  const mapping = MAPPINGS.find((m) => m.unix === cmd);
  if (!mapping) return segment; // unknown command

  const flagTokens = earlyFlagTokens;
  const argTokens = earlyArgTokens;

  let psFlags = "";
  for (const flagTok of flagTokens) {
    const mapped = mapping.flagMap[flagTok];
    if (mapped !== undefined) {
      if (mapped) psFlags += " " + mapped;
    } else {
      return segment; // unknown flag – abort translation
    }
  }

  if (mapping.forceArgs && argTokens.length === 0) {
    return segment;
  }

  const psCommand = `${mapping.ps}${psFlags}`.trim();
  return smartJoinEnhanced([psCommand, ...argTokens]);
} 