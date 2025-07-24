import { CommandMapping } from "./unixMappings";

export interface ShellCommandMapping {
  unix: string;
  cmd: string; // CMD equivalent
  ps: string; // PowerShell equivalent
  bash: string; // Bash equivalent (usually same as unix)
  ash: string; // Ash equivalent (usually same as unix)
  dash: string; // Dash equivalent (usually same as unix)
  zsh: string; // Zsh equivalent (usually same as unix)
  fish: string; // Fish equivalent (usually same as unix)
  ksh: string; // Ksh equivalent (usually same as unix)
  tcsh: string; // Tcsh equivalent (usually same as unix)
  flagMap: Record<string, Record<string, string>>; // maps shell -> unix flag -> shell flag
  forceArgs?: boolean;
}

// CMD-specific mappings
const CMD_MAPPINGS: ShellCommandMapping[] = [
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
        "-f": "/q",
      },
      ps: {
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force",
        "-r": "-Recurse",
        "-f": "-Force",
      },
      bash: {
        "-rf": "-rf",
        "-fr": "-fr",
        "-r": "-r",
        "-f": "-f",
      }
    },
    forceArgs: true,
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
        "-l": "",
      },
      ps: {
        "-la": "-Force",
        "-al": "-Force",
        "-a": "-Force",
        "-l": "",
      },
      bash: {
        "-la": "-la",
        "-al": "-al",
        "-a": "-a",
        "-l": "-l",
      }
    },
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
        "-fr": "/s /y",
      },
      ps: {
        "-r": "-Recurse",
        "-R": "-Recurse",
        "-f": "-Force",
        "-rf": "-Recurse -Force",
        "-fr": "-Recurse -Force",
      },
      bash: {
        "-r": "-r",
        "-R": "-R",
        "-f": "-f",
        "-rf": "-rf",
        "-fr": "-fr",
      }
    },
    forceArgs: true,
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
      ps: {},
      bash: {}
    },
    forceArgs: true,
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
        "-p": "",
      },
      ps: {
        "-p": "-Force",
      },
      bash: {
        "-p": "-p",
      }
    },
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
      ps: {},
      bash: {}
    },
    forceArgs: true,
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
        "-v": "/v",
      },
      ps: {
        "-i": "-CaseSensitive:$false",
        "-n": "-LineNumber",
        "-v": "-NotMatch",
      },
      bash: {
        "-i": "-i",
        "-n": "-n",
        "-v": "-v",
      }
    },
    forceArgs: true,
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
      ps: {},
      bash: {}
    },
    forceArgs: false,
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
      ps: {},
      bash: {}
    },
    forceArgs: false,
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
      ps: {},
      bash: {}
    },
    forceArgs: false,
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
    forceArgs: false,
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
    forceArgs: false,
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
    forceArgs: true,
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
    forceArgs: false,
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
        "-9": "/f",
      },
      ps: {
        "-9": "-Force",
      }
    },
    forceArgs: true,
  },
  {
    unix: "wc",
    cmd: "find /c /v \"\"",
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
        "-c": "/c",
      },
      ps: {
        "-l": "-Line",
        "-w": "-Word",
        "-c": "-Character",
      }
    },
    forceArgs: false,
  },
  {
    unix: "head",
    cmd: "powershell -Command \"Get-Content $args | Select-Object -First 10\"",
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
        "-c": "-TotalCount",
      }
    },
    forceArgs: true,
  },
  {
    unix: "tail",
    cmd: "powershell -Command \"Get-Content $args | Select-Object -Last 10\"",
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
        "-f": "-Wait",
      }
    },
    forceArgs: true,
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
        "-a": "/all",
      },
      ps: {
        "-a": "-All",
        "-s": "-Statistics",
      }
    },
    forceArgs: false,
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
        "-e": "-Extended",
      }
    },
    forceArgs: false,
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
        "-w": "-w",
      },
      ps: {
        "-n": "-NoResolve",
        "-w": "-TimeoutSeconds",
      }
    },
    forceArgs: true,
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
        "-p": "-Process",
      }
    },
    forceArgs: false,
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
        "-n": "-Limit",
      }
    },
    forceArgs: true,
  },
  {
    unix: "bzip2",
    cmd: "powershell -Command \"Compress-Archive -Path $args[0] -DestinationPath $args[0].zip -CompressionLevel Optimal\"",
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
        "-f": "-Force",
      }
    },
    forceArgs: true,
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
        "-t": "-Terse",
      }
    },
    forceArgs: true,
  },
  {
    unix: "awk",
    cmd: "powershell -Command \"ForEach-Object { $_.Split() }\"",
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
        "-v": "-Variable",
      }
    },
    forceArgs: true,
  },
  {
    unix: "sed",
    cmd: "powershell -Command \"-replace\"",
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
        "-e": "-Expression",
      }
    },
    forceArgs: true,
  },
  {
    unix: "cut",
    cmd: "powershell -Command \"ForEach-Object { $_.Split()[0] }\"",
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
        "-f": "-Fields",
      }
    },
    forceArgs: true,
  },
  {
    unix: "tr",
    cmd: "powershell -Command \"ForEach-Object { $_.Replace('a','b') }\"",
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
        "-s": "-Squeeze",
      }
    },
    forceArgs: true,
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
        "-u": "-User",
      }
    },
    forceArgs: false,
  },
  {
    unix: "nmap",
    cmd: "powershell -Command \"Test-NetConnection\"",
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
        "-s": "-Scan",
      }
    },
    forceArgs: true,
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
        "-l": "-List",
      }
    },
    forceArgs: true,
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
        "-l": "-List",
      }
    },
    forceArgs: true,
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
        "-t": "-Time",
      }
    },
    forceArgs: true,
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
        "-w": "-Write",
      }
    },
    forceArgs: true,
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
        "-L": "-List",
      }
    },
    forceArgs: true,
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
        "disable": "-Disabled",
      }
    },
    forceArgs: true,
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
        "status": "Get-Service",
      }
    },
    forceArgs: true,
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
        "-t": "-Test",
      }
    },
    forceArgs: true,
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
        "-h": "-Host",
      }
    },
    forceArgs: true,
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
        "-d": "-Database",
      }
    },
    forceArgs: true,
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
        "ps": "ps",
      }
    },
    forceArgs: false,
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
        "delete": "delete",
      }
    },
    forceArgs: false,
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
        "-a": "-Args",
      }
    },
    forceArgs: true,
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
        "apply": "apply",
      }
    },
    forceArgs: false,
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
        "status": "status",
      }
    },
    forceArgs: false,
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
        "generate": "generate",
      }
    },
    forceArgs: true,
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
        "cert": "cert",
      }
    },
    forceArgs: true,
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
        "run": "run",
      }
    },
    forceArgs: true,
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
        "log": "log",
      }
    },
    forceArgs: false,
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
        "status": "status",
      }
    },
    forceArgs: false,
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
        "build": "build",
      }
    },
    forceArgs: false,
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
        "deactivate": "deactivate",
      }
    },
    forceArgs: false,
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
        "dump-autoload": "dump-autoload",
      }
    },
    forceArgs: false,
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
        "assemble": "assemble",
      }
    },
    forceArgs: false,
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
        "clean": "clean",
      }
    },
    forceArgs: false,
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
        "war": "war",
      }
    },
    forceArgs: false,
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
        "build": "build",
      }
    },
    forceArgs: false,
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
        "clean": "clean",
      }
    },
    forceArgs: false,
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
        "-O2": "-O2",
      }
    },
    forceArgs: true,
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
        "-std=c++11": "-std=c++11",
      }
    },
    forceArgs: true,
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
        "-O2": "-O2",
      }
    },
    forceArgs: true,
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
        "-std=c++11": "-std=c++11",
      }
    },
    forceArgs: true,
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
        "-C": "-C",
      }
    },
    forceArgs: true,
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
        "update": "update",
      }
    },
    forceArgs: false,
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
        "mod": "mod",
      }
    },
    forceArgs: false,
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
        "clean": "clean",
      }
    },
    forceArgs: false,
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
        "-verbose": "-verbose",
      }
    },
    forceArgs: true,
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
        "-D": "-D",
      }
    },
    forceArgs: true,
  },
];

