// Continuity Dashboard — The Forgotten Tides
// Loads REFERENCE_MAP.json and renders it as a vis-network graph,
// dressed in the Forgotten Tides design system (void canvas, ink
// foregrounds, memory-amber selection, canonical entity colors).

(function () {
    'use strict';

    // ============================================================
    // Design tokens (mirrored from dashboard/index.html :root vars
    // so vis-network can be configured without reading the DOM)
    // ============================================================
    const TOKENS = {
        void1: '#0A0D12',
        void2: '#11151B',
        void3: '#181D25',
        void5: '#2A313A',
        void6: '#3A424D',
        ink1: '#F1ECE0',
        ink2: '#D8D2C4',
        ink3: '#A8AEB6',
        ink4: '#6A727C',
        amber: '#E8A856',
        amberBright: '#F6C684',
        amberLow: '#8A6A2E',
        collapse: '#E5484D',
    };

    const ENTITY_COLORS = {
        character: '#4A9EFF',
        location: '#FF6B6B',
        mechanics: '#51CF66',
        faction: '#FFD93D',
        story: '#A78BFA',
        lore: '#42C9C0',
        term: '#E49B6B',
        missing: '#6A727C',
    };

    const ENTITY_LABELS = {
        character: 'Characters',
        location: 'Locations',
        mechanics: 'Mechanics',
        faction: 'Factions',
        story: 'Stories',
        lore: 'Lore',
        term: 'Terms',
    };

    // ============================================================
    // State
    // ============================================================
    let network = null;
    let rawData = null;
    let nodesById = new Map();
    let fullEdgeIndex = new Map();
    let typeCounts = {};
    let currentFilters = {
        character: true,
        location: true,
        mechanics: true,
        faction: true,
        story: true,
        lore: true,
        term: true,
    };

    // ============================================================
    // Bootstrap
    // ============================================================
    function init() {
        setupEventListeners();
        loadReferenceMap();
    }

    function setupEventListeners() {
        // Filter chips
        document.querySelectorAll('.chip[data-filter]').forEach((chip) => {
            chip.addEventListener('click', () => {
                const key = chip.getAttribute('data-filter');
                currentFilters[key] = !currentFilters[key];
                chip.classList.toggle('active', currentFilters[key]);
                chip.setAttribute('aria-pressed', String(currentFilters[key]));
                applyFilters();
            });
        });

        document.getElementById('reset-view').addEventListener('click', resetView);
        document.getElementById('reload-data').addEventListener('click', () => location.reload());
        document.getElementById('info-close').addEventListener('click', hideNodeInfo);
        document.getElementById('info-copy-path').addEventListener('click', copySelectedPath);
    }

    // ============================================================
    // Data
    // ============================================================
    async function loadReferenceMap() {
        try {
            const response = await fetch('../REFERENCE_MAP.json');
            if (!response.ok) {
                throw new Error(`Could not load REFERENCE_MAP.json (HTTP ${response.status}).`);
            }
            let parsed;
            try {
                parsed = await response.json();
            } catch (_) {
                throw new Error('Invalid REFERENCE_MAP.json: could not parse JSON.');
            }
            rawData = validateReferenceMap(parsed);
            nodesById = new Map(rawData.nodes.map((node) => [node.canonical_id, node]));
            fullEdgeIndex = edgeIndexFor(rawData.edges);
            typeCounts = rawData.nodes.reduce((acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            }, {});
            updateCounts();
            hideLoading();
            renderGraph();
        } catch (error) {
            console.error('Error loading reference map:', error);
            showError(error);
        }
    }

    function validateReferenceMap(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data) ||
            !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
            throw new Error('Invalid REFERENCE_MAP.json: expected an object with nodes and edges arrays.');
        }
        const ids = new Set();
        data.nodes.forEach((node, index) => {
            if (!node || typeof node !== 'object' || Array.isArray(node) ||
                typeof node.canonical_id !== 'string' || !node.canonical_id.trim() ||
                typeof node.name !== 'string' || !node.name.trim() ||
                !Object.hasOwn(ENTITY_LABELS, node.type)) {
                throw new Error(`Invalid REFERENCE_MAP.json node ${index}: expected canonical_id, name, and a supported type.`);
            }
            if (ids.has(node.canonical_id)) {
                throw new Error(`Invalid REFERENCE_MAP.json: duplicate canonical_id ${node.canonical_id}.`);
            }
            if (node.path != null && typeof node.path !== 'string') {
                throw new Error(`Invalid REFERENCE_MAP.json node ${index}: path must be a string when present.`);
            }
            ids.add(node.canonical_id);
        });
        data.edges.forEach((edge, index) => {
            if (!edge || typeof edge !== 'object' || Array.isArray(edge) ||
                typeof edge.from !== 'string' || typeof edge.to !== 'string' ||
                typeof edge.type !== 'string' || !edge.type.trim() ||
                !ids.has(edge.from) || !ids.has(edge.to)) {
                throw new Error(`Invalid REFERENCE_MAP.json edge ${index}: expected known from/to IDs and a type.`);
            }
        });
        return data;
    }

    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    function showError(error) {
        hideLoading();
        document.getElementById('empty').style.display = 'none';
        hideNodeInfo();
        const el = document.getElementById('error');
        document.getElementById('error-title').textContent = 'Dashboard unavailable';
        document.getElementById('error-message').textContent = error.message;
        el.style.display = 'block';
    }

    function updateCounts() {
        // Update chip counts
        Object.keys(ENTITY_LABELS).forEach((k) => {
            const el = document.querySelector(`[data-count="${k}"]`);
            if (el) el.textContent = `· ${typeCounts[k] || 0}`;
        });
        // Update footer counts
        const footer = document.getElementById('footer-counts');
        footer.innerHTML = '';
        Object.keys(ENTITY_LABELS).forEach((k) => {
            const span = document.createElement('span');
            span.className = 'footer-count-item';
            span.innerHTML =
                `<span class="dot" style="background: ${ENTITY_COLORS[k]};"></span>` +
                `<span>${ENTITY_LABELS[k]} ${typeCounts[k] || 0}</span>`;
            footer.appendChild(span);
        });
    }

    // ============================================================
    // Graph rendering
    // ============================================================
    function nodeStatus(node) {
        if (node.status === 'missing') return 'missing';
        if (node.canon_tier === 'speculative' || node.status === 'speculative') return 'speculative';
        return 'normal';
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function buildVisNodes(sourceNodes, edgeIndex) {
        return sourceNodes.map((node) => {
            const type = node.type;
            const color = ENTITY_COLORS[type] || ENTITY_COLORS.missing;
            const status = nodeStatus(node);
            const isMuted = status !== 'normal';
            const connections = edgeIndex.get(node.canonical_id) || 0;
            const isOrphaned = connections === 0;

            return {
                id: node.canonical_id,
                label: node.name,
                title: `${escapeHtml(node.name)} · ${escapeHtml(type)}\n${escapeHtml(node.canonical_id)}` +
                    (status !== 'normal' ? `\n${status}` : '') +
                    (isOrphaned ? '\n— orphan (no connections)' : ''),
                color: {
                    background: color,
                    border: isOrphaned ? TOKENS.collapse : (isMuted ? TOKENS.ink4 : 'rgba(255,255,255,0.85)'),
                    highlight: {
                        background: color,
                        border: TOKENS.amberBright,
                    },
                    hover: {
                        background: color,
                        border: TOKENS.amber,
                    },
                },
                borderWidth: isOrphaned ? 2 : 1,
                borderWidthSelected: 2.5,
                shapeProperties: isMuted
                    ? { borderDashes: [3, 3] }
                    : { borderDashes: false },
                font: {
                    color: TOKENS.ink2,
                    size: 13,
                    face: '"IBM Plex Sans", sans-serif',
                    strokeWidth: 0,
                    vadjust: 4,
                },
                opacity: isMuted ? 0.55 : 1,
                shape: 'dot',
                size: isOrphaned ? 22 : 18,
                _data: node,
            };
        });
    }

    function buildVisEdges(sourceEdges) {
        return sourceEdges.map((edge, index) => ({
            id: `edge-${index}`,
            from: edge.from,
            to: edge.to,
            label: edge.type,
            arrows: { to: { enabled: true, scaleFactor: 0.4 } },
            color: {
                color: TOKENS.void6,
                highlight: TOKENS.amber,
                hover: TOKENS.amberLow,
                opacity: 0.6,
            },
            font: {
                color: TOKENS.ink4,
                size: 9,
                face: '"IBM Plex Mono", monospace',
                strokeWidth: 0,
                align: 'middle',
            },
            width: 0.9,
            selectionWidth: 1.4,
            smooth: { type: 'curvedCW', roundness: 0.18 },
        }));
    }

    function edgeIndexFor(edges) {
        const m = new Map();
        edges.forEach((e) => {
            m.set(e.from, (m.get(e.from) || 0) + 1);
            if (e.to !== e.from) m.set(e.to, (m.get(e.to) || 0) + 1);
        });
        return m;
    }

    function visibleGraphData() {
        const visibleNodes = rawData.nodes.filter((node) => currentFilters[node.type]);
        const visibleIds = new Set(visibleNodes.map((node) => node.canonical_id));
        const visibleEdges = rawData.edges.filter((edge) =>
            visibleIds.has(edge.from) && visibleIds.has(edge.to)
        );
        return {
            nodes: buildVisNodes(visibleNodes, fullEdgeIndex),
            edges: buildVisEdges(visibleEdges),
            count: visibleNodes.length,
        };
    }

    const networkOptions = {
        nodes: {
            shape: 'dot',
            size: 18,
            font: {
                size: 13,
                color: TOKENS.ink2,
                face: '"IBM Plex Sans", sans-serif',
            },
        },
        edges: {
            width: 0.9,
            selectionWidth: 1.4,
            arrows: { to: { enabled: true, scaleFactor: 0.4 } },
        },
        physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -50,
                centralGravity: 0.01,
                springLength: 150,
                springConstant: 0.08,
                damping: 0.4,
                avoidOverlap: 0.5,
            },
            stabilization: {
                enabled: true,
                iterations: 200,
                updateInterval: 25,
            },
        },
        interaction: {
            hover: true,
            tooltipDelay: 120,
            navigationButtons: false,
            keyboard: true,
            zoomView: true,
            dragView: true,
        },
        layout: { improvedLayout: true },
    };

    function renderGraph() {
        if (rawData.nodes.length === 0) {
            showEmptyState();
            return;
        }
        if (!globalThis.vis || typeof vis.Network !== 'function') {
            throw new Error('The graph library did not load. Check the network connection and reload the dashboard.');
        }
        const graphData = visibleGraphData();

        const container = document.getElementById('network');
        network = new vis.Network(container, { nodes: graphData.nodes, edges: graphData.edges }, networkOptions);
        showEmptyState(graphData.count);

        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const node = nodesById.get(params.nodes[0]);
                showNodeInfo(node);
            } else {
                hideNodeInfo();
            }
        });

        network.on('stabilizationIterationsDone', () => {
            network.setOptions({ physics: { enabled: false } });
        });
    }

    function applyFilters() {
        if (!rawData) return;

        const graphData = visibleGraphData();
        if (network) network.setData({ nodes: graphData.nodes, edges: graphData.edges });
        hideNodeInfo();
        showEmptyState(graphData.count);
    }

    function showEmptyState(visibleCount = rawData.nodes.length) {
        const empty = document.getElementById('empty');
        if (visibleCount > 0) {
            empty.style.display = 'none';
            return;
        }
        document.getElementById('empty-title').textContent = rawData.nodes.length === 0
            ? 'Reference map is empty' : 'No entities match these filters';
        document.getElementById('empty-message').textContent = rawData.nodes.length === 0
            ? 'The map loaded successfully, but it contains no nodes.'
            : 'Turn on one or more entity types to show the graph.';
        empty.style.display = 'block';
    }

    // ============================================================
    // Info panel
    // ============================================================
    function showNodeInfo(node) {
        if (!node) return;

        const type = node.type;
        const color = ENTITY_COLORS[type] || ENTITY_COLORS.missing;
        const status = nodeStatus(node);

        const panel = document.getElementById('info-panel');
        panel.style.borderTopColor = color;
        panel.style.boxShadow = `0 16px 48px rgba(0,0,0,0.65), 0 0 24px ${color}22`;

        document.getElementById('info-eyebrow-dot').style.background = color;
        const typeEl = document.getElementById('info-type');
        typeEl.textContent = type;
        typeEl.style.color = color;

        const stencil = document.getElementById('info-stencil-speculative');
        stencil.textContent = status.toUpperCase();
        stencil.style.display = status === 'normal' ? 'none' : 'inline-block';
        document.getElementById('info-title').textContent = node.name;
        document.getElementById('info-id').textContent = node.canonical_id;
        document.getElementById('info-path').textContent = node.path || '—';

        const copyButton = document.getElementById('info-copy-path');
        document.getElementById('path-feedback').textContent = '';
        if (node.path) {
            copyButton.style.display = 'inline-flex';
        } else {
            copyButton.style.display = 'none';
        }

        document.getElementById('info-connections').textContent = fullEdgeIndex.get(node.canonical_id) || 0;

        panel.style.display = 'block';
    }

    function hideNodeInfo() {
        document.getElementById('info-panel').style.display = 'none';
        document.getElementById('path-feedback').textContent = '';
        if (network) network.unselectAll();
    }

    async function copySelectedPath() {
        const path = document.getElementById('info-path').textContent;
        const feedback = document.getElementById('path-feedback');
        if (!path || path === '—') return;
        try {
            if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
                throw new Error('Clipboard API unavailable');
            }
            await navigator.clipboard.writeText(path);
            feedback.textContent = 'Path copied to clipboard.';
        } catch (_) {
            // Clipboard permission may be denied. Select the visible path for manual copy.
            const pathElement = document.getElementById('info-path');
            let selected = false;
            try {
                if (typeof pathElement.focus === 'function') pathElement.focus();
                if (typeof document.createRange === 'function' && typeof window.getSelection === 'function') {
                    const range = document.createRange();
                    range.selectNodeContents(pathElement);
                    const selection = window.getSelection();
                    if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                        selected = true;
                    }
                }
            } catch (_) {
                // Text remains visible if the browser cannot create a selection.
            }
            feedback.textContent = selected
                ? 'Could not copy automatically. The path is selected; use your copy shortcut.'
                : 'Could not copy automatically. Select the path above and use your copy shortcut.';
        }
    }

    function resetView() {
        if (!network) return;
        network.fit({ animation: { duration: 900, easingFunction: 'easeInOutQuad' } });
    }

    // ============================================================
    // Go
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
