/* ==== FILE: js/tools/draw-scramble.js ==== */

// ========================================
// Square-1 Scramble Visualizer Library
// ========================================

// === SHAPE BUILDING ===
function clusterify(shapeArray) {
  const slots = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

  function processOneLayer(startIdx, endIdx) {
    let i = startIdx;
    while (i < endIdx) {
      const isThisACorner = shapeArray[i] === 1;

      if (isThisACorner) {
        const nextIdx = (i - startIdx + 1) % 12 + startIdx;
        if (nextIdx < endIdx && shapeArray[nextIdx] === 1) {
          slots.push({
            type: 'corner',
            startLetter: i,
            lettersCount: 2,
            label: letters[i] + letters[nextIdx]
          });
          i += 2;
        } else {
          slots.push({
            type: 'half-corner',
            startLetter: i,
            lettersCount: 1,
            label: letters[i]
          });
          i += 1;
        }
      } else {
        slots.push({
          type: 'edge',
          startLetter: i,
          lettersCount: 1,
          label: letters[i]
        });
        i += 1;
      }
    }
  }

  processOneLayer(0, 12);
  processOneLayer(12, 24);

  return slots;
}

function parseHexToDraw(hexScramble, slotsList) {
  const assignments = {};
  for (let i = 0; i < slotsList.length; i++) {
    const slot = slotsList[i];
    const letterIndex = slot.startLetter;

    const scrambleIdx = (letterIndex < 12)
      ? letterIndex
      : 13 + (letterIndex - 12);

    assignments[slot.label] = hexScramble[scrambleIdx];
  }

  return assignments;
}

// === GEOMETRY HELPERS ===
function polarToCartesian(centerX, centerY, radius, angleDegrees) {
  const angleRadians = angleDegrees * Math.PI / 180;
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY - radius * Math.sin(angleRadians)
  };
}

