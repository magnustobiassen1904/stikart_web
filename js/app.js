// Stikart Kongsberg — kartlogikk

const DIFF_COLORS = { gronn: "#3a7d4e", bla: "#2b6fb5", rod: "#c03b2d", sort: "#1b1f24" };
const DIFF_LABELS = { gronn: "Grønn", bla: "Blå", rod: "Rød", sort: "Sort" };
const HALO_COLOR = "#f3f6f9";

// --- Kart og bakgrunnslag -------------------------------------------------

const map = L.map("map", { zoomControl: true }).setView([59.665, 9.62], 13);
map.zoomControl.setPosition("topright");

const KARTVERKET_URL =
  "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png";
L.tileLayer(KARTVERKET_URL, { maxZoom: 18, attribution: "&copy; Kartverket" }).addTo(map);

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

// --- Views (faner) --------------------------------------------------------

const VIEWS = ["kart", "ruter", "punkter", "om"];
let miniMapsBuilt = false;

function currentView() {
  const h = location.hash.replace("#", "");
  return VIEWS.includes(h) ? h : "kart";
}

function showView(name) {
  for (const v of VIEWS) {
    document.getElementById(`view-${v}`).classList.toggle("hidden", v !== name);
  }
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.view === name);
  });
  if (name === "kart") setTimeout(() => map.invalidateSize(), 0);
  if (name === "ruter" && !miniMapsBuilt) {
    miniMapsBuilt = true;
    setTimeout(buildMiniMaps, 0);
  }
}

window.addEventListener("hashchange", () => showView(currentView()));

// --- Ruter ----------------------------------------------------------------

const routeLayers = []; // {route, layer, halo, group, pts, stats, card, gridCard}
let selected = null;
let hoverMarker = null;

function baseStyle(route) {
  return {
    color: DIFF_COLORS[route.difficulty],
    weight: route.transport ? 3.5 : 4.5,
    opacity: 0.95,
    dashArray: route.transport ? "1 10" : null,
    lineCap: "round",
  };
}

// Nedfarter har nesten null stigning — bruk største av stigning/fall som høydemeter
function hmOf(stats) {
  return Math.max(stats.ascent, stats.descent);
}

function metaLine(route, stats) {
  return `${DIFF_LABELS[route.difficulty]} · ${stats.km.toFixed(1).replace(".", ",")} km · ${hmOf(stats)} hm`;
}

// Profilkurvene tegner lokale variasjoner forsterket (x2.5) rundt trenden —
// en jevn nedfart blir ellers en rett strek der kuler og sva drukner.
// Tooltip og statistikk bruker alltid ekte høyder.
function exaggeratedEles(pts, factor) {
  const n = pts.length;
  const win = Math.max(5, Math.floor(n * 0.08));
  // Trailguide-høyder er grovt kvantisert — glatt lett før forsterkning,
  // ellers blir kvantiseringstrinnene til hakkete klipper i profilen
  const raw = pts.map((p) => p.ele);
  const eles = raw.map((_, i) => {
    const lo = Math.max(0, i - 2);
    const hi = Math.min(n, i + 3);
    let s = 0;
    for (let j = lo; j < hi; j++) s += raw[j];
    return s / (hi - lo);
  });
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - win);
    const hi = Math.min(n, i + win + 1);
    let s = 0;
    for (let j = lo; j < hi; j++) s += eles[j];
    const trend = s / (hi - lo);
    out[i] = trend + factor * (eles[i] - trend);
  }
  return out;
}

let lastSelectAt = 0; // skiller ruteklikk fra «klikk i tomt kart» (samme DOM-event når map-click fyrer etterpå)

function selectRoute(entry) {
  lastSelectAt = performance.now();
  if (selected) selected.layer.setStyle(baseStyle(selected.route));
  selected = entry;
  entry.layer.setStyle({ weight: entry.route.transport ? 5 : 6.5, opacity: 1 });
  entry.halo.bringToFront();
  entry.layer.bringToFront();
  entry.hit.bringToFront();
  map.flyToBounds(entry.layer.getBounds(), { padding: [60, 60], duration: 0.9 });
  showDetail(entry);
  document
    .querySelectorAll(".route-card")
    .forEach((el) => el.classList.toggle("selected", el.dataset.file === entry.route.file));
}

