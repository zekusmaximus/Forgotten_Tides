#!/usr/bin/env node

// Exercise the dashboard in a small DOM/vis simulation. This tests the data
// and interaction contract without needing a browser or another dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'dashboard/dashboard.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'dashboard/index.html'), 'utf8');

class Element {
    constructor(tagName = 'div', attributes = {}) {
        this.tagName = tagName.toUpperCase();
        this.attributes = { ...attributes };
        this.style = {};
        this.children = [];
        this.listeners = new Map();
        this.className = attributes.class || '';
        this.textContent = '';
        this.innerHTML = '';
        this.value = '';
        this.disabled = false;
        this.hidden = false;
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        this.classList = {
            contains: (name) => classes.has(name),
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name),
            toggle: (name, force) => {
                const next = force === undefined ? !classes.has(name) : Boolean(force);
                if (next) classes.add(name);
                else classes.delete(name);
                return next;
            },
        };
    }

    get id() { return this.attributes.id || ''; }
    get href() { return this.attributes.href || ''; }
    set href(value) { this.attributes.href = value; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(type, listener) {
        if (!this.listeners.has(type)) this.listeners.set(type, []);
        this.listeners.get(type).push(listener);
    }
    dispatchEvent(event) {
        event.target ||= this;
        event.preventDefault ||= () => { event.defaultPrevented = true; };
        for (const listener of this.listeners.get(event.type) || []) listener(event);
        return !event.defaultPrevented;
    }
    click() { return this.dispatchEvent({ type: 'click' }); }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; }
    remove() { this.parentNode?.removeChild(this); }
    focus() { this.focused = true; }
    select() { this.selected = true; }
}

function readAttributes(source) {
    const attributes = {};
    const pattern = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    for (const match of source.matchAll(pattern)) {
        attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
    }
    return attributes;
}

function makeDocument() {
    const byId = new Map();
    const filters = new Map();
    const counts = new Map();
    for (const match of HTML.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
        const attributes = readAttributes(match[2]);
        if (!attributes.id && !attributes['data-filter'] && !attributes['data-count']) continue;
        const element = new Element(match[1], attributes);
        if (attributes.id) byId.set(attributes.id, element);
        if (attributes['data-filter']) filters.set(attributes['data-filter'], element);
        if (attributes['data-count']) counts.set(attributes['data-count'], element);
    }
    const listeners = new Map();
    const body = new Element('body');
    const document = {
        readyState: 'loading',
        body,
        getElementById(id) { return byId.get(id) || null; },
        querySelector(selector) {
            const count = selector.match(/^\[data-count="([\w-]+)"\]$/);
            if (count) return counts.get(count[1]) || null;
            if (selector.startsWith('#')) return byId.get(selector.slice(1)) || null;
            return null;
        },
        querySelectorAll(selector) {
            if (selector === '.chip[data-filter]') return [...filters.values()];
            return [];
        },
        createElement(tagName) { return new Element(tagName); },
        addEventListener(type, listener) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(listener);
        },
        dispatchEvent(event) {
            for (const listener of listeners.get(event.type) || []) listener(event);
        },
        execCommand(command) { return command === 'copy'; },
    };
    return { document, byId, filters, counts };
}

class Network {
    constructor(container, data, options) {
        this.container = container;
        this.data = data;
        this.options = options;
        this.listeners = new Map();
        Network.instances.push(this);
    }
    on(type, listener) { this.listeners.set(type, listener); }
    emit(type, payload) { this.listeners.get(type)?.(payload); }
    setData(data) { this.data = data; }
    setOptions(options) { this.options = options; }
    unselectAll() { this.unselected = true; }
    fit(options) { this.fitOptions = options; }
}
Network.instances = [];

function start({ data, fetchImpl, clipboardImpl, visAvailable = true } = {}) {
    const dom = makeDocument();
    const fetchCalls = [];
    const clipboardWrites = [];
    const errors = [];
    Network.instances.length = 0;
    const clipboard = {
        async writeText(value) {
            clipboardWrites.push(value);
            if (clipboardImpl) return clipboardImpl(value);
        },
    };
    const location = { reload() { location.reloaded = true; } };
    const window = { document: dom.document, navigator: { clipboard }, location, isSecureContext: true };
    const context = vm.createContext({
        document: dom.document,
        window,
        navigator: window.navigator,
        location,
        vis: visAvailable ? { Network } : undefined,
        URL,
        fetch: async (url) => {
            fetchCalls.push(url);
            if (fetchImpl) return fetchImpl(url);
            return { ok: true, json: async () => data };
        },
        console: { error: (...parts) => errors.push(parts) },
        setTimeout,
        clearTimeout,
    });
    vm.runInContext(SCRIPT, context, { filename: 'dashboard/dashboard.js' });
    dom.document.readyState = 'interactive';
    dom.document.dispatchEvent({ type: 'DOMContentLoaded' });
    return {
        ...dom,
        fetchCalls,
        clipboardWrites,
        errors,
        get network() { return Network.instances.at(-1) || null; },
        get networks() { return [...Network.instances]; },
        get(id) {
            assert.ok(dom.byId.has(id), `dashboard/index.html is missing #${id}`);
            return dom.byId.get(id);
        },
        async settle() { await new Promise(setImmediate); },
    };
}

