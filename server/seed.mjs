/**
 * Seed script — run once to populate the truck_schedules table.
 * Usage: node server/seed.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const SEED_DATA = [
  // ── WEEK 1: Jan 5–11 ──────────────────────────────────────────────────────
  { truck_number: 1, district_code: "CW", district_name_tc: "中西區", district_name_en: "Central and Western District", location_name_tc: "上環永樂街 118 號路旁停車處（近上環文化廣場）", location_name_en: "Roadside Car Park at 118 Wing Lok Street, Sheung Wan", address_tc: "上環永樂街 118 號", date_from: "2026-01-05", date_to: "2026-01-11", closed_dates: "2026-01-06", is_lcsd_library: false, notes_tc: "1月6日（星期二）暫停", notes_en: "Closed on Jan 6 (Tue)" },
  { truck_number: 2, district_code: "YL", district_name_tc: "元朗區", district_name_en: "Yuen Long District", location_name_tc: "天水圍天瑞邨天瑞社區中心*", location_name_en: "Tin Shui Wai Tin Shui Estate Tin Shui Community Centre*", address_tc: "天水圍天瑞邨天瑞社區中心", date_from: "2026-01-05", date_to: "2026-01-11", closed_dates: "2026-01-07", is_lcsd_library: true, notes_tc: "1月7日（星期三）暫停", notes_en: "Closed on Jan 7 (Wed)" },
  // ── WEEK 2: Jan 12–18 ─────────────────────────────────────────────────────
  { truck_number: 1, district_code: "ST", district_name_tc: "沙田區", district_name_en: "Sha Tin District", location_name_tc: "大圍村南道（近大圍港鐵站 A 出口）", location_name_en: "Village South Road, Tai Wai (near Tai Wai MTR Station Exit A)", address_tc: "大圍村南道", date_from: "2026-01-12", date_to: "2026-01-15", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 1, district_code: "ST", district_name_tc: "沙田區", district_name_en: "Sha Tin District", location_name_tc: "沙田新翠邨新翠廣場*", location_name_en: "Sun Chui Plaza, Sun Chui Estate, Sha Tin*", address_tc: "沙田新翠邨新翠廣場", date_from: "2026-01-17", date_to: "2026-01-18", closed_dates: "2026-01-16", is_lcsd_library: true, notes_tc: "1月16日（星期五）暫停", notes_en: "Closed on Jan 16 (Fri)" },
  { truck_number: 2, district_code: "ILD", district_name_tc: "離島區", district_name_en: "Islands District", location_name_tc: "愉景灣愉景廣場輸船灣郵局側*", location_name_en: "Discovery Bay Plaza, near Discovery Bay Post Office*", address_tc: "愉景灣愉景廣場", date_from: "2026-01-12", date_to: "2026-01-14", closed_dates: "2026-01-13", is_lcsd_library: true, notes_tc: "1月13日（星期二）暫停", notes_en: "Closed on Jan 13 (Tue)" },
  { truck_number: 2, district_code: "ILD", district_name_tc: "離島區", district_name_en: "Islands District", location_name_tc: "東涌滿東邨滿翠樓", location_name_en: "Man Chui House, Man Tung Estate, Tung Chung", address_tc: "東涌滿東邨滿翠樓", date_from: "2026-01-15", date_to: "2026-01-18", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  // ── WEEK 3: Jan 19–25 ─────────────────────────────────────────────────────
  { truck_number: 1, district_code: "SSP", district_name_tc: "深水埗區", district_name_en: "Sham Shui Po District", location_name_tc: "石硤尾大坑東邨東怡樓側（東健樓與東怡樓之間車位）", location_name_en: "Tung Yi House, Tai Hang Tung Estate, Shek Kip Mei", address_tc: "石硤尾大坑東邨東怡樓側", date_from: "2026-01-19", date_to: "2026-01-22", closed_dates: "2026-01-20", is_lcsd_library: false, notes_tc: "1月20日（星期二）暫停", notes_en: "Closed on Jan 20 (Tue)" },
  { truck_number: 1, district_code: "SSP", district_name_tc: "深水埗區", district_name_en: "Sham Shui Po District", location_name_tc: "深水埗警局街路旁停車處（近嘉美中心外）", location_name_en: "Roadside Car Park at Police Station Street, Sham Shui Po", address_tc: "深水埗警局街", date_from: "2026-01-23", date_to: "2026-01-25", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "YTM", district_name_tc: "油尖旺區", district_name_en: "Yau Tsim Mong District", location_name_tc: "佐敦廣東道 575 號", location_name_en: "575 Canton Road, Jordan", address_tc: "佐敦廣東道 575 號", date_from: "2026-01-19", date_to: "2026-01-22", closed_dates: "2026-01-21", is_lcsd_library: false, notes_tc: "1月21日（星期三）暫停", notes_en: "Closed on Jan 21 (Wed)" },
  { truck_number: 2, district_code: "YTM", district_name_tc: "油尖旺區", district_name_en: "Yau Tsim Mong District", location_name_tc: "油麻地砵蘭街路旁停車處（砵蘭街交明街休憩處旁）", location_name_en: "Roadside Car Park at Portland Street, Yau Ma Tei", address_tc: "油麻地砵蘭街", date_from: "2026-01-23", date_to: "2026-01-25", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  // ── WEEK 4: Jan 27–Feb 1 ──────────────────────────────────────────────────
  { truck_number: 1, district_code: "KT", district_name_tc: "觀塘區", district_name_en: "Kwun Tong District", location_name_tc: "秀茂坪邨秀曦樓假空地（香港考試中心旁）", location_name_en: "Temporary Open Space at Sau Hei House, Sau Mau Ping Estate", address_tc: "秀茂坪邨秀曦樓", date_from: "2026-01-27", date_to: "2026-01-29", closed_dates: "2026-01-26,2026-01-28", is_lcsd_library: false, notes_tc: "1月26日（星期一）及1月28日（星期三）暫停", notes_en: "Closed on Jan 26 (Mon) & Jan 28 (Wed)" },
  { truck_number: 1, district_code: "KT", district_name_tc: "觀塘區", district_name_en: "Kwun Tong District", location_name_tc: "觀塘翠屏道 19 號路旁停車處（近翠屏北邨翠鄰樓）", location_name_en: "Roadside Car Park at 19 Tsui Ping Road, Kwun Tong", address_tc: "觀塘翠屏道 19 號", date_from: "2026-01-30", date_to: "2026-02-01", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "WC", district_name_tc: "灣仔區", district_name_en: "Wan Chai District", location_name_tc: "灣仔港灣道灣景中心路旁停車處（港灣中心正對面）", location_name_en: "Roadside Car Park at Harbour Road, Wan Chai", address_tc: "灣仔港灣道", date_from: "2026-01-27", date_to: "2026-02-01", closed_dates: "2026-01-30", is_lcsd_library: false, notes_tc: "1月30日（星期五）暫停", notes_en: "Closed on Jan 30 (Fri)" },
  // ── WEEK 5: Feb 2–8 ───────────────────────────────────────────────────────
  { truck_number: 1, district_code: "TM", district_name_tc: "屯門區", district_name_en: "Tuen Mun District", location_name_tc: "屯門寶田邨第四座*", location_name_en: "Block 4, Po Tin Estate, Tuen Mun*", address_tc: "屯門寶田邨第四座", date_from: "2026-02-02", date_to: "2026-02-08", closed_dates: "2026-02-03", is_lcsd_library: true, notes_tc: "2月3日（星期二）暫停", notes_en: "Closed on Feb 3 (Tue)" },
  { truck_number: 2, district_code: "TW", district_name_tc: "荃灣區", district_name_en: "Tsuen Wan District", location_name_tc: "荃灣眾安街（荃灣千色匯一期外）", location_name_en: "Chung On Street, Tsuen Wan (outside Citywalk Phase 1)", address_tc: "荃灣眾安街", date_from: "2026-02-02", date_to: "2026-02-04", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "TW", district_name_tc: "荃灣區", district_name_en: "Tsuen Wan District", location_name_tc: "荃灣福來邨永定樓對出", location_name_en: "Outside Wing Ting House, Fuk Loi Estate, Tsuen Wan", address_tc: "荃灣福來邨永定樓", date_from: "2026-02-06", date_to: "2026-02-08", closed_dates: "2026-02-05,2026-02-07", is_lcsd_library: false, notes_tc: "2月5日（星期四）及2月7日（星期六）暫停", notes_en: "Closed on Feb 5 (Thu) & Feb 7 (Sat)" },
  // ── WEEK 6: Feb 9–15 ──────────────────────────────────────────────────────
  { truck_number: 1, district_code: "KC", district_name_tc: "葵青區", district_name_en: "Kwai Tsing District", location_name_tc: "青衣牙鷹洲街路旁停車處（麗景灣商場入口對面）", location_name_en: "Roadside Car Park at Nga Ying Chau Street, Tsing Yi", address_tc: "青衣牙鷹洲街", date_from: "2026-02-09", date_to: "2026-02-11", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 1, district_code: "KC", district_name_tc: "葵青區", district_name_en: "Kwai Tsing District", location_name_tc: "葵涌葵景邨平台地下（屋邨辦事處樓下）", location_name_en: "Podium Ground Floor, Kwai King Estate, Kwai Chung", address_tc: "葵涌葵景邨平台地下", date_from: "2026-02-12", date_to: "2026-02-15", closed_dates: "2026-02-14", is_lcsd_library: false, notes_tc: "2月14日（星期六）暫停", notes_en: "Closed on Feb 14 (Sat)" },
  { truck_number: 2, district_code: "STH", district_name_tc: "南區", district_name_en: "Southern District", location_name_tc: "香港仔田灣興和街（近港灣老院）", location_name_en: "Hing Wo Street, Tin Wan, Aberdeen", address_tc: "香港仔田灣興和街", date_from: "2026-02-09", date_to: "2026-02-15", closed_dates: "2026-02-10", is_lcsd_library: false, notes_tc: "2月10日（星期二）暫停", notes_en: "Closed on Feb 10 (Tue)" },
  // ── WEEK 7: Feb 16–22 — SUSPENDED ─────────────────────────────────────────
  { truck_number: 1, district_code: "CW", district_name_tc: "中西區", district_name_en: "Central and Western District", location_name_tc: "暫停服務（農曆新年假期及機件維修）", location_name_en: "Service Suspended (Lunar New Year & Maintenance)", address_tc: null, date_from: "2026-02-16", date_to: "2026-02-22", closed_dates: "2026-02-16,2026-02-17,2026-02-18,2026-02-19,2026-02-20,2026-02-21,2026-02-22", is_lcsd_library: false, notes_tc: "農曆新年假期及機件維修，全週暫停服務", notes_en: "Suspended for Lunar New Year Holiday & Maintenance" },
  { truck_number: 2, district_code: "CW", district_name_tc: "中西區", district_name_en: "Central and Western District", location_name_tc: "暫停服務（農曆新年假期及機件維修）", location_name_en: "Service Suspended (Lunar New Year & Maintenance)", address_tc: null, date_from: "2026-02-16", date_to: "2026-02-22", closed_dates: "2026-02-16,2026-02-17,2026-02-18,2026-02-19,2026-02-20,2026-02-21,2026-02-22", is_lcsd_library: false, notes_tc: "農曆新年假期及機件維修，全週暫停服務", notes_en: "Suspended for Lunar New Year Holiday & Maintenance" },
  // ── WEEK 8: Feb 23–Mar 1 ──────────────────────────────────────────────────
  { truck_number: 1, district_code: "TP", district_name_tc: "大埔區", district_name_en: "Tai Po District", location_name_tc: "大埔廣福道 43-59 號路旁（近中華電力有限公司）", location_name_en: "Roadside at 43-59 Kwong Fuk Road, Tai Po (near CLP Power)", address_tc: "大埔廣福道 43-59 號", date_from: "2026-02-23", date_to: "2026-03-01", closed_dates: "2026-02-24", is_lcsd_library: false, notes_tc: "2月24日（星期二）暫停", notes_en: "Closed on Feb 24 (Tue)" },
  { truck_number: 2, district_code: "WTS", district_name_tc: "黃大仙區", district_name_en: "Wong Tai Sin District", location_name_tc: "慈雲山慈康秀樓及康德樓之間停車位（收革街旁）", location_name_en: "Car Park between Tsz Hong Sau House & Hong Tak House, Tsz Wan Shan", address_tc: "慈雲山慈康秀樓及康德樓之間", date_from: "2026-02-23", date_to: "2026-03-01", closed_dates: "2026-02-26", is_lcsd_library: false, notes_tc: "2月26日（星期四）暫停", notes_en: "Closed on Feb 26 (Thu)" },
  // ── WEEK 9: Mar 2–8 ───────────────────────────────────────────────────────
  { truck_number: 1, district_code: "NTH", district_name_tc: "北區", district_name_en: "North District", location_name_tc: "上水智明街近育賢學校", location_name_en: "Chi Ming Street, Sheung Shui (near Yuk Yin School)", address_tc: "上水智明街", date_from: "2026-03-02", date_to: "2026-03-05", closed_dates: "2026-03-03", is_lcsd_library: false, notes_tc: "3月3日（星期二）暫停", notes_en: "Closed on Mar 3 (Tue)" },
  { truck_number: 1, district_code: "NTH", district_name_tc: "北區", district_name_en: "North District", location_name_tc: "粉嶺和豐路路旁停車處（近 28 場商場）", location_name_en: "Roadside Car Park at Wo Fung Street, Fanling (near 28 Mall)", address_tc: "粉嶺和豐路", date_from: "2026-03-06", date_to: "2026-03-08", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "SK", district_name_tc: "西貢區", district_name_en: "Sai Kung District", location_name_tc: "調景嶺彩明邨彩富園側（近彩明商場行人天橋旁）", location_name_en: "Choi Fu Garden, Choi Ming Estate, Tseung Kwan O", address_tc: "調景嶺彩明邨彩富園側", date_from: "2026-03-02", date_to: "2026-03-08", closed_dates: "2026-03-04,2026-03-06", is_lcsd_library: false, notes_tc: "3月4日（星期三）及3月6日（星期五）暫停", notes_en: "Closed on Mar 4 (Wed) & Mar 6 (Fri)" },
  // ── WEEK 10: Mar 9–15 ─────────────────────────────────────────────────────
  { truck_number: 1, district_code: "KLC", district_name_tc: "九龍城區", district_name_en: "Kowloon City District", location_name_tc: "土瓜灣蔡育巷道（近樂民新村及基進小學）", location_name_en: "Tsoi Yuk Lane, To Kwa Wan", address_tc: "土瓜灣蔡育巷道", date_from: "2026-03-09", date_to: "2026-03-11", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 1, district_code: "KLC", district_name_tc: "九龍城區", district_name_en: "Kowloon City District", location_name_tc: "九龍城德明邨德瑞樓", location_name_en: "Tak Shui House, Tak Ming Estate, Kowloon City", address_tc: "九龍城德明邨德瑞樓", date_from: "2026-03-12", date_to: "2026-03-15", closed_dates: "2026-03-14", is_lcsd_library: false, notes_tc: "3月14日（星期六）暫停", notes_en: "Closed on Mar 14 (Sat)" },
  { truck_number: 2, district_code: "EST", district_name_tc: "東區", district_name_en: "Eastern District", location_name_tc: "西灣河鰂魚涌太康街逸星閣*", location_name_en: "Yat Sing House, Tai Hong Street, Sai Wan Ho*", address_tc: "西灣河鰂魚涌太康街逸星閣", date_from: "2026-03-09", date_to: "2026-03-12", closed_dates: "2026-03-11", is_lcsd_library: true, notes_tc: "3月11日（星期三）暫停", notes_en: "Closed on Mar 11 (Wed)" },
  { truck_number: 2, district_code: "EST", district_name_tc: "東區", district_name_en: "Eastern District", location_name_tc: "北角城市花園道路旁停車處（近城市花園公園）", location_name_en: "Roadside Car Park at City Garden Road, North Point", address_tc: "北角城市花園道", date_from: "2026-03-13", date_to: "2026-03-15", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  // ── WEEK 11: Mar 16–22 ────────────────────────────────────────────────────
  { truck_number: 1, district_code: "YL", district_name_tc: "元朗區", district_name_en: "Yuen Long District", location_name_tc: "洪水橋洪福邨洪樂樓", location_name_en: "Hung Lok House, Hung Fuk Estate, Hung Shui Kiu", address_tc: "洪水橋洪福邨洪樂樓", date_from: "2026-03-16", date_to: "2026-03-19", closed_dates: "2026-03-17", is_lcsd_library: false, notes_tc: "3月17日（星期二）暫停", notes_en: "Closed on Mar 17 (Tue)" },
  { truck_number: 1, district_code: "YL", district_name_tc: "元朗區", district_name_en: "Yuen Long District", location_name_tc: "元朗元朗文化康樂大樓對面路旁停車處（近馬田村口）", location_name_en: "Roadside Car Park opposite Yuen Long Cultural & Recreation Centre", address_tc: "元朗文化康樂大樓對面", date_from: "2026-03-20", date_to: "2026-03-22", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "ST", district_name_tc: "沙田區", district_name_en: "Sha Tin District", location_name_tc: "沙田石門路旁停車處（近水泉澳邨水泉澳廣場對出）", location_name_en: "Roadside Car Park at Shek Mun, Sha Tin", address_tc: "沙田石門路旁", date_from: "2026-03-16", date_to: "2026-03-19", closed_dates: "2026-03-18", is_lcsd_library: false, notes_tc: "3月18日（星期三）暫停", notes_en: "Closed on Mar 18 (Wed)" },
  { truck_number: 2, district_code: "ST", district_name_tc: "沙田區", district_name_en: "Sha Tin District", location_name_tc: "沙田禾輋路旁停車處（沙田政府合署外）", location_name_en: "Roadside Car Park at Wo Che, Sha Tin", address_tc: "沙田禾輋路旁", date_from: "2026-03-20", date_to: "2026-03-22", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  // ── WEEK 12: Mar 23–29 ────────────────────────────────────────────────────
  { truck_number: 1, district_code: "TM", district_name_tc: "屯門區", district_name_en: "Tuen Mun District", location_name_tc: "山景邨景茶樓（近綠色廊旁）", location_name_en: "King Cha House, Shan King Estate", address_tc: "屯門山景邨景茶樓", date_from: "2026-03-23", date_to: "2026-03-29", closed_dates: "2026-03-26", is_lcsd_library: false, notes_tc: "3月26日（星期四）暫停", notes_en: "Closed on Mar 26 (Thu)" },
  { truck_number: 2, district_code: "WC", district_name_tc: "灣仔區", district_name_en: "Wan Chai District", location_name_tc: "天后發仙街路旁停車處（近港鐵天后站 A2 出口）", location_name_en: "Roadside Car Park at Fat Sin Street, Tin Hau", address_tc: "天后發仙街", date_from: "2026-03-23", date_to: "2026-03-26", closed_dates: "2026-03-25", is_lcsd_library: false, notes_tc: "3月25日（星期三）暫停", notes_en: "Closed on Mar 25 (Wed)" },
  { truck_number: 2, district_code: "WC", district_name_tc: "灣仔區", district_name_en: "Wan Chai District", location_name_tc: "大坑書花宮西街（中華大廈對出）", location_name_en: "Shu Fa Kung West Street, Tai Hang", address_tc: "大坑書花宮西街", date_from: "2026-03-27", date_to: "2026-03-29", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  // ── WEEK 13: Mar 30–Apr 5 ─────────────────────────────────────────────────
  { truck_number: 1, district_code: "SSP", district_name_tc: "深水埗區", district_name_en: "Sham Shui Po District", location_name_tc: "富昌邨富昌樓*", location_name_en: "Fu Cheong House, Fu Cheong Estate*", address_tc: "富昌邨富昌樓", date_from: "2026-03-30", date_to: "2026-04-05", closed_dates: "2026-04-03", is_lcsd_library: true, notes_tc: "4月3日（星期五）暫停", notes_en: "Closed on Apr 3 (Fri)" },
  { truck_number: 2, district_code: "STH", district_name_tc: "南區", district_name_en: "Southern District", location_name_tc: "鴨脷洲海裕路海裕半島第 11 座對開路旁", location_name_en: "Roadside opposite Block 11, Larvotto, Ap Lei Chau", address_tc: "鴨脷洲海裕路海裕半島第 11 座", date_from: "2026-03-30", date_to: "2026-04-05", closed_dates: "2026-04-02", is_lcsd_library: false, notes_tc: "4月2日（星期四）暫停", notes_en: "Closed on Apr 2 (Thu)" },
  // ── WEEK 14: Apr 6–12 ─────────────────────────────────────────────────────
  { truck_number: 1, district_code: "NTH", district_name_tc: "北區", district_name_en: "North District", location_name_tc: "粉嶺清晨間露天廣場", location_name_en: "Ching Sun Kan Open-Air Plaza, Fanling", address_tc: "粉嶺清晨間露天廣場", date_from: "2026-04-06", date_to: "2026-04-09", closed_dates: "2026-04-07", is_lcsd_library: false, notes_tc: "4月7日（星期二）暫停", notes_en: "Closed on Apr 7 (Tue)" },
  { truck_number: 1, district_code: "NTH", district_name_tc: "北區", district_name_en: "North District", location_name_tc: "上水彩園邨彩園會堂側（近坦堵苑滑滑溜圈）", location_name_en: "Choi Yuen Community Hall, Choi Yuen Estate, Sheung Shui", address_tc: "上水彩園邨彩園會堂側", date_from: "2026-04-11", date_to: "2026-04-12", closed_dates: "2026-04-10", is_lcsd_library: false, notes_tc: "4月10日（星期五）暫停", notes_en: "Closed on Apr 10 (Fri)" },
  { truck_number: 2, district_code: "SK", district_name_tc: "西貢區", district_name_en: "Sai Kung District", location_name_tc: "西貢賽馬會大會堂停車場", location_name_en: "Jockey Club Town Hall Car Park, Sai Kung", address_tc: "西貢賽馬會大會堂停車場", date_from: "2026-04-06", date_to: "2026-04-08", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "SK", district_name_tc: "西貢區", district_name_en: "Sai Kung District", location_name_tc: "將軍澳健明邨健晴樓*", location_name_en: "Kin Ching House, Kin Ming Estate, Tseung Kwan O*", address_tc: "將軍澳健明邨健晴樓", date_from: "2026-04-10", date_to: "2026-04-12", closed_dates: "2026-04-09", is_lcsd_library: true, notes_tc: "4月9日（星期三）暫停", notes_en: "Closed on Apr 9 (Wed)" },
  // ── WEEK 15: Apr 13–19 ────────────────────────────────────────────────────
  { truck_number: 1, district_code: "YTM", district_name_tc: "油尖旺區", district_name_en: "Yau Tsim Mong District", location_name_tc: "尖沙咀摩地道路旁停車處（近 K11）", location_name_en: "Roadside Car Park at Mody Road, Tsim Sha Tsui (near K11)", address_tc: "尖沙咀摩地道", date_from: "2026-04-13", date_to: "2026-04-19", closed_dates: "2026-04-16", is_lcsd_library: false, notes_tc: "4月16日（星期四）暫停", notes_en: "Closed on Apr 16 (Thu)" },
  { truck_number: 2, district_code: "ST", district_name_tc: "沙田區", district_name_en: "Sha Tin District", location_name_tc: "大圍素林邨素美樓*", location_name_en: "So Mei House, So Lam Estate, Tai Wai*", address_tc: "大圍素林邨素美樓", date_from: "2026-04-13", date_to: "2026-04-19", closed_dates: "2026-04-17", is_lcsd_library: true, notes_tc: "4月17日（星期五）暫停", notes_en: "Closed on Apr 17 (Fri)" },
  // ── WEEK 16: Apr 20–26 ────────────────────────────────────────────────────
  { truck_number: 1, district_code: "KLC", district_name_tc: "九龍城區", district_name_en: "Kowloon City District", location_name_tc: "土瓜灣化街（近欣葵花園）", location_name_en: "Fa Street, To Kwa Wan (near Yan Kwai Garden)", address_tc: "土瓜灣化街", date_from: "2026-04-20", date_to: "2026-04-26", closed_dates: "2026-04-23", is_lcsd_library: false, notes_tc: "4月23日（星期四）暫停", notes_en: "Closed on Apr 23 (Thu)" },
  { truck_number: 2, district_code: "CW", district_name_tc: "中西區", district_name_en: "Central and Western District", location_name_tc: "西營盤干諾道西 169-178 號及 181 號路旁停車處", location_name_en: "Roadside Car Park at 169-178 & 181 Connaught Road West, Sai Ying Pun", address_tc: "西營盤干諾道西 169-178 號及 181 號", date_from: "2026-04-20", date_to: "2026-04-23", closed_dates: "2026-04-22", is_lcsd_library: false, notes_tc: "4月22日（星期三）暫停", notes_en: "Closed on Apr 22 (Wed)" },
  { truck_number: 2, district_code: "CW", district_name_tc: "中西區", district_name_en: "Central and Western District", location_name_tc: "西環堅尼地城新海旁街路旁停車處（近堅尼地城消防局）", location_name_en: "Roadside Car Park at New Praya, Kennedy Town", address_tc: "西環堅尼地城新海旁街", date_from: "2026-04-24", date_to: "2026-04-26", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  // ── WEEK 17: Apr 27–May 3 ─────────────────────────────────────────────────
  { truck_number: 1, district_code: "YL", district_name_tc: "元朗區", district_name_en: "Yuen Long District", location_name_tc: "天水圍天晴邨晴喜樓*", location_name_en: "Ching Hei House, Tin Ching Estate, Tin Shui Wai*", address_tc: "天水圍天晴邨晴喜樓", date_from: "2026-04-27", date_to: "2026-05-01", closed_dates: "2026-04-30", is_lcsd_library: true, notes_tc: "4月30日（星期四）暫停", notes_en: "Closed on Apr 30 (Thu)" },
  { truck_number: 1, district_code: "YL", district_name_tc: "元朗區", district_name_en: "Yuen Long District", location_name_tc: "錦田鄉鄉交通總匯（近 PARK CIRCLE 商場）", location_name_en: "Kam Tin Rural Transport Terminus (near Park Circle)", address_tc: "錦田鄉鄉交通總匯", date_from: "2026-05-02", date_to: "2026-05-03", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "TP", district_name_tc: "大埔區", district_name_en: "Tai Po District", location_name_tc: "大埔寶鄉邨祐和閣側（近太和體育館）", location_name_en: "Yau Wo House, Po Heung Estate, Tai Po", address_tc: "大埔寶鄉邨祐和閣側", date_from: "2026-04-27", date_to: "2026-04-30", closed_dates: null, is_lcsd_library: false, notes_tc: null, notes_en: null },
  { truck_number: 2, district_code: "TP", district_name_tc: "大埔區", district_name_en: "Tai Po District", location_name_tc: "大埔大亨邨亨翠樓*", location_name_en: "Hang Chui House, Tai Hang Estate, Tai Po*", address_tc: "大埔大亨邨亨翠樓", date_from: "2026-05-02", date_to: "2026-05-03", closed_dates: "2026-05-01", is_lcsd_library: true, notes_tc: "5月1日（星期五）暫停", notes_en: "Closed on May 1 (Fri)" },
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(conn);

  // Check if already seeded
  const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM truck_schedules");
  const count = rows[0].cnt;
  if (count > 0) {
    console.log(`Already seeded (${count} rows). Skipping.`);
    await conn.end();
    return;
  }

  // Insert in batches
  for (let i = 0; i < SEED_DATA.length; i += 20) {
    const batch = SEED_DATA.slice(i, i + 20);
    const placeholders = batch.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
    const values = batch.flatMap(r => [
      r.truck_number, r.district_code, r.district_name_tc, r.district_name_en,
      r.location_name_tc, r.location_name_en ?? null, r.address_tc ?? null,
      r.date_from, r.date_to, r.closed_dates ?? null,
      r.is_lcsd_library ? 1 : 0,
      r.notes_tc ?? null, r.notes_en ?? null,
      new Date().toISOString().slice(0, 19).replace("T", " "),
    ]);
    await conn.execute(
      `INSERT INTO truck_schedules (truck_number, district_code, district_name_tc, district_name_en, location_name_tc, location_name_en, address_tc, date_from, date_to, closed_dates, is_lcsd_library, notes_tc, notes_en, created_at) VALUES ${placeholders}`,
      values
    );
    console.log(`Inserted rows ${i + 1}–${Math.min(i + 20, SEED_DATA.length)}`);
  }

  console.log(`✅ Seeded ${SEED_DATA.length} schedule entries.`);
  await conn.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
