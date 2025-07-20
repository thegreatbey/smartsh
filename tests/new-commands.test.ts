import { describe, it, expect } from "vitest";
import { translateCommand } from "../src/translate";

describe("New Commands - High Value", () => {
  it("translates rsync -av for file synchronization", () => {
    const cmd = "rsync -av source/ dest/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Copy-Item");
    expect(translated).toContain("-Recurse");
  });

  it("translates rsync -avz for remote synchronization", () => {
    const cmd = "rsync -avz local/ user@remote:/path/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("rsync");
    expect(translated).toContain("-avz");
  });

  it("translates scp for secure copy", () => {
    const cmd = "scp file.txt user@remote:/path/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("scp");
  });

  it("translates ssh for remote execution", () => {
    const cmd = "ssh user@remote 'ls -la'";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("ssh");
  });

  it("translates chmod for file permissions", () => {
    const cmd = "chmod 755 script.sh";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("icacls");
    expect(translated).toContain("/grant");
  });

  it("translates chown for ownership", () => {
    const cmd = "chown user:group file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("icacls");
    expect(translated).toContain("/setowner");
  });

  it("translates ln -s for symbolic links", () => {
    const cmd = "ln -s target link";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("New-Item");
    expect(translated).toContain("-ItemType");
    expect(translated).toContain("SymbolicLink");
  });

  it("translates ln for hard links", () => {
    const cmd = "ln target link";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("New-Item");
    expect(translated).toContain("-ItemType");
    expect(translated).toContain("HardLink");
  });

  it("translates du for disk usage", () => {
    const cmd = "du -sh directory/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Get-ChildItem");
    expect(translated).toContain("Measure-Object");
    expect(translated).toContain("-Property");
    expect(translated).toContain("Length");
  });

  it("translates du -h for human readable", () => {
    const cmd = "du -h file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Get-Item");
    expect(translated).toContain("Length");
  });

  it("translates mount for mounting filesystems", () => {
    const cmd = "mount /dev/sda1 /mnt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("mount");
  });

  it("translates umount for unmounting", () => {
    const cmd = "umount /mnt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("umount");
  });

  it("translates systemctl for service management", () => {
    const cmd = "systemctl start nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Start-Service");
    expect(translated).toContain("nginx");
  });

  it("translates systemctl stop", () => {
    const cmd = "systemctl stop nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Stop-Service");
    expect(translated).toContain("nginx");
  });

  it("translates systemctl status", () => {
    const cmd = "systemctl status nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Get-Service");
    expect(translated).toContain("nginx");
  });

  it("translates systemctl enable", () => {
    const cmd = "systemctl enable nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Set-Service");
    expect(translated).toContain("-StartupType");
    expect(translated).toContain("Automatic");
  });

  it("translates systemctl disable", () => {
    const cmd = "systemctl disable nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, version: 7 });
    expect(translated).toContain("Set-Service");
    expect(translated).toContain("-StartupType");
    expect(translated).toContain("Disabled");
  });
}); 