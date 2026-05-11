/* ==== FILE: js/browser-api.js ==== */

const root = globalThis;

export const SQG = root.SQG || {};
SQG.actions = SQG.actions || {};
SQG.state = SQG.state || {};

export function registerAction(name, fn, { legacyGlobal = true } = {}) {
    if (typeof name !== 'string' || !name) {
        throw new Error('registerAction requires a non-empty action name');
    }
    if (typeof fn !== 'function') {
        throw new Error(`Action "${name}" must be a function`);
    }

    SQG.actions[name] = fn;
    if (legacyGlobal) root[name] = fn;
    return fn;
}

export function registerState(name, descriptor) {
    if (typeof name !== 'string' || !name) {
        throw new Error('registerState requires a non-empty state name');
    }
    if (!descriptor || typeof descriptor.get !== 'function') {
        throw new Error(`State "${name}" must provide a getter`);
    }

    Object.defineProperty(SQG.state, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: typeof descriptor.set === 'function' ? descriptor.set : undefined
    });

    return descriptor;
}

export function exposeLegacyGlobal(name, descriptor) {
    Object.defineProperty(root, name, {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: typeof descriptor.set === 'function' ? descriptor.set : undefined
    });
}

SQG.call = function callRegisteredAction(name, ...args) {
    const action = SQG.actions && SQG.actions[name];
    if (typeof action !== 'function') {
        throw new Error(`Unknown SQG action: ${name}`);
    }
    return action(...args);
};

root.SQG = SQG;
