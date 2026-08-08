(function () {
    // Mathlib dependencies
    function getNPerm(arr, n) {
        if (n === undefined) n = arr.length;
        var idx = 0;
        for (var i = 0; i < n; i++) {
            idx *= (n - i);
            for (var j = i + 1; j < n; j++) {
                if (arr[i] > arr[j]) {
                    idx++;
                }
            }
        }
        return idx;
    }

    function setNPerm(arr, idx, n) {
        if (n === undefined) n = arr.length;
        arr.length = n;
        for (var i = n - 1; i >= 0; i--) {
            arr[i] = idx % (n - i);
            idx = ~~(idx / (n - i));
            for (var j = i + 1; j < n; j++) {
                if (arr[j] >= arr[i]) arr[j]++;
            }
        }
    }

    function circle(arr) {
        var leng = arguments.length - 1;
        var temp = arr[arguments[leng]];
        for (var i = leng; i > 1; i--) {
            arr[arguments[i]] = arr[arguments[i - 1]];
        }
        arr[arguments[1]] = temp;
        return circle;
    }

    function rn(n) {
        return Math.floor(Math.random() * n);
    }

    function bitCount(x) {
        x -= x >> 1 & 1431655765;
        x = (x >> 2 & 858993459) + (x & 858993459);
        x = (x >> 4) + x & 252645135;
        x += x >> 8;
        x += x >> 16;
        return x & 63;
    }

    function binarySearch(sortedArray, key) {
        var high, low, mid, midVal;
        low = 0;
        high = sortedArray.length - 1;
        while (low <= high) {
            mid = low + ((high - low) >> 1);
            midVal = sortedArray[mid];
            if (midVal < key) {
                low = mid + 1;
            } else if (midVal > key) {
                high = mid - 1;
            } else {
                return mid;
            }
        }
        return -low - 1;
    }

    // Core Square-1 code
    var sq1 = (function (setNPerm, getNPerm, circle, rn) {
        "use strict";

        function SqCubie() {
            this.ul = 0x011233;
            this.ur = 0x455677;
            this.dl = 0x998bba;
            this.dr = 0xddcffe;
            this.ml = 0;
        }

        var _ = SqCubie.prototype;

        _.toString = function () {
            return this.ul.toString(16).padStart(6, 0) +
                this.ur.toString(16).padStart(6, 0) +
                "|/".charAt(this.ml) +
                this.dl.toString(16).padStart(6, 0) +
                this.dr.toString(16).padStart(6, 0);
        }

        _.pieceAt = function (idx) {
            var ret;
            if (idx < 6) {
                ret = this.ul >> ((5 - idx) << 2);
            } else if (idx < 12) {
                ret = this.ur >> ((11 - idx) << 2);
            } else if (idx < 18) {
                ret = this.dl >> ((17 - idx) << 2);
            } else {
                ret = this.dr >> ((23 - idx) << 2);
            }
            return ret & 0xf;
        }

        _.setPiece = function (idx, value) {
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

        _.copy = function (c) {
            this.ul = c.ul;
            this.ur = c.ur;
            this.dl = c.dl;
            this.dr = c.dr;
            this.ml = c.ml;
        }

        _.doMove = function (move) {
            var temp;
            move <<= 2;
            if (move > 24) {
                move = 48 - move;
                temp = this.ul;
                this.ul = (this.ul >> move | this.ur << 24 - move) & 0xffffff;
                this.ur = (this.ur >> move | temp << 24 - move) & 0xffffff;
            } else if (move > 0) {
                temp = this.ul;
                this.ul = (this.ul << move | this.ur >> 24 - move) & 0xffffff;
                this.ur = (this.ur << move | temp >> 24 - move) & 0xffffff;
            } else if (move == 0) {
                temp = this.ur;
                this.ur = this.dl;
                this.dl = temp;
                this.ml = 1 - this.ml;
            } else if (move >= -24) {
                move = -move;
                temp = this.dl;
                this.dl = (this.dl << move | this.dr >> 24 - move) & 0xffffff;
                this.dr = (this.dr << move | temp >> 24 - move) & 0xffffff;
            } else if (move < -24) {
                move = 48 + move;
                temp = this.dl;
                this.dl = (this.dl >> move | this.dr << 24 - move) & 0xffffff;
                this.dr = (this.dr >> move | temp << 24 - move) & 0xffffff;
            }
        }

        function FullCube_getParity(obj) {
            var a, b, cnt, i, p, arr;
            cnt = 0;
            arr = [obj.pieceAt(0)];
            for (i = 1; i < 24; ++i) {
                if (obj.pieceAt(i) != arr[cnt]) {
                    arr[++cnt] = obj.pieceAt(i);
                }
            }
            p = 0;
            for (a = 0; a < 16; ++a) {
                for (b = a + 1; b < 16; ++b) {
                    arr[a] > arr[b] && (p ^= 1);
                }
            }
            return p;
        }

        function FullCube_getShapeIdx(obj) {
            var dlx, drx, ulx, urx;
            urx = obj.ur & 0x111111;
            urx |= urx >> 3;
            urx |= urx >> 6;
            urx = urx & 15 | urx >> 12 & 48;
            ulx = obj.ul & 0x111111;
            ulx |= ulx >> 3;
            ulx |= ulx >> 6;
            ulx = ulx & 15 | ulx >> 12 & 48;
            drx = obj.dr & 0x111111;
            drx |= drx >> 3;
            drx |= drx >> 6;
            drx = drx & 15 | drx >> 12 & 48;
            dlx = obj.dl & 0x111111;
            dlx |= dlx >> 3;
            dlx |= dlx >> 6;
            dlx = dlx & 15 | dlx >> 12 & 48;
            return Shape_getShape2Idx(FullCube_getParity(obj) << 24 | ulx << 18 | urx << 12 | dlx << 6 | drx);
        }

        function FullCube_getSquare(obj, sq) {
            var a, b;
            var prm = [];
            for (a = 0; a < 8; ++a) {
                prm[a] = obj.pieceAt(a * 3 + 1) >> 1;
            }
            sq.cornperm = getNPerm(prm, 8);
            sq.topEdgeFirst = obj.pieceAt(0) == obj.pieceAt(1);
            a = sq.topEdgeFirst ? 2 : 0;
            for (b = 0; b < 4; a += 3, ++b)
                prm[b] = obj.pieceAt(a) >> 1;
            sq.botEdgeFirst = obj.pieceAt(12) == obj.pieceAt(13);
            a = sq.botEdgeFirst ? 14 : 12;
            for (; b < 8; a += 3, ++b)
                prm[b] = obj.pieceAt(a) >> 1;
            sq.edgeperm = getNPerm(prm, 8);
            sq.ml = obj.ml;
        }

        function FullCube_randomCube(indice) {
            var f, i, shape, edge, corner, n_edge, n_corner, rnd, m;
            if (indice === undefined) {
                indice = rn(3678);
            }
            f = new SqCubie;
            shape = Shape_ShapeIdx[indice];
            corner = 0x01234567 << 1 | 0x11111111;
            edge = 0x01234567 << 1;
            n_corner = n_edge = 8;
            for (i = 0; i < 24; i++) {
                if (((shape >> i) & 1) == 0) { //edge
                    rnd = rn(n_edge) << 2;
                    f.setPiece(23 - i, (edge >> rnd) & 0xf);
                    m = (1 << rnd) - 1;
                    edge = (edge & m) + ((edge >> 4) & ~m);
                    --n_edge;
                } else { //corner
                    rnd = rn(n_corner) << 2;
                    f.setPiece(23 - i, (corner >> rnd) & 0xf);
                    f.setPiece(22 - i, (corner >> rnd) & 0xf);
                    m = (1 << rnd) - 1;
                    corner = (corner & m) + ((corner >> 4) & ~m);
                    --n_corner;
                    ++i;
                }
            }
            f.ml = rn(2);
            return f;
        }

        function Search_init2(obj) {
            var corner, edge, i, j, ml, prun;
            obj.Search_d.copy(obj.Search_c);
            for (i = 0; i < obj.Search_length1; ++i) {
                obj.Search_d.doMove(obj.Search_move[i]);
            }
            FullCube_getSquare(obj.Search_d, obj.Search_sq);
            edge = obj.Search_sq.edgeperm;
            corner = obj.Search_sq.cornperm;
            ml = obj.Search_sq.ml;
            prun = Math.max(SquarePrun[obj.Search_sq.edgeperm << 1 | ml], SquarePrun[obj.Search_sq.cornperm << 1 | ml]);
            for (i = prun; i < obj.Search_maxlen2; ++i) {
                if (Search_phase2(obj, edge, corner, obj.Search_sq.topEdgeFirst, obj.Search_sq.botEdgeFirst, ml, i, obj.Search_length1, 0)) {
                    for (j = 0; j < i; ++j) {
                        obj.Search_d.doMove(obj.Search_move[obj.Search_length1 + j]);
                    }
                    obj.Search_sol_string = Search_move2string(obj, i + obj.Search_length1);
                    return true;
                }
            }
            return false;
        }

        function Search_move2string(obj, len) {
            var s = "";
            var top = 0, bottom = 0;
            for (var i = len - 1; i >= 0; i--) {
                var val = obj.Search_move[i];
                if (val > 0) {
                    val = 12 - val;
                    top = (val > 6) ? (val - 12) : val;
                } else if (val < 0) {
                    val = 12 + val;
                    bottom = (val > 6) ? (val - 12) : val;
                } else {
                    var twst = "/";
                    if (i == obj.Search_length1 - 1) {
                        twst = "`/`";
                    }
                    if (top == 0 && bottom == 0) {
                        s += twst;
                    } else {
                        s += " (" + top + "," + bottom + ")" + twst;
                    }
                    top = bottom = 0;
                }
            }
            if (top == 0 && bottom == 0) { } else {
                s += " (" + top + "," + bottom + ") ";
            }
            return s;
        }

        function Search_phase1(obj, shape, prunvalue, maxl, depth, lm) {
            var m, prunx, shapex;
            if (prunvalue == 0 && maxl < 4) {
                return maxl == 0 && Search_init2(obj);
            }
            if (lm != 0) {
                shapex = Shape_TwistMove[shape];
                prunx = ShapePrun[shapex];
                if (prunx < maxl) {
                    obj.Search_move[depth] = 0;
                    if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 0)) {
                        return true;
                    }
                }
            }
            shapex = shape;
            if (lm <= 0) {
                m = 0;
                while (true) {
                    m += Shape_TopMove[shapex];
                    shapex = m >> 4;
                    m &= 15;
                    if (m >= 12) {
                        break;
                    }
                    prunx = ShapePrun[shapex];
                    if (prunx > maxl) {
                        break;
                    } else if (prunx < maxl) {
                        obj.Search_move[depth] = m;
                        if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 1)) {
                            return true;
                        }
                    }
                }
            }
            shapex = shape;
            if (lm <= 1) {
                m = 0;
                while (true) {
                    m += Shape_BottomMove[shapex];
                    shapex = m >> 4;
                    m &= 15;
                    if (m >= 6) {
                        break;
                    }
                    prunx = ShapePrun[shapex];
                    if (prunx > maxl) {
                        break;
                    } else if (prunx < maxl) {
                        obj.Search_move[depth] = -m;
                        if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 2)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function Search_phase2(obj, edge, corner, topEdgeFirst, botEdgeFirst, ml, maxl, depth, lm) {
            var botEdgeFirstx, cornerx, edgex, m, prun1, prun2, topEdgeFirstx;
            if (maxl == 0 && !topEdgeFirst && botEdgeFirst) {
                return true;
            }
            if (lm != 0 && topEdgeFirst == botEdgeFirst) {
                edgex = Square_TwistMove[edge];
                cornerx = Square_TwistMove[corner];
                if (SquarePrun[edgex << 1 | 1 - ml] < maxl && SquarePrun[cornerx << 1 | 1 - ml] < maxl) {
                    obj.Search_move[depth] = 0;
                    if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirst, 1 - ml, maxl - 1, depth + 1, 0)) {
                        return true;
                    }
                }
            }
            if (lm <= 0) {
                topEdgeFirstx = !topEdgeFirst;
                edgex = topEdgeFirstx ? Square_TopMove[edge] : edge;
                cornerx = topEdgeFirstx ? corner : Square_TopMove[corner];
                m = topEdgeFirstx ? 1 : 2;
                prun1 = SquarePrun[edgex << 1 | ml];
                prun2 = SquarePrun[cornerx << 1 | ml];
                while (m < 12 && prun1 <= maxl && prun1 <= maxl) {
                    if (prun1 < maxl && prun2 < maxl) {
                        obj.Search_move[depth] = m;
                        if (Search_phase2(obj, edgex, cornerx, topEdgeFirstx, botEdgeFirst, ml, maxl - 1, depth + 1, 1)) {
                            return true;
                        }
                    }
                    topEdgeFirstx = !topEdgeFirstx;
                    if (topEdgeFirstx) {
                        edgex = Square_TopMove[edgex];
                        prun1 = SquarePrun[edgex << 1 | ml];
                        m += 1;
                    } else {
                        cornerx = Square_TopMove[cornerx];
                        prun2 = SquarePrun[cornerx << 1 | ml];
                        m += 2;
                    }
                }
            }
            if (lm <= 1) {
                botEdgeFirstx = !botEdgeFirst;
                edgex = botEdgeFirstx ? Square_BottomMove[edge] : edge;
                cornerx = botEdgeFirstx ? corner : Square_BottomMove[corner];
                m = botEdgeFirstx ? 1 : 2;
                prun1 = SquarePrun[edgex << 1 | ml];
                prun2 = SquarePrun[cornerx << 1 | ml];
                while (m < (maxl > 6 ? 6 : 12) && prun1 <= maxl && prun1 <= maxl) {
                    if (prun1 < maxl && prun2 < maxl) {
                        obj.Search_move[depth] = -m;
                        if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirstx, ml, maxl - 1, depth + 1, 2)) {
                            return true;
                        }
                    }
                    botEdgeFirstx = !botEdgeFirstx;
                    if (botEdgeFirstx) {
                        edgex = Square_BottomMove[edgex];
                        prun1 = SquarePrun[edgex << 1 | ml];
                        m += 1;
                    } else {
                        cornerx = Square_BottomMove[cornerx];
                        prun2 = SquarePrun[cornerx << 1 | ml];
                        m += 2;
                    }
                }
            }
            return false;
        }

        function Search_solution(obj, c) {
            var shape;
            obj.Search_c = c;
            shape = FullCube_getShapeIdx(c);
            for (obj.Search_length1 = ShapePrun[shape]; obj.Search_length1 < 100; ++obj.Search_length1) {
                obj.Search_maxlen2 = Math.min(32 - obj.Search_length1, 17);
                if (Search_phase1(obj, shape, ShapePrun[shape], obj.Search_length1, 0, -1)) {
                    break;
                }
            }
            return obj.Search_sol_string;
        }

        function Search_Search() {
            this.Search_move = [];
            this.Search_d = new SqCubie;
            this.Search_sq = new Square_Square;
        }

        function Search() { }

        _ = Search_Search.prototype = Search.prototype;
        _.Search_c = null;
        _.Search_length1 = 0;
        _.Search_maxlen2 = 0;
        _.Search_sol_string = null;

        function Shape_$clinit() {
            Shape_$clinit = function () { };
            Shape_halflayer = [0, 3, 6, 12, 15, 24, 27, 30, 48, 51, 54, 60, 63];
            Shape_ShapeIdx = [];
            ShapePrun = [];
            Shape_TopMove = [];
            Shape_BottomMove = [];
            Shape_TwistMove = [];
            Shape_init();
        }

        function Shape_bottomMove(obj) {
            var move, moveParity;
            move = 0;
            moveParity = 0;
            do {
                if ((obj.bottom & 2048) == 0) {
                    move += 1;
                    obj.bottom = obj.bottom << 1;
                } else {
                    move += 2;
                    obj.bottom = obj.bottom << 2 ^ 12291;
                }
                moveParity = 1 - moveParity;
            }
            while ((bitCount(obj.bottom & 63) & 1) != 0);
            (bitCount(obj.bottom) & 2) == 0 && (obj.Shape_parity ^= moveParity);
            return move;
        }

        function Shape_getIdx(obj) {
            var ret;
            ret = binarySearch(Shape_ShapeIdx, obj.top << 12 | obj.bottom) << 1 | obj.Shape_parity;
            return ret;
        }

        function Shape_setIdx(obj, idx) {
            obj.Shape_parity = idx & 1;
            obj.top = Shape_ShapeIdx[idx >> 1];
            obj.bottom = obj.top & 4095;
            obj.top >>= 12;
        }

        function Shape_topMove(obj) {
            var move, moveParity;
            move = 0;
            moveParity = 0;
            do {
                if ((obj.top & 2048) == 0) {
                    move += 1;
                    obj.top = obj.top << 1;
                } else {
                    move += 2;
                    obj.top = obj.top << 2 ^ 12291;
                }
                moveParity = 1 - moveParity;
            }
            while ((bitCount(obj.top & 63) & 1) != 0);
            (bitCount(obj.top) & 2) == 0 && (obj.Shape_parity ^= moveParity);
            return move;
        }

        function Shape_Shape() { }

        function Shape_getShape2Idx(shp) {
            var ret;
            ret = binarySearch(Shape_ShapeIdx, shp & 0xffffff) << 1 | shp >> 24;
            return ret;
        }

        function Shape_init() {
            var count, depth, dl, done, done0, dr, i, idx, m, s, ul, ur, value, p1, p3, temp;
            count = 0;
            for (i = 0; i < 28561; ++i) {
                dr = Shape_halflayer[i % 13];
                dl = Shape_halflayer[~~(i / 13) % 13];
                ur = Shape_halflayer[~~(~~(i / 13) / 13) % 13];
                ul = Shape_halflayer[~~(~~(~~(i / 13) / 13) / 13)];
                value = ul << 18 | ur << 12 | dl << 6 | dr;
                bitCount(value) == 16 && (Shape_ShapeIdx[count++] = value);
            }
            s = new Shape_Shape;
            for (i = 0; i < 7356; ++i) {
                Shape_setIdx(s, i);
                Shape_TopMove[i] = Shape_topMove(s);
                Shape_TopMove[i] |= Shape_getIdx(s) << 4;
                Shape_setIdx(s, i);
                Shape_BottomMove[i] = Shape_bottomMove(s);
                Shape_BottomMove[i] |= Shape_getIdx(s) << 4;
                Shape_setIdx(s, i);
                temp = s.top & 63;
                p1 = bitCount(temp);
                p3 = bitCount(s.bottom & 4032);
                s.Shape_parity ^= 1 & (p1 & p3) >> 1;
                s.top = s.top & 4032 | s.bottom >> 6 & 63;
                s.bottom = s.bottom & 63 | temp << 6;
                Shape_TwistMove[i] = Shape_getIdx(s);
            }
            for (i = 0; i < 7536; ++i) {
                ShapePrun[i] = -1;
            }
            ShapePrun[Shape_getShape2Idx(14378715)] = 0;
            ShapePrun[Shape_getShape2Idx(31157686)] = 0;
            ShapePrun[Shape_getShape2Idx(23967451)] = 0;
            ShapePrun[Shape_getShape2Idx(7191990)] = 0;
            done = 4;
            done0 = 0;
            depth = -1;
            while (done != done0) {
                done0 = done;
                ++depth;
                for (i = 0; i < 7536; ++i) {
                    if (ShapePrun[i] == depth) {
                        m = 0;
                        idx = i;
                        do {
                            idx = Shape_TopMove[idx];
                            m += idx & 15;
                            idx >>= 4;
                            if (ShapePrun[idx] == -1) {
                                ++done;
                                ShapePrun[idx] = depth + 1;
                            }
                        }
                        while (m != 12);
                        m = 0;
                        idx = i;
                        do {
                            idx = Shape_BottomMove[idx];
                            m += idx & 15;
                            idx >>= 4;
                            if (ShapePrun[idx] == -1) {
                                ++done;
                                ShapePrun[idx] = depth + 1;
                            }
                        }
                        while (m != 12);
                        idx = Shape_TwistMove[i];
                        if (ShapePrun[idx] == -1) {
                            ++done;
                            ShapePrun[idx] = depth + 1;
                        }
                    }
                }
            }
        }

        function Shape() { }

        _ = Shape_Shape.prototype = Shape.prototype;
        _.bottom = 0;
        _.Shape_parity = 0;
        _.top = 0;
        var Shape_BottomMove, Shape_ShapeIdx, ShapePrun, Shape_TopMove, Shape_TwistMove, Shape_halflayer;

        function Square_$clinit() {
            Square_$clinit = function () { };
            SquarePrun = [];
            Square_TwistMove = [];
            Square_TopMove = [];
            Square_BottomMove = [];
            Square_init();
        }

        function Square_Square() { }

        function Square_init() {
            var check, depth, done, find, i, idx, idxx, inv, m, ml, pos;
            pos = [];
            for (i = 0; i < 40320; ++i) {
                setNPerm(pos, i, 8);
                circle(pos, 2, 4)(pos, 3, 5);
                Square_TwistMove[i] = getNPerm(pos, 8);
                setNPerm(pos, i, 8);
                circle(pos, 0, 3, 2, 1);
                Square_TopMove[i] = getNPerm(pos, 8);
                setNPerm(pos, i, 8);
                circle(pos, 4, 7, 6, 5);
                Square_BottomMove[i] = getNPerm(pos, 8);
            }
            for (i = 0; i < 80640; ++i) {
                SquarePrun[i] = -1;
            }
            SquarePrun[0] = 0;
            depth = 0;
            done = 1;
            while (done < 80640) {
                inv = depth >= 11;
                find = inv ? -1 : depth;
                check = inv ? depth : -1;
                ++depth;
                OUT: for (i = 0; i < 80640; ++i) {
                    if (SquarePrun[i] == find) {
                        idx = i >> 1;
                        ml = i & 1;
                        idxx = Square_TwistMove[idx] << 1 | 1 - ml;
                        if (SquarePrun[idxx] == check) {
                            ++done;
                            SquarePrun[inv ? i : idxx] = depth;
                            if (inv)
                                continue OUT;
                        }
                        idxx = idx;
                        for (m = 0; m < 4; ++m) {
                            idxx = Square_TopMove[idxx];
                            if (SquarePrun[idxx << 1 | ml] == check) {
                                ++done;
                                SquarePrun[inv ? i : idxx << 1 | ml] = depth;
                                if (inv)
                                    continue OUT;
                            }
                        }
                        for (m = 0; m < 4; ++m) {
                            idxx = Square_BottomMove[idxx];
                            if (SquarePrun[idxx << 1 | ml] == check) {
                                ++done;
                                SquarePrun[inv ? i : idxx << 1 | ml] = depth;
                                if (inv)
                                    continue OUT;
                            }
                        }
                    }
                }
            }
        }

        function Square() { }

        _ = Square_Square.prototype = Square.prototype;
        _.botEdgeFirst = false;
        _.cornperm = 0;
        _.edgeperm = 0;
        _.ml = 0;
        _.topEdgeFirst = false;
        var Square_BottomMove, SquarePrun, Square_TopMove, Square_TwistMove;

        // Initialize
        Shape_$clinit();
        Square_$clinit();

        var search = new Search_Search();

        function scrambleFromState(cubie) {
            return Search_solution(search, cubie);
        }

        return {
            scrambleFromState: scrambleFromState,
            SqCubie: SqCubie
        };
    })(setNPerm, getNPerm, circle, rn);

    // Export to window
    window.sq1Tools = sq1;
})();

