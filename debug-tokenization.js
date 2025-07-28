console.log('Starting tokenization debug...');

const { translateCommand, getBidirectionalMapping, translateBidirectional } = require('./dist/index.js');

const ps7 = { type: 'powershell', supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: 'powershell' };

// Test getBidirectionalMapping directly
console.log('Testing getBidirectionalMapping...');
const mapping = getBidirectionalMapping('find', 'unix');
console.log('Mapping found:', mapping);
if (mapping) {
  console.log('PowerShell command:', mapping.powershell);
}

// Test bidirectional translation directly
console.log('\nTesting bidirectional translation directly...');
const bidirResult = translateBidirectional('find', 'unix', 'powershell', ['-name', '-delete'], ['.', '*.tmp']);
console.log('Bidirectional result:', bidirResult);

// Test the logic condition
console.log('\nTesting logic condition...');
const cmd = 'find';
const flagTokens = ['-name', '-delete'];
console.log('cmd === "find":', cmd === "find");
console.log('flagTokens.includes("-delete"):', flagTokens.includes("-delete"));
console.log('flagTokens.includes("-exec"):', flagTokens.includes("-exec"));
console.log('Condition should be true:', cmd === "find" && (flagTokens.includes("-delete") || flagTokens.includes("-exec")));

// Test the exact command from the failing test
const testCommand = "find . -name '*.tmp' -delete";
console.log('\nTesting command:', testCommand);

const result = translateCommand(testCommand, ps7);
console.log('Result:', result);

// Test a simpler find command
const simpleCommand = "find . -name '*.txt'";
console.log('\nTesting simple command:', simpleCommand);

const simpleResult = translateCommand(simpleCommand, ps7);
console.log('Simple result:', simpleResult);

// Test with -exec flag
console.log('\nTesting with -exec flag...');
const execCommand = "find . -type f -exec echo {} ;";
const execResult = translateCommand(execCommand, ps7);
console.log('Exec command:', execCommand);
console.log('Exec result:', execResult); 