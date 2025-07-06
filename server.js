const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

const cfgPath  = path.join(__dirname, "config.json");
const statsPath = path.join(__dirname, "stats.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// If config doesn't exist, create with defaults
if (!fs.existsSync(cfgPath)) {
  fs.writeFileSync(cfgPath, JSON.stringify({
    url: "",
    workMins: 60,
    reloadDelay: 10,
    active: false
  }, null, 2));
}

// API: get config
app.get("/bot-config", (req, res) => {
  res.sendFile(cfgPath);
});

// API: update config
app.post("/update-config", (req, res) => {
  fs.writeFileSync(cfgPath, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// API: stats report
app.post("/report-stats", (req, res) => {
  const id = req.body.deviceId || "unknown";
  const now = new Date().toISOString();
  let stats = {};
  if (fs.existsSync(statsPath)) {
    stats = JSON.parse(fs.readFileSync(statsPath));
  }
  stats[id] = { ...req.body, lastUpdated: now };
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  res.json({ ok: true });
});

// API: view stats
app.get("/stats", (req, res) => {
  if (!fs.existsSync(statsPath)) return res.send("No stats yet");
  const data = JSON.parse(fs.readFileSync(statsPath));
  let html = `<h1>Статистика</h1>
    <table border="1" cellpadding="5">
      <tr><th>ID</th><th>Циклы</th><th>Релоады</th><th>Реклама</th><th>Обновлён</th></tr>`;
  for (let [id, s] of Object.entries(data)) {
    html += `<tr><td>${id}</td>
             <td>${s.cycles}</td>
             <td>${s.reloads}</td>
             <td>${s.adsWatched}</td>
             <td>${s.lastUpdated}</td>
             </tr>`;
  }
  html += `</table>`;
  res.send(html);
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));