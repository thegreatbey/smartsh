#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  detectShell: () => detectShell,
  lintCommand: () => lintCommand,
  translateCommand: () => translateCommand
});
module.exports = __toCommonJS(src_exports);

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
var OPS = /* @__PURE__ */ new Set(["&&", "||", "|", ";", "|&"]);
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

// src/unixMappings.ts
var RM_MAPPING = {
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
var MKDIR_MAPPING = {
  unix: "mkdir",
  ps: "New-Item -ItemType Directory",
  flagMap: {
    "-p": "-Force",
    "-m": "-Mode",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var LS_MAPPING = {
  unix: "ls",
  ps: "Get-ChildItem",
  flagMap: {
    "-la": "-Force",
    "-al": "-Force",
    "-a": "-Force",
    "-l": ""
  }
};
var CP_MAPPING = {
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
var MV_MAPPING = {
  unix: "mv",
  ps: "Move-Item",
  flagMap: {},
  forceArgs: true
};
var TOUCH_MAPPING = {
  unix: "touch",
  ps: "New-Item -ItemType File",
  flagMap: {
    "-a": "-AccessTime",
    "-m": "-ModifyTime",
    "-c": "-NoCreate"
  },
  forceArgs: true
};
var GREP_MAPPING = {
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
var CAT_MAPPING = {
  unix: "cat",
  ps: "Get-Content",
  flagMap: {},
  forceArgs: true
};
var WHICH_MAPPING = {
  unix: "which",
  ps: "Get-Command",
  flagMap: {},
  forceArgs: true
};
var SORT_MAPPING = {
  unix: "sort",
  ps: "Sort-Object",
  flagMap: {},
  forceArgs: false
};
var UNIQ_MAPPING = {
  unix: "uniq",
  ps: "Select-Object -Unique",
  flagMap: {},
  forceArgs: false
};
var FIND_MAPPING = {
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
var PWD_MAPPING = {
  unix: "pwd",
  ps: "Get-Location",
  flagMap: {},
  forceArgs: false
};
var DATE_MAPPING = {
  unix: "date",
  ps: "Get-Date",
  flagMap: {},
  forceArgs: false
};
var CLEAR_MAPPING = {
  unix: "clear",
  ps: "Clear-Host",
  flagMap: {},
  forceArgs: false
};
var PS_MAPPING = {
  unix: "ps",
  ps: "Get-Process",
  flagMap: {},
  forceArgs: false
};
var KILL_MAPPING = {
  unix: "kill",
  ps: "Stop-Process",
  flagMap: {
    "-9": "-Force"
  },
  forceArgs: true
};
var DF_MAPPING = {
  unix: "df",
  ps: "Get-PSDrive",
  flagMap: {
    "-h": ""
    // human-readable not needed
  },
  forceArgs: false
};
var HOSTNAME_MAPPING = {
  unix: "hostname",
  ps: "$env:COMPUTERNAME",
  flagMap: {},
  forceArgs: false
};
var DIRNAME_MAPPING = {
  unix: "dirname",
  ps: "Split-Path -Parent",
  flagMap: {},
  forceArgs: true
};
var BASENAME_MAPPING = {
  unix: "basename",
  ps: "Split-Path -Leaf",
  flagMap: {},
  forceArgs: true
};
var TEE_MAPPING = {
  unix: "tee",
  ps: "Tee-Object -FilePath",
  flagMap: {
    "-a": "-Append"
  },
  forceArgs: true
};
var TAR_MAPPING = {
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
var CURL_MAPPING = {
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
var WGET_MAPPING = {
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
var DIFF_MAPPING = {
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
var SPLIT_MAPPING = {
  unix: "split",
  ps: "Split-Content",
  flagMap: {
    "-l": "-LineCount",
    "-b": "-ByteCount",
    "-n": "-Number"
  },
  forceArgs: true
};
var PASTE_MAPPING = {
  unix: "paste",
  ps: "Join-Object",
  flagMap: {
    "-d": "-Delimiter",
    "-s": "-Serial"
  },
  forceArgs: true
};
var RSYNC_MAPPING = {
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
var CHMOD_MAPPING = {
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
var CHOWN_MAPPING = {
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
var LN_MAPPING = {
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
var DU_MAPPING = {
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
var SYSTEMCTL_MAPPING = {
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
var LESS_MAPPING = {
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
var MORE_MAPPING = {
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
var PING_MAPPING = {
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
var TOP_MAPPING = {
  unix: "top",
  ps: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20",
  flagMap: {
    "-n": "-First",
    "-p": "-Id",
    "-u": "-IncludeUserName"
  },
  forceArgs: false
};
var RMDIR_MAPPING = {
  unix: "rmdir",
  ps: "Remove-Item -Directory",
  flagMap: {
    "-p": "-Recurse",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var UPTIME_MAPPING = {
  unix: "uptime",
  ps: "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime",
  flagMap: {
    "-p": "-Pretty",
    "-s": "-Since"
  },
  forceArgs: false
};
var FREE_MAPPING = {
  unix: "free",
  ps: "Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples",
  flagMap: {
    "-h": "-Human",
    "-m": "-MB",
    "-g": "-GB"
  },
  forceArgs: false
};
var NETSTAT_MAPPING = {
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
var SSH_MAPPING = {
  unix: "ssh",
  ps: "ssh",
  flagMap: {
    "-p": "-Port",
    "-i": "-IdentityFile",
    "-X": "-X11Forwarding"
  },
  forceArgs: true
};
var GZIP_MAPPING = {
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
var GUNZIP_MAPPING = {
  unix: "gunzip",
  ps: "Expand-Archive",
  flagMap: {
    "-f": "-Force",
    "-v": "-Verbose",
    "-l": "-ListOnly"
  },
  forceArgs: false
};
var JOBS_MAPPING = {
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
var BG_MAPPING = {
  unix: "bg",
  ps: "Resume-Job",
  flagMap: {},
  forceArgs: false
};
var FG_MAPPING = {
  unix: "fg",
  ps: "Receive-Job",
  flagMap: {},
  forceArgs: false
};
var NICE_MAPPING = {
  unix: "nice",
  ps: "Start-Process",
  flagMap: {
    "-n": "-Priority"
  },
  forceArgs: true
};
var NOHUP_MAPPING = {
  unix: "nohup",
  ps: "Start-Process",
  flagMap: {
    "-n": "-NoNewWindow"
  },
  forceArgs: true
};
var CHGRP_MAPPING = {
  unix: "chgrp",
  ps: "icacls",
  flagMap: {
    "-R": "/T",
    "-v": "/Q"
  },
  forceArgs: true
};
var UMASK_MAPPING = {
  unix: "umask",
  ps: "Get-ChildItem",
  flagMap: {
    "-S": ""
  },
  forceArgs: false
};
var MKTEMP_MAPPING = {
  unix: "mktemp",
  ps: "New-TemporaryFile",
  flagMap: {
    "-d": "",
    "-u": ""
  },
  forceArgs: false
};
var REALPATH_MAPPING = {
  unix: "realpath",
  ps: "Resolve-Path",
  flagMap: {
    "-q": "-Quiet",
    "-s": "-Relative"
  },
  forceArgs: true
};
var JOIN_MAPPING = {
  unix: "join",
  ps: "Join-Object",
  flagMap: {
    "-1": "-JoinProperty",
    "-2": "-MergeProperty",
    "-t": "-Delimiter"
  },
  forceArgs: true
};
var COMM_MAPPING = {
  unix: "comm",
  ps: "Compare-Object",
  flagMap: {
    "-1": "-IncludeEqual",
    "-2": "-IncludeEqual",
    "-3": "-IncludeEqual"
  },
  forceArgs: true
};
var EXPAND_MAPPING = {
  unix: "expand",
  ps: "Get-Content",
  flagMap: {
    "-t": "-TabSize",
    "-i": "-Initial"
  },
  forceArgs: true
};
var UNEXPAND_MAPPING = {
  unix: "unexpand",
  ps: "Get-Content",
  flagMap: {
    "-a": "-All",
    "-t": "-TabSize"
  },
  forceArgs: true
};
var FOLD_MAPPING = {
  unix: "fold",
  ps: "Get-Content",
  flagMap: {
    "-b": "-Bytes",
    "-s": "-Spaces",
    "-w": "-Width"
  },
  forceArgs: true
};
var FMT_MAPPING = {
  unix: "fmt",
  ps: "Get-Content",
  flagMap: {
    "-w": "-Width",
    "-g": "-Goal",
    "-p": "-Prefix"
  },
  forceArgs: true
};
var TELNET_MAPPING = {
  unix: "telnet",
  ps: "Test-NetConnection",
  flagMap: {
    "-p": "-Port",
    "-l": "-Local"
  },
  forceArgs: true
};
var NC_MAPPING = {
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
var DIG_MAPPING = {
  unix: "dig",
  ps: "Resolve-DnsName",
  flagMap: {
    "+short": "-Type A",
    "+trace": "-Type NS",
    "-x": "-Type PTR"
  },
  forceArgs: true
};
var NSLOOKUP_MAPPING = {
  unix: "nslookup",
  ps: "Resolve-DnsName",
  flagMap: {
    "-type": "-Type",
    "-port": "-Port",
    "-server": "-Server"
  },
  forceArgs: true
};
var MAKE_MAPPING = {
  unix: "make",
  ps: "make",
  flagMap: {
    "-j": "-Jobs",
    "-f": "-File",
    "-C": "-Directory"
  },
  forceArgs: false
};
var GCC_MAPPING = {
  unix: "gcc",
  ps: "gcc",
  flagMap: {
    "-o": "-Output",
    "-c": "-Compile",
    "-g": "-Debug"
  },
  forceArgs: true
};
var GPP_MAPPING = {
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
var GIT_MAPPING = {
  unix: "git",
  ps: "git",
  flagMap: {
    "clone": "clone",
    "pull": "pull",
    "push": "push",
    "commit": "commit"
  },
  forceArgs: false
};
var APT_MAPPING = {
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
var APT_GET_MAPPING = {
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
var YUM_MAPPING = {
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
var DNF_MAPPING = {
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
var BREW_MAPPING = {
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
var UNAME_MAPPING = {
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
var ID_MAPPING = {
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
var GROUPS_MAPPING = {
  unix: "groups",
  ps: "Get-LocalGroup | Select-Object Name, Description",
  flagMap: {},
  forceArgs: false
};
var WHO_MAPPING = {
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
var W_MAPPING = {
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
var REV_MAPPING = {
  unix: "rev",
  ps: "Get-Content $args | ForEach-Object { [string]::Join('', ($_.ToCharArray() | Sort-Object -Descending)) }",
  flagMap: {},
  forceArgs: false
};
var TAC_MAPPING = {
  unix: "tac",
  ps: "Get-Content $args | Sort-Object -Descending",
  flagMap: {
    "before": "-b",
    "regex": "-r",
    "separator": "-s"
  },
  forceArgs: false
};
var COLUMN_MAPPING = {
  unix: "column",
  ps: "Get-Content $args | Format-Table -AutoSize",
  flagMap: {
    "separator": "-s",
    "table": "-t",
    "width": "-w"
  },
  forceArgs: false
};
var PR_MAPPING = {
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
var CSPLIT_MAPPING = {
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
var TSORT_MAPPING = {
  unix: "tsort",
  ps: "Get-Content $args | Sort-Object",
  flagMap: {},
  forceArgs: false
};
var SHUTDOWN_MAPPING = {
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
var REBOOT_MAPPING = {
  unix: "reboot",
  ps: "Restart-Computer",
  flagMap: {
    "force": "-f",
    "now": "-n"
  },
  forceArgs: false
};
var HALT_MAPPING = {
  unix: "halt",
  ps: "Stop-Computer -Force",
  flagMap: {
    "force": "-f",
    "poweroff": "-p",
    "reboot": "-r"
  },
  forceArgs: false
};
var POWEROFF_MAPPING = {
  unix: "poweroff",
  ps: "Stop-Computer -Force",
  flagMap: {
    "force": "-f",
    "halt": "-h",
    "reboot": "-r"
  },
  forceArgs: false
};
var USERADD_MAPPING = {
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
var USERDEL_MAPPING = {
  unix: "userdel",
  ps: "Remove-LocalUser",
  flagMap: {
    "force": "-f",
    "remove": "-r"
  },
  forceArgs: false
};
var PASSWD_MAPPING = {
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
var SU_MAPPING = {
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
var SUDO_MAPPING = {
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
var TRACEROUTE_MAPPING = {
  unix: "traceroute",
  ps: "Test-NetConnection -TraceRoute",
  flagMap: {
    "-n": "-NoResolve",
    "-w": "-TimeoutSeconds",
    "-q": "-Queries",
    "-m": "-MaxHops"
  },
  forceArgs: true
};
var IFCONFIG_MAPPING = {
  unix: "ifconfig",
  ps: "Get-NetAdapter | Format-Table Name, Status, LinkSpeed, MacAddress -AutoSize",
  flagMap: {
    "-a": "-All",
    "-s": "-Statistics",
    "-u": "-Up",
    "-d": "-Down"
  },
  forceArgs: false
};
var PKILL_MAPPING = {
  unix: "pkill",
  ps: "Get-Process | Where-Object {$_.ProcessName -like",
  flagMap: {
    "signal": "-Signal",
    "exact": "-Exact",
    "full": "-Full"
  },
  forceArgs: true
};
var PGREP_MAPPING = {
  unix: "pgrep",
  ps: "Get-Process | Where-Object {$_.ProcessName -like",
  flagMap: {
    "list": "-List",
    "full": "-Full",
    "exact": "-Exact"
  },
  forceArgs: true
};
var KILLALL_MAPPING = {
  unix: "killall",
  ps: "Get-Process | Where-Object {$_.ProcessName -eq",
  flagMap: {
    "signal": "-Signal",
    "exact": "-Exact",
    "interactive": "-Interactive"
  },
  forceArgs: true
};
var RENICE_MAPPING = {
  unix: "renice",
  ps: "Set-ProcessPriority",
  flagMap: {
    "priority": "-Priority",
    "pid": "-Id"
  },
  forceArgs: true
};
var IOSTAT_MAPPING = {
  unix: "iostat",
  ps: "Get-Counter '\\PhysicalDisk(*)\\% Disk Time' | Select-Object -ExpandProperty CounterSamples | Format-Table InstanceName, CookedValue -AutoSize",
  flagMap: {
    "interval": "-Interval",
    "count": "-Count",
    "all": "-All"
  },
  forceArgs: false
};
var VMSTAT_MAPPING = {
  unix: "vmstat",
  ps: "Get-Counter '\\Memory\\*' | Select-Object -ExpandProperty CounterSamples | Format-Table InstanceName, CookedValue -AutoSize",
  flagMap: {
    "interval": "-Interval",
    "count": "-Count",
    "all": "-All"
  },
  forceArgs: false
};
var SAR_MAPPING = {
  unix: "sar",
  ps: "Get-Counter '\\Processor(_Total)\\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Format-Table InstanceName, CookedValue, Timestamp -AutoSize",
  flagMap: {
    "interval": "-Interval",
    "count": "-Count",
    "all": "-All"
  },
  forceArgs: false
};
var PIP_MAPPING = {
  unix: "pip",
  ps: "pip",
  flagMap: {
    "install": "install",
    "uninstall": "uninstall",
    "list": "list",
    "show": "show",
    "freeze": "freeze"
  },
  forceArgs: false
};
var NPM_MAPPING = {
  unix: "npm",
  ps: "npm",
  flagMap: {
    "install": "install",
    "uninstall": "uninstall",
    "update": "update",
    "run": "run",
    "test": "test",
    "build": "build"
  },
  forceArgs: false
};
var YARN_MAPPING = {
  unix: "yarn",
  ps: "yarn",
  flagMap: {
    "install": "install",
    "add": "add",
    "remove": "remove",
    "run": "run",
    "test": "test",
    "build": "build"
  },
  forceArgs: false
};
var CARGO_MAPPING = {
  unix: "cargo",
  ps: "cargo",
  flagMap: {
    "build": "build",
    "run": "run",
    "test": "test",
    "check": "check",
    "clean": "clean",
    "update": "update"
  },
  forceArgs: false
};
var CMAKE_MAPPING = {
  unix: "cmake",
  ps: "cmake",
  flagMap: {
    "build": "--build",
    "configure": "--configure",
    "install": "--install",
    "test": "--test"
  },
  forceArgs: false
};
var ROUTE_MAPPING = {
  unix: "route",
  ps: "Get-NetRoute | Format-Table DestinationPrefix, NextHop, RouteMetric, InterfaceAlias -AutoSize",
  flagMap: {
    "-n": "-NoResolve",
    "-e": "-Extended",
    "-v": "-Verbose",
    "-A": "-AddressFamily"
  },
  forceArgs: false
};
var IWCONFIG_MAPPING = {
  unix: "iwconfig",
  ps: "Get-NetAdapter | Where-Object {$_.InterfaceDescription -like '*Wireless*'} | Select-Object Name, InterfaceDescription, Status, LinkSpeed",
  flagMap: {
    "all": "-All",
    "up": "-Status Up",
    "down": "-Status Down"
  },
  forceArgs: false
};
var IWSCAN_MAPPING = {
  unix: "iwlist",
  ps: "netsh wlan show networks",
  flagMap: {
    "scan": "show networks",
    "essid": "show networks",
    "channel": "show networks"
  },
  forceArgs: false
};
var ZIP_MAPPING = {
  unix: "zip",
  ps: "Compress-Archive",
  flagMap: {
    "r": "-Recurse",
    "f": "-Force",
    "u": "-Update",
    "d": "-DestinationPath"
  },
  forceArgs: true
};
var UNZIP_MAPPING = {
  unix: "unzip",
  ps: "Expand-Archive",
  flagMap: {
    "l": "-ListOnly",
    "o": "-Force",
    "d": "-DestinationPath",
    "q": "-Quiet"
  },
  forceArgs: true
};
var LSOF_MAPPING = {
  unix: "lsof",
  ps: "Get-Process | ForEach-Object { Get-NetTCPConnection | Where-Object {$_.OwningProcess -eq $_.Id} } | Format-Table LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess -AutoSize",
  flagMap: {
    "-i": "-Internet",
    "-p": "-Process",
    "-u": "-User",
    "-c": "-Command"
  },
  forceArgs: false
};
var STrace_MAPPING = {
  unix: "strace",
  ps: 'Get-Process | ForEach-Object { Write-Host "Process: $($_.ProcessName) (PID: $($_.Id))" }',
  flagMap: {
    "-p": "-ProcessId",
    "-e": "-Event",
    "-o": "-Output",
    "-f": "-Follow"
  },
  forceArgs: true
};
var LOCATE_MAPPING = {
  unix: "locate",
  ps: "Get-ChildItem -Recurse | Where-Object {$_.Name -like $args[0]} | Select-Object FullName",
  flagMap: {
    "-i": "-CaseInsensitive",
    "-n": "-Limit",
    "-r": "-Regex",
    "-q": "-Quiet"
  },
  forceArgs: true
};
var UPDATEDB_MAPPING = {
  unix: "updatedb",
  ps: "Get-ChildItem -Recurse | ForEach-Object { $_.FullName } | Out-File -FilePath $env:TEMP\\locate.db -Encoding UTF8",
  flagMap: {
    "-o": "-Output",
    "-l": "-Local",
    "-U": "-Update",
    "-v": "-Verbose"
  },
  forceArgs: false
};
var TRACEPATH_MAPPING = {
  unix: "tracepath",
  ps: "Test-NetConnection -TraceRoute -InformationLevel Detailed",
  flagMap: {
    "-n": "-NoResolve",
    "-b": "-Bind",
    "-m": "-MaxHops",
    "-l": "-Local"
  },
  forceArgs: true
};
var MTR_MAPPING = {
  unix: "mtr",
  ps: 'Test-NetConnection -TraceRoute -InformationLevel Detailed | ForEach-Object { Write-Host "Hop $($_.Hop): $($_.Address) - $($_.ResponseTime)ms" }',
  flagMap: {
    "-n": "-NoResolve",
    "-r": "-Report",
    "-c": "-Count",
    "-i": "-Interval"
  },
  forceArgs: true
};
var BZIP2_MAPPING = {
  unix: "bzip2",
  ps: "Compress-Archive -CompressionLevel Optimal",
  flagMap: {
    "-d": "-Decompress",
    "-k": "-Keep",
    "-f": "-Force",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var BUNZIP2_MAPPING = {
  unix: "bunzip2",
  ps: "Expand-Archive",
  flagMap: {
    "-k": "-Keep",
    "-f": "-Force",
    "-v": "-Verbose",
    "-t": "-Test"
  },
  forceArgs: true
};
var WC_MAPPING = {
  unix: "wc",
  ps: "Measure-Object",
  flagMap: {
    "-l": "-Line",
    "-w": "-Word",
    "-c": "-Character",
    "-m": "-Character",
    "-L": "-Maximum"
  },
  forceArgs: false
};
var HEAD_MAPPING = {
  unix: "head",
  ps: "Get-Content | Select-Object -First",
  flagMap: {
    "-n": "-First",
    "-c": "-TotalCount",
    "-q": "-Quiet",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var TAIL_MAPPING = {
  unix: "tail",
  ps: "Get-Content | Select-Object -Last",
  flagMap: {
    "-n": "-Last",
    "-c": "-TotalCount",
    "-f": "-Wait",
    "-q": "-Quiet"
  },
  forceArgs: true
};
var LSB_RELEASE_MAPPING = {
  unix: "lsb_release",
  ps: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, WindowsBuildLabEx",
  flagMap: {
    "a": "-All",
    "d": "-Description",
    "r": "-Release",
    "c": "-Codename"
  },
  forceArgs: false
};
var DMESG_MAPPING = {
  unix: "dmesg",
  ps: "Get-WinEvent -LogName System | Where-Object {$_.TimeCreated -gt (Get-Date).AddHours(-1)} | Format-Table TimeCreated, Message -AutoSize",
  flagMap: {
    "T": "-Format",
    "r": "-Raw",
    "k": "-Kernel",
    "x": "-Extended"
  },
  forceArgs: false
};
var CHROOT_MAPPING = {
  unix: "chroot",
  ps: "Set-Location",
  flagMap: {
    "-u": "-User",
    "-g": "-Group"
  },
  forceArgs: true
};
var STAT_MAPPING = {
  unix: "stat",
  ps: "Get-Item | Select-Object Name, Length, LastWriteTime, Attributes",
  flagMap: {
    "-f": "-Format",
    "-t": "-Terse",
    "-L": "-Follow"
  },
  forceArgs: true
};
var AWK_MAPPING = {
  unix: "awk",
  ps: "ForEach-Object",
  flagMap: {
    "-F": "-FieldSeparator",
    "-v": "-Variable",
    "-f": "-File"
  },
  forceArgs: true
};
var SED_MAPPING = {
  unix: "sed",
  ps: "-replace",
  flagMap: {
    "-n": "-NoPrint",
    "-e": "-Expression",
    "-f": "-File",
    "-i": "-InPlace"
  },
  forceArgs: true
};
var CUT_MAPPING = {
  unix: "cut",
  ps: "ForEach-Object",
  flagMap: {
    "-d": "-Delimiter",
    "-f": "-Fields",
    "-c": "-Characters"
  },
  forceArgs: true
};
var TR_MAPPING = {
  unix: "tr",
  ps: "ForEach-Object",
  flagMap: {
    "-d": "-Delete",
    "-s": "-Squeeze",
    "-c": "-Complement"
  },
  forceArgs: true
};
var IOTOP_MAPPING = {
  unix: "iotop",
  ps: "Get-Process | Sort-Object IO -Descending | Select-Object -First 20",
  flagMap: {
    "-o": "-Only",
    "-b": "-Batch",
    "-n": "-Iterations"
  },
  forceArgs: false
};
var HTOP_MAPPING = {
  unix: "htop",
  ps: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 | Format-Table -AutoSize",
  flagMap: {
    "-d": "-Delay",
    "-u": "-User",
    "-p": "-Process"
  },
  forceArgs: false
};
var GLANCES_MAPPING = {
  unix: "glances",
  ps: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory",
  flagMap: {
    "-t": "-Time",
    "-1": "-Once",
    "-w": "-Web"
  },
  forceArgs: false
};
var NETCAT_MAPPING = {
  unix: "nc",
  ps: "Test-NetConnection",
  flagMap: {
    "-l": "-Listen",
    "-p": "-Port",
    "-v": "-Verbose",
    "-w": "-Timeout"
  },
  forceArgs: true
};
var SOCAT_MAPPING = {
  unix: "socat",
  ps: "New-Object System.Net.Sockets.TcpClient",
  flagMap: {
    "-d": "-Debug",
    "-v": "-Verbose",
    "-t": "-Timeout"
  },
  forceArgs: true
};
var NMAP_MAPPING = {
  unix: "nmap",
  ps: "Test-NetConnection",
  flagMap: {
    "-p": "-Port",
    "-s": "-Scan",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var CRON_MAPPING = {
  unix: "cron",
  ps: "Register-ScheduledJob",
  flagMap: {
    "-e": "-Edit",
    "-l": "-List",
    "-r": "-Remove"
  },
  forceArgs: true
};
var CRONTAB_MAPPING = {
  unix: "crontab",
  ps: "Get-ScheduledJob",
  flagMap: {
    "-e": "-Edit",
    "-l": "-List",
    "-r": "-Remove",
    "-u": "-User"
  },
  forceArgs: true
};
var AT_MAPPING = {
  unix: "at",
  ps: "Register-ScheduledJob",
  flagMap: {
    "-f": "-FilePath",
    "-m": "-Mail",
    "-q": "-Queue",
    "-t": "-Time"
  },
  forceArgs: true
};
var ATQ_MAPPING = {
  unix: "atq",
  ps: "Get-ScheduledJob",
  flagMap: {
    "-q": "-Queue",
    "-v": "-Verbose"
  },
  forceArgs: false
};
var ATRM_MAPPING = {
  unix: "atrm",
  ps: "Unregister-ScheduledJob",
  flagMap: {
    "-q": "-Queue"
  },
  forceArgs: true
};
var SYSCTL_MAPPING = {
  unix: "sysctl",
  ps: "Get-ItemProperty",
  flagMap: {
    "-a": "-All",
    "-w": "-Write",
    "-p": "-Path"
  },
  forceArgs: true
};
var MODPROBE_MAPPING = {
  unix: "modprobe",
  ps: "Import-Module",
  flagMap: {
    "-r": "-Remove",
    "-l": "-List",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var LSMOD_MAPPING = {
  unix: "lsmod",
  ps: "Get-Module",
  flagMap: {
    "-v": "-Verbose"
  },
  forceArgs: false
};
var JOURNALCTL_MAPPING = {
  unix: "journalctl",
  ps: "Get-WinEvent",
  flagMap: {
    "-f": "-Follow",
    "-n": "-Newest",
    "-u": "-Unit",
    "-p": "-Priority"
  },
  forceArgs: true
};
var LOGROTATE_MAPPING = {
  unix: "logrotate",
  ps: "Compress-Archive",
  flagMap: {
    "-d": "-Debug",
    "-f": "-Force",
    "-s": "-State"
  },
  forceArgs: true
};
var RSYSLOG_MAPPING = {
  unix: "rsyslog",
  ps: "Write-EventLog",
  flagMap: {
    "-d": "-Debug",
    "-f": "-Config",
    "-n": "-NoFork"
  },
  forceArgs: true
};
var IPTABLES_MAPPING = {
  unix: "iptables",
  ps: "New-NetFirewallRule",
  flagMap: {
    "-A": "-Action",
    "-D": "-Delete",
    "-L": "-List",
    "-F": "-Flush"
  },
  forceArgs: true
};
var IP6TABLES_MAPPING = {
  unix: "ip6tables",
  ps: "New-NetFirewallRule -AddressFamily IPv6",
  flagMap: {
    "-A": "-Action",
    "-D": "-Delete",
    "-L": "-List",
    "-F": "-Flush"
  },
  forceArgs: true
};
var UFW_MAPPING = {
  unix: "ufw",
  ps: "Set-NetFirewallProfile",
  flagMap: {
    "enable": "-Enabled",
    "disable": "-Disabled",
    "status": "-Status",
    "reload": "-Reload"
  },
  forceArgs: true
};
var FAIL2BAN_MAPPING = {
  unix: "fail2ban",
  ps: "Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4625}",
  flagMap: {
    "start": "-Start",
    "stop": "-Stop",
    "status": "-Status",
    "reload": "-Reload"
  },
  forceArgs: true
};
var APACHE2CTL_MAPPING = {
  unix: "apache2ctl",
  ps: "Get-Service -Name Apache*",
  flagMap: {
    "start": "Start-Service",
    "stop": "Stop-Service",
    "restart": "Restart-Service",
    "status": "Get-Service"
  },
  forceArgs: true
};
var NGINX_MAPPING = {
  unix: "nginx",
  ps: "Get-Service -Name nginx",
  flagMap: {
    "-s": "-Signal",
    "-t": "-Test",
    "-v": "-Version",
    "-V": "-VersionVerbose"
  },
  forceArgs: true
};
var MYSQL_MAPPING = {
  unix: "mysql",
  ps: "mysql",
  flagMap: {
    "-u": "-User",
    "-p": "-Password",
    "-h": "-Host",
    "-P": "-Port"
  },
  forceArgs: true
};
var PSQL_MAPPING = {
  unix: "psql",
  ps: "psql",
  flagMap: {
    "-U": "-User",
    "-h": "-Host",
    "-p": "-Port",
    "-d": "-Database"
  },
  forceArgs: true
};
var REDIS_CLI_MAPPING = {
  unix: "redis-cli",
  ps: "redis-cli",
  flagMap: {
    "-h": "-Host",
    "-p": "-Port",
    "-a": "-Auth",
    "-n": "-Database"
  },
  forceArgs: true
};
var DOCKER_MAPPING = {
  unix: "docker",
  ps: "docker",
  flagMap: {
    "run": "run",
    "build": "build",
    "ps": "ps",
    "images": "images"
  },
  forceArgs: false
};
var KUBECTL_MAPPING = {
  unix: "kubectl",
  ps: "kubectl",
  flagMap: {
    "get": "get",
    "apply": "apply",
    "delete": "delete",
    "logs": "logs"
  },
  forceArgs: false
};
var ANSIBLE_MAPPING = {
  unix: "ansible",
  ps: "ansible",
  flagMap: {
    "-i": "-Inventory",
    "-m": "-Module",
    "-a": "-Args",
    "-v": "-Verbose"
  },
  forceArgs: true
};
var TERRAFORM_MAPPING = {
  unix: "terraform",
  ps: "terraform",
  flagMap: {
    "init": "init",
    "plan": "plan",
    "apply": "apply",
    "destroy": "destroy"
  },
  forceArgs: false
};
var PACKER_MAPPING = {
  unix: "packer",
  ps: "packer",
  flagMap: {
    "build": "build",
    "validate": "validate",
    "inspect": "inspect",
    "version": "version"
  },
  forceArgs: false
};
var VAGRANT_MAPPING = {
  unix: "vagrant",
  ps: "vagrant",
  flagMap: {
    "up": "up",
    "down": "down",
    "halt": "halt",
    "destroy": "destroy",
    "ssh": "ssh",
    "status": "status"
  },
  forceArgs: false
};
var CHEF_MAPPING = {
  unix: "chef",
  ps: "chef",
  flagMap: {
    "client": "client",
    "solo": "solo",
    "apply": "apply",
    "generate": "generate"
  },
  forceArgs: true
};
var PUPPET_MAPPING = {
  unix: "puppet",
  ps: "puppet",
  flagMap: {
    "apply": "apply",
    "agent": "agent",
    "master": "master",
    "cert": "cert"
  },
  forceArgs: true
};
var SALT_MAPPING = {
  unix: "salt",
  ps: "salt",
  flagMap: {
    "minion": "minion",
    "master": "master",
    "key": "key",
    "run": "run"
  },
  forceArgs: true
};
var SVN_MAPPING = {
  unix: "svn",
  ps: "svn",
  flagMap: {
    "checkout": "checkout",
    "update": "update",
    "commit": "commit",
    "status": "status",
    "log": "log"
  },
  forceArgs: false
};
var MERCURIAL_MAPPING = {
  unix: "hg",
  ps: "hg",
  flagMap: {
    "clone": "clone",
    "pull": "pull",
    "push": "push",
    "commit": "commit",
    "status": "status"
  },
  forceArgs: false
};
var PNPM_MAPPING = {
  unix: "pnpm",
  ps: "pnpm",
  flagMap: {
    "install": "install",
    "add": "add",
    "remove": "remove",
    "run": "run",
    "test": "test",
    "build": "build"
  },
  forceArgs: false
};
var BASE_MAPPINGS = [
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
  SUDO_MAPPING,
  TRACEROUTE_MAPPING,
  IFCONFIG_MAPPING,
  PKILL_MAPPING,
  PGREP_MAPPING,
  KILLALL_MAPPING,
  RENICE_MAPPING,
  IOSTAT_MAPPING,
  VMSTAT_MAPPING,
  SAR_MAPPING,
  PIP_MAPPING,
  NPM_MAPPING,
  YARN_MAPPING,
  CARGO_MAPPING,
  CMAKE_MAPPING,
  ROUTE_MAPPING,
  IWCONFIG_MAPPING,
  IWSCAN_MAPPING,
  ZIP_MAPPING,
  UNZIP_MAPPING,
  LSOF_MAPPING,
  STrace_MAPPING,
  LOCATE_MAPPING,
  UPDATEDB_MAPPING,
  TRACEPATH_MAPPING,
  MTR_MAPPING,
  BZIP2_MAPPING,
  BUNZIP2_MAPPING,
  WC_MAPPING,
  HEAD_MAPPING,
  TAIL_MAPPING,
  LSB_RELEASE_MAPPING,
  DMESG_MAPPING,
  CHROOT_MAPPING,
  STAT_MAPPING,
  AWK_MAPPING,
  SED_MAPPING,
  CUT_MAPPING,
  TR_MAPPING,
  IOTOP_MAPPING,
  HTOP_MAPPING,
  GLANCES_MAPPING,
  NETCAT_MAPPING,
  SOCAT_MAPPING,
  NMAP_MAPPING,
  CRON_MAPPING,
  CRONTAB_MAPPING,
  AT_MAPPING,
  ATQ_MAPPING,
  ATRM_MAPPING,
  SYSCTL_MAPPING,
  MODPROBE_MAPPING,
  LSMOD_MAPPING,
  JOURNALCTL_MAPPING,
  LOGROTATE_MAPPING,
  RSYSLOG_MAPPING,
  IPTABLES_MAPPING,
  IP6TABLES_MAPPING,
  UFW_MAPPING,
  FAIL2BAN_MAPPING,
  APACHE2CTL_MAPPING,
  NGINX_MAPPING,
  MYSQL_MAPPING,
  PSQL_MAPPING,
  REDIS_CLI_MAPPING,
  DOCKER_MAPPING,
  KUBECTL_MAPPING,
  ANSIBLE_MAPPING,
  TERRAFORM_MAPPING,
  PACKER_MAPPING,
  VAGRANT_MAPPING,
  CHEF_MAPPING,
  PUPPET_MAPPING,
  SALT_MAPPING,
  GIT_MAPPING,
  SVN_MAPPING,
  MERCURIAL_MAPPING,
  PNPM_MAPPING,
  VAGRANT_MAPPING,
  CHEF_MAPPING,
  PUPPET_MAPPING,
  SALT_MAPPING,
  SVN_MAPPING,
  MERCURIAL_MAPPING
];
var EXTRA_MAPPINGS = [];
var MAPPINGS = [...BASE_MAPPINGS, ...EXTRA_MAPPINGS];
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
var originalSmartJoin = smartJoin;
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

// src/shellMappings.ts
var CMD_MAPPINGS = [
  {
    unix: "rm",
    cmd: "del",
    ps: "Remove-Item",
    bash: "rm",
    ash: "rm",
    dash: "rm",
    zsh: "rm",
    fish: "rm",
    ksh: "rm",
    tcsh: "rm",
    flagMap: {
      cmd: {
        "-rf": "/s /q",
        "-fr": "/s /q",
        "-r": "/s",
        "-f": "/q"
      },
      ps: {
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force",
        "-r": "-Recurse",
        "-f": "-Force"
      }
    },
    forceArgs: true
  },
  {
    unix: "ls",
    cmd: "dir",
    ps: "Get-ChildItem",
    bash: "ls",
    ash: "ls",
    dash: "ls",
    zsh: "ls",
    fish: "ls",
    ksh: "ls",
    tcsh: "ls",
    flagMap: {
      cmd: {
        "-la": "/a",
        "-al": "/a",
        "-a": "/a",
        "-l": ""
      },
      ps: {
        "-la": "-Force",
        "-al": "-Force",
        "-a": "-Force",
        "-l": ""
      }
    }
  },
  {
    unix: "cp",
    cmd: "copy",
    ps: "Copy-Item",
    bash: "cp",
    ash: "cp",
    dash: "cp",
    zsh: "cp",
    fish: "cp",
    ksh: "cp",
    tcsh: "cp",
    flagMap: {
      cmd: {
        "-r": "/s",
        "-R": "/s",
        "-f": "/y",
        "-rf": "/s /y",
        "-fr": "/s /y"
      },
      ps: {
        "-r": "-Recurse",
        "-R": "-Recurse",
        "-f": "-Force",
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force"
      }
    },
    forceArgs: true
  },
  {
    unix: "mv",
    cmd: "move",
    ps: "Move-Item",
    bash: "mv",
    ash: "mv",
    dash: "mv",
    zsh: "mv",
    fish: "mv",
    ksh: "mv",
    tcsh: "mv",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: true
  },
  {
    unix: "mkdir",
    cmd: "md",
    ps: "New-Item -ItemType Directory",
    bash: "mkdir",
    ash: "mkdir",
    dash: "mkdir",
    zsh: "mkdir",
    fish: "mkdir",
    ksh: "mkdir",
    tcsh: "mkdir",
    flagMap: {
      cmd: {
        "-p": ""
      },
      ps: {
        "-p": "-Force"
      }
    }
  },
  {
    unix: "cat",
    cmd: "type",
    ps: "Get-Content",
    bash: "cat",
    ash: "cat",
    dash: "cat",
    zsh: "cat",
    fish: "cat",
    ksh: "cat",
    tcsh: "cat",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: true
  },
  {
    unix: "grep",
    cmd: "findstr",
    ps: "Select-String",
    bash: "grep",
    ash: "grep",
    dash: "grep",
    zsh: "grep",
    fish: "grep",
    ksh: "grep",
    tcsh: "grep",
    flagMap: {
      cmd: {
        "-i": "/i",
        "-n": "/n",
        "-v": "/v"
      },
      ps: {
        "-i": "-CaseSensitive:$false",
        "-n": "-LineNumber",
        "-v": "-NotMatch"
      }
    },
    forceArgs: true
  },
  {
    unix: "pwd",
    cmd: "cd",
    ps: "Get-Location",
    bash: "pwd",
    ash: "pwd",
    dash: "pwd",
    zsh: "pwd",
    fish: "pwd",
    ksh: "pwd",
    tcsh: "pwd",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  },
  {
    unix: "clear",
    cmd: "cls",
    ps: "Clear-Host",
    bash: "clear",
    ash: "clear",
    dash: "clear",
    zsh: "clear",
    fish: "clear",
    ksh: "clear",
    tcsh: "clear",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  },
  {
    unix: "whoami",
    cmd: "echo %USERNAME%",
    ps: "$env:USERNAME",
    bash: "whoami",
    ash: "whoami",
    dash: "whoami",
    zsh: "whoami",
    fish: "whoami",
    ksh: "whoami",
    tcsh: "whoami",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  },
  {
    unix: "hostname",
    cmd: "echo %COMPUTERNAME%",
    ps: "$env:COMPUTERNAME",
    bash: "hostname",
    ash: "hostname",
    dash: "hostname",
    zsh: "hostname",
    fish: "hostname",
    ksh: "hostname",
    tcsh: "hostname",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  },
  {
    unix: "echo",
    cmd: "echo",
    ps: "Write-Host",
    bash: "echo",
    ash: "echo",
    dash: "echo",
    zsh: "echo",
    fish: "echo",
    ksh: "echo",
    tcsh: "echo",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  },
  {
    unix: "sleep",
    cmd: "timeout",
    ps: "Start-Sleep",
    bash: "sleep",
    ash: "sleep",
    dash: "sleep",
    zsh: "sleep",
    fish: "sleep",
    ksh: "sleep",
    tcsh: "sleep",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: true
  },
  {
    unix: "ps",
    cmd: "tasklist",
    ps: "Get-Process",
    bash: "ps",
    ash: "ps",
    dash: "ps",
    zsh: "ps",
    fish: "ps",
    ksh: "ps",
    tcsh: "ps",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  },
  {
    unix: "kill",
    cmd: "taskkill",
    ps: "Stop-Process",
    bash: "kill",
    ash: "kill",
    dash: "kill",
    zsh: "kill",
    fish: "kill",
    ksh: "kill",
    tcsh: "kill",
    flagMap: {
      cmd: {
        "-9": "/f"
      },
      ps: {
        "-9": "-Force"
      }
    },
    forceArgs: true
  },
  {
    unix: "wc",
    cmd: 'find /c /v ""',
    ps: "Measure-Object",
    bash: "wc",
    ash: "wc",
    dash: "wc",
    zsh: "wc",
    fish: "wc",
    ksh: "wc",
    tcsh: "wc",
    flagMap: {
      cmd: {
        "-l": "/c",
        "-w": "/c",
        "-c": "/c"
      },
      ps: {
        "-l": "-Line",
        "-w": "-Word",
        "-c": "-Character"
      }
    },
    forceArgs: false
  },
  {
    unix: "head",
    cmd: 'powershell -Command "Get-Content $args | Select-Object -First 10"',
    ps: "Get-Content | Select-Object -First",
    bash: "head",
    ash: "head",
    dash: "head",
    zsh: "head",
    fish: "head",
    ksh: "head",
    tcsh: "head",
    flagMap: {
      cmd: {},
      ps: {
        "-n": "-First",
        "-c": "-TotalCount"
      }
    },
    forceArgs: true
  },
  {
    unix: "tail",
    cmd: 'powershell -Command "Get-Content $args | Select-Object -Last 10"',
    ps: "Get-Content | Select-Object -Last",
    bash: "tail",
    ash: "tail",
    dash: "tail",
    zsh: "tail",
    fish: "tail",
    ksh: "tail",
    tcsh: "tail",
    flagMap: {
      cmd: {},
      ps: {
        "-n": "-Last",
        "-c": "-TotalCount",
        "-f": "-Wait"
      }
    },
    forceArgs: true
  },
  {
    unix: "ifconfig",
    cmd: "ipconfig",
    ps: "Get-NetAdapter | Format-Table Name, Status, LinkSpeed, MacAddress -AutoSize",
    bash: "ifconfig",
    ash: "ifconfig",
    dash: "ifconfig",
    zsh: "ifconfig",
    fish: "ifconfig",
    ksh: "ifconfig",
    tcsh: "ifconfig",
    flagMap: {
      cmd: {
        "-a": "/all"
      },
      ps: {
        "-a": "-All",
        "-s": "-Statistics"
      }
    },
    forceArgs: false
  },
  {
    unix: "route",
    cmd: "route print",
    ps: "Get-NetRoute | Format-Table DestinationPrefix, NextHop, RouteMetric, InterfaceAlias -AutoSize",
    bash: "route",
    ash: "route",
    dash: "route",
    zsh: "route",
    fish: "route",
    ksh: "route",
    tcsh: "route",
    flagMap: {
      cmd: {},
      ps: {
        "-n": "-NoResolve",
        "-e": "-Extended"
      }
    },
    forceArgs: false
  },
  {
    unix: "traceroute",
    cmd: "tracert",
    ps: "Test-NetConnection -TraceRoute",
    bash: "traceroute",
    ash: "traceroute",
    dash: "traceroute",
    zsh: "traceroute",
    fish: "traceroute",
    ksh: "traceroute",
    tcsh: "traceroute",
    flagMap: {
      cmd: {
        "-n": "-d",
        "-w": "-w"
      },
      ps: {
        "-n": "-NoResolve",
        "-w": "-TimeoutSeconds"
      }
    },
    forceArgs: true
  },
  {
    unix: "lsof",
    cmd: "netstat -ano",
    ps: "Get-Process | ForEach-Object { Get-NetTCPConnection | Where-Object {$_.OwningProcess -eq $_.Id} } | Format-Table LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess -AutoSize",
    bash: "lsof",
    ash: "lsof",
    dash: "lsof",
    zsh: "lsof",
    fish: "lsof",
    ksh: "lsof",
    tcsh: "lsof",
    flagMap: {
      cmd: {},
      ps: {
        "-i": "-Internet",
        "-p": "-Process"
      }
    },
    forceArgs: false
  },
  {
    unix: "locate",
    cmd: "dir /s /b",
    ps: "Get-ChildItem -Recurse | Where-Object {$_.Name -like $args[0]} | Select-Object FullName",
    bash: "locate",
    ash: "locate",
    dash: "locate",
    zsh: "locate",
    fish: "locate",
    ksh: "locate",
    tcsh: "locate",
    flagMap: {
      cmd: {},
      ps: {
        "-i": "-CaseInsensitive",
        "-n": "-Limit"
      }
    },
    forceArgs: true
  },
  {
    unix: "bzip2",
    cmd: 'powershell -Command "Compress-Archive -Path $args[0] -DestinationPath $args[0].zip -CompressionLevel Optimal"',
    ps: "Compress-Archive -CompressionLevel Optimal",
    bash: "bzip2",
    ash: "bzip2",
    dash: "bzip2",
    zsh: "bzip2",
    fish: "bzip2",
    ksh: "bzip2",
    tcsh: "bzip2",
    flagMap: {
      cmd: {},
      ps: {
        "-d": "-Decompress",
        "-k": "-Keep",
        "-f": "-Force"
      }
    },
    forceArgs: true
  },
  {
    unix: "stat",
    cmd: "dir",
    ps: "Get-Item | Select-Object Name, Length, LastWriteTime, Attributes",
    bash: "stat",
    ash: "stat",
    dash: "stat",
    zsh: "stat",
    fish: "stat",
    ksh: "stat",
    tcsh: "stat",
    flagMap: {
      cmd: {},
      ps: {
        "-f": "-Format",
        "-t": "-Terse"
      }
    },
    forceArgs: true
  },
  {
    unix: "awk",
    cmd: 'powershell -Command "ForEach-Object { $_.Split() }"',
    ps: "ForEach-Object",
    bash: "awk",
    ash: "awk",
    dash: "awk",
    zsh: "awk",
    fish: "awk",
    ksh: "awk",
    tcsh: "awk",
    flagMap: {
      cmd: {},
      ps: {
        "-F": "-FieldSeparator",
        "-v": "-Variable"
      }
    },
    forceArgs: true
  },
  {
    unix: "sed",
    cmd: 'powershell -Command "-replace"',
    ps: "-replace",
    bash: "sed",
    ash: "sed",
    dash: "sed",
    zsh: "sed",
    fish: "sed",
    ksh: "sed",
    tcsh: "sed",
    flagMap: {
      cmd: {},
      ps: {
        "-n": "-NoPrint",
        "-e": "-Expression"
      }
    },
    forceArgs: true
  },
  {
    unix: "cut",
    cmd: 'powershell -Command "ForEach-Object { $_.Split()[0] }"',
    ps: "ForEach-Object",
    bash: "cut",
    ash: "cut",
    dash: "cut",
    zsh: "cut",
    fish: "cut",
    ksh: "cut",
    tcsh: "cut",
    flagMap: {
      cmd: {},
      ps: {
        "-d": "-Delimiter",
        "-f": "-Fields"
      }
    },
    forceArgs: true
  },
  {
    unix: "tr",
    cmd: `powershell -Command "ForEach-Object { $_.Replace('a','b') }"`,
    ps: "ForEach-Object",
    bash: "tr",
    ash: "tr",
    dash: "tr",
    zsh: "tr",
    fish: "tr",
    ksh: "tr",
    tcsh: "tr",
    flagMap: {
      cmd: {},
      ps: {
        "-d": "-Delete",
        "-s": "-Squeeze"
      }
    },
    forceArgs: true
  },
  {
    unix: "htop",
    cmd: "tasklist",
    ps: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 | Format-Table -AutoSize",
    bash: "htop",
    ash: "htop",
    dash: "htop",
    zsh: "htop",
    fish: "htop",
    ksh: "htop",
    tcsh: "htop",
    flagMap: {
      cmd: {},
      ps: {
        "-d": "-Delay",
        "-u": "-User"
      }
    },
    forceArgs: false
  },
  {
    unix: "nmap",
    cmd: 'powershell -Command "Test-NetConnection"',
    ps: "Test-NetConnection",
    bash: "nmap",
    ash: "nmap",
    dash: "nmap",
    zsh: "nmap",
    fish: "nmap",
    ksh: "nmap",
    tcsh: "nmap",
    flagMap: {
      cmd: {},
      ps: {
        "-p": "-Port",
        "-s": "-Scan"
      }
    },
    forceArgs: true
  },
  {
    unix: "cron",
    cmd: "schtasks",
    ps: "Register-ScheduledJob",
    bash: "cron",
    ash: "cron",
    dash: "cron",
    zsh: "cron",
    fish: "cron",
    ksh: "cron",
    tcsh: "cron",
    flagMap: {
      cmd: {},
      ps: {
        "-e": "-Edit",
        "-l": "-List"
      }
    },
    forceArgs: true
  },
  {
    unix: "crontab",
    cmd: "schtasks /query",
    ps: "Get-ScheduledJob",
    bash: "crontab",
    ash: "crontab",
    dash: "crontab",
    zsh: "crontab",
    fish: "crontab",
    ksh: "crontab",
    tcsh: "crontab",
    flagMap: {
      cmd: {},
      ps: {
        "-e": "-Edit",
        "-l": "-List"
      }
    },
    forceArgs: true
  },
  {
    unix: "at",
    cmd: "schtasks /create",
    ps: "Register-ScheduledJob",
    bash: "at",
    ash: "at",
    dash: "at",
    zsh: "at",
    fish: "at",
    ksh: "at",
    tcsh: "at",
    flagMap: {
      cmd: {},
      ps: {
        "-f": "-FilePath",
        "-t": "-Time"
      }
    },
    forceArgs: true
  },
  {
    unix: "sysctl",
    cmd: "reg query",
    ps: "Get-ItemProperty",
    bash: "sysctl",
    ash: "sysctl",
    dash: "sysctl",
    zsh: "sysctl",
    fish: "sysctl",
    ksh: "sysctl",
    tcsh: "sysctl",
    flagMap: {
      cmd: {},
      ps: {
        "-a": "-All",
        "-w": "-Write"
      }
    },
    forceArgs: true
  },
  {
    unix: "iptables",
    cmd: "netsh advfirewall firewall",
    ps: "New-NetFirewallRule",
    bash: "iptables",
    ash: "iptables",
    dash: "iptables",
    zsh: "iptables",
    fish: "iptables",
    ksh: "iptables",
    tcsh: "iptables",
    flagMap: {
      cmd: {},
      ps: {
        "-A": "-Action",
        "-L": "-List"
      }
    },
    forceArgs: true
  },
  {
    unix: "ufw",
    cmd: "netsh advfirewall set",
    ps: "Set-NetFirewallProfile",
    bash: "ufw",
    ash: "ufw",
    dash: "ufw",
    zsh: "ufw",
    fish: "ufw",
    ksh: "ufw",
    tcsh: "ufw",
    flagMap: {
      cmd: {},
      ps: {
        "enable": "-Enabled",
        "disable": "-Disabled"
      }
    },
    forceArgs: true
  },
  {
    unix: "apache2ctl",
    cmd: "sc",
    ps: "Get-Service -Name Apache*",
    bash: "apache2ctl",
    ash: "apache2ctl",
    dash: "apache2ctl",
    zsh: "apache2ctl",
    fish: "apache2ctl",
    ksh: "apache2ctl",
    tcsh: "apache2ctl",
    flagMap: {
      cmd: {},
      ps: {
        "start": "Start-Service",
        "stop": "Stop-Service",
        "status": "Get-Service"
      }
    },
    forceArgs: true
  },
  {
    unix: "nginx",
    cmd: "sc",
    ps: "Get-Service -Name nginx",
    bash: "nginx",
    ash: "nginx",
    dash: "nginx",
    zsh: "nginx",
    fish: "nginx",
    ksh: "nginx",
    tcsh: "nginx",
    flagMap: {
      cmd: {},
      ps: {
        "-s": "-Signal",
        "-t": "-Test"
      }
    },
    forceArgs: true
  },
  {
    unix: "mysql",
    cmd: "mysql",
    ps: "mysql",
    bash: "mysql",
    ash: "mysql",
    dash: "mysql",
    zsh: "mysql",
    fish: "mysql",
    ksh: "mysql",
    tcsh: "mysql",
    flagMap: {
      cmd: {},
      ps: {
        "-u": "-User",
        "-p": "-Password",
        "-h": "-Host"
      }
    },
    forceArgs: true
  },
  {
    unix: "psql",
    cmd: "psql",
    ps: "psql",
    bash: "psql",
    ash: "psql",
    dash: "psql",
    zsh: "psql",
    fish: "psql",
    ksh: "psql",
    tcsh: "psql",
    flagMap: {
      cmd: {},
      ps: {
        "-U": "-User",
        "-h": "-Host",
        "-d": "-Database"
      }
    },
    forceArgs: true
  },
  {
    unix: "docker",
    cmd: "docker",
    ps: "docker",
    bash: "docker",
    ash: "docker",
    dash: "docker",
    zsh: "docker",
    fish: "docker",
    ksh: "docker",
    tcsh: "docker",
    flagMap: {
      cmd: {},
      ps: {
        "run": "run",
        "build": "build",
        "ps": "ps"
      }
    },
    forceArgs: false
  },
  {
    unix: "kubectl",
    cmd: "kubectl",
    ps: "kubectl",
    bash: "kubectl",
    ash: "kubectl",
    dash: "kubectl",
    zsh: "kubectl",
    fish: "kubectl",
    ksh: "kubectl",
    tcsh: "kubectl",
    flagMap: {
      cmd: {},
      ps: {
        "get": "get",
        "apply": "apply",
        "delete": "delete"
      }
    },
    forceArgs: false
  },
  {
    unix: "ansible",
    cmd: "ansible",
    ps: "ansible",
    bash: "ansible",
    ash: "ansible",
    dash: "ansible",
    zsh: "ansible",
    fish: "ansible",
    ksh: "ansible",
    tcsh: "ansible",
    flagMap: {
      cmd: {},
      ps: {
        "-i": "-Inventory",
        "-m": "-Module",
        "-a": "-Args"
      }
    },
    forceArgs: true
  },
  {
    unix: "terraform",
    cmd: "terraform",
    ps: "terraform",
    bash: "terraform",
    ash: "terraform",
    dash: "terraform",
    zsh: "terraform",
    fish: "terraform",
    ksh: "terraform",
    tcsh: "terraform",
    flagMap: {
      cmd: {},
      ps: {
        "init": "init",
        "plan": "plan",
        "apply": "apply"
      }
    },
    forceArgs: false
  },
  {
    unix: "vagrant",
    cmd: "vagrant",
    ps: "vagrant",
    bash: "vagrant",
    ash: "vagrant",
    dash: "vagrant",
    zsh: "vagrant",
    fish: "vagrant",
    ksh: "vagrant",
    tcsh: "vagrant",
    flagMap: {
      cmd: {},
      ps: {
        "up": "up",
        "down": "down",
        "halt": "halt",
        "destroy": "destroy",
        "ssh": "ssh",
        "status": "status"
      }
    },
    forceArgs: false
  },
  {
    unix: "chef",
    cmd: "chef",
    ps: "chef",
    bash: "chef",
    ash: "chef",
    dash: "chef",
    zsh: "chef",
    fish: "chef",
    ksh: "chef",
    tcsh: "chef",
    flagMap: {
      cmd: {},
      ps: {
        "client": "client",
        "solo": "solo",
        "apply": "apply",
        "generate": "generate"
      }
    },
    forceArgs: true
  },
  {
    unix: "puppet",
    cmd: "puppet",
    ps: "puppet",
    bash: "puppet",
    ash: "puppet",
    dash: "puppet",
    zsh: "puppet",
    fish: "puppet",
    ksh: "puppet",
    tcsh: "puppet",
    flagMap: {
      cmd: {},
      ps: {
        "apply": "apply",
        "agent": "agent",
        "master": "master",
        "cert": "cert"
      }
    },
    forceArgs: true
  },
  {
    unix: "salt",
    cmd: "salt",
    ps: "salt",
    bash: "salt",
    ash: "salt",
    dash: "salt",
    zsh: "salt",
    fish: "salt",
    ksh: "salt",
    tcsh: "salt",
    flagMap: {
      cmd: {},
      ps: {
        "minion": "minion",
        "master": "master",
        "key": "key",
        "run": "run"
      }
    },
    forceArgs: true
  },
  {
    unix: "svn",
    cmd: "svn",
    ps: "svn",
    bash: "svn",
    ash: "svn",
    dash: "svn",
    zsh: "svn",
    fish: "svn",
    ksh: "svn",
    tcsh: "svn",
    flagMap: {
      cmd: {},
      ps: {
        "checkout": "checkout",
        "update": "update",
        "commit": "commit",
        "status": "status",
        "log": "log"
      }
    },
    forceArgs: false
  },
  {
    unix: "hg",
    cmd: "hg",
    ps: "hg",
    bash: "hg",
    ash: "hg",
    dash: "hg",
    zsh: "hg",
    fish: "hg",
    ksh: "hg",
    tcsh: "hg",
    flagMap: {
      cmd: {},
      ps: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "status": "status"
      }
    },
    forceArgs: false
  },
  {
    unix: "pnpm",
    cmd: "pnpm",
    ps: "pnpm",
    bash: "pnpm",
    ash: "pnpm",
    dash: "pnpm",
    zsh: "pnpm",
    fish: "pnpm",
    ksh: "pnpm",
    tcsh: "pnpm",
    flagMap: {
      cmd: {},
      ps: {
        "install": "install",
        "add": "add",
        "remove": "remove",
        "run": "run",
        "test": "test",
        "build": "build"
      }
    },
    forceArgs: false
  },
  {
    unix: "conda",
    cmd: "conda",
    ps: "conda",
    bash: "conda",
    ash: "conda",
    dash: "conda",
    zsh: "conda",
    fish: "conda",
    ksh: "conda",
    tcsh: "conda",
    flagMap: {
      cmd: {},
      ps: {
        "install": "install",
        "remove": "remove",
        "list": "list",
        "create": "create",
        "activate": "activate",
        "deactivate": "deactivate"
      }
    },
    forceArgs: false
  },
  {
    unix: "composer",
    cmd: "composer",
    ps: "composer",
    bash: "composer",
    ash: "composer",
    dash: "composer",
    zsh: "composer",
    fish: "composer",
    ksh: "composer",
    tcsh: "composer",
    flagMap: {
      cmd: {},
      ps: {
        "install": "install",
        "update": "update",
        "require": "require",
        "remove": "remove",
        "dump-autoload": "dump-autoload"
      }
    },
    forceArgs: false
  },
  {
    unix: "gradle",
    cmd: "gradle",
    ps: "gradle",
    bash: "gradle",
    ash: "gradle",
    dash: "gradle",
    zsh: "gradle",
    fish: "gradle",
    ksh: "gradle",
    tcsh: "gradle",
    flagMap: {
      cmd: {},
      ps: {
        "build": "build",
        "test": "test",
        "run": "run",
        "clean": "clean",
        "assemble": "assemble"
      }
    },
    forceArgs: false
  },
  {
    unix: "mvn",
    cmd: "mvn",
    ps: "mvn",
    bash: "mvn",
    ash: "mvn",
    dash: "mvn",
    zsh: "mvn",
    fish: "mvn",
    ksh: "mvn",
    tcsh: "mvn",
    flagMap: {
      cmd: {},
      ps: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "install": "install",
        "clean": "clean"
      }
    },
    forceArgs: false
  },
  {
    unix: "ant",
    cmd: "ant",
    ps: "ant",
    bash: "ant",
    ash: "ant",
    dash: "ant",
    zsh: "ant",
    fish: "ant",
    ksh: "ant",
    tcsh: "ant",
    flagMap: {
      cmd: {},
      ps: {
        "build": "build",
        "clean": "clean",
        "test": "test",
        "jar": "jar",
        "war": "war"
      }
    },
    forceArgs: false
  },
  {
    unix: "make",
    cmd: "make",
    ps: "make",
    bash: "make",
    ash: "make",
    dash: "make",
    zsh: "make",
    fish: "make",
    ksh: "make",
    tcsh: "make",
    flagMap: {
      cmd: {},
      ps: {
        "all": "all",
        "clean": "clean",
        "install": "install",
        "test": "test",
        "build": "build"
      }
    },
    forceArgs: false
  },
  {
    unix: "cmake",
    cmd: "cmake",
    ps: "cmake",
    bash: "cmake",
    ash: "cmake",
    dash: "cmake",
    zsh: "cmake",
    fish: "cmake",
    ksh: "cmake",
    tcsh: "cmake",
    flagMap: {
      cmd: {},
      ps: {
        "configure": "configure",
        "build": "build",
        "install": "install",
        "test": "test",
        "clean": "clean"
      }
    },
    forceArgs: false
  },
  {
    unix: "gcc",
    cmd: "gcc",
    ps: "gcc",
    bash: "gcc",
    ash: "gcc",
    dash: "gcc",
    zsh: "gcc",
    fish: "gcc",
    ksh: "gcc",
    tcsh: "gcc",
    flagMap: {
      cmd: {},
      ps: {
        "-c": "-c",
        "-o": "-o",
        "-Wall": "-Wall",
        "-g": "-g",
        "-O2": "-O2"
      }
    },
    forceArgs: true
  },
  {
    unix: "g++",
    cmd: "g++",
    ps: "g++",
    bash: "g++",
    ash: "g++",
    dash: "g++",
    zsh: "g++",
    fish: "g++",
    ksh: "g++",
    tcsh: "g++",
    flagMap: {
      cmd: {},
      ps: {
        "-c": "-c",
        "-o": "-o",
        "-Wall": "-Wall",
        "-g": "-g",
        "-std=c++11": "-std=c++11"
      }
    },
    forceArgs: true
  },
  {
    unix: "clang",
    cmd: "clang",
    ps: "clang",
    bash: "clang",
    ash: "clang",
    dash: "clang",
    zsh: "clang",
    fish: "clang",
    ksh: "clang",
    tcsh: "clang",
    flagMap: {
      cmd: {},
      ps: {
        "-c": "-c",
        "-o": "-o",
        "-Wall": "-Wall",
        "-g": "-g",
        "-O2": "-O2"
      }
    },
    forceArgs: true
  },
  {
    unix: "clang++",
    cmd: "clang++",
    ps: "clang++",
    bash: "clang++",
    ash: "clang++",
    dash: "clang++",
    zsh: "clang++",
    fish: "clang++",
    ksh: "clang++",
    tcsh: "clang++",
    flagMap: {
      cmd: {},
      ps: {
        "-c": "-c",
        "-o": "-o",
        "-Wall": "-Wall",
        "-g": "-g",
        "-std=c++11": "-std=c++11"
      }
    },
    forceArgs: true
  },
  {
    unix: "rustc",
    cmd: "rustc",
    ps: "rustc",
    bash: "rustc",
    ash: "rustc",
    dash: "rustc",
    zsh: "rustc",
    fish: "rustc",
    ksh: "rustc",
    tcsh: "rustc",
    flagMap: {
      cmd: {},
      ps: {
        "-o": "-o",
        "--release": "--release",
        "--debug": "--debug",
        "-C": "-C"
      }
    },
    forceArgs: true
  },
  {
    unix: "cargo",
    cmd: "cargo",
    ps: "cargo",
    bash: "cargo",
    ash: "cargo",
    dash: "cargo",
    zsh: "cargo",
    fish: "cargo",
    ksh: "cargo",
    tcsh: "cargo",
    flagMap: {
      cmd: {},
      ps: {
        "build": "build",
        "run": "run",
        "test": "test",
        "check": "check",
        "clean": "clean",
        "update": "update"
      }
    },
    forceArgs: false
  },
  {
    unix: "go",
    cmd: "go",
    ps: "go",
    bash: "go",
    ash: "go",
    dash: "go",
    zsh: "go",
    fish: "go",
    ksh: "go",
    tcsh: "go",
    flagMap: {
      cmd: {},
      ps: {
        "build": "build",
        "run": "run",
        "test": "test",
        "get": "get",
        "install": "install",
        "mod": "mod"
      }
    },
    forceArgs: false
  },
  {
    unix: "dotnet",
    cmd: "dotnet",
    ps: "dotnet",
    bash: "dotnet",
    ash: "dotnet",
    dash: "dotnet",
    zsh: "dotnet",
    fish: "dotnet",
    ksh: "dotnet",
    tcsh: "dotnet",
    flagMap: {
      cmd: {},
      ps: {
        "build": "build",
        "run": "run",
        "test": "test",
        "publish": "publish",
        "restore": "restore",
        "clean": "clean"
      }
    },
    forceArgs: false
  },
  {
    unix: "javac",
    cmd: "javac",
    ps: "javac",
    bash: "javac",
    ash: "javac",
    dash: "javac",
    zsh: "javac",
    fish: "javac",
    ksh: "javac",
    tcsh: "javac",
    flagMap: {
      cmd: {},
      ps: {
        "-cp": "-cp",
        "-d": "-d",
        "-sourcepath": "-sourcepath",
        "-verbose": "-verbose"
      }
    },
    forceArgs: true
  },
  {
    unix: "java",
    cmd: "java",
    ps: "java",
    bash: "java",
    ash: "java",
    dash: "java",
    zsh: "java",
    fish: "java",
    ksh: "java",
    tcsh: "java",
    flagMap: {
      cmd: {},
      ps: {
        "-cp": "-cp",
        "-jar": "-jar",
        "-Xmx": "-Xmx",
        "-Xms": "-Xms",
        "-D": "-D"
      }
    },
    forceArgs: true
  }
];
var FISH_MAPPINGS = [
  {
    unix: "echo",
    cmd: "echo",
    ps: "Write-Host",
    bash: "echo",
    ash: "echo",
    dash: "echo",
    zsh: "echo",
    fish: "echo",
    ksh: "echo",
    tcsh: "echo",
    flagMap: {
      cmd: {},
      ps: {}
    },
    forceArgs: false
  }
  // Fish uses different syntax for some operations, but most Unix commands work the same
];
function getShellMapping(unixCommand, targetShell) {
  const allMappings = [...CMD_MAPPINGS, ...FISH_MAPPINGS];
  return allMappings.find((m) => m.unix === unixCommand);
}
function translateForShell(unixCommand, targetShell, flagTokens, argTokens) {
  const mapping = getShellMapping(unixCommand, targetShell);
  if (!mapping) {
    return unixCommand;
  }
  const targetCommand = mapping[targetShell] || unixCommand;
  const shellFlagMap = mapping.flagMap[targetShell] || {};
  let translatedFlags = "";
  for (const flag of flagTokens) {
    const mappedFlag = shellFlagMap[flag];
    if (mappedFlag !== void 0) {
      if (mappedFlag) translatedFlags += " " + mappedFlag;
    } else {
      translatedFlags += " " + flag;
    }
  }
  if (targetShell === "cmd" && unixCommand === "sleep") {
    const duration = argTokens[0];
    if (duration && /^\d+$/.test(duration)) {
      return `timeout ${duration}`;
    }
  }
  if (targetShell === "cmd" && unixCommand === "pwd") {
    return "cd";
  }
  const finalCommand = `${targetCommand}${translatedFlags}`.trim();
  return [finalCommand, ...argTokens].join(" ");
}

// src/translate.ts
console.log("src/translate.ts LOADED");
var DYNAMIC_CMDS = [
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
var SUPPORTED_COMMANDS = /* @__PURE__ */ new Set([...MAPPINGS.map((m) => m.unix), ...DYNAMIC_CMDS]);
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
var _a;
var OVERRIDE_SHELL = (_a = process.env.SMARTSH_SHELL) == null ? void 0 : _a.toLowerCase();
var DEBUG = process.env.SMARTSH_DEBUG === "1" || process.env.SMARTSH_DEBUG === "true";
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
  var _a2, _b, _c;
  if (OVERRIDE_SHELL) {
    debugLog(`Using shell override: ${OVERRIDE_SHELL}`);
    if (OVERRIDE_SHELL === "powershell") {
      const version = getPowerShellVersionSync();
      return {
        type: "powershell",
        version,
        supportsConditionalConnectors: version !== null && version >= 7,
        needsUnixTranslation: true,
        targetShell: "powershell"
      };
    }
    return {
      type: OVERRIDE_SHELL,
      supportsConditionalConnectors: true,
      needsUnixTranslation: true,
      targetShell: OVERRIDE_SHELL
    };
  }
  if (process.platform === "win32") {
    const isCmd = Boolean(process.env.PROMPT) && !process.env.PSModulePath;
    if (isCmd) {
      debugLog("Detected CMD via PROMPT env.");
      return { type: "cmd", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "cmd" };
    }
    if (process.env.PSModulePath) {
      const version2 = getPowerShellVersionSync();
      return {
        type: "powershell",
        version: version2,
        supportsConditionalConnectors: version2 !== null && version2 >= 7,
        needsUnixTranslation: true,
        targetShell: "powershell"
      };
    }
    const comspec = (_a2 = process.env.ComSpec) == null ? void 0 : _a2.toLowerCase();
    if (comspec == null ? void 0 : comspec.includes("cmd.exe")) {
      debugLog("Detected CMD via ComSpec path.");
      return { type: "cmd", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "cmd" };
    }
    const shellEnv = (_b = process.env.SHELL) == null ? void 0 : _b.toLowerCase();
    if (shellEnv && shellEnv.includes("bash")) {
      debugLog("Detected Bash on Windows via SHELL env:", shellEnv);
      return { type: "bash", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "bash" };
    }
    const version = getPowerShellVersionSync();
    return {
      type: "powershell",
      version,
      supportsConditionalConnectors: version !== null && version >= 7,
      needsUnixTranslation: true,
      targetShell: "powershell"
    };
  }
  const shellPath = process.env.SHELL;
  if (shellPath) {
    debugLog(`Detected Unix shell via SHELL env: ${shellPath}`);
    const shellName = ((_c = shellPath.split("/").pop()) == null ? void 0 : _c.toLowerCase()) || "";
    if (shellName.includes("ash") || shellName.includes("busybox")) {
      return {
        type: "ash",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // ash is already Unix-like
        targetShell: "ash"
      };
    }
    if (shellName.includes("dash")) {
      return {
        type: "dash",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // dash is already Unix-like
        targetShell: "dash"
      };
    }
    if (shellName.includes("zsh")) {
      return {
        type: "zsh",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // zsh is already Unix-like
        targetShell: "zsh"
      };
    }
    if (shellName.includes("fish")) {
      return {
        type: "fish",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // fish is already Unix-like
        targetShell: "fish"
      };
    }
    if (shellName.includes("ksh")) {
      return {
        type: "ksh",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // ksh is already Unix-like
        targetShell: "ksh"
      };
    }
    if (shellName.includes("tcsh")) {
      return {
        type: "tcsh",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // tcsh is already Unix-like
        targetShell: "tcsh"
      };
    }
    if (shellName.includes("bash")) {
      return {
        type: "bash",
        supportsConditionalConnectors: true,
        needsUnixTranslation: false,
        // bash is already Unix-like
        targetShell: "bash"
      };
    }
  }
  return {
    type: "bash",
    supportsConditionalConnectors: true,
    needsUnixTranslation: false,
    // assume Unix-like environment
    targetShell: "bash"
  };
}
function translateCommand(command, shell) {
  if (shell.needsUnixTranslation) {
    const parts = splitByConnectors(command).map((part) => {
      if (part === "&&" || part === "||") return part;
      const pipeParts = splitByPipe(part);
      const translatedPipeParts = pipeParts.map((segment) => {
        return translateSingleUnixSegmentForShell(segment, shell.targetShell);
      });
      return translatedPipeParts.join(" | ");
    });
    const unixTranslated = parts.join(" ");
    const finalResult = handleBacktickEscapedOperators(unixTranslated);
    if (shell.supportsConditionalConnectors) {
      return finalResult;
    }
    if (shell.type === "powershell") {
      return translateForLegacyPowerShell(finalResult);
    }
    return finalResult;
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
function translateSingleUnixSegmentForShell(segment, targetShell) {
  if (targetShell === "powershell") {
    return translateSingleUnixSegment(segment);
  }
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
  const flagTokens = roleTokens.filter((t) => t.role === "flag").map((t) => t.value);
  const argTokens = roleTokens.filter((t) => t.role === "arg").map((t) => t.value);
  const cmdToken = roleTokens.find((t) => t.role === "cmd");
  if (!cmdToken) return segment;
  const cmd = cmdToken.value;
  return translateForShell(cmd, targetShell, flagTokens, argTokens);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  detectShell,
  lintCommand,
  translateCommand
});
