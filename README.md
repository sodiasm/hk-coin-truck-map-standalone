# 香港收銀車服務地圖 — HK Cash Coin Truck Service Map

An interactive public service map showing the Hong Kong Monetary Authority (HKMA) Cash Coin Truck 1 & 2 service schedules across all 18 Hong Kong districts.

## Features

- **Interactive Leaflet.js map** with OpenStreetMap base layer and CSDI GeoJSON district boundaries
- **District colour coding** — blue (Truck 1 active), amber (Truck 2 active), purple (both active), diagonal stripes (scheduled but closed today), transparent (no service)
- **GPS pin markers** for each service location with clickable popups showing location, status, and service hours
- **Bilingual UI** — Traditional Chinese / English toggle
- **Schedule panel** — today's active services with closed-day warnings and LCSD mobile library badges
- **Filter bar** — filter by district and date range
- **Admin interface** — CRUD management for truck schedules (admin role required)
- **HKMA Jan–May 2026 schedule** pre-seeded (52 entries)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, Leaflet.js, shadcn/ui |
| Backend | Express 4, tRPC 11, Drizzle ORM |
| Database | MySQL (TiDB compatible) |
| Auth | Manus OAuth |
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

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL |

## Data Sources

- **Schedule data**: [HKMA Coin Collection Truck](https://www.hkma.gov.hk/chi/key-functions/monetary-stability/notes-and-coins/coin-collection-truck/)
- **District boundaries**: [CSDI GeoJSON](https://portal.csdi.gov.hk/server/services/common/had_rcd_1634523272907_75218/MapServer/WFSServer?service=wfs&request=GetFeature&typenames=DCD&outputFormat=geojson)
- **Base map**: [OpenStreetMap](https://www.openstreetmap.org/)

## Service Hours

All locations operate **10:00 AM – 7:00 PM** daily (except closed dates).  
Locations marked with `*` are LCSD Mobile Library service points.

## License

MIT
