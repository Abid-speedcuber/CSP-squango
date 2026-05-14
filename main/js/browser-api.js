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

export function getActionTarget(event, root = document) {
    if (!event || !event.target || typeof event.target.closest !== 'function') return null;
    if (event.target.closest('[data-action-stop]')) return null;
    const target = event.target.closest('[data-action]');
    if (!target) return null;
    if (root && root !== document && !root.contains(target)) return null;
    return target;
}

export function bindDelegatedActions(root, actionMap, { eventType = 'click' } = {}) {
    if (!root || !actionMap) return () => {};

    const handler = (event) => {
        const target = getActionTarget(event, root);
        if (!target) return;

        const action = target.dataset.action;
        const fn = actionMap[action];
        if (typeof fn !== 'function') return;

        fn(event, target);
    };

    root.addEventListener(eventType, handler);
    return () => root.removeEventListener(eventType, handler);
}

SQG.call = function callRegisteredAction(name, ...args) {
    const action = SQG.actions && SQG.actions[name];
    if (typeof action !== 'function') {
        throw new Error(`Unknown SQG action: ${name}`);
    }
    return action(...args);
};

root.SQG = SQG;
