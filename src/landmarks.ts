import type { TheaterId } from "./sitrep";

export type LandmarkKind = "airport" | "seaport";

export interface Landmark {
  id: string;
  name: string;
  kind: LandmarkKind;
  lat: number;
  lon: number;
  code?: string;
  theaters: TheaterId[];
  major?: boolean;
}

/** Civil airports + commercial ports only. Not bases, not compounds, not targeting. */
export const LANDMARKS: Landmark[] = [
  // Airports
  { id: "apt-ruh", name: "King Khalid Intl", kind: "airport", code: "RUH", lat: 24.9578, lon: 46.6989, theaters: ["overview", "iran", "energy"], major: true },
  { id: "apt-dxb", name: "Dubai Intl", kind: "airport", code: "DXB", lat: 25.2532, lon: 55.3657, theaters: ["overview", "iran", "energy"], major: true },
  { id: "apt-auh", name: "Abu Dhabi Intl", kind: "airport", code: "AUH", lat: 24.433, lon: 54.6511, theaters: ["iran", "energy"] },
  { id: "apt-doh", name: "Hamad Intl", kind: "airport", code: "DOH", lat: 25.2731, lon: 51.608, theaters: ["overview", "iran", "energy"], major: true },
  { id: "apt-kwi", name: "Kuwait Intl", kind: "airport", code: "KWI", lat: 29.2266, lon: 47.9689, theaters: ["iran", "energy"] },
  { id: "apt-bah", name: "Bahrain Intl", kind: "airport", code: "BAH", lat: 26.2708, lon: 50.6336, theaters: ["iran", "energy"] },
  { id: "apt-mct", name: "Muscat Intl", kind: "airport", code: "MCT", lat: 23.5933, lon: 58.2844, theaters: ["iran", "energy"] },
  { id: "apt-ika", name: "Imam Khomeini Intl", kind: "airport", code: "IKA", lat: 35.4161, lon: 51.1522, theaters: ["overview", "iran"], major: true },
  { id: "apt-bnd", name: "Bandar Abbas Intl", kind: "airport", code: "BND", lat: 27.2183, lon: 56.3778, theaters: ["iran", "energy"] },
  { id: "apt-jed", name: "King Abdulaziz Intl", kind: "airport", code: "JED", lat: 21.6796, lon: 39.1565, theaters: ["iran", "energy"] },
  { id: "apt-ade", name: "Aden Intl", kind: "airport", code: "ADE", lat: 12.8295, lon: 45.0288, theaters: ["iran", "energy"] },
  { id: "apt-sah", name: "Sanaa Intl", kind: "airport", code: "SAH", lat: 15.4763, lon: 44.2197, theaters: ["iran"] },
  { id: "apt-bey", name: "Beirut Rafic Hariri", kind: "airport", code: "BEY", lat: 33.8209, lon: 35.4884, theaters: ["overview", "levant"], major: true },
  { id: "apt-dam", name: "Damascus Intl", kind: "airport", code: "DAM", lat: 33.4114, lon: 36.5156, theaters: ["levant"] },
  { id: "apt-amm", name: "Queen Alia Intl", kind: "airport", code: "AMM", lat: 31.7226, lon: 35.9932, theaters: ["levant"] },
  { id: "apt-tlv", name: "Ben Gurion", kind: "airport", code: "TLV", lat: 32.0114, lon: 34.8867, theaters: ["overview", "levant"], major: true },
  { id: "apt-cai", name: "Cairo Intl", kind: "airport", code: "CAI", lat: 30.1219, lon: 31.4056, theaters: ["overview", "levant", "energy"], major: true },
  { id: "apt-bgw", name: "Baghdad Intl", kind: "airport", code: "BGW", lat: 33.2625, lon: 44.2346, theaters: ["iran", "levant"] },
  { id: "apt-ebl", name: "Erbil Intl", kind: "airport", code: "EBL", lat: 36.2376, lon: 43.9631, theaters: ["iran", "levant"] },
  { id: "apt-bsr", name: "Basra Intl", kind: "airport", code: "BSR", lat: 30.5491, lon: 47.6621, theaters: ["iran", "energy"] },
  { id: "apt-kbp", name: "Kyiv Boryspil", kind: "airport", code: "KBP", lat: 50.345, lon: 30.8947, theaters: ["overview", "ukraine"], major: true },
  { id: "apt-ods", name: "Odesa Intl", kind: "airport", code: "ODS", lat: 46.4268, lon: 30.6765, theaters: ["ukraine", "energy"] },
  { id: "apt-hrk", name: "Kharkiv Intl", kind: "airport", code: "HRK", lat: 49.9248, lon: 36.29, theaters: ["ukraine"] },
  { id: "apt-ozh", name: "Zaporizhzhia Intl", kind: "airport", code: "OZH", lat: 47.867, lon: 35.3157, theaters: ["ukraine"] },
  { id: "apt-svo", name: "Sheremetyevo", kind: "airport", code: "SVO", lat: 55.9726, lon: 37.4146, theaters: ["overview", "ukraine"], major: true },
  { id: "apt-krt", name: "Khartoum Intl", kind: "airport", code: "KRT", lat: 15.5895, lon: 32.5532, theaters: ["overview", "sudan"], major: true },
  { id: "apt-pzu", name: "Port Sudan", kind: "airport", code: "PZU", lat: 19.4336, lon: 37.2341, theaters: ["sudan", "energy"] },
  { id: "apt-khi", name: "Karachi Jinnah", kind: "airport", code: "KHI", lat: 24.9065, lon: 67.1608, theaters: ["overview", "afpak", "energy"], major: true },
  { id: "apt-isb", name: "Islamabad Intl", kind: "airport", code: "ISB", lat: 33.5607, lon: 72.8516, theaters: ["afpak"] },
  { id: "apt-kbl", name: "Kabul Intl", kind: "airport", code: "KBL", lat: 34.5659, lon: 69.2123, theaters: ["afpak"] },

  // Commercial seaports / terminals
  { id: "prt-jebelali", name: "Jebel Ali", kind: "seaport", lat: 24.985, lon: 55.027, theaters: ["overview", "iran", "energy"], major: true },
  { id: "prt-fujairah", name: "Fujairah", kind: "seaport", lat: 25.135, lon: 56.354, theaters: ["iran", "energy"] },
  { id: "prt-bandarabbas", name: "Bandar Abbas", kind: "seaport", lat: 27.146, lon: 56.201, theaters: ["overview", "iran", "energy"], major: true },
  { id: "prt-kharg", name: "Kharg terminal", kind: "seaport", lat: 29.24, lon: 50.31, theaters: ["iran", "energy"] },
  { id: "prt-rastanura", name: "Ras Tanura", kind: "seaport", lat: 26.648, lon: 50.159, theaters: ["iran", "energy"] },
  { id: "prt-jeddah", name: "Jeddah Islamic", kind: "seaport", lat: 21.468, lon: 39.161, theaters: ["energy"] },
  { id: "prt-aden", name: "Aden", kind: "seaport", lat: 12.795, lon: 44.989, theaters: ["iran", "energy"] },
  { id: "prt-hodeidah", name: "Hodeidah", kind: "seaport", lat: 14.797, lon: 42.954, theaters: ["iran", "energy"] },
  { id: "prt-suez", name: "Suez", kind: "seaport", lat: 29.966, lon: 32.55, theaters: ["overview", "energy"], major: true },
  { id: "prt-portsaid", name: "Port Said", kind: "seaport", lat: 31.265, lon: 32.319, theaters: ["energy"] },
  { id: "prt-haifa", name: "Haifa", kind: "seaport", lat: 32.819, lon: 35.004, theaters: ["levant", "energy"] },
  { id: "prt-ashdod", name: "Ashdod", kind: "seaport", lat: 31.821, lon: 34.647, theaters: ["levant", "energy"] },
  { id: "prt-beirut", name: "Beirut", kind: "seaport", lat: 33.901, lon: 35.519, theaters: ["levant"] },
  { id: "prt-latakia", name: "Latakia", kind: "seaport", lat: 35.531, lon: 35.769, theaters: ["levant"] },
  { id: "prt-odesa", name: "Odesa", kind: "seaport", lat: 46.506, lon: 30.741, theaters: ["overview", "ukraine", "energy"], major: true },
  { id: "prt-chornomorsk", name: "Chornomorsk", kind: "seaport", lat: 46.342, lon: 30.656, theaters: ["ukraine", "energy"] },
  { id: "prt-novorossiysk", name: "Novorossiysk", kind: "seaport", lat: 44.724, lon: 37.769, theaters: ["ukraine", "energy"] },
  { id: "prt-portsudan", name: "Port Sudan", kind: "seaport", lat: 19.615, lon: 37.217, theaters: ["sudan", "energy"] },
  { id: "prt-karachi", name: "Karachi", kind: "seaport", lat: 24.851, lon: 66.988, theaters: ["afpak", "energy"] },
  { id: "prt-gwadar", name: "Gwadar", kind: "seaport", lat: 25.126, lon: 62.322, theaters: ["afpak", "energy"] },
  { id: "prt-chabahar", name: "Chabahar", kind: "seaport", lat: 25.296, lon: 60.612, theaters: ["iran", "afpak", "energy"] },
  { id: "prt-ummqasr", name: "Umm Qasr", kind: "seaport", lat: 30.036, lon: 47.946, theaters: ["iran", "energy"] },
];

export function landmarkFits(lm: Landmark, theaterId: string): boolean {
  if (theaterId === "overview") return Boolean(lm.major) || lm.theaters.includes("overview");
  return lm.theaters.includes(theaterId as TheaterId);
}
