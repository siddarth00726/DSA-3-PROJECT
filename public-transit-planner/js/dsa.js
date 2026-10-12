/**
 * Public Transit Planner - Data Structures & Algorithms Core
 * 
 * 1. MinPriorityQueue: Binary Min-Heap implementation for O(log V) operations
 * 2. TransitGraph: Adjacency List representing vertices (stops) and weighted edges (connections)
 * 3. DijkstraRouter: Computes optimal routes considering travel time, distance, transfers, and cost
 * 4. AlgorithmTracer: Provides step-by-step visual execution frames for the interactive simulator
 */

class MinPriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(element, priority) {
    const node = { element, priority };
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  size() {
    return this.heap.length;
  }

  _bubbleUp(index) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = element;
  }

  _sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swap = null;

      if (leftChildIndex < length) {
        const leftChild = this.heap[leftChildIndex];
        if (leftChild.priority < element.priority) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const rightChild = this.heap[rightChildIndex];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && rightChild.priority < this.heap[swap].priority)
        ) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) break;
      this.heap[index] = this.heap[swap];
      index = swap;
    }
    this.heap[index] = element;
  }
}

class TransitGraph {
  constructor() {
    // Adjacency List: Map of stopId -> Array of outgoing edges
    this.adjacencyList = new Map();
    // Hash Map for O(1) stop lookup: stopId -> Stop Object
    this.vertices = new Map();
  }

  addVertex(stop) {
    if (!this.vertices.has(stop.id)) {
      this.vertices.set(stop.id, stop);
      this.adjacencyList.set(stop.id, []);
    } else {
      this.vertices.set(stop.id, { ...this.vertices.get(stop.id), ...stop });
    }
  }

  removeVertex(stopId) {
    this.vertices.delete(stopId);
    this.adjacencyList.delete(stopId);
    // Remove all edges referencing this vertex
    for (const [id, edges] of this.adjacencyList.entries()) {
      this.adjacencyList.set(
        id,
        edges.filter(edge => edge.target !== stopId)
      );
    }
  }

  addEdge(sourceId, targetId, edgeData = {}) {
    if (!this.adjacencyList.has(sourceId)) {
      this.adjacencyList.set(sourceId, []);
    }
    const edges = this.adjacencyList.get(sourceId);
    const filtered = edges.filter(e => e.target !== targetId);
    filtered.push({
      target: targetId,
      distance: Number(edgeData.distance || 5),
      time: Number(edgeData.time || 15),
      cost: Number(edgeData.cost || 20),
      routeId: edgeData.routeId || '',
      routeName: edgeData.routeName || '',
      intermediateStops: edgeData.intermediateStops || []
    });
    this.adjacencyList.set(sourceId, filtered);
  }

  removeEdge(sourceId, targetId) {
    if (this.adjacencyList.has(sourceId)) {
      this.adjacencyList.set(
        sourceId,
        this.adjacencyList.get(sourceId).filter(e => e.target !== targetId)
      );
    }
  }

  getNeighbors(stopId) {
    return this.adjacencyList.get(stopId) || [];
  }

  getAllVertices() {
    return Array.from(this.vertices.values());
  }

  getVertex(stopId) {
    return this.vertices.get(stopId);
  }

  hasVertex(stopId) {
    return this.vertices.has(stopId);
  }

  clear() {
    this.adjacencyList.clear();
    this.vertices.clear();
  }
}

