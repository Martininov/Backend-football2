const express = require("express");
const axios = require("axios");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 RATE LIMIT (anti spam)
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100
}));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;

// 🧠 CACHE
const cache = {
  matches: { data: null, time: 0 },
  live: { data: null, time: 0 },
  leagues: { data: null, time: 0 },
  stats: {}
};

const TTL = {
  LIVE: 15000,
  MATCHES: 60000,
  LEAGUES: 1800000,
  STATS: 120000
};

const headers = {
  "X-API-Key": API_KEY
};

// ROOT
app.get("/", (req, res) => {
  res.send("✅ API FOOTBALL PRO READY");
});

// MATCHES
app.get("/api/matches", async (req, res) => {
  try {
    const now = Date.now();

    if (cache.matches.data && now - cache.matches.time < TTL.MATCHES) {
      return res.json({ source: "cache", data: cache.matches.data });
    }

    const response = await axios.get(`${BASE_URL}/matches`, {
      headers,
      timeout: 10000
    });

    cache.matches = { data: response.data, time: now };

    res.json({ source: "api", data: response.data });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// LIVE
app.get("/api/live", async (req, res) => {
  try {
    const now = Date.now();

    if (cache.live.data && now - cache.live.time < TTL.LIVE) {
      return res.json({ source: "cache", data: cache.live.data });
    }

    const response = await axios.get(`${BASE_URL}/matches`, {
      headers,
      timeout: 10000
    });

    const live = Array.isArray(response.data)
      ? response.data.filter(m => m.status === "incomplete")
      : [];

    cache.live = { data: live, time: now };

    res.json({ source: "api", data: live });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// LEAGUES
app.get("/api/leagues", async (req, res) => {
  try {
    const now = Date.now();

    if (cache.leagues.data && now - cache.leagues.time < TTL.LEAGUES) {
      return res.json({ source: "cache", data: cache.leagues.data });
    }

    const response = await axios.get(`${BASE_URL}/leagues`, {
      headers,
      timeout: 10000
    });

    cache.leagues = { data: response.data, time: now };

    res.json({ source: "api", data: response.data });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// MATCH ID
app.get("/api/match/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const now = Date.now();

    if (cache.stats[id] && now - cache.stats[id].time < TTL.STATS) {
      return res.json({ source: "cache", data: cache.stats[id].data });
    }

    const response = await axios.get(`${BASE_URL}/match/${id}`, {
      headers,
      timeout: 10000
    });

    cache.stats[id] = { data: response.data, time: now };

    res.json({ source: "api", data: response.data });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ANTI CRASH
process.on("unhandledRejection", err => console.error(err));
process.on("uncaughtException", err => console.error(err));

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});