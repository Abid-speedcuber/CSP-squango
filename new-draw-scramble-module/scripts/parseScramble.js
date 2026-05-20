// =====================================================================
// === SCRAMBLE / ALG LOGIC ============================================
// =====================================================================

export function algToHex(scramble) {
    let tlHex = '011233455677';
    let blHex = '998bbaddcffe';
    for (const move of parseScramble(scramble)) {
        if (move.type === 'twist') {
            ({ tlHex, blHex } = twist(tlHex, blHex));
        } else {
            tlHex = cycleLeft(tlHex, move.top);
            blHex = cycleLeft(blHex, move.bottom);
        }
    }
    return { tlHex, blHex };
}

export function parseScramble(scramble) {
    const moves = [];
    const parts = scramble.replace(/\//g, ' / ').trim().split(/\s+/).filter(Boolean);
    for (const part of parts) {
        if (part === '/') {
            moves.push({ type: 'twist' });
        } else if (part.includes(',')) {
            const [top, bottom] = part.replace(/[()]/g, '').split(',').map(n => parseInt(n.trim()));
            if (!isNaN(top) && !isNaN(bottom)) moves.push({ type: 'turn', top, bottom });
        }
    }
    return moves;
}

function twist(tlHex, blHex) {
    return { tlHex: tlHex.slice(0, 6) + blHex.slice(0, 6), blHex: tlHex.slice(6) + blHex.slice(6) };
}

function cycleLeft(hex, places) {
    const n = ((places % 12) + 12) % 12;
    return hex.slice(n) + hex.slice(0, n);
}

export function invertScramble(str) {
    if (!str) return str;
    return String(str).trim().split('/').reverse().map(part => {
        part = part.trim();
        const src = part.includes('(') ? part.match(/\(([^)]+)\)/)?.[1] : part.includes(',') ? part : null;
        if (!src) return part;
        const inverted = src.split(',').map(v => { const n = parseInt(v.trim()); return isNaN(n) ? v.trim() : String(-n); }).join(',');
        return part.includes('(') ? `(${inverted})` : inverted;
    }).join('/');
}

