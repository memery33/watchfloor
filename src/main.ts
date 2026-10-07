import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { eventsForTheater, loadLive, type LiveEvent, type LivePayload } from "./live";
import { SNAPSHOT, THEATERS, TICKER, type Theater, type TheaterId, type Confidence } from "./sitrep";
import { TRACKS } from "./tracks";
import { LANDMARKS, landmarkFits } from "./landmarks";
import {
  FRONTS,
  LAYER_META,
  LAYER_ORDER,
  STRIKES,
  WAVES,
  frontDrawable,
  loadFires,
  loadShips,
  strikeDrawable,
  waveDrawable,
  waveLabel,
  type FirePayload,
  type LayerId,
  type ShipPayload,
  type StrikePin,
  type Wave,
} from "./layers";
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
let landmarkLayer: L.LayerGroup | null = null;
let strikeLayer: L.LayerGroup | null = null;
let frontLayer: L.LayerGroup | null = null;
let fireLayer: L.LayerGroup | null = null;
let shipLayer: L.LayerGroup | null = null;
let underRenderer: L.Canvas | null = null;
let fires: FirePayload | null = null;
let ships: ShipPayload | null = null;
let shownAttribution: string[] = [];
// Endpoint caps normally appear at LABEL_ZOOM+; a sparse theater (few vectors)
// shows them from its opening zoom so both ends stay named.
let labelZoom = 6;
const SPARSE_VECTORS = 4;
const SPARSE_MIN_ZOOM = 5; // never show endpoint caps at overview zooms
let live: LivePayload | null = null;
let confidenceFilter: FilterMode = "ALL";
let stackCollapsed = false;
let landmarksOn = true;
const LABEL_ZOOM = 6;
const LANDMARK_LABEL_ZOOM = 7;

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
            <div><i class="swatch hold"></i> HOLD / WAIT</div>
            <div class="layer-toggles" id="layerToggles" role="group" aria-label="Map layers"></div>
            <button type="button" class="legend-toggle on" id="landmarkToggle" aria-pressed="true" title="Toggle airports and seaports">
              <i class="swatch landmark"></i> AIRPORTS / PORTS
            </button>
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

function liveRefreshedET(iso: string | undefined): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return "unknown";
  const d = new Date(t);
  const day = d.toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
  return `${day} ${time} ET`;
}
const filtersEl = document.querySelector<HTMLElement>("#filters")!;
const collapseBtn = document.querySelector<HTMLButtonElement>("#collapseBtn")!;
const railSelect = document.querySelector<HTMLSelectElement>("#railSelect")!;
const hudEl = document.querySelector<HTMLElement>("#hud")!;
const hudToggle = document.querySelector<HTMLButtonElement>("#hudToggle")!;
const landmarkToggle = document.querySelector<HTMLButtonElement>("#landmarkToggle")!;
const narrowMq = window.matchMedia("(max-width: 980px)");
const layerTogglesEl = document.querySelector<HTMLElement>("#layerToggles")!;
const LAYER_KEY = "wf.layers.v1";
function defaultLayers(): Record<LayerId, boolean> {
  const phone = narrowMq.matches;
  return Object.fromEntries(LAYER_ORDER.map((id) => [id, phone ? LAYER_META[id].phone : LAYER_META[id].desktop])) as Record<LayerId, boolean>;
}
function loadLayerPrefs(): Record<LayerId, boolean> {
  const base = defaultLayers();
  try {
    const saved = JSON.parse(localStorage.getItem(LAYER_KEY) ?? "{}") as Partial<Record<LayerId, boolean>>;
    for (const id of LAYER_ORDER) if (typeof saved[id] === "boolean") base[id] = saved[id]!;
  } catch {
    /* ignore */
  }
  return base;
}
const layerOn: Record<LayerId, boolean> = loadLayerPrefs();
function layerCap(id: LayerId): number {
  return LAYER_META[id].cap[narrowMq.matches ? 1 : 0];
}

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

function clipBlurb(text: string, max = 100): { short: string; long: string; clipped: boolean } {
  const long = text.replace(/\s+/g, " ").trim();
  if (long.length <= max) return { short: long, long, clipped: false };
  const cut = long.slice(0, max);
  const at = cut.lastIndexOf(" ");
  const short = `${(at > 55 ? cut.slice(0, at) : cut).trimEnd()}\u2026`;
  return { short, long, clipped: true };
}

