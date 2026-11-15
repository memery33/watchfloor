import type { Theater } from "./sitrep.types";

export const THEATER_ETHIOPIA: Theater =   {
    id: "ethiopia",
    name: "ETHIOPIA / TIGRAY",
    short: "TIGRAY",
    status: "BADME CONTROL DISPUTED / AXUM CLASHES",
    pip: "hot",
    map: { lat: 13.0, lon: 39.0, zoom: 6 },
    kpis: [
      { label: "BADME", value: "CONTROL DELTA", tone: "hot" },
      { label: "AXUM", value: "CLASHES REPORTED", tone: "warn" },
      { label: "TIGRAY ADMIN", value: "CARETAKER STAND-UP", tone: "warn" },
      { label: "G7", value: "CALLED FOR RESTRAINT", tone: "ok" },
    ],
    watch: [
      "Do not treat Badme as held by one side; capture claims, Armed Conflict Location and Event Data Project, and resident accounts disagree",
      "Clashes south of Axum and forced-conscription reports remain open-source and regional-press items",
      "Caretaker Tigray administration named in October is still standing up",
      "Group of Seven restraint call was 11 Nov",
    ],
    events: [
      {
        id: "et-badme",
        dtg: "12–13 NOV",
        location: "BADME",
        fact: "Fighting has been reported around Badme on the Ethiopia–Eritrea / Tigray frontier. Capture claims, Armed Conflict Location and Event Data Project assessments that neither side fully holds the town, and an Addis Standard resident account that Ethiopian National Defense Force troops were present from 12 Nov do not agree (Critical Threats Project, 13 Nov; Addis Standard). Control is therefore marked DELTA. Town-level pin.",
        source: "OPEN COMP",
        confidence: "DELTA",
        priority: "PRI-1",
        lat: 14.725,
        lon: 37.803,
      },
      {
        id: "et-axum",
        dtg: "11–13 NOV",
        location: "AXUM",
        fact: "Critical Threats Project (13 Nov) and regional press reported clashes south of Axum and forced-conscription accounts as a caretaker Tigray administration continues to stand up (Addis Standard; The Globe and Mail; Associated Press on the October caretaker appointment). The Group of Seven called for restraint on 11 Nov. Town-level pin for Axum.",
        source: "PRESS",
        confidence: "REPORTED",
        priority: "PRI-2",
        lat: 14.121,
        lon: 38.723,
      },
    ],
    markers: [
      { id: "et-m-badme", name: "BADME", lat: 14.725, lon: 37.803, note: "Control disputed", tone: "hot" },
      { id: "et-m-axum", name: "AXUM", lat: 14.121, lon: 38.723, note: "Clashes reported to the south", tone: "warn" },
      { id: "et-m-mekelle", name: "MEKELLE", lat: 13.496, lon: 39.477, note: "Caretaker administration stand-up", tone: "warn" },
      { id: "et-m-addis", name: "ADDIS ABABA", lat: 9.03, lon: 38.74, note: "Federal capital reference pin", tone: "dim" },
    ],
  };
