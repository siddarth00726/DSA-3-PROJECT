/**
 * Public Transit Planner - Transit Network Demo Data & State Manager
 * 
 * Contains default stops, routes, timetable schedules, and localStorage sync.
 * Guarantees exact intermediate stops for:
 * 1. Patancheru -> Bachupally (Patancheru -> BHEL -> Miyapur -> Nizampet -> Bachupally)
 * 2. Patancheru -> Beeramguda (Patancheru -> Rameshwaram -> Isnapur -> Beeramguda)
 * 3. Bachupally -> Patancheru (Bachupally -> Nizampet -> Miyapur -> BHEL -> Patancheru)
 * 4. Beeramguda -> Patancheru (Beeramguda -> Isnapur -> Rameshwaram -> Patancheru)
 */

const DEFAULT_STOPS = [
  {
    id: 'patancheru',
    name: 'Patancheru',
    fullName: 'Patancheru Bus Terminal',
    code: 'PAT-01',
    zone: 'West Zone',
    demand: 'High',
    demandScore: 92,
    importance: 'Terminal Hub',
    connectionsCount: 3,
    lat: 17.5284,
    lng: 78.2642,
    canvasX: 110,
    canvasY: 280,
    landmark: 'NH-65 Outer Ring Highway'
  },
  {
    id: 'rameshwaram',
    name: 'Rameshwaram',
    fullName: 'Rameshwaram Banda',
    code: 'RAM-02',
    zone: 'West Zone',
    demand: 'Medium',
    demandScore: 68,
    importance: 'Transit Stop',
    connectionsCount: 2,
    lat: 17.5180,
    lng: 78.2830,
    canvasX: 230,
    canvasY: 180,
    landmark: 'Rameshwaram Temple Road'
  },
  {
    id: 'isnapur',
    name: 'Isnapur',
    fullName: 'Isnapur Junction',
    code: 'ISN-03',
    zone: 'West Zone',
    demand: 'Medium',
    demandScore: 72,
    importance: 'Transit Junction',
    connectionsCount: 2,
    lat: 17.5120,
    lng: 78.2980,
    canvasX: 350,
    canvasY: 150,
    landmark: 'Isnapur X Road'
  },
  {
    id: 'beeramguda',
    name: 'Beeramguda',
    fullName: 'Beeramguda Kaman',
    code: 'BRM-04',
    zone: 'West Zone',
    demand: 'High',
    demandScore: 88,
    importance: 'Commercial Hub',
    connectionsCount: 3,
    lat: 17.5080,
    lng: 78.3180,
    canvasX: 470,
    canvasY: 140,
    landmark: 'Beeramguda Main Arch'
  },
  {
    id: 'bhel',
    name: 'BHEL',
    fullName: 'BHEL Township Circle',
    code: 'BHL-05',
    zone: 'West Zone',
    demand: 'High',
    demandScore: 94,
    importance: 'Major Junction',
    connectionsCount: 4,
    lat: 17.5020,
    lng: 78.2950,
    canvasX: 250,
    canvasY: 340,
    landmark: 'BHEL Gate 1'
  },
  {
    id: 'lingampally',
    name: 'Lingampally',
    fullName: 'Lingampally Station',
    code: 'LPI-06',
    zone: 'West Zone',
    demand: 'High',
    demandScore: 96,
    importance: 'Railway / Bus Hub',
    connectionsCount: 4,
    lat: 17.4930,
    lng: 78.3190,
    canvasX: 350,
    canvasY: 420,
    landmark: 'MMTS Railway Station'
  },
  {
    id: 'chandanagar',
    name: 'Chandanagar',
    fullName: 'Chandanagar Commercial Zone',
    code: 'CDG-07',
    zone: 'North-West Zone',
    demand: 'Medium',
    demandScore: 74,
    importance: 'Transit Station',
    connectionsCount: 2,
    lat: 17.4950,
    lng: 78.3380,
    canvasX: 460,
    canvasY: 390,
    landmark: 'Chandanagar Main Road'
  },
  {
    id: 'miyapur',
    name: 'Miyapur',
    fullName: 'Miyapur Metro Terminal',
    code: 'MYP-08',
    zone: 'North-West Zone',
    demand: 'High',
    demandScore: 98,
    importance: 'Metro Intermodal Hub',
    connectionsCount: 5,
    lat: 17.4968,
    lng: 78.3614,
    canvasX: 560,
    canvasY: 320,
    landmark: 'Hyderabad Metro Depot 1'
  },
  {
    id: 'nizampet',
    name: 'Nizampet',
    fullName: 'Nizampet X Road',
    code: 'NZP-09',
    zone: 'North-West Zone',
    demand: 'High',
    demandScore: 89,
    importance: 'Transit Junction',
    connectionsCount: 3,
    lat: 17.5140,
    lng: 78.3780,
    canvasX: 670,
    canvasY: 240,
    landmark: 'Nizampet Flyover'
  },
  {
    id: 'bachupally',
    name: 'Bachupally',
    fullName: 'Bachupally X Road',
    code: 'BCP-10',
    zone: 'North-West Zone',
    demand: 'High',
    demandScore: 91,
    importance: 'Educational Hub',
    connectionsCount: 2,
    lat: 17.5380,
    lng: 78.3890,
    canvasX: 790,
    canvasY: 170,
    landmark: 'Bachupally Ring Road'
  },
  {
    id: 'kphb',
    name: 'KPHB Colony',
    fullName: 'Kukatpally Housing Board',
    code: 'KPB-11',
    zone: 'North-West Zone',
    demand: 'High',
    demandScore: 95,
    importance: 'Commercial Hub',
    connectionsCount: 3,
    lat: 17.4870,
    lng: 78.3980,
    canvasX: 680,
    canvasY: 380,
    landmark: 'KPHB Metro Station'
  },
  {
    id: 'kukatpally',
    name: 'Kukatpally',
    fullName: 'Kukatpally Y Junction',
    code: 'KUK-12',
    zone: 'North-West Zone',
    demand: 'High',
    demandScore: 93,
    importance: 'Major Junction',
    connectionsCount: 3,
    lat: 17.4840,
    lng: 78.4120,
    canvasX: 780,
    canvasY: 370,
    landmark: 'Kukatpally Bus Stand'
  },
  {
    id: 'gachibowli',
    name: 'Gachibowli',
    fullName: 'Gachibowli Stadium Junction',
    code: 'GCB-13',
    zone: 'IT Corridor',
    demand: 'High',
    demandScore: 97,
    importance: 'Major Junction',
    connectionsCount: 3,
    lat: 17.4430,
    lng: 78.3490,
    canvasX: 380,
    canvasY: 530,
    landmark: 'Gachibowli Flyover'
  },
  {
    id: 'hitec',
    name: 'Hitec City',
    fullName: 'Hitec City Cyber Towers',
    code: 'HTC-14',
    zone: 'IT Corridor',
    demand: 'High',
    demandScore: 99,
    importance: 'Tech Hub Terminal',
    connectionsCount: 3,
    lat: 17.4504,
    lng: 78.3808,
    canvasX: 520,
    canvasY: 500,
    landmark: 'Cyber Towers'
  },
  {
    id: 'ameerpet',
    name: 'Ameerpet',
    fullName: 'Ameerpet Metro Interchange',
    code: 'AMP-15',
    zone: 'Central Zone',
    demand: 'High',
    demandScore: 98,
    importance: 'Interchange Hub',
    connectionsCount: 3,
    lat: 17.4375,
    lng: 78.4482,
    canvasX: 890,
    canvasY: 410,
    landmark: 'Ameerpet Interchange'
  },
  {
    id: 'secunderabad',
    name: 'Secunderabad',
    fullName: 'Secunderabad Railway Station',
    code: 'SC-16',
    zone: 'East Zone',
    demand: 'High',
    demandScore: 99,
    importance: 'Central Station',
    connectionsCount: 2,
    lat: 17.4334,
    lng: 78.5015,
    canvasX: 1010,
    canvasY: 360,
    landmark: 'Secunderabad Central'
  }
];

