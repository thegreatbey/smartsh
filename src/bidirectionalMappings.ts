export interface BidirectionalMapping {
  // Source commands
  unix: string;
  powershell: string;
  cmd: string;
  
  // Flag mappings for each direction
  flagMappings: {
    unix: Record<string, string>;      // Unix flags → other shells
    powershell: Record<string, string>; // PowerShell flags → other shells
    cmd: Record<string, string>;       // CMD flags → other shells
  };
  
  forceArgs?: boolean;
}

// PowerShell → Unix mappings
const POWERSHELL_TO_UNIX_MAPPINGS: BidirectionalMapping[] = [
  // File Operations
  {
    unix: "rm",
    powershell: "Remove-Item",
    cmd: "del",
    flagMappings: {
      unix: {
        "-rf": "-rf",
        "-fr": "-fr",
        "-r": "-r",
        "-f": "-f",
      },
      powershell: {
        "-Recurse -Force": "-rf",
        "-Force -Recurse": "-rf",
        "-Recurse": "-r",
        "-Force": "-f",
      },
      cmd: {
        "/s /q": "-rf",
        "/q /s": "-rf",
        "/s": "-r",
        "/q": "-f",
      }
    },
    forceArgs: true,
  },
  {
    unix: "ls",
    powershell: "Get-ChildItem",
    cmd: "dir",
    flagMappings: {
      unix: {
        "-la": "-la",
        "-al": "-al",
        "-a": "-a",
        "-l": "-l",
      },
      powershell: {
        "-Force": "-la",
        "": "-l",
      },
      cmd: {
        "/a": "-la",
        "": "-l",
      }
    },
  },
  {
    unix: "cp",
    powershell: "Copy-Item",
    cmd: "copy",
    flagMappings: {
      unix: {
        "-r": "-r",
        "-R": "-R",
        "-f": "-f",
        "-rf": "-rf",
        "-fr": "-fr",
      },
      powershell: {
        "-Recurse": "-r",
        "-Force": "-f",
        "-Recurse -Force": "-rf",
        "-Force -Recurse": "-rf",
      },
      cmd: {
        "/s": "-r",
        "/y": "-f",
        "/s /y": "-rf",
        "/y /s": "-rf",
      }
    },
    forceArgs: true,
  },
  {
    unix: "mv",
    powershell: "Move-Item",
    cmd: "move",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "mkdir",
    powershell: "New-Item -ItemType Directory",
    cmd: "md",
    flagMappings: {
      unix: {
        "-p": "-p",
      },
      powershell: {
        "-Force": "-p",
      },
      cmd: {
        "": "-p",
      }
    },
  },
  {
    unix: "cat",
    powershell: "Get-Content",
    cmd: "type",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "grep",
    powershell: "Select-String",
    cmd: "findstr",
    flagMappings: {
      unix: {
        "-i": "-i",
        "-n": "-n",
        "-v": "-v",
      },
      powershell: {
        "-CaseSensitive:$false": "-i",
        "-LineNumber": "-n",
        "-NotMatch": "-v",
      },
      cmd: {
        "/i": "-i",
        "/n": "-n",
        "/v": "-v",
      }
    },
    forceArgs: true,
  },
  {
    unix: "pwd",
    powershell: "Get-Location",
    cmd: "cd",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "clear",
    powershell: "Clear-Host",
    cmd: "cls",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "whoami",
    powershell: "$env:USERNAME",
    cmd: "echo %USERNAME%",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "hostname",
    powershell: "$env:COMPUTERNAME",
    cmd: "echo %COMPUTERNAME%",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "echo",
    powershell: "Write-Host",
    cmd: "echo",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "sleep",
    powershell: "Start-Sleep",
    cmd: "timeout",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "ps",
    powershell: "Get-Process",
    cmd: "tasklist",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "kill",
    powershell: "Stop-Process",
    cmd: "taskkill",
    flagMappings: {
      unix: {
        "-9": "-9",
      },
      powershell: {
        "-Force": "-9",
      },
      cmd: {
        "/f": "-9",
      }
    },
    forceArgs: true,
  },
  {
    unix: "touch",
    powershell: "New-Item -ItemType File",
    cmd: "type nul >",
    flagMappings: {
      unix: {
        "-a": "-a",
        "-m": "-m",
        "-c": "-c",
      },
      powershell: {
        "-AccessTime": "-a",
        "-ModifyTime": "-m",
        "-NoCreate": "-c",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "which",
    powershell: "Get-Command",
    cmd: "where",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "find",
    powershell: "Get-ChildItem -Recurse",
    cmd: "dir /s",
    flagMappings: {
      unix: {
        "-name": "-name",
        "-type": "-type",
        "-delete": "-delete",
      },
      powershell: {
        "-Filter": "-name",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "df",
    powershell: "Get-PSDrive",
    cmd: "dir",
    flagMappings: {
      unix: {
        "-h": "-h",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "dirname",
    powershell: "Split-Path -Parent",
    cmd: "cd",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "basename",
    powershell: "Split-Path -Leaf",
    cmd: "echo",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "tee",
    powershell: "Tee-Object",
    cmd: "tee",
    flagMappings: {
      unix: {
        "-a": "-a",
      },
      powershell: {
        "-Append": "-a",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "tar",
    powershell: "Compress-Archive",
    cmd: "tar",
    flagMappings: {
      unix: {
        "-c": "-c",
        "-x": "-x",
        "-f": "-f",
        "-z": "-z",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "curl",
    powershell: "Invoke-WebRequest",
    cmd: "curl",
    flagMappings: {
      unix: {
        "-o": "-o",
        "-O": "-O",
        "-s": "-s",
      },
      powershell: {
        "-OutFile": "-o",
        "-Silent": "-s",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "wget",
    powershell: "Invoke-WebRequest",
    cmd: "wget",
    flagMappings: {
      unix: {
        "-O": "-O",
        "-q": "-q",
      },
      powershell: {
        "-OutFile": "-O",
        "-Quiet": "-q",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "diff",
    powershell: "Compare-Object",
    cmd: "fc",
    flagMappings: {
      unix: {
        "-u": "-u",
        "-r": "-r",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "split",
    powershell: "Split-Content",
    cmd: "split",
    flagMappings: {
      unix: {
        "-l": "-l",
        "-b": "-b",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "paste",
    powershell: "Join-Object",
    cmd: "paste",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "rsync",
    powershell: "Copy-Item -Recurse",
    cmd: "xcopy",
    flagMappings: {
      unix: {
        "-a": "-a",
        "-v": "-v",
        "-z": "-z",
      },
      powershell: {
        "-Verbose": "-v",
      },
      cmd: {
        "/e": "-a",
        "/v": "-v",
      }
    },
    forceArgs: true,
  },
  {
    unix: "chmod",
    powershell: "Set-Acl",
    cmd: "icacls",
    flagMappings: {
      unix: {
        "+x": "+x",
        "-x": "-x",
        "755": "755",
        "644": "644",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "chown",
    powershell: "Set-Acl",
    cmd: "takeown",
    flagMappings: {
      unix: {
        "-R": "-R",
      },
      powershell: {
        "-Recurse": "-R",
      },
      cmd: {
        "/r": "-R",
      }
    },
    forceArgs: true,
  },
  {
    unix: "ln",
    powershell: "New-Item -ItemType SymbolicLink",
    cmd: "mklink",
    flagMappings: {
      unix: {
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "du",
    powershell: "Get-ChildItem -Recurse | Measure-Object -Property Length -Sum",
    cmd: "dir /s",
    flagMappings: {
      unix: {
        "-h": "-h",
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "stat",
    powershell: "Get-ItemProperty",
    cmd: "dir",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-t": "-t",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  // Text Processing Commands
  {
    unix: "wc",
    powershell: "Measure-Object -Line",
    cmd: "find /c /v",
    flagMappings: {
      unix: {
        "-l": "-l",
        "-w": "-w",
        "-c": "-c",
      },
      powershell: {
        "-Line": "-l",
        "-Word": "-w",
        "-Character": "-c",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "head",
    powershell: "Select-Object -First",
    cmd: "head",
    flagMappings: {
      unix: {
        "-n": "-n",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "tail",
    powershell: "Select-Object -Last",
    cmd: "tail",
    flagMappings: {
      unix: {
        "-n": "-n",
        "-f": "-f",
      },
      powershell: {
        "-Wait": "-f",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "sort",
    powershell: "Sort-Object",
    cmd: "sort",
    flagMappings: {
      unix: {
        "-n": "-n",
        "-r": "-r",
        "-u": "-u",
      },
      powershell: {
        "-NumericSort": "-n",
        "-Descending": "-r",
        "-Unique": "-u",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "uniq",
    powershell: "Select-Object -Unique",
    cmd: "uniq",
    flagMappings: {
      unix: {
        "-c": "-c",
        "-d": "-d",
        "-u": "-u",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "awk",
    powershell: "ForEach-Object",
    cmd: "awk",
    flagMappings: {
      unix: {
        "-F": "-F",
        "-v": "-v",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "sed",
    powershell: "ForEach-Object",
    cmd: "sed",
    flagMappings: {
      unix: {
        "-n": "-n",
        "-i": "-i",
        "-e": "-e",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "cut",
    powershell: "ForEach-Object",
    cmd: "cut",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-f": "-f",
        "-c": "-c",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "tr",
    powershell: "ForEach-Object",
    cmd: "tr",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-s": "-s",
        "-c": "-c",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "nl",
    powershell: "ForEach-Object",
    cmd: "nl",
    flagMappings: {
      unix: {
        "-b": "-b",
        "-n": "-n",
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "join",
    powershell: "Join-Object",
    cmd: "join",
    flagMappings: {
      unix: {
        "-t": "-t",
        "-1": "-1",
        "-2": "-2",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "comm",
    powershell: "Compare-Object",
    cmd: "comm",
    flagMappings: {
      unix: {
        "-1": "-1",
        "-2": "-2",
        "-3": "-3",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "expand",
    powershell: "ForEach-Object",
    cmd: "expand",
    flagMappings: {
      unix: {
        "-t": "-t",
        "-i": "-i",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "unexpand",
    powershell: "ForEach-Object",
    cmd: "unexpand",
    flagMappings: {
      unix: {
        "-t": "-t",
        "-a": "-a",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "fold",
    powershell: "ForEach-Object",
    cmd: "fold",
    flagMappings: {
      unix: {
        "-w": "-w",
        "-s": "-s",
        "-b": "-b",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "fmt",
    powershell: "ForEach-Object",
    cmd: "fmt",
    flagMappings: {
      unix: {
        "-w": "-w",
        "-u": "-u",
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "rev",
    powershell: "ForEach-Object",
    cmd: "rev",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "tac",
    powershell: "Get-Content | Sort-Object -Descending",
    cmd: "tac",
    flagMappings: {
      unix: {
        "-r": "-r",
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "column",
    powershell: "Format-Table",
    cmd: "column",
    flagMappings: {
      unix: {
        "-t": "-t",
        "-s": "-s",
        "-n": "-n",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "pr",
    powershell: "Format-List",
    cmd: "pr",
    flagMappings: {
      unix: {
        "-h": "-h",
        "-l": "-l",
        "-w": "-w",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "csplit",
    powershell: "Split-Content",
    cmd: "csplit",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-n": "-n",
        "-k": "-k",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "tsort",
    powershell: "Sort-Object",
    cmd: "tsort",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  // Network Tools
  {
    unix: "ping",
    powershell: "Test-Connection",
    cmd: "ping",
    flagMappings: {
      unix: {
        "-c": "-c",
        "-i": "-i",
        "-s": "-s",
        "-t": "-t",
      },
      powershell: {
        "-Count": "-c",
        "-IntervalSeconds": "-i",
        "-BufferSize": "-s",
        "-TimeoutSeconds": "-t",
      },
      cmd: {
        "-n": "-c",
        "-w": "-t",
      }
    },
    forceArgs: true,
  },
  {
    unix: "ssh",
    powershell: "ssh",
    cmd: "ssh",
    flagMappings: {
      unix: {
        "-p": "-p",
        "-i": "-i",
        "-X": "-X",
        "-Y": "-Y",
      },
      powershell: {
        "-p": "-p",
        "-i": "-i",
      },
      cmd: {
        "-p": "-p",
        "-i": "-i",
      }
    },
    forceArgs: true,
  },
  {
    unix: "telnet",
    powershell: "telnet",
    cmd: "telnet",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "nc",
    powershell: "netcat",
    cmd: "nc",
    flagMappings: {
      unix: {
        "-l": "-l",
        "-p": "-p",
        "-u": "-u",
        "-v": "-v",
      },
      powershell: {
        "-Listen": "-l",
        "-Port": "-p",
        "-UDP": "-u",
        "-Verbose": "-v",
      },
      cmd: {
        "-l": "-l",
        "-p": "-p",
        "-u": "-u",
      }
    },
    forceArgs: true,
  },
  {
    unix: "dig",
    powershell: "Resolve-DnsName",
    cmd: "nslookup",
    flagMappings: {
      unix: {
        "+short": "+short",
        "+trace": "+trace",
        "@": "@",
      },
      powershell: {
        "-Type": "",
        "-Server": "@",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "netstat",
    powershell: "Get-NetTCPConnection",
    cmd: "netstat",
    flagMappings: {
      unix: {
        "-t": "-t",
        "-u": "-u",
        "-l": "-l",
        "-p": "-p",
        "-n": "-n",
      },
      powershell: {
        "-State": "",
        "-LocalPort": "-p",
      },
      cmd: {
        "-a": "-a",
        "-n": "-n",
        "-p": "-p",
      }
    },
    forceArgs: false,
  },
  {
    unix: "ifconfig",
    powershell: "Get-NetAdapter",
    cmd: "ipconfig",
    flagMappings: {
      unix: {
        "-a": "-a",
        "-s": "-s",
      },
      powershell: {
        "-InterfaceIndex": "",
        "-Name": "",
      },
      cmd: {
        "/all": "-a",
      }
    },
    forceArgs: false,
  },
  {
    unix: "route",
    powershell: "Get-NetRoute",
    cmd: "route",
    flagMappings: {
      unix: {
        "-n": "-n",
        "-A": "-A",
        "add": "add",
        "del": "del",
      },
      powershell: {
        "-AddressFamily": "-A",
      },
      cmd: {
        "print": "print",
        "add": "add",
        "delete": "del",
      }
    },
    forceArgs: false,
  },
  {
    unix: "traceroute",
    powershell: "Test-NetConnection",
    cmd: "tracert",
    flagMappings: {
      unix: {
        "-n": "-n",
        "-I": "-I",
        "-T": "-T",
      },
      powershell: {
        "-TraceRoute": "",
        "-InformationLevel": "",
      },
      cmd: {
        "-d": "-n",
        "-h": "-h",
      }
    },
    forceArgs: true,
  },
  {
    unix: "nmap",
    powershell: "nmap",
    cmd: "nmap",
    flagMappings: {
      unix: {
        "-sS": "-sS",
        "-sU": "-sU",
        "-p": "-p",
        "-A": "-A",
        "-v": "-v",
      },
      powershell: {
        "-sS": "-sS",
        "-sU": "-sU",
        "-p": "-p",
        "-A": "-A",
        "-v": "-v",
      },
      cmd: {
        "-sS": "-sS",
        "-sU": "-sU",
        "-p": "-p",
        "-A": "-A",
        "-v": "-v",
      }
    },
    forceArgs: true,
  },
  // Package Managers
  {
    unix: "apt",
    powershell: "apt",
    cmd: "apt",
    flagMappings: {
      unix: {
        "update": "update",
        "upgrade": "upgrade",
        "install": "install",
        "remove": "remove",
        "search": "search",
        "list": "list",
      },
      powershell: {
        "update": "update",
        "upgrade": "upgrade",
        "install": "install",
        "remove": "remove",
        "search": "search",
        "list": "list",
      },
      cmd: {
        "update": "update",
        "upgrade": "upgrade",
        "install": "install",
        "remove": "remove",
        "search": "search",
        "list": "list",
      }
    },
    forceArgs: true,
  },
  {
    unix: "apt-get",
    powershell: "apt-get",
    cmd: "apt-get",
    flagMappings: {
      unix: {
        "update": "update",
        "upgrade": "upgrade",
        "install": "install",
        "remove": "remove",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      },
      powershell: {
        "update": "update",
        "upgrade": "upgrade",
        "install": "install",
        "remove": "remove",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      },
      cmd: {
        "update": "update",
        "upgrade": "upgrade",
        "install": "install",
        "remove": "remove",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      }
    },
    forceArgs: true,
  },
  {
    unix: "yum",
    powershell: "yum",
    cmd: "yum",
    flagMappings: {
      unix: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      },
      powershell: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      },
      cmd: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      }
    },
    forceArgs: true,
  },
  {
    unix: "dnf",
    powershell: "dnf",
    cmd: "dnf",
    flagMappings: {
      unix: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      },
      powershell: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      },
      cmd: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "search": "search",
        "list": "list",
        "-y": "-y",
        "-q": "-q",
      }
    },
    forceArgs: true,
  },
  {
    unix: "brew",
    powershell: "brew",
    cmd: "brew",
    flagMappings: {
      unix: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "upgrade": "upgrade",
      },
      powershell: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "upgrade": "upgrade",
      },
      cmd: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "upgrade": "upgrade",
      }
    },
    forceArgs: true,
  },
  {
    unix: "npm",
    powershell: "npm",
    cmd: "npm",
    flagMappings: {
      unix: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "run": "run",
        "init": "init",
        "-g": "-g",
        "--save": "--save",
        "--save-dev": "--save-dev",
      },
      powershell: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "run": "run",
        "init": "init",
        "-g": "-g",
        "--save": "--save",
        "--save-dev": "--save-dev",
      },
      cmd: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "run": "run",
        "init": "init",
        "-g": "-g",
        "--save": "--save",
        "--save-dev": "--save-dev",
      }
    },
    forceArgs: true,
  },
  {
    unix: "pnpm",
    powershell: "pnpm",
    cmd: "pnpm",
    flagMappings: {
      unix: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "run": "run",
        "init": "init",
        "-g": "-g",
        "--save": "--save",
        "--save-dev": "--save-dev",
      },
      powershell: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "run": "run",
        "init": "init",
        "-g": "-g",
        "--save": "--save",
        "--save-dev": "--save-dev",
      },
      cmd: {
        "install": "install",
        "uninstall": "uninstall",
        "update": "update",
        "search": "search",
        "list": "list",
        "run": "run",
        "init": "init",
        "-g": "-g",
        "--save": "--save",
        "--save-dev": "--save-dev",
      }
    },
    forceArgs: true,
  },
  {
    unix: "pip",
    powershell: "pip",
    cmd: "pip",
    flagMappings: {
      unix: {
        "install": "install",
        "uninstall": "uninstall",
        "list": "list",
        "search": "search",
        "freeze": "freeze",
        "upgrade": "upgrade",
        "--user": "--user",
      },
      powershell: {
        "install": "install",
        "uninstall": "uninstall",
        "list": "list",
        "search": "search",
        "freeze": "freeze",
        "upgrade": "upgrade",
        "--user": "--user",
      },
      cmd: {
        "install": "install",
        "uninstall": "uninstall",
        "list": "list",
        "search": "search",
        "freeze": "freeze",
        "upgrade": "upgrade",
        "--user": "--user",
      }
    },
    forceArgs: true,
  },
  {
    unix: "conda",
    powershell: "conda",
    cmd: "conda",
    flagMappings: {
      unix: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "list": "list",
        "search": "search",
        "create": "create",
        "activate": "activate",
        "deactivate": "deactivate",
        "-y": "-y",
      },
      powershell: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "list": "list",
        "search": "search",
        "create": "create",
        "activate": "activate",
        "deactivate": "deactivate",
        "-y": "-y",
      },
      cmd: {
        "install": "install",
        "remove": "remove",
        "update": "update",
        "list": "list",
        "search": "search",
        "create": "create",
        "activate": "activate",
        "deactivate": "deactivate",
        "-y": "-y",
      }
    },
    forceArgs: true,
  },
  {
    unix: "composer",
    powershell: "composer",
    cmd: "composer",
    flagMappings: {
      unix: {
        "install": "install",
        "update": "update",
        "require": "require",
        "remove": "remove",
        "list": "list",
        "search": "search",
        "--no-dev": "--no-dev",
        "--optimize-autoloader": "--optimize-autoloader",
      },
      powershell: {
        "install": "install",
        "update": "update",
        "require": "require",
        "remove": "remove",
        "list": "list",
        "search": "search",
        "--no-dev": "--no-dev",
        "--optimize-autoloader": "--optimize-autoloader",
      },
      cmd: {
        "install": "install",
        "update": "update",
        "require": "require",
        "remove": "remove",
        "list": "list",
        "search": "search",
        "--no-dev": "--no-dev",
        "--optimize-autoloader": "--optimize-autoloader",
      }
    },
    forceArgs: true,
  },
  {
    unix: "cargo",
    powershell: "cargo",
    cmd: "cargo",
    flagMappings: {
      unix: {
        "build": "build",
        "run": "run",
        "test": "test",
        "install": "install",
        "update": "update",
        "search": "search",
        "new": "new",
        "init": "init",
        "--release": "--release",
        "--verbose": "--verbose",
      },
      powershell: {
        "build": "build",
        "run": "run",
        "test": "test",
        "install": "install",
        "update": "update",
        "search": "search",
        "new": "new",
        "init": "init",
        "--release": "--release",
        "--verbose": "--verbose",
      },
      cmd: {
        "build": "build",
        "run": "run",
        "test": "test",
        "install": "install",
        "update": "update",
        "search": "search",
        "new": "new",
        "init": "init",
        "--release": "--release",
        "--verbose": "--verbose",
      }
    },
    forceArgs: true,
  },
  {
    unix: "go",
    powershell: "go",
    cmd: "go",
    flagMappings: {
      unix: {
        "build": "build",
        "run": "run",
        "test": "test",
        "install": "install",
        "get": "get",
        "mod": "mod",
        "init": "init",
        "fmt": "fmt",
        "vet": "vet",
        "clean": "clean",
      },
      powershell: {
        "build": "build",
        "run": "run",
        "test": "test",
        "install": "install",
        "get": "get",
        "mod": "mod",
        "init": "init",
        "fmt": "fmt",
        "vet": "vet",
        "clean": "clean",
      },
      cmd: {
        "build": "build",
        "run": "run",
        "test": "test",
        "install": "install",
        "get": "get",
        "mod": "mod",
        "init": "init",
        "fmt": "fmt",
        "vet": "vet",
        "clean": "clean",
      }
    },
    forceArgs: true,
  },
  {
    unix: "dotnet",
    powershell: "dotnet",
    cmd: "dotnet",
    flagMappings: {
      unix: {
        "build": "build",
        "run": "run",
        "test": "test",
        "restore": "restore",
        "publish": "publish",
        "new": "new",
        "add": "add",
        "remove": "remove",
        "list": "list",
        "clean": "clean",
        "--configuration": "--configuration",
        "--framework": "--framework",
      },
      powershell: {
        "build": "build",
        "run": "run",
        "test": "test",
        "restore": "restore",
        "publish": "publish",
        "new": "new",
        "add": "add",
        "remove": "remove",
        "list": "list",
        "clean": "clean",
        "--configuration": "--configuration",
        "--framework": "--framework",
      },
      cmd: {
        "build": "build",
        "run": "run",
        "test": "test",
        "restore": "restore",
        "publish": "publish",
        "new": "new",
        "add": "add",
        "remove": "remove",
        "list": "list",
        "clean": "clean",
        "--configuration": "--configuration",
        "--framework": "--framework",
      }
    },
    forceArgs: true,
  },
  {
    unix: "mvn",
    powershell: "mvn",
    cmd: "mvn",
    flagMappings: {
      unix: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "install": "install",
        "clean": "clean",
        "deploy": "deploy",
        "spring-boot:run": "spring-boot:run",
        "-DskipTests": "-DskipTests",
        "-X": "-X",
      },
      powershell: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "install": "install",
        "clean": "clean",
        "deploy": "deploy",
        "spring-boot:run": "spring-boot:run",
        "-DskipTests": "-DskipTests",
        "-X": "-X",
      },
      cmd: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "install": "install",
        "clean": "clean",
        "deploy": "deploy",
        "spring-boot:run": "spring-boot:run",
        "-DskipTests": "-DskipTests",
        "-X": "-X",
      }
    },
    forceArgs: true,
  },
  {
    unix: "gradle",
    powershell: "gradle",
    cmd: "gradle",
    flagMappings: {
      unix: {
        "build": "build",
        "test": "test",
        "run": "run",
        "clean": "clean",
        "assemble": "assemble",
        "install": "install",
        "bootRun": "bootRun",
        "--debug": "--debug",
        "--info": "--info",
      },
      powershell: {
        "build": "build",
        "test": "test",
        "run": "run",
        "clean": "clean",
        "assemble": "assemble",
        "install": "install",
        "bootRun": "bootRun",
        "--debug": "--debug",
        "--info": "--info",
      },
      cmd: {
        "build": "build",
        "test": "test",
        "run": "run",
        "clean": "clean",
        "assemble": "assemble",
        "install": "install",
        "bootRun": "bootRun",
        "--debug": "--debug",
        "--info": "--info",
      }
    },
    forceArgs: true,
  },
  {
    unix: "ant",
    powershell: "ant",
    cmd: "ant",
    flagMappings: {
      unix: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "clean": "clean",
        "deploy": "deploy",
        "-debug": "-debug",
        "-verbose": "-verbose",
      },
      powershell: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "clean": "clean",
        "deploy": "deploy",
        "-debug": "-debug",
        "-verbose": "-verbose",
      },
      cmd: {
        "compile": "compile",
        "test": "test",
        "package": "package",
        "clean": "clean",
        "deploy": "deploy",
        "-debug": "-debug",
        "-verbose": "-verbose",
      }
    },
    forceArgs: true,
  },
  {
    unix: "make",
    powershell: "make",
    cmd: "make",
    flagMappings: {
      unix: {
        "all": "all",
        "clean": "clean",
        "install": "install",
        "uninstall": "uninstall",
        "test": "test",
        "-j": "-j",
        "-f": "-f",
      },
      powershell: {
        "all": "all",
        "clean": "clean",
        "install": "install",
        "uninstall": "uninstall",
        "test": "test",
        "-j": "-j",
        "-f": "-f",
      },
      cmd: {
        "all": "all",
        "clean": "clean",
        "install": "install",
        "uninstall": "uninstall",
        "test": "test",
        "-j": "-j",
        "-f": "-f",
      }
    },
    forceArgs: true,
  },
  {
    unix: "cmake",
    powershell: "cmake",
    cmd: "cmake",
    flagMappings: {
      unix: {
        "..": "..",
        "build": "build",
        "install": "install",
        "test": "test",
        "-DCMAKE_BUILD_TYPE": "-DCMAKE_BUILD_TYPE",
        "-G": "-G",
      },
      powershell: {
        "..": "..",
        "build": "build",
        "install": "install",
        "test": "test",
        "-DCMAKE_BUILD_TYPE": "-DCMAKE_BUILD_TYPE",
        "-G": "-G",
      },
      cmd: {
        "..": "..",
        "build": "build",
        "install": "install",
        "test": "test",
        "-DCMAKE_BUILD_TYPE": "-DCMAKE_BUILD_TYPE",
        "-G": "-G",
      }
    },
    forceArgs: true,
  },
  // System Administration Commands
  {
    unix: "systemctl",
    powershell: "systemctl",
    cmd: "sc",
    flagMappings: {
      unix: {
        "start": "start",
        "stop": "stop",
        "restart": "restart",
        "status": "status",
        "enable": "enable",
        "disable": "disable",
        "reload": "reload",
      },
      powershell: {
        "start": "start",
        "stop": "stop",
        "restart": "restart",
        "status": "status",
        "enable": "enable",
        "disable": "disable",
        "reload": "reload",
      },
      cmd: {
        "start": "start",
        "stop": "stop",
        "restart": "restart",
        "status": "status",
        "enable": "enable",
        "disable": "disable",
        "reload": "reload",
      }
    },
    forceArgs: true,
  },
  {
    unix: "useradd",
    powershell: "New-LocalUser",
    cmd: "net user",
    flagMappings: {
      unix: {
        "-m": "-m",
        "-s": "-s",
        "-G": "-G",
        "-u": "-u",
      },
      powershell: {
        "-Name": "",
        "-Password": "",
        "-Description": "",
      },
      cmd: {
        "/add": "/add",
        "/comment": "/comment",
      }
    },
    forceArgs: true,
  },
  {
    unix: "userdel",
    powershell: "Remove-LocalUser",
    cmd: "net user",
    flagMappings: {
      unix: {
        "-r": "-r",
        "-f": "-f",
      },
      powershell: {
        "-Name": "",
        "-Force": "-f",
      },
      cmd: {
        "/delete": "/delete",
      }
    },
    forceArgs: true,
  },
  {
    unix: "passwd",
    powershell: "Set-LocalUser",
    cmd: "net user",
    flagMappings: {
      unix: {
        "-l": "-l",
        "-u": "-u",
        "-d": "-d",
      },
      powershell: {
        "-Name": "",
        "-Password": "",
      },
      cmd: {
        "/password": "/password",
      }
    },
    forceArgs: true,
  },
  {
    unix: "su",
    powershell: "Start-Process",
    cmd: "runas",
    flagMappings: {
      unix: {
        "-": "-",
        "-c": "-c",
        "-l": "-l",
      },
      powershell: {
        "-Verb": "runas",
        "-ArgumentList": "-c",
      },
      cmd: {
        "/user:": "/user:",
        "/profile": "-l",
      }
    },
    forceArgs: true,
  },
  {
    unix: "sudo",
    powershell: "Start-Process",
    cmd: "runas",
    flagMappings: {
      unix: {
        "-u": "-u",
        "-E": "-E",
        "-s": "-s",
      },
      powershell: {
        "-Verb": "runas",
        "-ArgumentList": "",
      },
      cmd: {
        "/user:": "/user:",
      }
    },
    forceArgs: true,
  },
  {
    unix: "shutdown",
    powershell: "Stop-Computer",
    cmd: "shutdown",
    flagMappings: {
      unix: {
        "-h": "-h",
        "-r": "-r",
        "-c": "-c",
        "-t": "-t",
      },
      powershell: {
        "-Force": "-f",
        "-Restart": "-r",
      },
      cmd: {
        "/s": "/s",
        "/r": "/r",
        "/t": "/t",
        "/c": "/c",
      }
    },
    forceArgs: false,
  },
  {
    unix: "reboot",
    powershell: "Restart-Computer",
    cmd: "shutdown",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-n": "-n",
      },
      powershell: {
        "-Force": "-f",
      },
      cmd: {
        "/r": "/r",
        "/f": "/f",
      }
    },
    forceArgs: false,
  },
  {
    unix: "halt",
    powershell: "Stop-Computer",
    cmd: "shutdown",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-n": "-n",
      },
      powershell: {
        "-Force": "-f",
      },
      cmd: {
        "/s": "/s",
        "/f": "/f",
      }
    },
    forceArgs: false,
  },
  {
    unix: "poweroff",
    powershell: "Stop-Computer",
    cmd: "shutdown",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-n": "-n",
      },
      powershell: {
        "-Force": "-f",
      },
      cmd: {
        "/s": "/s",
        "/f": "/f",
      }
    },
    forceArgs: false,
  },
  {
    unix: "uptime",
    powershell: "Get-Uptime",
    cmd: "net statistics",
    flagMappings: {
      unix: {
        "-p": "-p",
        "-s": "-s",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "free",
    powershell: "Get-Counter",
    cmd: "wmic",
    flagMappings: {
      unix: {
        "-h": "-h",
        "-m": "-m",
        "-g": "-g",
        "-t": "-t",
      },
      powershell: {
        "-Counter": "",
        "-SampleInterval": "",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "jobs",
    powershell: "Get-Job",
    cmd: "tasklist",
    flagMappings: {
      unix: {
        "-l": "-l",
        "-p": "-p",
        "-r": "-r",
      },
      powershell: {
        "-State": "",
        "-Id": "",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "bg",
    powershell: "Resume-Job",
    cmd: "start",
    flagMappings: {
      unix: {
        "%": "%",
      },
      powershell: {
        "-Id": "",
        "-Name": "",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "fg",
    powershell: "Wait-Job",
    cmd: "wait",
    flagMappings: {
      unix: {
        "%": "%",
      },
      powershell: {
        "-Id": "",
        "-Name": "",
      },
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "nice",
    powershell: "Start-Process",
    cmd: "start",
    flagMappings: {
      unix: {
        "-n": "-n",
      },
      powershell: {
        "-PriorityClass": "",
      },
      cmd: {
        "/low": "/low",
        "/normal": "/normal",
        "/high": "/high",
      }
    },
    forceArgs: true,
  },
  {
    unix: "nohup",
    powershell: "Start-Process",
    cmd: "start",
    flagMappings: {
      unix: {},
      powershell: {
        "-WindowStyle": "Hidden",
      },
      cmd: {
        "/b": "/b",
      }
    },
    forceArgs: true,
  },
  {
    unix: "chgrp",
    powershell: "Set-Acl",
    cmd: "icacls",
    flagMappings: {
      unix: {
        "-R": "-R",
        "-H": "-H",
        "-L": "-L",
      },
      powershell: {
        "-Recurse": "-R",
      },
      cmd: {
        "/t": "/t",
      }
    },
    forceArgs: true,
  },
  {
    unix: "umask",
    powershell: "umask",
    cmd: "umask",
    flagMappings: {
      unix: {
        "-S": "-S",
        "-p": "-p",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "mktemp",
    powershell: "New-TemporaryFile",
    cmd: "mktemp",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-u": "-u",
        "-t": "-t",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "realpath",
    powershell: "Resolve-Path",
    cmd: "cd",
    flagMappings: {
      unix: {
        "-q": "-q",
        "-e": "-e",
        "-m": "-m",
      },
      powershell: {
        "-Relative": "",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "less",
    powershell: "Get-Content",
    cmd: "more",
    flagMappings: {
      unix: {
        "-N": "-N",
        "-R": "-R",
        "-S": "-S",
        "-F": "-F",
      },
      powershell: {
        "-Tail": "",
        "-Wait": "",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "more",
    powershell: "Get-Content",
    cmd: "more",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-f": "-f",
        "-p": "-p",
        "-c": "-c",
      },
      powershell: {
        "-Tail": "",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "top",
    powershell: "Get-Process",
    cmd: "tasklist",
    flagMappings: {
      unix: {
        "-p": "-p",
        "-u": "-u",
        "-n": "-n",
        "-d": "-d",
      },
      powershell: {
        "-Id": "-p",
        "-Name": "-u",
      },
      cmd: {
        "/fi": "/fi",
      }
    },
    forceArgs: false,
  },
  {
    unix: "gzip",
    powershell: "Compress-Archive",
    cmd: "gzip",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-r": "-r",
        "-v": "-v",
        "-l": "-l",
      },
      powershell: {
        "-DestinationPath": "",
        "-Force": "-f",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "gunzip",
    powershell: "Expand-Archive",
    cmd: "gunzip",
    flagMappings: {
      unix: {
        "-r": "-r",
        "-v": "-v",
        "-l": "-l",
        "-f": "-f",
      },
      powershell: {
        "-DestinationPath": "",
        "-Force": "-f",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "git",
    powershell: "git",
    cmd: "git",
    flagMappings: {
      unix: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "branch": "branch",
        "checkout": "checkout",
        "merge": "merge",
        "reset": "reset",
        "stash": "stash",
        "remote": "remote",
        "fetch": "fetch",
        "tag": "tag",
      },
      powershell: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "branch": "branch",
        "checkout": "checkout",
        "merge": "merge",
        "reset": "reset",
        "stash": "stash",
        "remote": "remote",
        "fetch": "fetch",
        "tag": "tag",
      },
      cmd: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "branch": "branch",
        "checkout": "checkout",
        "merge": "merge",
        "reset": "reset",
        "stash": "stash",
        "remote": "remote",
        "fetch": "fetch",
        "tag": "tag",
      }
    },
    forceArgs: true,
  },
  // Additional System Tools
  {
    unix: "lsof",
    powershell: "Get-NetTCPConnection",
    cmd: "netstat",
    flagMappings: {
      unix: {
        "-i": "-i",
        "-p": "-p",
        "-u": "-u",
        "-t": "-t",
      },
      powershell: {
        "-State": "",
        "-LocalPort": "",
      },
      cmd: {
        "-an": "-an",
        "-o": "-o",
      }
    },
    forceArgs: false,
  },
  {
    unix: "pkill",
    powershell: "Stop-Process",
    cmd: "taskkill",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-9": "-9",
        "-u": "-u",
      },
      powershell: {
        "-Name": "",
        "-Force": "-f",
      },
      cmd: {
        "/f": "/f",
        "/im": "/im",
      }
    },
    forceArgs: true,
  },
  {
    unix: "pgrep",
    powershell: "Get-Process",
    cmd: "tasklist",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-l": "-l",
        "-u": "-u",
      },
      powershell: {
        "-Name": "",
      },
      cmd: {
        "/fi": "/fi",
      }
    },
    forceArgs: true,
  },
  {
    unix: "killall",
    powershell: "Stop-Process",
    cmd: "taskkill",
    flagMappings: {
      unix: {
        "-9": "-9",
        "-u": "-u",
        "-v": "-v",
      },
      powershell: {
        "-Name": "",
        "-Force": "-f",
      },
      cmd: {
        "/f": "/f",
        "/im": "/im",
      }
    },
    forceArgs: true,
  },
  {
    unix: "renice",
    powershell: "Set-ProcessPriority",
    cmd: "wmic",
    flagMappings: {
      unix: {
        "-n": "-n",
        "-p": "-p",
        "-g": "-g",
        "-u": "-u",
      },
      powershell: {
        "-Id": "-p",
        "-PriorityClass": "",
      },
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "at",
    powershell: "Register-ScheduledJob",
    cmd: "at",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-l": "-l",
        "-d": "-d",
        "-m": "-m",
      },
      powershell: {
        "-Name": "",
        "-ScriptBlock": "",
        "-Trigger": "",
      },
      cmd: {
        "/delete": "/delete",
        "/yes": "/yes",
      }
    },
    forceArgs: true,
  },
  {
    unix: "atq",
    powershell: "Get-ScheduledJob",
    cmd: "at",
    flagMappings: {
      unix: {},
      powershell: {},
      cmd: {}
    },
    forceArgs: false,
  },
  {
    unix: "atrm",
    powershell: "Unregister-ScheduledJob",
    cmd: "at",
    flagMappings: {
      unix: {},
      powershell: {
        "-Id": "",
      },
      cmd: {
        "/delete": "/delete",
      }
    },
    forceArgs: true,
  },
  {
    unix: "dmesg",
    powershell: "Get-EventLog",
    cmd: "wevtutil",
    flagMappings: {
      unix: {
        "-T": "-T",
        "-k": "-k",
        "-x": "-x",
        "-w": "-w",
      },
      powershell: {
        "-LogName": "System",
        "-Newest": "",
      },
      cmd: {
        "qe": "qe",
        "System": "System",
      }
    },
    forceArgs: false,
  },
  {
    unix: "journalctl",
    powershell: "Get-EventLog",
    cmd: "wevtutil",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-n": "-n",
        "-u": "-u",
        "-p": "-p",
      },
      powershell: {
        "-LogName": "System",
        "-Newest": "-n",
        "-Follow": "-f",
      },
      cmd: {
        "qe": "qe",
        "System": "System",
      }
    },
    forceArgs: false,
  },
  {
    unix: "logrotate",
    powershell: "logrotate",
    cmd: "logrotate",
    flagMappings: {
      unix: {
        "-d": "-d",
        "-f": "-f",
        "-s": "-s",
        "-v": "-v",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "rsyslog",
    powershell: "rsyslog",
    cmd: "rsyslog",
    flagMappings: {
      unix: {
        "-f": "-f",
        "-d": "-d",
        "-n": "-n",
        "-v": "-v",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "ip6tables",
    powershell: "ip6tables",
    cmd: "netsh",
    flagMappings: {
      unix: {
        "-A": "-A",
        "-D": "-D",
        "-I": "-I",
        "-L": "-L",
        "-F": "-F",
      },
      powershell: {},
      cmd: {
        "advfirewall": "advfirewall",
        "set": "set",
      }
    },
    forceArgs: true,
  },
  {
    unix: "fail2ban",
    powershell: "fail2ban",
    cmd: "fail2ban",
    flagMappings: {
      unix: {
        "start": "start",
        "stop": "stop",
        "restart": "restart",
        "status": "status",
      },
      powershell: {},
      cmd: {}
    },
    forceArgs: true,
  },
  {
    unix: "svn",
    powershell: "svn",
    cmd: "svn",
    flagMappings: {
      unix: {
        "checkout": "checkout",
        "update": "update",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "info": "info",
      },
      powershell: {
        "checkout": "checkout",
        "update": "update",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "info": "info",
      },
      cmd: {
        "checkout": "checkout",
        "update": "update",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "info": "info",
      }
    },
    forceArgs: true,
  },
  {
    unix: "hg",
    powershell: "hg",
    cmd: "hg",
    flagMappings: {
      unix: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "branch": "branch",
      },
      powershell: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "branch": "branch",
      },
      cmd: {
        "clone": "clone",
        "pull": "pull",
        "push": "push",
        "commit": "commit",
        "add": "add",
        "status": "status",
        "log": "log",
        "branch": "branch",
      }
    },
    forceArgs: true,
  }
];

export function getBidirectionalMapping(command: string, sourceFormat: string): BidirectionalMapping | undefined {
  return POWERSHELL_TO_UNIX_MAPPINGS.find(m => (m as any)[sourceFormat] === command);
}

export function translateBidirectional(
  command: string,
  sourceFormat: string,
  targetShell: string,
  flagTokens: string[],
  argTokens: string[]
): string {
  const mapping = getBidirectionalMapping(command, sourceFormat);
  if (!mapping) {
    // No mapping found, return original command
    return command;
  }

  // Get the target command for this shell
  const targetCommand = (mapping as any)[targetShell] || command;
  
  // Get flag mappings for this direction
  const sourceFlagMap = mapping.flagMappings[sourceFormat as keyof typeof mapping.flagMappings] || {};
  
  // Translate flags
  let translatedFlags = "";
  for (const flag of flagTokens) {
    const mappedFlag = sourceFlagMap[flag];
    if (mappedFlag !== undefined) {
      if (mappedFlag) translatedFlags += " " + mappedFlag;
    } else {
      // Unknown flag, preserve original
      translatedFlags += " " + flag;
    }
  }

  // Build final command
  const finalCommand = `${targetCommand}${translatedFlags}`.trim();
  return [finalCommand, ...argTokens].join(" ");
} 