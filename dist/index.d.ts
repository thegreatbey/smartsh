declare function lintCommand(cmd: string): {
    unsupported: string[];
    suggestions: string[];
};
type ShellType = "bash" | "powershell" | "cmd" | "ash" | "dash" | "zsh" | "fish" | "ksh" | "tcsh";
interface ShellInfo {
    type: ShellType;
    /**
     * Whether this shell natively understands Unix-style conditional connectors (&&, ||).
     */
    supportsConditionalConnectors: boolean;
    /** Only set for PowerShell */
    version?: number | null;
    /**
     * Whether this shell needs Unix command translations
     */
    needsUnixTranslation: boolean;
    /**
     * The target shell for command translations
     */
    targetShell: "powershell" | "cmd" | "bash" | "ash" | "dash" | "zsh" | "fish" | "ksh" | "tcsh";
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
