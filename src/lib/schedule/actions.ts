"use server";

import { revalidatePath } from "next/cache";
import { getDataSource, VisitSchedule, Setting } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  HEX_RE,
  findDuplicateSlots,
  formatDateTh,
  isValidDate,
  type PosterTheme,
  type PosterSettings,
  type ScheduleData,
  type ScheduleRow,
} from "@/components/schedule/types";
import { getPosterSettings, getScheduleForDate, SETTINGS_KEY } from "./queries";

export type RowInput = Omit<ScheduleRow, "id" | "visitorNames"> & {
  id?: string;
  /** รายชื่อคั่นด้วยขึ้นบรรทัดใหม่ */
  visitorNames: string;
};

function clean(s: unknown, max = 255): string {
  return String(s ?? "").trim().slice(0, max);
}

function hex(v: unknown, fallback: string): string {
  const s = String(v ?? "").trim().toLowerCase();
  return HEX_RE.test(s) ? s : fallback;
}

function cleanTheme(t: Partial<PosterTheme> | undefined): PosterTheme {
  const timeColors = (Array.isArray(t?.timeColors) ? t.timeColors : [])
    .map((c) => hex(c, ""))
    .filter(Boolean)
    .slice(0, 12);
  return {
    primary: hex(t?.primary, DEFAULT_THEME.primary),
    primaryDark: hex(t?.primaryDark, DEFAULT_THEME.primaryDark),
    accent: hex(t?.accent, DEFAULT_THEME.accent),
    ink: hex(t?.ink, DEFAULT_THEME.ink),
    pageBg: hex(t?.pageBg, DEFAULT_THEME.pageBg),
    timeColors: timeColors.length ? timeColors : DEFAULT_THEME.timeColors,
  };
}

function int(v: unknown, fallback: number, min: number, max: number): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function num(v: unknown, fallback: number, min: number, max: number, step = 0.05): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n / step) * step;
  return Math.round(Math.min(max, Math.max(min, rounded)) * 100) / 100;
}

