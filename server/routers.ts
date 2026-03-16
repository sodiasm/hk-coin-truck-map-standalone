import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllSchedules, getUpcomingSchedules, getSchedulesByDistrict,
  getSchedulesByDateRange, getSchedulesByTruck, getScheduleById,
  insertSchedule, updateSchedule, deleteSchedule,
  bulkInsertSchedules, countSchedules,
} from "./db";

const scheduleInput = z.object({
  truckNumber: z.number().int().min(1).max(2),
  districtCode: z.string().min(1).max(10),
  districtNameTc: z.string().min(1).max(30),
  districtNameEn: z.string().min(1).max(80),
  locationNameTc: z.string().min(1).max(200),
  locationNameEn: z.string().max(200).optional().nullable(),
  addressTc: z.string().max(300).optional().nullable(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closedDates: z.string().optional().nullable(),
  isLcsdLibrary: z.boolean().default(false),
  notesTc: z.string().optional().nullable(),
  notesEn: z.string().optional().nullable(),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  schedules: router({
    all: publicProcedure.query(() => getAllSchedules()),
    upcoming: publicProcedure
      .input(z.object({ fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(({ input }) => getUpcomingSchedules(input.fromDate)),
    byDistrict: publicProcedure
      .input(z.object({ districtCode: z.string() }))
      .query(({ input }) => getSchedulesByDistrict(input.districtCode)),
    byDateRange: publicProcedure
      .input(z.object({
        dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .query(({ input }) => getSchedulesByDateRange(input.dateFrom, input.dateTo)),
    byTruck: publicProcedure
      .input(z.object({ truckNumber: z.number().int().min(1).max(2) }))
      .query(({ input }) => getSchedulesByTruck(input.truckNumber)),
    byId: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const s = await getScheduleById(input.id);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        return s;
      }),
  }),

  admin: router({
    createSchedule: adminProcedure.input(scheduleInput).mutation(async ({ input }) => {
      await insertSchedule(input);
      return { success: true };
    }),
    updateSchedule: adminProcedure
      .input(z.object({ id: z.number().int().positive() }).merge(scheduleInput.partial()))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSchedule(id, data);
        return { success: true };
      }),
    deleteSchedule: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteSchedule(input.id);
        return { success: true };
      }),
    seedData: adminProcedure.mutation(async () => {
      const count = await countSchedules();
      if (count > 0) return { skipped: true, message: "Data already seeded" };
      await bulkInsertSchedules(SEED_DATA);
      return { success: true, inserted: SEED_DATA.length };
    }),
    listAll: adminProcedure.query(() => getAllSchedules()),
  }),
});

export type AppRouter = typeof appRouter;

// ─── Seed Data — HKMA Jan–May 2026 ───────────────────────────────────────────
const SEED_DATA = [
  { truckNumber: 1, districtCode: "CW", districtNameTc: "中西區", districtNameEn: "Central and Western District", locationNameTc: "上環永樂街 118 號路旁停車處（近上環文化廣場）", locationNameEn: "Roadside Car Park at 118 Wing Lok Street, Sheung Wan", addressTc: "上環永樂街 118 號", dateFrom: "2026-01-05", dateTo: "2026-01-11", closedDates: "2026-01-06", isLcsdLibrary: false, notesTc: "1月6日（星期二）暫停", notesEn: "Closed on Jan 6 (Tue)" },
  { truckNumber: 2, districtCode: "YL", districtNameTc: "元朗區", districtNameEn: "Yuen Long District", locationNameTc: "天水圍天瑞邨天瑞社區中心", locationNameEn: "Tin Shui Wai Tin Shui Estate Tin Shui Community Centre", addressTc: "天水圍天瑞邨天瑞社區中心", dateFrom: "2026-01-05", dateTo: "2026-01-11", closedDates: "2026-01-07", isLcsdLibrary: true, notesTc: "1月7日（星期三）暫停", notesEn: "Closed on Jan 7 (Wed)" },
  { truckNumber: 1, districtCode: "ST", districtNameTc: "沙田區", districtNameEn: "Sha Tin District", locationNameTc: "大圍村南道（近大圍港鐵站 A 出口）", locationNameEn: "Village South Road, Tai Wai (near Tai Wai MTR Station Exit A)", addressTc: "大圍村南道", dateFrom: "2026-01-12", dateTo: "2026-01-15", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "ST", districtNameTc: "沙田區", districtNameEn: "Sha Tin District", locationNameTc: "沙田新翠邨新翠廣場", locationNameEn: "Sun Chui Plaza, Sun Chui Estate, Sha Tin", addressTc: "沙田新翠邨新翠廣場", dateFrom: "2026-01-17", dateTo: "2026-01-18", closedDates: "2026-01-16", isLcsdLibrary: true, notesTc: "1月16日（星期五）暫停", notesEn: "Closed on Jan 16 (Fri)" },
  { truckNumber: 2, districtCode: "ILD", districtNameTc: "離島區", districtNameEn: "Islands District", locationNameTc: "愉景灣愉景廣場輸船灣郵局側", locationNameEn: "Discovery Bay Plaza, near Discovery Bay Post Office", addressTc: "愉景灣愉景廣場", dateFrom: "2026-01-12", dateTo: "2026-01-14", closedDates: "2026-01-13", isLcsdLibrary: true, notesTc: "1月13日（星期二）暫停", notesEn: "Closed on Jan 13 (Tue)" },
  { truckNumber: 2, districtCode: "ILD", districtNameTc: "離島區", districtNameEn: "Islands District", locationNameTc: "東涌滿東邨滿翠樓", locationNameEn: "Man Chui House, Man Tung Estate, Tung Chung", addressTc: "東涌滿東邨滿翠樓", dateFrom: "2026-01-15", dateTo: "2026-01-18", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "SSP", districtNameTc: "深水埗區", districtNameEn: "Sham Shui Po District", locationNameTc: "石硤尾大坑東邨東怡樓側", locationNameEn: "Tung Yi House, Tai Hang Tung Estate, Shek Kip Mei", addressTc: "石硤尾大坑東邨東怡樓側", dateFrom: "2026-01-19", dateTo: "2026-01-22", closedDates: "2026-01-20", isLcsdLibrary: false, notesTc: "1月20日（星期二）暫停", notesEn: "Closed on Jan 20 (Tue)" },
  { truckNumber: 1, districtCode: "SSP", districtNameTc: "深水埗區", districtNameEn: "Sham Shui Po District", locationNameTc: "深水埗警局街路旁停車處", locationNameEn: "Roadside Car Park at Police Station Street, Sham Shui Po", addressTc: "深水埗警局街", dateFrom: "2026-01-23", dateTo: "2026-01-25", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "YTM", districtNameTc: "油尖旺區", districtNameEn: "Yau Tsim Mong District", locationNameTc: "佐敦廣東道 575 號", locationNameEn: "575 Canton Road, Jordan", addressTc: "佐敦廣東道 575 號", dateFrom: "2026-01-19", dateTo: "2026-01-22", closedDates: "2026-01-21", isLcsdLibrary: false, notesTc: "1月21日（星期三）暫停", notesEn: "Closed on Jan 21 (Wed)" },
  { truckNumber: 2, districtCode: "YTM", districtNameTc: "油尖旺區", districtNameEn: "Yau Tsim Mong District", locationNameTc: "油麻地砵蘭街路旁停車處", locationNameEn: "Roadside Car Park at Portland Street, Yau Ma Tei", addressTc: "油麻地砵蘭街", dateFrom: "2026-01-23", dateTo: "2026-01-25", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "KT", districtNameTc: "觀塘區", districtNameEn: "Kwun Tong District", locationNameTc: "秀茂坪邨秀曦樓假空地", locationNameEn: "Temporary Open Space at Sau Hei House, Sau Mau Ping Estate", addressTc: "秀茂坪邨秀曦樓", dateFrom: "2026-01-27", dateTo: "2026-01-29", closedDates: "2026-01-26,2026-01-28", isLcsdLibrary: false, notesTc: "1月26日及1月28日暫停", notesEn: "Closed on Jan 26 & Jan 28" },
  { truckNumber: 1, districtCode: "KT", districtNameTc: "觀塘區", districtNameEn: "Kwun Tong District", locationNameTc: "觀塘翠屏道 19 號路旁停車處", locationNameEn: "Roadside Car Park at 19 Tsui Ping Road, Kwun Tong", addressTc: "觀塘翠屏道 19 號", dateFrom: "2026-01-30", dateTo: "2026-02-01", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "WC", districtNameTc: "灣仔區", districtNameEn: "Wan Chai District", locationNameTc: "灣仔港灣道灣景中心路旁停車處", locationNameEn: "Roadside Car Park at Harbour Road, Wan Chai", addressTc: "灣仔港灣道", dateFrom: "2026-01-27", dateTo: "2026-02-01", closedDates: "2026-01-30", isLcsdLibrary: false, notesTc: "1月30日（星期五）暫停", notesEn: "Closed on Jan 30 (Fri)" },
  { truckNumber: 1, districtCode: "TM", districtNameTc: "屯門區", districtNameEn: "Tuen Mun District", locationNameTc: "屯門寶田邨第四座", locationNameEn: "Block 4, Po Tin Estate, Tuen Mun", addressTc: "屯門寶田邨第四座", dateFrom: "2026-02-02", dateTo: "2026-02-08", closedDates: "2026-02-03", isLcsdLibrary: true, notesTc: "2月3日（星期二）暫停", notesEn: "Closed on Feb 3 (Tue)" },
  { truckNumber: 2, districtCode: "TW", districtNameTc: "荃灣區", districtNameEn: "Tsuen Wan District", locationNameTc: "荃灣眾安街（荃灣千色匯一期外）", locationNameEn: "Chung On Street, Tsuen Wan (outside Citywalk Phase 1)", addressTc: "荃灣眾安街", dateFrom: "2026-02-02", dateTo: "2026-02-04", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "TW", districtNameTc: "荃灣區", districtNameEn: "Tsuen Wan District", locationNameTc: "荃灣福來邨永定樓對出", locationNameEn: "Outside Wing Ting House, Fuk Loi Estate, Tsuen Wan", addressTc: "荃灣福來邨永定樓", dateFrom: "2026-02-06", dateTo: "2026-02-08", closedDates: "2026-02-05,2026-02-07", isLcsdLibrary: false, notesTc: "2月5日及2月7日暫停", notesEn: "Closed on Feb 5 & Feb 7" },
  { truckNumber: 1, districtCode: "KC", districtNameTc: "葵青區", districtNameEn: "Kwai Tsing District", locationNameTc: "青衣牙鷹洲街路旁停車處", locationNameEn: "Roadside Car Park at Nga Ying Chau Street, Tsing Yi", addressTc: "青衣牙鷹洲街", dateFrom: "2026-02-09", dateTo: "2026-02-11", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "KC", districtNameTc: "葵青區", districtNameEn: "Kwai Tsing District", locationNameTc: "葵涌葵景邨平台地下", locationNameEn: "Podium Ground Floor, Kwai King Estate, Kwai Chung", addressTc: "葵涌葵景邨平台地下", dateFrom: "2026-02-12", dateTo: "2026-02-15", closedDates: "2026-02-14", isLcsdLibrary: false, notesTc: "2月14日（星期六）暫停", notesEn: "Closed on Feb 14 (Sat)" },
  { truckNumber: 2, districtCode: "STH", districtNameTc: "南區", districtNameEn: "Southern District", locationNameTc: "香港仔田灣興和街", locationNameEn: "Hing Wo Street, Tin Wan, Aberdeen", addressTc: "香港仔田灣興和街", dateFrom: "2026-02-09", dateTo: "2026-02-15", closedDates: "2026-02-10", isLcsdLibrary: false, notesTc: "2月10日（星期二）暫停", notesEn: "Closed on Feb 10 (Tue)" },
  { truckNumber: 1, districtCode: "CW", districtNameTc: "中西區", districtNameEn: "Central and Western District", locationNameTc: "暫停服務（農曆新年假期及機件維修）", locationNameEn: "Service Suspended (Lunar New Year Holiday & Maintenance)", addressTc: null, dateFrom: "2026-02-16", dateTo: "2026-02-22", closedDates: "2026-02-16,2026-02-17,2026-02-18,2026-02-19,2026-02-20,2026-02-21,2026-02-22", isLcsdLibrary: false, notesTc: "農曆新年假期及機件維修，全週暫停服務", notesEn: "Suspended for Lunar New Year Holiday & Maintenance" },
  { truckNumber: 2, districtCode: "CW", districtNameTc: "中西區", districtNameEn: "Central and Western District", locationNameTc: "暫停服務（農曆新年假期及機件維修）", locationNameEn: "Service Suspended (Lunar New Year Holiday & Maintenance)", addressTc: null, dateFrom: "2026-02-16", dateTo: "2026-02-22", closedDates: "2026-02-16,2026-02-17,2026-02-18,2026-02-19,2026-02-20,2026-02-21,2026-02-22", isLcsdLibrary: false, notesTc: "農曆新年假期及機件維修，全週暫停服務", notesEn: "Suspended for Lunar New Year Holiday & Maintenance" },
  { truckNumber: 1, districtCode: "TP", districtNameTc: "大埔區", districtNameEn: "Tai Po District", locationNameTc: "大埔廣福道 43-59 號路旁", locationNameEn: "Roadside at 43-59 Kwong Fuk Road, Tai Po", addressTc: "大埔廣福道 43-59 號", dateFrom: "2026-02-23", dateTo: "2026-03-01", closedDates: "2026-02-24", isLcsdLibrary: false, notesTc: "2月24日（星期二）暫停", notesEn: "Closed on Feb 24 (Tue)" },
  { truckNumber: 2, districtCode: "WTS", districtNameTc: "黃大仙區", districtNameEn: "Wong Tai Sin District", locationNameTc: "慈雲山慈康秀樓及康德樓之間停車位", locationNameEn: "Car Park between Tsz Hong Sau House & Hong Tak House, Tsz Wan Shan", addressTc: "慈雲山慈康秀樓及康德樓之間", dateFrom: "2026-02-23", dateTo: "2026-03-01", closedDates: "2026-02-26", isLcsdLibrary: false, notesTc: "2月26日（星期四）暫停", notesEn: "Closed on Feb 26 (Thu)" },
  { truckNumber: 1, districtCode: "NTH", districtNameTc: "北區", districtNameEn: "North District", locationNameTc: "上水智明街近育賢學校", locationNameEn: "Chi Ming Street, Sheung Shui (near Yuk Yin School)", addressTc: "上水智明街", dateFrom: "2026-03-02", dateTo: "2026-03-05", closedDates: "2026-03-03", isLcsdLibrary: false, notesTc: "3月3日（星期二）暫停", notesEn: "Closed on Mar 3 (Tue)" },
  { truckNumber: 1, districtCode: "NTH", districtNameTc: "北區", districtNameEn: "North District", locationNameTc: "粉嶺和豐路路旁停車處", locationNameEn: "Roadside Car Park at Wo Fung Street, Fanling", addressTc: "粉嶺和豐路", dateFrom: "2026-03-06", dateTo: "2026-03-08", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "SK", districtNameTc: "西貢區", districtNameEn: "Sai Kung District", locationNameTc: "調景嶺彩明邨彩富園側", locationNameEn: "Choi Fu Garden, Choi Ming Estate, Tseung Kwan O", addressTc: "調景嶺彩明邨彩富園側", dateFrom: "2026-03-02", dateTo: "2026-03-08", closedDates: "2026-03-04,2026-03-06", isLcsdLibrary: false, notesTc: "3月4日及3月6日暫停", notesEn: "Closed on Mar 4 & Mar 6" },
  { truckNumber: 1, districtCode: "KLC", districtNameTc: "九龍城區", districtNameEn: "Kowloon City District", locationNameTc: "土瓜灣蔡育巷道", locationNameEn: "Tsoi Yuk Lane, To Kwa Wan", addressTc: "土瓜灣蔡育巷道", dateFrom: "2026-03-09", dateTo: "2026-03-11", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "KLC", districtNameTc: "九龍城區", districtNameEn: "Kowloon City District", locationNameTc: "九龍城德明邨德瑞樓", locationNameEn: "Tak Shui House, Tak Ming Estate, Kowloon City", addressTc: "九龍城德明邨德瑞樓", dateFrom: "2026-03-12", dateTo: "2026-03-15", closedDates: "2026-03-14", isLcsdLibrary: false, notesTc: "3月14日（星期六）暫停", notesEn: "Closed on Mar 14 (Sat)" },
  { truckNumber: 2, districtCode: "EST", districtNameTc: "東區", districtNameEn: "Eastern District", locationNameTc: "西灣河鰂魚涌太康街逸星閣", locationNameEn: "Yat Sing House, Tai Hong Street, Sai Wan Ho", addressTc: "西灣河鰂魚涌太康街逸星閣", dateFrom: "2026-03-09", dateTo: "2026-03-12", closedDates: "2026-03-11", isLcsdLibrary: true, notesTc: "3月11日（星期三）暫停", notesEn: "Closed on Mar 11 (Wed)" },
  { truckNumber: 2, districtCode: "EST", districtNameTc: "東區", districtNameEn: "Eastern District", locationNameTc: "北角城市花園道路旁停車處", locationNameEn: "Roadside Car Park at City Garden Road, North Point", addressTc: "北角城市花園道", dateFrom: "2026-03-13", dateTo: "2026-03-15", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "YL", districtNameTc: "元朗區", districtNameEn: "Yuen Long District", locationNameTc: "洪水橋洪福邨洪樂樓", locationNameEn: "Hung Lok House, Hung Fuk Estate, Hung Shui Kiu", addressTc: "洪水橋洪福邨洪樂樓", dateFrom: "2026-03-16", dateTo: "2026-03-19", closedDates: "2026-03-17", isLcsdLibrary: false, notesTc: "3月17日（星期二）暫停", notesEn: "Closed on Mar 17 (Tue)" },
  { truckNumber: 1, districtCode: "YL", districtNameTc: "元朗區", districtNameEn: "Yuen Long District", locationNameTc: "元朗元朗文化康樂大樓對面路旁停車處", locationNameEn: "Roadside Car Park opposite Yuen Long Cultural & Recreation Centre", addressTc: "元朗文化康樂大樓對面", dateFrom: "2026-03-20", dateTo: "2026-03-22", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "ST", districtNameTc: "沙田區", districtNameEn: "Sha Tin District", locationNameTc: "沙田石門路旁停車處", locationNameEn: "Roadside Car Park at Shek Mun, Sha Tin", addressTc: "沙田石門路旁", dateFrom: "2026-03-16", dateTo: "2026-03-19", closedDates: "2026-03-18", isLcsdLibrary: false, notesTc: "3月18日（星期三）暫停", notesEn: "Closed on Mar 18 (Wed)" },
  { truckNumber: 2, districtCode: "ST", districtNameTc: "沙田區", districtNameEn: "Sha Tin District", locationNameTc: "沙田禾輋路旁停車處", locationNameEn: "Roadside Car Park at Wo Che, Sha Tin", addressTc: "沙田禾輋路旁", dateFrom: "2026-03-20", dateTo: "2026-03-22", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "TM", districtNameTc: "屯門區", districtNameEn: "Tuen Mun District", locationNameTc: "山景邨景茶樓", locationNameEn: "King Cha House, Shan King Estate", addressTc: "屯門山景邨景茶樓", dateFrom: "2026-03-23", dateTo: "2026-03-29", closedDates: "2026-03-26", isLcsdLibrary: false, notesTc: "3月26日（星期四）暫停", notesEn: "Closed on Mar 26 (Thu)" },
  { truckNumber: 2, districtCode: "WC", districtNameTc: "灣仔區", districtNameEn: "Wan Chai District", locationNameTc: "天后發仙街路旁停車處", locationNameEn: "Roadside Car Park at Fat Sin Street, Tin Hau", addressTc: "天后發仙街", dateFrom: "2026-03-23", dateTo: "2026-03-26", closedDates: "2026-03-25", isLcsdLibrary: false, notesTc: "3月25日（星期三）暫停", notesEn: "Closed on Mar 25 (Wed)" },
  { truckNumber: 2, districtCode: "WC", districtNameTc: "灣仔區", districtNameEn: "Wan Chai District", locationNameTc: "大坑書花宮西街", locationNameEn: "Shu Fa Kung West Street, Tai Hang", addressTc: "大坑書花宮西街", dateFrom: "2026-03-27", dateTo: "2026-03-29", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "SSP", districtNameTc: "深水埗區", districtNameEn: "Sham Shui Po District", locationNameTc: "富昌邨富昌樓", locationNameEn: "Fu Cheong House, Fu Cheong Estate", addressTc: "富昌邨富昌樓", dateFrom: "2026-03-30", dateTo: "2026-04-05", closedDates: "2026-04-03", isLcsdLibrary: true, notesTc: "4月3日（星期五）暫停", notesEn: "Closed on Apr 3 (Fri)" },
  { truckNumber: 2, districtCode: "STH", districtNameTc: "南區", districtNameEn: "Southern District", locationNameTc: "鴨脷洲海裕路海裕半島第 11 座對開路旁", locationNameEn: "Roadside opposite Block 11, Larvotto, Ap Lei Chau", addressTc: "鴨脷洲海裕路海裕半島第 11 座", dateFrom: "2026-03-30", dateTo: "2026-04-05", closedDates: "2026-04-02", isLcsdLibrary: false, notesTc: "4月2日（星期四）暫停", notesEn: "Closed on Apr 2 (Thu)" },
  { truckNumber: 1, districtCode: "NTH", districtNameTc: "北區", districtNameEn: "North District", locationNameTc: "粉嶺清晨間露天廣場", locationNameEn: "Ching Sun Kan Open-Air Plaza, Fanling", addressTc: "粉嶺清晨間露天廣場", dateFrom: "2026-04-06", dateTo: "2026-04-09", closedDates: "2026-04-07", isLcsdLibrary: false, notesTc: "4月7日（星期二）暫停", notesEn: "Closed on Apr 7 (Tue)" },
  { truckNumber: 1, districtCode: "NTH", districtNameTc: "北區", districtNameEn: "North District", locationNameTc: "上水彩園邨彩園會堂側", locationNameEn: "Choi Yuen Community Hall, Choi Yuen Estate, Sheung Shui", addressTc: "上水彩園邨彩園會堂側", dateFrom: "2026-04-11", dateTo: "2026-04-12", closedDates: "2026-04-10", isLcsdLibrary: false, notesTc: "4月10日（星期五）暫停", notesEn: "Closed on Apr 10 (Fri)" },
  { truckNumber: 2, districtCode: "SK", districtNameTc: "西貢區", districtNameEn: "Sai Kung District", locationNameTc: "西貢賽馬會大會堂停車場", locationNameEn: "Jockey Club Town Hall Car Park, Sai Kung", addressTc: "西貢賽馬會大會堂停車場", dateFrom: "2026-04-06", dateTo: "2026-04-08", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "SK", districtNameTc: "西貢區", districtNameEn: "Sai Kung District", locationNameTc: "將軍澳健明邨健晴樓", locationNameEn: "Kin Ching House, Kin Ming Estate, Tseung Kwan O", addressTc: "將軍澳健明邨健晴樓", dateFrom: "2026-04-10", dateTo: "2026-04-12", closedDates: null, isLcsdLibrary: true, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "YTM", districtNameTc: "油尖旺區", districtNameEn: "Yau Tsim Mong District", locationNameTc: "尖沙咀摩地道路旁停車處", locationNameEn: "Roadside Car Park at Mody Road, Tsim Sha Tsui", addressTc: "尖沙咀摩地道", dateFrom: "2026-04-13", dateTo: "2026-04-19", closedDates: "2026-04-16", isLcsdLibrary: false, notesTc: "4月16日（星期四）暫停", notesEn: "Closed on Apr 16 (Thu)" },
  { truckNumber: 2, districtCode: "ST", districtNameTc: "沙田區", districtNameEn: "Sha Tin District", locationNameTc: "大圍素林邨素美樓", locationNameEn: "So Mei House, So Lam Estate, Tai Wai", addressTc: "大圍素林邨素美樓", dateFrom: "2026-04-13", dateTo: "2026-04-19", closedDates: "2026-04-17", isLcsdLibrary: true, notesTc: "4月17日（星期五）暫停", notesEn: "Closed on Apr 17 (Fri)" },
  { truckNumber: 1, districtCode: "KLC", districtNameTc: "九龍城區", districtNameEn: "Kowloon City District", locationNameTc: "土瓜灣化街", locationNameEn: "Fa Street, To Kwa Wan", addressTc: "土瓜灣化街", dateFrom: "2026-04-20", dateTo: "2026-04-26", closedDates: "2026-04-23", isLcsdLibrary: false, notesTc: "4月23日（星期四）暫停", notesEn: "Closed on Apr 23 (Thu)" },
  { truckNumber: 2, districtCode: "CW", districtNameTc: "中西區", districtNameEn: "Central and Western District", locationNameTc: "西營盤干諾道西 169-178 號及 181 號路旁停車處", locationNameEn: "Roadside Car Park at 169-178 & 181 Connaught Road West, Sai Ying Pun", addressTc: "西營盤干諾道西 169-178 號及 181 號", dateFrom: "2026-04-20", dateTo: "2026-04-23", closedDates: "2026-04-22", isLcsdLibrary: false, notesTc: "4月22日（星期三）暫停", notesEn: "Closed on Apr 22 (Wed)" },
  { truckNumber: 2, districtCode: "CW", districtNameTc: "中西區", districtNameEn: "Central and Western District", locationNameTc: "西環堅尼地城新海旁街路旁停車處", locationNameEn: "Roadside Car Park at New Praya, Kennedy Town", addressTc: "西環堅尼地城新海旁街", dateFrom: "2026-04-24", dateTo: "2026-04-26", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 1, districtCode: "YL", districtNameTc: "元朗區", districtNameEn: "Yuen Long District", locationNameTc: "天水圍天晴邨晴喜樓", locationNameEn: "Ching Hei House, Tin Ching Estate, Tin Shui Wai", addressTc: "天水圍天晴邨晴喜樓", dateFrom: "2026-04-27", dateTo: "2026-05-01", closedDates: "2026-04-30", isLcsdLibrary: true, notesTc: "4月30日（星期四）暫停", notesEn: "Closed on Apr 30 (Thu)" },
  { truckNumber: 1, districtCode: "YL", districtNameTc: "元朗區", districtNameEn: "Yuen Long District", locationNameTc: "錦田鄉鄉交通總匯", locationNameEn: "Kam Tin Rural Transport Terminus", addressTc: "錦田鄉鄉交通總匯", dateFrom: "2026-05-02", dateTo: "2026-05-03", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "TP", districtNameTc: "大埔區", districtNameEn: "Tai Po District", locationNameTc: "大埔寶鄉邨祐和閣側", locationNameEn: "Yau Wo House, Po Heung Estate, Tai Po", addressTc: "大埔寶鄉邨祐和閣側", dateFrom: "2026-04-27", dateTo: "2026-04-30", closedDates: null, isLcsdLibrary: false, notesTc: null, notesEn: null },
  { truckNumber: 2, districtCode: "TP", districtNameTc: "大埔區", districtNameEn: "Tai Po District", locationNameTc: "大埔大亨邨亨翠樓", locationNameEn: "Hang Chui House, Tai Hang Estate, Tai Po", addressTc: "大埔大亨邨亨翠樓", dateFrom: "2026-05-02", dateTo: "2026-05-03", closedDates: "2026-05-01", isLcsdLibrary: true, notesTc: "5月1日（星期五）暫停", notesEn: "Closed on May 1 (Fri)" },
];
