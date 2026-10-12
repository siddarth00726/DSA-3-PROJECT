/**
 * Public Transit Planner - Google Maps & Leaflet GIS Integration
 * Renders real geographic road maps using Google Maps tile layers,
 * custom transit stop pins, polyline routes, and external Google Maps links.
 */

class GoogleTransitMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.roadmapLayer = null;
    this.satelliteLayer = null;
    this.currentLayerType = 'roadmap'; // 'roadmap' | 'satellite'

    this.allMarkers = new Map(); // stopId -> L.Marker
    this.edgePolylines = [];
    this.activeRoutePolyline = null;
    this.activeRouteHalo = null;
    this.stops = [];
    this.edges = [];
    this.activeRoute = null;

    this.initMap();
  }

  initMap() {
    if (typeof L === 'undefined') {
      console.warn('Leaflet library not yet loaded.');
      return;
    }

    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Center near Patancheru - Miyapur - Bachupally corridor
    this.map = L.map(this.containerId, {
      center: [17.5120, 78.3400],
      zoom: 12,
      zoomControl: true,
      attributionControl: true
    });

    // Google Maps Roadmap Layer
    this.roadmapLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://maps.google.com" target="_blank">Google Maps</a>'
    });

    // Google Maps Satellite / Hybrid Layer
    this.satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://maps.google.com" target="_blank">Google Maps</a>'
    });

    // Default to Google Maps Roadmap
    this.roadmapLayer.addTo(this.map);
  }

  toggleLayer(type) {
    if (!this.map) return;
    if (type === 'satellite' && this.currentLayerType !== 'satellite') {
      this.map.removeLayer(this.roadmapLayer);
      this.satelliteLayer.addTo(this.map);
      this.currentLayerType = 'satellite';
    } else if (type === 'roadmap' && this.currentLayerType !== 'roadmap') {
      this.map.removeLayer(this.satelliteLayer);
      this.roadmapLayer.addTo(this.map);
      this.currentLayerType = 'roadmap';
    }
  }

  setData(stops, edges) {
    this.stops = stops;
    this.edges = edges;
    if (!this.map) return;

    // Clear previous elements
    this.clearAll();

    const stopMap = new Map();
    stops.forEach(s => stopMap.set(s.id, s));

    // 1. Draw subtle base road corridors between connected stops
    edges.forEach(edge => {
      const u = stopMap.get(edge.source);
      const v = stopMap.get(edge.target);
      if (u && v && u.lat && u.lng && v.lat && v.lng) {
        const poly = L.polyline([[u.lat, u.lng], [v.lat, v.lng]], {
          color: '#94a3b8',
          weight: 2.5,
          opacity: 0.6,
          dashArray: '4, 4'
        }).addTo(this.map);
        this.edgePolylines.push(poly);
      }
    });

    // 2. Add Stop Markers
    stops.forEach(stop => {
      if (!stop.lat || !stop.lng) return;

      const markerIcon = this.createMarkerIcon(stop, false);
      const marker = L.marker([stop.lat, stop.lng], { icon: markerIcon }).addTo(this.map);

      // Popup with Google Maps styling
      marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.4;">
          <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 2px;">
            ${stop.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ${stop.fullName || stop.name} • <code>${stop.code || ''}</code>
          </div>
          <div style="font-size: 11px; color: #334155;">
            <strong>Landmark:</strong> ${stop.landmark || 'Transit Hub'}<br>
            <strong>Demand:</strong> <span style="font-weight: 700; color: ${stop.demand === 'High' ? '#ef4444' : stop.demand === 'Medium' ? '#f59e0b' : '#10b981'}">${stop.demand}</span><br>
            <strong>Importance:</strong> ${stop.importance || 'Transit Station'}
          </div>
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            <a href="https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}" target="_blank" 
               style="display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 600;">
              View on Google Maps &rarr;
            </a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (window.onTransitNodeSelected) {
          window.onTransitNodeSelected(stop);
        }
      });

      this.allMarkers.set(stop.id, marker);
    });
  }

  createMarkerIcon(stop, isHighlighted, role = null, seqNumber = null) {
    let bgColor = '#3b82f6';
    let iconHtml = '<i class="fa-solid fa-bus" style="color: white; font-size: 10px;"></i>';
    let size = 26;

    if (stop.demand === 'High') bgColor = '#ef4444';
    else if (stop.demand === 'Medium') bgColor = '#f59e0b';
    else if (stop.demand === 'Low') bgColor = '#10b981';

    if (role === 'origin') {
      bgColor = '#1d4ed8';
      iconHtml = '<i class="fa-solid fa-play" style="color: white; font-size: 10px;"></i>';
      size = 32;
    } else if (role === 'dest') {
      bgColor = '#059669';
      iconHtml = '<i class="fa-solid fa-flag-checkered" style="color: white; font-size: 12px;"></i>';
      size = 32;
    } else if (role === 'intermediate') {
      bgColor = '#0284c7';
      iconHtml = `<span style="color: white; font-size: 11px; font-weight: 800;">${seqNumber || ''}</span>`;
      size = 28;
    }

    return L.divIcon({
      className: 'custom-google-stop-pin',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${bgColor};
          border: 2px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          transform: translate(-50%, -50%);
          cursor: pointer;
          ${isHighlighted ? 'box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4);' : ''}
        ">
          ${iconHtml}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [0, 0]
    });
  }

  setActiveRoute(routeResult) {
    this.activeRoute = routeResult;
    if (!this.map || !routeResult || !routeResult.fullSequence) return;

    // Remove old route polylines
    if (this.activeRoutePolyline) {
      this.map.removeLayer(this.activeRoutePolyline);
      this.activeRoutePolyline = null;
    }
    if (this.activeRouteHalo) {
      this.map.removeLayer(this.activeRouteHalo);
      this.activeRouteHalo = null;
    }

    // Reset all markers to normal
    this.stops.forEach(s => {
      const m = this.allMarkers.get(s.id);
      if (m) m.setIcon(this.createMarkerIcon(s, false));
    });

    const latlngs = [];
    const pathStops = routeResult.fullSequence;

    pathStops.forEach((stop, idx) => {
      if (stop.lat && stop.lng) {
        latlngs.push([stop.lat, stop.lng]);

        // Role-based custom icon
        const isOrigin = (idx === 0);
        const isDest = (idx === pathStops.length - 1);
        const role = isOrigin ? 'origin' : isDest ? 'dest' : 'intermediate';

        const marker = this.allMarkers.get(stop.id);
        if (marker) {
          marker.setIcon(this.createMarkerIcon(stop, true, role, idx + 1));
          marker.setZIndexOffset(1000 + idx);
        }
      }
    });

    if (latlngs.length > 1) {
      // Glowing outer halo
      this.activeRouteHalo = L.polyline(latlngs, {
        color: '#10b981',
        weight: 12,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);

      // Vivid Google transit blue/green polyline
      this.activeRoutePolyline = L.polyline(latlngs, {
        color: '#1d4ed8',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);

      // Fit map bounds smoothly to planned journey
      const bounds = L.latLngBounds(latlngs);
      this.map.fitBounds(bounds, { padding: [55, 55], maxZoom: 14 });
    }

    // Update external Google Maps Directions links
    this.updateGoogleMapsLinks(routeResult);
  }

  updateGoogleMapsLinks(routeResult) {
    if (!routeResult || !routeResult.source || !routeResult.destination) return;

    const origin = routeResult.source;
    const dest = routeResult.destination;
    
    // Intermediate waypoints string
    const intermediates = routeResult.intermediateStops || [];
    const waypointsParam = intermediates
      .filter(s => s.lat && s.lng)
      .map(s => `${s.lat},${s.lng}`)
      .join('|');

    let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=transit`;
    if (waypointsParam) {
      gmapsUrl += `&waypoints=${encodeURIComponent(waypointsParam)}`;
    }

    // Update buttons in UI
    const btnApp = document.getElementById('btn-open-google-maps');
    if (btnApp) {
      btnApp.href = gmapsUrl;
      btnApp.title = `Open ${origin.name} → ${dest.name} in Google Maps`;
    }

    const btnSummary = document.getElementById('btn-open-google-maps-summary');
    if (btnSummary) {
      btnSummary.href = gmapsUrl;
    }
  }

  fitBounds() {
    if (!this.map) return;
    if (this.activeRoutePolyline) {
      this.map.fitBounds(this.activeRoutePolyline.getBounds(), { padding: [50, 50] });
    } else if (this.stops.length > 0) {
      const latlngs = this.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
      if (latlngs.length > 0) {
        this.map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      }
    }
  }

  resize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
    }
  }

  clearAll() {
    this.edgePolylines.forEach(p => this.map.removeLayer(p));
    this.edgePolylines = [];
    this.allMarkers.forEach(m => this.map.removeLayer(m));
    this.allMarkers.clear();
    if (this.activeRoutePolyline) {
      this.map.removeLayer(this.activeRoutePolyline);
      this.activeRoutePolyline = null;
    }
    if (this.activeRouteHalo) {
      this.map.removeLayer(this.activeRouteHalo);
      this.activeRouteHalo = null;
    }
  }
}

if (typeof window !== 'undefined') {
  window.GoogleTransitMap = GoogleTransitMap;
}