function pointArrayToSVGString(pointsArray) {
  return pointsArray.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function lerpBetweenTwoPoints(pointA, pointB, interpolationAmount) {
  return {
    x: pointA.x + (pointB.x - pointA.x) * interpolationAmount,
    y: pointA.y + (pointB.y - pointA.y) * interpolationAmount
  };
}

function gimmeTheAngleForThisSlot(slot, angleArray) {
  const angles = [];
  for (let k = 0; k < slot.lettersCount; k++) {
    const globalIdx = slot.startLetter + k;
    const localIdx = globalIdx >= 12 ? globalIdx - 12 : globalIdx;
    angles.push(angleArray[localIdx]);
  }
  return angles.reduce((sum, angle) => sum + angle, 0) / angles.length;
}

// === COLOR MAPPING ===
function whatColorIsThisEdgePiece(hexChar, colorScheme) {
  const { topColor, bottomColor, frontColor, rightColor, backColor, leftColor } = colorScheme;

  switch (hexChar.toLowerCase()) {
    case '0': return { inner: topColor, outer: backColor };
    case '2': return { inner: topColor, outer: leftColor };
    case '4': return { inner: topColor, outer: frontColor };
    case '6': return { inner: topColor, outer: rightColor };
    case '8': return { inner: bottomColor, outer: rightColor };
    case 'a': return { inner: bottomColor, outer: frontColor };
    case 'c': return { inner: bottomColor, outer: leftColor };
    case 'e': return { inner: bottomColor, outer: backColor };
    case 'E': return { inner: '#888888', outer: '#888888' };
    case 'R': return { inner: 'transparent', outer: 'transparent' };
    default: return { inner: '#4ecdc4', outer: '#4ecdc4' };
  }
}

function whatAreTheCornerColorLetters(hexChar) {
  switch ((hexChar || '').toLowerCase()) {
    case '1': return { top: 'y', left: 'b', right: 'o' };
    case '3': return { top: 'y', left: 'r', right: 'b' };
    case '5': return { top: 'y', left: 'g', right: 'r' };
    case '7': return { top: 'y', left: 'o', right: 'g' };
    case '9': return { top: 'w', left: 'g', right: 'o' };
    case 'b': return { top: 'w', left: 'r', right: 'g' };
    case 'd': return { top: 'w', left: 'b', right: 'r' };
    case 'f': return { top: 'w', left: 'o', right: 'b' };
    case 'C': return { top: '#888888', left: '#888888', right: '#888888' };
    default: return { top: '#4ecdc4', left: '#4ecdc4', right: '#4ecdc4' };
  }
}

function convertColorLetterToHexCode(colorLetter, colorScheme) {
  if (!colorLetter) return '#cccccc';
  const { topColor, bottomColor, frontColor, rightColor, backColor, leftColor } = colorScheme;

  switch (colorLetter.toLowerCase()) {
    case 'y': return topColor;
    case 'w': return bottomColor;
    case 'o': return backColor;
    case 'b': return leftColor;
    case 'r': return frontColor;
    case 'g': return rightColor;
    default: return '#cccccc';
  }
}

function gimmeCornerColorsAsHexCodes(hexChar, isThisBottomLayer, colorScheme) {
  const colorTriplet = whatAreTheCornerColorLetters(hexChar);
  let leftColor = convertColorLetterToHexCode(colorTriplet.left, colorScheme);
  let rightColor = convertColorLetterToHexCode(colorTriplet.right, colorScheme);
  const topColor = convertColorLetterToHexCode(colorTriplet.top, colorScheme);

  if (isThisBottomLayer) {
    [leftColor, rightColor] = [leftColor, rightColor];
  }

  return { top: topColor, left: leftColor, right: rightColor };
}

function whatColorIsThisHalfCorner() {
  return 'fill="#ff9999"';
}

// === SVG GENERATION FOR INDIVIDUAL PIECES ===
function CreateOnePieceSVG(slot, pieceHex, centerX, centerY, centerAngle, radiusInner, radiusOuter, radiusApex, isBottomLayer, strokeThin, strokeMedium, colorScheme) {
  isBottomLayer = !!(slot && typeof slot.startLetter === 'number' && slot.startLetter >= 12);

  let svgMarkup = '';
  const halfAngle = slot.type === 'corner' ? 30 : 15;

  if (slot.type === 'edge') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointA = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointB = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    const midRadius = radiusInner + (radiusOuter - radiusInner) * 0.8;
    const pointMidA = polarToCartesian(centerX, centerY, midRadius, centerAngle - halfAngle);
    const pointMidB = polarToCartesian(centerX, centerY, midRadius, centerAngle + halfAngle);

    const edgeColors = whatColorIsThisEdgePiece(pieceHex, colorScheme);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointMidA, pointA, pointB, pointMidB])}" fill="${edgeColors.outer}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointMidA, pointMidB])}" fill="${edgeColors.inner}" stroke="#333" stroke-width="${strokeThin}"/>`;

  } else if (slot.type === 'corner') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    const scaleFactor = 0.80;
    const pointSmallLeft = lerpBetweenTwoPoints(pointInner, pointOuterLeft, scaleFactor);
    const pointSmallRight = lerpBetweenTwoPoints(pointInner, pointOuterRight, scaleFactor);
    const pointSmallBottom = lerpBetweenTwoPoints(pointInner, pointApex, scaleFactor);

    const colors = gimmeCornerColorsAsHexCodes(pieceHex, isBottomLayer, colorScheme);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterLeft, pointApex, pointSmallBottom, pointSmallLeft])}" fill="${colors.left}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointSmallRight, pointSmallBottom, pointApex, pointOuterRight])}" fill="${colors.right}" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointSmallLeft, pointSmallBottom, pointSmallRight])}" fill="${colors.top}" stroke="#333" stroke-width="${strokeThin}"/>`;
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterLeft, pointApex, pointOuterRight])}" fill="none" stroke="#333" stroke-width="${strokeMedium}"/>`;
    svgMarkup += `<line x1="${pointApex.x.toFixed(2)}" y1="${pointApex.y.toFixed(2)}" x2="${pointSmallBottom.x.toFixed(2)}" y2="${pointSmallBottom.y.toFixed(2)}" stroke="#333" stroke-width="${strokeMedium}" stroke-linecap="round" class="corner-detail"/>`;

  } else if (slot.type === 'half-corner') {
    const halfInnerAngle = 15;
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfInnerAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfInnerAngle);

    const fillAttribute = whatColorIsThisHalfCorner(pieceHex);
    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterRight, pointApex, pointOuterLeft])}" ${fillAttribute} stroke="#333" stroke-width="${strokeThin}"/>`;
  }

  return svgMarkup;
}

