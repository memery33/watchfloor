import type { Theater } from "./sitrep.types";

export const THEATER_LEVANT: Theater =   {
    id: "levant",
    name: "LEVANT",
    short: "LEVANT",
    status: "RAFAH BRIGADE COMMANDER KILLED / GAZA STRIKES",
    pip: "hot",
    map: { lat: 32.6, lon: 35.4, zoom: 7 },
    kpis: [
      { label: "GAZA", value: "ABU YOUNIS KILLED", tone: "hot" },
      { label: "CEASEFIRE", value: "STRIKES CONTINUE", tone: "hot" },
      { label: "POST-CF TOLL", value: "1,640+ HEALTH MIN", tone: "hot" },
      { label: "LEBANON", value: "NO NEW WIRE ITEM", tone: "dim" },
    ],
    watch: [
      "Samir Abu Younis killing confirmed by Israel and by Hamas; civilian harm in Al-Mawasi still being described by witnesses",
      "Gaza Health Ministry, figures the United Nations treats as reliable: more than 1,640 killed in Gaza since the October 2025 ceasefire (BBC, 15 Nov update)",
      "Israel says remaining strikes target Hamas and are allowed under the ceasefire; that legal claim is not adjudicated here",
      "No fresh Associated Press or Reuters item on a named Lebanon incident was attached to this snapshot; the rail is not a finding that the Lebanon frontier is quiet",
    ],
    events: [
      {
        id: "lv-hamas",
        dtg: "14–15 NOV",
        location: "AL-MAWASI / KHAN YOUNIS",
        fact: "Samir Abu Younis, newly appointed commander of Hamas’s Rafah Brigade, was killed on Saturday 14 Nov in Al-Mawasi, southern Gaza. The Israel Defense Forces and the Israel Security Agency said they “eliminated” him; Hamas’s Al-Qassam Brigades and a local Hamas official also confirmed the death (BBC, Reuters, Associated Press). Eyewitnesses said missiles struck a tent in the Al-Waha displaced-persons camp; a medical source at Nasser Hospital in Khan Younis reported injured people and one dead body arriving there (BBC). Khan Younis city pin; the strike was reported in nearby Al-Mawasi.",
        source: "PRESS",
        confidence: "CONFIRMED",
        priority: "PRI-1",
        lat: 31.346,
        lon: 34.303,
      },
    ],
    markers: [
      { id: "lv-m-khan", name: "KHAN YOUNIS", lat: 31.346, lon: 34.303, note: "Al-Mawasi strike; Rafah Brigade commander killed", tone: "hot" },
    ],
  };
