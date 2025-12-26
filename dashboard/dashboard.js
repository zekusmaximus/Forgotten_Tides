// Continuity Dashboard - The Forgotten Tides Universe
// Loads and visualizes REFERENCE_MAP.json as an interactive network graph

(function() {
    'use strict';

    // State
    let network = null;
    let rawData = null;
    let currentFilters = {
        character: true,
        location: true,
        mechanics: true,
        faction: true,
        story: true
    };

    // Color mapping for entity types
    const typeColors = {
        character: '#4a9eff',
        location: '#ff6b6b',
        mechanics: '#51cf66',
        faction: '#ffd93d',
        story: '#a78bfa',
        missing: '#888'
    };

    // Initialize dashboard on page load
    function init() {
        console.log('Initializing Continuity Dashboard...');
        setupEventListeners();
        loadReferenceMap();
    }

    // Set up UI event listeners
    function setupEventListeners() {
        // Filter checkboxes
        document.getElementById('filter-character').addEventListener('change', (e) => {
            currentFilters.character = e.target.checked;
            applyFilters();
        });
        document.getElementById('filter-location').addEventListener('change', (e) => {
            currentFilters.location = e.target.checked;
            applyFilters();
        });
        document.getElementById('filter-mechanics').addEventListener('change', (e) => {
            currentFilters.mechanics = e.target.checked;
            applyFilters();
        });
        document.getElementById('filter-faction').addEventListener('change', (e) => {
            currentFilters.faction = e.target.checked;
            applyFilters();
        });
        document.getElementById('filter-story').addEventListener('change', (e) => {
            currentFilters.story = e.target.checked;
            applyFilters();
        });

        // Buttons
        document.getElementById('reset-view').addEventListener('click', resetView);
        document.getElementById('reload-data').addEventListener('click', () => {
            location.reload();
        });
    }

    // Load REFERENCE_MAP.json
    async function loadReferenceMap() {
        try {
            console.log('Loading REFERENCE_MAP.json...');
            const response = await fetch('../REFERENCE_MAP.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            rawData = await response.json();
            console.log('Reference map loaded:', rawData);

            // Validate data structure
            if (!rawData.nodes || !rawData.edges) {
                throw new Error('Invalid REFERENCE_MAP.json structure. Expected "nodes" and "edges" arrays.');
            }

            // Hide loading, show graph
            document.getElementById('loading').style.display = 'none';
            
            // Render the graph
            renderGraph();
        } catch (error) {
            console.error('Error loading reference map:', error);
            showError(error);
        }
    }

    // Show error message
    function showError(error) {
        document.getElementById('loading').style.display = 'none';
        const errorDiv = document.getElementById('error');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.innerHTML = `
            <strong>Failed to load REFERENCE_MAP.json</strong><br><br>
            ${error.message}<br><br>
            Make sure you're running this dashboard from a local server or that REFERENCE_MAP.json exists in the repository root.
            <br><br>
            Try running: <code>npx http-server -p 8080</code> in the repository root, then visit <code>http://localhost:8080/dashboard/</code>
        `;
        
        errorDiv.style.display = 'block';
    }

    // Render the network graph
    function renderGraph() {
        console.log('Rendering graph with', rawData.nodes.length, 'nodes and', rawData.edges.length, 'edges');

        // Prepare nodes for vis.js
        const nodes = rawData.nodes.map(node => {
            const type = node.type || 'missing';
            const color = typeColors[type] || typeColors.missing;
            
            // Check if node is missing (could be indicated by status or missing path)
            const isMissing = node.status === 'missing' || node.status === 'speculative' || !node.path;
            
            return {
                id: node.canonical_id,
                label: node.name,
                title: `${node.name}\nType: ${type}\nID: ${node.canonical_id}`,
                color: {
                    background: color,
                    border: isMissing ? '#888' : '#fff',
                    highlight: {
                        background: color,
                        border: '#fff'
                    }
                },
                borderWidth: isMissing ? 2 : 1,
                borderWidthSelected: 3,
                font: {
                    color: '#ffffff',
                    size: 14,
                    face: 'arial'
                },
                opacity: isMissing ? 0.5 : 1,
                shape: 'dot',
                size: 20,
                _data: node // Store original data
            };
        });

        // Prepare edges for vis.js
        const edges = rawData.edges.map((edge, index) => ({
            id: `edge-${index}`,
            from: edge.from,
            to: edge.to,
            label: edge.type,
            arrows: 'to',
            color: {
                color: '#444',
                highlight: '#666',
                hover: '#666'
            },
            font: {
                color: '#888',
                size: 10,
                align: 'middle'
            },
            smooth: {
                type: 'curvedCW',
                roundness: 0.2
            }
        }));

        // Create network container
        const container = document.getElementById('graph-container');

        // Network options
        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                font: {
                    size: 14,
                    color: '#ffffff'
                }
            },
            edges: {
                width: 1,
                selectionWidth: 3,
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5
                    }
                }
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
                    avoidOverlap: 0.5
                },
                stabilization: {
                    enabled: true,
                    iterations: 200,
                    updateInterval: 25
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                navigationButtons: true,
                keyboard: true,
                zoomView: true,
                dragView: true
            },
            layout: {
                improvedLayout: true
            }
        };

        // Create the network
        network = new vis.Network(container, { nodes, edges }, options);

        // Handle node selection
        network.on('click', function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = rawData.nodes.find(n => n.canonical_id === nodeId);
                showNodeInfo(node);
            } else {
                hideNodeInfo();
            }
        });

        // Handle stabilization
        network.on('stabilizationIterationsDone', function() {
            console.log('Graph stabilization complete');
            network.setOptions({ physics: { enabled: false } });
        });

        // Log when ready
        network.on('afterDrawing', function() {
            console.log('Graph rendered successfully');
        });
    }

    // Apply filters to the graph
    function applyFilters() {
        if (!network || !rawData) return;

        console.log('Applying filters:', currentFilters);

        // Filter nodes based on current filter settings
        const filteredNodes = rawData.nodes.filter(node => {
            const type = node.type || 'missing';
            return currentFilters[type] !== false;
        });

        // Get filtered node IDs
        const filteredNodeIds = new Set(filteredNodes.map(n => n.canonical_id));

        // Filter edges to only include those between visible nodes
        const filteredEdges = rawData.edges.filter(edge => 
            filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to)
        );

        // Update the network data
        const nodes = filteredNodes.map(node => {
            const type = node.type || 'missing';
            const color = typeColors[type] || typeColors.missing;
            
            // Conflict detection: Orphaned nodes (no connections)
            const connections = rawData.edges.filter(e => 
                e.from === node.canonical_id || e.to === node.canonical_id
            ).length;
            const isOrphaned = connections === 0;
            const isMissing = node.status === 'missing' || node.status === 'speculative' || !node.path;
            
            return {
                id: node.canonical_id,
                label: node.name,
                title: `${node.name}\nType: ${type}\nID: ${node.canonical_id}${isOrphaned ? '\n⚠️ ORPHANED (No connections)' : ''}`,
                color: {
                    background: color,
                    border: isOrphaned ? '#ff0000' : (isMissing ? '#888' : '#fff'),
                    highlight: {
                        background: color,
                        border: isOrphaned ? '#ff0000' : '#fff'
                    }
                },
                borderWidth: isOrphaned ? 4 : (isMissing ? 2 : 1),
                borderWidthSelected: isOrphaned ? 6 : 3,
                font: {
                    color: '#ffffff',
                    size: 14,
                    face: 'arial',
                    strokeWidth: isOrphaned ? 2 : 0,
                    strokeColor: '#000'
                },
                opacity: isMissing ? 0.5 : 1,
                shape: 'dot',
                size: isOrphaned ? 25 : 20,
                _data: node
            };
        });

        const edges = filteredEdges.map((edge, index) => ({
            id: `edge-${index}`,
            from: edge.from,
            to: edge.to,
            label: edge.type,
            arrows: 'to',
            color: {
                color: '#444',
                highlight: '#666',
                hover: '#666'
            },
            font: {
                color: '#888',
                size: 10,
                align: 'middle'
            },
            smooth: {
                type: 'curvedCW',
                roundness: 0.2
            }
        }));

        // Update network
        network.setData({ nodes, edges });
        
        console.log(`Filtered to ${nodes.length} nodes and ${edges.length} edges`);
    }

    // Show node information panel
    function showNodeInfo(node) {
        if (!node) return;

        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').textContent = node.name;
        document.getElementById('info-type').textContent = node.type || 'Unknown';
        document.getElementById('info-id').textContent = node.canonical_id;
        document.getElementById('info-path').textContent = node.path || 'Not specified';
        
        // Update VS Code link
        const vscodeLink = document.getElementById('info-vscode-link');
        if (node.path) {
            // Use vscode://file/ protocol
            // Note: This requires the user to have VS Code installed and the protocol registered
            // We use a relative path which might be tricky, but usually VS Code handles it if the workspace is open
            const absolutePath = window.location.pathname.replace('/dashboard/index.html', '') + '/' + node.path;
            vscodeLink.href = `vscode://file/${node.path}`; 
            vscodeLink.style.display = 'inline-block';
        } else {
            vscodeLink.style.display = 'none';
        }

        // Count connections
        const connections = rawData.edges.filter(e => 
            e.from === node.canonical_id || e.to === node.canonical_id
        ).length;
        document.getElementById('info-connections').textContent = connections;

        panel.style.display = 'block';
    }

    // Hide node information panel
    function hideNodeInfo() {
        document.getElementById('info-panel').style.display = 'none';
    }

    // Reset view to fit all nodes
    function resetView() {
        if (network) {
            network.fit({
                animation: {
                    duration: 1000,
                    easingFunction: 'easeInOutQuad'
                }
            });
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
