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
    "-delete": "", // handled specially in translation logic
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

const TAR_MAPPING: CommandMapping = {
  unix: "tar",
  ps: "tar", // Use native tar if available, otherwise preserve
  flagMap: {
    "-c": "-c",
    "-x": "-x",
    "-f": "-f",
    "-z": "-z",
    "-j": "-j",
    "-v": "-v",
    "-t": "-t",
  },
  forceArgs: true,
};

const CURL_MAPPING: CommandMapping = {
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
    "-k": "-SkipCertificateCheck",
  },
  forceArgs: true,
};

const WGET_MAPPING: CommandMapping = {
  unix: "wget",
  ps: "Invoke-WebRequest",
  flagMap: {
    "-O": "-OutFile",
    "-o": "-OutFile",
    "-q": "-UseBasicParsing",
    "-c": "-Resume",
    "-r": "-Recurse",
    "-np": "-NoParent",
    "-k": "-ConvertLinks",
  },
  forceArgs: true,
};

const DIFF_MAPPING: CommandMapping = {
  unix: "diff",
  ps: "Compare-Object",
  flagMap: {
    "-u": "-Unified",
    "-r": "-Recurse",
    "-i": "-CaseInsensitive",
    "-w": "-IgnoreWhiteSpace",
    "-B": "-IgnoreBlankLines",
  },
  forceArgs: true,
};

const SPLIT_MAPPING: CommandMapping = {
  unix: "split",
  ps: "Split-Content",
  flagMap: {
    "-l": "-LineCount",
    "-b": "-ByteCount",
    "-n": "-Number",
  },
  forceArgs: true,
};

const PASTE_MAPPING: CommandMapping = {
  unix: "paste",
  ps: "Join-Object",
  flagMap: {
    "-d": "-Delimiter",
    "-s": "-Serial",
  },
  forceArgs: true,
};

const RSYNC_MAPPING: CommandMapping = {
  unix: "rsync",
  ps: "Copy-Item",
  flagMap: {
    "-a": "-Recurse", // archive mode (recursive + preserve attributes)
    "-v": "-Verbose", // verbose
    "-r": "-Recurse", // recursive
    "-u": "-Force", // update (skip newer files)
    "-n": "-WhatIf", // dry run
    "-P": "-PassThru", // progress + partial
  },
  forceArgs: true,
};

const CHMOD_MAPPING: CommandMapping = {
  unix: "chmod",
  ps: "icacls",
  flagMap: {
    "-R": "/T", // recursive
    "-v": "/Q", // verbose (quiet in icacls)
  },
  forceArgs: true,
};

const CHOWN_MAPPING: CommandMapping = {
  unix: "chown",
  ps: "icacls",
  flagMap: {
    "-R": "/T", // recursive
    "-v": "/Q", // verbose (quiet in icacls)
  },
  forceArgs: true,
};

const LN_MAPPING: CommandMapping = {
  unix: "ln",
  ps: "New-Item",
  flagMap: {
    "-s": "-ItemType SymbolicLink", // symbolic link
    "-f": "-Force", // force
    "-v": "-Verbose", // verbose
  },
  forceArgs: true,
};

const DU_MAPPING: CommandMapping = {
  unix: "du",
  ps: "Get-ChildItem",
  flagMap: {
    "-h": "-Recurse", // human readable (handled in translation)
    "-s": "-Recurse", // summarize
    "-a": "-Recurse", // all files
    "-c": "-Recurse", // total
  },
  forceArgs: true,
};

const SYSTEMCTL_MAPPING: CommandMapping = {
  unix: "systemctl",
  ps: "Get-Service", // default fallback
  flagMap: {
    "start": "Start-Service",
    "stop": "Stop-Service", 
    "restart": "Restart-Service",
    "status": "Get-Service",
    "enable": "Set-Service -StartupType Automatic",
    "disable": "Set-Service -StartupType Disabled",
    "reload": "Restart-Service",
  },
  forceArgs: true,
};

const LESS_MAPPING: CommandMapping = {
  unix: "less",
  ps: "Get-Content | Out-Host -Paging",
  flagMap: {
    "-N": "-LineNumber",
    "-M": "", // show more info (handled in translation)
    "-R": "", // raw control chars (handled in translation)
  },
  forceArgs: false,
};

const MORE_MAPPING: CommandMapping = {
  unix: "more",
  ps: "Get-Content | Out-Host -Paging",
  flagMap: {
    "-N": "-LineNumber",
    "-c": "", // clear screen (handled in translation)
    "-p": "", // pattern search (handled in translation)
  },
  forceArgs: false,
};

const PING_MAPPING: CommandMapping = {
  unix: "ping",
  ps: "Test-Connection",
  flagMap: {
    "-c": "-Count",
    "-i": "-Interval",
    "-t": "-TimeoutSeconds",
    "-W": "-TimeoutSeconds",
    "-s": "-BufferSize",
    "-l": "-BufferSize",
  },
  forceArgs: true,
};

const TOP_MAPPING: CommandMapping = {
  unix: "top",
  ps: "Get-Process | Sort-Object CPU -Descending | Select-Object -First 20",
  flagMap: {
    "-n": "-First",
    "-p": "-Id",
    "-u": "-IncludeUserName",
  },
  forceArgs: false,
};