const DEFAULT_ROUTES = [
  {
    id: 'R-219',
    routeNumber: '219',
    name: 'Patancheru ⇄ Beeramguda Express',
    sourceId: 'patancheru',
    destinationId: 'beeramguda',
    sourceName: 'Patancheru',
    destName: 'Beeramguda',
    intermediateStops: ['Rameshwaram', 'Isnapur'],
    allStops: ['Patancheru', 'Rameshwaram', 'Isnapur', 'Beeramguda'],
    distanceKm: 12.5,
    durationMins: 26,
    frequency: 'Every 12 mins',
    busesActive: 4,
    operatingCost: 420,
    status: 'On Schedule',
    fare: 25,
    category: 'Suburban Express'
  },
  {
    id: 'R-219R',
    routeNumber: '219R',
    name: 'Beeramguda ⇄ Patancheru Return',
    sourceId: 'beeramguda',
    destinationId: 'patancheru',
    sourceName: 'Beeramguda',
    destName: 'Patancheru',
    intermediateStops: ['Isnapur', 'Rameshwaram'],
    allStops: ['Beeramguda', 'Isnapur', 'Rameshwaram', 'Patancheru'],
    distanceKm: 12.5,
    durationMins: 26,
    frequency: 'Every 12 mins',
    busesActive: 4,
    operatingCost: 420,
    status: 'On Schedule',
    fare: 25,
    category: 'Suburban Express'
  },
  {
    id: 'R-218',
    routeNumber: '218',
    name: 'Patancheru ⇄ Bachupally Direct',
    sourceId: 'patancheru',
    destinationId: 'bachupally',
    sourceName: 'Patancheru',
    destName: 'Bachupally',
    intermediateStops: ['BHEL', 'Miyapur', 'Nizampet'],
    allStops: ['Patancheru', 'BHEL', 'Miyapur', 'Nizampet', 'Bachupally'],
    distanceKm: 24.5,
    durationMins: 48,
    frequency: 'Every 15 mins',
    busesActive: 6,
    operatingCost: 780,
    status: 'On Schedule',
    fare: 45,
    category: 'City Connector'
  },
  {
    id: 'R-218R',
    routeNumber: '218R',
    name: 'Bachupally ⇄ Patancheru Return',
    sourceId: 'bachupally',
    destinationId: 'patancheru',
    sourceName: 'Bachupally',
    destName: 'Patancheru',
    intermediateStops: ['Nizampet', 'Miyapur', 'BHEL'],
    allStops: ['Bachupally', 'Nizampet', 'Miyapur', 'BHEL', 'Patancheru'],
    distanceKm: 24.5,
    durationMins: 48,
    frequency: 'Every 15 mins',
    busesActive: 6,
    operatingCost: 780,
    status: 'On Schedule',
    fare: 45,
    category: 'City Connector'
  },
  {
    id: 'R-222',
    routeNumber: '222',
    name: 'Patancheru ⇄ Hitec City Tech Express',
    sourceId: 'patancheru',
    destinationId: 'hitec',
    sourceName: 'Patancheru',
    destName: 'Hitec City',
    intermediateStops: ['BHEL', 'Lingampally', 'Gachibowli'],
    allStops: ['Patancheru', 'BHEL', 'Lingampally', 'Gachibowli', 'Hitec City'],
    distanceKm: 29.2,
    durationMins: 58,
    frequency: 'Every 10 mins',
    busesActive: 8,
    operatingCost: 950,
    status: 'High Frequency',
    fare: 55,
    category: 'IT Feeder'
  },
  {
    id: 'R-10H',
    routeNumber: '10H',
    name: 'Miyapur ⇄ Secunderabad Metro Link',
    sourceId: 'miyapur',
    destinationId: 'secunderabad',
    sourceName: 'Miyapur',
    destName: 'Secunderabad',
    intermediateStops: ['KPHB Colony', 'Kukatpally', 'Ameerpet'],
    allStops: ['Miyapur', 'KPHB Colony', 'Kukatpally', 'Ameerpet', 'Secunderabad'],
    distanceKm: 22.4,
    durationMins: 52,
    frequency: 'Every 8 mins',
    busesActive: 10,
    operatingCost: 890,
    status: 'High Frequency',
    fare: 40,
    category: 'Metro Feeder'
  },
  {
    id: 'R-216',
    routeNumber: '216',
    name: 'Lingampally ⇄ Ameerpet Transit',
    sourceId: 'lingampally',
    destinationId: 'ameerpet',
    sourceName: 'Lingampally',
    destName: 'Ameerpet',
    intermediateStops: ['Chandanagar', 'Miyapur', 'KPHB Colony', 'Kukatpally'],
    allStops: ['Lingampally', 'Chandanagar', 'Miyapur', 'KPHB Colony', 'Kukatpally', 'Ameerpet'],
    distanceKm: 21.0,
    durationMins: 46,
    frequency: 'Every 12 mins',
    busesActive: 6,
    operatingCost: 710,
    status: 'On Schedule',
    fare: 35,
    category: 'Suburban Arterial'
  },
  {
    id: 'R-195',
    routeNumber: '195',
    name: 'Bachupally ⇄ Hitec City Direct',
    sourceId: 'bachupally',
    destinationId: 'hitec',
    sourceName: 'Bachupally',
    destName: 'Hitec City',
    intermediateStops: ['Nizampet', 'Miyapur'],
    allStops: ['Bachupally', 'Nizampet', 'Miyapur', 'Hitec City'],
    distanceKm: 18.5,
    durationMins: 38,
    frequency: 'Every 15 mins',
    busesActive: 5,
    operatingCost: 620,
    status: 'On Schedule',
    fare: 35,
    category: 'Tech Shuttle'
  }
];