function registerRoute(route, pts) {
  const stats = routeStats(pts);
  const latlngs = pts.map((p) => [p.lat, p.lon]);
  const halo = L.polyline(latlngs, {
    color: HALO_COLOR,
    weight: 9,
    opacity: 1,
    dashArray: route.transport ? "1 10" : null,
    lineCap: "round",
  }).addTo(map);
  const layer = L.polyline(latlngs, baseStyle(route)).addTo(map);
  // Usynlig, bred linje oppå — gjør ruta mye lettere å treffe med musa
  const hit = L.polyline(latlngs, { color: "#000", opacity: 0, weight: 24, lineCap: "round" }).addTo(
    map
  );
  const entry = { route, layer, halo, hit, pts, stats };
  const mid = pts[Math.floor(pts.length / 2)];
  entry.label = L.tooltip({
    permanent: true,
    direction: "top",
    className: "route-label",
    opacity: 1,
    offset: [0, -6],
  })
    .setContent(
      `<span class="label-dot" style="background:${DIFF_COLORS[route.difficulty]}"></span>` +
        route.name.replace(/\s*\(.*\)$/, "")
    )
    .setLatLng([mid.lat, mid.lon]);
  entry.disp = exaggeratedEles(pts, 2.5);
  entry.dispMin = Math.min(...entry.disp);
  entry.dispSpan = Math.max(Math.max(...entry.disp) - entry.dispMin, 10);
  hit.on("click", () => selectRoute(entry));
  hit.bindTooltip(route.name, { sticky: true });

  // Kort i venstremenyen
  const card = document.createElement("div");
  card.className = "route-card";
  card.dataset.file = route.file;
  card.innerHTML = `
    <span class="diff-dot" style="background:${DIFF_COLORS[route.difficulty]}"></span>
    <div>
      <div class="route-name">${route.name}</div>
      <div class="route-meta">${metaLine(route, stats)}</div>
    </div>`;
  card.addEventListener("click", () => selectRoute(entry));
  document.getElementById("route-list").appendChild(card);
  entry.card = card;

  // Kort i galleriet
  entry.gridCard = buildGridCard(entry);

  routeLayers.push(entry);
  return entry;
}

async function loadRoutes() {
  for (const route of ROUTES) {
    try {
      const text = await (await fetch(route.file)).text();
      const pts = parseGpx(text);
      if (!pts.length) continue;
      registerRoute(route, pts);
    } catch (err) {
      console.error("Klarte ikke laste", route.file, err);
    }
  }
  if (routeLayers.length) {
    const all = L.featureGroup(routeLayers.map((e) => e.layer));
    map.fitBounds(all.getBounds(), { padding: [40, 40] });
  }
  updateCounts();
  updateLabels();
  sortGrid();
  if (currentView() === "ruter") {
    miniMapsBuilt = true;
    buildMiniMaps();
  }
}

// --- Filtre (deles av kart-view og ruter-view) ----------------------------

const filterState = { diff: "alle", len: null, hm: null };

function inRange(val, range) {
  if (!range) return true;
  const [lo, hi] = range.split("-").map(Number);
  return val >= lo && val < hi;
}

function entryVisible(entry) {
  const { route, stats } = entry;
  if (filterState.diff !== "alle" && route.difficulty !== filterState.diff) return false;
  if (!inRange(stats.km, filterState.len)) return false;
  if (!inRange(hmOf(stats), filterState.hm)) return false;
  return true;
}

function applyFilters() {
  for (const entry of routeLayers) {
    const show = entryVisible(entry);
    if (show) {
      entry.halo.addTo(map);
      entry.layer.addTo(map);
      entry.hit.addTo(map);
      entry.layer.bringToFront();
      entry.hit.bringToFront();
    } else {
      map.removeLayer(entry.layer);
      map.removeLayer(entry.halo);
      map.removeLayer(entry.hit);
    }
    entry.card.style.display = show ? "" : "none";
    entry.gridCard.style.display = show ? "" : "none";
  }
  updateLabels();
}

// Rutenavn på kartet — vises først når man er zoomet litt inn, ellers blir det kaos
const LABEL_MIN_ZOOM = 13;
function updateLabels() {
  const zoomedIn = map.getZoom() >= LABEL_MIN_ZOOM;
  for (const entry of routeLayers) {
    const on = zoomedIn && entryVisible(entry);
    if (on && !map.hasLayer(entry.label)) {
      entry.label.addTo(map);
      wireLabel(entry);
    }
    if (!on && map.hasLayer(entry.label)) entry.label.remove();
  }
}
map.on("zoomend", updateLabels);

