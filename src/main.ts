import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { eventsForTheater, loadLive, type LiveEvent, type LivePayload } from "./live";
import { SNAPSHOT, THEATERS, TICKER, type Theater, type TheaterId, type Confidence } from "./sitrep";
import { TRACKS } from "./tracks";
import {
  arcPoints,
  colorForConfidence,
  dashForConfidence,
  liveAge,
  liveFits,
  trackFits,
} from "./cop";
import "./style.css";

type FilterMode = "ALL" | "CONFIRMED" | "REPORTED" | "CLAIM";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

let active: TheaterId = "overview";
let map: L.Map | null = null;
let sitrepLayer: L.LayerGroup | null = null;
let liveLayer: L.LayerGroup | null = null;
let trackLayer: L.LayerGroup | null = null;
let live: LivePayload | null = null;
let confidenceFilter: FilterMode = "ALL";
let stackCollapsed = false;
const LABEL_ZOOM = 5;

app.innerHTML = `
  <header class="top">
    <div class="class">
      ${SNAPSHOT.classification}
      <div class="sub">NOT A TARGETING PRODUCT · RECONSTRUCTED OSINT ONLY</div>
    </div>
    <div class="title">
      <h1>WATCHFLOOR</h1>
      <p>MULTI-THEATER COMMON OPERATING PICTURE</p>
    </div>
    <div class="meta">
      DTG <b>${SNAPSHOT.dtgLocal}</b> / ${SNAPSHOT.dtgZulu}<br>
      WATCHCON <b>${SNAPSHOT.watchcon}</b> · <span id="liveAge">${SNAPSHOT.sourceAge}</span>
    </div>
  </header>
  <div class="shell" id="shell">
    <nav class="rail" id="rail"></nav>
    <section class="map-wrap">
      <div class="kpis" id="kpis"></div>
      <div class="map-stage">
        <div id="map"></div>
        <aside class="hud">
          <div class="legend">
            <div><i class="swatch confirmed"></i> CONFIRMED</div>
            <div><i class="swatch reported"></i> REPORTED</div>
            <div><i class="swatch claim"></i> CLAIM / UNVERIFIED</div>
            <div><i class="swatch delta"></i> DELTA / DISPUTED</div>
            <div><i class="swatch track"></i> RECONSTRUCTED VECTOR (NOT RADAR)</div>
          </div>
          <div class="hud-note" id="hudNote">Curated sitrep + GDELT claim overlay. Yellow = not confirmed.</div>
        </aside>
      </div>
    </section>
    <aside class="stack" id="stack">
      <div class="stack-toolbar">
        <span class="stack-title">Event stack</span>
        <div class="filters" id="filters" role="group" aria-label="Confidence filter">
          <button type="button" class="chip active" data-filter="ALL">All</button>
          <button type="button" class="chip" data-filter="CONFIRMED">Confirmed</button>
          <button type="button" class="chip" data-filter="REPORTED">Reported</button>
          <button type="button" class="chip" data-filter="CLAIM">Claim</button>
        </div>
        <button type="button" class="collapse-btn" id="collapseBtn" title="Collapse event stack" aria-expanded="true">◂</button>
      </div>
      <div class="stack-body">
        <h2>PRIORITY / EVENT STACK</h2>
        <div id="events"></div>
        <h2>WATCH ITEMS</h2>
        <ul class="watch" id="watch"></ul>
        <p class="tag dim disclaimer">${SNAPSHOT.disclaimer}</p>
      </div>
    </aside>
  </div>
  <footer class="ticker"><b>TICKER</b><div id="ticker" class="ticker-text"></div></footer>
`;

const shell = document.querySelector<HTMLElement>("#shell")!;
const rail = document.querySelector<HTMLElement>("#rail")!;
const kpis = document.querySelector<HTMLElement>("#kpis")!;
const eventsEl = document.querySelector<HTMLElement>("#events")!;
const watchEl = document.querySelector<HTMLElement>("#watch")!;
const tickerEl = document.querySelector<HTMLElement>("#ticker")!;
const liveAgeEl = document.querySelector<HTMLElement>("#liveAge")!;
const hudNote = document.querySelector<HTMLElement>("#hudNote")!;
const filtersEl = document.querySelector<HTMLElement>("#filters")!;
const collapseBtn = document.querySelector<HTMLButtonElement>("#collapseBtn")!;

function theater(id: TheaterId): Theater {
  return THEATERS.find((t) => t.id === id) ?? THEATERS[0];
}

function fly(lat: number, lon: number) {
  map?.flyTo([lat, lon], Math.max(map.getZoom(), 6), { duration: 0.55 });
}

