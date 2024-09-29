import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import './style.css';

cytoscape.use(cola);
cytoscape.use(nodeHtmlLabel);

let cy; // Declare cy in a wider scope
let allElements; // Store all graph elements

document.addEventListener('DOMContentLoaded', function () {
    // Create a select element for choosing the node
    const selectElement = document.getElementById('nodeSelector');

    // Fetch the graph data from a JSON file
    fetch('/graph_data.json')
        .then(response => response.json())
        .then(graphData => {
            // Populate the select element with node IDs
            graphData.nodes.forEach(node => {
                // Check if the node has any outgoing edges (descendants)
                const hasDescendants = graphData.edges.some(edge => edge.source === node.id);

                if (hasDescendants) {
                    const option = document.createElement('option');
                    option.value = node.id;
                    option.textContent = node.id + ' ' + node.meaning;
                    selectElement.appendChild(option);

                    // If the node ID is '中', set it as the default selected option
                    if (node.id === '中') {
                        option.selected = true;
                    }
                }


            });

            // Initialize cytoscape
            cy = cytoscape({
                container: document.getElementById('cy'),
                elements: [
                    ...graphData.nodes.map(node => ({ data: node })),
                    ...graphData.edges.map(edge => ({ data: edge }))
                ],
                style: [
                    {
                        selector: 'node',
                        style: {
                            'background-color': '#666',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'text-wrap': 'wrap',
                            'text-max-width': '100px',
                            'content': 'data(id)',
                            'font-size': '15px',
                            'color': '#fff',
                            'text-outline-width': 1,
                            'text-outline-color': '#666'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 3,
                            'line-color': '#ccc',
                            'target-arrow-color': '#ccc',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier'
                        }
                    }
                ]
            });

            // Initialize node HTML labels
            cy.nodeHtmlLabel([
                {
                    query: 'node',
                    halign: 'center',
                    valign: 'bottom',
                    halignBox: 'center',
                    valignBox: 'bottom',
                    tpl: data => '<div>' + data.meaning + '</div>'
                }
            ]);

            // Store all elements
            allElements = cy.elements().clone();

            // Initial graph update
            updateGraph(selectElement.value);

            // Add event listener for select element
            selectElement.addEventListener('change', (event) => {
                updateGraph(event.target.value);
            });
        })
        .catch(error => console.error('Error fetching graph data:', error));
});

function updateGraph(chosenNodeId) {
    // Restore all elements to the graph
    cy.elements().remove();
    cy.add(allElements);

    // Filter the graph to show only the chosen node and its descendants
    const chosenNode = cy.getElementById(chosenNodeId);
    const descendants = chosenNode.successors();
    const nodesToKeep = descendants.union(chosenNode);
    cy.elements().difference(nodesToKeep).remove();

    // Apply layout
    cy.layout({
        name: "cola",
        infinite: true,
        fit: false
    }).run();
}