const RMDIR_MAPPING: CommandMapping = {
  unix: "rmdir",
  ps: "Remove-Item -Directory",
  flagMap: {
    "-p": "-Recurse",
    "-v": "-Verbose",
  },
  forceArgs: true,
};

const UPTIME_MAPPING: CommandMapping = {
  unix: "uptime",
  ps: "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime",
  flagMap: {},
  forceArgs: false,
};

const FREE_MAPPING: CommandMapping = {
  unix: "free",
  ps: "Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | Select-Object InstanceName,CookedValue",
  flagMap: {
    "-h": "", // human readable (handled in translation)
    "-m": "", // MB format (handled in translation)
  },
  forceArgs: false,
};

const NL_MAPPING: CommandMapping = {
  unix: "nl",
  ps: "Get-Content | ForEach-Object { $i++; \"$i`t$_\" }",
  flagMap: {
    "-b": "", // body numbering (handled in translation)
    "-n": "", // number format (handled in translation)
  },
  forceArgs: false,
};

const NETSTAT_MAPPING: CommandMapping = {
  unix: "netstat",
  ps: "Get-NetTCPConnection",
  flagMap: {
    "-t": "-State Listen",
    "-u": "-State Listen",
    "-l": "-State Listen",
    "-n": "-State Listen",
    "-a": "-State Listen",
    "-p": "-State Listen",
  },
  forceArgs: false,
};

const SSH_MAPPING: CommandMapping = {
  unix: "ssh",
  ps: "ssh",
  flagMap: {
    "-p": "-p",
    "-i": "-i",
    "-o": "-o",
    "-L": "-L",
    "-D": "-D",
  },
  forceArgs: true,
};

const GZIP_MAPPING: CommandMapping = {
  unix: "gzip",
  ps: "Compress-Archive",
  flagMap: {
    "-d": "-DestinationPath",
    "-r": "-Recurse",
    "-f": "-Force",
    "-v": "-Verbose",
  },
  forceArgs: false,
};

const GUNZIP_MAPPING: CommandMapping = {
  unix: "gunzip",
  ps: "Expand-Archive",
  flagMap: {
    "-f": "-Force",
    "-v": "-Verbose",
    "-l": "-ListOnly",
  },
  forceArgs: false,
};

const JOBS_MAPPING: CommandMapping = {
  unix: "jobs",
  ps: "Get-Job",
  flagMap: {
    "-l": "-IncludeChildJob",
    "-p": "-Id",
    "-r": "-State Running",
    "-s": "-State Stopped",
  },
  forceArgs: false,
};

const BG_MAPPING: CommandMapping = {
  unix: "bg",
  ps: "Resume-Job",
  flagMap: {},
  forceArgs: false,
};

const FG_MAPPING: CommandMapping = {
  unix: "fg",
  ps: "Receive-Job",
  flagMap: {},
  forceArgs: false,
};

const NICE_MAPPING: CommandMapping = {
  unix: "nice",
  ps: "Start-Process",
  flagMap: {
    "-n": "-Priority",
  },
  forceArgs: true,
};

const NOHUP_MAPPING: CommandMapping = {
  unix: "nohup",
  ps: "Start-Process",
  flagMap: {
    "-n": "-NoNewWindow",
  },
  forceArgs: true,
};

const CHGRP_MAPPING: CommandMapping = {
  unix: "chgrp",
  ps: "icacls",
  flagMap: {
    "-R": "/T",
    "-v": "/Q",
  },
  forceArgs: true,
};

const UMASK_MAPPING: CommandMapping = {
  unix: "umask",
  ps: "Get-ChildItem",
  flagMap: {
    "-S": "",
  },
  forceArgs: false,
};

const MKTEMP_MAPPING: CommandMapping = {
  unix: "mktemp",
  ps: "New-TemporaryFile",
  flagMap: {
    "-d": "",
    "-u": "",
  },
  forceArgs: false,
};

const REALPATH_MAPPING: CommandMapping = {
  unix: "realpath",
  ps: "Resolve-Path",
  flagMap: {
    "-q": "-Quiet",
    "-s": "-Relative",
  },
  forceArgs: true,
};

const JOIN_MAPPING: CommandMapping = {
  unix: "join",
  ps: "Join-Object",
  flagMap: {
    "-1": "-JoinProperty",
    "-2": "-MergeProperty",
    "-t": "-Delimiter",
  },
  forceArgs: true,
};

const COMM_MAPPING: CommandMapping = {
  unix: "comm",
  ps: "Compare-Object",
  flagMap: {
    "-1": "-IncludeEqual",
    "-2": "-IncludeEqual",
    "-3": "-IncludeEqual",
  },
  forceArgs: true,
};

const EXPAND_MAPPING: CommandMapping = {
  unix: "expand",
  ps: "Get-Content",
  flagMap: {
    "-t": "-TabSize",
    "-i": "-Initial",
  },
  forceArgs: true,
};

const UNEXPAND_MAPPING: CommandMapping = {
  unix: "unexpand",
  ps: "Get-Content",
  flagMap: {
    "-a": "-All",
    "-t": "-TabSize",
  },
  forceArgs: true,
};

const FOLD_MAPPING: CommandMapping = {
  unix: "fold",
  ps: "Get-Content",
  flagMap: {
    "-b": "-Bytes",
    "-s": "-Spaces",
    "-w": "-Width",
  },
  forceArgs: true,
};

