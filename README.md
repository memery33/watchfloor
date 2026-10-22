# Watchfloor

[![Watchfloor overview of all theaters, captured Oct 21, 2026, with the confidence legend and the reported event stack](docs/screenshots/overview.webp)](https://memery33.github.io/watchfloor/)

All theaters on Oct 21, 2026, with the confidence legend and the reported event stack.

An unclassified open source intelligence (OSINT) common operating picture (COP) for following several conflicts at once.

**Live map:** https://memery33.github.io/watchfloor/

Watchfloor is a watch-floor view, not a news site. It is not a targeting product. It is reconstructed OSINT only. Every point cites a source. A red CONFIRMED tag means named and corroborated, and it is still not targeting quality. State media, militant channels, and automated extraction stay yellow as a claim. It is not radar.

## Screenshots

The curated situation report (sitrep) snapshot in these shots is dated Oct 15, 2026. The live Global Database of Events, Language, and Tone (GDELT) overlay was refreshed Oct 21, 2026 at 9:39 PM ET (Eastern Time).

![Iran and the Gulf theater, captured Oct 21, 2026, with reported Hormuz and Gulf claims, the confidence legend, and the event stack](docs/screenshots/iran-gulf.webp)

Iran and the Gulf, theater 2, with reported Hormuz and Gulf claims and their sources.

![Ukraine theater, captured Oct 21, 2026, with reported energy and strike claims, the confidence legend, and the event stack](docs/screenshots/ukraine.webp)

Ukraine, theater 4, with reported energy and strike claims and their sources.

## How sources are vetted

- **Named sources only.** Every event cites who reported it (wire services, official statements, United Kingdom Maritime Trade Operations (UKMTO), named outlets).
- **Claims stay yellow.** State media, militant channels, and automated news extraction are shown as CLAIM. They are promoted only when an independent, named source corroborates the same event, place, and date.
- **Disagreement is shown, not resolved.** When two credible sources contradict each other, the item is marked DELTA and both accounts stay visible.
- **No coordinates, no marker.** Nothing is plotted on a guessed location.
- **No two named ends, no arc.** Dashed missile and drone vectors are drawn only when both the launch point and the impact are named. They are reconstructions, not live tracks.

## What the colors mean

| Tag | Color | Meaning |
| --- | --- | --- |
| CONFIRMED | red | Named and corroborated. Still not targeting quality. |
| REPORTED | amber | Open press or official statement, not independently verified here. |
| CLAIM | yellow | State, militant, or automated extraction. Shown, not trusted. |
| DELTA | cyan | Credible sources contradict each other. |
| HOLD | green | Waiting on more information. |

## What's on the map

- Nine theaters: Overview, Iran/Gulf, Levant, Ukraine, Sudan, Energy/Sea, Afghanistan-Pakistan (AfPak), Yemen/Red Sea, and Ethiopia/Horn (keys `1` to `9`)
- Curated event stack for each theater, with source class and confidence
- Reconstructed missile and drone vectors where both ends are named
- Dark English basemap, Powered by Esri
- Live GDELT claim layer (below)

## The live claim layer

A yellow layer shows the last 6 hours of public [GDELT](https://www.gdeltproject.org/) claims. It is re-read on every refresh. It keeps only strike, shelling, and blockade events inside the watched areas. It drops country-level default locations, known bad geocodes, and vague actors. Because those filters are strict, the layer can still be thin or empty when news is quiet. An empty layer means nothing passed the filters, not that the feed is broken. The legend note shows the current count and the last refresh time. At 980 px wide and narrower, the legend note stays hidden until the legend is opened.

Every GDELT row stays a CLAIM until the sitrep curator promotes it with named corroboration.

## Layers

- **Vectors:** reconstructed strike paths, drawn as arcs. A path draws only when both ends are named. It is inferred from reporting, not radar.
- **Strike pins:** town-level placements. Coordinates come from the National Geospatial-Intelligence Agency (NGA) GeoNames Server (GNS). Each pin names the outlet or official source. Its geolocator reads "Watchfloor (town-level placement)", so it isn't an exact geolocation.
- **Fronts:** catalog only. Nothing draws until a source is license-cleared for commercial use.
- **Thermal anomalies (fires):** National Aeronautics and Space Administration (NASA) Fire Information for Resource Management System (FIRMS), Visible Infrared Imaging Radiometer Suite (VIIRS) 375 m near-real-time. Off by default, and fetched only when switched on. Up to 400 points are drawn on desktop and 120 on phone. Likely gas flares are drawn small and muted. Likely flare points are labeled "likely gas flare / industrial heat". Other points are labeled "thermal anomaly, not confirmed strike".
- **Ships:** off until a source is license-cleared for commercial use.

The commercial use gate in `src/layers.ts` covers fronts, fires, and ships. Fronts draw only when license-cleared for commercial use: `licenseCleared` is true, commercial use is yes, data is present, and a license and a source link are set. Fires load only when the file names a VIIRS source and commercial use is yes. The ships feed is disabled, and a payload is accepted only when commercial use is yes and the delay is at least 60 minutes. Strike pins and vectors are not behind that gate. The Esri basemap is loaded in `src/main.ts` and draws even though the register tags it needs paid license. The register is [docs/sources.md](docs/sources.md).

## How it stays current

- **Curated sitrep:** `src/sitrep.ts` and the per-theater `src/sitrep.*.ts` files, with a snapshot timestamp shown in the header.
- **Live layer:** `scripts/fetch_live.py` writes `public/data/live.json`. Every site build fetches the overlay fresh, so the deployed map is as current as its last build. A failed fetch keeps the committed `live.json`. A scheduled GitHub Action (nominally hourly, often less often) keeps the repo copy current and requests a site rebuild.
- **Vectors:** `src/tracks.ts`, curated by hand.
- **Site:** GitHub Pages rebuilds on every push to `main`, with a scheduled rebuild as a fallback.

## Run locally

```bash
npm install
python3 scripts/fetch_live.py
npm run dev
```

Keys: `1` to `9` switch theaters, `F` enters fullscreen.

## Public by design

Open sources only. No classified, For Official Use Only (FOUO), or private Telegram material. If it can't be sourced publicly, it is a yellow claim or it does not plot.

## Data sources and licenses

One line per source. Full terms are in [docs/sources.md](docs/sources.md).

- **Esri World Dark Gray Base + World Dark Gray Reference tiles.** Esri terms of use, plus ArcGIS Location Platform licensing ([licensing and attribution](https://location.arcgis.com/help/licensing-and-attribution)). Commercial use: needs paid license. Attribution: Powered by Esri. Esri, HERE, Garmin, OpenStreetMap contributors, and the Geographic Information System (GIS) user community.
- **GDELT 2.0 Events exports.** Terms: [gdeltproject.org/about.html](https://www.gdeltproject.org/about.html). Free for any use with a citation and a link to the GDELT Project. Commercial use: yes.
- **Leaflet 1.9.4.** BSD-2-Clause (Berkeley Software Distribution 2-Clause). [License](https://raw.githubusercontent.com/Leaflet/Leaflet/v1.9.4/LICENSE). Copy in [`THIRD_PARTY_NOTICES`](THIRD_PARTY_NOTICES). Commercial use: yes.
- **NASA LANCE FIRMS, VIIRS 375 m near-real-time active fire files.** Land, Atmosphere Near real-time Capability for EOS (LANCE). EOS is the Earth Observing System. Open data. Cite as NASA FIRMS ([FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq)). Disclaimer: [Readme.txt](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt). Commercial use: yes.
- **Cited news and official statements.** Cited and linked, never republished. Commercial use: yes, as citation only.
- **OurAirports.** Public domain ([ourairports.com/data](https://ourairports.com/data/)). Commercial use: yes.
- **NGA World Port Index, Publication 150 (Pub 150).** Reference check only. No coordinates copied. US Government work. The terms clause is unverified ([msi.nga.mil/Publications/WPI](https://msi.nga.mil/Publications/WPI)). Commercial use: yes.
- **NGA GeoNames Server (GNS).** No licensing requirements or restrictions ([geonames.nga.mil](https://geonames.nga.mil/)). Commercial use: yes.

## License

[Massachusetts Institute of Technology (MIT) License](LICENSE). Free and open source.
