/**
 * Public Transit Planner - Dashboard Analytics & Metrics Engine
 * Computes live KPIs and renders interactive Chart.js charts.
 */

class DashboardManager {
  constructor() {
    this.charts = {};
  }

  calculateMetrics(stops, routes, timetable) {
    const totalStops = stops.length;
    const totalRoutes = routes.length;
    const activeBuses = routes.reduce((sum, r) => sum + (Number(r.busesActive) || 0), 0);
    
    // Average demand score
    const avgDemand = totalStops > 0 
      ? Math.round(stops.reduce((sum, s) => sum + (Number(s.demandScore) || 75), 0) / totalStops)
      : 85;

    // High demand coverage %
    const highDemandStops = stops.filter(s => s.demand === 'High').length;
    const demandCoverage = totalStops > 0 
      ? ((highDemandStops / totalStops) * 100).toFixed(1)
      : '92.5';

    // Average travel time
    const avgTravelTime = totalRoutes > 0
      ? Math.round(routes.reduce((sum, r) => sum + (Number(r.durationMins) || 0), 0) / totalRoutes)
      : 36;

    // Fleet utilization %
    const totalAssignedBuses = routes.reduce((sum, r) => sum + (Number(r.busesActive) || 0), 0);
    const totalFleetCapacity = totalAssignedBuses + 8; // 8 standby / reserve buses
    const fleetUtilization = totalFleetCapacity > 0 
      ? ((totalAssignedBuses / totalFleetCapacity) * 100).toFixed(1)
      : '87.5';

    // Total hourly operating cost
    const totalOperatingCost = routes.reduce((sum, r) => sum + (Number(r.operatingCost) || 0), 0);

    return {
      totalStops,
      totalRoutes,
      activeBuses,
      avgDemand,
      demandCoverage,
      avgTravelTime,
      fleetUtilization,
      totalOperatingCost
    };
  }

  updateMetricsUI(metrics) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('kpi-total-stops', metrics.totalStops);
    setVal('kpi-total-routes', metrics.totalRoutes);
    setVal('kpi-active-buses', metrics.activeBuses);
    setVal('kpi-avg-demand', `${metrics.avgDemand}%`);
    setVal('kpi-demand-coverage', `${metrics.demandCoverage}%`);
    setVal('kpi-avg-travel-time', `${metrics.avgTravelTime} mins`);
    setVal('kpi-fleet-utilization', `${metrics.fleetUtilization}%`);
    setVal('kpi-operating-cost', `₹${metrics.totalOperatingCost.toLocaleString('en-IN')}`);
  }

  initCharts(stops, routes) {
    if (typeof Chart === 'undefined') return;

    this.renderDemandChart(stops);
    this.renderFleetStatusChart(routes);
    this.renderHourlyTrafficChart();
    this.renderRouteEfficiencyChart(routes);
  }

  renderDemandChart(stops) {
    const ctx = document.getElementById('chart-passenger-demand');
    if (!ctx) return;

    // Sort top 10 stops by demand score
    const topStops = [...stops].sort((a, b) => b.demandScore - a.demandScore).slice(0, 9);
    const labels = topStops.map(s => s.name);
    const data = topStops.map(s => s.demandScore);
    const colors = topStops.map(s => {
      if (s.demand === 'High') return '#ef4444';
      if (s.demand === 'Medium') return '#f59e0b';
      return '#10b981';
    });

    if (this.charts.demand) this.charts.demand.destroy();

    this.charts.demand = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Passenger Demand Score',
          data,
          backgroundColor: colors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Demand Score: ${ctx.raw} / 100`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter' } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  renderFleetStatusChart(routes) {
    const ctx = document.getElementById('chart-fleet-status');
    if (!ctx) return;

    const onSchedule = routes.filter(r => r.status === 'On Schedule').length;
    const highFreq = routes.filter(r => r.status === 'High Frequency').length;
    const standby = 2;
    const maintenance = 1;

    if (this.charts.fleet) this.charts.fleet.destroy();

    this.charts.fleet = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['On Schedule', 'High Frequency', 'Standby Reserve', 'Maintenance'],
        datasets: [{
          data: [onSchedule, highFreq, standby, maintenance],
          backgroundColor: ['#10b981', '#2563eb', '#f59e0b', '#94a3b8'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12 }
          }
        },
        cutout: '70%'
      }
    });
  }

  renderHourlyTrafficChart() {
    const ctx = document.getElementById('chart-hourly-traffic');
    if (!ctx) return;

    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const passengerFlow = [1200, 4800, 3900, 2400, 2100, 3600, 5200, 3800, 1600];

    if (this.charts.traffic) this.charts.traffic.destroy();

    this.charts.traffic = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Hourly Transit Ridership',
          data: passengerFlow,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Inter' },
              callback: (val) => `${val / 1000}k`
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  renderRouteEfficiencyChart(routes) {
    const ctx = document.getElementById('chart-route-efficiency');
    if (!ctx) return;

    const topRoutes = routes.slice(0, 6);
    const labels = topRoutes.map(r => `R-${r.routeNumber}`);
    const costPerKm = topRoutes.map(r => +(r.operatingCost / r.distanceKm).toFixed(1));
    const speedKmH = topRoutes.map(r => +(r.distanceKm / (r.durationMins / 60)).toFixed(1));

    if (this.charts.efficiency) this.charts.efficiency.destroy();

    this.charts.efficiency = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Cost Efficiency (₹/km)',
            data: costPerKm,
            backgroundColor: '#0284c7',
            borderRadius: 4
          },
          {
            label: 'Average Transit Speed (km/h)',
            data: speedKmH,
            backgroundColor: '#10b981',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Inter', size: 11 }, boxWidth: 12 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter' } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 } }
          }
        }
      }
    });
  }

  refresh() {
    const stops = DataStore.getStops();
    const routes = DataStore.getRoutes();
    const timetable = DataStore.getTimetable();
    const metrics = this.calculateMetrics(stops, routes, timetable);
    this.updateMetricsUI(metrics);
    this.initCharts(stops, routes);
  }
}

if (typeof window !== 'undefined') {
  window.DashboardManager = DashboardManager;
}
