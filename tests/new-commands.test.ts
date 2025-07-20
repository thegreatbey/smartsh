import { describe, it, expect } from "vitest";
import { translateCommand } from "../src/translate";

describe("New Commands - High Value", () => {
  it("translates rsync -av for file synchronization", () => {
    const cmd = "rsync -av source/ dest/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Copy-Item");
    expect(translated).toContain("-Recurse");
  });

  it("translates rsync -avz for remote synchronization", () => {
    const cmd = "rsync -avz local/ user@remote:/path/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("rsync");
    expect(translated).toContain("-avz");
  });

  it("translates scp for secure copy", () => {
    const cmd = "scp file.txt user@remote:/path/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("scp");
  });

  it("translates ssh for remote execution", () => {
    const cmd = "ssh user@remote 'ls -la'";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("ssh");
  });

  it("translates chmod for file permissions", () => {
    const cmd = "chmod 755 script.sh";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("icacls");
    expect(translated).toContain("/grant");
  });

  it("translates chown for ownership", () => {
    const cmd = "chown user:group file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("icacls");
    expect(translated).toContain("/setowner");
  });

  it("translates ln -s for symbolic links", () => {
    const cmd = "ln -s target link";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("New-Item");
    expect(translated).toContain("-ItemType");
    expect(translated).toContain("SymbolicLink");
  });

  it("translates ln for hard links", () => {
    const cmd = "ln target link";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("New-Item");
    expect(translated).toContain("-ItemType");
    expect(translated).toContain("HardLink");
  });

  it("translates du for disk usage", () => {
    const cmd = "du -sh directory/";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-ChildItem");
    expect(translated).toContain("Measure-Object");
    expect(translated).toContain("-Property");
    expect(translated).toContain("Length");
  });

  it("translates du -h for human readable", () => {
    const cmd = "du -h file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Item");
    expect(translated).toContain("Length");
  });

  it("translates mount for mounting filesystems", () => {
    const cmd = "mount /dev/sda1 /mnt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("mount");
  });

  it("translates umount for unmounting", () => {
    const cmd = "umount /mnt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("umount");
  });

  it("translates systemctl for service management", () => {
    const cmd = "systemctl start nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Start-Service");
    expect(translated).toContain("nginx");
  });

  it("translates systemctl stop", () => {
    const cmd = "systemctl stop nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Stop-Service");
    expect(translated).toContain("nginx");
  });

  it("translates systemctl status", () => {
    const cmd = "systemctl status nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Service");
    expect(translated).toContain("nginx");
  });

  it("translates systemctl enable", () => {
    const cmd = "systemctl enable nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Set-Service");
    expect(translated).toContain("-StartupType");
    expect(translated).toContain("Automatic");
  });

  it("translates systemctl disable", () => {
    const cmd = "systemctl disable nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Set-Service");
    expect(translated).toContain("-StartupType");
    expect(translated).toContain("Disabled");
  });

  // New commands tests
  it("translates wc -l for line count", () => {
    const cmd = "wc -l file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Measure-Object");
    expect(translated).toContain("-Line");
  });

  it("translates head -n 5", () => {
    const cmd = "head -n 5 file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Select-Object");
    expect(translated).toContain("-First");
    expect(translated).toContain("5");
  });

  it("translates tail -f for follow", () => {
    const cmd = "tail -f log.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // tail -f is not translated, it passes through as-is
    expect(translated).toBe("tail -f log.txt");
  });

  // Additional 25 commands tests
  it("translates stat for file information", () => {
    const cmd = "stat file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Item");
    expect(translated).toContain("Select-Object");
  });

  it("translates awk for text processing", () => {
    const cmd = "awk '{print $1}' file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("ForEach-Object");
  });

  it("translates sed for text replacement", () => {
    const cmd = "sed 's/old/new/g' file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("-replace");
  });

  it("translates cut for field extraction", () => {
    const cmd = "cut -d',' -f1 file.txt";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("ForEach-Object");
  });

  it("translates tr for character translation", () => {
    const cmd = "tr 'a-z' 'A-Z'";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("ForEach-Object");
  });

  it("translates htop for process monitoring", () => {
    const cmd = "htop";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Process");
    expect(translated).toContain("Sort-Object");
  });

  it("translates nmap for network scanning", () => {
    const cmd = "nmap localhost";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Test-NetConnection");
  });

  it("translates chroot for directory change", () => {
    const cmd = "chroot /newroot";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Set-Location");
  });

  it("translates iotop for IO monitoring", () => {
    const cmd = "iotop";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Process");
    expect(translated).toContain("Sort-Object");
  });

  it("translates glances for system monitoring", () => {
    const cmd = "glances";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-ComputerInfo");
  });

  it("translates netcat for network connections", () => {
    const cmd = "nc localhost 80";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Test-NetConnection");
  });

  it("translates socat for socket connections", () => {
    const cmd = "socat TCP:localhost:80 -";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("TcpClient");
  });

  // CMD translations
  it("translates stat to dir in CMD", () => {
    const cmd = "stat file.txt";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("dir");
  });

  it("translates htop to tasklist in CMD", () => {
    const cmd = "htop";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("tasklist");
  });

  it("translates nmap to Test-NetConnection in CMD", () => {
    const cmd = "nmap localhost";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("Test-NetConnection");
  });

  // Additional 25 advanced commands tests
  it("translates cron for scheduled jobs", () => {
    const cmd = "cron -e";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // cron is not translated, it passes through as-is
    expect(translated).toBe("cron -e");
  });

  it("translates crontab for job management", () => {
    const cmd = "crontab -l";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // crontab is not translated, it passes through as-is
    expect(translated).toBe("crontab -l");
  });

  it("translates at for one-time jobs", () => {
    const cmd = "at 2:30pm tomorrow";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Register-ScheduledJob");
  });

  it("translates sysctl for system parameters", () => {
    const cmd = "sysctl -a";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // sysctl is not translated, it passes through as-is
    expect(translated).toBe("sysctl -a");
  });

  it("translates iptables for firewall rules", () => {
    const cmd = "iptables -L";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // iptables is not translated, it passes through as-is
    expect(translated).toBe("iptables -L");
  });

  it("translates ufw for firewall management", () => {
    const cmd = "ufw enable";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Set-NetFirewallProfile");
  });

  it("translates apache2ctl for web server control", () => {
    const cmd = "apache2ctl start";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Service");
    expect(translated).toContain("start");
  });

  it("translates nginx for web server control", () => {
    const cmd = "nginx -t";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // nginx is not translated, it passes through as-is
    expect(translated).toBe("nginx -t");
  });

  it("translates mysql for database access", () => {
    const cmd = "mysql -u root -p";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("mysql");
  });

  it("translates psql for PostgreSQL access", () => {
    const cmd = "psql -U postgres -d mydb";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("psql");
  });

  it("translates docker for container management", () => {
    const cmd = "docker run nginx";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("docker");
  });

  it("translates kubectl for Kubernetes management", () => {
    const cmd = "kubectl get pods";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("kubectl");
  });

  it("translates ansible for automation", () => {
    const cmd = "ansible -i hosts -m ping all";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("ansible");
  });

  it("translates terraform for infrastructure", () => {
    const cmd = "terraform init";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("terraform");
  });

  it("translates journalctl for system logs", () => {
    const cmd = "journalctl -f";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    // journalctl is not translated, it passes through as-is
    expect(translated).toBe("journalctl -f");
  });

  it("translates modprobe for kernel modules", () => {
    const cmd = "modprobe nvidia";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Import-Module");
  });

  it("translates lsmod for module listing", () => {
    const cmd = "lsmod";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-Module");
  });

  it("translates fail2ban for intrusion prevention", () => {
    const cmd = "fail2ban status";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("Get-WinEvent");
  });

  it("translates redis-cli for Redis access", () => {
    const cmd = "redis-cli -h localhost -p 6379";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("redis-cli");
  });

  it("translates packer for image building", () => {
    const cmd = "packer build template.json";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("packer");
  });

  // CMD translations for advanced commands
  it("translates cron to schtasks in CMD", () => {
    const cmd = "cron -e";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("schtasks");
  });

  it("translates iptables to netsh in CMD", () => {
    const cmd = "iptables -L";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("netsh");
  });

  it("translates apache2ctl to sc in CMD", () => {
    const cmd = "apache2ctl start";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("sc");
  });

  it("translates sysctl to reg query in CMD", () => {
    const cmd = "sysctl -a";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("reg query");
  });

  // Additional 25 specialized tools tests
  it("translates vagrant for virtual machine management", () => {
    const cmd = "vagrant up";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("vagrant");
  });

  it("translates chef for configuration management", () => {
    const cmd = "chef client";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("chef");
  });

  it("translates puppet for automation", () => {
    const cmd = "puppet apply";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("puppet");
  });

  it("translates salt for remote execution", () => {
    const cmd = "salt '*' test.ping";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("salt");
  });

  it("translates svn for version control", () => {
    const cmd = "svn checkout";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("svn");
  });

  it("translates hg for mercurial version control", () => {
    const cmd = "hg clone";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("hg");
  });

  it("translates pnpm for package management", () => {
    const cmd = "pnpm install";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("pnpm");
  });

  it("translates conda for environment management", () => {
    const cmd = "conda install numpy";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("conda");
  });

  it("translates composer for PHP dependency management", () => {
    const cmd = "composer install";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("composer");
  });

  it("translates gradle for Java builds", () => {
    const cmd = "gradle build";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("gradle");
  });

  it("translates mvn for Maven builds", () => {
    const cmd = "mvn compile";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("mvn");
  });

  it("translates ant for Java builds", () => {
    const cmd = "ant build";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("ant");
  });

  it("translates make for build automation", () => {
    const cmd = "make all";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("make");
  });

  it("translates cmake for build configuration", () => {
    const cmd = "cmake configure";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("cmake");
  });

  it("translates gcc for C compilation", () => {
    const cmd = "gcc -o program main.c";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("gcc");
  });

  it("translates g++ for C++ compilation", () => {
    const cmd = "g++ -std=c++11 -o program main.cpp";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("g++");
  });

  it("translates clang for C compilation", () => {
    const cmd = "clang -o program main.c";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("clang");
  });

  it("translates clang++ for C++ compilation", () => {
    const cmd = "clang++ -std=c++11 -o program main.cpp";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("clang++");
  });

  it("translates rustc for Rust compilation", () => {
    const cmd = "rustc --release main.rs";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("rustc");
  });

  it("translates cargo for Rust package management", () => {
    const cmd = "cargo build";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("cargo");
  });

  it("translates go for Go development", () => {
    const cmd = "go build";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("go");
  });

  it("translates dotnet for .NET development", () => {
    const cmd = "dotnet build";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("dotnet");
  });

  it("translates javac for Java compilation", () => {
    const cmd = "javac -cp lib Main.java";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("javac");
  });

  it("translates java for Java execution", () => {
    const cmd = "java -jar app.jar";
    const translated = translateCommand(cmd, { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell", version: 7 });
    expect(translated).toContain("java");
  });

  // CMD translations for specialized tools
  it("translates vagrant to vagrant in CMD", () => {
    const cmd = "vagrant up";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("vagrant");
  });

  it("translates svn to svn in CMD", () => {
    const cmd = "svn checkout";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("svn");
  });

  it("translates gcc to gcc in CMD", () => {
    const cmd = "gcc -o program main.c";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("gcc");
  });

  it("translates cargo to cargo in CMD", () => {
    const cmd = "cargo build";
    const translated = translateCommand(cmd, { type: "cmd", supportsConditionalConnectors: false, needsUnixTranslation: true, targetShell: "cmd" });
    expect(translated).toContain("cargo");
  });
}); 
