const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MongoDB schema and model
const trackingSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true },
  history: { type: Array, default: [] }
});

const Tracking = mongoose.model('Tracking', trackingSchema);

// 🔧 Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Health check
app.get('/', (req, res) => {
  res.send('🚀 Tracking Backend is running!');
});

// ✅ POST: Add or update tracking data (append to history instead of overwrite)
app.post('/api/tracking', async (req, res) => {
  const { trackingNumber, history } = req.body;
  console.log('🟡 Received:', req.body);

  if (!trackingNumber || !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  try {
    const updated = await Tracking.findOneAndUpdate(
      { trackingNumber: trackingNumber.toUpperCase() },
      { $push: { history: { $each: history } } }, // ✅ Append entries instead of replacing
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Tracking data saved', entry: updated });
  } catch (err) {
    console.error('Error saving tracking data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET: Fetch tracking data by tracking number
app.get('/api/tracking/:trackingNumber', async (req, res) => {
  const trackingNumber = req.params.trackingNumber.toUpperCase();

  try {
    const entry = await Tracking.findOne({ trackingNumber });

    if (!entry) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }

    res.status(200).json(entry);
  } catch (err) {
    console.error('Error fetching tracking number:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET: Return all tracking entries
app.get('/api/tracking', async (req, res) => {
  try {
    const allEntries = await Tracking.find();
    res.status(200).json(allEntries);
  } catch (err) {
    console.error('Error fetching all entries:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Connect to MongoDB and start server
console.log('🔧 Connecting to MongoDB...');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
n