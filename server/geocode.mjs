/**
 * Geocode all truck_schedules rows that have no lat/lng yet.
 * Uses OpenStreetMap Nominatim (free, no API key needed).
 * Run: node server/geocode.mjs
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  // Try loading from .env
  try {
    const env = readFileSync(".env", "utf8");
    for (const line of env.split("\n")) {
      const [k, ...v] = line.split("=");
      if (k?.trim() === "DATABASE_URL") process.env.DATABASE_URL = v.join("=").trim();
    }
  } catch {}
}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Nominatim geocoder with polite delay
async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=hk`;
  const res = await fetch(url, {
    headers: { "User-Agent": "hk-coin-truck-map/1.0 (geocoding service locations)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Known fallback coordinates for locations that Nominatim may not find precisely
// Format: partial address string → [lat, lng]
const FALLBACKS = {
  "上環永樂街": [22.2868, 114.1499],
  "天水圍天瑞邨": [22.4588, 114.0056],
  "大圍村南道": [22.3726, 114.1877],
  "沙田新翠邨": [22.3826, 114.1929],
  "愉景灣愉景廣場": [22.2723, 113.9444],
  "東涌滿東邨": [22.2887, 113.9425],
  "石硤尾大坑東邨": [22.3364, 114.1677],
  "深水埗警局街": [22.3305, 114.1621],
  "佐敦廣東道": [22.3046, 114.1695],
  "油麻地砵蘭街": [22.3105, 114.1699],
  "秀茂坪邨": [22.3199, 114.2316],
  "觀塘翠屏道": [22.3155, 114.2248],
  "灣仔軒尼詩道": [22.2793, 114.1728],
  "銅鑼灣": [22.2818, 114.1831],
  "荃灣": [22.3706, 114.1178],
  "葵涌": [22.3569, 114.1284],
  "青衣": [22.3403, 114.1049],
  "屯門": [22.3934, 113.9769],
  "元朗": [22.4445, 114.0221],
  "粉嶺": [22.4924, 114.1389],
  "上水": [22.5023, 114.1278],
  "大埔": [22.4457, 114.1640],
  "沙田": [22.3826, 114.1929],
  "西貢": [22.3816, 114.2706],
  "將軍澳": [22.3074, 114.2596],
  "九龍城": [22.3282, 114.1918],
  "黃大仙": [22.3427, 114.1936],
  "牛頭角": [22.3248, 114.2179],
  "觀塘": [22.3123, 114.2261],
  "香港仔": [22.2480, 114.1571],
  "南區": [22.2480, 114.1571],
  "離島": [22.2887, 113.9425],
};

function getFallback(addressTc) {
  for (const [key, coords] of Object.entries(FALLBACKS)) {
    if (addressTc.includes(key)) return { lat: coords[0], lng: coords[1] };
  }
  return null;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const conn = await mysql.createConnection(DB_URL);

  const [rows] = await conn.execute(
    "SELECT id, location_name_tc, address_tc, district_name_tc FROM truck_schedules WHERE lat IS NULL OR lng IS NULL"
  );

  console.log(`Found ${rows.length} rows to geocode...`);

  let updated = 0;
  let fallbacks = 0;
  let failed = 0;

  for (const row of rows) {
    const address = row.address_tc || row.location_name_tc;
    const query = `${address}, 香港`;

    let coords = null;

    // Try Nominatim first
    try {
      coords = await geocode(query);
      await sleep(1100); // Nominatim rate limit: 1 req/sec
    } catch (e) {
      console.warn(`  Nominatim error for "${address}":`, e.message);
    }

    // Fall back to known coordinates
    if (!coords) {
      coords = getFallback(address);
      if (coords) fallbacks++;
    }

    if (coords) {
      await conn.execute(
        "UPDATE truck_schedules SET lat = ?, lng = ? WHERE id = ?",
        [coords.lat, coords.lng, row.id]
      );
      console.log(`  ✓ [${row.id}] ${address} → (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
      updated++;
    } else {
      console.warn(`  ✗ [${row.id}] Could not geocode: ${address}`);
      failed++;
    }
  }

  await conn.end();
  console.log(`\nDone: ${updated} updated (${fallbacks} from fallback), ${failed} failed.`);
}

main().catch(e => { console.error(e); process.exit(1); });
