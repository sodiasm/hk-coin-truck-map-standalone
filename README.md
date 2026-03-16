# 香港收銀車服務地圖 — HK Cash Coin Truck Service Map

An interactive public service map showing the Hong Kong Monetary Authority (HKMA) Cash Coin Truck 1 & 2 service schedules across all 18 Hong Kong districts.

## Features

- **Interactive Leaflet.js map** with OpenStreetMap base layer and CSDI GeoJSON district boundaries
- **District colour coding** — blue (Truck 1 active), amber (Truck 2 active), purple (both active), diagonal stripes (scheduled but closed today), transparent (no service)
- **GPS pin markers** for each service location with clickable popups showing location, status, and service hours
- **Bilingual UI** — Traditional Chinese / English toggle
- **Schedule panel** — today's active services with closed-day warnings and LCSD mobile library badges
- **Filter bar** — filter by district and date range (default: today)
- **Admin interface** — CRUD management for truck schedules (admin role required)
- **HKMA Jan–May 2026 schedule** pre-seeded (52 entries)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Leaflet.js, shadcn/ui |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| Database | MySQL (TiDB compatible) |
| Auth | Token-based (ADMIN_TOKEN env var) |
| Map data | OpenStreetMap, CSDI GeoJSON (18 districts) |

## Getting Started

```bash
# Install dependencies
pnpm install

# Set environment variables (copy from .env.example)
cp .env.example .env

# Run database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Seed HKMA schedule data
node server/seed.mjs

# (Optional) Geocode service locations
node server/geocode.mjs

# Start development server
pnpm dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string, e.g. `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Yes | Random 32-byte hex string for cookie signing |
| `ADMIN_TOKEN` | Yes | Secret token to access the `/admin` panel |
| `NODE_ENV` | No | Set to `production` in deployment |
| `PORT` | No | Server port (default: 3000; Zeabur injects automatically) |

## Deploying to Zeabur