// Navnepillene er også klikkbare — velger ruta
function wireLabel(entry) {
  const el = entry.label.getElement();
  if (!el || el.dataset.wired) return;
  el.dataset.wired = "1";
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    selectRoute(entry);
  });
}

// Klikk i tomt kart lukker valgt rute (ruteklikk fyrer map-click rett etter selectRoute — ignorér de)
map.on("click", () => {
  if (selected && performance.now() - lastSelectAt > 250) closeDetail();
});

function updateCounts() {
  const counts = { alle: routeLayers.length, gronn: 0, bla: 0, rod: 0, sort: 0 };
  for (const e of routeLayers) counts[e.route.difficulty]++;
  document.querySelectorAll(".chip .count, .gchip .count").forEach((el) => {
    const diff = el.closest("[data-diff]").dataset.diff;
    el.textContent = counts[diff];
  });
  document.querySelectorAll(".chip[data-diff], .gchip[data-diff]").forEach((c) => {
    if (c.dataset.diff !== "alle") c.style.display = counts[c.dataset.diff] ? "" : "none";
  });
  document.getElementById("ruter-subtitle").textContent =
    `${counts.alle} sykkelbare stier i Gruveåsen og Knuteområdet`;
}

function setDiffFilter(diff) {
  filterState.diff = diff;
  document.querySelectorAll(".chip[data-diff], .gchip[data-diff]").forEach((c) => {
    c.classList.toggle("active", c.dataset.diff === diff);
  });
  applyFilters();
}

document.querySelectorAll(".chip[data-diff], .gchip[data-diff]").forEach((chip) => {
  chip.addEventListener("click", () => setDiffFilter(chip.dataset.diff));
});

document.querySelectorAll(".fchip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const group = chip.dataset.group;
    const wasActive = chip.classList.contains("active");
    document
      .querySelectorAll(`.fchip[data-group="${group}"]`)
      .forEach((c) => c.classList.remove("active"));
    if (wasActive) {
      filterState[group] = null;
    } else {
      chip.classList.add("active");
      filterState[group] = chip.dataset.val;
    }
    applyFilters();
  });
});

const filterToggle = document.getElementById("filter-toggle");
filterToggle.addEventListener("click", () => {
  const panel = document.getElementById("filter-panel");
  const open = panel.classList.toggle("hidden");
  filterToggle.setAttribute("aria-expanded", String(!open));
});

// --- Detaljkort med interaktiv høydeprofil --------------------------------

const detailCard = document.getElementById("detail-card");
const detailSvg = document.getElementById("detail-svg");
let PROFILE_W = 700;
const PROFILE_H = 84;
const PROFILE_PAD = 4;

// Profilkurven farges etter bratthet (ekte helning målt over ±60 m)
const SLOPE_COLORS = [
  { max: 7, color: "#3a7d4e" },
  { max: 14, color: "#b3872e" },
  { max: 22, color: "#c03b2d" },
  { max: Infinity, color: "#1b1f24" },
];

function slopeColorAt(entry, i) {
  const { pts, stats } = entry;
  const R = 60;
  let a = i,
    b = i;
  while (a > 0 && stats.cum[i] - stats.cum[a] < R) a--;
  while (b < pts.length - 1 && stats.cum[b] - stats.cum[i] < R) b++;
  const dd = stats.cum[b] - stats.cum[a] || 1;
  const grade = Math.abs((pts[b].ele - pts[a].ele) / dd) * 100;
  return SLOPE_COLORS.find((s) => grade < s.max).color;
}

// Del punktindeksene i sammenhengende løp med samme bratthetsfarge
// (hvert løp starter der forrige slutter, så kurven blir uten hull)
function slopeRuns(entry, idxs) {
  const runs = [];
  let cur = null;
  for (const i of idxs) {
    const color = slopeColorAt(entry, i);
    if (!cur || cur.color !== color) {
      if (cur) {
        cur.idx.push(i);
        runs.push(cur);
      }
      cur = { color, idx: [i] };
    } else {
      cur.idx.push(i);
    }
  }
  if (cur) runs.push(cur);
  return runs;
}