const FMT_MAPPING: CommandMapping = {
  unix: "fmt",
  ps: "Get-Content",
  flagMap: {
    "-w": "-Width",
    "-g": "-Goal",
    "-p": "-Prefix",
  },
  forceArgs: true,
};

const TELNET_MAPPING: CommandMapping = {
  unix: "telnet",
  ps: "Test-NetConnection",
  flagMap: {
    "-p": "-Port",
    "-l": "-LocalAddress",
  },
  forceArgs: true,
};

const NC_MAPPING: CommandMapping = {
  unix: "nc",
  ps: "Test-NetConnection",
  flagMap: {
    "-v": "-Verbose",
    "-w": "-TimeoutSeconds",
    "-l": "-Listen",
    "-p": "-Port",
  },
  forceArgs: true,
};

const DIG_MAPPING: CommandMapping = {
  unix: "dig",
  ps: "Resolve-DnsName",
  flagMap: {
    "+short": "-Type A",
    "+trace": "-Type NS",
    "-x": "-Type PTR",
  },
  forceArgs: true,
};

const NSLOOKUP_MAPPING: CommandMapping = {
  unix: "nslookup",
  ps: "Resolve-DnsName",
  flagMap: {
    "-type": "-Type",
    "-port": "-Port",
    "-server": "-Server",
  },
  forceArgs: true,
};

const MAKE_MAPPING: CommandMapping = {
  unix: "make",
  ps: "make",
  flagMap: {
    "-j": "-j",
    "-f": "-f",
    "-C": "-C",
    "clean": "clean",
    "install": "install",
  },
  forceArgs: false,
};

const GCC_MAPPING: CommandMapping = {
  unix: "gcc",
  ps: "gcc",
  flagMap: {
    "-o": "-o",
    "-c": "-c",
    "-g": "-g",
    "-Wall": "-Wall",
    "-std": "-std",
  },
  forceArgs: true,
};

const GPP_MAPPING: CommandMapping = {
  unix: "g++",
  ps: "g++",
  flagMap: {
    "-o": "-o",
    "-c": "-c",
    "-g": "-g",
    "-Wall": "-Wall",
    "-std": "-std",
  },
  forceArgs: true,
};

const GIT_MAPPING: CommandMapping = {
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
    "checkout": "checkout",
  },
  forceArgs: false,
};

const APT_MAPPING: CommandMapping = {
  unix: "apt",
  ps: "winget",
  flagMap: {
    "install": "install",
    "remove": "uninstall",
    "update": "upgrade",
    "upgrade": "upgrade",
    "search": "search",
    "list": "list",
  },
  forceArgs: false,
};

const APT_GET_MAPPING: CommandMapping = {
  unix: "apt-get",
  ps: "winget",
  flagMap: {
    "install": "install",
    "remove": "uninstall",
    "update": "upgrade",
    "upgrade": "upgrade",
    "search": "search",
    "list": "list",
  },
  forceArgs: false,
};

const YUM_MAPPING: CommandMapping = {
  unix: "yum",
  ps: "winget",
  flagMap: {
    "install": "install",
    "remove": "uninstall",
    "update": "upgrade",
    "upgrade": "upgrade",
    "search": "search",
    "list": "list",
  },
  forceArgs: false,
};

const DNF_MAPPING: CommandMapping = {
  unix: "dnf",
  ps: "winget",
  flagMap: {
    "install": "install",
    "remove": "uninstall",
    "update": "upgrade",
    "upgrade": "upgrade",
    "search": "search",
    "list": "list",
  },
  forceArgs: false,
};

const BREW_MAPPING: CommandMapping = {
  unix: "brew",
  ps: "winget",
  flagMap: {
    "install": "install",
    "uninstall": "uninstall",
    "update": "upgrade",
    "upgrade": "upgrade",
    "search": "search",
    "list": "list",
  },
  forceArgs: false,
};

// System Information & Monitoring
const UNAME_MAPPING: CommandMapping = {
  unix: "uname",
  ps: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory",
  flagMap: {
    "-a": "-a",
    "-r": "-r",
    "-m": "-m",
    "-n": "-n",
    "-p": "-p",
    "-s": "-s",
  },
  forceArgs: false,
};

const ID_MAPPING: CommandMapping = {
  unix: "id",
  ps: "Get-Process -Id $PID | Select-Object ProcessName, Id, UserName",
  flagMap: {
    "-u": "-u",
    "-g": "-g",
    "-G": "-G",
    "-n": "-n",
    "-r": "-r",
  },
  forceArgs: false,
};

const GROUPS_MAPPING: CommandMapping = {
  unix: "groups",
  ps: "Get-LocalGroup | Select-Object Name, Description",
  flagMap: {},
  forceArgs: false,
};

const WHO_MAPPING: CommandMapping = {
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
    "-u": "-u",
  },
  forceArgs: false,
};

const W_MAPPING: CommandMapping = {
  unix: "w",
  ps: "Get-Process | Where-Object {$_.ProcessName -like '*explorer*' -or $_.ProcessName -like '*winlogon*'} | Select-Object ProcessName, Id, UserName, CPU, WorkingSet",
  flagMap: {
    "hide": "-h",
    "noheader": "-s",
    "short": "-s",
    "users": "-u",
  },
  forceArgs: false,
};

