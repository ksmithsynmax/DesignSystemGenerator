const fs = require('fs');
const code = fs.readFileSync('/Users/kevinsmith/Desktop/DesignSystemGenerator/figma-plugin/code.js', 'utf8');

// We can run a quick check if there are any obvious syntax errors
try {
  new Function(code);
  console.log("Syntax OK");
} catch (e) {
  console.error("Syntax Error:", e);
}
