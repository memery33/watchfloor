import type { Theater } from "./sitrep.types";

export const THEATER_AFPAK: Theater =   {
    id: "afpak",
    name: "AFGHANISTAN / PAKISTAN",
    short: "AF/PK",
    status: "KOHAT AMBUSH / BORDER CLASHES",
    pip: "hot",
    map: { lat: 33.5, lon: 70.5, zoom: 6 },
    kpis: [
      { label: "KOHAT 11 NOV", value: "10 POLICE / 18 TTP", tone: "hot" },
      { label: "CLAIMED BY", value: "TTP", tone: "hot" },
      { label: "BORDER", value: "TORKHAM / ANGOOR ADDA", tone: "warn" },
      { label: "UNVERIFIED TOLL", value: "NOT REPEATED", tone: "dim" },
    ],
    watch: [
      "Kohat 11 Nov is confirmed by Associated Press and Dawn, with a Tehrik-e-Taliban Pakistan claim of responsibility",
      "Border clashes since late October at Torkham and Angoor Adda remain reported, not a fully agreed fatality table",
      "Do not use unsourced soldier-fatality figures circulating without a named official total",
    ],
    events: [
      {
        id: "ap-kohat",
        dtg: "11 NOV",
        location: "KOHAT",
        fact: "Associated Press and Dawn: Tehrik-e-Taliban Pakistan militants ambushed police in Kohat, Khyber Pakhtunkhwa, on 11 Nov as officers returned from an operation. Ten police officers were killed and 18 militants were killed in the ensuing gunbattle. The Pakistani Taliban claimed responsibility. City pin.",
        source: "PRESS",
        confidence: "CONFIRMED",
        priority: "PRI-1",
        lat: 33.587,
        lon: 71.443,
      },
      {
        id: "ap-torkham",
        dtg: "29 OCT–15 NOV",
        location: "TORKHAM",
        fact: "Clashes along the Pakistan–Afghanistan border have continued since late October, including at Angoor Adda and Torkham, according to Pakistani officials, Dawn, and the Long War Journal. Figures for Pakistani military fatalities vary by outlet and are not repeated here unless tied to a named official total. Torkham pin.",
        source: "PRESS",
        confidence: "REPORTED",
        priority: "PRI-2",
        lat: 34.15,
        lon: 71.09,
      },
    ],
    markers: [
      { id: "ap-m-kohat", name: "KOHAT", lat: 33.587, lon: 71.443, note: "Ambush 11 Nov; 10 police killed", tone: "hot" },
      { id: "ap-m-torkham", name: "TORKHAM", lat: 34.15, lon: 71.09, note: "Recurring border clashes", tone: "warn" },
    ],
  };