const POPUP_OPTS: L.PopupOptions = {
  className: "node-popup-wrap",
  maxWidth: 280,
  minWidth: 180,
  closeButton: true,
  autoPanPadding: [24, 48],
};

type PopupOpts = { title: string; meta?: string; fact: string; link?: { href: string; label: string } };

function nodePopupContent(opts: PopupOpts): HTMLElement {
  const { short, long, clipped } = clipBlurb(opts.fact, 100);
  const root = document.createElement("div");
  root.className = "node-popup";

  const title = document.createElement("div");
  title.className = "popup-title";
  title.textContent = opts.title;
  root.appendChild(title);

  if (opts.meta) {
    const meta = document.createElement("div");
    meta.className = "popup-meta";
    meta.textContent = opts.meta;
    root.appendChild(meta);
  }

  const blurb = document.createElement("p");
  blurb.className = "popup-blurb";
  blurb.textContent = short;
  root.appendChild(blurb);

  if (clipped) {
    const full = document.createElement("p");
    full.className = "popup-full";
    full.hidden = true;
    full.textContent = long;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "popup-more";
    btn.textContent = "Show more";
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const expanding = full.hidden;
      full.hidden = !expanding;
      blurb.hidden = expanding;
      btn.textContent = expanding ? "Show less" : "Show more";
    });

    root.appendChild(btn);
    root.appendChild(full);
  }

  if (opts.link && /^https:\/\//.test(opts.link.href)) {
    const a = document.createElement("a");
    a.className = "popup-link";
    a.href = opts.link.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = opts.link.label;
    root.appendChild(a);
  }

  return root;
}

function attachPopup(layer: L.Layer, opts: PopupOpts) {
  layer.bindPopup(() => nodePopupContent(opts), POPUP_OPTS);
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

function addImpact(
  lat: number,
  lon: number,
  color: string,
  group: L.LayerGroup,
  popup: { title: string; meta?: string; fact: string },
) {
  const marker = L.circleMarker([lat, lon], {
    radius: 8,
    color,
    weight: 2,
    fillColor: color,
    fillOpacity: 0.22,
  }).addTo(group);
  marker.setStyle({ weight: 3 });
  attachPopup(marker, popup);
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
  popup?: PopupOpts,
) {
  // Hide permanent name caps below LABEL_ZOOM (and on narrow overview) \u2014 dots + tooltip only
  const z = map?.getZoom() ?? 3;
  const zoomOut = z < labelZoom || (narrowMq.matches && z < labelZoom + 1);
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
  const cap = L.marker([lat, lon], { icon, interactive: true, keyboard: false }).addTo(group);
  if (popup) attachPopup(cap, popup);
  else cap.bindTooltip(fullTip, { className: "marker-label", direction: "top", offset: [0, -8] });
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
  const line = L.polyline(pts, {
    color,
    weight: track.confidence === "CLAIM" ? 2 : 3.5,
    opacity: 0.95,
    dashArray: dashForConfidence(track.confidence),
    className: track.confidence === "CLAIM" ? "claim-arc" : "track-arc",
  }).addTo(trackLayer);
  attachPopup(line, {
    title: `${track.from.name} \u2192 ${track.to.name}`,
    meta: `${track.kind.toUpperCase()} \u00b7 ${track.confidence} \u00b7 NOT RADAR`,
    fact: track.fact,
  });

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
    {
      title: `${track.from.name} \u2192 ${track.to.name}`,
      meta: `${track.kind.toUpperCase()} \u00b7 ${track.confidence} \u00b7 NOT RADAR`,
      fact: track.fact,
    },
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
    {
      title: `${track.from.name} \u2192 ${track.to.name}`,
      meta: `${track.kind.toUpperCase()} \u00b7 ${track.confidence} \u00b7 NOT RADAR`,
      fact: track.fact,
    },
  );
  addArrow(track.from, track.to, color, trackLayer);
}

