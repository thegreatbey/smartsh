"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectShell = exports.translateCommand = void 0;
// Wrapper to import smartsh functions
const path = require("path");
// Import the compiled smartsh module
const smartshPath = path.join(__dirname, '../../dist/cli.js');
const smartsh = require(smartshPath);
// Export the functions we need
exports.translateCommand = smartsh.translateCommand;
exports.detectShell = smartsh.detectShell;
//# sourceMappingURL=smartsh-wrapper.js.map