// Stikart Kongsberg — kartlogikk

const DIFF_COLORS = { gronn: "#2e8b57", rod: "#d63b3b", sort: "#1c1c1c" };
const DIFF_LABELS = { gronn: "Grønn", rod: "Rød", sort: "Sort" };

// --- Kart og bakgrunnslag -------------------------------------------------

const map = L.map("map", { zoomControl: true }).setView([59.665, 9.62], 13);

const baseKartverket = L.tileLayer(
  "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png",
  { maxZoom: 18, attribution: "&copy; Kartverket" }
);
const baseOSM = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap-bidragsytere",
});
baseKartverket.addTo(map);
L.control
  .layers({ "Kartverket topo": baseKartverket, "OpenStreetMap": baseOSM }, null, {
    position: "topright",
    collapsed: false,
  })
  .addTo(map);

// --- GPX-parsing ----------------------------------------------------------

function parseGpx(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const pts = [...doc.getElementsByTagName("trkpt")].map((pt) => ({
    lat: parseFloat(pt.getAttribute("lat")),
    lon: parseFloat(pt.getAttribute("lon")),
    ele: parseFloat(pt.getElementsByTagName("ele")[0]?.textContent ?? "0"),
  }));
  return pts;
}

function haversine(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function routeStats(pts) {
  let dist = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    dist += haversine(pts[i - 1], pts[i]);
    cum.push(dist);
  }
  // Glatt høydene litt før stigning summeres, ellers blåser GPS-støy opp tallet
  const smoothed = pts.map((p, i) => {
    const win = pts.slice(Math.max(0, i - 2), i + 3);
    return win.reduce((s, q) => s + q.ele, 0) / win.length;
  });
  let ascent = 0,
    descent = 0;
  for (let i = 1; i < smoothed.length; i++) {
    const d = smoothed[i] - smoothed[i - 1];
    if (d > 0) ascent += d;
    else descent -= d;
  }
  return {
    km: dist / 1000,
    cum,
    ascent: Math.round(ascent),
    descent: Math.round(descent),
    minEle: Math.min(...pts.map((p) => p.ele)),
    maxEle: Math.max(...pts.map((p) => p.ele)),
  };
}

// --- Ruter ----------------------------------------------------------------

const routeLayers = []; // {route, layer, pts, stats}
let selected = null;

function baseStyle(route) {
  return { color: DIFF_COLORS[route.difficulty], weight: 4, opacity: 0.9 };
}

function selectRoute(entry) {
  if (selected) selected.layer.setStyle(baseStyle(selected.route));
  selected = entry;
  entry.layer.setStyle({ weight: 7, opacity: 1 });
  entry.layer.bringToFront();
  map.fitBounds(entry.layer.getBounds(), { padding: [40, 40] });
  showProfile(entry);
  document
    .querySelectorAll(".route-card")
    .forEach((el) => el.classList.toggle("selected", el.dataset.file === entry.route.file));
}

async function loadRoutes() {
  const list = document.getElementById("route-list");
  for (const route of ROUTES) {
    try {
      const text = await (await fetch(route.file)).text();
      const pts = parseGpx(text);
      if (!pts.length) continue;
      const stats = routeStats(pts);
      const layer = L.polyline(
        pts.map((p) => [p.lat, p.lon]),
        baseStyle(route)
      ).addTo(map);
      const entry = { route, layer, pts, stats };
      layer.on("click", () => selectRoute(entry));
      layer.bindTooltip(route.name, { sticky: true });
      routeLayers.push(entry);

      const card = document.createElement("div");
      card.className = "route-card";
      card.dataset.file = route.file;
      card.dataset.diff = route.difficulty;
      card.innerHTML = `
        <span class="diff-dot" style="background:${DIFF_COLORS[route.difficulty]}"></span>
        <div>
          <div class="route-name">${route.name}</div>
          <div class="route-meta">${DIFF_LABELS[route.difficulty]} &middot; ${stats.km.toFixed(1)} km &middot; ${stats.ascent} m stigning</div>
        </div>`;
      card.addEventListener("click", () => selectRoute(entry));
      list.appendChild(card);
    } catch (err) {
      console.error("Klarte ikke laste", route.file, err);
    }
  }
  if (routeLayers.length) {
    const all = L.featureGroup(routeLayers.map((e) => e.layer));
    map.fitBounds(all.getBounds(), { padding: [40, 40] });
  }
}

