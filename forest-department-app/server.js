const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'server-data');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function ensureFile(filePath, defaultData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function loadData(fileName, defaultData = []) {
  const filePath = path.join(DATA_DIR, fileName);
  ensureFile(filePath, defaultData);
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return defaultData;
  }
}

function saveData(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  ensureFile(filePath, []);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  res.json({ username, role: 'ranger', token: 'demo-token' });
});

app.get('/api/reports', (req, res) => {
  res.json(loadData('reports.json', []));
});

app.post('/api/reports', (req, res) => {
  const report = req.body;
  if (!report || !report.type || !report.location || !report.description) {
    return res.status(400).json({ error: 'Invalid report payload.' });
  }
  const reports = loadData('reports.json', []);
  reports.unshift(report);
  saveData('reports.json', reports);
  res.status(201).json(report);
});

app.get('/api/patrols', (req, res) => {
  res.json(loadData('patrols.json', []));
});

app.post('/api/patrols', (req, res) => {
  const patrol = req.body;
  if (!patrol || !patrol.id || !patrol.name) {
    return res.status(400).json({ error: 'Invalid patrol payload.' });
  }
  const patrols = loadData('patrols.json', []);
  patrols.unshift(patrol);
  saveData('patrols.json', patrols);
  res.status(201).json(patrol);
});

app.post('/api/patrols/:id/status', (req, res) => {
  const patrols = loadData('patrols.json', []);
  const { id } = req.params;
  const updated = req.body;
  const index = patrols.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Patrol not found.' });
  }
  patrols[index] = { ...patrols[index], ...updated };
  saveData('patrols.json', patrols);
  res.json(patrols[index]);
});

app.get('/api/devices', (req, res) => {
  res.json(loadData('devices.json', []));
});

app.post('/api/devices/:id/command', (req, res) => {
  const { id } = req.params;
  const devices = loadData('devices.json', []);
  const index = devices.findIndex((device) => device.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Device not found.' });
  }
  devices[index].lastSeen = new Date().toLocaleTimeString();
  devices[index].status = 'Online';
  saveData('devices.json', devices);
  res.json({ success: true, device: devices[index] });
});

app.get('/api/notifications', (req, res) => {
  res.json(loadData('notifications.json', []));
});

app.post('/api/notifications', (req, res) => {
  const notification = req.body;
  if (!notification || !notification.message) {
    return res.status(400).json({ error: 'Invalid notification payload.' });
  }
  const notifications = loadData('notifications.json', []);
  notifications.unshift(notification);
  saveData('notifications.json', notifications);
  res.status(201).json(notification);
});

app.post('/api/sos', (req, res) => {
  const sos = req.body;
  if (!sos || !sos.type || !sos.description) {
    return res.status(400).json({ error: 'Invalid SOS payload.' });
  }
  const notifications = loadData('notifications.json', []);
  const alert = {
    id: `note-${Date.now()}`,
    title: 'SOS Alert',
    message: sos.description,
    time: new Date().toLocaleTimeString(),
  };
  notifications.unshift(alert);
  saveData('notifications.json', notifications);
  res.status(201).json(alert);
});

app.get('/api/analytics', (req, res) => {
  const reports = loadData('reports.json', []);
  const patrols = loadData('patrols.json', []);
  const devices = loadData('devices.json', []);

  const counts = {
    totalReports: reports.length,
    wildfire: reports.filter((item) => item.type === 'Wildfire').length,
    illegalLogging: reports.filter((item) => item.type === 'Illegal Logging').length,
    wildlife: reports.filter((item) => item.type === 'Wildlife').length,
    fireDetection: reports.filter((item) => item.type === 'Fire Detection').length,
    activePatrols: patrols.filter((item) => item.status === 'On Duty').length,
    devicesOnline: devices.filter((item) => item.status === 'Online').length,
  };

  res.json(counts);
});

app.listen(PORT, () => {
  console.log(`Forest department app server running on http://localhost:${PORT}`);
});