const fixture = {
    nodes: [
        { canonical_id: 'char-1', type: 'character', name: 'Alpha', path: 'characters/Alpha.md', canon_tier: 'primary_canon' },
        { canonical_id: 'loc-1', type: 'location', name: 'Beta', path: 'locations/Beta.md', canon_tier: 'primary_canon' },
        { canonical_id: 'lore-1', type: 'lore', name: 'Lore', path: 'lore/Lore.md', canon_tier: 'working_canon' },
        { canonical_id: 'term-1', type: 'term', name: 'Term', path: 'data/lexicon/terms.yaml', canon_tier: 'primary_canon' },
        { canonical_id: 'story-1', type: 'story', name: 'Speculative Story', path: 'stories/Idea.md', canon_tier: 'speculative' },
        { canonical_id: 'char-2', type: 'character', name: 'True Orphan', path: 'characters/Orphan.md', canon_tier: 'primary_canon' },
        { canonical_id: 'char-3', type: 'character', name: 'Missing', path: null, status: 'missing' },
    ],
    edges: [
        { from: 'char-1', to: 'loc-1', type: 'appears_in' },
        { from: 'lore-1', to: 'term-1', type: 'defines' },
        { from: 'story-1', to: 'lore-1', type: 'references' },
    ],
};

function node(network, id) {
    const found = network?.data.nodes.find((item) => item.id === id);
    assert.ok(found, `expected rendered node ${id}`);
    return found;
}

function edgePairs(network) {
    return network.data.edges.map((item) => `${item.from}->${item.to}`).sort();
}

async function test(name, run) {
    try {
        await run();
        console.log(`✓ ${name}`);
    } catch (error) {
        console.error(`✗ ${name}`);
        throw error;
    }
}

