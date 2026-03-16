/**
 * SQL Dump Generator for 香港收銀車服務地圖
 * Reads DATABASE_URL from environment, exports schema DDL + all data as a .sql file.
 * Usage: node server/export_sql_dump.mjs
 */
import mysql from "mysql2/promise";
import { writeFileSync } from "fs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌  DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const conn = await mysql.createConnection(DB_URL);

// ── Helper ──────────────────────────────────────────────────────────────────
function escapeValue(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace("T", " ")}'`;
  // Escape string
  return `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n").replace(/\r/g, "\\r")}'`;
}

// ── Fetch tables ─────────────────────────────────────────────────────────────
const [tables] = await conn.execute("SHOW TABLES");
const tableNames = tables.map((r) => Object.values(r)[0]);

const lines = [];
const now = new Date().toISOString();

lines.push(`-- ============================================================`);
lines.push(`-- 香港收銀車服務地圖 — Full SQL Dump`);
lines.push(`-- Generated: ${now}`);
lines.push(`-- Tables: ${tableNames.join(", ")}`);
lines.push(`-- ============================================================`);
lines.push(``);
lines.push(`SET NAMES utf8mb4;`);
lines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
lines.push(``);

for (const table of tableNames) {
  // ── DDL ──────────────────────────────────────────────────────────────────
  const [[ddlRow]] = await conn.execute(`SHOW CREATE TABLE \`${table}\``);
  const ddl = ddlRow["Create Table"];

  lines.push(`-- ------------------------------------------------------------`);
  lines.push(`-- Table: ${table}`);
  lines.push(`-- ------------------------------------------------------------`);
  lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
  lines.push(`${ddl};`);
  lines.push(``);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
  if (rows.length === 0) {
    lines.push(`-- (no rows in ${table})`);
    lines.push(``);
    continue;
  }

  const columns = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");
  lines.push(`INSERT INTO \`${table}\` (${columns}) VALUES`);

  const valueLines = rows.map((row, idx) => {
    const vals = Object.values(row).map(escapeValue).join(", ");
    const comma = idx < rows.length - 1 ? "," : ";";
    return `  (${vals})${comma}`;
  });
  lines.push(...valueLines);
  lines.push(``);
}

lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
lines.push(`-- End of dump`);
lines.push(``);

await conn.end();

const output = lines.join("\n");
const outPath = "/home/ubuntu/hk_coin_truck_map_dump.sql";
writeFileSync(outPath, output, "utf8");
console.log(`✅  Dump written to ${outPath}  (${output.length.toLocaleString()} bytes)`);
