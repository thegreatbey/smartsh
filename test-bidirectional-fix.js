const { translateBidirectional, translateCommand } = require('./dist/index.js');

console.log('=== Testing Bidirectional Translation Fix ===\n');

// Test CMD to PowerShell translation
console.log('1. CMD to PowerShell:');
const cmdToPs = translateBidirectional('del', 'cmd', 'powershell', ['/s', '/q'], ['test']);
console.log('   del /s /q test ->', cmdToPs);
console.log('   Expected: Remove-Item -Recurse -Force test');
console.log('   Result:', cmdToPs === 'Remove-Item -Recurse -Force test' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test PowerShell to Unix translation
console.log('2. PowerShell to Unix:');
const psToUnix = translateBidirectional('Remove-Item', 'powershell', 'unix', ['-Recurse', '-Force'], ['test']);
console.log('   Remove-Item -Recurse -Force test ->', psToUnix);
console.log('   Expected: rm -r -f test');
console.log('   Result:', psToUnix === 'rm -r -f test' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test Unix to PowerShell translation
console.log('3. Unix to PowerShell:');
const unixToPs = translateBidirectional('rm', 'unix', 'powershell', ['-rf'], ['test']);
console.log('   rm -rf test ->', unixToPs);
console.log('   Expected: Remove-Item -Recurse -Force test');
console.log('   Result:', unixToPs === 'Remove-Item -Recurse -Force test' ? '✅ PASS' : '❌ FAIL');
console.log();

// Test main translateCommand function with CMD input
console.log('4. Main translateCommand with CMD input:');
const ps7 = { type: 'powershell', supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: 'powershell' };
const mainCmdResult = translateCommand('del /s /q test', ps7);
console.log('   del /s /q test ->', mainCmdResult);
console.log('   Expected: Remove-Item -Recurse -Force test');
console.log('   Result:', mainCmdResult === 'Remove-Item -Recurse -Force test' ? '✅ PASS' : '❌ FAIL');
console.log();

console.log('=== Test Complete ==='); 