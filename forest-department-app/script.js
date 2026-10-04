const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const cancelLoginButton = document.getElementById('cancel-login');
const usernameInput = document.getElementById('login-username');
const passwordInput = document.getElementById('login-password');
const connectionStatus = document.getElementById('connection-status');
const offlineToggle = document.getElementById('offline-toggle');
const voiceButton = document.getElementById('voice-button');
const sosButton = document.getElementById('sos-button');
const notificationBadge = document.getElementById('notification-badge');
const notificationList = document.getElementById('notifications-list');
const adminNotificationsList = document.getElementById('admin-notifications-list');
const clearNotificationsButton = document.getElementById('clear-notifications');
const clearNotificationsAdminButton = document.getElementById('clear-notifications-admin');
const dashboardMenuToggle = document.getElementById('dashboard-menu-toggle');
const dashboardSlideBox = document.getElementById('dashboard-slide-box');
const dashboardActionButtons = document.querySelectorAll('.dashboard-action-button');
const navButtons = document.querySelectorAll('.nav-button');
const panels = document.querySelectorAll('.panel');
const patrolForm = document.getElementById('patrol-form');
const patrolName = document.getElementById('patrol-name');
const patrolArea = document.getElementById('patrol-area');
const patrolList = document.getElementById('patrol-list');
const deviceList = document.getElementById('device-list');
const incidentForm = document.getElementById('incident-form');
const incidentType = document.getElementById('incident-type');
const incidentLocation = document.getElementById('incident-location');
const incidentDescription = document.getElementById('incident-description');
const useGpsButton = document.getElementById('use-gps');
const refreshMapButton = document.getElementById('refresh-map');
const downloadReportsButton = document.getElementById('download-reports');
const filterButtons = document.querySelectorAll('.filter-button');
const incidentsContainer = document.getElementById('incidents');
const totalAlerts = document.getElementById('total-alerts');
const activePatrols = document.getElementById('active-patrols');
const deviceCount = document.getElementById('device-count');
const queueCount = document.getElementById('queue-count');
const wildfireCount = document.getElementById('wildfire-count');
const illegalCount = document.getElementById('illegal-count');
const wildlifeCount = document.getElementById('wildlife-count');
const fireCount = document.getElementById('fire-count');
const adminQueueCount = document.getElementById('admin-queue-count');
const notificationSummary = document.getElementById('notification-summary');

const geofence = {
  center: [11.2500, 77.1600],
  radius: 18000,
};

let currentUser = null;
let reports = [];
let patrols = [];
let devices = [];
let notifications = [];
let offlineQueue = [];
let map;
let reportMarkers = [];
let patrolMarkers = [];
let geofenceCircle;
let speechRecognition = null;
let activeFilter = 'all';

function showLogin() {
  loginScreen.classList.remove('hidden');
  appShell.classList.add('hidden');
}

function showApp() {
  loginScreen.classList.add('hidden');
  appShell.classList.remove('hidden');
}

const SAMPLE_USERNAME = 'admin';
const SAMPLE_PASSWORD = 'forest123';

function handleLogin(event) {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert('Enter username and password');
    return;
  }

  if (username !== SAMPLE_USERNAME || password !== SAMPLE_PASSWORD) {
    alert('Invalid credentials. Use admin / forest123');
    return;
  }

  currentUser = { username };
  saveLocalState();
  showApp();
  initializeApp();
  createNotification(`Welcome ${username}`, 'info');
}

function handleLoginCancel() {
  loginForm.reset();
  usernameInput.focus();
  createNotification('Login canceled', 'warning');
}

function toggleDashboardMenu() {
  if (!dashboardSlideBox) return;
  dashboardSlideBox.classList.toggle('open');
}

function scrollToDashboardSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleDashboardActionClick(event) {
  const actionButton = event.currentTarget;
  const panel = actionButton.dataset.panel || actionButton.dataset.target;
  const section = actionButton.dataset.section;
  const label = actionButton.textContent.trim();

  if (panel && ['dashboard', 'live', 'patrol', 'reports', 'devices', 'admin'].includes(panel)) {
    setPanel(panel);
    if (panel === 'dashboard' && section) {
      window.setTimeout(() => scrollToDashboardSection(section), 250);
      if (dashboardSlideBox) {
        dashboardSlideBox.classList.remove('open');
      }
      return;
    }
    if (dashboardSlideBox) {
      dashboardSlideBox.classList.remove('open');
    }
    return;
  }

  createNotification(`${label} section coming soon`, 'info');
}