function dictReplace(str, dict) {
    const pattern = new RegExp(Object.keys(dict).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    let prev;
    do { prev = str; str = str.replace(pattern, m => dict[m]); } while (str !== prev);
    return str;
}

// ── Karn → WCA notation tables ───────────────────────────────────────
const karnToWCA = {
    " U4 ": " U U' U U' ", " U4' ": " U' U U' U ", " D4 ": " D D' D D' ", " D4' ": " D' D D' D ",
    " u4 ": " u u' u u' ", " u4' ": " u' u u' u ", " d4 ": " d d' d d' ", " d4' ": " d' d d' d ",
    " U3 ": " U U' U ", " U3' ": " U' U U' ", " D3 ": " D D' D ", " D3' ": " D' D D' ",
    " u3 ": " u u' u ", " u3' ": " u' u u' ", " d3 ": " d d' d ", " d3' ": " d' d d' ",
    " F3 ": " F F' F ", " F3' ": " F' F F' ", " f3 ": " f f' f ", " f3' ": " f' f f' ",
    " W ": " U U' ", " W' ": " U' U ", " B ": " D D' ", " B' ": " D' D ",
    " w ": " u u' ", " w' ": " u' u ", " b ": " d d' ", " b' ": " d' d ",
    " F2 ": " F F' ", " F2' ": " F' F ", " f2 ": " f f' ", " f2' ": " f' f ",
    " UU ": " U U ", " UU' ": " U' U' ", " DD ": " D D ", " DD' ": " D' D' ",
    " U2 ": " 6,0 ", " U2D ": " 6,3 ", " U2D' ": " 6,-3 ", " U2D2 ": " 6,6 ",
    " D2 ": " 0,6 ", " UD2 ": " 3,6 ", " U'D2 ": " -3,6 ",
    " U ": " 3,0 ", " U' ": " -3,0 ", " D ": " 0,3 ", " D' ": " 0,-3 ",
    " E ": " 3,-3 ", " E' ": " -3,3 ", " e ": " 3,3 ", " e' ": " -3,-3 ",
    " u ": " 2,-1 ", " u' ": " -2,1 ", " d ": " -1,2 ", " d' ": " 1,-2 ",
    " F' ": " -4,-1 ", " F ": " 4,1 ", " f' ": " -1,-4 ", " f ": " 1,4 ",
    " T ": " 2,-4 ", " T' ": " -2,4 ", " t' ": " -4,2 ", " t ": " 4,-2 ",
    " m ": " 2,2 ", " m' ": " -2,-2 ", " M' ": " -1,-1 ", " M ": " 1,1 ",
    " u2 ": " 5,-1 ", " u2' ": " -5,1 ", " d2 ": " -1,5 ", " d2' ": " 1,-5 ",
    " K' ": " -5,-2 ", " K ": " 5,2 ", " k ": " 2,5 ", " k' ": " -2,-5 ",
};

const shorthandToKarn = {
    "bjj": "/U' e D'/", "fjj": "/U e' D/", "bpj10": "/d m' U/", "bpj0-1": "/u' m D'/",
    "fpj10": "/u m' D/", "fpj0-1": "/d' m U'/", "nn": "/E E'/", "aa10": "/u m' u T'/",
    "aa0-1": "/U m' U t'/", "fadj10": "/D M' d'/", "dadj10": "/D M' d'/", "fadj0-1": "/U' M u/",
    "u'adj0-1": "/U' M u/", "badj10": "/U M u'/", "uadj10": "/U M u'/", "badj0-1": "/D' M d/",
    "d'adj0-1": "/D' M d/", "bb10": "/T u' e U'/", "bb0-1": "/t d e' D/",
    "fdd10": "/D e' d t/", "fdd0-1": "/U' e u' T/", "bdd10": "/U e' u T'/", "bdd0-1": "/D' e d' t'/",
    "ff10": "/d m' d M E/", "fv10": "/d4/", "fv0-1": "/d4'/", "vf10": "/u4/", "vf0-1": "/u4'/",
    "jf10": "/w D' u T'/", "jf0-1": "/w' D u' T/", "fj10": "/b U' d t/", "fj0-1": "/b' U d' t'/",
    "jr00": "/e' w e/", "jr10": "/e' b e/", "jr0-1": "/e' w' e/", "jr1-1": "/e' b' e/",
    "rj00": "/e b' e'/", "rj10": "/e w e'/", "rj0-1": "/e b' e'/", "rj1-1": "/e w e'/",
    "jv10": "/b D d d2'/", "jv0-1": "/b' D' d' d2/", "vj10": "/w U u u2'/", "vj0-1": "/w' U' u' u2/",
    "kk10": "/u m' U E'/", "kk0-1": "/U m' u E'/", "opp10": "/u2 u2'/", "opp0-1": "/u2' u2/",
    "pn10": "/T T'/", "pn0-1": "/t t'/", "px10": "/f' d3' f'/", "px0-1": "/f d3 f/",
    "xp10": "/F' u3' F'/", "xp0-1": "/F u3 F/", "tt10": "/d m' F' u2'/",
    "fss10": "/u M D' E'/", "fss0-1": "/D' M u E'/", "bss10": "/D M' u' E/", "bss0-1": "/U' M d E/",
    "vv10": "/u M u m' E'/", "zz10": "/u M t' M D'/", "zz0-1": "/D' M t' M u/",
};

export function unkarnify(scramble) {
    scramble = scramble.replaceAll(/[\/\\]/g, ' ').replaceAll(/[()]/g, '').replaceAll(/ +/g, ' ');
    scramble = addCommas(scramble);
    return replaceShorthands(dictReplace(' ' + scramble + ' ', karnToWCA).slice(1, -1));
}

function replaceShorthands(scramble) {
    const moves = scramble.split(' ');
    const allKnown = moves.every(m => !m || !isNaN(Number(m.charAt(0))) || (' ' + m + ' ' in karnToWCA));
    if (allKnown) {
        return dictReplace(' ' + scramble + ' ', karnToWCA).slice(1, -1).replaceAll(' ', '/');
    }
    let topA = false, bottomA = false;
    for (const move of moves) {
        if (!move) continue;
        if (move.includes(',')) {
            const [u, d] = move.split(',');
            if (parseInt(u, 10) % 3 !== 0) topA = !topA;
            if (parseInt(d, 10) % 3 !== 0) bottomA = !bottomA;
        } else {
            const key = ['bjj', 'fjj', 'nn'].includes(move.toLowerCase())
                ? move.toLowerCase()
                : move.toLowerCase() + getAlignment(topA, bottomA);
            const replacement = shorthandToKarn[key];
            if (replacement === undefined) throw new Error(`${move} with ${getAlignment(topA, bottomA)} alignment is not a thing.`);
            scramble = scramble.replace(move, replacement);
            for (const sub of dictReplace(' ' + replacement + ' ', karnToWCA).split(' ')) {
                const [u, d] = sub.split(',');
                if (parseInt(u, 10) % 3 !== 0) topA = !topA;
                if (parseInt(d, 10) % 3 !== 0) bottomA = !bottomA;
            }
        }
    }
    return dictReplace(' ' + scramble.replaceAll(/ *\/ */g, '/').replaceAll(/\/\//g, '/0,0/').replaceAll(/\//g, ' ') + ' ', karnToWCA)
        .slice(1, -1).replaceAll(' ', '/');
}

function getAlignment(topA, bottomA) {
    return (topA ? '1' : '0') + (bottomA ? '-1' : '0');
}

function addCommas(scramble) {
    return scramble.split(' ').map(move => {
        if (!move || isNaN(Number(move.replace(/-/g, '')))) return move;
        switch (move.length) {
            case 1: return move + ',0';
            case 2: return move.charAt(0) === '-' ? move + ',0' : move[0] + ',' + move[1];
            case 3: return move.charAt(0) === '-' ? move.slice(0, 2) + ',' + move[2] : move[0] + ',' + move.slice(1);
            case 4: return move.slice(0, 2) + ',' + move.slice(2);
            default: throw new Error(`${move} is not a valid move`);
        }
    }).join(' ');
}
