const { translateCommand, detectInputFormat } = require('./dist/index.js');

const ps7 = { type: 'powershell', supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: 'powershell' };

console.log('=== Testing Find Command Fix ===\n');

// Test input format detection
console.log('0. Input format detection:');
const format1 = detectInputFormat("find . -name '*.tmp' -delete");
const format2 = detectInputFormat("find . -type f -exec echo {} ;");
const format3 = detectInputFormat("find . -name '*.txt'");
console.log('   find . -name \'*.tmp\' -delete ->', format1);
console.log('   find . -type f -exec echo {} ; ->', format2);
console.log('   find . -name \'*.txt\' ->', format3);
console.log();

// Debug the -exec command
console.log('1. Debugging -exec command:');
const execCommand = "find . -type f -exec echo {} ;";
console.log('   Command:', execCommand);
console.log('   Contains "echo":', execCommand.includes('echo'));
console.log('   Contains "echo %":', execCommand.includes('echo %'));
console.log('   Regex test for echo %:', /\becho\s+%/.test(execCommand));
console.log();

// Test 1: find -name *.tmp -delete
console.log('2. find -name *.tmp -delete:');
const result1 = translateCommand("find . -name '*.tmp' -delete", ps7);
console.log('   Input: find . -name \'*.tmp\' -delete');
console.log('   Expected: Get-ChildItem . -Recurse -Filter *.tmp | Remove-Item');
console.log('   Actual:', result1);
console.log('   Match:', result1 === 'Get-ChildItem . -Recurse -Filter *.tmp | Remove-Item' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test 2: find -type f -exec echo {} ;
console.log('3. find -type f -exec echo {} ;:');
const result2 = translateCommand("find . -type f -exec echo {} ;", ps7);
console.log('   Input: find . -type f -exec echo {} ;');
console.log('   Expected: Get-ChildItem . -Recurse | ForEach-Object { echo $_ }');
console.log('   Actual:', result2);
console.log('   Match:', result2 === 'Get-ChildItem . -Recurse | ForEach-Object { echo $_ }' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test 3: Simple find command (should still work)
console.log('4. Simple find command:');
const result3 = translateCommand("find . -name '*.txt'", ps7);
console.log('   Input: find . -name \'*.txt\'');
console.log('   Expected: Get-ChildItem . -Recurse -Filter *.txt');
console.log('   Actual:', result3);
console.log('   Match:', result3 === 'Get-ChildItem . -Recurse -Filter *.txt' ? '✅ PASS' : '❌ FAIL');
console.log();

console.log('=== Test Complete ==='); 