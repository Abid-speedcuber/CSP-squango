/* ==== FILE: js/tools/algorithm-animation-core.js ==== */

(function (global) {
    'use strict';

    const SOLVED_HEX = Object.freeze({
        tlHex: '011233455677',
        blHex: '998bbaddcffe'
    });

    function getSolvedHex() {
        return { ...SOLVED_HEX };
    }

    function parseScrambleLegacy(scramble) {
        const paired = global.parseScramble(scramble);
        const moves = [];

        for (const move of paired) {
            if (move.type === 'twist') {
                moves.push(move);
                continue;
            }

            const { top, bottom } = move;
            if (top !== 0) moves.push({ type: 'turn', top, bottom: 0 });
            if (bottom !== 0) moves.push({ type: 'turn', top: 0, bottom });
            if (top === 0 && bottom === 0) moves.push({ type: 'turn', top: 0, bottom: 0 });
        }

        return moves;
    }

    function parseAnimationScramble(scramble, animateBothLayers = false) {
        if (animateBothLayers) return global.parseScramble(scramble);
        return parseScrambleLegacy(scramble);
    }

    function scrambleToHex(scramble, animateBothLayers = false) {
        const moves = parseAnimationScramble(scramble, animateBothLayers);
        let { tlHex, blHex } = getSolvedHex();

        for (const move of moves) {
            if (move.type === 'twist') {
                ({ tlHex, blHex } = global.hexTwist(tlHex, blHex));
            } else if (move.type === 'turn') {
                tlHex = global.hexCycleLeft(tlHex, move.top);
                blHex = global.hexCycleLeft(blHex, move.bottom);
            }
        }

        return { tlHex, blHex };
    }

    function findBothLayerTokenEnd(chars, position) {
        let end = position + 1;
        while (end < chars.length && (chars[end] === '-' || /\d/.test(chars[end]) || chars[end] === ',' || chars[end] === ')')) {
            if (chars[end] === ')') {
                end++;
                break;
            }
            end++;
        }
        return end;
    }

    function findNumberEnd(chars, position) {
        let end = position + 1;
        while (end < chars.length && (chars[end] === '-' || /\d/.test(chars[end]))) {
            end++;
        }
        return end;
    }

    function buildStep({ alg, position, highlightStart, highlightEnd, description }) {
        return {
            position,
            highlightStart,
            highlightEnd,
            currentAlg: alg.substring(position),
            description
        };
    }

    function generateBothLayerSteps(alg, chars) {
        const steps = [];
        let position = 0;

        while (position < chars.length) {
            const char = chars[position];

            if (char === '/') {
                steps.push(buildStep({
                    alg,
                    position,
                    highlightStart: position,
                    highlightEnd: position + 1,
                    description: 'Slash (twist)'
                }));
                position++;
            } else if (char === '(') {
                const tokenEnd = findBothLayerTokenEnd(chars, position);
                steps.push(buildStep({
                    alg,
                    position,
                    highlightStart: position,
                    highlightEnd: tokenEnd,
                    description: 'Both layers turn'
                }));
                position = tokenEnd;
            } else {
                position++;
            }
        }

        return steps;
    }

    function generateLegacySteps(alg, chars) {
        const steps = [];
        let position = 0;

        while (position < chars.length) {
            const char = chars[position];

            if (char === '/') {
                steps.push(buildStep({
                    alg,
                    position,
                    highlightStart: position,
                    highlightEnd: position + 1,
                    description: 'Slash (twist)'
                }));
                position++;
            } else if (char === '(') {
                const tokenEnd = findNumberEnd(chars, position);
                steps.push(buildStep({
                    alg,
                    position,
                    highlightStart: position,
                    highlightEnd: tokenEnd,
                    description: 'Top layer turn'
                }));
                position = tokenEnd;
            } else if (char === ',') {
                let tokenEnd = findNumberEnd(chars, position);
                if (tokenEnd < chars.length && chars[tokenEnd] === ')') {
                    tokenEnd++;
                }

                const remainingAlg = alg.substring(position + 1);
                steps.push({
                    position,
                    highlightStart: position + 1,
                    highlightEnd: tokenEnd,
                    currentAlg: '(0,' + remainingAlg,
                    description: 'Bottom layer turn'
                });

                position = tokenEnd;
            } else {
                position++;
            }
        }

        return steps;
    }

    function generateSteps(alg, animateBothLayers = false) {
        const chars = alg.split('');
        const steps = animateBothLayers
            ? generateBothLayerSteps(alg, chars)
            : generateLegacySteps(alg, chars);

        steps.push({
            position: alg.length,
            highlightStart: alg.length,
            highlightEnd: alg.length,
            currentAlg: '',
            description: 'Solved state'
        });

        let firstNonZeroIndex = 0;
        for (let i = 0; i < steps.length; i++) {
            if (!isZeroMove(steps[i], alg, animateBothLayers)) {
                firstNonZeroIndex = i;
                break;
            }
        }

        return steps.slice(firstNonZeroIndex);
    }

    function getHexForStep(step, animateBothLayers = false) {
        try {
            if (step.currentAlg.trim() === '' || step.currentAlg === '(0,0)') {
                return getSolvedHex();
            }

            const inverted = global.invertScramble(step.currentAlg);
            return scrambleToHex(inverted, animateBothLayers);
        } catch {
            return getSolvedHex();
        }
    }

    function isZeroMove(step, originalAlg, animateBothLayers) {
        const highlighted = originalAlg.substring(step.highlightStart, step.highlightEnd);

        if (highlighted.includes('/')) {
            return false;
        }

        if (animateBothLayers) {
            const match = highlighted.match(/\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?/);
            if (!match) return false;

            const top = parseInt(match[1]);
            const bottom = parseInt(match[2]);
            return top === 0 && bottom === 0;
        }

        const numberMatch = highlighted.match(/-?\d+/);
        if (!numberMatch) return false;

        return parseInt(numberMatch[0]) === 0;
    }

    global.SQG = global.SQG || {};
    global.SQG.algAnimation = Object.freeze({
        getSolvedHex,
        parseAnimationScramble,
        parseScrambleLegacy,
        scrambleToHex,
        generateSteps,
        getHexForStep,
        isZeroMove
    });
})(window);
