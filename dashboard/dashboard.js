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
        missing: '#6A727C',
    };

    const ENTITY_LABELS = {
        character: 'Characters',
        location: 'Locations',
        mechanics: 'Mechanics',
        faction: 'Factions',
        story: 'Stories',
    };

    // ============================================================
    // State
    // ============================================================
    let network = null;
    let rawData = null;
    let typeCounts = {};
    let currentFilters = {
        character: true,
        location: true,
        mechanics: true,
        faction: true,
        story: true,
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
                applyFilters();
            });
        });

        document.getElementById('reset-view').addEventListener('click', resetView);
        document.getElementById('reload-data').addEventListener('click', () => location.reload());
        document.getElementById('info-close').addEventListener('click', hideNodeInfo);
    }

    // ============================================================
    // Data
    // ============================================================
    async function loadReferenceMap() {
        try {
            const response = await fetch('../REFERENCE_MAP.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            rawData = await response.json();
            if (!rawData.nodes || !rawData.edges) {
                throw new Error('Invalid REFERENCE_MAP.json structure. Expected "nodes" and "edges" arrays.');
            }
            typeCounts = rawData.nodes.reduce((acc, n) => {
                const t = n.type || 'missing';
                acc[t] = (acc[t] || 0) + 1;
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

    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    function showError(error) {
        hideLoading();
        const el = document.getElementById('error');
        document.getElementById('error-message').innerHTML =
            `${escapeHtml(error.message)}<br><br>` +
            `Make sure you're serving this dashboard from a local server with <code>REFERENCE_MAP.json</code> at the repository root.<br><br>` +
            `Try <code>npx http-server -p 8080</code> in the repo root, then visit <code>http://localhost:8080/dashboard/</code>.`;
        el.style.display = 'block';
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[c]);
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
    function buildVisNodes(sourceNodes, edgeIndex) {
        return sourceNodes.map((node) => {
            const type = node.type || 'missing';
            const color = ENTITY_COLORS[type] || ENTITY_COLORS.missing;
            const isMissing = node.status === 'missing' || node.status === 'speculative' || !node.path;
            const connections = edgeIndex.get(node.canonical_id) || 0;
            const isOrphaned = connections === 0;

            return {
                id: node.canonical_id,
                label: node.name,
                title: `${node.name} · ${type}\n${node.canonical_id}` +
                    (isOrphaned ? '\n— orphan (no connections)' : ''),
                color: {
                    background: color,
                    border: isOrphaned ? TOKENS.collapse : (isMissing ? TOKENS.ink4 : 'rgba(255,255,255,0.85)'),
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
                shapeProperties: isMissing
                    ? { borderDashes: [3, 3] }
                    : { borderDashes: false },
                font: {
                    color: TOKENS.ink2,
                    size: 13,
                    face: '"IBM Plex Sans", sans-serif',
                    strokeWidth: 0,
                    vadjust: 4,
                },
                opacity: isMissing ? 0.45 : 1,
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
            m.set(e.to, (m.get(e.to) || 0) + 1);
        });
        return m;
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
        const idx = edgeIndexFor(rawData.edges);
        const nodes = buildVisNodes(rawData.nodes, idx);
        const edges = buildVisEdges(rawData.edges);

        const container = document.getElementById('network');
        network = new vis.Network(container, { nodes, edges }, networkOptions);

        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const node = rawData.nodes.find((n) => n.canonical_id === params.nodes[0]);
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
        if (!network || !rawData) return;

        const filteredNodes = rawData.nodes.filter((n) => currentFilters[n.type || 'missing'] !== false);
        const visibleIds = new Set(filteredNodes.map((n) => n.canonical_id));
        const filteredEdges = rawData.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));

        const idx = edgeIndexFor(filteredEdges);
        const nodes = buildVisNodes(filteredNodes, idx);
        const edges = buildVisEdges(filteredEdges);

        network.setData({ nodes, edges });
    }

    // ============================================================
    // Info panel
    // ============================================================
    function showNodeInfo(node) {
        if (!node) return;

        const type = node.type || 'missing';
        const color = ENTITY_COLORS[type] || ENTITY_COLORS.missing;
        const isMissing = node.status === 'missing' || node.status === 'speculative' || !node.path;

        const panel = document.getElementById('info-panel');
        panel.style.borderTopColor = color;
        panel.style.boxShadow = `0 16px 48px rgba(0,0,0,0.65), 0 0 24px ${color}22`;

        document.getElementById('info-eyebrow-dot').style.background = color;
        const typeEl = document.getElementById('info-type');
        typeEl.textContent = type;
        typeEl.style.color = color;

        document.getElementById('info-stencil-speculative').style.display = isMissing ? 'inline-block' : 'none';
        document.getElementById('info-title').textContent = node.name;
        document.getElementById('info-id').textContent = node.canonical_id;
        document.getElementById('info-path').textContent = node.path || '—';

        const link = document.getElementById('info-vscode-link');
        if (node.path) {
            link.href = `vscode://file/${node.path}`;
            link.style.display = 'inline-flex';
        } else {
            link.style.display = 'none';
        }

        const connections = rawData.edges.filter(
            (e) => e.from === node.canonical_id || e.to === node.canonical_id
        ).length;
        document.getElementById('info-connections').textContent = connections;

        panel.style.display = 'block';
    }

    function hideNodeInfo() {
        document.getElementById('info-panel').style.display = 'none';
        if (network) network.unselectAll();
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
