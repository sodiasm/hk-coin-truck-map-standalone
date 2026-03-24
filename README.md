# 香港收銀車服務地圖 — HK Cash Coin Truck Service Map

An interactive public service map showing the Hong Kong Monetary Authority (HKMA) Cash Coin Truck 1 & 2 service schedules across all 18 Hong Kong districts.

[English](#english) | [繁體中文](#traditional-chinese) | [简体中文](#simplified-chinese)

---

<a name="english"></a>
## 🇬🇧 English Summary

### Latest Deployment (March 2026)
The project has been successfully migrated and deployed to a modern serverless architecture for better scalability and reliability.

*   **Live Frontend (Vercel):** [https://hk-coin-truck-map-standalone.vercel.app](https://hk-coin-truck-map-standalone.vercel.app)
*   **Backend Database (Supabase):** `jsmnutbliuqmgdoeiogi.supabase.co`
*   **GitHub Repository:** [https://github.com/sodiasm/hk-coin-truck-map-standalone](https://github.com/sodiasm/hk-coin-truck-map-standalone)

### Key Updates
*   **Database Migration:** Migrated from MySQL to PostgreSQL (Supabase).
*   **Serverless Adaptation:** Converted the Express server to Vercel Serverless Functions using `@trpc/server/adapters/node-http`.
*   **Data Seeding:** 52 truck schedule records (Jan–May 2026) are fully seeded and verified.
*   **Performance:** Pre-bundled dependencies with `esbuild` for optimized Vercel runtime performance.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Leaflet.js, shadcn/ui |
| Backend | tRPC 11 (Vercel Serverless) |
| Database | PostgreSQL (Supabase) |
| Map data | OpenStreetMap, CSDI GeoJSON |

---

<a name="traditional-chinese"></a>
## 🇭🇰 繁體中文摘要 (Traditional Chinese)

### 最新部署 (2026年3月)
本項目已成功遷移並部署至現代化的無伺服器 (Serverless) 架構，以提供更好的擴展性和穩定性。

*   **前端展示 (Vercel):** [https://hk-coin-truck-map-standalone.vercel.app](https://hk-coin-truck-map-standalone.vercel.app)
*   **後端數據庫 (Supabase):** `jsmnutbliuqmgdoeiogi.supabase.co`
*   **GitHub 倉庫:** [https://github.com/sodiasm/hk-coin-truck-map-standalone](https://github.com/sodiasm/hk-coin-truck-map-standalone)

### 主要更新
*   **數據庫遷移:** 從 MySQL 遷移至 PostgreSQL (Supabase)。
*   **無伺服器適配:** 使用 `@trpc/server/adapters/node-http` 將 Express 服務器轉換為 Vercel Serverless Functions。
*   **數據導入:** 已導入並驗證 2026 年 1 月至 5 月共 52 條收銀車日程記錄。
*   **性能優化:** 使用 `esbuild` 預編譯依賴項，優化 Vercel 運行時效率。

### 技術棧
| 層級 | 技術 |
|-------|-----------|
| 前端 | React 19, Tailwind CSS 4, Leaflet.js, shadcn/ui |
| 後端 | tRPC 11 (Vercel Serverless) |
| 數據庫 | PostgreSQL (Supabase) |
| 地圖數據 | OpenStreetMap, CSDI GeoJSON |

---

<a name="simplified-chinese"></a>
## 🇨🇳 简体中文摘要 (Simplified Chinese)

### 最新部署 (2026年3月)
本项目已成功迁移并部署至现代化的无服务器 (Serverless) 架构，以提供更好的扩展性和稳定性。

*   **前端展示 (Vercel):** [https://hk-coin-truck-map-standalone.vercel.app](https://hk-coin-truck-map-standalone.vercel.app)
*   **后端数据库 (Supabase):** `jsmnutbliuqmgdoeiogi.supabase.co`
*   **GitHub 仓库:** [https://github.com/sodiasm/hk-coin-truck-map-standalone](https://github.com/sodiasm/hk-coin-truck-map-standalone)

### 主要更新
*   **数据库迁移:** 从 MySQL 迁移至 PostgreSQL (Supabase)。
*   **无服务器适配:** 使用 `@trpc/server/adapters/node-http` 将 Express 服务器转换为 Vercel Serverless Functions。
*   **数据导入:** 已导入并验证 2026 年 1 月至 5 月共 52 条收银车日程记录。
*   **性能优化:** 使用 `esbuild` 预编译依赖项，优化 Vercel 运行时效率。

### 技术栈
| 层级 | 技术 |
|-------|-----------|
| 前端 | React 19, Tailwind CSS 4, Leaflet.js, shadcn/ui |
| 后端 | tRPC 11 (Vercel Serverless) |
| 数据库 | PostgreSQL (Supabase) |
| 地图数据 | OpenStreetMap, CSDI GeoJSON |

---

## Features / 功能特點

- **Interactive Leaflet.js map** with OpenStreetMap base layer and CSDI GeoJSON district boundaries
- **District colour coding** — blue (Truck 1 active), amber (Truck 2 active), purple (both active), diagonal stripes (scheduled but closed today), transparent (no service)
- **GPS pin markers** for each service location with clickable popups showing location, status, and service hours
- **Bilingual UI** — Traditional Chinese / English toggle
- **Schedule panel** — today's active services with closed-day warnings and LCSD mobile library badges
- **Filter bar** — filter by district and date range (default: today)
- **Admin interface** — CRUD management for truck schedules (admin role required)
- **HKMA Jan–May 2026 schedule** pre-seeded (52 entries)

## Getting Started / 快速開始

```bash
# Install dependencies
pnpm install

# Set environment variables (copy from .env.example)
cp .env.example .env

# Run database migrations (Drizzle)
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

## Environment Variables / 環境變量

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `ADMIN_TOKEN` | Secret token to access the `/admin` panel |
| `DATABASE_URL` | Legacy connection string (kept for compatibility) |

## Data Sources / 數據來源

- **Schedule data**: [HKMA Coin Collection Truck](https://www.hkma.gov.hk/chi/key-functions/monetary-stability/notes-and-coins/coin-collection-truck/)
- **District boundaries**: [CSDI GeoJSON](https://portal.csdi.gov.hk/server/services/common/had_rcd_1634523272907_75218/MapServer/WFSServer?service=wfs&request=GetFeature&typenames=DCD&outputFormat=geojson)
- **Base map**: [OpenStreetMap](https://www.openstreetmap.org/)

## Service Hours / 服務時間

All locations operate **10:00 AM – 7:00 PM** daily (except closed dates).  
Locations marked with `*` are LCSD Mobile Library service points.

## License

MIT
