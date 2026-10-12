/**
 * Public Transit Planner - Admin & Network Planner Panel Controller
 * Handles CRUD operations for stops, routes, timetables, and local state persistence.
 */

class AdminManager {
  constructor() {
    this.initEventListeners();
  }

  initEventListeners() {
    // Add Stop Form Submit
    const addStopForm = document.getElementById('form-add-stop');
    if (addStopForm) {
      addStopForm.addEventListener('submit', (e) => this.handleAddStop(e));
    }

    // Add Route Form Submit
    const addRouteForm = document.getElementById('form-add-route');
    if (addRouteForm) {
      addRouteForm.addEventListener('submit', (e) => this.handleAddRoute(e));
    }

    // Reset Demo Data Button
    const resetBtn = document.getElementById('btn-reset-demo-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleResetData());
    }

    // Export Data Button
    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportData());
    }
  }

  notifyChange(message) {
    window.dispatchEvent(new CustomEvent('transit-data-changed', { detail: { message } }));
    if (window.showToast) {
      window.showToast(message, 'success');
    }
  }

  handleAddStop(e) {
    e.preventDefault();
    const name = document.getElementById('new-stop-name').value.trim();
    const code = document.getElementById('new-stop-code').value.trim() || `STP-${Math.floor(10 + Math.random() * 90)}`;
    const zone = document.getElementById('new-stop-zone').value || 'West Zone';
    const demand = document.getElementById('new-stop-demand').value || 'Medium';
    const importance = document.getElementById('new-stop-importance').value || 'Transit Station';
    const landmark = document.getElementById('new-stop-landmark').value.trim() || `${name} Junction`;

    if (!name) {
      alert('Please enter a stop name.');
      return;
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const stops = DataStore.getStops();

    if (stops.some(s => s.id === id)) {
      alert('A stop with this name or ID already exists!');
      return;
    }

    // Demand score
    const demandScore = demand === 'High' ? 90 : demand === 'Medium' ? 70 : 45;

    // Random placement near center of canvas
    const canvasX = Math.round(200 + Math.random() * 600);
    const canvasY = Math.round(150 + Math.random() * 350);

    const newStop = {
      id,
      name,
      fullName: `${name} Station`,
      code,
      zone,
      demand,
      demandScore,
      importance,
      connectionsCount: 0,
      canvasX,
      canvasY,
      landmark
    };

    stops.push(newStop);
    DataStore.saveStops(stops);

    e.target.reset();
    this.notifyChange(`New stop "${name}" added successfully!`);
  }

  handleAddRoute(e) {
    e.preventDefault();
    const routeNumber = document.getElementById('new-route-number').value.trim();
    const name = document.getElementById('new-route-name').value.trim();
    const sourceId = document.getElementById('new-route-source').value;
    const destId = document.getElementById('new-route-dest').value;
    const intermediateInput = document.getElementById('new-route-intermediates').value.trim();
    const distanceKm = parseFloat(document.getElementById('new-route-distance').value) || 15;
    const durationMins = parseInt(document.getElementById('new-route-duration').value) || 30;
    const frequency = document.getElementById('new-route-frequency').value.trim() || 'Every 15 mins';
    const busesActive = parseInt(document.getElementById('new-route-buses').value) || 4;
    const operatingCost = parseInt(document.getElementById('new-route-cost').value) || 500;

    if (!routeNumber || !sourceId || !destId) {
      alert('Please provide Route Number, Origin Stop, and Destination Stop.');
      return;
    }

    if (sourceId === destId) {
      alert('Origin and Destination cannot be the same stop.');
      return;
    }

    const routes = DataStore.getRoutes();
    const routeId = `R-${routeNumber}`;

    if (routes.some(r => r.id === routeId)) {
      alert(`Route with ID "${routeId}" already exists!`);
      return;
    }

    const stops = DataStore.getStops();
    const srcStop = stops.find(s => s.id === sourceId);
    const destStop = stops.find(s => s.id === destId);

    const intermediateStops = intermediateInput 
      ? intermediateInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    const allStops = [srcStop.name, ...intermediateStops, destStop.name];

    const newRoute = {
      id: routeId,
      routeNumber,
      name: name || `${srcStop.name} ⇄ ${destStop.name}`,
      sourceId,
      destinationId: destId,
      sourceName: srcStop.name,
      destName: destStop.name,
      intermediateStops,
      allStops,
      distanceKm,
      durationMins,
      frequency,
      busesActive,
      operatingCost,
      status: 'On Schedule',
      fare: Math.max(15, Math.round(distanceKm * 1.8)),
      category: 'General Express'
    };

    routes.push(newRoute);
    DataStore.saveRoutes(routes);

    // Also connect in edges graph
    const edges = DataStore.getEdges();
    edges.push({
      source: sourceId,
      target: destId,
      distance: distanceKm,
      time: durationMins,
      cost: Math.round(operatingCost / 20),
      routeId,
      routeName: routeNumber,
      intermediateStops
    });
    // Add return connection
    edges.push({
      source: destId,
      target: sourceId,
      distance: distanceKm,
      time: durationMins,
      cost: Math.round(operatingCost / 20),
      routeId: `${routeId}R`,
      routeName: `${routeNumber}R`,
      intermediateStops: [...intermediateStops].reverse()
    });
    DataStore.saveEdges(edges);

    e.target.reset();
    this.notifyChange(`Route R-${routeNumber} (${srcStop.name} ⇄ ${destStop.name}) added!`);
  }

  deleteRoute(routeId) {
    if (!confirm(`Are you sure you want to delete route ${routeId}?`)) return;

    let routes = DataStore.getRoutes();
    routes = routes.filter(r => r.id !== routeId);
    DataStore.saveRoutes(routes);

    // Remove corresponding edges
    let edges = DataStore.getEdges();
    edges = edges.filter(e => e.routeId !== routeId && e.routeId !== `${routeId}R`);
    DataStore.saveEdges(edges);

    this.notifyChange(`Route ${routeId} deleted successfully.`);
  }

  deleteStop(stopId) {
    if (!confirm(`Are you sure you want to delete stop "${stopId}"? This will also remove any connected corridor edges.`)) return;

    let stops = DataStore.getStops();
    stops = stops.filter(s => s.id !== stopId);
    DataStore.saveStops(stops);

    let edges = DataStore.getEdges();
    edges = edges.filter(e => e.source !== stopId && e.target !== stopId);
    DataStore.saveEdges(edges);

    let routes = DataStore.getRoutes();
    routes = routes.filter(r => r.sourceId !== stopId && r.destinationId !== stopId);
    DataStore.saveRoutes(routes);

    this.notifyChange(`Stop ${stopId} removed.`);
  }

  updateStopDemand(stopId, newDemand) {
    const stops = DataStore.getStops();
    const stop = stops.find(s => s.id === stopId);
    if (stop) {
      stop.demand = newDemand;
      stop.demandScore = newDemand === 'High' ? 95 : newDemand === 'Medium' ? 70 : 40;
      DataStore.saveStops(stops);
      this.notifyChange(`Demand for ${stop.name} updated to ${newDemand}.`);
    }
  }

  updateRouteFrequency(routeId, newFreq) {
    const routes = DataStore.getRoutes();
    const route = routes.find(r => r.id === routeId);
    if (route) {
      route.frequency = newFreq;
      DataStore.saveRoutes(routes);
      this.notifyChange(`Frequency for ${route.id} updated to "${newFreq}".`);
    }
  }

  updateRouteBuses(routeId, newBuses) {
    const routes = DataStore.getRoutes();
    const route = routes.find(r => r.id === routeId);
    if (route) {
      route.busesActive = parseInt(newBuses) || 1;
      DataStore.saveRoutes(routes);
      this.notifyChange(`Fleet for ${route.id} updated to ${route.busesActive} buses.`);
    }
  }

  handleResetData() {
    if (confirm('Reset all transit stops, routes, and timetables to factory demo defaults?')) {
      DataStore.resetToDefaults();
      this.notifyChange('Network successfully restored to default demo data.');
    }
  }

  handleExportData() {
    const data = {
      stops: DataStore.getStops(),
      routes: DataStore.getRoutes(),
      edges: DataStore.getEdges(),
      timetable: DataStore.getTimetable(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transit_network_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast('Network configuration exported as JSON!', 'info');
  }
}

if (typeof window !== 'undefined') {
  window.AdminManager = AdminManager;
}