class DijkstraRouter {
  /**
   * Calculates optimal path using Dijkstra's Algorithm with Min-Heap Priority Queue
   * @param {TransitGraph} graph
   * @param {string} sourceId
   * @param {string} destinationId
   * @param {string} criterion - 'time' | 'distance' | 'cost' | 'transfers'
   */
  static findRoute(graph, sourceId, destinationId, criterion = 'time') {
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    if (!graph.hasVertex(sourceId) || !graph.hasVertex(destinationId)) {
      return {
        found: false,
        error: 'Origin or Destination stop not found in transit network.'
      };
    }

    if (sourceId === destinationId) {
      const stop = graph.getVertex(sourceId);
      return {
        found: true,
        path: [sourceId],
        stopSequence: [stop],
        intermediateStops: [],
        totalStopsCount: 1,
        totalDistance: 0,
        totalTime: 0,
        totalCost: 0,
        transfers: 0,
        suggestedRoutes: [],
        executionTimeMs: '0.05',
        nodesExplored: 1
      };
    }

    const getWeight = (edge) => {
      switch (criterion) {
        case 'distance': return edge.distance;
        case 'cost': return edge.cost;
        case 'transfers': return 1; // Fewest hops
        case 'time':
        default: return edge.time;
      }
    };

    const distances = new Map();
    const previous = new Map();
    const edgeUsed = new Map();
    const pq = new MinPriorityQueue();
    const visited = new Set();
    let nodesExplored = 0;

    for (const vertex of graph.getAllVertices()) {
      if (vertex.id === sourceId) {
        distances.set(vertex.id, 0);
        pq.enqueue(vertex.id, 0);
      } else {
        distances.set(vertex.id, Infinity);
      }
      previous.set(vertex.id, null);
    }

    while (!pq.isEmpty()) {
      const item = pq.dequeue();
      const currentId = item.element;
      const currentDist = item.priority;

      if (visited.has(currentId)) continue;
      visited.add(currentId);
      nodesExplored++;

      if (currentId === destinationId) break;
      if (currentDist > distances.get(currentId)) continue;

      const neighbors = graph.getNeighbors(currentId);
      for (const edge of neighbors) {
        const neighborId = edge.target;
        if (visited.has(neighborId)) continue;

        const weight = getWeight(edge);
        const newDist = currentDist + weight;

        if (newDist < distances.get(neighborId)) {
          distances.set(neighborId, newDist);
          previous.set(neighborId, currentId);
          edgeUsed.set(neighborId, edge);
          pq.enqueue(neighborId, newDist);
        }
      }
    }

    const endTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const execTime = (endTime - startTime).toFixed(2);

    if (distances.get(destinationId) === Infinity) {
      const srcName = graph.getVertex(sourceId)?.name || sourceId;
      const dstName = graph.getVertex(destinationId)?.name || destinationId;
      return {
        found: false,
        error: `No transit path currently connects ${srcName} and ${dstName}.`,
        executionTimeMs: execTime,
        nodesExplored
      };
    }

    // Reconstruct path
    const pathIds = [];
    const usedEdges = [];
    let curr = destinationId;
    while (curr) {
      pathIds.unshift(curr);
      const edge = edgeUsed.get(curr);
      if (edge) usedEdges.unshift(edge);
      curr = previous.get(curr);
    }

    let totalDistance = 0;
    let totalTime = 0;
    let totalCost = 0;
    const fullSequence = [];
    const suggestedRoutes = new Set();

    for (let i = 0; i < pathIds.length; i++) {
      const stopObj = graph.getVertex(pathIds[i]);
      if (i === 0) {
        fullSequence.push({
          ...stopObj,
          isOrigin: true,
          isDestination: false,
          isIntermediate: false,
          legTime: 0,
          cumulativeTime: 0,
          legDistance: 0,
          cumulativeDistance: 0
        });
      } else {
        const edge = usedEdges[i - 1];
        totalDistance += edge.distance;
        totalTime += edge.time;
        totalCost += edge.cost;
        if (edge.routeId) suggestedRoutes.add(edge.routeId);

        const isDest = (i === pathIds.length - 1);
        fullSequence.push({
          ...stopObj,
          isOrigin: false,
          isDestination: isDest,
          isIntermediate: !isDest,
          legTime: edge.time,
          cumulativeTime: totalTime,
          legDistance: edge.distance,
          cumulativeDistance: +totalDistance.toFixed(1),
          routeId: edge.routeId,
          routeName: edge.routeName
        });
      }
    }

    const intermediateStops = fullSequence.slice(1, -1);

    return {
      found: true,
      source: graph.getVertex(sourceId),
      destination: graph.getVertex(destinationId),
      pathStopIds: pathIds,
      fullSequence,
      intermediateStops,
      totalStopsCount: fullSequence.length,
      intermediateCount: intermediateStops.length,
      totalDistance: +totalDistance.toFixed(1),
      totalTime: Math.round(totalTime),
      totalCost: Math.round(totalCost),
      transfers: Math.max(0, suggestedRoutes.size - 1),
      suggestedRoutes: Array.from(suggestedRoutes),
      executionTimeMs: execTime,
      nodesExplored,
      criterion
    };
  }

