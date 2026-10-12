/**
 * Public Transit Planner - Main Application Controller
 * Coordinates UI tabs, routing, visualizer, timetable, and notifications.
 */

class TransitApp {
  constructor() {
    this.graph = null;
    this.visualizer = null;
    this.dashboard = null;
    this.admin = null;
    this.googleMap = null;
    this.currentPlannedRoute = null;

    this.init();
  }

  init() {
    // 1. Build transit graph from DataStore
    this.graph = DataStore.buildGraph();

    // 2. Initialize UI modules
    this.visualizer = new NetworkVisualizer('transit-canvas');
    this.googleMap = new GoogleTransitMap('google-transit-map');
    this.dashboard = new DashboardManager();
    this.admin = new AdminManager();

    // 3. Load initial datasets into components
    this.refreshAllData();

    // 4. Setup Event Listeners
    this.setupNavigation();
    this.setupPlannerEvents();
    this.setupDirectoryFilters();
    this.setupToastSystem();

    // 5. Data synchronization listener
    window.addEventListener('transit-data-changed', (e) => {
      this.refreshAllData();
      if (this.currentPlannedRoute) {
        this.executeRoutePlanning();
      }
    });

    // 6. Global node selected callback from canvas
    window.onTransitNodeSelected = (stop) => {
      this.handleCanvasNodeClick(stop);
    };

    // 7. Initial default planned route (Patancheru -> Bachupally)
    setTimeout(() => {
      const srcSelect = document.getElementById('planner-source');
      const dstSelect = document.getElementById('planner-dest');
      if (srcSelect && dstSelect) {
        srcSelect.value = 'patancheru';
        dstSelect.value = 'bachupally';
        this.executeRoutePlanning();
      }
      this.dashboard.refresh();
    }, 150);
  }

