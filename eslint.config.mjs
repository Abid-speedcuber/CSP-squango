import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.browser,
      sourceType: "script",
      ecmaVersion: "latest"
    },
    rules: {
      "no-unused-vars": ["warn", {
        args: "all",
        argsIgnorePattern: "^_",
        vars: "all",
        varsIgnorePattern: "^(generateModalHTML|openNewParityAnalysis|openEditCaseModal|openCustomizeSVGsModal|openNotesModal|openParityTracingPersonalization|render|filteredData|algorithmFontSize|getCaseNameFromScramble|isCaseEvil|initializeSVGData|getPresetDefaults|handleFileImport|searchInput|sortSelect|learnFilterSelect|grid|initializeDOMReferences|scrambleToHex|invertScramble|applyScrambleToCubeState|encodeCubeStateToHex|hexToShapeIndex|shapeIndexToHex)$"
      }],
      "no-unreachable": "error"
    }
  },
  {
    files: ["refactor/database/**/*.js", "refactor/res/shapeImages/**/*.js"],
    rules: {
      "no-unused-vars": "off"
    }
  }
]);