function initializeApp() {
  requestNotificationPermission();
  initMap();
  fetchInitialData();
  renderAll();
  initializeMLModel();
  startLiveTracking();
}

function attachEvents() {
  loginForm.addEventListener('submit', handleLogin);
  cancelLoginButton.addEventListener('click', handleLoginCancel);
  offlineToggle.addEventListener('click', toggleOfflineMode);
  voiceButton.addEventListener('click', handleVoiceCommandStart);
  sosButton.addEventListener('click', handleSOS);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  patrolForm.addEventListener('submit', handlePatrolSubmit);
  incidentForm.addEventListener('submit', handleReportSubmit);
  useGpsButton.addEventListener('click', getCurrentLocation);
  refreshMapButton.addEventListener('click', () => {
    updateMapMarkers();
    createNotification('Map refreshed', 'info');
  });
  downloadReportsButton.addEventListener('click', downloadReports);
  clearNotificationsButton.addEventListener('click', clearNotifications);
  clearNotificationsAdminButton.addEventListener('click', clearNotifications);

  navButtons.forEach((button) => {
    button.addEventListener('click', () => setPanel(button.dataset.target));
  });

  if (dashboardMenuToggle) {
    dashboardMenuToggle.addEventListener('click', toggleDashboardMenu);
  }

  dashboardActionButtons.forEach((button) => {
    button.addEventListener('click', handleDashboardActionClick);
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeFilter = button.dataset.filter;
      renderReports();
    });
  });
}

function setPanel(target) {
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === target);
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active-panel', panel.id === target);
  });

  if (target === 'live' && map) {
    window.setTimeout(() => map.invalidateSize(), 250);
  }
}

function fetchInitialData() {
  apiGet('/api/reports').then((serverReports) => {
    reports = serverReports;
    saveLocalState();
    renderReports();
    renderAnalytics();
    updateMapMarkers();
  }).catch(() => {
    createNotification('Offline mode: using cached reports', 'warning');
  });

  apiGet('/api/patrols').then((serverPatrols) => {
    patrols = serverPatrols;
    saveLocalState();
    renderPatrols();
    updateMapMarkers();
  }).catch(() => {
    createNotification('Offline mode: using cached patrols', 'warning');
  });

  apiGet('/api/devices').then((serverDevices) => {
    devices = serverDevices;
    saveLocalState();
    renderDevices();
  }).catch(() => {
    createNotification('Offline mode: using cached devices', 'warning');
  });

  apiGet('/api/notifications').then((serverNotifications) => {
    notifications = serverNotifications;
    saveLocalState();
    renderNotifications();
  }).catch(() => {
    createNotification('Offline mode: using cached notifications', 'warning');
  });
}

function apiGet(path) {
  if (!navigator.onLine) {
    return Promise.reject(new Error('Offline'));
  }
  return fetch(path).then((response) => {
    if (!response.ok) throw new Error('Network error');
    return response.json();
  });
}

function apiPost(path, payload) {
  if (!navigator.onLine) {
    queueRequest(path, payload);
    return Promise.resolve(payload);
  }

  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then((response) => {
    if (!response.ok) throw new Error('Network error');
    return response.json();
  });
}

function queueRequest(path, payload) {
  offlineQueue.push({ path, payload });
  saveLocalState();
  updateQueueDisplay();
  createNotification(`Queued ${payload.type || path} action for sync`, 'warning');
}

function syncOfflineQueue() {
  if (!navigator.onLine || offlineQueue.length === 0) {
    return;
  }

  const queued = [...offlineQueue];
  offlineQueue = [];
  const results = queued.map((item) => apiPost(item.path, item.payload).catch(() => {
    offlineQueue.push(item);
  }));

  Promise.all(results).then(() => {
    saveLocalState();
    updateQueueDisplay();
    if (offlineQueue.length === 0) {
      createNotification('Offline queue synced', 'success');
    }
  });
}

