import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SNAPSHOT, THEATERS, TICKER, type Theater, type TheaterId } from "./sitrep";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

let active: TheaterId = "overview";
let map: L.Map | null = null;
let layer: L.LayerGroup | null = null;

app.innerHTML = `
  <header class="top">
    <div class="class">${SNAPSHOT.classification}</div>
    <div class="title">
      <h1>WATCHFLOOR</h1>
      <p>MULTI-THEATER COMMON OPERATING PICTURE</p>
    </div>
    <div class="meta">
      DTG <b>${SNAPSHOT.dtgLocal}</b> / ${SNAPSHOT.dtgZulu}<br>
      WATCHCON <b>${SNAPSHOT.watchcon}</b> · ${SNAPSHOT.sourceAge}
    </div>
  </header>
  <div class="shell">
    <nav class="rail" id="rail"></nav>
    <section class="map-wrap">
      <div class="kpis" id="kpis"></div>
      <div id="map"></div>
    </section>
    <aside class="stack">
      <h2>PRIORITY / EVENT STACK</h2>
      <div id="events"></div>
      <h2 style="margin-top:14px">WATCH ITEMS</h2>
      <ul class="watch" id="watch"></ul>
      <p class="tag dim" style="margin-top:12px;display:inline-block">${SNAPSHOT.disclaimer}</p>
    </aside>
  </div>
  <footer class="ticker"><b>TICKER</b><div id="ticker"></div></footer>
`;

const rail = document.querySelector<HTMLElement>("#rail")!;
const kpis = document.querySelector<HTMLElement>("#kpis")!;
const eventsEl = document.querySelector<HTMLElement>("#events")!;
const watchEl = document.querySelector<HTMLElement>("#watch")!;
const tickerEl = document.querySelector<HTMLElement>("#ticker")!;

tickerEl.textContent = TICKER.join("   ·   ");

function theater(id: TheaterId): Theater {
  return THEATERS.find((t) => t.id === id) ?? THEATERS[0];
}

function renderRail() {
  rail.innerHTML = THEATERS.map((t, i) => `
    <button data-id="${t.id}" class="${t.id === active ? "active" : ""}">
      <span class="pip ${t.pip}"></span>
      <span class="name">${i + 1} ${t.name}</span>
      <span class="status">${t.status}</span>
    </button>
  `).join("");
  rail.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => select(btn.getAttribute("data-id") as TheaterId));
  });
}

function renderPanel(t: Theater) {
  kpis.innerHTML = t.kpis.map((k) => `
    <div class="kpi ${k.tone}"><div class="l">${k.label}</div><div class="v">${k.value}</div></div>
  `).join("");

  eventsEl.innerHTML = t.events.map((e) => `
    <article class="evt" data-lat="${e.lat}" data-lon="${e.lon}">
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
    </article>
  `).join("");

  eventsEl.querySelectorAll<HTMLElement>(".evt").forEach((row) => {
    row.addEventListener("click", () => {
      const lat = Number(row.dataset.lat);
      const lon = Number(row.dataset.lon);
      map?.flyTo([lat, lon], Math.max(map.getZoom(), 7), { duration: 0.6 });
    });
  });

  watchEl.innerHTML = t.watch.map((w) => `<li>${w}</li>`).join("");
}

function colorFor(tone: string) {
  if (tone === "hot") return "#ff4d3c";
  if (tone === "warn") return "#ffbf3c";
  if (tone === "ok") return "#3cff8a";
  return "#6fe3ff";
}

function renderMap(t: Theater) {
  if (!map) {
    map = L.map("map", { zoomControl: true, attributionControl: true });
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles &copy; Esri",
        maxZoom: 16,
      },
    ).addTo(map);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "",
        maxZoom: 16,
      },
    ).addTo(map);
    layer = L.layerGroup().addTo(map);
  }
  layer?.clearLayers();
  t.markers.forEach((m) => {
    const c = colorFor(m.tone);
    L.circleMarker([m.lat, m.lon], {
      radius: 7,
      color: c,
      weight: 2,
      fillColor: c,
      fillOpacity: 0.25,
    })
      .bindTooltip(`${m.name} — ${m.note}`, { className: "marker-label" })
      .addTo(layer!);
  });
  t.events.forEach((e) => {
    L.circleMarker([e.lat, e.lon], {
      radius: 4,
      color: "#6fe3ff",
      weight: 1,
      fillOpacity: 0.8,
    }).bindTooltip(`${e.dtg} ${e.location}`, { className: "marker-label" }).addTo(layer!);
  });
  map.setView([t.map.lat, t.map.lon], t.map.zoom);
  setTimeout(() => map?.invalidateSize(), 50);
}

function select(id: TheaterId) {
  active = id;
  const t = theater(id);
  renderRail();
  renderPanel(t);
  renderMap(t);
  history.replaceState(null, "", `#${id}`);
}

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

const initial = (location.hash.replace("#", "") || "overview") as TheaterId;
select(THEATERS.some((t) => t.id === initial) ? initial : "overview");
