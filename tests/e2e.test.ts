import { describe, expect, test } from "vitest";
import { translateCommand } from "../src/translate";

describe("E2E translation scenarios", () => {
  const ps5 = { type: "powershell", supportsConditionalConnectors: false } as const;

  test("complex pipeline and connectors", () => {
    const input = "ls -la | grep .ts | head -5 && echo done || echo fail";
    const output = translateCommand(input, ps5);
    expect(output).toBe(
      "Get-ChildItem -Force | Select-String .ts | Select-Object -First 5; if ($?) { echo done }; if (-not $?) { echo fail }"
    );
  });

  test("new commands - nl", () => {
    const input = "nl test.txt";
    const output = translateCommand(input, ps5);
    expect(output).toBe("Get-Content test.txt | ForEach-Object { $i++; \"$i\t$_\" }");
  });

  test("new commands - netstat", () => {
    const input = "netstat -l";
    const output = translateCommand(input, ps5);
    expect(output).toBe("Get-NetTCPConnection -State Listen | Format-Table LocalAddress,LocalPort,RemoteAddress,RemotePort,State -AutoSize");
  });

  test("new commands - gzip", () => {
    const input = "gzip file.txt";
    const output = translateCommand(input, ps5);
    expect(output).toBe("Compress-Archive -Path file.txt -DestinationPath file.txt.zip");
  });

  test("new commands - gunzip", () => {
    const input = "gunzip -f file.zip";
    const output = translateCommand(input, ps5);
    expect(output).toBe("Expand-Archive -Path file.zip -DestinationPath . -Force");
  });

  test("new commands - uptime", () => {
    const input = "uptime";
    const output = translateCommand(input, ps5);
    expect(output).toBe("(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | ForEach-Object { \"Uptime: $($_.Days) days, $($_.Hours) hours, $($_.Minutes) minutes\" }");
  });

  test("new commands - free", () => {
    const input = "free -h";
    const output = translateCommand(input, ps5);
    expect(output).toBe("Get-Counter '\\Memory\\Available MBytes' | Select-Object -ExpandProperty CounterSamples | ForEach-Object { \"Available Memory: $([math]::Round($_.CookedValue, 2)) MB\" }");
  });
}); 