// === MAIN SVG GENERATION ===
function GenerateTheFullSVGFromHexNotation(hexScrambleCode, desiredSize, colorScheme, ringDistance = 5) {
  if (hexScrambleCode.length !== 25) {
    throw new Error('Invalid scramble format - needs 25 characters!');
  }

  const shapeArray = new Array(24);
  let scrambleIdx = 0;

  // Determine shape for top layer (0-11)
  for (let i = 0; i < 12; i++) {
    if (scrambleIdx === 12) scrambleIdx++;
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  // Determine shape for bottom layer (12-23)
  scrambleIdx = 13;
  for (let i = 12; i < 24; i++) {
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  const slots = clusterify(shapeArray);
  const pieceAssignments = parseHexToDraw(hexScrambleCode, slots);

  // Calculate dimensions
  const svgSize = desiredSize;
  const unit10vh = desiredSize * 0.4;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  const radiusInner = 0;
  const radiusOuter = unit10vh * 0.7;
  const radiusApex = radiusOuter * 1.366025404;
  const ringRadius = radiusOuter + (unit10vh * 0.4);

  const strokeThin = desiredSize * 0.003;
  const strokeMedium = desiredSize * 0.004;
  const strokeRing = 0;
  const strokeLine = desiredSize * 0.008;
  const sliceTrim = 0.70;

  const centerToCenterDistance = ringRadius * (2 + ringDistance / 100);
  const marginLeft = centerToCenterDistance - svgSize;
  let htmlOutput = `<div style="display: flex; align-items: center;">`;

  // LEFT SVG (top layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="${colorScheme.circleColor}" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 75);
  const linePoint2Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 255);
  htmlOutput += `<line x1="${linePoint1Left.x}" y1="${linePoint1Left.y}" x2="${linePoint2Left.x}" y2="${linePoint2Left.y}" stroke="${colorScheme.dividerColor}" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const leftLayerAngles = Array.from({ length: 12 }, (_, j) => 90 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter < 12) {
      const piece = pieceAssignments[slot.label];
      const angle = gimmeTheAngleForThisSlot(slot, leftLayerAngles);
      htmlOutput += CreateOnePieceSVG(slot, piece, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, false, strokeThin, strokeMedium, colorScheme);
    }
  });

  htmlOutput += `</svg>`;

  // RIGHT SVG (bottom layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-left: ${marginLeft}px;">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="${colorScheme.circleColor}" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 105);
  const linePoint2Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 285);
  htmlOutput += `<line x1="${linePoint1Right.x}" y1="${linePoint1Right.y}" x2="${linePoint2Right.x}" y2="${linePoint2Right.y}" stroke="${colorScheme.dividerColor}" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const rightLayerAngles = Array.from({ length: 12 }, (_, j) => 300 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter >= 12) {
      const piece = pieceAssignments[slot.label];
      const angle = gimmeTheAngleForThisSlot(slot, rightLayerAngles);
      htmlOutput += CreateOnePieceSVG(slot, piece, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, true, strokeThin, strokeMedium, colorScheme);
    }
  });

  htmlOutput += `</svg></div>`;

  return htmlOutput;
}

// ========================================
// === CUBE SHAPE VISUALIZER ===
// ========================================

function CreateOneShapeOutlineSVG(slot, centerX, centerY, centerAngle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth) {
  let svgMarkup = '';
  const halfAngle = slot.type === 'corner' ? 30 : 15;

  if (slot.type === 'edge') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointA = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointB = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointA, pointB])}" fill="${edgeFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;

  } else if (slot.type === 'corner') {
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfAngle);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterLeft, pointApex, pointOuterRight])}" fill="${cornerFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;

  } else if (slot.type === 'half-corner') {
    const halfInnerAngle = 15;
    const pointInner = polarToCartesian(centerX, centerY, radiusInner, centerAngle);
    const pointOuterRight = polarToCartesian(centerX, centerY, radiusOuter, centerAngle - halfInnerAngle);
    const pointApex = polarToCartesian(centerX, centerY, radiusApex, centerAngle);
    const pointOuterLeft = polarToCartesian(centerX, centerY, radiusOuter, centerAngle + halfInnerAngle);

    svgMarkup += `<polygon points="${pointArrayToSVGString([pointInner, pointOuterRight, pointApex, pointOuterLeft])}" fill="${cornerFill}" stroke="#333" stroke-width="${strokeWidth}"/>`;
  }

  return svgMarkup;
}

