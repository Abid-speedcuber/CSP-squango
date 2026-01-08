// Hex generation functions from random generator
function rn(n) {
    return Math.floor(Math.random() * n);
}

function SqCubie() {
    this.ul = 0x011233;
    this.ur = 0x455677;
    this.dl = 0x998bba;
    this.dr = 0xddcffe;
    this.ml = 0;
}

SqCubie.prototype.toString = function() {
    return this.ul.toString(16).padStart(6, '0') +
        this.ur.toString(16).padStart(6, '0') +
        "|/".charAt(this.ml) +
        this.dl.toString(16).padStart(6, '0') +
        this.dr.toString(16).padStart(6, '0');
}

SqCubie.prototype.setPiece = function(idx, value) {
    if (idx < 6) {
        this.ul &= ~(0xf << ((5 - idx) << 2));
        this.ul |= value << ((5 - idx) << 2);
    } else if (idx < 12) {
        this.ur &= ~(0xf << ((11 - idx) << 2));
        this.ur |= value << ((11 - idx) << 2);
    } else if (idx < 18) {
        this.dl &= ~(0xf << ((17 - idx) << 2));
        this.dl |= value << ((17 - idx) << 2);
    } else {
        this.dr &= ~(0xf << ((23 - idx) << 2));
        this.dr |= value << ((23 - idx) << 2);
    }
}

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

function generateCubeFromShapeIndex(shapeIndex) {
    const f = new SqCubie();
    const shape = Shape_ShapeIdx[shapeIndex];
    let corner = 0x01234567 << 1 | 0x11111111;
    let edge = 0x01234567 << 1;
    let n_corner = 8, n_edge = 8;
    
    for (let i = 0; i < 24; i++) {
        if (((shape >> i) & 1) === 0) {
            const rnd = rn(n_edge) << 2;
            f.setPiece(23 - i, (edge >> rnd) & 0xf);
            const m = (1 << rnd) - 1;
            edge = (edge & m) + ((edge >> 4) & ~m);
            n_edge--;
        } else {
            const rnd = rn(n_corner) << 2;
            f.setPiece(23 - i, (corner >> rnd) & 0xf);
            f.setPiece(22 - i, (corner >> rnd) & 0xf);
            const m = (1 << rnd) - 1;
            corner = (corner & m) + ((corner >> 4) & ~m);
            n_corner--;
            i++;
        }
    }
    f.ml = rn(2);
    return f;
}

function generateHexFromShapeIndex(shapeIndex) {
    const cube = generateCubeFromShapeIndex(shapeIndex);
    return cube.toString();
}

// Initialize shapes on load
initShapes();