// Parse hex format from the random generator
function parseHexFormat(input) {
    const cubie = new window.sq1Tools.SqCubie();

    try {
        // Remove all whitespace
        input = input.replace(/\s/g, '');

        // Split by separator (| or /)
        const parts = input.split(/[\|\/]/);

        if (parts.length !== 2) {
            throw new Error('Invalid format. Expected: 12 hex digits + separator + 12 hex digits');
        }

        const upperPart = parts[0];
        const lowerPart = parts[1];

        if (upperPart.length !== 12 || lowerPart.length !== 12) {
            throw new Error('Each part must be exactly 12 hex digits');
        }

        // Extract ul (first 6 hex digits of upper part)
        cubie.ul = parseInt(upperPart.substring(0, 6), 16);

        // Extract ur (last 6 hex digits of upper part)  
        cubie.ur = parseInt(upperPart.substring(6, 12), 16);

        // Extract dl (first 6 hex digits of lower part)
        cubie.dl = parseInt(lowerPart.substring(0, 6), 16);

        // Extract dr (last 6 hex digits of lower part)
        cubie.dr = parseInt(lowerPart.substring(6, 12), 16);

        // Set ml based on separator (| = 0, / = 1)
        cubie.ml = input.includes('/') ? 1 : 0;

        return cubie;
    } catch (error) {
        throw new Error('Invalid hex format: ' + error.message);
    }
}

// Generate scramble from input
function generateScramble() {
    const input = document.getElementById('hexInput').value.trim();
    const output = document.getElementById('scrambleOutput');

    if (!input) {
        output.textContent = 'Please enter a hex format state first.';
        output.className = 'output error';
        return;
    }

    try {
        const state = parseHexFormat(input);
        const scramble = window.sq1Tools.scrambleFromState(state);

        if (scramble) {
            output.textContent = scramble;
            output.className = 'output success';
        } else {
            output.textContent = 'Could not generate scramble for this state.';
            output.className = 'output error';
        }
    } catch (error) {
        output.textContent = 'Error: ' + error.message;
        output.className = 'output error';
    }
}