const DEFAULT_EDGES = [
  // 1. Patancheru -> Rameshwaram -> Isnapur -> Beeramguda (Fastest suburban corridor for this path)
  { source: 'patancheru', target: 'rameshwaram', distance: 4.2, time: 8, cost: 8, routeId: 'R-219', routeName: '219' },
  { source: 'rameshwaram', target: 'patancheru', distance: 4.2, time: 8, cost: 8, routeId: 'R-219R', routeName: '219R' },
  { source: 'rameshwaram', target: 'isnapur', distance: 3.6, time: 7, cost: 7, routeId: 'R-219', routeName: '219' },
  { source: 'isnapur', target: 'rameshwaram', distance: 3.6, time: 7, cost: 7, routeId: 'R-219R', routeName: '219R' },
  { source: 'isnapur', target: 'beeramguda', distance: 4.0, time: 8, cost: 8, routeId: 'R-219', routeName: '219' },
  { source: 'beeramguda', target: 'isnapur', distance: 4.0, time: 8, cost: 8, routeId: 'R-219R', routeName: '219R' },

  // 2. Patancheru -> BHEL -> Miyapur -> Nizampet -> Bachupally corridor
  { source: 'patancheru', target: 'bhel', distance: 6.2, time: 12, cost: 15, routeId: 'R-218', routeName: '218' },
  { source: 'bhel', target: 'patancheru', distance: 6.2, time: 12, cost: 15, routeId: 'R-218R', routeName: '218R' },
  { source: 'bhel', target: 'miyapur', distance: 8.5, time: 16, cost: 20, routeId: 'R-218', routeName: '218' },
  { source: 'miyapur', target: 'bhel', distance: 8.5, time: 16, cost: 20, routeId: 'R-218R', routeName: '218R' },
  { source: 'miyapur', target: 'nizampet', distance: 4.8, time: 10, cost: 12, routeId: 'R-218', routeName: '218' },
  { source: 'nizampet', target: 'miyapur', distance: 4.8, time: 10, cost: 12, routeId: 'R-218R', routeName: '218R' },
  { source: 'nizampet', target: 'bachupally', distance: 5.0, time: 10, cost: 12, routeId: 'R-218', routeName: '218' },
  { source: 'bachupally', target: 'nizampet', distance: 5.0, time: 10, cost: 12, routeId: 'R-218R', routeName: '218R' },

  // 3. Beeramguda cross connector to BHEL (slower local link)
  { source: 'beeramguda', target: 'bhel', distance: 5.8, time: 18, cost: 14, routeId: 'R-219', routeName: '219' },
  { source: 'bhel', target: 'beeramguda', distance: 5.8, time: 18, cost: 14, routeId: 'R-219R', routeName: '219R' },

  // 4. BHEL to Lingampally and Chandanagar to Miyapur corridor
  { source: 'bhel', target: 'lingampally', distance: 3.5, time: 8, cost: 10, routeId: 'R-222', routeName: '222' },
  { source: 'lingampally', target: 'bhel', distance: 3.5, time: 8, cost: 10, routeId: 'R-222', routeName: '222' },
  { source: 'lingampally', target: 'chandanagar', distance: 3.0, time: 7, cost: 10, routeId: 'R-216', routeName: '216' },
  { source: 'chandanagar', target: 'lingampally', distance: 3.0, time: 7, cost: 10, routeId: 'R-216', routeName: '216' },
  { source: 'chandanagar', target: 'miyapur', distance: 4.0, time: 9, cost: 10, routeId: 'R-216', routeName: '216' },
  { source: 'miyapur', target: 'chandanagar', distance: 4.0, time: 9, cost: 10, routeId: 'R-216', routeName: '216' },

  // 5. IT Corridor: Lingampally / Miyapur -> Gachibowli & Hitec City
  { source: 'lingampally', target: 'gachibowli', distance: 8.5, time: 20, cost: 25, routeId: 'R-222', routeName: '222' },
  { source: 'gachibowli', target: 'lingampally', distance: 8.5, time: 20, cost: 25, routeId: 'R-222', routeName: '222' },
  { source: 'gachibowli', target: 'hitec', distance: 5.0, time: 12, cost: 15, routeId: 'R-222', routeName: '222' },
  { source: 'hitec', target: 'gachibowli', distance: 5.0, time: 12, cost: 15, routeId: 'R-222', routeName: '222' },
  { source: 'miyapur', target: 'hitec', distance: 9.0, time: 20, cost: 25, routeId: 'R-195', routeName: '195' },
  { source: 'hitec', target: 'miyapur', distance: 9.0, time: 20, cost: 25, routeId: 'R-195', routeName: '195' },

  // 6. Metro Corridor: Miyapur -> KPHB -> Kukatpally -> Ameerpet -> Secunderabad
  { source: 'miyapur', target: 'kphb', distance: 5.2, time: 12, cost: 15, routeId: 'R-10H', routeName: '10H' },
  { source: 'kphb', target: 'miyapur', distance: 5.2, time: 12, cost: 15, routeId: 'R-10H', routeName: '10H' },
  { source: 'kphb', target: 'kukatpally', distance: 3.8, time: 9, cost: 10, routeId: 'R-10H', routeName: '10H' },
  { source: 'kukatpally', target: 'kphb', distance: 3.8, time: 9, cost: 10, routeId: 'R-10H', routeName: '10H' },
  { source: 'kukatpally', target: 'ameerpet', distance: 7.4, time: 16, cost: 20, routeId: 'R-10H', routeName: '10H' },
  { source: 'ameerpet', target: 'kukatpally', distance: 7.4, time: 16, cost: 20, routeId: 'R-10H', routeName: '10H' },
  { source: 'ameerpet', target: 'secunderabad', distance: 6.0, time: 15, cost: 15, routeId: 'R-10H', routeName: '10H' },
  { source: 'secunderabad', target: 'ameerpet', distance: 6.0, time: 15, cost: 15, routeId: 'R-10H', routeName: '10H' }
];

