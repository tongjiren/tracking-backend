const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
 // Optional: Serve HTML files from /public

// Health check
app.get('/', (req, res) => {
  res.send('🚀 Tracking Backend is running!');
});

// Path to tracking data file
const DATA_FILE = path.join(__dirname, 'tracking-data.json');

// Read JSON data
function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading JSON:', err);
    return [];
  }
}

// Write JSON data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing JSON:', err);
  }
}

// POST: Add or update tracking data
app.post('/api/tracking', (req, res) => {
  const { trackingNumber, history } = req.body;

  if (!trackingNumber || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const upperTrackNum = trackingNumber.toUpperCase();
  const data = readData();
  const index = data.findIndex(item => item.trackingNumber === upperTrackNum);

  if (index >= 0) {
    data[index].history = history;
  } else {
    data.push({ trackingNumber: upperTrackNum, history });
  }

  writeData(data);
  res.status(200).json({ message: 'Tracking data saved' });
});

// GET: Fetch tracking data by tracking number
app.get('/api/tracking/:trackingNumber', (req, res) => {
  const trackingNumber = req.params.trackingNumber.toUpperCase();
  const data = readData();
  const item = data.find(d => d.trackingNumber === trackingNumber);

  if (!item) return res.status(404).json({ error: 'Tracking number not found' });

  res.status(200).json(item);
});

// ✅ GET: Return all tracking entries
app.get('/api/tracking', (req, res) => {
  const data = readData();
  res.status(200).json(data);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