  refreshAllData() {
    this.graph = DataStore.buildGraph();
    const stops = DataStore.getStops();
    const routes = DataStore.getRoutes();
    const edges = DataStore.getEdges();
    const timetable = DataStore.getTimetable();

    // Populate dropdowns
    this.populateStopDropdowns(stops);

    // Update Canvas & Google Maps
    if (this.visualizer) {
      this.visualizer.setData(stops, edges);
    }
    if (this.googleMap) {
      this.googleMap.setData(stops, edges);
    }

    // Render tables and cards
    this.renderRoutesList(routes);
    this.renderStopsGrid(stops);
    this.renderTimetable(timetable);

    // Update Dashboard KPIs & Charts
    if (this.dashboard) {
      this.dashboard.refresh();
    }
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    const tabPanels = document.querySelectorAll('.tab-panel');

    const switchTab = (tabId) => {
      navLinks.forEach(link => {
        if (link.dataset.tab === tabId) link.classList.add('active');
        else link.classList.remove('active');
      });

      tabPanels.forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
          panel.classList.add('active');
          panel.classList.remove('hidden');
        } else {
          panel.classList.remove('active');
          panel.classList.add('hidden');
        }
      });

      // If switching to canvas or dashboard, re-render/resize
      if (tabId === 'plan' || tabId === 'home') {
        setTimeout(() => {
          if (this.visualizer) {
            this.visualizer.resize();
            this.visualizer.fitBounds();
          }
          if (this.googleMap) {
            this.googleMap.resize();
          }
        }, 80);
      }
      if (tabId === 'dashboard') {
        setTimeout(() => this.dashboard.refresh(), 80);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = link.dataset.tab;
        switchTab(tabId);
      });
    });

    // Mobile nav toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('main-nav-links');
    if (menuBtn && navMenu) {
      menuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });
      navLinks.forEach(l => l.addEventListener('click', () => navMenu.classList.remove('open')));
    }

    // Quick action buttons with data-switch-tab
    document.querySelectorAll('[data-switch-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(btn.dataset.switchTab);
      });
    });

    window.switchAppTab = switchTab;
  }

  populateStopDropdowns(stops) {
    const dropdownIds = [
      'planner-source', 'planner-dest',
      'hero-source', 'hero-dest',
      'new-route-source', 'new-route-dest'
    ];

    dropdownIds.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;
      const currentVal = select.value;
      select.innerHTML = '';

      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = id.includes('source') ? 'Select Starting Stop' : 'Select Destination Stop';
      defaultOpt.disabled = true;
      select.appendChild(defaultOpt);

      stops.forEach(stop => {
        const opt = document.createElement('option');
        opt.value = stop.id;
        opt.textContent = `${stop.name} (${stop.code}) - ${stop.zone}`;
        select.appendChild(opt);
      });

      if (currentVal && stops.some(s => s.id === currentVal)) {
        select.value = currentVal;
      }
    });

    // Set smart defaults if empty
    const heroSrc = document.getElementById('hero-source');
    const heroDst = document.getElementById('hero-dest');
    if (heroSrc && !heroSrc.value) heroSrc.value = 'patancheru';
    if (heroDst && !heroDst.value) heroDst.value = 'bachupally';
  }

  setupPlannerEvents() {
    const planBtn = document.getElementById('btn-execute-plan');
    if (planBtn) {
      planBtn.addEventListener('click', () => this.executeRoutePlanning());
    }

    const swapBtn = document.getElementById('btn-swap-stops');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => {
        const src = document.getElementById('planner-source');
        const dst = document.getElementById('planner-dest');
        if (src && dst) {
          const temp = src.value;
          src.value = dst.value;
          dst.value = temp;
          this.executeRoutePlanning();
        }
      });
    }

    // Hero Quick Planner Form
    const heroPlanBtn = document.getElementById('btn-hero-plan');
    if (heroPlanBtn) {
      heroPlanBtn.addEventListener('click', () => {
        const heroSrc = document.getElementById('hero-source').value;
        const heroDst = document.getElementById('hero-dest').value;

        if (!heroSrc || !heroDst) {
          alert('Please select both starting location and destination.');
          return;
        }

        const planSrc = document.getElementById('planner-source');
        const planDst = document.getElementById('planner-dest');
        if (planSrc && planDst) {
          planSrc.value = heroSrc;
          planDst.value = heroDst;
        }

        window.switchAppTab('plan');
        this.executeRoutePlanning();
      });
    }

    // Popular Route Quick Cards
    document.querySelectorAll('.popular-route-card').forEach(card => {
      card.addEventListener('click', () => {
        const src = card.dataset.source;
        const dst = card.dataset.dest;
        if (src && dst) {
          const planSrc = document.getElementById('planner-source');
          const planDst = document.getElementById('planner-dest');
          if (planSrc && planDst) {
            planSrc.value = src;
            planDst.value = dst;
          }
          window.switchAppTab('plan');
          this.executeRoutePlanning();
        }
      });
    });

    // Map View Mode Toggle: Google Maps vs Schematic Graph
    const btnModeGmaps = document.getElementById('btn-mode-google-maps');
    const btnModeSchematic = document.getElementById('btn-mode-schematic');
    const gmapsContainer = document.getElementById('google-transit-map');
    const schematicContainer = document.getElementById('schematic-canvas-container');

    if (btnModeGmaps && btnModeSchematic && gmapsContainer && schematicContainer) {
      btnModeGmaps.addEventListener('click', () => {
        btnModeGmaps.classList.add('active');
        btnModeSchematic.classList.remove('active');
        gmapsContainer.classList.remove('hidden');
        schematicContainer.classList.add('hidden');
        if (this.googleMap) this.googleMap.resize();
      });

      btnModeSchematic.addEventListener('click', () => {
        btnModeSchematic.classList.add('active');
        btnModeGmaps.classList.remove('active');
        schematicContainer.classList.remove('hidden');
        gmapsContainer.classList.add('hidden');
        if (this.visualizer) {
          this.visualizer.resize();
          this.visualizer.fitBounds();
        }
      });
    }

    // Toggle Satellite vs Street Roadmap Layer
    const btnToggleLayer = document.getElementById('btn-toggle-map-layer');
    const layerText = document.getElementById('layer-mode-text');
    if (btnToggleLayer) {
      btnToggleLayer.addEventListener('click', () => {
        if (!this.googleMap) return;
        if (this.googleMap.currentLayerType === 'roadmap') {
          this.googleMap.toggleLayer('satellite');
          if (layerText) layerText.textContent = 'Roadmap';
        } else {
          this.googleMap.toggleLayer('roadmap');
          if (layerText) layerText.textContent = 'Satellite';
        }
      });
    }

    // Fit Route Bounds button
    const btnMapFit = document.getElementById('btn-map-fit');
    if (btnMapFit) {
      btnMapFit.addEventListener('click', () => {
        if (this.googleMap) this.googleMap.fitBounds();
        if (this.visualizer) this.visualizer.fitBounds();
      });
    }

    // Criteria radio buttons (Time, Distance, Transfers, Cost)
    document.querySelectorAll('input[name="route-criterion"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (this.currentPlannedRoute) {
          this.executeRoutePlanning();
        }
      });
    });
  }

  executeRoutePlanning() {
    const srcId = document.getElementById('planner-source').value;
    const dstId = document.getElementById('planner-dest').value;
    const criterionRadio = document.querySelector('input[name="route-criterion"]:checked');
    const criterion = criterionRadio ? criterionRadio.value : 'time';

    if (!srcId || !dstId) {
      window.showToast('Please select both Origin and Destination stops.', 'warning');
      return;
    }

    if (srcId === dstId) {
      window.showToast('Origin and Destination stops are identical!', 'warning');
      return;
    }

    // Call Routing engine
    const result = DijkstraRouter.findRoute(this.graph, srcId, dstId, criterion);
    this.currentPlannedRoute = result;

    if (!result.found) {
      this.displayRouteError(result.error);
      this.visualizer.clearActiveRoute();
      return;
    }

    // Match with predefined direct route if exists to display official bus code
    const routes = DataStore.getRoutes();
    const directMatch = routes.find(r => r.sourceId === srcId && r.destinationId === dstId);
    if (directMatch) {
      result.suggestedBusRoute = directMatch.routeNumber;
      result.suggestedBusName = directMatch.name;
      result.frequency = directMatch.frequency;
      result.status = directMatch.status;
      result.fare = directMatch.fare;
      result.operatingCost = directMatch.operatingCost;
    } else {
      result.suggestedBusRoute = result.suggestedRoutes.join(' / ') || 'Network Express';
      result.suggestedBusName = 'Multi-Hop Transit Route';
      result.frequency = 'Every 12-15 mins';
      result.status = 'On Schedule';
      result.fare = Math.max(15, Math.round(result.totalDistance * 1.8));
      result.operatingCost = Math.round(result.totalDistance * 32);
    }

    // Update UI components
    this.renderRouteSummary(result);
    this.renderRouteTimeline(result);
    this.visualizer.setActiveRoute(result);
    this.visualizer.fitBounds();
    if (this.googleMap) {
      this.googleMap.setActiveRoute(result);
    }

    window.showToast(`Optimal route found: ${result.totalStopsCount} stops, ${result.totalTime} mins`, 'success');
  }

  renderRouteSummary(res) {
    const container = document.getElementById('route-summary-panel');
    if (!container) return;

    container.classList.remove('hidden');

    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setText('res-origin-name', res.source.name);
    setText('res-dest-name', res.destination.name);
    setText('res-total-time', `${res.totalTime} mins`);
    setText('res-total-dist', `${res.totalDistance} km`);
    setText('res-total-stops', res.totalStopsCount);
    setText('res-transfers', res.transfers === 0 ? 'Direct (0 Transfers)' : `${res.transfers} Transfer(s)`);
    setText('res-suggested-bus', `Route ${res.suggestedBusRoute}`);
    setText('res-fare', `₹${res.fare}`);
    setText('res-operating-cost', `₹${res.operatingCost}`);
    setText('res-status', res.status);
    setText('res-dsa-stats', `Optimal route verified (${res.executionTimeMs}ms) • ${res.totalStopsCount} stops, ${res.totalDistance} km`);

    const statusBadge = document.getElementById('res-status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-badge ' + (res.status === 'On Schedule' ? 'status-green' : 'status-blue');
    }
  }

  renderRouteTimeline(res) {
    const timeline = document.getElementById('route-timeline-container');
    if (!timeline) return;

    timeline.innerHTML = '';

    const intermediateCountEl = document.getElementById('res-intermediate-count');
    if (intermediateCountEl) {
      intermediateCountEl.textContent = `${res.intermediateCount} intermediate stop(s)`;
    }

    res.fullSequence.forEach((stop, index) => {
      const isOrigin = (index === 0);
      const isDestination = (index === res.fullSequence.length - 1);
      const isIntermediate = !isOrigin && !isDestination;

      const item = document.createElement('div');
      item.className = `timeline-item ${isOrigin ? 'item-origin' : ''} ${isDestination ? 'item-destination' : ''} ${isIntermediate ? 'item-intermediate' : ''}`;

      let badgeClass = 'tag-local';
      if (isOrigin) badgeClass = 'tag-origin';
      else if (isDestination) badgeClass = 'tag-dest';
      else if (stop.demand === 'High') badgeClass = 'tag-high';
      else badgeClass = 'tag-transit';

      const typeLabel = isOrigin ? 'ORIGIN' : isDestination ? 'DESTINATION' : `Intermediate Stop #${index}`;

      item.innerHTML = `
        <div class="timeline-indicator">
          <div class="timeline-marker">
            ${isOrigin ? '<i class="fa-solid fa-play"></i>' : isDestination ? '<i class="fa-solid fa-flag-checkered"></i>' : '<span class="stop-dot"></span>'}
          </div>
          ${!isDestination ? '<div class="timeline-line"></div>' : ''}
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <div class="stop-identity">
              <span class="stop-name">${stop.name}</span>
              <span class="stop-type-tag ${badgeClass}">${typeLabel}</span>
              ${stop.code ? `<span class="stop-code-tag">${stop.code}</span>` : ''}
            </div>
            <div class="stop-timing">
              <span class="timing-mins">${index === 0 ? 'Depart' : `+${stop.cumulativeTime} mins`}</span>
              <span class="timing-dist">${index === 0 ? '0 km' : `${stop.cumulativeDistance} km`}</span>
            </div>
          </div>
          <div class="timeline-meta">
            <span><i class="fa-solid fa-location-dot"></i> ${stop.landmark || stop.zone || 'Transit Corridor'}</span>
            ${stop.demand ? `<span><i class="fa-solid fa-users"></i> Demand: <strong>${stop.demand}</strong></span>` : ''}
            ${stop.importance ? `<span><i class="fa-solid fa-layer-group"></i> ${stop.importance}</span>` : ''}
          </div>
        </div>
      `;

      timeline.appendChild(item);
    });
  }

  displayRouteError(errorMsg) {
    const container = document.getElementById('route-summary-panel');
    const timeline = document.getElementById('route-timeline-container');
    if (container && timeline) {
      container.classList.remove('hidden');
      timeline.innerHTML = `
        <div class="empty-state-card error-card">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h4>Route Not Available</h4>
          <p>${errorMsg}</p>
        </div>
      `;
    }
  }

  handleCanvasNodeClick(stop) {
    const srcSelect = document.getElementById('planner-source');
    const dstSelect = document.getElementById('planner-dest');

    if (!srcSelect.value) {
      srcSelect.value = stop.id;
      window.showToast(`Selected ${stop.name} as Origin`, 'info');
    } else if (!dstSelect.value && srcSelect.value !== stop.id) {
      dstSelect.value = stop.id;
      window.showToast(`Selected ${stop.name} as Destination`, 'info');
      this.executeRoutePlanning();
    } else {
      window.showToast(`Stop: ${stop.name} (${stop.demand} demand, ${stop.importance})`, 'info');
    }
  }

  renderRoutesList(routes) {
    const gridContainer = document.getElementById('routes-grid-container');
    const tableBody = document.getElementById('routes-table-body');
    if (!gridContainer || !tableBody) return;

    gridContainer.innerHTML = '';
    tableBody.innerHTML = '';

    routes.forEach(r => {
      // Grid Card
      const card = document.createElement('div');
      card.className = 'route-card';
      const intermediateTags = (r.intermediateStops && r.intermediateStops.length > 0)
        ? r.intermediateStops.map(s => `<span class="tag-stop-pill">${s}</span>`).join('')
        : '<span class="tag-stop-pill text-muted">Direct Express (No intermediate)</span>';

      card.innerHTML = `
        <div class="route-card-header">
          <div class="route-number-badge">Route ${r.routeNumber}</div>
          <span class="status-badge ${r.status === 'On Schedule' ? 'status-green' : 'status-blue'}">${r.status}</span>
        </div>
        <h3 class="route-title">${r.name}</h3>
        <div class="route-terminals">
          <div class="terminal-node">
            <i class="fa-solid fa-circle-dot text-primary"></i>
            <span>${r.sourceName}</span>
          </div>
          <i class="fa-solid fa-arrow-right text-muted"></i>
          <div class="terminal-node">
            <i class="fa-solid fa-location-dot text-success"></i>
            <span>${r.destName}</span>
          </div>
        </div>
        <div class="route-intermediates-box">
          <div class="box-label"><i class="fa-solid fa-route"></i> Intermediate Stops:</div>
          <div class="intermediate-tags">${intermediateTags}</div>
        </div>
        <div class="route-stats-row">
          <div class="stat-col"><i class="fa-solid fa-road"></i> <strong>${r.distanceKm} km</strong></div>
          <div class="stat-col"><i class="fa-regular fa-clock"></i> <strong>${r.durationMins} mins</strong></div>
          <div class="stat-col"><i class="fa-solid fa-bus"></i> <strong>${r.frequency}</strong></div>
        </div>
        <div class="route-card-footer">
          <button class="btn btn-outline btn-sm btn-plan-this-route" data-source="${r.sourceId}" data-dest="${r.destinationId}">
            <i class="fa-solid fa-diamond-turn-right"></i> Plan This Route
          </button>
          <button class="btn btn-ghost btn-sm text-danger btn-delete-route" data-route-id="${r.id}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      `;
      gridContainer.appendChild(card);

      // Table Row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>R-${r.routeNumber}</strong></td>
        <td><span class="fw-semibold">${r.sourceName}</span></td>
        <td><span class="fw-semibold">${r.destName}</span></td>
        <td>
          <div class="table-intermediates">
            ${r.intermediateStops.map(s => `<span class="badge-mini">${s}</span>`).join(' → ') || 'Direct'}
          </div>
        </td>
        <td>${r.distanceKm} km</td>
        <td>${r.durationMins} mins</td>
        <td>${r.frequency}</td>
        <td><span class="status-pill ${r.status === 'On Schedule' ? 'pill-green' : 'pill-blue'}">${r.status}</span></td>
        <td>
          <button class="btn btn-icon btn-sm btn-plan-this-route" data-source="${r.sourceId}" data-dest="${r.destinationId}" title="Plan route">
            <i class="fa-solid fa-diamond-turn-right"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Attach click listeners for "Plan This Route"
    document.querySelectorAll('.btn-plan-this-route').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = btn.dataset.source;
        const dst = btn.dataset.dest;
        const planSrc = document.getElementById('planner-source');
        const planDst = document.getElementById('planner-dest');
        if (planSrc && planDst) {
          planSrc.value = src;
          planDst.value = dst;
          window.switchAppTab('plan');
          this.executeRoutePlanning();
        }
      });
    });

    // Attach delete route listeners
    document.querySelectorAll('.btn-delete-route').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.admin.deleteRoute(btn.dataset.routeId);
      });
    });
  }

  renderStopsGrid(stops) {
    const container = document.getElementById('stops-grid-container');
    if (!container) return;

    container.innerHTML = '';

    stops.forEach(s => {
      const card = document.createElement('div');
      card.className = 'stop-card';

      let demandColorClass = 'demand-high';
      if (s.demand === 'Medium') demandColorClass = 'demand-med';
      if (s.demand === 'Low') demandColorClass = 'demand-low';

      card.innerHTML = `
        <div class="stop-card-top">
          <span class="stop-code-badge">${s.code}</span>
          <span class="demand-pill ${demandColorClass}">
            <i class="fa-solid fa-fire-flame-curved"></i> ${s.demand} Demand (${s.demandScore || 80}%)
          </span>
        </div>
        <h3 class="stop-card-title">${s.name}</h3>
        <p class="stop-card-subtitle">${s.fullName}</p>
        <div class="stop-info-list">
          <div><i class="fa-solid fa-location-dot"></i> ${s.landmark || s.zone}</div>
          <div><i class="fa-solid fa-layer-group"></i> ${s.importance}</div>
          <div><i class="fa-solid fa-circle-nodes"></i> Graph Connections: <strong>${this.graph.getNeighbors(s.id).length} edges</strong></div>
        </div>
        <div class="stop-card-actions">
          <button class="btn btn-sm btn-primary-subtle btn-set-origin" data-stop-id="${s.id}">
            <i class="fa-solid fa-location-crosshairs"></i> Set Origin
          </button>
          <button class="btn btn-sm btn-outline btn-set-dest" data-stop-id="${s.id}">
            <i class="fa-solid fa-flag-checkered"></i> Set Destination
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    // Set Origin / Destination handlers
    document.querySelectorAll('.btn-set-origin').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.stopId;
        const sel = document.getElementById('planner-source');
        if (sel) {
          sel.value = id;
          window.showToast(`Set Origin: ${id}`, 'info');
          window.switchAppTab('plan');
        }
      });
    });

    document.querySelectorAll('.btn-set-dest').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.stopId;
        const sel = document.getElementById('planner-dest');
        if (sel) {
          sel.value = id;
          window.showToast(`Set Destination: ${id}`, 'info');
          window.switchAppTab('plan');
          this.executeRoutePlanning();
        }
      });
    });
  }

  renderTimetable(timetable) {
    const tbody = document.getElementById('timetable-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    timetable.forEach(t => {
      const row = document.createElement('tr');
      const seatPct = Math.round((t.availableSeats / t.totalSeats) * 100);
      const seatColor = seatPct > 40 ? '#10b981' : seatPct > 15 ? '#f59e0b' : '#ef4444';

      row.innerHTML = `
        <td><span class="route-pill">R-${t.routeNumber}</span></td>
        <td><strong class="font-mono">${t.busNumber}</strong></td>
        <td><span class="fw-semibold">${t.departureTime}</span></td>
        <td><span class="text-muted">${t.arrivalTime}</span></td>
        <td>${t.frequency}</td>
        <td>
          <div class="seats-progress-wrapper">
            <div class="seats-info">
              <span><strong>${t.availableSeats}</strong> / ${t.totalSeats} seats</span>
              <span class="text-muted">${seatPct}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${seatPct}%; background-color: ${seatColor};"></div>
            </div>
          </div>
        </td>
        <td><span class="status-pill pill-${t.status.includes('Delay') ? 'amber' : t.status === 'Boarding' ? 'blue' : 'green'}">${t.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  setupDirectoryFilters() {
    const routeSearch = document.getElementById('input-search-routes');
    if (routeSearch) {
      routeSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const routes = DataStore.getRoutes();
        const filtered = routes.filter(r => 
          r.name.toLowerCase().includes(q) ||
          r.routeNumber.toLowerCase().includes(q) ||
          r.sourceName.toLowerCase().includes(q) ||
          r.destName.toLowerCase().includes(q) ||
          (r.intermediateStops && r.intermediateStops.some(s => s.toLowerCase().includes(q)))
        );
        this.renderRoutesList(filtered);
      });
    }

    const stopSearch = document.getElementById('input-search-stops');
    if (stopSearch) {
      stopSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const stops = DataStore.getStops();
        const filtered = stops.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q)
        );
        this.renderStopsGrid(filtered);
      });
    }

    const ttSearch = document.getElementById('input-search-timetable');
    const ttFilter = document.getElementById('select-timetable-status');
    const applyTtFilter = () => {
      const q = ttSearch ? ttSearch.value.toLowerCase() : '';
      const status = ttFilter ? ttFilter.value : 'all';
      const timetable = DataStore.getTimetable();

      const filtered = timetable.filter(t => {
        const matchesQ = t.routeNumber.toLowerCase().includes(q) ||
                         t.busNumber.toLowerCase().includes(q) ||
                         t.routeName.toLowerCase().includes(q);
        const matchesStatus = (status === 'all') || (status === t.status);
        return matchesQ && matchesStatus;
      });
      this.renderTimetable(filtered);
    };

    if (ttSearch) ttSearch.addEventListener('input', applyTtFilter);
    if (ttFilter) ttFilter.addEventListener('change', applyTtFilter);

    const btnCardView = document.getElementById('btn-routes-card-view');
    const btnTableView = document.getElementById('btn-routes-table-view');
    const cardsSection = document.getElementById('routes-grid-container');
    const tableSection = document.getElementById('routes-table-container');

    if (btnCardView && btnTableView && cardsSection && tableSection) {
      btnCardView.addEventListener('click', () => {
        btnCardView.classList.add('active');
        btnTableView.classList.remove('active');
        cardsSection.classList.remove('hidden');
        tableSection.classList.add('hidden');
      });
      btnTableView.addEventListener('click', () => {
        btnTableView.classList.add('active');
        btnCardView.classList.remove('active');
        cardsSection.classList.add('hidden');
        tableSection.classList.remove('hidden');
      });
    }
  }

  setupToastSystem() {
    window.showToast = (message, type = 'info') => {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast-message toast-${type}`;
      let icon = 'fa-info-circle';
      if (type === 'success') icon = 'fa-check-circle';
      if (type === 'warning') icon = 'fa-triangle-exclamation';
      if (type === 'error') icon = 'fa-circle-xmark';

      toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
      `;
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('toast-fade');
        setTimeout(() => toast.remove(), 400);
      }, 3500);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.transitApp = new TransitApp();
});