const DEFAULT_TIMETABLE = [
  {
    id: 'TT-101',
    routeNumber: '219',
    routeName: 'Patancheru ⇄ Beeramguda',
    busNumber: 'TS-09-UB-4012',
    departureTime: '06:15 AM',
    arrivalTime: '06:41 AM',
    frequency: 'Every 12 mins',
    availableSeats: 34,
    totalSeats: 48,
    status: 'On Time',
    platform: 'Bay 3',
    serviceType: 'Electric AC'
  },
  {
    id: 'TT-102',
    routeNumber: '219',
    routeName: 'Patancheru ⇄ Beeramguda',
    busNumber: 'TS-09-UB-4015',
    departureTime: '06:30 AM',
    arrivalTime: '06:56 AM',
    frequency: 'Every 12 mins',
    availableSeats: 22,
    totalSeats: 48,
    status: 'Boarding',
    platform: 'Bay 3',
    serviceType: 'Electric AC'
  },
  {
    id: 'TT-103',
    routeNumber: '219R',
    routeName: 'Beeramguda ⇄ Patancheru',
    busNumber: 'TS-09-UB-4018',
    departureTime: '06:45 AM',
    arrivalTime: '07:11 AM',
    frequency: 'Every 12 mins',
    availableSeats: 18,
    totalSeats: 48,
    status: 'On Time',
    platform: 'Bay 1',
    serviceType: 'Electric AC'
  },
  {
    id: 'TT-104',
    routeNumber: '218',
    routeName: 'Patancheru ⇄ Bachupally',
    busNumber: 'TS-08-Z-2218',
    departureTime: '06:40 AM',
    arrivalTime: '07:28 AM',
    frequency: 'Every 15 mins',
    availableSeats: 40,
    totalSeats: 52,
    status: 'Departing Soon',
    platform: 'Bay 6',
    serviceType: 'Express Metro'
  },
  {
    id: 'TT-105',
    routeNumber: '218',
    routeName: 'Patancheru ⇄ Bachupally',
    busNumber: 'TS-08-Z-2220',
    departureTime: '06:55 AM',
    arrivalTime: '07:43 AM',
    frequency: 'Every 15 mins',
    availableSeats: 14,
    totalSeats: 52,
    status: 'On Time',
    platform: 'Bay 6',
    serviceType: 'Express Metro'
  },
  {
    id: 'TT-106',
    routeNumber: '218R',
    routeName: 'Bachupally ⇄ Patancheru',
    busNumber: 'TS-08-Z-2224',
    departureTime: '07:10 AM',
    arrivalTime: '07:58 AM',
    frequency: 'Every 15 mins',
    availableSeats: 29,
    totalSeats: 52,
    status: 'On Time',
    platform: 'Terminal A',
    serviceType: 'Express Metro'
  },
  {
    id: 'TT-107',
    routeNumber: '222',
    routeName: 'Patancheru ⇄ Hitec City',
    busNumber: 'TS-09-UB-8810',
    departureTime: '07:00 AM',
    arrivalTime: '07:58 AM',
    frequency: 'Every 10 mins',
    availableSeats: 8,
    totalSeats: 45,
    status: 'Boarding',
    platform: 'Bay 8',
    serviceType: 'Low Floor AC'
  },
  {
    id: 'TT-108',
    routeNumber: '10H',
    routeName: 'Miyapur ⇄ Secunderabad',
    busNumber: 'TS-10-TR-5501',
    departureTime: '07:15 AM',
    arrivalTime: '08:07 AM',
    frequency: 'Every 8 mins',
    availableSeats: 19,
    totalSeats: 50,
    status: 'On Time',
    platform: 'Bay 2',
    serviceType: 'Super Luxury'
  },
  {
    id: 'TT-109',
    routeNumber: '216',
    routeName: 'Lingampally ⇄ Ameerpet',
    busNumber: 'TS-07-UA-3312',
    departureTime: '07:20 AM',
    arrivalTime: '08:06 AM',
    frequency: 'Every 12 mins',
    availableSeats: 5,
    totalSeats: 45,
    status: 'Minor Delay (4m)',
    platform: 'Bay 4',
    serviceType: 'City Ordinary'
  },
  {
    id: 'TT-110',
    routeNumber: '195',
    routeName: 'Bachupally ⇄ Hitec City',
    busNumber: 'TS-08-Z-9944',
    departureTime: '07:30 AM',
    arrivalTime: '08:08 AM',
    frequency: 'Every 15 mins',
    availableSeats: 32,
    totalSeats: 48,
    status: 'On Time',
    platform: 'Bay 1',
    serviceType: 'IT Express'
  }
];