function loadLocalState() {
  const savedReports = localStorage.getItem('forestAppReports');
  const savedPatrols = localStorage.getItem('forestAppPatrols');
  const savedDevices = localStorage.getItem('forestAppDevices');
  const savedNotifications = localStorage.getItem('forestAppNotifications');
  const savedQueue = localStorage.getItem('forestAppOfflineQueue');
  const savedUser = localStorage.getItem('forestAppUser');

  reports = savedReports ? JSON.parse(savedReports) : [];
  patrols = savedPatrols ? JSON.parse(savedPatrols) : [];
  devices = savedDevices ? JSON.parse(savedDevices) : [];
  notifications = savedNotifications ? JSON.parse(savedNotifications) : [];
  offlineQueue = savedQueue ? JSON.parse(savedQueue) : [];
  currentUser = savedUser ? JSON.parse(savedUser) : currentUser;
}

function saveLocalState() {
  localStorage.setItem('forestAppReports', JSON.stringify(reports));
  localStorage.setItem('forestAppPatrols', JSON.stringify(patrols));
  localStorage.setItem('forestAppDevices', JSON.stringify(devices));
  localStorage.setItem('forestAppNotifications', JSON.stringify(notifications));
  localStorage.setItem('forestAppOfflineQueue', JSON.stringify(offlineQueue));
  localStorage.setItem('forestAppUser', JSON.stringify(currentUser));
}

function renderAll() {
  renderReports();
  renderPatrols();
  renderDevices();
  renderNotifications();
  renderAnalytics();
  updateDashboard();
  updateQueueDisplay();
  updateMLInsight();
}

function handleReportSubmit(event) {
  event.preventDefault();
  const type = incidentType.value;
  const location = incidentLocation.value.trim();
  const description = incidentDescription.value.trim();

  if (!type || !location || !description) {
    alert('Please complete all fields.');
    return;
  }

  const { latitude, longitude } = parseCoordinates(location);
  const report = {
    id: `report-${Date.now()}`,
    type,
    location,
    description,
    latitude,
    longitude,
    source: currentUser.username,
    time: new Date().toLocaleString(),
  };

  reports.unshift(report);
  saveLocalState();
  renderReports();
  updateMapMarkers();
  updateDashboard();
  renderAnalytics();
  checkGeofence(report);

  apiPost('/api/reports', report)
    .then(() => {
      createNotification(`${type} report synced`, 'success');
    })
    .catch(() => {
      createNotification(`${type} report saved offline`, 'warning');
    });

  if (type === 'SOS' || type === 'Fire Detection') {
    sendBrowserNotification(`${type} alert recorded.`);
  }

  updateMLInsight();
  incidentForm.reset();
}

function parseCoordinates(location) {
  const match = location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (match) {
    return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
  }
  return { latitude: null, longitude: null };
}

function renderReports() {
  incidentsContainer.innerHTML = '';
  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter((report) => report.type === activeFilter);

  if (filteredReports.length === 0) {
    const emptyNode = document.createElement('p');
    emptyNode.className = 'empty';
    emptyNode.textContent = 'No reports match this filter.';
    incidentsContainer.appendChild(emptyNode);
    return;
  }

  filteredReports.forEach((report) => {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.innerHTML = `
      <strong>${report.type}</strong>
      <div>${report.location}</div>
      <div>${report.description}</div>
      <span>${report.time} — reported by ${report.source || 'Unknown'}</span>
    `;
    incidentsContainer.appendChild(card);
  });
}

