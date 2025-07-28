const { translateCommand, translateBidirectional } = require('./dist/index.js');

const ps7 = { type: 'powershell', supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: 'powershell' };

console.log('=== Testing Find Command Issues ===\n');

// Test bidirectional translation directly
console.log('0. Bidirectional translation test:');
const bidirResult = translateBidirectional('find', 'unix', 'powershell', ['-name', '-delete'], ['.', '*.tmp']);
console.log('   Input: find -name -delete . *.tmp');
console.log('   Bidirectional result:', bidirResult);
console.log();

// Test 1: find -name *.tmp -delete
console.log('1. find -name *.tmp -delete:');
const result1 = translateCommand("find . -name '*.tmp' -delete", ps7);
console.log('   Input: find . -name \'*.tmp\' -delete');
console.log('   Expected: Get-ChildItem . -Recurse -Filter *.tmp | Remove-Item');
console.log('   Actual:', result1);
console.log('   Match:', result1 === 'Get-ChildItem . -Recurse -Filter *.tmp | Remove-Item' ? '✅' : '❌');
console.log();

// Test 2: find -type f -exec echo {} ;
console.log('2. find -type f -exec echo {} ;:');
const result2 = translateCommand("find . -type f -exec echo {} ;", ps7);
console.log('   Input: find . -type f -exec echo {} ;');
console.log('   Expected: Get-ChildItem . -Recurse | ForEach-Object { echo $_ }');
console.log('   Actual:', result2);
console.log('   Match:', result2 === 'Get-ChildItem . -Recurse | ForEach-Object { echo $_ }' ? '✅' : '❌');
console.log();

console.log('=== Test Complete ==='); 