// File & Text Operations
const REV_MAPPING: CommandMapping = {
  unix: "rev",
  ps: "Get-Content $args | ForEach-Object { [string]::Join('', ($_.ToCharArray() | Sort-Object -Descending)) }",
  flagMap: {},
  forceArgs: false,
};

const TAC_MAPPING: CommandMapping = {
  unix: "tac",
  ps: "Get-Content $args | Sort-Object -Descending",
  flagMap: {
    "before": "-b",
    "regex": "-r",
    "separator": "-s",
  },
  forceArgs: false,
};

const COLUMN_MAPPING: CommandMapping = {
  unix: "column",
  ps: "Get-Content $args | Format-Table -AutoSize",
  flagMap: {
    "separator": "-s",
    "table": "-t",
    "width": "-w",
  },
  forceArgs: false,
};

const PR_MAPPING: CommandMapping = {
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
    "width": "-w",
  },
  forceArgs: false,
};

const CSPLIT_MAPPING: CommandMapping = {
  unix: "csplit",
  ps: "Get-Content $args | ForEach-Object { if ($_ -match $pattern) { $i++; Set-Content \"split$i.txt\" -Value $_ } }",
  flagMap: {
    "prefix": "-f",
    "digits": "-n",
    "keep": "-k",
    "quiet": "-q",
    "suppress": "-s",
  },
  forceArgs: false,
};

// Advanced Text Processing
const TSORT_MAPPING: CommandMapping = {
  unix: "tsort",
  ps: "Get-Content $args | Sort-Object",
  flagMap: {},
  forceArgs: false,
};

// System Control
const SHUTDOWN_MAPPING: CommandMapping = {
  unix: "shutdown",
  ps: "Stop-Computer",
  flagMap: {
    "halt": "-h",
    "poweroff": "-P",
    "reboot": "-r",
    "cancel": "-c",
    "time": "-t",
  },
  forceArgs: false,
};

const REBOOT_MAPPING: CommandMapping = {
  unix: "reboot",
  ps: "Restart-Computer",
  flagMap: {
    "force": "-f",
    "now": "-n",
  },
  forceArgs: false,
};

const HALT_MAPPING: CommandMapping = {
  unix: "halt",
  ps: "Stop-Computer -Force",
  flagMap: {
    "force": "-f",
    "poweroff": "-p",
    "reboot": "-r",
  },
  forceArgs: false,
};

const POWEROFF_MAPPING: CommandMapping = {
  unix: "poweroff",
  ps: "Stop-Computer -Force",
  flagMap: {
    "force": "-f",
    "halt": "-h",
    "reboot": "-r",
  },
  forceArgs: false,
};

// User Management
const USERADD_MAPPING: CommandMapping = {
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
    "uid": "-u",
  },
  forceArgs: false,
};

const USERDEL_MAPPING: CommandMapping = {
  unix: "userdel",
  ps: "Remove-LocalUser",
  flagMap: {
    "force": "-f",
    "remove": "-r",
  },
  forceArgs: false,
};

const PASSWD_MAPPING: CommandMapping = {
  unix: "passwd",
  ps: "Set-LocalUser -Password (Read-Host -AsSecureString 'Enter new password')",
  flagMap: {
    "delete": "-d",
    "expire": "-e",
    "force": "-f",
    "lock": "-l",
    "unlock": "-u",
  },
  forceArgs: false,
};

const SU_MAPPING: CommandMapping = {
  unix: "su",
  ps: "Start-Process powershell -Verb RunAs",
  flagMap: {
    "command": "-c",
    "login": "-l",
    "preserve": "-p",
    "shell": "-s",
  },
  forceArgs: false,
};

const SUDO_MAPPING: CommandMapping = {
  unix: "sudo",
  ps: "Start-Process powershell -Verb RunAs -ArgumentList",
  flagMap: {
    "command": "-c",
    "login": "-l",
    "preserve": "-p",
    "shell": "-s",
    "user": "-u",
    "group": "-g",
  },
  forceArgs: true,
};

// Network Tools

const TRACEROUTE_MAPPING: CommandMapping = {
  unix: "traceroute",
  ps: "Test-NetConnection -TraceRoute",
  flagMap: {
    "maxhops": "-MaxHops",
    "timeout": "-Timeout",
    "resolve": "-Resolve",
  },
  forceArgs: true,
};

const IFCONFIG_MAPPING: CommandMapping = {
  unix: "ifconfig",
  ps: "Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed",
  flagMap: {
    "all": "-All",
    "up": "-Status Up",
    "down": "-Status Down",
  },
  forceArgs: false,
};

// Process Management
const PKILL_MAPPING: CommandMapping = {
  unix: "pkill",
  ps: "Get-Process | Where-Object {$_.ProcessName -like",
  flagMap: {
    "signal": "-Signal",
    "exact": "-Exact",
    "full": "-Full",
  },
  forceArgs: true,
};

const PGREP_MAPPING: CommandMapping = {
  unix: "pgrep",
  ps: "Get-Process | Where-Object {$_.ProcessName -like",
  flagMap: {
    "list": "-List",
    "full": "-Full",
    "exact": "-Exact",
  },
  forceArgs: true,
};

const KILLALL_MAPPING: CommandMapping = {
  unix: "killall",
  ps: "Get-Process | Where-Object {$_.ProcessName -eq",
  flagMap: {
    "signal": "-Signal",
    "exact": "-Exact",
    "interactive": "-Interactive",
  },
  forceArgs: true,
};

