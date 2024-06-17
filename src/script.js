document.addEventListener("DOMContentLoaded", function () {
  let nodesState = [];
  const startGraph = document.getElementById("start");
  const endGraph = document.getElementById("end");
  const tableHead = document.getElementById("head-table");

  const cy = cytoscape({
    container: document.getElementById("cy"),
    style: [
      {
        selector: "node",
        style: {
          "background-color": "#0074D9",
          label: "data(label)",
        },
      },
      {
        selector: "edge",
        style: {
          width: 3,
          "line-color": "#0074D9",
          "target-arrow-color": "#0074D9",
          "target-arrow-shape": "triangle",
          label: "data(label)",
        },
      },
    ],
    layout: {
      name: "grid",
    },
  });

  let nodeId = 0;
  let edgeId = 0;
  let isAddingEdge = false;
  let sourceNode = null;

  cy.on("tap", function (event) {
    if (event.target === cy) {
      // Add a new node
      let nodeName = prompt("Enter new node : ");
      if (nodeName !== null) {
        const position = event.position;
        const newNode = cy.add({
          group: "nodes",
          data: { id: `n${nodeId++}`, label: nodeName },
          position: { x: position.x, y: position.y },
        });
      }
    } else if (event.target.isNode()) {
      if (isAddingEdge) {
        // Add an edge from sourceNode to the clicked node
        const newWeight = parseInt(prompt("Enter new weight :"));
        cy.add({
          group: "edges",
          data: {
            id: `e${edgeId++}`,
            source: sourceNode.id(),
            target: event.target.id(),
            label: newWeight,
          },
        });
        isAddingEdge = false;
        sourceNode = null;
      } else {
        // Set the clicked node as the source for a new edge
        sourceNode = event.target;
        isAddingEdge = true;
      }
    }
  });

  // Add double-click event on edges to remove them
  cy.on("cxttap", "edge", (event) => {
    console.log(event);
    event.target.remove();
  });

  cy.on("cxttap", "node", (event) => {
    event.target.remove();
  });
  // Add double-click event on edges to change their label
  cy.on("dblclick", "edge", function (event) {
    const edge = event.target;
    console.log(edge.data("label"));
    const newLabel = prompt(
      "Enter new label for the edge:",
      edge.data("label")
    );
    if (newLabel !== null) {
      edge.data("label", newLabel);
      console.log(edge.data("label"));
    }
  });

  // Add Interact.js for draggable nodes
  interact("#cy").on("tap", (event) => {
    const node = cy.$(`node[id="${event.target.id}"]`);
    if (node) {
      node.position({
        x: event.clientX,
        y: event.clientY,
      });
    }
  });

  cy.on("tap", function (event) {
    const target = event.target;

    // Vérifie si la touche Ctrl est enfoncée
    if (event.originalEvent.ctrlKey) {
      // Actions à effectuer lors d'un Ctrl + clic gauche
      console.log("Ctrl + clic gauche sur :", target.id());
    }
  });

  document
    .getElementById("getGraphData")
    .addEventListener("click", function () {
      const nodes = cy.nodes().map((node) => ({
        id: node.id(),
        label: node.data("label"),
        position: node.position(),
      }));

      const edges = cy.edges().map((edge) => ({
        id: edge.id(),
        source: edge.data("source"),
        target: edge.data("target"),
        label: edge.data("label"),
      }));

      let allNodes = [];
      let startOption = "";
      let endOption = "";

      const graphData = { nodes, edges };
      console.log(graphData);

      for (let node of nodes) {
        allNodes.push({
          id: node.id,
          summit: node.label,
          next: [],
          value: Infinity,
          isMarked: false,
          previousNode: null,
        });
        startOption += `
          <option value=${node.label}>${node.label}</option>
        `;
        endOption += `
          <option value=${node.label}>${node.label}</option>
        `;
      }

      for (let n of allNodes) {
        for (let e of edges) {
          if (e.source === n.id) {
            n.next.push({
              summit: getNodeById(nodes, e.target),
              distance: e.label,
            });
          } else if (e.target === n.id) {
            n.next.push({
              summit: getNodeById(nodes, e.source),
              distance: e.label,
            });
          }
        }
      }

      // for (let nd of allNodes) {
      //   tableHead.innerHTML += `<th>${nd.summit}</th>`;
      // }

      startGraph.innerHTML = startOption;
      endGraph.innerHTML = endOption;

      console.log(allNodes);
      nodesState = allNodes;

      //dijkstraAlgorithm(allNodes);
    });

  document.getElementById("short").addEventListener("click", function () {
    let inputStart = document.getElementById("start").value;
    let inputEnd = document.getElementById("end").value;
    const result = dijkstraAlgorithm(nodesState, inputStart, inputEnd);
    highlightShortestPath(result.shortestPath, cy);
  });
});