// Fish-specific mappings (Fish has different syntax for some commands)
const FISH_MAPPINGS: ShellCommandMapping[] = [
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
    forceArgs: false,
  },
  // Fish uses different syntax for some operations, but most Unix commands work the same
];

export function getShellMapping(unixCommand: string, targetShell: string): ShellCommandMapping | undefined {
  const allMappings = [...CMD_MAPPINGS, ...FISH_MAPPINGS];
  return allMappings.find(m => m.unix === unixCommand);
}

export function translateForShell(
  unixCommand: string, 
  targetShell: string, 
  flagTokens: string[], 
  argTokens: string[]
): string {
  const mapping = getShellMapping(unixCommand, targetShell);
  if (!mapping) {
    // No mapping found, return original command
    return unixCommand;
  }

  // Get the target command for this shell
  const targetCommand = (mapping as any)[targetShell] || unixCommand;
  
  // Get flag mappings for this shell
  const shellFlagMap = mapping.flagMap[targetShell] || {};
  
  // Translate flags
  let translatedFlags = "";
  for (const flag of flagTokens) {
    const mappedFlag = shellFlagMap[flag];
    if (mappedFlag !== undefined) {
      if (mappedFlag) translatedFlags += " " + mappedFlag;
    } else {
      // Unknown flag, preserve original
      translatedFlags += " " + flag;
    }
  }

  // Handle special cases
  if (targetShell === "cmd" && unixCommand === "sleep") {
    // CMD timeout expects seconds, but sleep might be in different units
    const duration = argTokens[0];
    if (duration && /^\d+$/.test(duration)) {
      return `timeout ${duration}`;
    }
  }

  if (targetShell === "cmd" && unixCommand === "pwd") {
    // CMD doesn't have pwd, use cd without args to show current directory
    return "cd";
  }

  // Build final command
  const finalCommand = `${targetCommand}${translatedFlags}`.trim();
  return [finalCommand, ...argTokens].join(" ");
} 