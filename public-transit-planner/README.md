# Public Transit Planner

A professional, modern, fully responsive web application for public transportation route planning and transport network analysis based on **Data Structures and Algorithms (DSA)**.

---

## 🚀 Live Overview & Core Capabilities

- **Intelligent Route Planning**: Calculates optimal travel itineraries between transit stops using Dijkstra's Algorithm with a binary Min-Heap Priority Queue.
- **Accurate Intermediate Stops**: Guarantees unique, precise intermediate stops for each route corridor:
  - **Patancheru → Bachupally**: `Patancheru` ↓ `BHEL` ↓ `Miyapur` ↓ `Nizampet` ↓ `Bachupally`
  - **Patancheru → Beeramguda**: `Patancheru` ↓ `Rameshwaram` ↓ `Isnapur` ↓ `Beeramguda`
  - **Bachupally → Patancheru**: `Bachupally` ↓ `Nizampet` ↓ `Miyapur` ↓ `BHEL` ↓ `Patancheru`
  - **Beeramguda → Patancheru**: `Beeramguda` ↓ `Isnapur` ↓ `Rameshwaram` ↓ `Patancheru`
- **Multi-Criteria Optimization**: Users can choose routing objectives:
  - ⚡ **Fastest**: Minimizes total travel duration (mins).
  - 🛣️ **Shortest**: Minimizes physical corridor distance (km).
  - 🔄 **Direct**: Minimizes transit transfers/hops.
  - 💰 **Low Cost**: Minimizes travel fare and operating cost.
- **Interactive Network Visualization**: Custom high-performance HTML5 Canvas rendering stops as nodes and roads as weighted edges with:
  - Drag-and-drop node positioning
  - Smooth pan and zoom controls (wheel or toolbar)
  - Animated glowing pulse highlighting the active planned path
  - Node inspection and one-click "Set as Origin / Destination"
- **Interactive DSA Tracer**: Step through Dijkstra's algorithm execution frame-by-frame, observing Min-Heap extractions, visited sets, and edge relaxations in real time.
- **Real-Time Timetable**: Search and filter by route number, bus registration, departure time, and live seat occupancy.
- **Analytics Dashboard**: 8 live KPIs and 4 interactive Chart.js visualizations (Passenger Demand by Stop, Fleet Utilization, 24h Hourly Traffic Density, Route Speed vs Cost Efficiency).
- **Admin / Planner Panel**: Full CRUD interface to register new stops, design new route corridors with custom intermediate sequences, update passenger demand, adjust fleet size, and export configuration as JSON.

---

## 🧠 Data Structures & Algorithms Used

1. **Weighted Directed Graph \(G = (V, E)\)**
   - **Vertices (\(V\))**: Bus terminals, metro interchanges, and local stops.
   - **Edges (\(E\))**: Road corridors connecting adjacent stops.
   - **Weights (\(W\))**: Travel duration (mins), distance (km), and operating cost (₹).
   - **Implementation**: Hash Map-based **Adjacency List** for optimal \(O(V + E)\) space complexity.

2. **Priority Queue (Binary Min-Heap)**
   - Maintains candidate unvisited nodes ordered by minimum cumulative travel time.
   - \(O(\log V)\) enqueue and extract-min operations, speeding up search from naive \(O(V^2)\) to \(O((V + E) \log V)\).

3. **Arrays and Lists**
   - Stores contiguous ordered sequences for intermediate stop timelines and timetable schedules.

4. **Hash Maps (\(O(1)\) Lookups)**
   - Maps stop IDs to metadata (landmarks, demand scores, coordinates).
   - Maps route IDs to vehicle frequencies and operating budgets.

5. **Dijkstra's Greedy Pathfinding Algorithm**
   - Evaluates optimal routes with dynamic edge relaxation:
   $$\text{if } (\text{dist}[u] + w(u, v) < \text{dist}[v]) \implies \text{dist}[v] = \text{dist}[u] + w(u, v)$$

---

## 📁 Project Structure

```
public-transit-planner/
├── index.html              # Main application shell with all navigation tabs and views
├── css/
│   └── style.css           # Modern design system (transit blue & emerald green palette)
├── js/
│   ├── dsa.js              # MinPriorityQueue, TransitGraph, DijkstraRouter, TraceGenerator
│   ├── data.js             # Initial stops, routes, corridors, timetable, localStorage sync
│   ├── network-canvas.js   # Interactive HTML5 Canvas graph visualizer with zoom/pan/drag
│   ├── dashboard.js        # KPI calculations and Chart.js analytics charts
│   ├── admin.js            # Admin CRUD handlers for stops, routes, and fleet parameters
│   └── app.js              # Central controller, routing events, timeline, filters, toasts
└── README.md               # Documentation and technical guide
```

---

## 💻 Running the Application in Visual Studio Code

### Option 1: Direct Browser Launch (Zero dependencies!)
1. Double-click `index.html` or right-click and choose **Open with > Chrome / Edge / Firefox**.
2. Everything works immediately without installing Node.js or any npm packages.

### Option 2: Using VS Code Live Server
1. Open the project folder in Visual Studio Code:
   ```bash
   code .
   ```
2. If installed, right-click `index.html` and click **"Open with Live Server"**.
3. Or launch a lightweight local server via Python:
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your web browser.