function highlightShortestPath(shortestPath, cy) {
  // Reset all styles
  cy.nodes().style("background-color", "#0074D9");
  cy.edges().style("line-color", "#0074D9");

  // Highlight nodes in the shortest path
  shortestPath.forEach((nodeLabel, index) => {
    const node = cy.nodes().filter(`[label = "${nodeLabel}"]`);
    node.style("background-color", "yellow");
  });

  // Highlight edges in the shortest path
  for (let i = 0; i < shortestPath.length - 1; i++) {
    const sourceNode = cy.nodes().filter(`[label = "${shortestPath[i]}"]`).id();
    const targetNode = cy
      .nodes()
      .filter(`[label = "${shortestPath[i + 1]}"]`)
      .id();
    const edge = cy
      .edges()
      .filter(`[source = "${sourceNode}"][target = "${targetNode}"]`);
    edge.style("line-color", "red");
  }
}

function getNodeById(nodes, id) {
  let n = null;
  for (let node of nodes) {
    if (node.id == id) n = node.label;
  }

  return n;
}

function dijkstraAlgorithm(allNodes, start, end) {
  console.log("==== ******* ===========================");
  console.log("dijkstra algorithm");
  console.log("==== ******* ===========================");

  const nodes = [];

  // Initialisation de la valeur du nœud de départ à 0
  allNodes.forEach((node) => {
    if (node.summit === start) {
      node.value = 0;
    }
  });

  // Boucle principale de l'algorithme de Dijkstra
  while (true) {
    // Créer une copie profonde du tableau allNodes à chaque tour de boucle
    const currentNodesState = JSON.parse(JSON.stringify(allNodes));

    // Trouver le nœud non marqué avec la plus petite valeur
    const minNode = findNodeWithMinValue(allNodes);

    if (!minNode) {
      // Si minNode est null, cela signifie que tous les nœuds sont marqués
      break;
    }

    // Marquer le nœud comme traité
    minNode.isMarked = true;

    // Mettre à jour les valeurs des nœuds voisins non marqués
    minNode.next.forEach((nextNode) => {
      const adjacentNode = allNodes.find(
        (node) => node.summit === nextNode.summit
      );
      if (
        !adjacentNode.isMarked &&
        adjacentNode.value > minNode.value + nextNode.distance
      ) {
        adjacentNode.value = minNode.value + nextNode.distance;
        adjacentNode.previousNode = minNode;
      }
    });

    nodes.push(currentNodesState);

    console.log("Current state of allNodes:", currentNodesState);
  }

  // Construction du chemin le plus court de end à start
  let currentNode = allNodes.find((node) => node.summit === end);
  const shortestPath = [];
  while (currentNode) {
    shortestPath.unshift(currentNode.summit);
    currentNode = currentNode.previousNode;
  }
  nodes.push(allNodes);
  console.log("Shortest path from", start, "to", end, ":", shortestPath);
  console.log(nodes);
  console.log(allNodes);

  const table = document.createElement("table");
  table.className = "w-full text-justify border divide-y-2";

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");

  allNodes.forEach((elem, index) => {
    const th = document.createElement("th");
    th.textContent = elem.summit;
    trHead.appendChild(th);
  });

  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.className = "divide-y-2";

  nodes.forEach((elem, index) => {
    const trBody = document.createElement("tr");

    elem.forEach((data, i) => {
      const td = document.createElement("td");
      td.className = data.isMarked ? "bg-gray-200" : "";

      if (shortestPath.includes(data.summit) && data.isMarked) {
        td.className = "bg-yellow-400";
      }

      td.textContent =
        data.value === null
          ? "∞"
          : data.value + (data.previousNode ? data.previousNode.summit : "");
      trBody.appendChild(td);
    });

    tbody.appendChild(trBody);
  });

  table.appendChild(tbody);

  // Assuming you have a container to append the table to
  const container = document.getElementById("table-content");
  container.appendChild(table);

  return { shortestPath, nodesState: allNodes };
}

function findNodeWithMinValue(nodes) {
  let minNode = null;
  let minValue = Infinity;

  nodes.forEach((node) => {
    if (!node.isMarked && node.value < minValue) {
      minValue = node.value;
      minNode = node;
    }
  });

  return minNode;
}