document.getElementById("detail-close").addEventListener("click", closeDetail);

function closeDetail() {
  detailCard.classList.add("hidden");
  if (selected) selected.layer.setStyle(baseStyle(selected.route));
  selected = null;
  removeHoverMarker();
  document.querySelectorAll(".route-card").forEach((el) => el.classList.remove("selected"));
}

function removeHoverMarker() {
  if (hoverMarker) {
    map.removeLayer(hoverMarker);
    hoverMarker = null;
  }
}

// Profilhøyden skaleres etter reell bratthet (vertikal overdrivelse ×1.6, maks
// full boks) — slik at en slak grusvei faktisk ser slakere ut enn en bratt nedfart
const PROFILE_EXAG = 1.6;
function profileScale(entry, w, usable) {
  const total = entry.stats.cum[entry.stats.cum.length - 1] || 1;
  const span = entry.stats.maxEle - entry.stats.minEle;
  return Math.min(1, (PROFILE_EXAG * span * w) / (total * usable));
}

function profileXY(entry, i) {
  const { stats } = entry;
  const total = stats.cum[stats.cum.length - 1] || 1;
  const x = PROFILE_PAD + (stats.cum[i] / total) * (PROFILE_W - 2 * PROFILE_PAD);
  const usable = PROFILE_H - 26 - PROFILE_PAD;
  const scale = profileScale(entry, PROFILE_W - 2 * PROFILE_PAD, usable);
  const y =
    PROFILE_H -
    PROFILE_PAD -
    ((entry.disp[i] - entry.dispMin) / entry.dispSpan) * usable * scale;
  return [x, y];
}

function showDetail(entry) {
  const { route, pts, stats } = entry;
  document.getElementById("detail-name").textContent = route.name;
  const badge = document.getElementById("detail-badge");
  badge.textContent = DIFF_LABELS[route.difficulty];
  badge.style.background = DIFF_COLORS[route.difficulty];
  document.getElementById("detail-stats").textContent =
    `${stats.km.toFixed(1).replace(".", ",")} km · +${stats.ascent} m / −${stats.descent} m · ` +
    `${Math.round(stats.minEle)}–${Math.round(stats.maxEle)} moh.`;
  const gpx = document.getElementById("detail-gpx");
  gpx.href = route.file;
  gpx.download = route.file.split("/").pop();
  document.getElementById("detail-desc").textContent = route.description || "";

  detailCard.classList.remove("hidden");
  PROFILE_W = Math.max(detailSvg.clientWidth || 700, 300);
  detailSvg.setAttribute("viewBox", `0 0 ${PROFILE_W} ${PROFILE_H}`);
  const line = pts.map((_, i) => profileXY(entry, i).join(",")).join(" ");
  const color = DIFF_COLORS[route.difficulty];
  const idxs = pts.map((_, i) => i);
  const segs = slopeRuns(entry, idxs)
    .map(
      (r) =>
        `<polyline points="${r.idx.map((i) => profileXY(entry, i).join(",")).join(" ")}"
           fill="none" stroke="${r.color}" stroke-width="2.5" stroke-linecap="round"/>`
    )
    .join("");
  detailSvg.innerHTML = `
    <polygon points="${PROFILE_PAD},${PROFILE_H} ${line} ${PROFILE_W - PROFILE_PAD},${PROFILE_H}"
             fill="${color}" opacity="0.12"/>
    ${segs}
    <g id="hover-group" style="display:none">
      <line id="hover-line" y1="22" y2="${PROFILE_H}" stroke="${color}" stroke-width="1"
            stroke-dasharray="3 3"/>
      <circle id="hover-dot" r="5" fill="${color}" stroke="#fff" stroke-width="2"/>
      <rect id="hover-pill" y="0" width="124" height="20" rx="10" fill="#16283e"/>
      <text id="hover-text" y="13.5" font-size="11" fill="#eef2f6" text-anchor="middle"
            font-family="Figtree, sans-serif" font-weight="600"></text>
    </g>`;
}

