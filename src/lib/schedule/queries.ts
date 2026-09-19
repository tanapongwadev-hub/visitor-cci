import { getDataSource, VisitSchedule, Setting } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  formatDateLabel,
  type PosterSettings,
  type ScheduleData,
  type ScheduleRow,
} from "@/components/schedule/types";

export const SETTINGS_KEY = "poster";

export function toRow(e: VisitSchedule): ScheduleRow {
  return {
    id: e.id,
    time: e.time,
    company: e.company,
    visitorNames: e.visitorNames.split("\n").map((s) => s.trim()).filter(Boolean),
    label: e.label,
    hostName: e.hostName,
    hostDept: e.hostDept,
    room: e.room,
  };
}

export async function getScheduleForDate(date: string): Promise<ScheduleData> {
  const ds = await getDataSource();
  const rows = await ds
    .getRepository(VisitSchedule)
    .find({ where: { date }, order: { sortOrder: "ASC", time: "ASC" } });
  return { date, dateLabel: formatDateLabel(date), rows: rows.map(toRow) };
}

/** รายการวันที่ที่มีข้อมูล (ล่าสุดก่อน) */
export async function getDatesWithData(limit = 30): Promise<{ date: string; count: number }[]> {
  const ds = await getDataSource();
  const raw: { date: string; count: string }[] = await ds
    .getRepository(VisitSchedule)
    .createQueryBuilder("s")
    .select("s.date", "date")
    .addSelect("COUNT(*)", "count")
    .groupBy("s.date")
    .orderBy("s.date", "DESC")
    .limit(limit)
    .getRawMany();
  return raw.map((r) => ({ date: String(r.date).slice(0, 10), count: Number(r.count) }));
}

export async function getPosterSettings(): Promise<PosterSettings> {
  const ds = await getDataSource();
  const row = await ds.getRepository(Setting).findOneBy({ key: SETTINGS_KEY });
  const stored = (row?.value ?? {}) as Partial<PosterSettings>;
  // merge กับ default เผื่อมี field ใหม่เพิ่มภายหลัง
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    theme: { ...DEFAULT_THEME, ...(stored.theme ?? {}) },
  };
}