function renderPatrols() {
  patrolList.innerHTML = '';
  if (!patrols.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No active patrols yet.';
    patrolList.appendChild(empty);
    return;
  }

  patrols.forEach((patrol) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${patrol.name}</strong>
      <div>${patrol.area} • ${patrol.status}</div>
      <div>Last update: ${patrol.lastUpdate}</div>
      <button class="secondary-button">Toggle Status</button>
    `;
    const button = item.querySelector('button');
    button.addEventListener('click', () => togglePatrolStatus(patrol.id));
    patrolList.appendChild(item);
  });
  activePatrols.textContent = patrols.filter((patrol) => patrol.status === 'On Duty').length;
}

function togglePatrolStatus(patrolId) {
  patrols = patrols.map((patrol) => {
    if (patrol.id === patrolId) {
      const status = patrol.status === 'On Duty' ? 'Resting' : 'On Duty';
      return { ...patrol, status, lastUpdate: new Date().toLocaleTimeString() };
    }
    return patrol;
  });
  saveLocalState();
  renderPatrols();
  apiPost(`/api/patrols/${patrolId}/status`, patrols.find((p) => p.id === patrolId)).catch(() => {});
}

function handlePatrolSubmit(event) {
  event.preventDefault();
  const name = patrolName.value.trim();
  const area = patrolArea.value.trim();

  if (!name || !area) {
    alert('Complete the patrol assignment form.');
    return;
  }

  const patrol = {
    id: `patrol-${Date.now()}`,
    name,
    area,
    status: 'On Duty',
    lastUpdate: new Date().toLocaleTimeString(),
    location: { lat: geofence.center[0], lng: geofence.center[1] },
  };

  patrols.unshift(patrol);
  saveLocalState();
  renderPatrols();
  updateMapMarkers();

  apiPost('/api/patrols', patrol).catch(() => {
    createNotification('Patrol assignment queued for sync', 'warning');
  });

  patrolForm.reset();
}

function renderDevices() {
  deviceList.innerHTML = '';
  if (!devices.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No LoRa devices registered.';
    deviceList.appendChild(empty);
    return;
  }

  devices.forEach((device) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <strong>${device.name}</strong>
      <div>Status: ${device.status} • Last seen ${device.lastSeen}</div>
      <button class="secondary-button">Send Ping</button>
    `;
    const button = item.querySelector('button');
    button.addEventListener('click', () => sendDeviceCommand(device.id));
    deviceList.appendChild(item);
  });
  deviceCount.textContent = devices.length;
}

function sendDeviceCommand(deviceId) {
  const device = devices.find((item) => item.id === deviceId);
  if (!device) return;
  const payload = {
    command: 'ping',
    deviceId,
    time: new Date().toLocaleTimeString(),
  };
  apiPost(`/api/devices/${deviceId}/command`, payload)
    .then(() => {
      createNotification(`Ping sent to ${device.name}`, 'success');
    })
    .catch(() => {
      createNotification(`Ping queued for ${device.name}`, 'warning');
    });
}