function GenerateShapeVisualizationSVG(hexScrambleCode, size, edgeFill, cornerFill, strokeWidthBase, ringDistance = 5) {
  if (hexScrambleCode.length !== 25) {
    throw new Error('Invalid scramble format - needs 25 characters!');
  }

  const shapeArray = new Array(24);
  let scrambleIdx = 0;

  // Determine shape for top layer (0-11)
  for (let i = 0; i < 12; i++) {
    if (scrambleIdx === 12) scrambleIdx++;
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  // Determine shape for bottom layer (12-23)
  scrambleIdx = 13;
  for (let i = 12; i < 24; i++) {
    const piece = hexScrambleCode[scrambleIdx];
    const isCorner = ['1', '3', '5', '7', '9', 'b', 'd', 'f'].includes(piece.toLowerCase());
    shapeArray[i] = isCorner ? 1 : 0;
    scrambleIdx++;
  }

  const slots = clusterify(shapeArray);

  // Calculate dimensions
  const svgSize = size;
  const unit10vh = size * 0.4;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  const radiusInner = 0;
  const radiusOuter = unit10vh * 0.7;
  const radiusApex = radiusOuter * 1.366025404;
  const ringRadius = radiusOuter + (unit10vh * 0.4);

  const strokeWidth = (size / 200) * strokeWidthBase;
  const strokeRing = 0;
  const strokeLine = size * 0.008;
  const sliceTrim = 0.70;

  const centerToCenterDistance = ringRadius * (2 + ringDistance / 100);
  const marginLeft = centerToCenterDistance - svgSize;
  let htmlOutput = `<div style="display: flex; align-items: center;">`;

  // LEFT SVG (top layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="transparent" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 75);
  const linePoint2Left = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 255);
  htmlOutput += `<line x1="${linePoint1Left.x}" y1="${linePoint1Left.y}" x2="${linePoint2Left.x}" y2="${linePoint2Left.y}" stroke="#7a0000" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const leftLayerAngles = Array.from({ length: 12 }, (_, j) => 90 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter < 12) {
      const angle = gimmeTheAngleForThisSlot(slot, leftLayerAngles);
      htmlOutput += CreateOneShapeOutlineSVG(slot, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth);
    }
  });

  htmlOutput += `</svg>`;

  // RIGHT SVG (bottom layer)
  htmlOutput += `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" style="margin-left: ${marginLeft}px;">`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${ringRadius}" fill="transparent" stroke="rgba(0,0,0,0.08)" stroke-width="${strokeRing}"/>`;

  const linePoint1Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 105);
  const linePoint2Right = polarToCartesian(centerX, centerY, (ringRadius + 6) * sliceTrim, 285);
  htmlOutput += `<line x1="${linePoint1Right.x}" y1="${linePoint1Right.y}" x2="${linePoint2Right.x}" y2="${linePoint2Right.y}" stroke="#7a0000" stroke-width="${strokeLine}"/>`;
  htmlOutput += `<circle cx="${centerX}" cy="${centerY}" r="${unit10vh * 0.05}" fill="rgba(0,0,0,0.06)"/>`;

  const rightLayerAngles = Array.from({ length: 12 }, (_, j) => 300 + j * 30);

  slots.forEach(slot => {
    if (slot.startLetter >= 12) {
      const angle = gimmeTheAngleForThisSlot(slot, rightLayerAngles);
      htmlOutput += CreateOneShapeOutlineSVG(slot, centerX, centerY, angle, radiusInner, radiusOuter, radiusApex, edgeFill, cornerFill, strokeWidth);
    }
  });

  htmlOutput += `</svg></div>`;

  return htmlOutput;
}

/**
 * Visualize cube shape outlines only
 * @param {string|number} input - Can be: shapeIndex (number), hex code (string), or scramble notation (string)
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {string} edgeFill - Fill color for edges (default: 'transparent')
 * @param {string} cornerFill - Fill color for corners (default: 'transparent')
 * @param {number} strokeWidth - Base stroke width (default: 2, scales with size)
 * @returns {string} HTML string containing the SVG visualization
 */

function visualizeCubeShapeOutlines(input, size = 200, edgeFill = 'transparent', cornerFill = 'transparent', strokeWidth = 2, ringDistance = 5) {
  let hexCode;

  // Check if input is a shape index (number)
  if (typeof input === 'number') {
    hexCode = shapeIndexToHex(input);
  }
  // Check if input looks like hex code (contains |)
  else if (typeof input === 'string' && input.includes('|')) {
    hexCode = input;
  }
  // Otherwise treat as scramble notation
  else if (typeof input === 'string') {
    const cubeState = applyScrambleToCubeState(input);
    hexCode = encodeCubeStateToHex(cubeState);

    if (hexCode.startsWith('Error:')) {
      return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${hexCode}</div>`;
    }
  }
  else {
    return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">Error: Invalid input type</div>`;
  }

  return GenerateShapeVisualizationSVG(hexCode, size, edgeFill, cornerFill, strokeWidth, ringDistance);
}

