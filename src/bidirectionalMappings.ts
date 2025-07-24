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