function renderNotifications() {
  notificationList.innerHTML = '';
  adminNotificationsList.innerHTML = '';

  if (!notifications.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No notifications yet.';
    notificationList.appendChild(empty);
    adminNotificationsList.appendChild(empty.cloneNode(true));
  } else {
    notifications.forEach((note) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <strong>${note.title || 'Alert'}</strong>
        <div>${note.message}</div>
        <span>${note.time}</span>
      `;
      notificationList.appendChild(item);
      adminNotificationsList.appendChild(item.cloneNode(true));
    });
  }

  notificationBadge.textContent = notifications.length;
  notificationSummary.textContent = `${notifications.length} unread`;
}

function clearNotifications() {
  notifications = [];
  saveLocalState();
  renderNotifications();
}

function updateDashboard() {
  totalAlerts.textContent = reports.length;
  activePatrols.textContent = patrols.filter((patrol) => patrol.status === 'On Duty').length;
  deviceCount.textContent = devices.length;
  document.getElementById('summary-active-patrols').textContent = patrols.filter((patrol) => patrol.status === 'On Duty').length;
  document.getElementById('summary-device-count').textContent = devices.length;
  updateQueueDisplay();
}

function renderAnalytics() {
  const counts = {
    Wildfire: 0,
    'Illegal Logging': 0,
    Wildlife: 0,
    'Fire Detection': 0,
  };

  reports.forEach((report) => {
    if (counts[report.type] !== undefined) {
      counts[report.type] += 1;
    }
  });

  wildfireCount.textContent = counts.Wildfire;
  illegalCount.textContent = counts['Illegal Logging'];
  wildlifeCount.textContent = counts.Wildlife;
  fireCount.textContent = counts['Fire Detection'];

  const maxCount = Math.max(...Object.values(counts), 1);
  document.getElementById('wildfire-bar').style.width = `${(counts.Wildfire / maxCount) * 100}%`;
  document.getElementById('illegal-bar').style.width = `${(counts['Illegal Logging'] / maxCount) * 100}%`;
  document.getElementById('wildlife-bar').style.width = `${(counts.Wildlife / maxCount) * 100}%`;
  document.getElementById('fire-bar').style.width = `${(counts['Fire Detection'] / maxCount) * 100}%`;
}

function updateQueueDisplay() {
  queueCount.textContent = offlineQueue.length;
  adminQueueCount.textContent = offlineQueue.length;
}

async function initializeMLModel() {
  const insightText = document.getElementById('ml-insight-text');
  if (!insightText || typeof tf === 'undefined') {
    return;
  }

  try {
    insightText.textContent = 'AI model initialized. Analyzing incident risk...';
    // Tiny local model: simple rules-based predictor using TFJS tensors.
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, inputShape: [4], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });

    const dummyXs = tf.tensor2d([
      [1, 0, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
      [1, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 1],
      [1, 1, 1, 1],
    ]);
    const dummyYs = tf.tensor2d([[0], [0], [0], [1], [1], [1], [0], [1]]);
    await model.fit(dummyXs, dummyYs, { epochs: 20, verbose: 0 });

    window.forestMLModel = model;
    updateMLInsight();
  } catch (error) {
    insightText.textContent = 'AI model failed to initialize.';
    console.error('ML init error', error);
  }
}

function predictIncidentRisk(report) {
  if (!window.forestMLModel) {
    return { risk: null, label: 'Model unavailable' };
  }

  const input = [
    report.type === 'Wildfire' ? 1 : 0,
    report.type === 'Illegal Logging' ? 1 : 0,
    report.type === 'Wildlife' ? 1 : 0,
    report.type === 'Fire Detection' ? 1 : 0,
  ];

  const tensor = tf.tensor2d([input]);
  const prediction = window.forestMLModel.predict(tensor);
  const value = prediction.dataSync()[0];
  tensor.dispose();
  prediction.dispose();

  const label = value > 0.6 ? 'High' : value > 0.3 ? 'Medium' : 'Low';
  return { risk: value, label };
}

function updateMLInsight() {
  const insightText = document.getElementById('ml-insight-text');
  if (!insightText) return;

  if (!reports.length) {
    insightText.textContent = 'No incident data available yet.';
    return;
  }

  const latest = reports[0];
  const prediction = predictIncidentRisk(latest);
  if (prediction.risk === null) {
    insightText.textContent = 'AI model unavailable.';
    return;
  }

  insightText.textContent = `Latest report: ${latest.type}. Predicted risk: ${prediction.label} (${Math.round(prediction.risk * 100)}%).`;
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported in this browser.');
    return;
  }

  useGpsButton.disabled = true;
  useGpsButton.textContent = 'Locating...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      useGpsButton.disabled = false;
      useGpsButton.textContent = 'Use GPS';
      incidentLocation.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
      if (map) {
        map.setView([position.coords.latitude, position.coords.longitude], 12);
      }
    },
    (error) => {
      useGpsButton.disabled = false;
      useGpsButton.textContent = 'Use GPS';
      createNotification(`Location error: ${error.message}`, 'warning');
    }
  );
}

function initMap() {
  map = L.map('mapid').setView(geofence.center, 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  geofenceCircle = L.circle(geofence.center, {
    color: '#e26a4f',
    fillColor: '#fbe9e4',
    fillOpacity: 0.18,
    radius: geofence.radius,
  }).addTo(map);

  updateMapMarkers();
}

function updateMapMarkers() {
  if (!map) return;

  reportMarkers.forEach((marker) => marker.remove());
  patrolMarkers.forEach((marker) => marker.remove());
  reportMarkers = [];
  patrolMarkers = [];

  reports.forEach((report) => {
    if (report.latitude && report.longitude) {
      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: 8,
        color: '#c2361a',
        fillColor: '#ff6b4f',
        fillOpacity: 0.85,
      }).addTo(map);
      marker.bindPopup(`<strong>${report.type}</strong><br>${report.location}<br>${report.description}`);
      reportMarkers.push(marker);
    }
  });

  patrols.forEach((patrol) => {
    const marker = L.marker([patrol.location.lat, patrol.location.lng], {
      title: patrol.name,
    }).addTo(map);
    marker.bindPopup(`<strong>${patrol.name}</strong><br>${patrol.area}<br>${patrol.status}`);
    patrolMarkers.push(marker);
  });
}

function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function checkGeofence(report) {
  if (!report.latitude || !report.longitude) return;
  const distance = getDistance(report.latitude, report.longitude, geofence.center[0], geofence.center[1]);
  if (distance > geofence.radius) {
    createNotification('Geofence alert: incident outside the protected zone', 'warning');
  }
}

function handleVoiceCommandStart() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice commands are not supported in this browser.');
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = 'en-US';
  speechRecognition.interimResults = false;
  speechRecognition.maxAlternatives = 1;

  speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    createNotification(`Voice command: ${transcript}`, 'info');
    parseVoiceCommand(transcript);
  };

  speechRecognition.onerror = () => createNotification('Voice recognition failed.', 'warning');
  speechRecognition.start();
}

function parseVoiceCommand(command) {
  if (command.includes('dashboard')) {
    setPanel('dashboard');
  } else if (command.includes('live tracking') || command.includes('map')) {
    setPanel('live');
  } else if (command.includes('patrol')) {
    setPanel('patrol');
  } else if (command.includes('device')) {
    setPanel('devices');
  } else if (command.includes('report fire')) {
    incidentType.value = 'Fire Detection';
    incidentDescription.value = 'Voice reported fire in zone.';
    setPanel('reports');
  } else if (command.includes('illegal logging')) {
    incidentType.value = 'Illegal Logging';
    incidentDescription.value = 'Voice reported illegal logging activity.';
    setPanel('reports');
  } else if (command.includes('send sos')) {
    handleSOS();
  } else {
    createNotification('Voice command not recognized.', 'warning');
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(message) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('Forest Command', { body: message });
  }
}

function createNotification(message, type = 'info') {
  const note = {
    id: `note-${Date.now()}`,
    title: type === 'danger' ? 'Emergency' : type === 'warning' ? 'Warning' : 'Update',
    message,
    type,
    time: new Date().toLocaleTimeString(),
  };
  notifications.unshift(note);
  saveLocalState();
  renderNotifications();
}

function toggleOfflineMode() {
  if (connectionStatus.textContent === 'Online') {
    connectionStatus.textContent = 'Offline';
    connectionStatus.classList.remove('online');
    connectionStatus.classList.add('offline');
    createNotification('Offline mode enabled manually.', 'warning');
  } else {
    connectionStatus.textContent = 'Online';
    connectionStatus.classList.remove('offline');
    connectionStatus.classList.add('online');
    createNotification('Back online.', 'success');
    syncOfflineQueue();
  }
}

function handleOnline() {
  connectionStatus.textContent = 'Online';
  connectionStatus.classList.remove('offline');
  connectionStatus.classList.add('online');
  createNotification('Connection restored.', 'success');
  syncOfflineQueue();
}

function handleOffline() {
  connectionStatus.textContent = 'Offline';
  connectionStatus.classList.remove('online');
  connectionStatus.classList.add('offline');
  createNotification('Connection lost. Working offline.', 'warning');
}

function downloadReports() {
  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'forest-reports.json';
  link.click();
  URL.revokeObjectURL(url);
}

function startLiveTracking() {
  setInterval(() => {
    patrols = patrols.map((patrol) => ({
      ...patrol,
      location: {
        lat: patrol.location.lat + (Math.random() - 0.5) * 0.01,
        lng: patrol.location.lng + (Math.random() - 0.5) * 0.01,
      },
      lastUpdate: new Date().toLocaleTimeString(),
    }));
    saveLocalState();
    renderPatrols();
    updateMapMarkers();
  }, 15000);
}

loadLocalState();
attachEvents();

if (currentUser) {
  showApp();
  initializeApp();
} else {
  showLogin();
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {
    console.warn('Service worker registration failed');
  });
}
