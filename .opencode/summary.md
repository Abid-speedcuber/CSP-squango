## Objective
- Refactor the legacy vanilla-JS Square-1 Cubeshape Parity Trainer into a React + TypeScript app in `./main`, keeping `./legacy` untouched.
- Convert faithfully (differential-tested against legacy), fix improper variable names, eliminate unused vars so lint/typecheck stay silent.

## Important Details
- User decision (parity bug): keep legacy as-is; fix the bug in main; include the buggy code in main but commented out. Done via a comment block in `cube.ts applyScramble`.
- Root cause established: legacy `utils.js:109-110` `const top = tok.t || tok.top; const bot = tok.b || tok.bottom;` — a `(x,0)`/`(0,x)` move turns `0` into `undefined`, corrupting the traced state. This, not a clean preset-convention switch, is why the served app shows Kite/Square's odd alg as Even under Matt's preset.
- Differential evidence (harness with Matt's preset: evilness on, clockwise, `setCaseNameResolver` via `algToShapeIndex(invert(scr))`): unpatched legacy vs my `analyzeParity` = 93/204 agree; `??`-patched legacy = 198/204 agree (the 6 misses are all `5-3/Star` evilness-lookup ambiguity, not parity). z2 mode made no difference. `main/src/lib/parityAnalyzer.ts` is correct.
- User preference: the solver is a verbatim cstimer port — keep it faithful to upstream; user will re-copy-paste cstimer updates later. My fixes only restore the port to legacy/cstimer behavior (never redesign it).
- `getParityText(scr, opts, cornerMode)` is a 3-arg call; differential harnesses must call `(alg, {}, mode)`.
- Legacy app convention for case-name lookup: `restoftheapp.js getCaseNameFromScramble` does `invertScramble(scramble)` then `window.algToShapeIndex(setup)` — DOUBLE inversion (algToShapeIndex inverts internally too), netting the FORWARD (scrambled) shape. Single `algToShapeIndex(scramble)` measures the inverse path's shape, which is undefined for solver scrambles.
- Solver-generated scrambles contain the legacy backtick marker `` ` `/` ` `` ("special slash", produced by `Search_move2string` at `i == obj.Search_length1 - 1`).
- Environment: Node v24.15.0; vitest 4.1.10; `initSolverTables()` ≈469 ms, solve ≈85 ms (after earlier `cyclePositions` fix writing `arr[indices[0]] = temp`).

## Work State
### Completed
- **Remaining test failure resolved — it was a test bug, not a library bug.** Diagnosis:
  - `algToShapeIndex` (mine) and legacy `alg_to_index.js` throw *identically* on solver scrambles (verified via legacy harness) — the port is faithful.
  - Solver roundtrips were correct all along: `stateToHex(applyScramble(scramble)) === cubie hex` (rtOk=true, all 90 cases); σ⁻¹ is a true inverse (`σ⁻¹(σ(solved)) = solved` and `σ(σ⁻¹(solved)) = solved`, both true).
  - The inverted scramble σ⁻¹(solved) genuinely has an invalid/undefined shape in the 24-slot model: `applyScramble`'s INVSTATE shows unpaired corner halves (e.g. `JKI` consecutive) because `sliceSwap` splits a corner straddling the slice cut; the hex engine `sq1AlgToHex` yields a shapeValue not in the 3678-entry table. This is shared original behavior (both `applyScramble` and `sq1AlgToHex` are byte-identical ports of `utils.js`), not a port defect.
  - Verified the app's double-invert convention (`algToShapeIndex(invertScramble(scramble))`) returns the correct shapeIndex for ALL 90 cases in BOTH mine and legacy.
- **Fixed `cube.test.ts`** (solver > generates a scramble for every case shape): assertion now uses `algToShapeIndex(invertScramble(scramble!))` to mirror `getCaseNameFromScramble`, with an explanatory comment (cube.test.ts:126-131).
- **Full suite green: 3376/3376.** `logic-contracts.test.ts` (13) and `normalizer-differential.test.ts` all pass.
- **Typecheck + lint now clean:**
  - Added `@types/node` devDependency (test files import `node:fs`/`node:url`).
  - `solver.ts`: introduced structural interface `CubieLike` (`ul/ur/dl/dr/ml` + `pieceAt`); `SqCubie implements CubieLike`; widened `solve`, `scrambleFromState`, `copyFrom`, `sourceCube`, `fullCubeGetShapeIdx`, `fullCubeGetParity` to `CubieLike` so both `SqCubie` and `Square1Cubie` (from `cubeFromShape`) are accepted.
  - `cube.test.ts:35`: `[...(entry.org ?? []), ...(entry.mir ?? [])]`.
  - `logic-contracts.test.ts`: `type LegacyParityFn = (scr: string, _: unknown, cornerMode: string) => string`; `getLegacyParity(): LegacyParityFn` returns non-null; calls stay `(alg, {}, mode)`.
- Prior completed: parity investigation resolved (harness `??`-patches legacy utils.js before loading, with comment); `pieceAt` added to `Square1Cubie`; solver prune-table fix (`outer:` label + `continue outer` in `initSquareTables`); temp investigation files removed; `src/lib/__tests__/` contains only `cube.test.ts`, `logic-contracts.test.ts`, `normalizer-differential.test.ts`.

### Active
- (none)

### Blocked
- (none)

## Next Move
1. Convert `restoftheapp.js` state/preset logic into a typed localStorage-backed store module (presets incl. Matt's, evilness config, `getCaseNameFromScramble`/`isScrambleEvil` — using the double-invert convention above).
2. Convert `rendering.js`, `search-and-filter.js`, `settings.js`, then the DOM-heavy modules into React via `src/main.tsx`.
3. Re-run `vitest run`, `tsc -b --noEmit`, and `eslint .` after each conversion to keep all three green.

## Relevant Files
- `main/src/lib/__tests__/cube.test.ts`: fixed assertion at 126-131 (double-invert convention); data-integrity spread fix at 35.
- `main/src/lib/solver.ts`: `CubieLike` interface (~line 76), `SqCubie implements CubieLike`, widened input types; `initSquareTables()` labeled-`continue outer` fix (~380-410); `cyclePositions` fix.
- `main/src/lib/cube.ts`: `Square1Cubie.pieceAt` added; `applyScramble` comment documenting the legacy `||` bug; `tokenizeScramble` (101), `invertScramble` (231), `sq1AlgToHex` (435), `getShapeIndexFromHex` (455), `algToShapeIndex` (499).
- `main/src/lib/__tests__/logic-contracts.test.ts`: `LegacyParityFn` type; harness `??`-patches legacy utils.js; calls `(alg, {}, mode)`; all 13 pass.
- `legacy/js/restoftheapp.js`: `getCaseNameFromScramble` (252-267) — double-invert convention the test now mirrors.
- `legacy/js/tools/utils.js`: lines 109-110 `||` bug (kept untouched per user); `tokenizeScramble`/`sliceSwap`/`parseScramble`/`twist`/`cycleLeft`/`getShapeIndexFromHex`/`invertScramble` — reference behavior (my ports are byte-identical).
- `legacy/js/tools/scramblegenerator.js`: `_.pieceAt` (92); legacy solver is the correctness reference (0/40 stress failures); `continue OUT` label original.
- `legacy/js/tools/alg_to_index.js`: reference for `algToShapeIndex` (delegates to the window.* utils).
- `main/package.json`: added `@types/node` to devDependencies.
