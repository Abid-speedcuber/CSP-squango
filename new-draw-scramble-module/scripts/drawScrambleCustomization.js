import { createSquare1Core } from './drawScrambleCore.js';
import { algToHex, invertScramble, unkarnify } from './parseScramble.js';

function clonePiecesColors(piecesColors) {
    return JSON.parse(JSON.stringify(piecesColors));
}

export function createSquare1Visualizer(initialState = {}) {
    const core = createSquare1Core(initialState);

    function setPieceColor(id, color) {
        const [piece, sticker] = id.split(' ');
        if (!sticker) throw new Error(`piece id ${id} is not valid.`);

        const piecesColors = clonePiecesColors(core.getPiecesColors());

        if (piece === 'slice') {
            piecesColors.sliceColors = { ...piecesColors.sliceColors, [sticker]: color };
        } else if (parseInt(piece, 16) % 2 === 0) {
            piecesColors.edgeColors = {
                ...piecesColors.edgeColors,
                [piece]: { ...piecesColors.edgeColors[piece], [sticker]: color },
            };
        } else {
            piecesColors.cornerColors = {
                ...piecesColors.cornerColors,
                [piece]: { ...piecesColors.cornerColors[piece], [sticker]: color },
            };
        }

        core.setPiecesColors(piecesColors);
    }

    function resetPieceColor(id) {
        const [piece, sticker] = id.split(' ');
        if (!sticker) throw new Error(`piece id ${id} is not valid.`);

        const piecesColors = clonePiecesColors(core.getPiecesColors());
        const defaults = core.createDefaultPieceColors();

        if (piece === 'slice') {
            piecesColors.sliceColors = {
                ...piecesColors.sliceColors,
                [sticker]: defaults.sliceColors[sticker],
            };
        } else if (parseInt(piece, 16) % 2 === 0) {
            piecesColors.edgeColors = {
                ...piecesColors.edgeColors,
                [piece]: {
                    ...piecesColors.edgeColors[piece],
                    [sticker]: defaults.edgeColors[piece][sticker],
                },
            };
        } else {
            piecesColors.cornerColors = {
                ...piecesColors.cornerColors,
                [piece]: {
                    ...piecesColors.cornerColors[piece],
                    [sticker]: defaults.cornerColors[piece][sticker],
                },
            };
        }

        core.setPiecesColors(piecesColors);
    }

    function resetPiecesColors() {
        core.setPiecesColors(core.createDefaultPieceColors());
    }

    return {
        ...core,
        algToHex,
        invertScramble,
        unkarnify,
        setPieceColor,
        resetPieceColor,
        resetPiecesColors,
    };
}

export const sq1vis = createSquare1Visualizer();

if (typeof window !== 'undefined') window.sq1vis = sq1vis;