  /**
   * Generates step-by-step state frames for Dijkstra Algorithm Visualizer
   */
  static traceExecution(graph, sourceId, destinationId) {
    const steps = [];
    const distances = new Map();
    const previous = new Map();
    const visited = new Set();
    const pq = new MinPriorityQueue();

    for (const vertex of graph.getAllVertices()) {
      if (vertex.id === sourceId) {
        distances.set(vertex.id, 0);
        pq.enqueue(vertex.id, 0);
      } else {
        distances.set(vertex.id, Infinity);
      }
      previous.set(vertex.id, null);
    }

    const srcName = (graph.getVertex(sourceId) || {}).name || sourceId;

    steps.push({
      step: 0,
      description: `[Init] Set distance to Source stop [${srcName}] to 0 mins. All other stops set to ∞. Source enqueued into Min-Heap.`,
      currentNode: sourceId,
      currentNodeName: srcName,
      visited: [],
      queueSnapshot: [{ id: sourceId, name: srcName, priority: 0 }],
      distancesSnapshot: Object.fromEntries(distances)
    });

    let stepCount = 1;

    while (!pq.isEmpty()) {
      const item = pq.dequeue();
      const currentId = item.element;
      const currentDist = item.priority;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentVertex = graph.getVertex(currentId) || { name: currentId };
      const isTarget = currentId === destinationId;

      steps.push({
        step: stepCount++,
        description: `[Extract-Min] Dequeued [${currentVertex.name}] with shortest accumulated time (${currentDist} mins). Marked as visited.`,
        currentNode: currentId,
        currentNodeName: currentVertex.name,
        visited: Array.from(visited),
        queueSnapshot: pq.heap.map(h => ({ id: h.element, name: (graph.getVertex(h.element)||{}).name || h.element, priority: h.priority })),
        distancesSnapshot: Object.fromEntries(distances),
        reachedTarget: isTarget
      });

      if (isTarget) {
        steps.push({
          step: stepCount++,
          description: `[Goal Reached] Destination [${currentVertex.name}] reached with optimal travel time of ${currentDist} minutes!`,
          currentNode: currentId,
          currentNodeName: currentVertex.name,
          visited: Array.from(visited),
          queueSnapshot: [],
          distancesSnapshot: Object.fromEntries(distances),
          isComplete: true
        });
        break;
      }

      const neighbors = graph.getNeighbors(currentId);
      for (const edge of neighbors) {
        const neighborId = edge.target;
        const neighborVertex = graph.getVertex(neighborId) || { name: neighborId };
        if (visited.has(neighborId)) continue;

        const newDist = currentDist + edge.time;
        const oldDist = distances.get(neighborId);

        if (newDist < oldDist) {
          distances.set(neighborId, newDist);
          previous.set(neighborId, currentId);
          pq.enqueue(neighborId, newDist);

          steps.push({
            step: stepCount++,
            description: `[Relaxation] Edge [${currentVertex.name} -> ${neighborVertex.name}] offers shorter time (${newDist}m vs ${oldDist === Infinity ? '∞' : oldDist + 'm'}). Updated and enqueued.`,
            currentNode: currentId,
            currentNodeName: currentVertex.name,
            updatedNeighbor: neighborId,
            updatedNeighborName: neighborVertex.name,
            visited: Array.from(visited),
            queueSnapshot: pq.heap.map(h => ({ id: h.element, name: (graph.getVertex(h.element)||{}).name || h.element, priority: h.priority })),
            distancesSnapshot: Object.fromEntries(distances)
          });
        }
      }
    }

    return steps;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MinPriorityQueue, TransitGraph, DijkstraRouter };
}