function normalizeNames(s: unknown): string {
  return String(s ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n");
}

export async function loadSchedule(date: string): Promise<ScheduleData> {
  if (!isValidDate(date)) throw new Error("วันที่ไม่ถูกต้อง");
  return getScheduleForDate(date);
}

const STALE_MESSAGE = "ข้อมูลของวันนี้ในฐานข้อมูลถูกเปลี่ยนจากที่อื่น — กรุณาโหลดหน้าใหม่ก่อนบันทึก";

/**
 * บันทึกตารางของวันนั้นทั้งชุด: แถวที่มี id เดิมจะถูกอัปเดต, แถวใหม่จะถูกสร้าง,
 * แถวใน DB ที่ไม่อยู่ในรายการจะถูกลบ
 *
 * knownIds = id ของแถวที่ client โหลดมาตอนแรก — ถ้าใน DB มีแถวที่ client ไม่รู้จัก
 * (เช่น มีคน/แท็บอื่นเพิ่มไประหว่างนั้น) จะปฏิเสธ เพื่อกันแท็บเก่าเขียนทับข้อมูลใหม่
 */
export async function saveSchedule(
  date: string,
  rows: RowInput[],
  knownIds?: string[],
): Promise<ScheduleData> {
  if (!isValidDate(date)) throw new Error("วันที่ไม่ถูกต้อง");

  // ห้าม เวลา + ห้องประชุม ซ้ำกันในวันเดียวกัน
  const dup = findDuplicateSlots(rows.map((r) => ({ time: String(r.time ?? ""), room: String(r.room ?? "") })));
  if (dup.length) {
    throw new Error(
      dup.map((d) => `วันที่ ${formatDateTh(date)} เวลา ${d.time} ห้อง ${d.room} มีอยู่แล้ว`).join("\n"),
    );
  }

  const ds = await getDataSource();
  await ds.transaction(async (em) => {
    const repo = em.getRepository(VisitSchedule);
    const existing = await repo.find({ where: { date } });
    const existingIds = new Set(existing.map((e) => e.id));
    const keepIds = new Set<string>();

    if (knownIds) {
      const known = new Set(knownIds);
      if (existing.some((e) => !known.has(e.id))) throw new Error(STALE_MESSAGE);
    }

    const toSave = rows.map((r, i) => {
      const id = r.id && existingIds.has(r.id) ? r.id : undefined;
      if (id) keepIds.add(id);
      return repo.create({
        ...(id ? { id } : {}),
        date,
        sortOrder: i,
        time: clean(r.time, 20),
        company: clean(r.company),
        visitorNames: normalizeNames(r.visitorNames),
        label: clean(r.label, 50) || "VISITOR",
        hostName: clean(r.hostName),
        hostDept: clean(r.hostDept),
        room: clean(r.room, 50),
      });
    });

    const toDelete = existing.filter((e) => !keepIds.has(e.id)).map((e) => e.id);
    if (toDelete.length) {
      console.log(`[schedule] delete ${toDelete.length} row(s) of ${date} (keeping ${keepIds.size}, adding ${toSave.length - keepIds.size})`);
      await repo.delete(toDelete);
    }
    if (toSave.length) await repo.save(toSave);
  });

  revalidatePath("/schedule");
  revalidatePath("/admin");
  return getScheduleForDate(date);
}

/** คัดลอกตารางจากวันหนึ่งไปอีกวัน (แทนที่ข้อมูลของวันปลายทาง) */
export async function copySchedule(
  fromDate: string,
  toDate: string,
  knownIds?: string[],
): Promise<ScheduleData> {
  if (!isValidDate(fromDate) || !isValidDate(toDate)) throw new Error("วันที่ไม่ถูกต้อง");
  const ds = await getDataSource();
  const src = await ds
    .getRepository(VisitSchedule)
    .find({ where: { date: fromDate }, order: { sortOrder: "ASC" } });
  if (src.length === 0) throw new Error(`วันที่ ${fromDate} ไม่มีข้อมูลให้คัดลอก`);
  return saveSchedule(
    toDate,
    src.map((e) => ({
      time: e.time,
      company: e.company,
      visitorNames: e.visitorNames,
      label: e.label,
      hostName: e.hostName,
      hostDept: e.hostDept,
      room: e.room,
    })),
    knownIds,
  );
}

export async function savePosterSettings(input: PosterSettings): Promise<PosterSettings> {
  const value: PosterSettings = {
    companyNameEn: clean(input.companyNameEn),
    companyNameTh: clean(input.companyNameTh),
    welcomeText: clean(input.welcomeText, 100),
    showMotto: Boolean(input.showMotto),
    mottoLines: (input.mottoLines ?? []).map((s) => clean(s, 60)).filter(Boolean).slice(0, 6),
    thanksEn: clean(input.thanksEn),
    thanksTh: clean(input.thanksTh),
    footerItems: [0, 1, 2].map((i) => ({
      en: clean(input.footerItems?.[i]?.en, 100),
      th: clean(input.footerItems?.[i]?.th, 100),
    })) as PosterSettings["footerItems"],
    editableHost: Boolean(input.editableHost),
    hostLayout: input.hostLayout === "table" ? "table" : "header",
    fontScale: num(input.fontScale, DEFAULT_SETTINGS.fontScale, 0.8, 1.6),
    defaultHostName: clean(input.defaultHostName),
    defaultHostDept: clean(input.defaultHostDept),
    theme: cleanTheme(input.theme),
    tvPageIntervalSec: int(input.tvPageIntervalSec, DEFAULT_SETTINGS.tvPageIntervalSec, 5, 600),
    tvRefreshSec: int(input.tvRefreshSec, DEFAULT_SETTINGS.tvRefreshSec, 10, 3600),
  };

  const ds = await getDataSource();
  await ds.getRepository(Setting).save({ key: SETTINGS_KEY, value });
  revalidatePath("/schedule");
  revalidatePath("/admin");
  return getPosterSettings();
}

/** สลับรูปแบบแสดงผู้รับแขกแล้วบันทึกทันที (ใช้กับตัวเลือกใน preview) โดยไม่แตะฟิลด์อื่นที่ยังแก้ไม่บันทึก */
export async function setHostLayout(hostLayout: PosterSettings["hostLayout"]): Promise<PosterSettings> {
  const current = await getPosterSettings();
  return savePosterSettings({ ...current, hostLayout });
}

/** ปรับขนาดตัวอักษรแล้วบันทึกทันที (debounce จากฝั่ง client) โดยไม่แตะฟิลด์อื่นที่ยังแก้ไม่บันทึก */
export async function setFontScale(fontScale: number): Promise<PosterSettings> {
  const current = await getPosterSettings();
  return savePosterSettings({ ...current, fontScale });
}

export async function resetPosterSettings(): Promise<PosterSettings> {
  return savePosterSettings(DEFAULT_SETTINGS);
}