const RENICE_MAPPING: CommandMapping = {
  unix: "renice",
  ps: "Set-ProcessPriority",
  flagMap: {
    "priority": "-Priority",
    "pid": "-Id",
  },
  forceArgs: true,
};

// File System Tools
const MOUNT_MAPPING: CommandMapping = {
  unix: "mount",
  ps: "Get-PSDrive | Where-Object {$_.Provider -like '*FileSystem*'} | Select-Object Name, Root, Used, Free",
  flagMap: {
    "all": "-All",
    "type": "-Type",
    "options": "-Options",
  },
  forceArgs: false,
};

const UMOUNT_MAPPING: CommandMapping = {
  unix: "umount",
  ps: "Remove-PSDrive",
  flagMap: {
    "force": "-Force",
    "all": "-All",
  },
  forceArgs: true,
};

// System Monitoring
const IOSTAT_MAPPING: CommandMapping = {
  unix: "iostat",
  ps: "Get-Counter '\\PhysicalDisk(*)\\% Disk Time' | Select-Object -ExpandProperty CounterSamples | Format-Table InstanceName, CookedValue -AutoSize",
  flagMap: {
    "interval": "-Interval",
    "count": "-Count",
    "all": "-All",
  },
  forceArgs: false,
};

const VMSTAT_MAPPING: CommandMapping = {
  unix: "vmstat",
  ps: "Get-Counter '\\Memory\\*' | Select-Object -ExpandProperty CounterSamples | Format-Table InstanceName, CookedValue -AutoSize",
  flagMap: {
    "interval": "-Interval",
    "count": "-Count",
    "all": "-All",
  },
  forceArgs: false,
};

const SAR_MAPPING: CommandMapping = {
  unix: "sar",
  ps: "Get-Counter '\\Processor(_Total)\\% Processor Time' | Select-Object -ExpandProperty CounterSamples | Format-Table InstanceName, CookedValue, Timestamp -AutoSize",
  flagMap: {
    "interval": "-Interval",
    "count": "-Count",
    "all": "-All",
  },
  forceArgs: false,
};

// Package Management
const PIP_MAPPING: CommandMapping = {
  unix: "pip",
  ps: "python -m pip",
  flagMap: {
    "install": "install",
    "uninstall": "uninstall",
    "list": "list",
    "show": "show",
    "search": "search",
    "upgrade": "upgrade",
  },
  forceArgs: false,
};

const NPM_MAPPING: CommandMapping = {
  unix: "npm",
  ps: "npm",
  flagMap: {
    "install": "install",
    "uninstall": "uninstall",
    "list": "list",
    "search": "search",
    "update": "update",
    "run": "run",
  },
  forceArgs: false,
};

const YARN_MAPPING: CommandMapping = {
  unix: "yarn",
  ps: "yarn",
  flagMap: {
    "add": "add",
    "remove": "remove",
    "list": "list",
    "search": "search",
    "upgrade": "upgrade",
    "run": "run",
  },
  forceArgs: false,
};

const CARGO_MAPPING: CommandMapping = {
  unix: "cargo",
  ps: "cargo",
  flagMap: {
    "build": "build",
    "run": "run",
    "test": "test",
    "check": "check",
    "clean": "clean",
    "update": "update",
  },
  forceArgs: false,
};

// Development Tools
const CMAKE_MAPPING: CommandMapping = {
  unix: "cmake",
  ps: "cmake",
  flagMap: {
    "build": "--build",
    "configure": "--configure",
    "install": "--install",
    "test": "--test",
  },
  forceArgs: false,
};

// Additional System & Network Commands
const ROUTE_MAPPING: CommandMapping = {
  unix: "route",
  ps: "Get-NetRoute",
  flagMap: {
    "add": "Add-NetRoute",
    "delete": "Remove-NetRoute",
    "show": "Get-NetRoute",
    "flush": "Remove-NetRoute -Confirm:$false",
  },
  forceArgs: false,
};

const IWCONFIG_MAPPING: CommandMapping = {
  unix: "iwconfig",
  ps: "Get-NetAdapter | Where-Object {$_.InterfaceDescription -like '*Wireless*'} | Select-Object Name, InterfaceDescription, Status, LinkSpeed",
  flagMap: {
    "all": "-All",
    "up": "-Status Up",
    "down": "-Status Down",
  },
  forceArgs: false,
};

const IWSCAN_MAPPING: CommandMapping = {
  unix: "iwlist",
  ps: "netsh wlan show networks",
  flagMap: {
    "scan": "show networks",
    "essid": "show networks",
    "channel": "show networks",
  },
  forceArgs: false,
};

// File System & Archive Commands
const ZIP_MAPPING: CommandMapping = {
  unix: "zip",
  ps: "Compress-Archive",
  flagMap: {
    "r": "-Recurse",
    "f": "-Force",
    "u": "-Update",
    "d": "-DestinationPath",
  },
  forceArgs: true,
};

const UNZIP_MAPPING: CommandMapping = {
  unix: "unzip",
  ps: "Expand-Archive",
  flagMap: {
    "l": "-ListOnly",
    "o": "-Force",
    "d": "-DestinationPath",
    "q": "-Quiet",
  },
  forceArgs: true,
};

