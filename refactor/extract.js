const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const code = fs.readFileSync('all-in-one.js', 'utf8');

const ast = parser.parse(code, {
  sourceType: "module",
  plugins: ["jsx"]
});

let functions = [];
let variables = [];
let arrays = [];
let objects = [];

traverse(ast, {
  FunctionDeclaration(path) {
    functions.push(path.node.id.name);
  },
  VariableDeclarator(path) {
    const name = path.node.id.name;
    variables.push(name);

    if (path.node.init?.type === "ArrayExpression") {
      arrays.push(name);
    }

    if (path.node.init?.type === "ObjectExpression") {
      objects.push(name);
    }
  }
});

const output = `
FUNCTIONS:
${functions.join('\n')}

VARIABLES:
${variables.join('\n')}

ARRAYS:
${arrays.join('\n')}

OBJECTS:
${objects.join('\n')}
`;

fs.writeFileSync('output.txt', output);
console.log("Done. Check output.txt");
