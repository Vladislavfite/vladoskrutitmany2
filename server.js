const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const configFile = "config.json";
const statsFile = "stats.json";

// Безопасное чтение конфига
function readConfig() {
  if (!fs.existsSync(configFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(configFile));
  } catch {
    return {};
  }
}

app.get("/", (req, res) => {
  const cfg = readConfig();
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>VLADOS KRUTIT – Панель</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-light p-4">
  <div class="container">
    <h1 class="text-warning">VLADOS KRUTIT – Панель управления</h1>
    <form onsubmit="return submitForm(event)" class="bg-secondary p-3 rounded">
      <label class="form-label">Ссылка:</label>
      <input id="url" class="form-control mb-2" required>
      <label class="form-label">Время работы (мин):</label>
      <input id="workMins" type="number" class="form-control mb-2" required>
      <label class="form-label">Задержка (сек):</label>
      <input id="reloadDelay" type="number" class="form-control mb-2" required>
      <div class="form-check form-switch mb-2">
        <input class="form-check-input" type="checkbox" id="active">
        <label class="form-check-label" for="active">Активен</label>
      </div>
      <button class="btn btn-warning">💾 Сохранить</button>
    </form>
    <div class="mt-4">
      <a href="/stats" class="btn btn-outline-light">📊 Статистика</a>
    </div>
  </div>
  <script>
    async function loadConfig() {
      const res = await fetch('/bot-config');
      const cfg = await res.json();
      url.value = cfg.url || "";
      workMins.value = cfg.workMins || 60;
      reloadDelay.value = cfg.reloadDelay || 10;
      active.checked = cfg.active || false;
    }
    async function submitForm(e) {
      e.preventDefault();
      const body = {
        url: url.value,
        workMins: +workMins.value,
        reloadDelay: +reloadDelay.value,
        active: active.checked
      };
      await fetch("/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      alert("✅ Сохранено!");
    }
    loadConfig();
  </script>
</body>
</html>`);
});

// Получить конфиг
app.get("/bot-config", (req, res) => {
  res.json(readConfig());
});

// Сохранить конфиг
app.post("/update-config", (req, res) => {
  fs.writeFileSync(configFile, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// Статистика
app.post("/report-stats", (req, res) => {
  const id = req.body.deviceId;
  const now = new Date().toISOString();
  let stats = {};
  if (fs.existsSync(statsFile)) {
    stats = JSON.parse(fs.readFileSync(statsFile));
  }
  stats[id] = { ...req.body, lastUpdated: now };
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  res.json({ ok: true });
});

app.get("/stats", (req, res) => {
  if (!fs.existsSync(statsFile)) return res.send("No stats yet");
  const stats = JSON.parse(fs.readFileSync(statsFile));
  let html = "<h1>Статистика</h1><table border=1 cellpadding=5><tr><th>ID</th><th>Циклы</th><th>Релоады</th><th>Реклама</th><th>Обновлён</th></tr>";
  for (const [id, s] of Object.entries(stats)) {
    html += `<tr><td>${id}</td><td>${s.cycles}</td><td>${s.reloads}</td><td>${s.adsWatched}</td><td>${s.lastUpdated}</td></tr>`;
  }
  html += "</table>";
  res.send(html);
});

app.listen(PORT, () => console.log("🚀 Server started on port " + PORT));
