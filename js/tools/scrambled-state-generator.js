// ========================================
// Square-1 Random Scrambled State Generator
// Uses consolidated functions from utils.js
// ========================================

// Re-export from utils.js (loaded first via script tag)
if (typeof window !== 'undefined') {
    window.initShapes = window.initShapes || function() {};
    window.cubeFromShape = window.cubeFromShape || function(shapeIndex) {
        const f = new window.Square1Cubie();
        const shape = window.validShapeIndices[shapeIndex];
        let corner = 0x01234567 << 1 | 0x11111111;
        let edge = 0x01234567 << 1;
        let n_corner = 8, n_edge = 8;
        for (let i = 0; i < 24; i++) {
            if (((shape >> i) & 1) === 0) {
                const rnd = Math.floor(Math.random() * n_edge) << 2;
                f.setPiece(23 - i, (edge >> rnd) & 0xf);
                const m = (1 << rnd) - 1;
                edge = (edge & m) + ((edge >> 4) & ~m);
                n_edge--;
            } else {
                const rnd = Math.floor(Math.random() * n_corner) << 2;
                f.setPiece(23 - i, (corner >> rnd) & 0xf);
                f.setPiece(22 - i, (corner >> rnd) & 0xf);
                const m = (1 << rnd) - 1;
                corner = (corner & m) + ((corner >> 4) & ~m);
                n_corner--;
                i++;
            }
        }
        f.ml = Math.floor(Math.random() * 2);
        return f;
    };
    window.shapeIndexToHex = window.shapeIndexToHex || function(shapeIndex) {
        const cube = window.cubeFromShape(shapeIndex);
        return cube.toString().replace('/', '|');
    };
}

// Initialize shapes (done in utils.js already, but keep for compatibility)
if (typeof window !== 'undefined' && typeof window.initShapes === 'function') {
    window.initShapes();
}