class DataStore {
  static getStops() {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('ptp_stops') : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_stops', JSON.stringify(DEFAULT_STOPS));
      return JSON.parse(JSON.stringify(DEFAULT_STOPS));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_STOPS;
    }
  }

  static saveStops(stops) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_stops', JSON.stringify(stops));
  }

  static getRoutes() {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('ptp_routes') : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_routes', JSON.stringify(DEFAULT_ROUTES));
      return JSON.parse(JSON.stringify(DEFAULT_ROUTES));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_ROUTES;
    }
  }

  static saveRoutes(routes) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_routes', JSON.stringify(routes));
  }

  static getEdges() {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('ptp_edges') : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_edges', JSON.stringify(DEFAULT_EDGES));
      return JSON.parse(JSON.stringify(DEFAULT_EDGES));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_EDGES;
    }
  }

  static saveEdges(edges) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_edges', JSON.stringify(edges));
  }

  static getTimetable() {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('ptp_timetable') : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_timetable', JSON.stringify(DEFAULT_TIMETABLE));
      return JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_TIMETABLE;
    }
  }

  static saveTimetable(timetable) {
    if (typeof localStorage !== 'undefined') localStorage.setItem('ptp_timetable', JSON.stringify(timetable));
  }

  static resetToDefaults() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ptp_stops', JSON.stringify(DEFAULT_STOPS));
      localStorage.setItem('ptp_routes', JSON.stringify(DEFAULT_ROUTES));
      localStorage.setItem('ptp_edges', JSON.stringify(DEFAULT_EDGES));
      localStorage.setItem('ptp_timetable', JSON.stringify(DEFAULT_TIMETABLE));
    }
  }

  static buildGraph() {
    const graph = new TransitGraph();
    const stops = this.getStops();
    const edges = this.getEdges();

    stops.forEach(stop => graph.addVertex(stop));
    edges.forEach(edge => {
      graph.addEdge(edge.source, edge.target, {
        distance: edge.distance,
        time: edge.time,
        cost: edge.cost,
        routeId: edge.routeId,
        routeName: edge.routeName,
        intermediateStops: edge.intermediateStops || []
      });
    });

    return graph;
  }
}

if (typeof window !== 'undefined') {
  window.DataStore = DataStore;
  window.DEFAULT_STOPS = DEFAULT_STOPS;
  window.DEFAULT_ROUTES = DEFAULT_ROUTES;
  window.DEFAULT_EDGES = DEFAULT_EDGES;
  window.DEFAULT_TIMETABLE = DEFAULT_TIMETABLE;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataStore, DEFAULT_STOPS, DEFAULT_ROUTES, DEFAULT_EDGES, DEFAULT_TIMETABLE };
}
