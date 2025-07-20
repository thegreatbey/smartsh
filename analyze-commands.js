const fs = require('fs');

// Read the files
const translateContent = fs.readFileSync('src/translate.ts', 'utf8');
const mappingsContent = fs.readFileSync('src/unixMappings.ts', 'utf8');

// Extract DYNAMIC_CMDS
const dynamicMatch = translateContent.match(/const DYNAMIC_CMDS = \[([\s\S]*?)\];/);
const dynamicCommands = [];
if (dynamicMatch) {
  const lines = dynamicMatch[1].split('\n').filter(line => line.trim().startsWith('"') && line.trim().endsWith('"'));
  dynamicCommands.push(...lines.map(line => line.trim().replace(/[\",]/g, '')));
}

// Extract BASE_MAPPINGS
const baseMatch = mappingsContent.match(/const BASE_MAPPINGS: CommandMapping\[\] = \[([\s\S]*?)\];/);
const baseCommands = [];
if (baseMatch) {
  const lines = baseMatch[1].split('\n').filter(line => line.trim().endsWith('_MAPPING,'));
  baseCommands.push(...lines.map(line => line.trim().replace('_MAPPING,', '')));
}

console.log('=== COMMAND ANALYSIS ===\n');

console.log('DYNAMIC_CMDS (14):');
dynamicCommands.forEach(cmd => console.log(`  ${cmd}`));

console.log('\nBASE_MAPPINGS (34):');
baseCommands.forEach(cmd => console.log(`  ${cmd}`));

console.log('\n=== REDUNDANCY CHECK ===');

// Check for duplicates between dynamic and base
const duplicates = dynamicCommands.filter(cmd => baseCommands.includes(cmd));
if (duplicates.length > 0) {
  console.log('\nDUPLICATES (appear in both lists):');
  duplicates.forEach(cmd => console.log(`  ${cmd}`));
} else {
  console.log('\nNo duplicates found between DYNAMIC_CMDS and BASE_MAPPINGS');
}

// Check for similar commands that might be redundant
console.log('\nSIMILAR COMMANDS (potential redundancies):');
const allCommands = [...dynamicCommands, ...baseCommands];

// Group similar commands
const groups = {
  'file operations': ['rm', 'cp', 'mv', 'mkdir', 'touch', 'ln'],
  'listing/viewing': ['ls', 'cat', 'head', 'tail', 'wc'],
  'searching': ['grep', 'find'],
  'text processing': ['sort', 'uniq', 'cut', 'tr', 'sed', 'awk'],
  'system info': ['ps', 'df', 'du', 'hostname', 'whoami', 'pwd', 'date'],
  'network': ['curl', 'wget'],
  'archives': ['tar'],
  'comparison': ['diff'],
  'file splitting': ['split', 'paste'],
  'sync/copy': ['rsync'],
  'permissions': ['chmod', 'chown'],
  'services': ['systemctl'],
  'utilities': ['clear', 'sleep', 'tee', 'which', 'dirname', 'basename', 'kill', 'xargs', 'echo']
};

Object.entries(groups).forEach(([category, cmds]) => {
  const found = cmds.filter(cmd => allCommands.includes(cmd));
  if (found.length > 1) {
    console.log(`  ${category}: ${found.join(', ')}`);
  }
});

console.log('\n=== TOTAL UNIQUE COMMANDS ===');
const uniqueCommands = [...new Set(allCommands)];
console.log(`Total unique commands: ${uniqueCommands.length}`);
console.log(`Total listed commands: ${dynamicCommands.length + baseCommands.length}`);
console.log(`Duplicates: ${duplicates.length}`);

console.log('\n=== COMMAND LIST ===');
console.log('All unique commands:', uniqueCommands.sort().join(', ')); 