const { compileToSExpr } = require('./mini.js/dist/compiler.js');
const expr = compileToSExpr('"hello"');
console.log(expr);