detailSvg.addEventListener("mousemove", (ev) => {
  if (!selected) return;
  const rect = detailSvg.getBoundingClientRect();
  const frac = Math.min(Math.max((ev.clientX - rect.left) / rect.width, 0), 1);
  const { pts, stats } = selected;
  const target = frac * (stats.cum[stats.cum.length - 1] || 1);
  let i = stats.cum.findIndex((d) => d >= target);
  if (i < 0) i = pts.length - 1;

  const [x, y] = profileXY(selected, i);
  const group = detailSvg.querySelector("#hover-group");
  group.style.display = "";
  const lineEl = detailSvg.querySelector("#hover-line");
  lineEl.setAttribute("x1", x);
  lineEl.setAttribute("x2", x);
  const dot = detailSvg.querySelector("#hover-dot");
  dot.setAttribute("cx", x);
  dot.setAttribute("cy", y);
  const pill = detailSvg.querySelector("#hover-pill");
  const pillX = Math.min(Math.max(x - 62, 0), PROFILE_W - 124);
  pill.setAttribute("x", pillX);
  const text = detailSvg.querySelector("#hover-text");
  text.setAttribute("x", pillX + 62);
  const km = (stats.cum[i] / 1000).toFixed(1).replace(".", ",");
  text.textContent = `${km} km · ${Math.round(pts[i].ele)} moh.`;

  const ll = [pts[i].lat, pts[i].lon];
  if (!hoverMarker) {
    hoverMarker = L.circleMarker(ll, {
      radius: 7,
      color: "#fff",
      weight: 2.5,
      fillColor: DIFF_COLORS[selected.route.difficulty],
      fillOpacity: 1,
    }).addTo(map);
  } else {
    hoverMarker.setLatLng(ll);
  }
});

detailSvg.addEventListener("mouseleave", () => {
  const group = detailSvg.querySelector("#hover-group");
  if (group) group.style.display = "none";
  removeHoverMarker();
});

// --- Ruter-view: kortgalleri ----------------------------------------------

const routeGrid = document.getElementById("route-grid");

function miniProfileSvg(entry, w, h) {
  const { pts, stats } = entry;
  const total = stats.cum[stats.cum.length - 1] || 1;
  const step = Math.max(1, Math.floor(pts.length / 120));
  const idxs = [];
  for (let i = 0; i < pts.length; i += step) idxs.push(i);
  const usable = h - 8;
  const scale = profileScale(entry, w, usable);
  const xy = (i) => {
    const x = (stats.cum[i] / total) * w;
    const y = h - 3 - ((entry.disp[i] - entry.dispMin) / entry.dispSpan) * usable * scale;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const area = idxs.map(xy).join(" ");
  const segs = slopeRuns(entry, idxs)
    .map(
      (r) =>
        `<polyline points="${r.idx.map(xy).join(" ")}" fill="none" stroke="${r.color}"
           stroke-width="2" stroke-linecap="round"/>`
    )
    .join("");
  return { area, segs };
}

function buildGridCard(entry) {
  const { route, stats } = entry;
  const color = DIFF_COLORS[route.difficulty];
  const card = document.createElement("div");
  card.className = "grid-card";
  const prof = miniProfileSvg(entry, 240, 36);
  const status = route.temp ? "Forhåndsvisning — ikke lagret" : "Åpen · tørr sti";
  card.innerHTML = `
    <div class="grid-map">
      <div class="mini-map"></div>
      <span class="grid-diff-dot" style="background:${color}"></span>
    </div>
    <div class="grid-body">
      <span class="grid-name">${route.name}</span>
      <span class="grid-meta">${metaLine(route, stats)}</span>
      <svg class="grid-profile" viewBox="0 0 240 36" preserveAspectRatio="none">
        <polygon points="0,36 ${prof.area} 240,36" fill="rgba(31,86,136,0.1)"/>
        ${prof.segs}
      </svg>
      <div class="grid-footer">
        <a class="gpx-link" href="${route.file}" download>↓ GPX</a>
        <span class="grid-status">${status}</span>
      </div>
    </div>`;
  card.addEventListener("click", (ev) => {
    if (ev.target.closest(".gpx-link")) return;
    location.hash = "#kart";
    showView("kart");
    setTimeout(() => selectRoute(entry), 60);
  });
  routeGrid.insertBefore(card, document.getElementById("dropzone"));
  return card;
}

function buildMiniMaps() {
  for (const entry of routeLayers) {
    const el = entry.gridCard.querySelector(".mini-map");
    if (!el || el.dataset.built) continue;
    el.dataset.built = "1";
    const mini = L.map(el, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });
    L.tileLayer(KARTVERKET_URL, { maxZoom: 18 }).addTo(mini);
    const latlngs = entry.pts.map((p) => [p.lat, p.lon]);
    L.polyline(latlngs, { color: HALO_COLOR, weight: 6, opacity: 1 }).addTo(mini);
    L.polyline(latlngs, {
      color: DIFF_COLORS[entry.route.difficulty],
      weight: 3,
      opacity: 1,
    }).addTo(mini);
    L.circleMarker(latlngs[0], {
      radius: 4,
      color: "#fff",
      weight: 2,
      fillColor: DIFF_COLORS[entry.route.difficulty],
      fillOpacity: 1,
    }).addTo(mini);
    mini.fitBounds(L.latLngBounds(latlngs), { padding: [14, 14] });
  }
}