// --- Vanskelighetsfilter --------------------------------------------------

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const diff = chip.dataset.diff;
    for (const entry of routeLayers) {
      const show = diff === "alle" || entry.route.difficulty === diff;
      if (show) entry.layer.addTo(map);
      else map.removeLayer(entry.layer);
    }
    document.querySelectorAll(".route-card").forEach((el) => {
      el.style.display = diff === "alle" || el.dataset.diff === diff ? "" : "none";
    });
  });
});

// --- Høydeprofil ----------------------------------------------------------

const panel = document.getElementById("profile-panel");
document.getElementById("profile-close").addEventListener("click", () => {
  panel.classList.add("hidden");
  if (selected) selected.layer.setStyle(baseStyle(selected.route));
  selected = null;
  document.querySelectorAll(".route-card").forEach((el) => el.classList.remove("selected"));
});

function showProfile(entry) {
  const { route, pts, stats } = entry;
  document.getElementById("profile-name").textContent = route.name;
  document.getElementById("profile-stats").textContent =
    ` ${stats.km.toFixed(1)} km · +${stats.ascent} m / −${stats.descent} m · ` +
    `${Math.round(stats.minEle)}–${Math.round(stats.maxEle)} moh.`;

  const svg = document.getElementById("profile-svg");
  const W = 1000,
    H = 160,
    pad = 6;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const span = Math.max(stats.maxEle - stats.minEle, 10);
  const total = stats.cum[stats.cum.length - 1] || 1;
  const xy = (i) => {
    const x = pad + (stats.cum[i] / total) * (W - 2 * pad);
    const y = H - pad - ((pts[i].ele - stats.minEle) / span) * (H - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const line = pts.map((_, i) => xy(i)).join(" ");
  const color = DIFF_COLORS[route.difficulty];
  svg.innerHTML = `
    <polygon points="${pad},${H - pad} ${line} ${W - pad},${H - pad}"
             fill="${color}" opacity="0.15"/>
    <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
  panel.classList.remove("hidden");
}

// --- Punkter fra kommunens data -------------------------------------------

function poiLayer(url, color, labelFn) {
  const group = L.layerGroup();
  fetch(url)
    .then((r) => r.json())
    .then((geojson) => {
      L.geoJSON(geojson, {
        pointToLayer: (ft, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            fillColor: color,
            fillOpacity: 0.9,
            color: "#fff",
            weight: 1.5,
          }).bindPopup(labelFn(ft.properties)),
      }).addTo(group);
    })
    .catch((err) => console.error("Klarte ikke laste", url, err));
  return group;
}

const poiLayers = {
  "poi-gapahuk": poiLayer("data/gapahuk.geojson", "#8b5a2b", (p) => p.NAVN || "Gapahuk"),
  "poi-baalplass": poiLayer("data/baalplass.geojson", "#e67e22", (p) => p.NAVN || "Bålplass"),
  "poi-benk": poiLayer("data/sittebenk.geojson", "#3b7dd8", (p) => p.NAVN || "Benk"),
};

// Kommunens merkede sykkelruter som eget referanselag (stiplet blå)
const kommuneRuter = L.layerGroup();
for (const f of ["data/sykkelrute_sti.geojson", "data/sykkelrute_vei.geojson"]) {
  fetch(f)
    .then((r) => r.json())
    .then((geojson) => {
      L.geoJSON(geojson, {
        style: { color: "#2a6fd6", weight: 2, dashArray: "6 6", opacity: 0.7 },
      })
        .bindTooltip("Kommunens merkede sykkelrute", { sticky: true })
        .addTo(kommuneRuter);
    });
}
poiLayers["poi-kommune"] = kommuneRuter;

for (const [id, layer] of Object.entries(poiLayers)) {
  const box = document.getElementById(id);
  if (box.checked) layer.addTo(map);
  box.addEventListener("change", () => {
    if (box.checked) layer.addTo(map);
    else map.removeLayer(layer);
  });
}

loadRoutes();
