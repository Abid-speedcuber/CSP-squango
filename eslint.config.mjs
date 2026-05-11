import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import fs from "node:fs";
import path from "node:path";
import parser from "@babel/parser";

const refactorRoots = [
  "refactor/js",
  "refactor/database",
  "refactor/res/shapeImages"
];

function walkJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkJsFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

function collectRefactorGlobals() {
  const names = new Set();
  for (const filePath of refactorRoots.flatMap(walkJsFiles)) {
    const source = fs.readFileSync(filePath, "utf8");
    const ast = parser.parse(source, {
      sourceType: "module",
      plugins: ["topLevelAwait"]
    });

    for (const node of ast.program.body) {
      if (node.type === "ExportNamedDeclaration" && node.declaration) {
        const declaration = node.declaration;
        if (declaration.type === "FunctionDeclaration" && declaration.id) {
          names.add(declaration.id.name);
        }
        if (declaration.type === "VariableDeclaration") {
          for (const item of declaration.declarations) {
            if (item.id.type === "Identifier") names.add(item.id.name);
          }
        }
      }
    }

    const windowExportPattern = /\b(?:window|globalThis|global)\.([A-Za-z_$][\w$]*)\s*=/g;
    for (const match of source.matchAll(windowExportPattern)) {
      names.add(match[1]);
    }
  }

  return Object.fromEntries([...names].sort().map(name => [name, "writable"]));
}

const refactorGlobals = collectRefactorGlobals();
const restrictedRefactorGlobals = Object.keys(refactorGlobals).map(name => ({
  name,
  message: "Import this refactor module binding explicitly instead of relying on a window/global fallback."
}));

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...refactorGlobals
      },
      sourceType: "module",
      ecmaVersion: "latest"
    },
    rules: {
      "no-unused-vars": ["warn", {
        args: "all",
        argsIgnorePattern: "^_",
        vars: "all",
        varsIgnorePattern: "^(generateModalHTML|openNewParityAnalysis|openEditCaseModal|openCustomizeSVGsModal|openNotesModal|openParityTracingPersonalization|render|filteredData|algorithmFontSize|getCaseNameFromScramble|isCaseEvil|initializeSVGData|getPresetDefaults|handleFileImport|searchInput|sortSelect|learnFilterSelect|grid|initializeDOMReferences|scrambleToHex|invertScramble|applyScrambleToCubeState|encodeCubeStateToHex|hexToShapeIndex|shapeIndexToHex)$"
      }],
      "no-unreachable": "error",
      "no-undef": "error"
    }
  },
  {
    files: ["refactor/js/index.js"],
    rules: {
      "no-restricted-globals": ["error", ...restrictedRefactorGlobals]
    }
  },
  {
    files: ["refactor/database/**/*.js", "refactor/res/shapeImages/**/*.js"],
    rules: {
      "no-unused-vars": "off"
    }
  }
]);