// --- Sortering -------------------------------------------------------------

const SORT_MODES = [
  { key: "lengde", label: "Sorter: lengde ▾", cmp: (a, b) => a.stats.km - b.stats.km },
  { key: "høydemeter", label: "Sorter: høydemeter ▾", cmp: (a, b) => hmOf(b.stats) - hmOf(a.stats) },
  { key: "navn", label: "Sorter: navn ▾", cmp: (a, b) => a.route.name.localeCompare(b.route.name, "no") },
];
let sortIdx = 0;

function sortGrid() {
  const mode = SORT_MODES[sortIdx];
  const dropzone = document.getElementById("dropzone");
  [...routeLayers]
    .sort(mode.cmp)
    .forEach((e) => routeGrid.insertBefore(e.gridCard, dropzone));
}

document.getElementById("sort-btn").addEventListener("click", () => {
  sortIdx = (sortIdx + 1) % SORT_MODES.length;
  document.getElementById("sort-btn").textContent = SORT_MODES[sortIdx].label;
  sortGrid();
});

// --- Dropsone: forhåndsvis GPX --------------------------------------------

const dropzone = document.createElement("div");
dropzone.id = "dropzone";
dropzone.innerHTML = `
  <div class="dropzone-inner">
    <span class="dropzone-plus">+</span>
    <span class="dropzone-title">Legg til rute</span>
    <span class="dropzone-sub">Slipp en GPX-fil her</span>
  </div>`;
routeGrid.appendChild(dropzone);

const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = ".gpx";
fileInput.style.display = "none";
document.body.appendChild(fileInput);

function previewGpxFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const pts = parseGpx(reader.result);
    if (!pts.length) {
      alert("Fant ingen sporpunkter i fila — er det en GPX med <trkpt>?");
      return;
    }
    const route = {
      file: URL.createObjectURL(file),
      name: file.name.replace(/\.gpx$/i, "") + " (forhåndsvisning)",
      difficulty: "bla",
      temp: true,
      description: "Forhåndsvisning — ikke lagret.",
    };
    const entry = registerRoute(route, pts);
    updateCounts();
    sortGrid();
    if (miniMapsBuilt) buildMiniMaps();
    alert(
      "Ruta vises nå som forhåndsvisning (blå). For å lagre den permanent: " +
        "legg GPX-fila i routes/ og registrer den i js/routes.js."
    );
    location.hash = "#kart";
    showView("kart");
    selectRoute(entry);
  };
  reader.readAsText(file);
}

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) previewGpxFile(fileInput.files[0]);
  fileInput.value = "";
});
dropzone.addEventListener("dragover", (ev) => {
  ev.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (ev) => {
  ev.preventDefault();
  dropzone.classList.remove("dragover");
  const file = [...ev.dataTransfer.files].find((f) => /\.gpx$/i.test(f.name));
  if (file) previewGpxFile(file);
});

// --- Punkter fra kommunens data -------------------------------------------

function poiLayer(url, color, labelFn, radius = 6) {
  const group = L.layerGroup();
  fetch(url)
    .then((r) => r.json())
    .then((geojson) => {
      L.geoJSON(geojson, {
        pointToLayer: (ft, latlng) =>
          L.circleMarker(latlng, {
            radius,
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
  "poi-gapahuk": poiLayer("data/gapahuk.geojson", "#3a7d4e", (p) => p.NAVN || "Gapahuk"),
  "poi-baalplass": poiLayer("data/baalplass.geojson", "#b3872e", (p) => p.NAVN || "Bålplass"),
  "poi-benk": poiLayer("data/sittebenk.geojson", "#1f5688", (p) => p.NAVN || "Benk"),
  // Fra OSM: Korset m.fl. + navngitte gruver/sjakter i stiområdet
  "poi-minnesmerke": poiLayer(
    "data/minnesmerker.geojson",
    "#7a5a1d",
    (p) => `<b>${p.name}</b>` + (p.sub ? `<br>${p.sub}` : "")
  ),
  "poi-gruveminne": poiLayer("data/gruveminner.geojson", "#5d4037", (p) => p.name, 4),
  "poi-utsikt": poiLayer("data/utsiktspunkt.geojson", "#7b4b94", (p) => p.name),
  "poi-rast": poiLayer("data/rasteplass.geojson", "#e08a00", (p) => p.name, 4),
  "poi-bad": poiLayer("data/badeplass.geojson", "#2a9dd6", (p) => p.name),
  "poi-vann": poiLayer("data/drikkevann.geojson", "#16a5a3", (p) => p.name),
  "poi-parkering": poiLayer(
    "data/parkering.geojson",
    "#5a6673",
    (p) => `<b>${p.name}</b>` + (p.sub ? `<br>${p.sub}` : "")
  ),
};

// Kommunens merkede sykkelruter som eget referanselag (stiplet blå)
const kommuneRuter = L.layerGroup();
for (const f of ["data/sykkelrute_sti.geojson", "data/sykkelrute_vei.geojson"]) {
  fetch(f)
    .then((r) => r.json())
    .then((geojson) => {
      L.geoJSON(geojson, {
        style: { color: "#1f5688", weight: 2, dashArray: "6 6", opacity: 0.6 },
      })
        .bindTooltip("Kommunens merkede sykkelrute", { sticky: true })
        .addTo(kommuneRuter);
    });
}
poiLayers["poi-kommune"] = kommuneRuter;

// Skiheisen (Kongsberg skisenter) — geometri fra OSM i data/heis.geojson
const heisLayer = L.layerGroup();
fetch("data/heis.geojson")
  .then((r) => r.json())
  .then((gj) => {
    L.geoJSON(gj, {
      style: { color: "#7a5a1d", weight: 2.5, dashArray: "1 7", lineCap: "round" },
    })
      .bindTooltip("Skiheisen (Kongsberg skisenter)", { sticky: true })
      .addTo(heisLayer);
    const coords = gj.features[0].geometry.coordinates;
    for (const c of [coords[0], coords[coords.length - 1]]) {
      L.circleMarker([c[1], c[0]], {
        radius: 5,
        color: "#fff",
        weight: 1.5,
        fillColor: "#b3872e",
        fillOpacity: 1,
      }).addTo(heisLayer);
    }
    const mid = coords[Math.floor(coords.length / 2)];
    L.tooltip({ permanent: true, direction: "top", className: "route-label", opacity: 1 })
      .setContent('<span class="label-dot" style="background:#b3872e"></span>Skiheisen')
      .setLatLng([mid[1], mid[0]])
      .addTo(heisLayer);
  })
  .catch((err) => console.error("Klarte ikke laste heisen", err));
poiLayers["poi-heis"] = heisLayer;

// Kartlegenden viser prikk-forklaring for de punktlagene som er slått på
function updatePoiLegend() {
  const holder = document.getElementById("legend-poi");
  holder.innerHTML = "";
  for (const id of Object.keys(poiLayers)) {
    if (id === "poi-heis" || id === "poi-kommune") continue; // linjelag — har egne rader
    const box = document.getElementById(id);
    if (!box || !box.checked) continue;
    const card = box.closest(".poi-card");
    const color = card.querySelector(".poi-dot").style.background;
    const label = card.textContent.trim().replace(/\s*\(.*\)$/, "");
    const row = document.createElement("div");
    row.innerHTML = `<span class="legend-dot" style="background:${color}"></span>${label}`;
    holder.appendChild(row);
  }
}

for (const [id, layer] of Object.entries(poiLayers)) {
  const box = document.getElementById(id);
  if (box.checked) layer.addTo(map);
  box.addEventListener("change", () => {
    if (box.checked) layer.addTo(map);
    else map.removeLayer(layer);
    updatePoiLegend();
  });
}
updatePoiLegend();

// --- Init ------------------------------------------------------------------

showView(currentView());
loadRoutes();
