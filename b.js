// backend/server.js
// Simple Smart-Bhavnagar realtime bus simulator + API
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// ---- Route stops (example Bhavnagar route) ----
const STOPS = [
  { name: "City Bus Stand", lat: 21.7645, lon: 72.1369 },
  { name: "Bhavnagar College", lat: 21.7586, lon: 72.1418 },
  { name: "MG Road", lat: 21.7526, lon: 72.1460 },
  { name: "Sukhadiya Circle", lat: 21.7484, lon: 72.1479 },
  { name: "Motibaug", lat: 21.7422, lon: 72.1507 }
];

// ---- Helper: small Haversine + move interpolation ----
function haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const A = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(A));
}

function moveTowards(from, to, fraction) {
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lon: from.lon + (to.lon - from.lon) * fraction
  };
}

// ---- Create simulated buses ----
const BUSES = []; // will store { id, reg_no, lat, lon, speed_kmph, targetIndex, fractionToNext }

function createSimulatedBuses(n = 3) {
  for (let i = 0; i < n; i++) {
    // place each bus near the first stop with small random offset
    const start = {
      lat: STOPS[0].lat + (Math.random() - 0.5) * 0.002,
      lon: STOPS[0].lon + (Math.random() - 0.5) * 0.002
    };
    BUSES.push({
      id: `BUS-${100 + i}`,
      reg_no: `BHV-${100 + i}`,
      lat: start.lat,
      lon: start.lon,
      speed_kmph: 20 + Math.round(Math.random() * 15), // 20-35
      targetIndex: 1,      // heading to stop index 1
      fractionToNext: 0    // 0..1 progress between current pos and next stop
    });
  }
}
createSimulatedBuses(4);

// ---- Simulator: update bus positions every 2 seconds ----
function simulatorTick() {
  BUSES.forEach(bus => {
    const target = STOPS[bus.targetIndex];
    const distKm = haversineKm(bus.lat, bus.lon, target.lat, target.lon);
    // compute travel fraction this tick assuming tick=2s
    const tickSec = 2;
    const kmPerSec = bus.speed_kmph / 3600;
    const travelKm = kmPerSec * tickSec;
    // if distance is tiny, snap to stop and move to next
    if (distKm <= travelKm || distKm < 0.00005) {
      bus.lat = target.lat;
      bus.lon = target.lon;
      // go to next stop (loop)
      bus.targetIndex = (bus.targetIndex + 1) % STOPS.length;
      // random small speed change
      bus.speed_kmph = Math.max(8, bus.speed_kmph + (Math.random() - 0.5) * 4);
      bus.fractionToNext = 0;
    } else {
      // move a fraction toward target
      const frac = travelKm / distKm; // fraction of remaining distance
      const newPos = moveTowards({ lat: bus.lat, lon: bus.lon }, target, frac);
      bus.lat = newPos.lat;
      bus.lon = newPos.lon;
      bus.fractionToNext = Math.min(1, bus.fractionToNext + frac);
    }
  });
}
setInterval(simulatorTick, 2000);

// ---- APIs ----
// Return all buses with ETA-to-next-stop estimate (simple)
app.get("/buses", (req, res) => {
  const nowHour = new Date().getHours();
  const result = BUSES.map(bus => {
    const target = STOPS[bus.targetIndex];
    const distKm = haversineKm(bus.lat, bus.lon, target.lat, target.lon);
    // naive ETA minutes = dist (km) / (speed kmph) * 60
    const etaMin = (bus.speed_kmph > 0) ? (distKm / bus.speed_kmph) * 60 : null;
    return {
      id: bus.id,
      reg_no: bus.reg_no,
      lat: Number(bus.lat.toFixed(6)),
      lon: Number(bus.lon.toFixed(6)),
      speed_kmph: Math.round(bus.speed_kmph),
      next_stop: target.name,
      distance_to_next_km: Number(distKm.toFixed(3)),
      eta_minutes: etaMin === null ? null : Number(etaMin.toFixed(2))
    };
  });
  res.json({ timestamp: new Date().toISOString(), buses: result });
});

// manual update (optional) to simulate driver update
app.post("/update-location", (req, res) => {
  const { id, lat, lon, speed_kmph } = req.body || {};
  const bus = BUSES.find(b => b.id === id);
  if (!bus) return res.status(404).json({ error: "bus not found" });
  if (lat !== undefined) bus.lat = lat;
  if (lon !== undefined) bus.lon = lon;
  if (speed_kmph !== undefined) bus.speed_kmph = speed_kmph;
  res.json({ ok: true, bus });
});

// route list
app.get("/stops", (req, res) => res.json({ stops: STOPS }));

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Simulator backend running on http://localhost:${PORT}`));
const express = require('express');
const app = express();
const port = 3000;

app.get('/buses', (req, res) => {
  res.json({
    timestamp: Date.now(),
    buses: [
      { id: "Bus-1", reg_no: "GJ-01-1234", next_stop: "Station A", distance_to_next_km: 3, eta_minutes: 5, lat: 21.75, lon: 72.14, speed_kmph: 40 }
    ]
  });
});

app.listen(port, () => console.log(`Simulator backend running on http://localhost:${port}`));