// Process & System Monitoring
const LSOF_MAPPING: CommandMapping = {
  unix: "lsof",
  ps: "Get-Process | ForEach-Object { Get-NetTCPConnection | Where-Object {$_.OwningProcess -eq $_.Id} }",
  flagMap: {
    "i": "-LocalPort",
    "p": "-Id",
    "u": "-UserName",
    "c": "-ProcessName",
  },
  forceArgs: false,
};

const STrace_MAPPING: CommandMapping = {
  unix: "strace",
  ps: "Start-Process -FilePath",
  flagMap: {
    "f": "-NoNewWindow",
    "o": "-RedirectStandardOutput",
    "e": "-RedirectStandardError",
  },
  forceArgs: true,
};

// Text Processing & Search
const LOCATE_MAPPING: CommandMapping = {
  unix: "locate",
  ps: "Get-ChildItem -Recurse -Filter",
  flagMap: {
    "i": "-CaseSensitive:$false",
    "n": "-First",
    "l": "-First",
    "c": "-Count",
  },
  forceArgs: true,
};

const UPDATEDB_MAPPING: CommandMapping = {
  unix: "updatedb",
  ps: "Get-ChildItem -Recurse | ForEach-Object { $_.FullName } | Out-File -FilePath $env:TEMP\\locate.db -Encoding UTF8",
  flagMap: {
    "v": "-Verbose",
    "o": "-OutputFile",
    "U": "-Path",
  },
  forceArgs: false,
};

// Network & Connectivity
const TRACEPATH_MAPPING: CommandMapping = {
  unix: "tracepath",
  ps: "Test-NetConnection -TraceRoute",
  flagMap: {
    "n": "-ResolveDns:$false",
    "b": "-ResolveDns",
    "l": "-MaxHops",
    "m": "-MaxHops",
  },
  forceArgs: true,
};

const MTR_MAPPING: CommandMapping = {
  unix: "mtr",
  ps: "Test-NetConnection -TraceRoute -InformationLevel Detailed",
  flagMap: {
    "n": "-ResolveDns:$false",
    "r": "-ResolveDns",
    "c": "-Count",
    "i": "-Interval",
  },
  forceArgs: true,
};

// File System & Archives
const BZIP2_MAPPING: CommandMapping = {
  unix: "bzip2",
  ps: "Compress-Archive -CompressionLevel Optimal",
  flagMap: {
    "d": "-Decompress",
    "k": "-KeepOriginal",
    "v": "-Verbose",
    "f": "-Force",
  },
  forceArgs: true,
};

const BUNZIP2_MAPPING: CommandMapping = {
  unix: "bunzip2",
  ps: "Expand-Archive",
  flagMap: {
    "k": "-KeepOriginal",
    "v": "-Verbose",
    "f": "-Force",
  },
  forceArgs: true,
};

// Text Processing
const WC_MAPPING: CommandMapping = {
  unix: "wc",
  ps: "Get-Content | Measure-Object -Line -Word -Character",
  flagMap: {
    "l": "-Line",
    "w": "-Word",
    "c": "-Character",
    "m": "-Character",
    "L": "-Maximum",
  },
  forceArgs: true,
};

const HEAD_MAPPING: CommandMapping = {
  unix: "head",
  ps: "Get-Content | Select-Object -First",
  flagMap: {
    "n": "-First",
    "c": "-TotalCount",
    "q": "-Quiet",
    "v": "-Verbose",
  },
  forceArgs: true,
};

const TAIL_MAPPING: CommandMapping = {
  unix: "tail",
  ps: "Get-Content | Select-Object -Last",
  flagMap: {
    "n": "-Last",
    "c": "-TotalCount",
    "f": "-Wait",
    "q": "-Quiet",
  },
  forceArgs: true,
};

// System Information
const LSB_RELEASE_MAPPING: CommandMapping = {
  unix: "lsb_release",
  ps: "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, WindowsBuildLabEx",
  flagMap: {
    "a": "-All",
    "d": "-Description",
    "r": "-Release",
    "c": "-Codename",
  },
  forceArgs: false,
};

const DMESG_MAPPING: CommandMapping = {
  unix: "dmesg",
  ps: "Get-WinEvent -LogName System | Where-Object {$_.TimeCreated -gt (Get-Date).AddHours(-1)} | Format-Table TimeCreated, Message -AutoSize",
  flagMap: {
    "T": "-Format",
    "r": "-Raw",
    "k": "-Kernel",
    "x": "-Extended",
  },
  forceArgs: false,
};

const BASE_MAPPINGS: CommandMapping[] = [
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
  MOUNT_MAPPING,
  UMOUNT_MAPPING,
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
];

const EXTRA_MAPPINGS: CommandMapping[] = [];

export function addExtraMappings(maps: CommandMapping[]) {
  for (const m of maps) {
    // naive de-dup: skip if unix name already exists in base or extra
    if (BASE_MAPPINGS.some((x) => x.unix === m.unix) || EXTRA_MAPPINGS.some((x) => x.unix === m.unix)) continue;
    EXTRA_MAPPINGS.push(m);
  }
}

