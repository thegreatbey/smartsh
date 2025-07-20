declare function lintCommand(cmd: string): {
    unsupported: string[];
    suggestions: string[];
};
type ShellType = "bash" | "powershell" | "cmd";
interface ShellInfo {
    type: "bash" | "powershell" | "cmd";
    /**
     * Whether this shell natively understands Unix-style conditional connectors (&&, ||).
     */
    supportsConditionalConnectors: boolean;
    /** Only set for PowerShell */
    version?: number | null;
}
/**
 * Best-effort detection of the current interactive shell and its capabilities.
 * Users can override detection by setting SMARTSH_SHELL=cmd|powershell|bash.
 */
declare function detectShell(): ShellInfo;
/**
 * Translate a Unix-style command string (using && and ||) to something that
 * preserves conditional semantics on shells that *don’t* natively support them
 * (currently: legacy PowerShell < 7).
 */
declare function translateCommand(command: string, shell: ShellInfo): string;

export { type ShellInfo, type ShellType, detectShell, lintCommand, translateCommand };
