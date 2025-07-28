const { translateCommand, translateBidirectional, getBidirectionalMapping } = require('./dist/index.js');

const ps7 = { type: "powershell", supportsConditionalConnectors: true, needsUnixTranslation: true, targetShell: "powershell" };

console.log("Testing find command:");
const cmd1 = "find . -name '*.tmp' -delete";
console.log("Input:", cmd1);

// Check what mapping is found
const mapping = getBidirectionalMapping("find", "unix");
console.log("Bidirectional mapping for 'find':", mapping);

// Check direct bidirectional translation
const result = translateBidirectional("find", "unix", "powershell", ["-name", "-delete"], [".", "'*.tmp'"]);
console.log("Direct bidirectional result:", result);

console.log("Final output:", translateCommand(cmd1, ps7));

console.log("\nTesting find command 2:");
const cmd2 = "find . -type f -exec echo {} ;";
console.log("Input:", cmd2);
console.log("Output:", translateCommand(cmd2, ps7)); 