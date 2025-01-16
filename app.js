async function loadRDF() {
  const url = document.getElementById('rdf-url').value;

  try {
    const response = await fetch(url);
    const rdfData = await response.text();

    // Parse RDF using rdflib.js
    const store = $rdf.graph();
    $rdf.parse(rdfData, store, url, 'application/rdf+xml');

    visualizeOntology(store);
  } catch (error) {
    alert('Error loading RDF: ' + error.message);
  }
}

function visualizeOntology(store) {
  const triples = store.statementsMatching();
  const nodes = new Map();
  const links = [];

  triples.forEach(triple => {
    nodes.set(triple.subject.value, { id: triple.subject.value });
    nodes.set(triple.object.value, { id: triple.object.value });
    links.push({ source: triple.subject.value, target: triple.object.value, label: triple.predicate.value });
  });

  const nodeArray = Array.from(nodes.values());

  // D3.js visualization
  const width = 1000;
  const height = 800;

  const svg = d3.select('#visualization')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(d3.zoom().on('zoom', (event) => {
      svg.attr('transform', event.transform);
    }))
    .append('g');

  const link = svg.selectAll('.link')
    .data(links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke', '#999')
    .attr('stroke-width', 2);

  const node = svg.selectAll('.node')
    .data(nodeArray)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', 10)
    .attr('fill', '#69b3a2')
    .call(d3.drag()
      .on('start', dragStart)
      .on('drag', dragging)
      .on('end', dragEnd));

  const labels = svg.selectAll('.label')
    .data(nodeArray)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', 12)
    .attr('y', 3)
    .text(d => d.id);

  const simulation = d3.forceSimulation(nodeArray)
    .force('link', d3.forceLink(links).id(d => d.id))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2));

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    labels
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  });

  function dragStart(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragging(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnd(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}
