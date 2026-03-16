import {
  boolean,
  double,
  int,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * truck_schedules — stores each weekly service block for Truck 1 or Truck 2.
 * A single row represents one location visit within a weekly rotation.
 */
export const truckSchedules = mysqlTable("truck_schedules", {
  id: int("id").autoincrement().primaryKey(),

  /** 1 = Truck 1 (\u6536\u9280\u8eca 1 \u865f), 2 = Truck 2 (\u6536\u9280\u8eca 2 \u865f) */
  truckNumber: int("truck_number").notNull(),

  /** District code matching GeoJSON AREA_CODE (e.g. "CW", "SSP") */
  districtCode: varchar("district_code", { length: 10 }).notNull(),

  /** Chinese district name e.g. \u4e2d\u897f\u5340 */
  districtNameTc: varchar("district_name_tc", { length: 30 }).notNull(),

  /** English district name e.g. Central and Western District */
  districtNameEn: varchar("district_name_en", { length: 80 }).notNull(),

  /** Chinese location name */
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
   */
  closedDates: text("closed_dates"),

  /** Whether this location is an LCSD Mobile Library service point (*) */
  isLcsdLibrary: boolean("is_lcsd_library").default(false).notNull(),

  /** Additional notes in Chinese */
  notesTc: text("notes_tc"),

  /** Additional notes in English */
  notesEn: text("notes_en"),

  /** GPS latitude (WGS84) */
  lat: double("lat"),

  /** GPS longitude (WGS84) */
  lng: double("lng"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TruckSchedule = typeof truckSchedules.$inferSelect;
export type InsertTruckSchedule = typeof truckSchedules.$inferInsert;