1. Push this repo to GitHub.
2. Create a new project on [Zeabur](https://zeabur.com).
3. Add a **MySQL** service (or connect PlanetScale via `DATABASE_URL`).
4. Add a **Node.js** service pointing to this repo.
5. Set the three required environment variables in the Zeabur dashboard: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_TOKEN`.
6. Zeabur will auto-detect `zeabur.json` and run `pnpm install && pnpm build` then `node dist/index.js`.
7. After first deploy, run the seed script once: `node server/seed.mjs`.

## Admin Access

Navigate to `/admin` and enter your `ADMIN_TOKEN` value. The token is stored in `sessionStorage` for the browser session — closing the tab clears it.

## Data Sources

- **Schedule data**: [HKMA Coin Collection Truck](https://www.hkma.gov.hk/chi/key-functions/monetary-stability/notes-and-coins/coin-collection-truck/)
- **District boundaries**: [CSDI GeoJSON](https://portal.csdi.gov.hk/server/services/common/had_rcd_1634523272907_75218/MapServer/WFSServer?service=wfs&request=GetFeature&typenames=DCD&outputFormat=geojson)
- **Base map**: [OpenStreetMap](https://www.openstreetmap.org/)

## Service Hours

All locations operate **10:00 AM – 7:00 PM** daily (except closed dates).  
Locations marked with `*` are LCSD Mobile Library service points.

---

## Service Location Reference — Jan to May 2026 (52 entries)

> Coordinates are in WGS84 (latitude, longitude). All geocodes were resolved via Nominatim / OpenStreetMap.

### 收銀車 1 號 — Cash Coin Truck 1

| # | District 地區 | Date Range 日期 | Location 地點 | Lat | Lng |
|---|--------------|----------------|---------------|-----|-----|
| 1 | 中西區 Central & Western | 2026-01-05 ~ 2026-01-11 | 上環永樂街 118 號路旁停車處（近上環文化廣場） | 22.2868 | 114.1499 |
| 3 | 沙田區 Sha Tin | 2026-01-12 ~ 2026-01-15 | 大圍村南道（近大圍港鐵站 A 出口） | 22.3726 | 114.1877 |
| 4 | 沙田區 Sha Tin | 2026-01-17 ~ 2026-01-18 | 沙田新翠邨新翠廣場 * | 22.3826 | 114.1929 |
| 7 | 深水埗區 Sham Shui Po | 2026-01-19 ~ 2026-01-22 | 石硤尾大坑東邨東怡樓側（東健樓與東怡樓之間車位） | 22.3364 | 114.1677 |
| 8 | 深水埗區 Sham Shui Po | 2026-01-23 ~ 2026-01-25 | 深水埗警局街路旁停車處（近嘉美中心外） | 22.3305 | 114.1621 |
| 11 | 觀塘區 Kwun Tong | 2026-01-27 ~ 2026-01-29 | 秀茂坪邨秀曦樓假空地（香港考試中心旁） | 22.3199 | 114.2316 |
| 12 | 觀塘區 Kwun Tong | 2026-01-30 ~ 2026-02-01 | 觀塘翠屏道 19 號路旁停車處（近翠屏北邨翠鄰樓） | 22.3155 | 114.2248 |
| 14 | 屯門區 Tuen Mun | 2026-02-02 ~ 2026-02-08 | 屯門寶田邨第四座 * | 22.3934 | 113.9769 |
| 17 | 葵青區 Kwai Tsing | 2026-02-09 ~ 2026-02-11 | 青衣牙鷹洲街路旁停車處（麗景灣商場入口對面） | 22.3403 | 114.1049 |
| 18 | 葵青區 Kwai Tsing | 2026-02-12 ~ 2026-02-15 | 葵涌葵景邨平台地下（屋邨辦事處樓下） | 22.3569 | 114.1284 |
| 20 | — | 2026-02-16 ~ 2026-02-22 | 暫停服務（農曆新年假期及機件維修） | 22.3706 | 114.1178 |
| 22 | 大埔區 Tai Po | 2026-02-23 ~ 2026-03-01 | 大埔廣福道 43-59 號路旁（近中華電力有限公司） | 22.4457 | 114.1640 |
| 24 | 北區 North | 2026-03-02 ~ 2026-03-05 | 上水智明街近育賢學校 | 22.5023 | 114.1278 |
| 25 | 北區 North | 2026-03-06 ~ 2026-03-08 | 粉嶺和豐路路旁停車處（近 28 場商場） | 22.4924 | 114.1389 |
| 27 | 九龍城區 Kowloon City | 2026-03-09 ~ 2026-03-11 | 土瓜灣蔡育巷道（近樂民新村及基進小學） | 22.3248 | 114.1918 |
| 28 | 九龍城區 Kowloon City | 2026-03-12 ~ 2026-03-15 | 九龍城德明邨德瑞樓 | 22.3282 | 114.1918 |
| 31 | 元朗區 Yuen Long | 2026-03-16 ~ 2026-03-19 | 洪水橋洪福邨洪樂樓 | 22.4588 | 114.0056 |
| 32 | 元朗區 Yuen Long | 2026-03-20 ~ 2026-03-22 | 元朗元朗文化康樂大樓對面路旁停車處（近馬田村口） | 22.4445 | 114.0221 |
| 35 | 屯門區 Tuen Mun | 2026-03-23 ~ 2026-03-29 | 山景邨景茶樓（近綠色廊旁） | 22.3934 | 113.9769 |
| 38 | 深水埗區 Sham Shui Po | 2026-03-30 ~ 2026-04-05 | 富昌邨富昌樓 * | 22.3569 | 114.1284 |
| 40 | 北區 North | 2026-04-06 ~ 2026-04-09 | 粉嶺清晨間露天廣場 | 22.4924 | 114.1389 |
| 41 | 北區 North | 2026-04-11 ~ 2026-04-12 | 上水彩園邨彩園會堂側（近坦堵苑滑滑溜圈） | 22.5023 | 114.1278 |
| 44 | 油尖旺區 Yau Tsim Mong | 2026-04-13 ~ 2026-04-19 | 尖沙咀摩地道路旁停車處（近 K11） | 22.2980 | 114.1720 |
| 46 | 九龍城區 Kowloon City | 2026-04-20 ~ 2026-04-26 | 土瓜灣化街（近欣葵花園） | 22.3248 | 114.1918 |
| 49 | 元朗區 Yuen Long | 2026-04-27 ~ 2026-05-01 | 天水圍天晴邨晴喜樓 * | 22.4588 | 114.0056 |
| 50 | 元朗區 Yuen Long | 2026-05-02 ~ 2026-05-03 | 錦田鄉鄉交通總匯（近 PARK CIRCLE 商場） | 22.4445 | 114.0221 |

### 收銀車 2 號 — Cash Coin Truck 2

| # | District 地區 | Date Range 日期 | Location 地點 | Lat | Lng |
|---|--------------|----------------|---------------|-----|-----|
| 2 | 元朗區 Yuen Long | 2026-01-05 ~ 2026-01-11 | 天水圍天瑞邨天瑞社區中心 * | 22.4588 | 114.0056 |
| 5 | 離島區 Islands | 2026-01-12 ~ 2026-01-14 | 愉景灣愉景廣場輸船灣郵局側 * | 22.2723 | 113.9444 |
| 6 | 離島區 Islands | 2026-01-15 ~ 2026-01-18 | 東涌滿東邨滿翠樓 | 22.2887 | 113.9425 |
| 9 | 油尖旺區 Yau Tsim Mong | 2026-01-19 ~ 2026-01-22 | 佐敦廣東道 575 號 | 22.3046 | 114.1695 |
| 10 | 油尖旺區 Yau Tsim Mong | 2026-01-23 ~ 2026-01-25 | 油麻地砵蘭街路旁停車處（砵蘭街交明街休憩處旁） | 22.3105 | 114.1699 |
| 13 | 灣仔區 Wan Chai | 2026-01-27 ~ 2026-02-01 | 灣仔港灣道灣景中心路旁停車處（港灣中心正對面） | 22.2793 | 114.1728 |
| 15 | 荃灣區 Tsuen Wan | 2026-02-02 ~ 2026-02-04 | 荃灣眾安街（荃灣千色匯一期外） | 22.3706 | 114.1178 |
| 16 | 荃灣區 Tsuen Wan | 2026-02-06 ~ 2026-02-08 | 荃灣福來邨永定樓對出 | 22.3706 | 114.1178 |
| 19 | 南區 Southern | 2026-02-09 ~ 2026-02-15 | 香港仔田灣興和街（近港灣老院） | 22.2480 | 114.1571 |
| 21 | — | 2026-02-16 ~ 2026-02-22 | 暫停服務（農曆新年假期及機件維修） | 22.3706 | 114.1178 |
| 23 | 黃大仙區 Wong Tai Sin | 2026-02-23 ~ 2026-03-01 | 慈雲山慈康秀樓及康德樓之間停車位（收革街旁） | 22.3427 | 114.1936 |
| 26 | 西貢區 Sai Kung | 2026-03-02 ~ 2026-03-08 | 調景嶺彩明邨彩富園側（近彩明商場行人天橋旁） | 22.3074 | 114.2596 |
| 29 | 東區 Eastern | 2026-03-09 ~ 2026-03-12 | 西灣河鰂魚涌太康街逸星閣 * | 22.2818 | 114.2212 |
| 30 | 東區 Eastern | 2026-03-13 ~ 2026-03-15 | 北角城市花園道路旁停車處（近城市花園公園） | 22.2912 | 114.1993 |
| 33 | 沙田區 Sha Tin | 2026-03-16 ~ 2026-03-19 | 沙田石門路旁停車處（近水泉澳邨水泉澳廣場對出） | 22.3826 | 114.1929 |
| 34 | 沙田區 Sha Tin | 2026-03-20 ~ 2026-03-22 | 沙田禾輋路旁停車處（沙田政府合署外） | 22.3826 | 114.1929 |
| 36 | 灣仔區 Wan Chai | 2026-03-23 ~ 2026-03-26 | 天后發仙街路旁停車處（近港鐵天后站 A2 出口） | 22.2818 | 114.1831 |
| 37 | 灣仔區 Wan Chai | 2026-03-27 ~ 2026-03-29 | 大坑書花宮西街（中華大廈對出） | 22.2793 | 114.1831 |
| 39 | 南區 Southern | 2026-03-30 ~ 2026-04-05 | 鴨脷洲海裕路海裕半島第 11 座對開路旁 | 22.2480 | 114.1571 |
| 42 | 西貢區 Sai Kung | 2026-04-06 ~ 2026-04-08 | 西貢賽馬會大會堂停車場 | 22.3816 | 114.2706 |
| 43 | 西貢區 Sai Kung | 2026-04-10 ~ 2026-04-12 | 將軍澳健明邨健晴樓 * | 22.3074 | 114.2596 |
| 45 | 沙田區 Sha Tin | 2026-04-13 ~ 2026-04-19 | 大圍素林邨素美樓 * | 22.3726 | 114.1877 |
| 47 | 中西區 Central & Western | 2026-04-20 ~ 2026-04-23 | 西營盤干諾道西 169-178 號及 181 號路旁停車處 | 22.2868 | 114.1380 |
| 48 | 中西區 Central & Western | 2026-04-24 ~ 2026-04-26 | 西環堅尼地城新海旁街路旁停車處（近堅尼地城消防局） | 22.2868 | 114.1280 |
| 51 | 大埔區 Tai Po | 2026-04-27 ~ 2026-04-30 | 大埔寶鄉邨祐和閣側（近太和體育館） | 22.4457 | 114.1640 |
| 52 | 大埔區 Tai Po | 2026-05-02 ~ 2026-05-03 | 大埔大亨邨亨翠樓 * | 22.4457 | 114.1640 |

> `*` denotes an LCSD Mobile Library service point (流動圖書館服務點).

---

## License

MIT
