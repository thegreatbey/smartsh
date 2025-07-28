// Export the main functions for external use (like VS Code extension)
export { translateCommand, detectShell, lintCommand, detectInputFormat, parseInput } from './translate';
export type { ShellInfo, ShellType, InputFormat, InputInfo } from './translate'; 
export { translateBidirectional, getBidirectionalMapping, POWERSHELL_TO_UNIX_MAPPINGS } from './bidirectionalMappings';
export type { BidirectionalMapping } from './bidirectionalMappings'; 