async function main() {
    await test('loads every supported type and filters lore and term edges', async () => {
        const app = start({ data: fixture });
        await app.settle();
        assert.equal(app.fetchCalls[0], '../REFERENCE_MAP.json');
        assert.equal(app.network.data.nodes.length, fixture.nodes.length);
        assert.deepEqual(edgePairs(app.network), ['char-1->loc-1', 'lore-1->term-1', 'story-1->lore-1']);
        assert.equal(node(app.network, 'lore-1').color.background !== node(app.network, 'term-1').color.background, true);
        for (const type of ['lore', 'term']) {
            assert.equal(app.counts.get(type)?.textContent, '· 1', `${type} count`);
            assert.equal(app.filters.get(type)?.getAttribute('aria-pressed'), 'true', `${type} starts pressed`);
        }
        app.filters.get('lore').click();
        assert.equal(app.filters.get('lore').getAttribute('aria-pressed'), 'false');
        assert.equal(app.network.data.nodes.some((item) => item.id === 'lore-1'), false);
        assert.deepEqual(edgePairs(app.network), ['char-1->loc-1']);
        app.filters.get('lore').click();
        assert.equal(app.filters.get('lore').getAttribute('aria-pressed'), 'true');
        assert.ok(node(app.network, 'lore-1'));
        app.filters.get('term').click();
        assert.equal(app.network.data.nodes.some((item) => item.id === 'term-1'), false);
        assert.deepEqual(edgePairs(app.network), ['char-1->loc-1', 'story-1->lore-1']);
    });

    await test('uses canon_tier for speculative styling and preserves full-graph orphan status', async () => {
        const app = start({ data: fixture });
        await app.settle();
        const primary = node(app.network, 'char-1');
        const speculative = node(app.network, 'story-1');
        assert.ok(speculative.opacity < primary.opacity, 'speculative node should be muted');
        assert.ok(speculative.shapeProperties.borderDashes, 'speculative node should have dashed border');
        assert.match(node(app.network, 'char-2').title, /orphan/i);
        assert.doesNotMatch(primary.title, /orphan/i);
        app.filters.get('location').click();
        assert.doesNotMatch(node(app.network, 'char-1').title, /orphan/i, 'a hidden neighbor does not make an orphan');
        assert.match(node(app.network, 'char-2').title, /orphan/i);
        app.network.emit('click', { nodes: ['story-1'] });
        assert.equal(app.get('info-stencil-speculative').textContent, 'SPECULATIVE');
        app.network.emit('click', { nodes: ['char-3'] });
        assert.equal(app.get('info-stencil-speculative').textContent, 'MISSING');
    });

    await test('shows loading, empty, and malformed map states', async () => {
        let resolveFetch;
        const pending = new Promise((resolve) => { resolveFetch = resolve; });
        const app = start({ fetchImpl: () => pending });
        assert.equal(app.network, null, 'network waits for fetch');
        assert.notEqual(app.get('loading').style.display, 'none');
        resolveFetch({ ok: true, json: async () => ({ nodes: [], edges: [] }) });
        await app.settle();
        assert.equal(app.get('loading').style.display, 'none');
        assert.notEqual(app.get('empty').style.display, 'none', 'empty map has a visible message');
        assert.notEqual(app.get('error').style.display, 'block');
        assert.equal(app.network, null, 'empty map does not construct a graph');

        const malformed = start({ data: { nodes: {}, edges: [] } });
        await malformed.settle();
        assert.equal(malformed.network, null);
        assert.equal(malformed.get('loading').style.display, 'none');
        assert.notEqual(malformed.get('error').style.display, 'none');
        assert.match(malformed.get('error-message').textContent || malformed.get('error-message').innerHTML, /nodes|array|invalid/i);

        const dangling = start({ data: {
            nodes: fixture.nodes.slice(0, 1),
            edges: [{ from: 'char-1', to: 'unknown', type: 'link' }],
        } });
        await dangling.settle();
        assert.equal(dangling.network, null);
        assert.match(dangling.get('error-message').textContent, /edge|known/i);

        const offline = start({ fetchImpl: async () => { throw new Error('network down'); } });
        await offline.settle();
        assert.equal(offline.get('loading').style.display, 'none');
        assert.equal(offline.get('error').style.display, 'block');
        assert.match(offline.get('error-message').textContent, /network down/i);

        const noLibrary = start({ data: fixture, visAvailable: false });
        await noLibrary.settle();
        assert.equal(noLibrary.get('loading').style.display, 'none');
        assert.equal(noLibrary.get('error').style.display, 'block');
        assert.match(noLibrary.get('error-message').textContent, /graph library/i);
    });

    await test('shows a filter empty state and uses native keyboard controls', async () => {
        const app = start({ data: fixture });
        await app.settle();
        const controls = [...app.filters.values(), app.get('reset-view'), app.get('reload-data'),
            app.get('info-close'), app.get('info-copy-path')];
        for (const control of controls) {
            assert.equal(control.tagName, 'BUTTON', `${control.id || control.getAttribute('data-filter')} should be a native button`);
            assert.equal(control.getAttribute('type'), 'button');
        }
        for (const chip of app.filters.values()) chip.click();
        assert.equal(app.network.data.nodes.length, 0);
        assert.equal(app.get('empty').style.display, 'block');
        assert.match(app.get('empty-title').textContent, /filter/i);
        app.filters.get('lore').click();
        assert.equal(app.get('empty').style.display, 'none');
        assert.equal(app.network.data.nodes.length, 1);
        app.get('reset-view').click();
        assert.ok(app.network.fitOptions);
    });

    await test('copies an existing path and gives feedback without opening a custom URI', async () => {
        const app = start({ data: fixture });
        await app.settle();
        app.network.emit('click', { nodes: ['char-1'] });
        const button = app.get('info-copy-path');
        assert.equal(button.tagName, 'BUTTON', 'copy path is a native keyboard-operable button');
        assert.equal(button.disabled, false);
        button.click();
        await app.settle();
        assert.deepEqual(app.clipboardWrites, ['characters/Alpha.md']);
        assert.match(app.get('path-feedback').textContent, /copied/i);
        app.network.emit('click', { nodes: ['char-3'] });
        assert.ok(button.disabled || button.style.display === 'none', 'no copy action for missing path');
        assert.doesNotMatch(HTML, /vscode:\/\/file/i, 'HTML has no fragile editor URI');

        const denied = start({ data: fixture, clipboardImpl: async () => { throw new Error('denied'); } });
        await denied.settle();
        denied.network.emit('click', { nodes: ['char-1'] });
        denied.get('info-copy-path').click();
        await denied.settle();
        assert.match(denied.get('path-feedback').textContent, /could not copy|select the path/i);
    });

    await test('escapes tooltip HTML while rendering details as text', async () => {
        const hostileName = '<img src=x onerror=alert(1)>';
        const hostilePath = 'characters/<unsafe>.md';
        const app = start({ data: {
            nodes: [{ canonical_id: 'char-1', type: 'character', name: hostileName,
                path: hostilePath, canon_tier: 'primary_canon' }],
            edges: [],
        } });
        await app.settle();
        assert.doesNotMatch(node(app.network, 'char-1').title, /<img/i);
        assert.match(node(app.network, 'char-1').title, /&lt;img/i);
        app.network.emit('click', { nodes: ['char-1'] });
        assert.equal(app.get('info-title').textContent, hostileName);
        assert.equal(app.get('info-title').innerHTML, '');
        assert.equal(app.get('info-path').textContent, hostilePath);
        assert.equal(app.get('info-path').innerHTML, '');
    });

    await test('loads the repository map with every node and a nonempty graph', async () => {
        const actual = JSON.parse(fs.readFileSync(path.join(ROOT, 'REFERENCE_MAP.json'), 'utf8'));
        const app = start({ data: actual });
        await app.settle();
        assert.equal(app.network.data.nodes.length, actual.nodes.length);
        assert.equal(app.network.data.edges.length, actual.edges.length);
        const eventId = 'event-story-0022-001';
        assert.equal(node(app.network, eventId).label, eventId);
        app.filters.get('event').click();
        assert(!app.network.data.nodes.some(item => item.id === eventId));
        assert.notEqual(app.get('error').style.display, 'block');
        assert.equal(app.get('loading').style.display, 'none');
    });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