function passesFilter(confidence: Confidence): boolean {
  if (confidenceFilter === "ALL") return true;
  if (confidenceFilter === "CLAIM") return confidence === "CLAIM" || confidence === "DELTA";
  return confidence === confidenceFilter;
}

function shortName(name: string): string {
  const part = name.split("/")[0].trim();
  return part.length > 14 ? `${part.slice(0, 13)}…` : part;
}

function renderRail() {
  rail.innerHTML = THEATERS.map((t, i) => {
    const n = live ? live.events.filter((e) => liveFits(e, t.id)).length : 0;
    return `
      <button data-id="${t.id}" class="${t.id === active ? "active" : ""}">
        <span class="pip ${t.pip}"></span>
        <span class="name">${i + 1} ${t.name}</span>
        <span class="status">${t.status}${n ? ` · ${n} LIVE CLAIMS` : ""}</span>
      </button>
    `;
  }).join("");
  rail.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => select(btn.getAttribute("data-id") as TheaterId));
  });
}

function renderFilters() {
  filtersEl.querySelectorAll<HTMLButtonElement>(".chip").forEach((chip) => {
    const mode = chip.getAttribute("data-filter") as FilterMode;
    chip.classList.toggle("active", mode === confidenceFilter);
  });
}

function renderPanel(t: Theater) {
  const overlay = live ? eventsForTheater(live.events, t.id) : [];
  const claims = overlay.filter((e) => e.confidence === "CLAIM").length;
  const extra = [
    { label: "LIVE CLAIMS", value: live ? String(claims) : "OFFLINE", tone: claims ? "warn" : "dim" },
    {
      label: "VECTORS",
      value: String(TRACKS.filter((tr) => trackFits(tr, t.id)).length),
      tone: "dim",
    },
  ];
  const row = [...t.kpis.slice(0, 2), ...extra];
  kpis.innerHTML = row
    .map(
      (k) =>
        `<div class="kpi ${k.tone}"><div class="l">${k.label}</div><div class="v">${k.value}</div></div>`,
    )
    .join("");

  const curated = t.events
    .filter((e) => passesFilter(e.confidence))
    .map(
      (e) => `
    <article class="evt ${e.confidence}" data-lat="${e.lat}" data-lon="${e.lon}">
      <time>${e.dtg}</time>
      <div>
        <div class="loc">${e.location}</div>
        <div class="fact">${e.fact}</div>
        <div class="tags">
          <span class="tag ${e.priority}">${e.priority}</span>
          <span class="tag ${e.confidence}">${e.confidence}</span>
          <span class="tag dim">${e.source}</span>
        </div>
      </div>
    </article>`,
    )
    .join("");

  const liveFiltered = overlay.filter((e) => passesFilter(e.confidence));
  const liveRows = liveFiltered
    .map(
      (e) => `
    <article class="evt CLAIM" data-lat="${e.lat}" data-lon="${e.lon}">
      <time>${e.dtg}</time>
      <div>
        <div class="loc">${e.location} · LIVE</div>
        <div class="fact">${e.fact}</div>
        <div class="tags">
          <span class="tag ${e.priority}">${e.priority}</span>
          <span class="tag CLAIM">CLAIM</span>
          <span class="tag dim">${e.source}</span>
        </div>
      </div>
    </article>`,
    )
    .join("");

  eventsEl.innerHTML =
    (curated || `<p class="empty">No curated events for this filter.</p>`) +
    (liveRows
      ? `<h2 class="live-head">LIVE OVERLAY · ALL CLAIM UNTIL VERIFIED</h2>${liveRows}`
      : `<p class="empty">No live overlay in this theater${confidenceFilter !== "ALL" ? " for this filter" : ""}.</p>`);

  eventsEl.querySelectorAll<HTMLElement>(".evt").forEach((rowEl) => {
    rowEl.addEventListener("click", () => fly(Number(rowEl.dataset.lat), Number(rowEl.dataset.lon)));
  });

  watchEl.innerHTML = t.watch.map((w) => `<li>${w}</li>`).join("");

  const liveBits = overlay.slice(0, 6).map((e) => `${e.dtg}  ${e.location}  ${e.fact}`);
  tickerEl.textContent = [...TICKER, ...liveBits].join("   ·   ");
  renderFilters();
}

function addImpact(lat: number, lon: number, color: string, label: string, group: L.LayerGroup) {
  L.circleMarker([lat, lon], {
    radius: 6,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.18,
  })
    .bindTooltip(label, { className: "marker-label" })
    .addTo(group);
}

