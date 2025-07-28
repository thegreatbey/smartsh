console.log('Starting debug...');

const { translateBidirectional, translateCommand } = require('./dist/index.js');

console.log('Testing bidirectional translation...');
const result1 = translateBidirectional('find', 'unix', 'powershell', ['-name'], ['.']);
console.log('Basic find result:', result1);

const result2 = translateBidirectional('find', 'unix', 'powershell', ['-name', '-delete'], ['.', '*.tmp']);
console.log('Find with -delete result:', result2);

const result3 = translateBidirectional('find', 'unix', 'powershell', ['-type', '-exec'], ['.', 'f', 'echo', '{}']);
console.log('Find with -exec result:', result3);

console.log('\nTesting main translateCommand...');
const ps7 = { type: 'powershell', supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: 'powershell' };

const mainResult1 = translateCommand("find . -name '*.tmp' -delete", ps7);
console.log('Main result 1:', mainResult1);

const mainResult2 = translateCommand("find . -type f -exec echo {} ;", ps7);
console.log('Main result 2:', mainResult2); 