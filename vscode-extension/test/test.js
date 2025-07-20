// Simple test to verify the extension can load
const path = require('path');
const fs = require('fs');

// Check if the compiled extension exists
const extensionPath = path.join(__dirname, '../out/extension.js');
if (fs.existsSync(extensionPath)) {
  console.log('✅ Extension compiled successfully');
  console.log('📁 Extension path:', extensionPath);
} else {
  console.log('❌ Extension not found');
}

// Check if smartsh wrapper exists
const wrapperPath = path.join(__dirname, '../out/smartsh-wrapper.js');
if (fs.existsSync(wrapperPath)) {
  console.log('✅ Smartsh wrapper compiled successfully');
} else {
  console.log('❌ Smartsh wrapper not found');
} 