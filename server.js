const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Path to JSON database
const DATA_FILE = path.join(__dirname, 'data', 'parcels.json');

// Ensure data directory and file exist
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Read parcels from JSON file
function readParcels() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading parcels:', error);
    return [];
  }
}

// Write parcels to JSON file
function writeParcels(parcels) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(parcels, null, 2), 'utf8');
    console.log('Parcels saved successfully');
  } catch (error) {
    console.error('Error writing parcels:', error);
  }
}

// API: Get parcel by tracking code
app.get('/api/track/:code', (req, res) => {
  const parcels = readParcels();
  const parcel = parcels.find(p => p.trackingCode === req.params.code);
  
  if (parcel) {
    res.json(parcel);
  } else {
    res.status(404).json({ error: 'Parcel not found' });
  }
});

// API: Get all parcels (for admin)
app.get('/api/parcels', (req, res) => {
  const parcels = readParcels();
  res.json(parcels);
});

// API: Add new parcel with full receiver details
app.post('/api/parcels', (req, res) => {
  const parcels = readParcels();
  
  const { trackingCode, status, location, receiverName, receiverEmail, receiverPhone, deliveryAddress } = req.body;
  
  if (!trackingCode || !status || !location || !receiverName || !receiverEmail || !receiverPhone || !deliveryAddress) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (parcels.find(p => p.trackingCode === trackingCode)) {
    return res.status(400).json({ error: 'Tracking code already exists' });
  }
  
  const newParcel = {
    trackingCode,
    status,
    location,
    receiverName,
    receiverEmail,
    receiverPhone,
    deliveryAddress,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  parcels.push(newParcel);
  writeParcels(parcels);
  
  console.log('New parcel created:', trackingCode);
  res.json(newParcel);
});

// API: Update parcel
app.put('/api/parcels/:code/full', (req, res) => {
  const parcels = readParcels();
  const index = parcels.findIndex(p => p.trackingCode === req.params.code);
  
  if (index !== -1) {
    const { status, location, receiverName, receiverEmail, receiverPhone, deliveryAddress } = req.body;
    
    parcels[index] = {
      ...parcels[index],
      status,
      location,
      receiverName,
      receiverEmail,
      receiverPhone,
      deliveryAddress,
      lastUpdated: new Date().toISOString()
    };
    
    writeParcels(parcels);
    console.log('Parcel updated:', req.params.code);
    res.json(parcels[index]);
  } else {
    res.status(404).json({ error: 'Parcel not found' });
  }
});

// API: Delete parcel
app.delete('/api/parcels/:code', (req, res) => {
  const parcels = readParcels();
  const filtered = parcels.filter(p => p.trackingCode !== req.params.code);
  
  if (parcels.length !== filtered.length) {
    writeParcels(filtered);
    console.log('Parcel deleted:', req.params.code);
    res.json({ message: 'Parcel deleted' });
  } else {
    res.status(404).json({ error: 'Parcel not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});