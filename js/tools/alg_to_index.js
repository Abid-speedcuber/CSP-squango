#!/usr/bin/env node

/**
 * Square-1 Algorithm to Shape Index Converter
 * Pipeline: Parse → Invert → Hexify → Shape Index
 * 
 * Usage:
 *   CLI: node algToShapeIndex.js "/(4,2)/(-2,2)/..."
 *   Module: const result = require('./algToShapeIndex')("/(4,2)/...");
 *   Browser: const result = algToShapeIndex("/(4,2)/...");
 */

(function(global) {
  'use strict';

  function algToShapeIndex(scrambleText) {
    
    // ========================================
    // SHAPE INITIALIZATION (from getSpecificHex.js)
    // ========================================
    const Shape_halflayer = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
    const Shape_ShapeIdx = [];
    
    function initShapes() {
      let count = 0;
      for (let i = 0; i < 28561; i++) {
        const dr = Shape_halflayer[i % 13];
        const dl = Shape_halflayer[Math.floor(i / 13) % 13];
        const ur = Shape_halflayer[Math.floor(Math.floor(i / 13) / 13) % 13];
        const ul = Shape_halflayer[Math.floor(Math.floor(Math.floor(i / 13) / 13) / 13)];
        const value = ul << 18 | ur << 12 | dl << 6 | dr;

        let bitCount = 0;
        let temp = value;
        while (temp) {
          bitCount += temp & 1;
          temp >>= 1;
        }

        if (bitCount === 16) {
          Shape_ShapeIdx[count++] = value;
        }
      }
    }
    
    initShapes();

    // ========================================
    // INVERT FUNCTION (from hexify.js)
    // ========================================
    function pleaseInvertThisScrambleForSolutionVisualization(scrambleString) {
      if (!scrambleString) return scrambleString;
      let str = String(scrambleString).trim();
      
      const parts = str.split('/');
      const reversed = parts.slice().reverse();
      
      const inverted = reversed.map(part => {
        part = part.trim();
        
        const turnMatch = part.match(/\(([^)]+)\)/);
        if (turnMatch) {
          const values = turnMatch[1].split(',').map(v => v.trim());
          const invertedValues = values.map(v => {
            const num = parseInt(v);
            if (isNaN(num)) return v;
            return String(-num);
          });
          return '(' + invertedValues.join(',') + ')';
        }
        
        if (part.includes(',')) {
          const values = part.split(',').map(v => v.trim());
          const invertedValues = values.map(v => {
            const num = parseInt(v);
            if (isNaN(num)) return v;
            return String(-num);
          });
          return invertedValues.join(',');
        }
        
        return part;
      });
      
      return inverted.join('/');
    }

    // ========================================
    // PARSE SCRAMBLE (from hexify.js)
    // ========================================
    function parseScramble(scramble) {
      const moves = [];
      
      let i = 0;
      while (i < scramble.length) {
        const char = scramble[i];
        
        if (char === '/' || char === '\\') {
          moves.push({ type: 'twist' });
          i++;
        }
        else if (char === '(' || char === '-' || /\d/.test(char)) {
          let moveStr = '';
          let parenDepth = 0;
          let startPos = i;
          
          while (i < scramble.length) {
            const c = scramble[i];
            if (c === '(') parenDepth++;
            if (c === ')') parenDepth--;
            
            if (c === '/' || c === '\\') {
              break;
            }
            
            if ((c === ',' || c === '-' || /\d/.test(c) || c === '(' || c === ')') && parenDepth >= 0) {
              moveStr += c;
            }
            
            i++;
            
            if (parenDepth === 0 && moveStr.includes(',')) {
              break;
            }
          }
          
          const cleaned = moveStr.replace(/[()]/g, '').trim();
          if (cleaned.includes(',')) {
            const [top, bottom] = cleaned.split(',').map(n => parseInt(n.trim()));
            moves.push({ type: 'turn', top, bottom });
          }
        }
        else if (/\s/.test(char)) {
          i++;
        }
        else {
          i++;
        }
      }
      return moves;
    }

    // ========================================
    // TWIST (from hexify.js)
    // ========================================
    function twist(tlHex, blHex) {
      const tlFirst6 = tlHex.slice(0, 6);
      const tlLast6 = tlHex.slice(6);
      const blFirst6 = blHex.slice(0, 6);
      const blLast6 = blHex.slice(6);
      
      return {
        tlHex: tlFirst6 + blFirst6,
        blHex: tlLast6 + blLast6
      };
    }

    // ========================================
    // CYCLE LEFT (from hexify.js)
    // ========================================
    function cycleLeft(hex, places) {
      const normalized = ((places % 12) + 12) % 12;
      return hex.slice(normalized) + hex.slice(0, normalized);
    }

    // ========================================
    // SQ1 ALG TO HEX (from hexify.js)
    // ========================================
    function sq1AlgToHex(scramble) {
      let tlHex = '011233455677';
      let blHex = '998bbaddcffe';

      const moves = parseScramble(scramble);

      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];

        if (move.type === 'twist') {
          const result = twist(tlHex, blHex);
          tlHex = result.tlHex;
          blHex = result.blHex;
        } else if (move.type === 'turn') {
          tlHex = cycleLeft(tlHex, move.top);
          blHex = cycleLeft(blHex, move.bottom);
        }
      }
      return { tlHex, blHex };
    }

    // ========================================
    // GET SHAPE INDEX FROM HEX (from draw-scramble.js + getSpecificHex.js)
    // ========================================
    function getShapeIndexFromHex(tlHex, blHex) {
      const hexScrambleCode = tlHex + '|' + blHex;
      
      if (hexScrambleCode.length !== 25) {
        throw new Error('Invalid hex format - needs 25 characters!');
      }
      
      const shapeArray = new Array(24);
      let scrambleIdx = 0;
      
      for (let i = 0; i < 12; i++) {
        if (scrambleIdx === 12) scrambleIdx++;
        const piece = hexScrambleCode[scrambleIdx];
        const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
        shapeArray[i] = isCorner ? 1 : 0;
        scrambleIdx++;
      }
      
      scrambleIdx = 13;
      for (let i = 12; i < 24; i++) {
        const piece = hexScrambleCode[scrambleIdx];
        const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
        shapeArray[i] = isCorner ? 1 : 0;
        scrambleIdx++;
      }
      
      let shapeValue = 0;
      for (let i = 0; i < 24; i++) {
        shapeValue |= shapeArray[23 - i] << i;
      }
      
      const shapeIndex = Shape_ShapeIdx.indexOf(shapeValue);
      
      if (shapeIndex === -1) {
        throw new Error('Invalid shape - not found in shape index array');
      }
      
      return shapeIndex;
    }

    // ========================================
    // MAIN PIPELINE
    // ========================================
    
    // Step 1: Invert the scramble
    const invertedScramble = pleaseInvertThisScrambleForSolutionVisualization(scrambleText);
    
    // Step 2: Hexify the inverted scramble
    const { tlHex, blHex } = sq1AlgToHex(invertedScramble);
    
    // Step 3: Get shape index from hex
    const shapeIndex = getShapeIndexFromHex(tlHex, blHex);
    
    return {
      original: scrambleText,
      inverted: invertedScramble,
      tlHex: tlHex,
      blHex: blHex,
      shapeIndex: shapeIndex
    };
  }

  // ========================================
  // EXPORTS
  // ========================================
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = algToShapeIndex;
  }
  
  if (typeof window !== 'undefined') {
    window.algToShapeIndex = algToShapeIndex;
  }
  
  if (typeof define === 'function' && define.amd) {
    define([], function() {
      return algToShapeIndex;
    });
  }
  
  // ========================================
  // CLI USAGE
  // ========================================
  
  if (typeof require !== 'undefined' && require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      process.exit(1);
    }
    
    const scramble = args.join(' ');
    
    try {
      const result = algToShapeIndex(scramble);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
  
})(typeof window !== 'undefined' ? window : global);