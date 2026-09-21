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
const LABEL_ZOOM = 6;

app.innerHTML = `
  <header class="top">
    <div class="class">
      ${SNAPSHOT.classification}
      <div class="sub">NOT A TARGETING PRODUCT \u00b7 RECONSTRUCTED OSINT ONLY</div>
    </div>
    <div class="title">
      <h1>WATCHFLOOR</h1>
      <p>MULTI-THEATER COMMON OPERATING PICTURE</p>
    </div>
    <div class="meta">
      DTG <b>${SNAPSHOT.dtgLocal}</b> / ${SNAPSHOT.dtgZulu}<br>
      WATCHCON <b>${SNAPSHOT.watchcon}</b> \u00b7 <span id="liveAge">${SNAPSHOT.sourceAge}</span>
    </div>
  </header>
  <div class="shell" id="shell">
    <nav class="rail" id="rail"></nav>
    <select class="rail-select" id="railSelect" aria-label="Theater"></select>
    <section class="map-wrap">
      <div class="kpis" id="kpis"></div>
      <div class="map-stage">
        <div id="map"></div>
        <aside class="hud" id="hud">
          <button type="button" class="hud-toggle" id="hudToggle" aria-expanded="false" title="Toggle legend">
            <span class="chev">\u25b8</span> Legend
          </button>
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
        <button type="button" class="collapse-btn" id="collapseBtn" title="Collapse event stack" aria-expanded="true">\u25c2</button>
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
const railSelect = document.querySelector<HTMLSelectElement>("#railSelect")!;
const hudEl = document.querySelector<HTMLElement>("#hud")!;
const hudToggle = document.querySelector<HTMLButtonElement>("#hudToggle")!;
const narrowMq = window.matchMedia("(max-width: 980px)");

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
  return part.length > 14 ? `${part.slice(0, 13)}\u2026` : part;
}

function renderRail() {
  rail.innerHTML = THEATERS.map((t, i) => {
    const n = live ? live.events.filter((e) => liveFits(e, t.id)).length : 0;
    return `
      <button data-id="${t.id}" class="${t.id === active ? "active" : ""}">
        <span class="pip ${t.pip}"></span>
        <span class="name">${i + 1} ${t.name}</span>
        <span class="status">${t.status}${n ? ` \u00b7 ${n} LIVE CLAIMS` : ""}</span>
      </button>
    `;
  }).join("");
  rail.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => select(btn.getAttribute("data-id") as TheaterId));
  });
  // Compact <select> for narrow viewports \u2014 all 6 theaters, no horizontal overflow
  railSelect.innerHTML = THEATERS.map((t, i) => {
    const n = live ? live.events.filter((e) => liveFits(e, t.id)).length : 0;
    const liveBit = n ? ` \u00b7 ${n} live` : "";
    return `<option value="${t.id}" ${t.id === active ? "selected" : ""}>${i + 1} ${t.name} \u2014 ${t.status}${liveBit}</option>`;
  }).join("");
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
        <div class="loc">${e.location} \u00b7 LIVE</div>
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
      ? `<h2 class="live-head">LIVE OVERLAY \u00b7 ALL CLAIM UNTIL VERIFIED</h2>${liveRows}`
      : `<p class="empty">No live overlay in this theater${confidenceFilter !== "ALL" ? " for this filter" : ""}.</p>`);

  eventsEl.querySelectorAll<HTMLElement>(".evt").forEach((rowEl) => {
    rowEl.addEventListener("click", () => fly(Number(rowEl.dataset.lat), Number(rowEl.dataset.lon)));
  });

  watchEl.innerHTML = t.watch.map((w) => `<li>${w}</li>`).join("");

  const liveBits = overlay.slice(0, 6).map((e) => `${e.dtg}  ${e.location}  ${e.fact}`);
  tickerEl.textContent = [...TICKER, ...liveBits].join("   \u00b7   ");
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

function labelSideClass(
  role: "ORIGIN" | "IMPACT" | "INFERRED",
  fromLon: number,
  toLon: number,
): string {
  // Push FROM west of start / TO east of end when vector runs E-ish; flip when W-ish
  const eastish = toLon >= fromLon;
  if (role === "IMPACT") return eastish ? "side-e" : "side-w";
  if (role === "ORIGIN") return eastish ? "side-w" : "side-e";
  return eastish ? "side-w" : "side-e";
}

function addEndpointLabel(
  lat: number,
  lon: number,
  role: "ORIGIN" | "IMPACT" | "INFERRED",
  name: string,
  color: string,
  group: L.LayerGroup,
  fullTip: string,
  peerLon?: number,
) {
  // Hide permanent name caps below LABEL_ZOOM (and on narrow overview) \u2014 dots + tooltip only
  const z = map?.getZoom() ?? 3;
  const zoomOut = z < LABEL_ZOOM || (narrowMq.matches && z < LABEL_ZOOM + 1);
  const inferred = role === "INFERRED";
  const roleText = role === "IMPACT" ? "TO" : role === "ORIGIN" ? "FROM" : "INF";
  const side = peerLon === undefined ? (role === "IMPACT" ? "side-e" : "side-w") : labelSideClass(role, role === "IMPACT" ? peerLon : lon, role === "IMPACT" ? lon : peerLon);
  const capKind = role === "IMPACT" ? "impact" : "origin";
  const icon = L.divIcon({
    className: `endpoint-label${zoomOut ? " zoom-out" : ""}${inferred ? " inferred" : ""}`,
    html: `<div class="cap ${capKind} ${side}" style="color:${color}">
      <span class="dot"></span>
      <span class="role">${roleText}</span>
      <span class="name">${shortName(name)}</span>
    </div>`,
    iconSize: [1, 1],
    // Anchor at the geographic point; CSS transform offsets the cap opposite the peer
    iconAnchor: [0, 0],
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
      `${track.kind.toUpperCase()}  ${track.from.name} \u2192 ${track.to.name}  [${track.confidence}]  ${track.fact}`,
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
    track.to.lon,
  );
  addEndpointLabel(
    track.to.lat,
    track.to.lon,
    "IMPACT",
    track.to.name,
    color,
    trackLayer,
    `IMPACT  ${track.to.name}  [${track.confidence}]`,
    track.from.lon,
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
  // Only draw inferred arc when both ends are named \u2014 keep styling distinct from reconstructed tracks
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
        `INFERRED  ${event.origin.name} \u2192 ${event.location}  [CLAIM \u00b7 NOT RADAR]`,
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
      `INFERRED ORIGIN  ${event.origin.name}  [CLAIM \u00b7 NOT RADAR]`,
    );
  }
}

function syncEndpointZoom() {
  if (!trackLayer && !liveLayer) return;
  const z = map?.getZoom() ?? 3;
  const zoomOut = z < LABEL_ZOOM || (narrowMq.matches && z < LABEL_ZOOM + 1);
  document.querySelectorAll(".endpoint-label").forEach((el) => {
    el.classList.toggle("zoom-out", zoomOut);
  });
}

function renderMap(t: Theater) {
  if (!map) {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles \u00a9 Esri \u00b7 Watchfloor OSINT COP", maxZoom: 16 },
    ).addTo(map);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 16 },
    ).addTo(map);
    // Paint order A: sitrep \u2192 live \u2192 tracks (tracks on top)
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
      .bindTooltip(`${m.name} \u2014 ${m.note}`, { className: "marker-label" })
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
    ? `${visibleLive} live claims in view \u00b7 ${visibleTracks} reconstructed vectors \u00b7 yellow = unverified \u00b7 dashed = inferred, not radar`
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
  collapseBtn.textContent = stackCollapsed ? "\u25b8" : "\u25c2";
  invalidateAfterTransition();
}

filtersEl.addEventListener("click", (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".chip");
  if (!btn) return;
  setFilter(btn.getAttribute("data-filter") as FilterMode);
});
collapseBtn.addEventListener("click", toggleStack);

railSelect.addEventListener("change", () => {
  select(railSelect.value as TheaterId);
});

function syncHudForViewport() {
  // Desktop: legend always open. Mobile: collapsed-by-default so map stays readable.
  if (narrowMq.matches) {
    hudEl.classList.remove("open");
    hudToggle.setAttribute("aria-expanded", "false");
    hudToggle.querySelector(".chev")!.textContent = "\u25b8";
  } else {
    hudEl.classList.add("open");
    hudToggle.setAttribute("aria-expanded", "true");
    hudToggle.querySelector(".chev")!.textContent = "\u25be";
  }
}
hudToggle.addEventListener("click", () => {
  const open = hudEl.classList.toggle("open");
  hudToggle.setAttribute("aria-expanded", String(open));
  hudToggle.querySelector(".chev")!.textContent = open ? "\u25be" : "\u25b8";
});
narrowMq.addEventListener("change", () => {
  syncHudForViewport();
  syncEndpointZoom();
  map?.invalidateSize();
});
syncHudForViewport();

window.addEventListener("keydown", (e) => {
  const mapKeys: Record<string, TheaterId> = {
    "1": "overview",
    "2": "iran",
    "3": "levant",
    "4": "ukraine",
    "5": "sudan",
    "6": "energy",
    "7": "afpak",
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
      ? `${SNAPSHOT.sourceAge} \u00b7 ${liveAge(live.generated_at)}`
      : `${SNAPSHOT.sourceAge} \u00b7 LIVE OVERLAY OFFLINE`;
    select(active);
  });
}

boot();
