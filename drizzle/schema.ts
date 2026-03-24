import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 10 }).default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * truck_schedules — stores each weekly service block for Truck 1 or Truck 2.
 * A single row represents one location visit within a weekly rotation.
 * Multiple rows can share the same week (e.g., Truck 1 visits two spots in one week).
 */
export const truckSchedules = pgTable("truck_schedules", {
  id: serial("id").primaryKey(),

  /** 1 = Truck 1 (收銀車 1 號), 2 = Truck 2 (收銀車 2 號) */
  truckNumber: integer("truck_number").notNull(),

  /** District code matching GeoJSON AREA_CODE (e.g. "CW", "SSP") */
  districtCode: varchar("district_code", { length: 10 }).notNull(),

  /** Chinese district name e.g. 中西區 */
  districtNameTc: varchar("district_name_tc", { length: 30 }).notNull(),

  /** English district name e.g. Central and Western District */
  districtNameEn: varchar("district_name_en", { length: 80 }).notNull(),

  /** Chinese location name e.g. 上環永樂街 118 號路旁停車處 */
  locationNameTc: varchar("location_name_tc", { length: 200 }).notNull(),

  /** English location name (optional) */
  locationNameEn: varchar("location_name_en", { length: 200 }),

  /** Full address in Chinese */
  addressTc: varchar("address_tc", { length: 300 }),

  /** Service start date (inclusive) YYYY-MM-DD */
  dateFrom: varchar("date_from", { length: 10 }).notNull(),

  /** Service end date (inclusive) YYYY-MM-DD */
  dateTo: varchar("date_to", { length: 10 }).notNull(),

  /**
   * Comma-separated list of closed dates within this block, e.g. "2026-01-06"
   * These are public holidays or maintenance days.
   */
  closedDates: text("closed_dates"),

  /** Whether this location is an LCSD Mobile Library service point (*) */
  isLcsdLibrary: boolean("is_lcsd_library").default(false).notNull(),

  /** Additional notes in Chinese */
  notesTc: text("notes_tc"),

  /** Additional notes in English */
  notesEn: text("notes_en"),

  /** GPS latitude (WGS84) — geocoded from addressTc via Nominatim */
  lat: doublePrecision("lat"),

  /** GPS longitude (WGS84) — geocoded from addressTc via Nominatim */
  lng: doublePrecision("lng"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type TruckSchedule = typeof truckSchedules.$inferSelect;
export type InsertTruckSchedule = typeof truckSchedules.$inferInsert;
