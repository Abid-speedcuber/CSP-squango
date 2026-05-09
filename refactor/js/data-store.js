/* ==== FILE: js/data-store.js ==== */

(function (global) {
    'use strict';

    const caseList = typeof data !== 'undefined' && Array.isArray(data) ? data : [];
    const shapeList = typeof shapeIndex !== 'undefined' && Array.isArray(shapeIndex) ? shapeIndex : [];
    const canonicalShapeIndex = typeof shapeIndexMap !== 'undefined' &&
        global.SQG &&
        global.SQG.isPlainObject(shapeIndexMap)
        ? shapeIndexMap
        : {};

    const casesByName = new Map(caseList.map(item => [item.name, item]));
    const shapeEntriesByName = new Map(shapeList.map(item => [item.name, item]));
    const canonicalIndexByCase = new Map(
        Object.entries(canonicalShapeIndex).map(([name, index]) => [name, Number(index)])
    );
    const caseNameByShapeIndex = new Map();

    for (const [caseName, index] of canonicalIndexByCase) {
        if (Number.isFinite(index)) caseNameByShapeIndex.set(index, caseName);
    }

    for (const entry of shapeList) {
        for (const index of [...(entry.org || []), ...(entry.mir || [])]) {
            if (!caseNameByShapeIndex.has(index)) {
                caseNameByShapeIndex.set(index, entry.name);
            }
        }
    }

    for (const [caseName, index] of canonicalIndexByCase) {
        if (shapeEntriesByName.has(caseName) || !Number.isFinite(index)) continue;

        const aliasedEntry = shapeList.find(entry => {
            return (entry.org && entry.org.includes(index)) || (entry.mir && entry.mir.includes(index));
        });

        if (aliasedEntry) {
            shapeEntriesByName.set(caseName, aliasedEntry);
        }
    }

    function validateData() {
        const errors = [];
        const seenNames = new Set();

        for (const item of caseList) {
            if (!item || typeof item.name !== 'string' || !item.name.trim()) {
                errors.push('Case is missing a valid name.');
                continue;
            }
            if (seenNames.has(item.name)) errors.push(`Duplicate case name: ${item.name}`);
            seenNames.add(item.name);

            if (!Array.isArray(item.odd)) errors.push(`${item.name} is missing odd algorithms.`);
            if (!Array.isArray(item.even)) errors.push(`${item.name} is missing even algorithms.`);
            if (!Number.isFinite(item.probability)) errors.push(`${item.name} has an invalid probability.`);
            if (!shapeEntriesByName.has(item.name)) errors.push(`${item.name} is missing shape-index data.`);
            if (!canonicalIndexByCase.has(item.name)) errors.push(`${item.name} is missing a canonical shape index.`);
        }

        for (const entry of shapeList) {
            if (!entry || typeof entry.name !== 'string') continue;
            const hasCaseOrAlias = casesByName.has(entry.name) || [...canonicalIndexByCase.keys()].some(caseName => {
                return shapeEntriesByName.get(caseName) === entry;
            });
            if (!hasCaseOrAlias) errors.push(`${entry.name} has shape-index data but no algorithm case.`);
        }

        return errors;
    }

    const store = Object.freeze({
        cases: caseList,
        shapeEntries: shapeList,
        casesByName,
        shapeEntriesByName,
        canonicalIndexByCase,
        caseNameByShapeIndex,
        getCase: name => casesByName.get(name) || null,
        getShapeEntry: name => shapeEntriesByName.get(name) || null,
        getCanonicalShapeIndex: name => canonicalIndexByCase.get(name) ?? null,
        getCaseNameByShapeIndex: index => caseNameByShapeIndex.get(Number(index)) || null,
        hasCase: name => casesByName.has(name),
        getCaseNames: () => caseList.map(item => item.name),
        validate: validateData
    });

    global.CSPData = store;

    const validationErrors = store.validate();
    if (validationErrors.length > 0) {
        console.warn('[CSPData] Data validation found issues:', validationErrors);
    }
})(window);
