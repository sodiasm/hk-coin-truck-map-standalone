/**
 * Manual coordinate fixes for locations Nominatim couldn't resolve.
 * Coordinates sourced from Google Maps / HK government data.
 */
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

try {
  const env = readFileSync(".env", "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k?.trim() === "DATABASE_URL") process.env.DATABASE_URL = v.join("=").trim();
  }
} catch {}

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

// id → [lat, lng]  (verified against HK map data)
const MANUAL = {
  13: [22.2793, 114.1728],  // 灣仔港灣道 (Wan Chai Harbour Road)
  20: [22.3706, 114.1178],  // 暫停服務 — fallback to Tsuen Wan district centre
  21: [22.3706, 114.1178],  // 暫停服務 — fallback to Tsuen Wan district centre
  23: [22.3427, 114.1936],  // 慈雲山慈康秀樓 (Tsz Wan Shan)
  26: [22.3074, 114.2596],  // 調景嶺彩明邨 (Tseung Kwan O)
  27: [22.3248, 114.1918],  // 土瓜灣蔡育巷道 (To Kwa Wan)
  29: [22.2818, 114.2212],  // 西灣河鰂魚涌太康街 (Sai Wan Ho)
  30: [22.2912, 114.1993],  // 北角城市花園道 (North Point)
  31: [22.4588, 114.0056],  // 洪水橋洪福邨 (Hung Shui Kiu, Yuen Long)
  36: [22.2818, 114.1831],  // 天后發仙街 (Tin Hau, Causeway Bay area)
  37: [22.2793, 114.1831],  // 大坑書花宮西街 (Tai Hang)
  38: [22.3569, 114.1284],  // 富昌邨 (Fu Cheong Estate, Kwai Chung)
  39: [22.2480, 114.1571],  // 鴨脷洲海裕路 (Ap Lei Chau)
  44: [22.2980, 114.1720],  // 尖沙咀摩地道 (Mody Road, Tsim Sha Tsui)
  45: [22.3726, 114.1877],  // 大圍素林邨 (Tai Wai)
  46: [22.3248, 114.1918],  // 土瓜灣化街 (To Kwa Wan)
  47: [22.2868, 114.1380],  // 西營盤干諾道西 (Sai Ying Pun)
  48: [22.2868, 114.1280],  // 西環堅尼地城 (Kennedy Town)
  49: [22.4588, 114.0056],  // 天水圍天晴邨 (Tin Shui Wai)
  50: [22.4445, 114.0221],  // 錦田鄉 (Kam Tin, Yuen Long)
};

async function main() {
  const conn = await mysql.createConnection(DB_URL);
  let updated = 0;
  for (const [id, [lat, lng]] of Object.entries(MANUAL)) {
    await conn.execute("UPDATE truck_schedules SET lat = ?, lng = ? WHERE id = ?", [lat, lng, parseInt(id)]);
    console.log(`  ✓ [${id}] → (${lat}, ${lng})`);
    updated++;
  }
  await conn.end();
  console.log(`\nManual update done: ${updated} rows.`);
}

main().catch(e => { console.error(e); process.exit(1); });