export const MAPPINGS: CommandMapping[] = [...BASE_MAPPINGS, ...EXTRA_MAPPINGS];

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
    // Case 1: tokens split as "$", "{", ...
    if (tokens[i] === "$" && i + 1 < tokens.length && tokens[i + 1].startsWith("{")) {
      let combined = tokens[i] + tokens[i + 1];
      let j = i + 1;
      let braceDepth = 1;
      while (braceDepth > 0 && j + 1 < tokens.length) {
        j++;
        const token = tokens[j];
        combined += token;
        // Count braces to handle nested constructs like ${VAR:-${DEFAULT}}
        for (const char of token) {
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
        }
      }
      out.push(combined);
      i = j;
      continue;
    }
    // Case 2: token already starts with '${'
    if (tokens[i].startsWith("${")) {
      let combined = tokens[i];
      let j = i;
      let braceDepth = 1;
      // Count opening braces in the first token
      for (const char of combined) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
      }
      while (braceDepth > 0 && j + 1 < tokens.length) {
        j++;
        const token = tokens[j];
        combined += token;
        // Count braces in subsequent tokens
        for (const char of token) {
          if (char === '{') braceDepth++;
          if (char === '}') braceDepth--;
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

function mergeHereDocs(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    // Handle here-document syntax: << 'EOF'
    if (tokens[i] === "<" && i + 1 < tokens.length && tokens[i + 1] === "<") {
      let combined = tokens[i] + tokens[i + 1];
      let j = i + 1;
      
      // Look for the delimiter (e.g., 'EOF', EOF)
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

function mergeProcessSubs(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    // Handle process substitution: <(command)
    if (tokens[i] === "<" && i + 1 < tokens.length && tokens[i + 1] === "(") {
      let combined = tokens[i] + tokens[i + 1];
      let j = i + 1;
      let parenDepth = 1;
      
      while (parenDepth > 0 && j + 1 < tokens.length) {
        j++;
        const token = tokens[j];
        combined += token;
        for (const char of token) {
          if (char === '(') parenDepth++;
          if (char === ')') parenDepth--;
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

// Wrap previous smartJoin merging with command substitution merge first
const originalSmartJoin = smartJoin;
function smartJoinEnhanced(tokens: string[]): string {
  const mergedSubs = mergeProcessSubs(mergeHereDocs(mergeCommandSubs(mergeEnvExp(tokens))));
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

  // rsync -av (local file synchronization)
  if (cmd === "rsync") {
    const hasArchive = earlyFlagTokens.includes("-a") || earlyFlagTokens.includes("-av");
    const hasVerbose = earlyFlagTokens.includes("-v");
    const hasRecurse = earlyFlagTokens.includes("-r");
    
    if (hasArchive || hasRecurse) {
      const targetArgs = earlyArgTokens;
      return smartJoinEnhanced(["Copy-Item", "-Recurse", ...targetArgs]);
    }
    
    // For remote rsync, preserve the command
    return segment;
  }

  // du - disk usage
  if (cmd === "du") {
    const hasHuman = earlyFlagTokens.includes("-h");
    const hasSummarize = earlyFlagTokens.includes("-s");
    const targetArgs = earlyArgTokens;
    
    if (hasSummarize) {
      // du -sh directory/ -> Get-ChildItem -Recurse | Measure-Object -Property Length -Sum
      return smartJoinEnhanced([
        "Get-ChildItem", "-Recurse", ...targetArgs, "|", 
        "Measure-Object", "-Property", "Length", "-Sum"
      ]);
    } else if (hasHuman) {
      // du -h file.txt -> Get-Item file.txt | Select-Object Name, @{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}}
      return smartJoinEnhanced([
        "Get-Item", ...targetArgs, "|", 
        "Select-Object", "Name,", "@{Name='Size(MB)';Expression={[math]::Round($_.Length/1MB,2)}}"
      ]);
    }
    
    return smartJoinEnhanced(["Get-ChildItem", "-Recurse", ...targetArgs, "|", "Measure-Object", "-Property", "Length", "-Sum"]);
  }

  // systemctl - service management
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

  // chmod - file permissions
  if (cmd === "chmod") {
    const mode = tokens[1];
    const targetArgs = earlyArgTokens;
    
    if (mode && /^\d{3,4}$/.test(mode)) {
      // Convert numeric mode to icacls format
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

  // chown - ownership
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

  // ln - links
  if (cmd === "ln") {
    const hasSymbolic = earlyFlagTokens.includes("-s");
    const targetArgs = earlyArgTokens;
    
    if (hasSymbolic) {
      return smartJoinEnhanced(["New-Item", "-ItemType", "SymbolicLink", "-Target", targetArgs[0], "-Name", targetArgs[1]]);
    } else {
      // Hard link
      return smartJoinEnhanced(["New-Item", "-ItemType", "HardLink", "-Target", targetArgs[0], "-Name", targetArgs[1]]);
    }
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

  // less/more - file viewing with pagination
  if (cmd === "less" || cmd === "more") {
    const restArgs = earlyArgTokens;
    const hasLineNumbers = earlyFlagTokens.includes("-N");
    const psPart = hasLineNumbers ? 
      "Get-Content | ForEach-Object { $i++; \"$i`t$_\" } | Out-Host -Paging" :
      "Get-Content | Out-Host -Paging";
    return smartJoinEnhanced([psPart, ...restArgs]);
  }

  // ping - network connectivity testing
  if (cmd === "ping") {
    const target = earlyArgTokens[0];
    if (!target) return segment;
    
    const count = earlyFlagTokens.includes("-c") ? 
      tokens[tokens.indexOf("-c") + 1] || "4" : "4";
    const interval = earlyFlagTokens.includes("-i") ? 
      tokens[tokens.indexOf("-i") + 1] || "1" : "1";
    
    return `Test-Connection -ComputerName ${target} -Count ${count} -Delay ${interval}`;
  }

  // top - process monitoring
  if (cmd === "top") {
    const count = earlyFlagTokens.includes("-n") ? 
      tokens[tokens.indexOf("-n") + 1] || "20" : "20";
    const processId = earlyFlagTokens.includes("-p") ? 
      tokens[tokens.indexOf("-p") + 1] : undefined;
    
    if (processId) {
      return `Get-Process -Id ${processId} | Select-Object Id,ProcessName,CPU,WorkingSet,PrivateMemorySize`;
    } else {
      return `Get-Process | Sort-Object CPU -Descending | Select-Object -First ${count} | Format-Table Id,ProcessName,CPU,WorkingSet,PrivateMemorySize -AutoSize`;
    }
  }

  // rmdir - remove directories
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

  // uptime - system uptime
  if (cmd === "uptime") {
    return "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | ForEach-Object { \"Uptime: $($_.Days) days, $($_.Hours) hours, $($_.Minutes) minutes\" }";
  }

  // free - memory usage
  if (cmd === "free") {
    const isHumanReadable = earlyFlagTokens.includes("-h");
    const isMB = earlyFlagTokens.includes("-m");
    
    if (isHumanReadable || isMB) {
      return "Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | ForEach-Object { \"Available Memory: $([math]::Round($_.CookedValue, 2)) MB\" }";
    } else {
      return "Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | Select-Object InstanceName,CookedValue";
    }
  }

  // nl - number lines
  if (cmd === "nl") {
    const restArgs = earlyArgTokens;
    if (restArgs.length > 0) {
      return `Get-Content ${restArgs.join(' ')} | ForEach-Object { $i++; "$i\t$_" }`;
    } else {
      return "Get-Content | ForEach-Object { $i++; \"$i\t$_\" }";
    }
  }

  // sudo - run command with elevated privileges
  if (cmd === "sudo") {
    const restArgs = earlyArgTokens;
    if (restArgs.length > 0) {
      // For sudo, we need to translate the command that follows it
      const subCommand = restArgs[0];
      const subArgs = restArgs.slice(1);
      
      // Recursively translate the sub-command
      const translatedSubCommand = translateSingleUnixSegment([subCommand, ...subArgs].join(' '));
      
      // Wrap in Start-Process with elevated privileges
      return `Start-Process powershell -Verb RunAs -ArgumentList "-Command", "${translatedSubCommand}"`;
    }
    return segment;
  }

  // netstat - network statistics
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

  // gzip - compress files
  if (cmd === "gzip") {
    const hasDecompress = earlyFlagTokens.includes("-d");
    const hasRecurse = earlyFlagTokens.includes("-r");
    const hasForce = earlyFlagTokens.includes("-f");
    const targetArgs = earlyArgTokens;
    
    if (hasDecompress) {
      // gunzip behavior
      if (targetArgs.length > 0) {
        return `Expand-Archive -Path ${targetArgs.join(' ')} -DestinationPath . -Force`;
      }
    } else {
      // compress behavior
      if (targetArgs.length > 0) {
        const forceFlag = hasForce ? "-Force" : "";
        return `Compress-Archive -Path ${targetArgs.join(' ')} -DestinationPath ${targetArgs[0]}.zip ${forceFlag}`;
      }
    }
  }

  // gunzip - decompress files
  if (cmd === "gunzip") {
    const hasForce = earlyFlagTokens.includes("-f");
    const hasList = earlyFlagTokens.includes("-l");
    const targetArgs = earlyArgTokens;
    
    if (hasList) {
      return `Get-ChildItem ${targetArgs.join(' ')} | ForEach-Object { Write-Host "Archive: $($_.Name)" }`;
    } else if (targetArgs.length > 0) {
      const forceFlag = hasForce ? "-Force" : "";
      return `Expand-Archive -Path ${targetArgs.join(' ')} -DestinationPath . ${forceFlag}`;
    }
  }

  // mktemp - create temporary files/directories
  if (cmd === "mktemp") {
    const hasDirectory = earlyFlagTokens.includes("-d");
    const targetArgs = earlyArgTokens;
    
    if (hasDirectory) {
      return `New-Item -ItemType Directory -Path $env:TEMP -Name ([System.IO.Path]::GetRandomFileName())`;
    } else {
      return `New-TemporaryFile`;
    }
  }

  // dig - DNS lookup
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
  // -----------------------------

  // -----------------------------
  // Static table-driven mappings
  // -----------------------------

  const mapping = [...BASE_MAPPINGS, ...EXTRA_MAPPINGS].find((m) => m.unix === cmd);
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

  // Strip quotes from arguments for most commands (but preserve for shell constructs)
  const stripQuote = (s: string) => (s.startsWith("'") || s.startsWith("\"") ? s.slice(1, -1) : s);
  const processedArgTokens = argTokens.map(stripQuote);

  const psCommand = `${mapping.ps}${psFlags}`.trim();
  return smartJoinEnhanced([psCommand, ...processedArgTokens]);
} 