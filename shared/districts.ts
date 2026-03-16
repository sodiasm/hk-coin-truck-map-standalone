/** Bilingual label helper */
export type BilingualLabel = { tc: string; en: string };

/** District info with GeoJSON AREA_CODE */
export const DISTRICTS: Record<string, BilingualLabel> = {
  CW:  { tc: "中西區",  en: "Central & Western" },
  WC:  { tc: "灣仔區",  en: "Wan Chai" },
  EST: { tc: "東區",    en: "Eastern" },
  STH: { tc: "南區",    en: "Southern" },
  YTM: { tc: "油尖旺區", en: "Yau Tsim Mong" },
  SSP: { tc: "深水埗區", en: "Sham Shui Po" },
  KLC: { tc: "九龍城區", en: "Kowloon City" },
  WTS: { tc: "黃大仙區", en: "Wong Tai Sin" },
  KT:  { tc: "觀塘區",  en: "Kwun Tong" },
  KC:  { tc: "葵青區",  en: "Kwai Tsing" },
  TW:  { tc: "荃灣區",  en: "Tsuen Wan" },
  TM:  { tc: "屯門區",  en: "Tuen Mun" },
  YL:  { tc: "元朗區",  en: "Yuen Long" },
  NTH: { tc: "北區",    en: "North" },
  TP:  { tc: "大埔區",  en: "Tai Po" },
  ST:  { tc: "沙田區",  en: "Sha Tin" },
  SK:  { tc: "西貢區",  en: "Sai Kung" },
  ILD: { tc: "離島區",  en: "Islands" },
};

export const TRUCK_COLORS: Record<number, string> = {
  1: "#1d4ed8",
  2: "#b45309",
};

export const TRUCK_LABELS: Record<number, BilingualLabel> = {
  1: { tc: "收銀車 1 號", en: "Cash Coin Truck 1" },
  2: { tc: "收銀車 2 號", en: "Cash Coin Truck 2" },
};

export const SERVICE_HOURS: BilingualLabel = {
  tc: "上午 10 時至晚上 7 時",
  en: "10:00 am – 7:00 pm",
};

export const LCSD_NOTE: BilingualLabel = {
  tc: "* 康文署流動圖書館服務點",
  en: "* LCSD Mobile Library Service Point",
};