function addEndpointLabel(
  lat: number,
  lon: number,
  role: "ORIGIN" | "IMPACT" | "INFERRED",
  name: string,
  color: string,
  group: L.LayerGroup,
  fullTip: string,
) {
  const zoomOut = (map?.getZoom() ?? 3) < LABEL_ZOOM;
  const inferred = role === "INFERRED";
  const roleText = role === "IMPACT" ? "TO" : role === "ORIGIN" ? "FROM" : "INF";
  const icon = L.divIcon({
    className: `endpoint-label${zoomOut ? " zoom-out" : ""}${inferred ? " inferred" : ""}`,
    html: `<div class="cap ${role === "IMPACT" ? "impact" : "origin"}" style="color:${color}">
      <span class="dot"></span>
      <span class="role">${roleText}</span>
      <span class="name">${shortName(name)}</span>
    </div>`,
    iconSize: [1, 1],
    iconAnchor: role === "IMPACT" ? [-6, 10] : [6, 22],
  });
  L.marker([lat, lon], { icon, interactive: true, keyboard: false })
    .bindTooltip(fullTip, { className: "marker-label", direction: "top", offset: [0, -8] })
    .addTo(group);
}

function addArrow(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  color: string,
  group: L.LayerGroup,
) {
  const ang = (Math.atan2(to.lat - from.lat, to.lon - from.lon) * 180) / Math.PI;
  const icon = L.divIcon({
    className: "track-arrow",
    html: `<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid ${color};opacity:.75;transform:rotate(${90 - ang}deg)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
  // Place arrow ~85% along geodesic toward impact (subtle direction cue)
  const midLat = from.lat + (to.lat - from.lat) * 0.82;
  const midLon = from.lon + (to.lon - from.lon) * 0.82;
  L.marker([midLat, midLon], { icon, interactive: false }).addTo(group);
}

function drawTrack(track: (typeof TRACKS)[number]) {
  if (!trackLayer) return;
  if (!passesFilter(track.confidence)) return;
  const color = colorForConfidence(track.confidence);
  const pts = arcPoints(track.from, track.to);
  L.polyline(pts, {
    color,
    weight: track.confidence === "CLAIM" ? 2 : 3.5,
    opacity: 0.95,
    dashArray: dashForConfidence(track.confidence),
    className: track.confidence === "CLAIM" ? "claim-arc" : "track-arc",
  })
    .bindTooltip(
      `${track.kind.toUpperCase()}  ${track.from.name} → ${track.to.name}  [${track.confidence}]  ${track.fact}`,
      { className: "marker-label" },
    )
    .addTo(trackLayer);

  // Clear endpoint dots + permanent labeled caps (tracks.ts vectors only)
  L.circleMarker([track.from.lat, track.from.lon], {
    radius: 5,
    color: "#8aa0b0",
    weight: 2,
    fillColor: "transparent",
    fillOpacity: 0,
  }).addTo(trackLayer);
  L.circleMarker([track.to.lat, track.to.lon], {
    radius: 6,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.22,
  }).addTo(trackLayer);

  addEndpointLabel(
    track.from.lat,
    track.from.lon,
    "ORIGIN",
    track.from.name,
    "#8aa0b0",
    trackLayer,
    `ORIGIN  ${track.from.name}  [${track.confidence}]`,
  );
  addEndpointLabel(
    track.to.lat,
    track.to.lon,
    "IMPACT",
    track.to.name,
    color,
    trackLayer,
    `IMPACT  ${track.to.name}  [${track.confidence}]`,
  );
  addArrow(track.from, track.to, color, trackLayer);
}

function drawLive(event: LiveEvent) {
  if (!liveLayer) return;
  if (!passesFilter(event.confidence)) return;
  const color = colorForConfidence(event.confidence);
  addImpact(
    event.lat,
    event.lon,
    color,
    `${event.dtg}  ${event.location}  [${event.confidence}]`,
    liveLayer,
  );
  // Only draw inferred arc when both ends are named — keep styling distinct from reconstructed tracks
  if (event.origin && event.origin.name) {
    const pts = arcPoints(event.origin, event);
    L.polyline(pts, {
      color: "#6d7d8c",
      weight: 1.25,
      opacity: 0.55,
      dashArray: "3 8",
      className: "inferred-arc",
    })
      .bindTooltip(
        `INFERRED  ${event.origin.name} → ${event.location}  [CLAIM · NOT RADAR]`,
        { className: "marker-label" },
      )
      .addTo(liveLayer);
    addEndpointLabel(
      event.origin.lat,
      event.origin.lon,
      "INFERRED",
      event.origin.name,
      "#6d7d8c",
      liveLayer,
      `INFERRED ORIGIN  ${event.origin.name}  [CLAIM · NOT RADAR]`,
    );
  }
}

function syncEndpointZoom() {
  if (!trackLayer && !liveLayer) return;
  const zoomOut = (map?.getZoom() ?? 3) < LABEL_ZOOM;
  document.querySelectorAll(".endpoint-label").forEach((el) => {
    el.classList.toggle("zoom-out", zoomOut);
  });
}

function renderMap(t: Theater) {
  if (!map) {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri · Watchfloor OSINT COP", maxZoom: 16 },
    ).addTo(map);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 16 },
    ).addTo(map);
    // Paint order A: sitrep → live → tracks (tracks on top)
    sitrepLayer = L.layerGroup().addTo(map);
    liveLayer = L.layerGroup().addTo(map);
    trackLayer = L.layerGroup().addTo(map);
    map.on("zoomend", syncEndpointZoom);
  }
  sitrepLayer?.clearLayers();
  liveLayer?.clearLayers();
  trackLayer?.clearLayers();

  t.markers.forEach((m) => {
    const c = m.tone === "hot" ? "#ff4d3c" : m.tone === "warn" ? "#ffbf3c" : m.tone === "ok" ? "#3cff8a" : "#6fe3ff";
    L.circleMarker([m.lat, m.lon], {
      radius: 8,
      color: c,
      weight: 2,
      fillColor: c,
      fillOpacity: 0.12,
    })
      .bindTooltip(`${m.name} — ${m.note}`, { className: "marker-label" })
      .addTo(sitrepLayer!);
  });

  t.events.filter((e) => passesFilter(e.confidence)).forEach((e) => {
    addImpact(
      e.lat,
      e.lon,
      colorForConfidence(e.confidence),
      `${e.dtg}  ${e.location}  [${e.confidence}]`,
      sitrepLayer!,
    );
  });

  const tracks = TRACKS.filter((tr) => trackFits(tr, t.id));
  const overlay = (live?.events ?? []).filter((e) => liveFits(e, t.id));
  tracks.forEach(drawTrack);
  overlay.slice(0, 80).forEach(drawLive);
  const visibleTracks = tracks.filter((tr) => passesFilter(tr.confidence)).length;
  const visibleLive = overlay.filter((e) => passesFilter(e.confidence)).length;
  hudNote.textContent = live
    ? `${visibleLive} live claims in view · ${visibleTracks} reconstructed vectors · yellow = unverified · dashed = inferred, not radar`
    : "Live overlay missing. Curated sitrep only.";

  map.setView([t.map.lat, t.map.lon], t.map.zoom);
  setTimeout(() => {
    map?.invalidateSize();
    syncEndpointZoom();
  }, 40);
}

function select(id: TheaterId) {
  active = id;
  const t = theater(id);
  renderRail();
  renderPanel(t);
  renderMap(t);
  history.replaceState(null, "", `#${id}`);
}

function setFilter(mode: FilterMode) {
  confidenceFilter = mode;
  const t = theater(active);
  renderPanel(t);
  renderMap(t);
}

function invalidateAfterTransition() {
  const done = () => {
    map?.invalidateSize();
    syncEndpointZoom();
  };
  // Wait for CSS grid transition (~220ms) then invalidate
  shell.addEventListener("transitionend", function onEnd(ev) {
    if (ev.target !== shell) return;
    shell.removeEventListener("transitionend", onEnd);
    done();
  });
  setTimeout(done, 280);
}

function toggleStack() {
  stackCollapsed = !stackCollapsed;
  shell.classList.toggle("stack-collapsed", stackCollapsed);
  collapseBtn.setAttribute("aria-expanded", String(!stackCollapsed));
  collapseBtn.title = stackCollapsed ? "Expand event stack" : "Collapse event stack";
  collapseBtn.textContent = stackCollapsed ? "▸" : "◂";
  invalidateAfterTransition();
}

filtersEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".chip");
  if (!btn) return;
  setFilter(btn.getAttribute("data-filter") as FilterMode);
});
collapseBtn.addEventListener("click", toggleStack);

window.addEventListener("keydown", (e) => {
  const mapKeys: Record<string, TheaterId> = {
    "1": "overview",
    "2": "iran",
    "3": "levant",
    "4": "ukraine",
    "5": "sudan",
    "6": "energy",
  };
  if (mapKeys[e.key]) select(mapKeys[e.key]);
  if (e.key === "f" || e.key === "F") document.documentElement.requestFullscreen?.();
});

function boot() {
  const initial = (location.hash.replace("#", "") || "overview") as TheaterId;
  select(THEATERS.some((t) => t.id === initial) ? initial : "overview");
  void loadLive().then((payload) => {
    live = payload;
    liveAgeEl.textContent = live
      ? `${SNAPSHOT.sourceAge} · ${liveAge(live.generated_at)}`
      : `${SNAPSHOT.sourceAge} · LIVE OVERLAY OFFLINE`;
    select(active);
  });
}

boot();