// ========================================
// === THE THREE MAGICAL FUNCTIONS!!! ===
// ========================================

/**
 * Option 1: You already have the 25-character hex code
 * @param {string} hexCode - The 25-character scramble code (e.g., "6e0cc804a2a6|0e8c64ee20c4")
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {object} colors - Color customization object with defaults
 * @returns {string} HTML string containing the SVG visualization
 */
function visualizeFromHexCode(hexCode, size = 200, colors = {}, ringDistance = 5) {
  const colorScheme = {
    topColor: colors.topColor || '#000000',
    bottomColor: colors.bottomColor || '#FFFFFF',
    frontColor: colors.frontColor || '#CC0000',
    rightColor: colors.rightColor || '#00AA00',
    backColor: colors.backColor || '#FF8C00',
    leftColor: colors.leftColor || '#0066CC',
    dividerColor: colors.dividerColor || '#7a0000',
    circleColor: colors.circleColor || 'transparent'
  };

  return GenerateTheFullSVGFromHexNotation(hexCode, size, colorScheme, ringDistance);
}

/**
 * Option 2: You have a scramble notation
 * @param {string} scramble - Scramble notation (e.g., "(1,0) / (3,3) / (1,0) / ...")
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {object} colors - Color customization object
 * @returns {string} HTML string containing the SVG visualization
 */
function visualizeFromScrambleNotation(scramble, size = 200, colors = {}, ringDistance = 5) {
  const colorScheme = {
    topColor: colors.topColor || '#000000',
    bottomColor: colors.bottomColor || '#FFFFFF',
    frontColor: colors.frontColor || '#CC0000',
    rightColor: colors.rightColor || '#00AA00',
    backColor: colors.backColor || '#FF8C00',
    leftColor: colors.leftColor || '#0066CC',
    dividerColor: colors.dividerColor || '#7a0000',
    circleColor: colors.circleColor || 'transparent'
  };

  const cubeState = applyScrambleToCubeState(scramble);
  const hexCode = encodeCubeStateToHex(cubeState);

  if (hexCode.startsWith('Error:')) {
    return `<div style="color: #e53e3e; font-family: monospace; padding: 1rem;">${hexCode}</div>`;
  }

  return GenerateTheFullSVGFromHexNotation(hexCode, size, colorScheme, ringDistance);
}

/**
 * Option 3: You have a solution notation (will be inverted to show the state)
 * @param {string} solution - Solution notation (e.g., "(1,0) / (3,3) / (1,0) / ...")
 * @param {number} size - Desired size in pixels (default: 200)
 * @param {object} colors - Color customization object
 * @returns {string} HTML string containing the SVG visualization
 */
function visualizeFromSolutionNotation(solution, size = 200, colors = {}, ringDistance = 5) {
  const invertedScramble = invertScramble(solution);
  return visualizeFromScrambleNotation(invertedScramble, size, colors, ringDistance);
}

if (typeof window !== 'undefined') {
  window.Square1Visualizer = {
    visualizeFromHexCode,
    visualizeFromScrambleNotation,
    visualizeFromSolutionNotation,
    visualizeCubeShapeOutlines
  };
  window.Square1VisualizerLibraryWithSillyNames = window.Square1Visualizer;
}
