import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock the DB helpers so tests don't need a real database ──────────────────
vi.mock("./db", () => ({
  getAllSchedules: vi.fn().mockResolvedValue([
    {
      id: 1,
      truckNumber: 1,
      districtCode: "CW",
      districtNameTc: "中西區",
      districtNameEn: "Central and Western District",
      locationNameTc: "上環永樂街 118 號",
      locationNameEn: "118 Wing Lok Street",
      addressTc: "上環永樂街 118 號",
      dateFrom: "2026-01-05",
      dateTo: "2026-01-11",
      closedDates: "2026-01-06",
      isLcsdLibrary: false,
      notesTc: "1月6日暫停",
      notesEn: "Closed Jan 6",
      createdAt: new Date("2026-01-01"),
    },
  ]),
  getUpcomingSchedules: vi.fn().mockResolvedValue([]),
  getSchedulesByDistrict: vi.fn().mockResolvedValue([]),
  getSchedulesByDateRange: vi.fn().mockResolvedValue([]),
  getSchedulesByTruck: vi.fn().mockResolvedValue([]),
  getScheduleById: vi.fn().mockResolvedValue(null),
  insertSchedule: vi.fn().mockResolvedValue(undefined),
  updateSchedule: vi.fn().mockResolvedValue(undefined),
  deleteSchedule: vi.fn().mockResolvedValue(undefined),
  bulkInsertSchedules: vi.fn().mockResolvedValue(undefined),
  countSchedules: vi.fn().mockResolvedValue(1),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn().mockResolvedValue(null),
}));

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("schedules.all (public)", () => {
  it("returns all schedules without authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.schedules.all();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("truckNumber");
    expect(result[0]).toHaveProperty("districtCode");
    expect(result[0]).toHaveProperty("dateFrom");
  });
});

describe("schedules.byDateRange (public)", () => {
  it("accepts valid date range input", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.schedules.byDateRange({
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects invalid date format", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.schedules.byDateRange({ dateFrom: "not-a-date", dateTo: "2026-03-31" })
    ).rejects.toThrow();
  });
});

describe("schedules.byDistrict (public)", () => {
  it("accepts a district code", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.schedules.byDistrict({ districtCode: "CW" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin.createSchedule", () => {
  const validPayload = {
    truckNumber: 1 as const,
    districtCode: "CW",
    districtNameTc: "中西區",
    districtNameEn: "Central and Western District",
    locationNameTc: "上環測試地點",
    locationNameEn: "Sheung Wan Test Location",
    addressTc: "上環測試地址",
    dateFrom: "2026-06-01",
    dateTo: "2026-06-07",
    closedDates: null,
    isLcsdLibrary: false,
    notesTc: null,
    notesEn: null,
  };

  it("allows admin to create a schedule", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.createSchedule(validPayload);
    expect(result).toEqual({ success: true });
  });

  it("blocks non-admin users from creating schedules", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.createSchedule(validPayload)).rejects.toThrow();
  });

  it("blocks unauthenticated users from creating schedules", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.admin.createSchedule(validPayload)).rejects.toThrow();
  });

  it("rejects invalid truck number", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.admin.createSchedule({ ...validPayload, truckNumber: 3 as unknown as 1 })
    ).rejects.toThrow();
  });

  it("rejects invalid date format", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.admin.createSchedule({ ...validPayload, dateFrom: "invalid-date" })
    ).rejects.toThrow();
  });
});

describe("admin.deleteSchedule", () => {
  it("allows admin to delete a schedule", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.deleteSchedule({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("blocks non-admin from deleting", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(caller.admin.deleteSchedule({ id: 1 })).rejects.toThrow();
  });
});

describe("admin.updateSchedule", () => {
  it("allows admin to update a schedule", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.updateSchedule({ id: 1, notesTc: "更新備注" });
    expect(result).toEqual({ success: true });
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