function drawLive(event: LiveEvent) {
  if (!liveLayer) return;
  if (!passesFilter(event.confidence)) return;
  const color = colorForConfidence(event.confidence);
  addImpact(event.lat, event.lon, color, liveLayer, {
    title: event.location,
    meta: `${event.dtg} \u00b7 LIVE \u00b7 ${event.confidence}`,
    fact: event.fact,
  });
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

function drawWave(w: Wave) {
  if (!trackLayer || !layerOn.vectors) return;
  if (!passesFilter(w.confidence) || !waveDrawable(w)) return;
  const color = colorForConfidence(w.confidence);
  const pts = arcPoints(w.from, w.to);
  const label = waveLabel(w);
  const popup: PopupOpts = {
    title: `${w.from.name} \u2192 ${w.to.name}`,
    meta: `${w.dtg} \u00b7 WAVE \u00b7 ${label} \u00b7 ${w.confidence} \u00b7 ${w.source} \u00b7 NOT RADAR`,
    fact: `${label} reported by ${w.source}. Launch area and target region as stated in the tally; the line is a reconstruction, not a flight path.`,
    link: w.url ? { href: w.url, label: `Source: ${w.source}` } : undefined,
  };
  const line = L.polyline(pts, {
    color,
    weight: w.count && w.count >= 50 ? 4 : w.count && w.count >= 15 ? 3 : 2,
    opacity: 0.9,
    dashArray: dashForConfidence(w.confidence),
    className: "wave-arc",
  }).addTo(trackLayer);
  attachPopup(line, popup);
  const mid = pts[Math.floor(pts.length / 2)];
  L.marker(mid, {
    icon: L.divIcon({
      className: "wave-label",
      html: `<span style="color:${color}">${label}</span>`,
      iconSize: [1, 1],
      iconAnchor: [0, 0],
    }),
    interactive: false,
    keyboard: false,
  }).addTo(trackLayer);
  addEndpointLabel(w.from.lat, w.from.lon, "ORIGIN", w.from.name, "#8aa0b0", trackLayer, `LAUNCH AREA  ${w.from.name}`, w.to.lon, popup);
  addEndpointLabel(w.to.lat, w.to.lon, "IMPACT", w.to.name, color, trackLayer, `TARGET REGION  ${w.to.name}`, w.from.lon, popup);
  addArrow(w.from, w.to, color, trackLayer);
}

function drawStrike(sp: StrikePin) {
  if (!strikeLayer) return;
  if (!passesFilter(sp.confidence) || !strikeDrawable(sp)) return;
  const color = colorForConfidence(sp.confidence);
  const m = L.marker([sp.lat, sp.lon], {
    icon: L.divIcon({
      className: "strike-pin",
      html: `<span style="border-color:${color};background:${color}55"></span>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    }),
    keyboard: false,
  }).addTo(strikeLayer);
  attachPopup(m, {
    title: sp.name,
    meta: `${sp.dtg} \u00b7 GEOLOCATED \u00b7 ${sp.confidence} \u00b7 ${sp.geolocator}`,
    fact: sp.fact,
    link: { href: sp.url, label: `Geolocation: ${sp.geolocator}` },
  });
}

function setAttribution(next: string[]) {
  if (!map) return;
  for (const a of shownAttribution) if (!next.includes(a)) map.attributionControl.removeAttribution(a);
  for (const a of next) if (!shownAttribution.includes(a)) map.attributionControl.addAttribution(a);
  shownAttribution = next;
}

function drawUnderLayers(t: Theater): { counts: Record<LayerId, number>; attribution: string[] } {
  frontLayer?.clearLayers();
  fireLayer?.clearLayers();
  shipLayer?.clearLayers();
  const attribution: string[] = [];
  const fronts = FRONTS.filter((f) => f.theater === t.id && frontDrawable(f)).slice(0, layerCap("fronts"));
  // Newest first, so the phone/desktop cap drops the oldest rows, not random ones.
  // Non-flare detections first, then newest first, so the cap drops flares and old rows before anything else.
  const fireRows = (fires?.points ?? [])
    .filter((p) => t.id === "overview" || p.theater === t.id)
    .sort((a, b) => Number(!!a.likely_flare) - Number(!!b.likely_flare) || String(b.acq).localeCompare(String(a.acq)));
  const shipRows = (ships?.points ?? [])
    .filter((p) => t.id === "overview" || p.theater === t.id)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));

  if (layerOn.fronts && frontLayer) {
    for (const f of fronts) {
      L.geoJSON(f.data!, {
        pane: "wf-under",
        interactive: false,
        style: () => ({ color: "#b79cff", weight: 1.2, opacity: 0.8, fillColor: "#b79cff", fillOpacity: 0.07 }),
      }).addTo(frontLayer);
      attribution.push(`Fronts: <a href="${f.url}" target="_blank" rel="noopener">${f.name}</a> (${f.license}, as of ${f.asOf})`);
    }
  }
  if (layerOn.fires && fireLayer && fires) {
    // Draw flares first (underneath) so real anomalies sit on top of them.
    const drawn = fireRows.slice(0, layerCap("fires")).reverse();
    for (const p of drawn) {
      const flare = !!p.likely_flare;
      L.circleMarker([p.lat, p.lon], {
        renderer: underRenderer!,
        radius: flare ? 1.5 : 2.5,
        stroke: false,
        fillColor: flare ? "#8a7a6e" : "#ff7a2f",
        fillOpacity: flare ? 0.35 : 0.75,
      })
        .bindTooltip(
          flare
            ? `LIKELY GAS FLARE / INDUSTRIAL HEAT \u00b7 ${p.acq}`
            : `THERMAL ANOMALY, NOT CONFIRMED STRIKE \u00b7 ${p.acq}`,
          { className: "marker-label" },
        )
        .addTo(fireLayer);
    }
    if (fireRows.length) {
      // FIRMS asks redistributors to link its disclaimer; a tap target, not a hover, so it works on phones.
      attribution.push(
        '<a href="https://earthdata.nasa.gov/firms" target="_blank" rel="noopener">NASA FIRMS</a> (<a href="https://firms.modaps.eosdis.nasa.gov/download/Readme.txt" target="_blank" rel="noopener">disclaimer</a>)',
      );
      // Full FIRMS citation lives in the layer toggle's tooltip; the footer keeps the short linked credit (phone width).
      if (fires.attribution && !/FIRMS/i.test(fires.attribution)) attribution.push(fires.attribution);
    }
  }
  if (layerOn.ships && shipLayer && ships) {
    for (const p of shipRows.slice(0, layerCap("ships"))) {
      L.circleMarker([p.lat, p.lon], {
        renderer: underRenderer!,
        radius: 2.5,
        color: "#9fd6ff",
        weight: 1,
        fillColor: "#9fd6ff",
        fillOpacity: 0.35,
      })
        .bindTooltip(`${p.kind.toUpperCase()} \u00b7 position ${p.at} (\u22651h delayed)`, { className: "marker-label" })
        .addTo(shipLayer);
    }
    if (shipRows.length) attribution.push(ships.attribution);
  }
  return {
    counts: {
      vectors: 0,
      strikes: 0,
      fronts: fronts.length,
      fires: fireRows.length,
      ships: shipRows.length,
    },
    attribution,
  };
}

const LAYER_SWATCH: Record<LayerId, string> = {
  vectors: "track",
  strikes: "strike",
  fronts: "front",
  fires: "fire",
  ships: "ship",
};

function renderLayerToggles(counts: Record<LayerId, number>) {
  layerTogglesEl.innerHTML = LAYER_ORDER.map((id) => {
    const on = layerOn[id];
    const n = counts[id];
    const empty = n === 0;
    const cap = layerCap(id);
    const capped = id !== "vectors" && n > cap;
    const shown = empty ? "\u2014" : capped ? `${cap}/${n}` : String(n);
    const notLoaded = (id === "fires" || id === "ships") && !on && !(id === "fires" ? fires : ships);
    const cite = id === "fires" && fires?.attribution ? ` \u00b7 ${fires.attribution.replace(/"/g, "&quot;").replace(/</g, "&lt;")}` : "";
    const title = (notLoaded
      ? "Off. Data loads when you turn this on"
      : empty
      ? "No approved data in this theater yet"
      : capped
        ? `Showing newest ${cap} of ${n} to keep the map fast`
        : `${n} in this theater`) + cite;
    return `<button type="button" class="legend-toggle${on ? " on" : ""}${empty ? " empty" : ""}" data-layer="${id}" aria-pressed="${on}" title="${title}">
      <i class="swatch ${LAYER_SWATCH[id]}"></i> ${LAYER_META[id].label}<span class="layer-n">${shown}</span>
    </button>`;
  }).join("");
}

function syncEndpointZoom() {
  const z = map?.getZoom() ?? 3;
  const zoomOut = z < labelZoom || (narrowMq.matches && z < labelZoom + 1);
  document.querySelectorAll(".endpoint-label").forEach((el) => {
    el.classList.toggle("zoom-out", zoomOut);
  });
  const showLm = z >= LANDMARK_LABEL_ZOOM;
  document.querySelectorAll(".landmark-label").forEach((el) => {
    el.classList.toggle("zoom-out", !showLm);
  });
}

function drawLandmarks(t: Theater) {
  if (!landmarkLayer) return;
  landmarkLayer.clearLayers();
  if (!landmarksOn) return;
  const z = map?.getZoom() ?? 3;
  const showName = z >= LANDMARK_LABEL_ZOOM;
  for (const lm of LANDMARKS) {
    if (!landmarkFits(lm, t.id)) continue;
    const airport = lm.kind === "airport";
    const color = airport ? "#7a8a99" : "#6d8494";
    const kind = airport ? "AIRPORT" : "SEAPORT";
    const title = lm.code ? `${lm.name} (${lm.code})` : lm.name;
    L.circleMarker([lm.lat, lm.lon], {
      radius: airport ? 3 : 3.5,
      color,
      weight: 1,
      fillColor: color,
      fillOpacity: 0.35,
      interactive: true,
    })
      .bindTooltip(`${kind}  ${title}`, {
        className: "marker-label",
        direction: "top",
        offset: [0, -6],
      })
      .addTo(landmarkLayer);
    const icon = L.divIcon({
      className: `landmark-label${showName ? "" : " zoom-out"}`,
      html: `<span class="lm-cap">${lm.code ?? (airport ? "APT" : "PORT")}</span>`,
      iconSize: [1, 1],
      iconAnchor: [-6, 8],
    });
    L.marker([lm.lat, lm.lon], { icon, interactive: false, keyboard: false }).addTo(landmarkLayer);
  }
}

function renderMap(t: Theater) {
  if (!map) {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        // Esri requires "Powered by Esri" plus the service's own copyright text (copyrightText on the MapServer).
        // The OSM credit is linked here once; it also covers OSM-derived gazetteer coordinates (strikes, waves).
        attribution:
          'Powered by <a href="https://www.esri.com" target="_blank" rel="noopener">Esri</a> \u00b7 Esri, HERE, Garmin, \u00a9 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, and the GIS user community \u00b7 Watchfloor OSINT COP',
        maxZoom: 16,
      },
    ).addTo(map);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      { attribution: "", maxZoom: 16 },
    ).addTo(map);
    // Landmarks under sitrep → live → tracks on top
    // Fronts / fires / ships sit in a pane under every marker and vector.
    map.createPane("wf-under").style.zIndex = "390";
    underRenderer = L.canvas({ pane: "wf-under", padding: 0.2 });
    frontLayer = L.layerGroup().addTo(map);
    fireLayer = L.layerGroup().addTo(map);
    shipLayer = L.layerGroup().addTo(map);
    landmarkLayer = L.layerGroup().addTo(map);
    sitrepLayer = L.layerGroup().addTo(map);
    strikeLayer = L.layerGroup().addTo(map);
    liveLayer = L.layerGroup().addTo(map);
    trackLayer = L.layerGroup().addTo(map);
    map.on("zoomend", () => {
      syncEndpointZoom();
      drawLandmarks(theater(active));
    });
  }
  sitrepLayer?.clearLayers();
  liveLayer?.clearLayers();
  trackLayer?.clearLayers();
  strikeLayer?.clearLayers();
  drawLandmarks(t);
  const under = drawUnderLayers(t);

  t.markers.forEach((m) => {
    const c = m.tone === "hot" ? "#ff4d3c" : m.tone === "warn" ? "#ffbf3c" : m.tone === "ok" ? "#3cff8a" : "#6fe3ff";
    const match = t.events.find((e) => Math.abs(e.lat - m.lat) < 0.02 && Math.abs(e.lon - m.lon) < 0.02);
    const marker = L.circleMarker([m.lat, m.lon], {
      radius: 10,
      color: c,
      weight: 3,
      fillColor: c,
      fillOpacity: 0.18,
    }).addTo(sitrepLayer!);
    attachPopup(marker, {
      title: m.name,
      meta: match ? `${match.dtg} \u00b7 ${match.confidence} \u00b7 ${match.source}` : m.note,
      fact: match?.fact ?? m.note,
    });
  });

  t.events.filter((e) => passesFilter(e.confidence)).forEach((e) => {
    addImpact(e.lat, e.lon, colorForConfidence(e.confidence), sitrepLayer!, {
      title: e.location,
      meta: `${e.dtg} \u00b7 ${e.confidence} \u00b7 ${e.source}`,
      fact: e.fact,
    });
  });

  const tracks = TRACKS.filter((tr) => trackFits(tr, t.id));
  const waves = WAVES.filter((w) => w.theaters.includes(t.id) && waveDrawable(w));
  const strikes = STRIKES.filter((sp) => sp.theaters.includes(t.id) && strikeDrawable(sp));
  const overlay = (live?.events ?? []).filter((e) => liveFits(e, t.id));
  const visibleTracks = tracks.filter((tr) => passesFilter(tr.confidence)).length;
  const visibleWaves = waves.filter((w) => passesFilter(w.confidence));
  const vectorCount = visibleTracks + visibleWaves.length;
  labelZoom = vectorCount <= SPARSE_VECTORS && t.map.zoom >= SPARSE_MIN_ZOOM ? Math.min(LABEL_ZOOM, t.map.zoom) : LABEL_ZOOM;
  if (layerOn.vectors) {
    tracks.forEach(drawTrack);
    visibleWaves.slice(0, Math.max(0, layerCap("vectors") - visibleTracks)).forEach(drawWave);
  }
  if (layerOn.strikes) strikes.slice(0, layerCap("strikes")).forEach(drawStrike);
  overlay.slice(0, 80).forEach(drawLive);
  renderLayerToggles({ ...under.counts, vectors: tracks.length + waves.length, strikes: strikes.length });
  setAttribution([
    ...(live ? ['<a href="https://www.gdeltproject.org/" target="_blank" rel="noopener">GDELT Project</a>'] : []),
    ...under.attribution,
  ]);
  const visibleLive = overlay.filter((e) => passesFilter(e.confidence)).length;
  if (live) {
    const stamp = document.createElement("span");
    stamp.className = visibleLive === 0 ? "live-stamp zero" : "live-stamp";
    stamp.textContent = `GDELT claims: ${visibleLive} \u00b7 refreshed ${liveRefreshedET(live.generated_at)}`;
    hudNote.replaceChildren(
      stamp,
      document.createTextNode(
        `${layerOn.vectors ? vectorCount : 0} reconstructed vectors \u00b7 yellow = unverified \u00b7 dashed = inferred, not radar`,
      ),
    );
  } else {
    hudNote.textContent = "Live overlay missing. Curated sitrep only.";
  }

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
landmarkToggle.addEventListener("click", (ev) => {
  ev.stopPropagation();
  landmarksOn = !landmarksOn;
  landmarkToggle.classList.toggle("on", landmarksOn);
  landmarkToggle.setAttribute("aria-pressed", String(landmarksOn));
  drawLandmarks(theater(active));
});
// Off-by-default feeds are fetched only once their layer is switched on (no request, no 404, no bytes otherwise).
const feedRequested: Record<"fires" | "ships", boolean> = { fires: false, ships: false };
function rerenderKeepView() {
  const center = map?.getCenter();
  const zoom = map?.getZoom();
  renderMap(theater(active));
  if (center && zoom != null) map?.setView(center, zoom, { animate: false });
}
function ensureFeeds() {
  if (layerOn.fires && !feedRequested.fires) {
    feedRequested.fires = true;
    void loadFires().then((f) => {
      fires = f;
      if (f) rerenderKeepView();
    });
  }
  if (layerOn.ships && !feedRequested.ships) {
    feedRequested.ships = true;
    void loadShips().then((sp) => {
      ships = sp;
      if (sp) rerenderKeepView();
    });
  }
}

layerTogglesEl.addEventListener("click", (ev) => {
  ev.stopPropagation();
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("[data-layer]");
  if (!btn) return;
  const id = btn.dataset.layer as LayerId;
  layerOn[id] = !layerOn[id];
  try {
    localStorage.setItem(LAYER_KEY, JSON.stringify(layerOn));
  } catch {
    /* ignore */
  }
  rerenderKeepView();
  ensureFeeds();
});
narrowMq.addEventListener("change", () => {
  syncHudForViewport();
  syncEndpointZoom();
  map?.invalidateSize();
});
syncHudForViewport();

window.addEventListener("keydown", (e) => {
  const mapKeys: Record<string, TheaterId> = Object.fromEntries(
    THEATERS.slice(0, 9).map((t, i) => [String(i + 1), t.id]),
  );
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
  ensureFeeds();
}

boot();
