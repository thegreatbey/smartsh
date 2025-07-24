// Export the main functions for external use (like VS Code extension)
export { translateCommand, detectShell, lintCommand } from './translate';
export type { ShellInfo, ShellType } from './translate';
export { translateBidirectional, getBidirectionalMapping, POWERSHELL_TO_UNIX_MAPPINGS } from './bidirectionalMappings';
export type { BidirectionalMapping } from './bidirectionalMappings'; 