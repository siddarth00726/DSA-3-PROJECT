/**
 * Public Transit Planner - Interactive Canvas Network Visualizer
 * High-performance HTML5 Canvas renderer with Pan, Zoom, Drag, and Route Path Highlighting.
 */

class NetworkVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.stops = [];
    this.edges = [];
    this.activeRoute = null; // Result from DijkstraRouter.findRoute()
    this.activePathStopIds = new Set();
    this.activePathEdgeKeys = new Set();

    // Transform State
    this.scale = 1;
    this.offsetX = 40;
    this.offsetY = 40;
    this.isDragging = false;
    this.draggedNode = null;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // Animation loop state
    this.animFrame = null;
    this.pulseOffset = 0;
    this.hoveredNode = null;

    this.initEvents();
    this.resize();
  }

  setData(stops, edges) {
    // Preserve any existing dragged positions if stop IDs match
    const existingPos = new Map();
    this.stops.forEach(s => existingPos.set(s.id, { x: s.canvasX, y: s.canvasY }));

    this.stops = stops.map(s => {
      const pos = existingPos.get(s.id);
      return {
        ...s,
        canvasX: pos ? pos.x : (s.canvasX || Math.random() * 800 + 50),
        canvasY: pos ? pos.y : (s.canvasY || Math.random() * 500 + 50)
      };
    });
    this.edges = edges;
    this.render();
  }

  setActiveRoute(routeResult) {
    this.activeRoute = routeResult;
    this.activePathStopIds.clear();
    this.activePathEdgeKeys.clear();

    if (routeResult && routeResult.pathStopIds) {
      routeResult.pathStopIds.forEach(id => this.activePathStopIds.add(id));
      for (let i = 0; i < routeResult.pathStopIds.length - 1; i++) {
        const u = routeResult.pathStopIds[i];
        const v = routeResult.pathStopIds[i + 1];
        this.activePathEdgeKeys.add(`${u}->${v}`);
        this.activePathEdgeKeys.add(`${v}->${u}`);
      }
    }
    this.render();
  }

  clearActiveRoute() {
    this.activeRoute = null;
    this.activePathStopIds.clear();
    this.activePathEdgeKeys.clear();
    this.render();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    // Mouse Interactions
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

    // Touch Support for Mobile & Tablets
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.handleMouseUp());

    // Start animated pulse loop
    this.startAnimationLoop();
  }

  startAnimationLoop() {
    const loop = () => {
      this.pulseOffset = (this.pulseOffset + 0.35) % 30;
      if (this.activeRoute) {
        this.render();
      }
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    const worldX = (screenX - this.offsetX) / this.scale;
    const worldY = (screenY - this.offsetY) / this.scale;
    return { screenX, screenY, worldX, worldY };
  }

  findNodeAt(worldX, worldY) {
    for (let i = this.stops.length - 1; i >= 0; i--) {
      const stop = this.stops[i];
      const radius = this.getNodeRadius(stop) + 8;
      const dx = worldX - stop.canvasX;
      const dy = worldY - stop.canvasY;
      if (dx * dx + dy * dy <= radius * radius) {
        return stop;
      }
    }
    return null;
  }

  getNodeRadius(stop) {
    if (stop.importance?.includes('Terminal') || stop.importance?.includes('Central')) return 16;
    if (stop.importance?.includes('Hub') || stop.importance?.includes('Junction')) return 13;
    return 10;
  }

  handleMouseDown(e) {
    const { screenX, screenY, worldX, worldY } = this.getCanvasCoords(e);
    const hitNode = this.findNodeAt(worldX, worldY);

    if (hitNode) {
      this.draggedNode = hitNode;
      this.dragStartX = worldX - hitNode.canvasX;
      this.dragStartY = worldY - hitNode.canvasY;
    } else {
      this.isDragging = true;
      this.lastMouseX = screenX;
      this.lastMouseY = screenY;
    }
  }

  handleMouseMove(e) {
    const { screenX, screenY, worldX, worldY } = this.getCanvasCoords(e);

    if (this.draggedNode) {
      this.draggedNode.canvasX = Math.round(worldX - this.dragStartX);
      this.draggedNode.canvasY = Math.round(worldY - this.dragStartY);
      this.render();
      return;
    }

    if (this.isDragging) {
      const dx = screenX - this.lastMouseX;
      const dy = screenY - this.lastMouseY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastMouseX = screenX;
      this.lastMouseY = screenY;
      this.render();
      return;
    }

    // Hover state detection
    const hover = this.findNodeAt(worldX, worldY);
    if (hover !== this.hoveredNode) {
      this.hoveredNode = hover;
      this.canvas.style.cursor = hover ? 'pointer' : 'grab';
      this.render();
    }
  }

  handleMouseUp(e) {
    if (this.draggedNode) {
      // If was short click without drag, trigger select stop
      const node = this.draggedNode;
      this.draggedNode = null;
      if (window.onTransitNodeSelected) {
        window.onTransitNodeSelected(node);
      }
    }
    this.isDragging = false;
    this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
  }

  handleWheel(e) {
    e.preventDefault();
    const { screenX, screenY } = this.getCanvasCoords(e);
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(this.scale * zoomFactor, 0.4), 3.0);

    // Zoom centered at cursor
    this.offsetX = screenX - (screenX - this.offsetX) * (newScale / this.scale);
    this.offsetY = screenY - (screenY - this.offsetY) * (newScale / this.scale);
    this.scale = newScale;
    this.render();
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.handleMouseDown(e.touches[0]);
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.handleMouseMove(e.touches[0]);
    }
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.25, 3.0);
    this.render();
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.25, 0.4);
    this.render();
  }

  resetView() {
    this.scale = 0.95;
    this.offsetX = 30;
    this.offsetY = 30;
    this.render();
  }

  fitBounds() {
    if (this.stops.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    this.stops.forEach(s => {
      minX = Math.min(minX, s.canvasX);
      maxX = Math.max(maxX, s.canvasX);
      minY = Math.min(minY, s.canvasY);
      maxY = Math.max(maxY, s.canvasY);
    });

    const padding = 70;
    const graphWidth = Math.max(maxX - minX, 100);
    const graphHeight = Math.max(maxY - minY, 100);

    const scaleX = (rect.width - padding * 2) / graphWidth;
    const scaleY = (rect.height - padding * 2) / graphHeight;
    this.scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 1.6);

    this.offsetX = (rect.width - graphWidth * this.scale) / 2 - minX * this.scale;
    this.offsetY = (rect.height - graphHeight * this.scale) / 2 - minY * this.scale;
    this.render();
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();

    // Clear background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle background grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 40 * this.scale;
    const startX = (this.offsetX * dpr) % gridSize;
    const startY = (this.offsetY * dpr) % gridSize;

    ctx.beginPath();
    for (let x = startX; x < this.canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
    }
    for (let y = startY; y < this.canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();

    // Apply World Camera Transform
    ctx.restore();
    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    const stopMap = new Map();
    this.stops.forEach(s => stopMap.set(s.id, s));

    // 1. Draw Inactive Edges First
    this.edges.forEach(edge => {
      const u = stopMap.get(edge.source);
      const v = stopMap.get(edge.target);
      if (!u || !v) return;

      const isPathEdge = this.activePathEdgeKeys.has(`${edge.source}->${edge.target}`);
      if (isPathEdge) return; // Drawn in active pass

      ctx.beginPath();
      ctx.moveTo(u.canvasX, u.canvasY);
      ctx.lineTo(v.canvasX, v.canvasY);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();

      // Draw subtle edge travel time badge in middle
      if (this.scale > 0.75) {
        const midX = (u.canvasX + v.canvasX) / 2;
        const midY = (u.canvasY + v.canvasY) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - 16, midY - 9, 32, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${edge.time}m`, midX, midY);
      }
    });

    // 2. Draw Active Planned Route Edges (Highlighted Glowing Line)
    if (this.activeRoute && this.activeRoute.pathStopIds && this.activeRoute.pathStopIds.length > 1) {
      const pathIds = this.activeRoute.pathStopIds;

      // Glowing outer halo
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < pathIds.length; i++) {
        const node = stopMap.get(pathIds[i]);
        if (!node) continue;
        if (i === 0) ctx.moveTo(node.canvasX, node.canvasY);
        else ctx.lineTo(node.canvasX, node.canvasY);
      }
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.28)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Vivid inner transit line
      ctx.strokeStyle = '#059669'; // Emerald transit green
      ctx.lineWidth = 5;
      ctx.stroke();

      // Traveling pulse dashes
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 15]);
      ctx.lineDashOffset = -this.pulseOffset;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Nodes (Stops)
    this.stops.forEach(stop => {
      const isHovered = this.hoveredNode && this.hoveredNode.id === stop.id;
      const isInPath = this.activePathStopIds.has(stop.id);
      const isOrigin = this.activeRoute && this.activeRoute.source?.id === stop.id;
      const isDest = this.activeRoute && this.activeRoute.destination?.id === stop.id;
      const radius = this.getNodeRadius(stop);

      // Color coding based on demand
      let fillCol = '#3b82f6'; // Blue
      if (stop.demand === 'High') fillCol = '#ef4444'; // Red/Coral
      else if (stop.demand === 'Medium') fillCol = '#f59e0b'; // Amber
      else if (stop.demand === 'Low') fillCol = '#10b981'; // Green

      if (isOrigin) fillCol = '#2563eb'; // Deep transit blue
      if (isDest) fillCol = '#10b981'; // Vivid green arrival

      // Active path pulse ring
      if (isInPath) {
        ctx.beginPath();
        ctx.arc(stop.canvasX, stop.canvasY, radius + 7, 0, Math.PI * 2);
        ctx.fillStyle = isDest ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.25)';
        ctx.fill();
      }

      // Outer border circle
      ctx.beginPath();
      ctx.arc(stop.canvasX, stop.canvasY, radius + (isHovered ? 4 : 2), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = isInPath ? (isDest ? '#059669' : '#1d4ed8') : '#94a3b8';
      ctx.lineWidth = isInPath ? 3.5 : 2;
      ctx.stroke();

      // Core colored circle
      ctx.beginPath();
      ctx.arc(stop.canvasX, stop.canvasY, radius - (isHovered ? 1 : 2), 0, Math.PI * 2);
      ctx.fillStyle = fillCol;
      ctx.fill();

      // Center mark or sequence number for active path
      if (isInPath) {
        const seqIndex = this.activeRoute.pathStopIds.indexOf(stop.id) + 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seqIndex.toString(), stop.canvasX, stop.canvasY);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(stop.canvasX, stop.canvasY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node Label (Stop Name)
      const labelText = stop.name;
      ctx.font = (isInPath || isHovered) ? 'bold 12px "Inter", sans-serif' : '500 11px "Inter", sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      // Label background pill
      const pillY = stop.canvasY + radius + 7;
      ctx.fillStyle = isInPath ? '#0f172a' : '#ffffff';
      ctx.strokeStyle = isInPath ? '#1e293b' : '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(stop.canvasX - textWidth / 2 - 6, pillY, textWidth + 12, 19, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isInPath ? '#f8fafc' : '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, stop.canvasX, pillY + 9.5);

      // Origin / Destination marker tags
      if (isOrigin) {
        this.drawMarkerTag(ctx, stop.canvasX, stop.canvasY - radius - 14, 'ORIGIN', '#2563eb');
      } else if (isDest) {
        this.drawMarkerTag(ctx, stop.canvasX, stop.canvasY - radius - 14, 'DESTINATION', '#059669');
      }
    });

    ctx.restore();
  }

  drawMarkerTag(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = 'bold 9px "Inter", sans-serif';
    const width = ctx.measureText(text).width + 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - 8, width, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.NetworkVisualizer = NetworkVisualizer;
}
