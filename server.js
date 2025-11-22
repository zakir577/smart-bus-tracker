// server.js — Cleaned and fixed backend
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors()); // Fixes CORS errors

// Sample buses data
let buses = [
  { id: "Bus-1", reg_no: "GJ-01-1234", next_stop: "Station A", distance_to_next_km: 3, eta_minutes: 5, lat: 21.75, lon: 72.14, speed_kmph: 40 },
  { id: "Bus-2", reg_no: "GJ-01-5678", next_stop: "Station B", distance_to_next_km: 5, eta_minutes: 10, lat: 21.76, lon: 72.15, speed_kmph: 35 }
];

// API endpoint
app.get('/buses', (req, res) => {
  res.json({
    timestamp: Date.now(),
    buses: buses
  });
});

app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
