"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  findDuplicateSlots,
  formatDateLabel,
  formatDateTh,
  POSTER_PORTRAIT,
  TV_PORTRAIT,
  type PosterSettings,
  type PosterTheme,
  type ScheduleData,
} from "@/components/schedule/types";
import {
  copySchedule,
  loadSchedule,
  resetPosterSettings,
  savePosterSettings,
  saveSchedule,
  setFontScale,
  setHostLayout,
  setTextScale,
  type RowInput,
} from "@/lib/schedule/actions";
import ScaledPreview from "./ScaledPreview";
import TvSchedule from "@/components/schedule/TvSchedule";
import ThemeTab from "./ThemeTab";
import TimePicker24 from "./TimePicker24";
import Combobox from "./Combobox";
import MasterTab from "./MasterTab";
import { createMaster, deleteMaster, importMasterFromSchedules, updateMaster } from "@/lib/master/actions";
import type { MasterData, MasterItemDto, MasterType } from "@/lib/master/types";

type RowDraft = RowInput & { key: string };
type Tab = "schedule" | "master" | "settings" | "theme";
type DateInfo = { date: string; count: number };

type Props = {
  initialSchedule: ScheduleData;
  initialSettings: PosterSettings;
  initialDates: DateInfo[];
  initialMaster: MasterData;
  today: string;
};

let keySeq = 0;
const newKey = () => `k${Date.now()}-${keySeq++}`;

function toDrafts(data: ScheduleData): RowDraft[] {
  return data.rows.map((r) => ({
    key: r.id,
    id: r.id,
    time: r.time,
    company: r.company,
    visitorNames: r.visitorNames.join("\n"),
    label: r.label,
    hostName: r.hostName,
    hostDept: r.hostDept,
    room: r.room,
  }));
}

function emptyRow(): RowDraft {
  return {
    key: newKey(),
    time: "",
    company: "",
    visitorNames: "",
    label: "VISITOR",
    hostName: "",
    hostDept: "",
    room: "",
  };
}

const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-600 dark:bg-zinc-900";
const btnCls =
  "inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700";
const btnPrimaryCls =
  "inline-flex items-center gap-1 rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50";

export default function AdminPanel({ initialSchedule, initialSettings, initialDates, initialMaster, today }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("schedule");
  const [previewMode, setPreviewMode] = useState<"poster" | "tv" | "tv40">("poster");
  const [date, setDate] = useState(initialSchedule.date);
  const [rows, setRows] = useState<RowDraft[]>(() => toDrafts(initialSchedule));
  const [savedRows, setSavedRows] = useState(() => JSON.stringify(toDrafts(initialSchedule)));
  const [settings, setSettings] = useState<PosterSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState(() => JSON.stringify(initialSettings));
  const [dates, setDates] = useState<DateInfo[]>(initialDates);
  const [master, setMaster] = useState<MasterData>(initialMaster);
  const [copyFrom, setCopyFrom] = useState(initialDates[0]?.date ?? today);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const rowsDirty = JSON.stringify(rows) !== savedRows;

  // แถวที่ เวลา + ห้อง ซ้ำกัน -> map จาก index แถว ไปยัง index ของแถวอื่นที่ซ้ำด้วย
  const duplicates = useMemo(() => findDuplicateSlots(rows), [rows]);
  const duplicateOf = useMemo(() => {
    const m = new Map<number, number[]>();
    duplicates.forEach((d) => d.indexes.forEach((i) => m.set(i, d.indexes.filter((j) => j !== i))));
    return m;
  }, [duplicates]);
  const settingsDirty = JSON.stringify(settings) !== savedSettings;
  const themeDirty = JSON.stringify(settings.theme) !== JSON.stringify(JSON.parse(savedSettings).theme);

  const previewData: ScheduleData = useMemo(
    () => ({
      date,
      dateLabel: formatDateLabel(date),
      rows: rows.map((r) => ({
        id: r.key,
        time: r.time,
        company: r.company,
        visitorNames: r.visitorNames.split("\n").map((s) => s.trim()).filter(Boolean),
        label: r.label,
        hostName: r.hostName,
        hostDept: r.hostDept,
        room: r.room,
      })),
    }),
    [date, rows],
  );

  function notify(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (err) {
        notify("error", (err as Error).message);
      }
    });
  }

  // ---------- date ----------
  function changeDate(next: string) {
    if (!next || next === date) return;
    if (rowsDirty && !confirm("มีการแก้ไขที่ยังไม่บันทึก ต้องการเปลี่ยนวันที่หรือไม่?")) return;
    run(async () => {
      const data = await loadSchedule(next);
      setDate(next);
      setRows(toDrafts(data));
      setSavedRows(JSON.stringify(toDrafts(data)));
      router.replace(`/admin?date=${next}`);
    });
  }

  function shiftDate(days: number) {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    changeDate(d.toISOString().slice(0, 10));
  }

  // ---------- rows ----------
  function updateRow(key: string, patch: Partial<RowDraft>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function moveRow(index: number, dir: -1 | 1) {
    setRows((rs) => {
      const j = index + dir;
      if (j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
  }
  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }
  function sortByTime() {
    setRows((rs) => [...rs].sort((a, b) => a.time.localeCompare(b.time)));
  }

  function knownIds(): string[] {
    return (JSON.parse(savedRows) as RowDraft[]).map((r) => r.id).filter((id): id is string => Boolean(id));
  }

  function saveRows() {
    if (duplicates.length) {
      alert(
        "ไม่สามารถบันทึกได้ — เวลาและห้องประชุมซ้ำกัน:\n\n" +
          duplicates
            .map(
              (d) =>
                `• วันที่ ${formatDateTh(date)} เวลา ${d.time} ห้อง ${d.room} มีอยู่แล้ว (รายการ #${d.indexes
                  .map((i) => i + 1)
                  .join(", #")})`,
            )
            .join("\n"),
      );
      return;
    }
    const before = knownIds().length;
    if (rows.length === 0 && before > 0) {
      if (!confirm(`จะลบรายการทั้งหมด ${before} รายการของวันที่ ${date} ออกจากฐานข้อมูล ยืนยันหรือไม่?`)) return;
    }
    run(async () => {
      const data = await saveSchedule(date, rows, knownIds());
      setRows(toDrafts(data));
      setSavedRows(JSON.stringify(toDrafts(data)));
      setDates((ds) => {
        const rest = ds.filter((d) => d.date !== date);
        return data.rows.length
          ? [...rest, { date, count: data.rows.length }].sort((a, b) => b.date.localeCompare(a.date))
          : rest;
      });
      notify("ok", `บันทึกตารางวันที่ ${date} แล้ว (${data.rows.length} รายการ)`);
    });
  }

  function doCopy() {
    if (copyFrom === date) return;
    if (!confirm(`คัดลอกตารางจาก ${copyFrom} มาทับข้อมูลของ ${date} ใช่หรือไม่?`)) return;
    run(async () => {
      const data = await copySchedule(copyFrom, date, knownIds());
      setRows(toDrafts(data));
      setSavedRows(JSON.stringify(toDrafts(data)));
      notify("ok", `คัดลอก ${data.rows.length} รายการจาก ${copyFrom} แล้ว`);
    });
  }

  // ---------- settings ----------
  function updateSettings(patch: Partial<PosterSettings>) {
    setSettings((s) => ({ ...s, ...patch }));
  }
  function updateFooter(i: number, patch: Partial<PosterSettings["footerItems"][number]>) {
    setSettings((s) => {
      const items = [...s.footerItems] as PosterSettings["footerItems"];
      items[i] = { ...items[i], ...patch };
      return { ...s, footerItems: items };
    });
  }
  function saveSettings() {
    run(async () => {
      const saved = await savePosterSettings(settings);
      setSettings(saved);
      setSavedSettings(JSON.stringify(saved));
      notify("ok", "บันทึกการตั้งค่าแล้ว");
    });
  }
  function resetSettings() {
    if (!confirm("คืนค่าเริ่มต้นทั้งหมด?")) return;
    run(async () => {
      const saved = await resetPosterSettings();
      setSettings(saved);
      setSavedSettings(JSON.stringify(saved));
      notify("ok", "คืนค่าเริ่มต้นแล้ว");
    });
  }
  // รูปแบบแสดงผู้รับแขก: บันทึกลงฐานข้อมูลทันทีที่เลือก (ไม่ต้องกด "บันทึก") เพื่อให้หน้าแสดงผลจริงตรงกับที่เลือกใน preview เสมอ
  // — merge กับค่าที่บันทึกไว้ล่าสุดบนเซิร์ฟเวอร์ ไม่แตะฟิลด์อื่นที่ผู้ใช้ยังแก้ไม่บันทึก
  function changeHostLayout(v: PosterSettings["hostLayout"]) {
    setSettings((s) => ({ ...s, hostLayout: v }));
    run(async () => {
      const saved = await setHostLayout(v);
      setSavedSettings((prev) => JSON.stringify({ ...JSON.parse(prev), hostLayout: saved.hostLayout }));
      notify("ok", v === "table" ? "ตั้งค่าแสดงผู้รับแขกแบบตารางแล้ว" : "ตั้งค่าแสดงผู้รับแขกแบบหัวข้อรายการแล้ว");
    });
  }
  // ขนาดตัวอักษร: อัปเดต preview ทันทีทุกครั้งที่เลื่อน แล้ว debounce บันทึกลงฐานข้อมูลหลังหยุดเลื่อน
  // (ไม่ต้องกด "บันทึก") เพื่อให้ /schedule ตรงกับที่เลื่อนใน preview เสมอ — ไม่แตะฟิลด์อื่นที่ยังแก้ไม่บันทึก
  const fontScaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (fontScaleTimer.current) clearTimeout(fontScaleTimer.current);
  }, []);
  function changeFontScale(v: number) {
    setSettings((s) => ({ ...s, fontScale: v }));
    if (fontScaleTimer.current) clearTimeout(fontScaleTimer.current);
    fontScaleTimer.current = setTimeout(() => {
      run(async () => {
        const saved = await setFontScale(v);
        setSavedSettings((prev) => JSON.stringify({ ...JSON.parse(prev), fontScale: saved.fontScale }));
      });
    }, 400);
  }
  // ขนาด/ความหนาตัวอักษรแยกส่วน (visitor/host/room): อัปเดต preview ทันที แล้ว debounce บันทึกลงฐานข้อมูล
  // เช่นเดียวกับ fontScale เพื่อให้จอ TV เครื่องอื่นเห็นผลโดยไม่ต้องกด "บันทึก"
  const textScaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (textScaleTimer.current) clearTimeout(textScaleTimer.current);
  }, []);
  function changeTextScale(patch: Parameters<typeof setTextScale>[0]) {
    setSettings((s) => ({ ...s, ...patch }));
    if (textScaleTimer.current) clearTimeout(textScaleTimer.current);
    textScaleTimer.current = setTimeout(() => {
      run(async () => {
        const saved = await setTextScale(patch);
        const savedPatch = Object.fromEntries(
          Object.keys(patch).map((k) => [k, saved[k as keyof PosterSettings]]),
        );
        setSavedSettings((prev) => JSON.stringify({ ...JSON.parse(prev), ...savedPatch }));
      });
    }, 400);
  }

  // ---------- master data ----------
  function masterCreate(type: MasterType, name: string, detail = "") {
    run(async () => {
      setMaster(await createMaster(type, name, detail));
      notify("ok", `เพิ่ม "${name}" แล้ว`);
    });
  }
  function masterUpdate(item: MasterItemDto, name: string, detail: string) {
    run(async () => {
      setMaster(await updateMaster(item.id, name, detail));
      notify("ok", `แก้ไข "${name}" แล้ว`);
    });
  }
  function masterDelete(item: MasterItemDto) {
    run(async () => {
      setMaster(await deleteMaster(item.id));
      notify("ok", `ลบ "${item.name}" แล้ว`);
    });
  }
  function masterImport() {
    run(async () => {
      const r = await importMasterFromSchedules();
      setMaster(r.data);
      notify("ok", r.added ? `นำเข้า ${r.added} รายการ` : "ไม่มีรายการใหม่ให้นำเข้า");
    });
  }
  /** สำหรับ combobox ในตารางนัด: เพิ่มเข้าข้อมูลหลักแล้วรอผล */
  async function masterQuickAdd(type: MasterType, name: string, detail = "") {
    try {
      setMaster(await createMaster(type, name, detail));
      notify("ok", `เพิ่ม "${name}" ในข้อมูลหลักแล้ว`);
    } catch (err) {
      notify("error", (err as Error).message);
    }
  }

  const publicUrl = `/schedule?date=${date}`;
  const tvUrl = `/tv?date=${date}`;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* top bar */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mr-2 font-semibold">Visitor Schedule Admin</div>

        <div className="flex items-center gap-1">
          <button className={btnCls} onClick={() => shiftDate(-1)} disabled={pending} title="วันก่อนหน้า">
            ‹
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
            className={`${inputCls} w-auto`}
            disabled={pending}
          />
          <button className={btnCls} onClick={() => shiftDate(1)} disabled={pending} title="วันถัดไป">
            ›
          </button>
          <button className={`${btnCls} whitespace-nowrap`} onClick={() => changeDate(today)} disabled={pending || date === today}>
            วันนี้
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {message ? (
            <span
              className={`text-sm ${message.type === "ok" ? "text-teal-700 dark:text-teal-400" : "text-red-600"}`}
            >
              {message.text}
            </span>
          ) : null}
          <a href={publicUrl} target="_blank" rel="noreferrer" className={btnCls}>
            หน้าแสดงผล ↗
          </a>
          <a href={tvUrl} target="_blank" rel="noreferrer" className={btnCls} title="เปิดบนจอ TV แล้วกด F11 เต็มจอ">
            โหมด TV ↗
          </a>
        </div>
      </header>

      <div className="grid flex-1 gap-5 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:grid-cols-[minmax(680px,1.2fr)_minmax(0,1fr)]">
        {/* left: controls */}
        <aside className="flex min-w-0 flex-col gap-3">
          <div className="flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
            {(
              [
                ["schedule", `ตารางนัด${rowsDirty ? " •" : ""}`],
                ["master", "ข้อมูลหลัก"],
                ["settings", `ตั้งค่า${settingsDirty ? " •" : ""}`],
                ["theme", `ธีมสี${themeDirty ? " •" : ""}`],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                  tab === t ? "bg-teal-700 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "schedule" ? (
            <ScheduleTab
              date={date}
              rows={rows}
              duplicateOf={duplicateOf}
              master={master}
              onQuickAdd={masterQuickAdd}
              timeColors={settings.theme.timeColors}
              dates={dates}
              copyFrom={copyFrom}
              pending={pending}
              dirty={rowsDirty}
              onChangeDate={changeDate}
              onUpdateRow={updateRow}
              onMoveRow={moveRow}
              onRemoveRow={removeRow}
              onAddRow={() => setRows((rs) => [...rs, emptyRow()])}
              onSortByTime={sortByTime}
              onClear={() => confirm("ลบทุกแถวของวันนี้ (ยังไม่บันทึก)?") && setRows([])}
              onCopyFromChange={setCopyFrom}
              onCopy={doCopy}
              onSave={saveRows}
              onDiscard={() => setRows(JSON.parse(savedRows))}
            />
          ) : tab === "master" ? (
            <MasterTab
              master={master}
              pending={pending}
              onCreate={masterCreate}
              onUpdate={masterUpdate}
              onDelete={masterDelete}
              onImport={masterImport}
            />
          ) : tab === "theme" ? (
            <>
              <ThemeTab theme={settings.theme} onChange={(theme: PosterTheme) => updateSettings({ theme })} />
              <SaveBar
                dirty={settingsDirty}
                pending={pending}
                onSave={saveSettings}
                onDiscard={() => setSettings(JSON.parse(savedSettings))}
              />
            </>
          ) : (
            <SettingsTab
              settings={settings}
              pending={pending}
              dirty={settingsDirty}
              onUpdate={updateSettings}
              onUpdateFooter={updateFooter}
              onChangeHostLayout={changeHostLayout}
              onChangeFontScale={changeFontScale}
              onChangeTextScale={changeTextScale}
              onSave={saveSettings}
              onReset={resetSettings}
              onDiscard={() => setSettings(JSON.parse(savedSettings))}
            />
          )}
        </aside>

        {/* right: live preview */}
        <section className="mx-auto w-full max-w-[880px] min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>
              ตัวอย่างสด — {formatDateLabel(date)} · {rows.length} รายการ
              {rowsDirty || settingsDirty ? " · มีการแก้ไขที่ยังไม่บันทึก" : ""}
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex rounded-md border border-zinc-300 p-0.5 text-xs dark:border-zinc-600">
                {(
                  [
                    ["table", "ผู้รับแขก: ในตาราง"],
                    ["header", "ผู้รับแขก: หัวข้อรายการ"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => changeHostLayout(v)}
                    disabled={pending}
                    className={`rounded px-2 py-1 ${
                      settings.hostLayout === v ? "bg-teal-700 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-md border border-zinc-300 p-0.5 text-xs dark:border-zinc-600">
                {(
                  [
                    ["poster", "โปสเตอร์"],
                    ["tv", `TV 55" แนวตั้ง (${TV_PORTRAIT.width}×${TV_PORTRAIT.height})`],
                    ["tv40", `TV 40" แนวตั้ง (${TV_PORTRAIT.width}×${TV_PORTRAIT.height})`],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setPreviewMode(m)}
                    className={`rounded px-2 py-1 ${
                      previewMode === m ? "bg-teal-700 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-200/60 p-2 dark:border-zinc-800 dark:bg-zinc-900">
            {previewMode === "poster" ? (
              // ใช้ TvSchedule (ตัวเดียวกับหน้าแสดงผลจริง) เพื่อให้แบ่งหน้า/ขนาดตรงกับ /schedule และ /tv เป๊ะๆ
              <ScaledPreview>
                <TvSchedule data={previewData} settings={settings} size={POSTER_PORTRAIT} preview />
              </ScaledPreview>
            ) : (
              <ScaledPreview width={TV_PORTRAIT.width}>
                <TvSchedule data={previewData} settings={settings} size={TV_PORTRAIT} preview />
              </ScaledPreview>
            )}
          </div>
          {previewMode === "tv" || previewMode === "tv40" ? (
            <p className="mt-2 text-xs text-zinc-500">
              ถ้ารายการเกินหนึ่งหน้า จะสลับหน้าทุก {settings.tvPageIntervalSec} วินาที (ตั้งค่าได้ในแท็บ ตั้งค่า) —
              บนจอจริงเปิด <code>{tvUrl}</code> แบบเต็มจอ
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type ScheduleTabProps = {
  date: string;
  rows: RowDraft[];
  duplicateOf: Map<number, number[]>;
  master: MasterData;
  onQuickAdd: (type: MasterType, name: string, detail?: string) => Promise<void>;
  timeColors: string[];
  dates: DateInfo[];
  copyFrom: string;
  pending: boolean;
  dirty: boolean;
  onChangeDate: (d: string) => void;
  onUpdateRow: (key: string, patch: Partial<RowDraft>) => void;
  onMoveRow: (index: number, dir: -1 | 1) => void;
  onRemoveRow: (key: string) => void;
  onAddRow: () => void;
  onSortByTime: () => void;
  onClear: () => void;
  onCopyFromChange: (d: string) => void;
  onCopy: () => void;
  onSave: () => void;
  onDiscard: () => void;
};

function ScheduleTab(p: ScheduleTabProps) {
  return (
    <>
      <Card title="วันที่มีข้อมูล">
        {p.dates.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีข้อมูล</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {p.dates.map((d) => (
              <button
                key={d.date}
                onClick={() => p.onChangeDate(d.date)}
                disabled={p.pending}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  d.date === p.date
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800"
                }`}
              >
                {d.date} <span className="opacity-70">({d.count})</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card
        title={`รายการวันที่ ${p.date}`}
        actions={
          <>
            <button className={btnCls} onClick={p.onSortByTime} disabled={p.rows.length < 2}>
              เรียงตามเวลา
            </button>
            <button className={btnCls} onClick={p.onClear} disabled={p.rows.length === 0}>
              ล้าง
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {p.rows.length === 0 ? (
            <p className="text-sm text-zinc-500">ยังไม่มีรายการ — กด &quot;เพิ่มรายการ&quot; หรือคัดลอกจากวันอื่น</p>
          ) : null}
          {p.rows.map((r, i) => (
            <RowEditor
              key={r.key}
              index={i}
              row={r}
              total={p.rows.length}
              duplicateWith={p.duplicateOf.get(i)}
              master={p.master}
              onQuickAdd={p.onQuickAdd}
              color={p.timeColors[i % Math.max(1, p.timeColors.length)] ?? "#147973"}
              onUpdate={(patch) => p.onUpdateRow(r.key, patch)}
              onMove={(dir) => p.onMoveRow(i, dir)}
              onRemove={() => p.onRemoveRow(r.key)}
            />
          ))}
          <button className={`${btnCls} justify-center border-dashed`} onClick={p.onAddRow}>
            + เพิ่มรายการ
          </button>
        </div>
      </Card>

      <Card title="คัดลอกจากวันอื่น">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={p.copyFrom}
            onChange={(e) => p.onCopyFromChange(e.target.value)}
            className={inputCls}
          />
          <button className={btnCls} onClick={p.onCopy} disabled={p.pending || !p.copyFrom || p.copyFrom === p.date}>
            คัดลอกมาวันนี้
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">จะบันทึกทับข้อมูลของ {p.date} ทันที</p>
      </Card>

      <SaveBar dirty={p.dirty} pending={p.pending} onSave={p.onSave} onDiscard={p.onDiscard} />
    </>
  );
}

function RowEditor({
  index,
  row,
  total,
  duplicateWith,
  master,
  onQuickAdd,
  color,
  onUpdate,
  onMove,
  onRemove,
}: {
  index: number;
  row: RowDraft;
  total: number;
  /** index ของแถวอื่นที่ เวลา+ห้อง ซ้ำกับแถวนี้ */
  duplicateWith?: number[];
  master: MasterData;
  onQuickAdd: (type: MasterType, name: string, detail?: string) => Promise<void>;
  /** สีกล่องเวลาของแถวนี้บนโปสเตอร์ — ใช้ทำป้ายเลขลำดับให้จับคู่กันได้ */
  color: string;
  onUpdate: (patch: Partial<RowDraft>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const dup = duplicateWith && duplicateWith.length > 0;
  const opts = {
    room: master.room.map((m) => ({ value: m.name })),
    company: master.company.map((m) => ({ value: m.name })),
    host: master.host.map((m) => ({ value: m.name, detail: m.detail || undefined })),
    department: master.department.map((m) => ({ value: m.name })),
  };
  const summary = [row.time, row.company, row.room].map((v) => v.trim()).filter(Boolean).join(" · ");

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        dup
          ? "border-red-400 ring-2 ring-red-300/60 dark:border-red-700"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      {/* หัวการ์ด: ลำดับ + สรุป + ปุ่มจัดการ */}
      <div
        className={`flex items-center gap-2.5 border-b px-3 py-2 ${
          dup ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40" : "border-zinc-200 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-800"
        }`}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 78%, black))` }}
        >
          {index + 1}
        </span>
        <span className="min-w-0 truncate text-sm font-medium">
          {summary || <span className="font-normal text-zinc-400">รายการใหม่ — ยังไม่ได้กรอก</span>}
        </span>
        {dup ? (
          <span className="shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
            ซ้ำกับรายการ #{duplicateWith!.map((i) => i + 1).join(", #")}
          </span>
        ) : null}
        <div className="ml-auto flex shrink-0 gap-1">
          <button className={btnCls} onClick={() => onMove(-1)} disabled={index === 0} title="เลื่อนขึ้น">
            ↑
          </button>
          <button className={btnCls} onClick={() => onMove(1)} disabled={index === total - 1} title="เลื่อนลง">
            ↓
          </button>
          <button className={`${btnCls} text-red-600`} onClick={onRemove} title="ลบรายการนี้">
            ✕
          </button>
        </div>
      </div>

      {/* เนื้อหา: 3 กลุ่ม */}
      <div className="grid gap-3 bg-white p-3 dark:bg-zinc-900 md:grid-cols-[minmax(230px,0.9fr)_1.3fr_1fr]">
        <Group title="นัดหมาย" hint="เวลา + ห้อง ต้องไม่ซ้ำกันในวันเดียวกัน">
          <Field label="เวลา">
            <TimePicker24 value={row.time} onChange={(time) => onUpdate({ time })} className={inputCls} />
          </Field>
          <Field label="ห้องประชุม">
            <Combobox
              value={row.room}
              onChange={(room) => onUpdate({ room })}
              options={opts.room}
              placeholder="ROOM 2"
              className={inputCls}
              onCreate={(v) => onQuickAdd("room", v)}
            />
          </Field>
        </Group>

        <Group title="ผู้มาติดต่อ">
          <Field label="บริษัท / กิจกรรม">
            <Combobox
              value={row.company}
              onChange={(company) => onUpdate({ company })}
              options={opts.company}
              placeholder="TYM"
              className={inputCls}
              onCreate={(v) => onQuickAdd("company", v)}
            />
          </Field>
          <Field label="รายชื่อ (บรรทัดละคน/กลุ่ม)">
            <textarea
              value={row.visitorNames}
              onChange={(e) => onUpdate({ visitorNames: e.target.value })}
              rows={3}
              placeholder={"MR. HATTORI, MR. SHUICHI\nMR. WEERANAH"}
              className={inputCls}
            />
          </Field>
          <Field label="ป้ายกำกับ">
            <input value={row.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="VISITOR" className={inputCls} />
          </Field>
        </Group>

        <Group title="ผู้รับแขก" hint="เลือกจากรายการแล้วฝ่ายจะถูกเติมให้">
          <Field label="ชื่อผู้รับแขก">
            <Combobox
              value={row.hostName}
              onChange={(hostName) => onUpdate({ hostName })}
              // เลือกผู้รับแขกจากข้อมูลหลัก -> เติมฝ่าย/แผนกให้ด้วย
              onSelect={(o) => (o.detail ? onUpdate({ hostName: o.value, hostDept: o.detail }) : undefined)}
              options={opts.host}
              className={inputCls}
              onCreate={(v) => onQuickAdd("host", v, row.hostDept)}
            />
          </Field>
          <Field label="ฝ่าย / แผนก">
            <Combobox
              value={row.hostDept}
              onChange={(hostDept) => onUpdate({ hostDept })}
              options={opts.department}
              className={inputCls}
              onCreate={(v) => onQuickAdd("department", v)}
            />
          </Field>
        </Group>
      </div>
    </div>
  );
}

/** กลุ่มฟิลด์ในการ์ดรายการ — มีหัวข้อและเส้นคั่นให้แยกกันชัด */
function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/40">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">{title}</legend>
      {children}
      {hint ? <p className="mt-auto text-[11px] leading-snug text-zinc-400">{hint}</p> : null}
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */

type SettingsTabProps = {
  settings: PosterSettings;
  pending: boolean;
  dirty: boolean;
  onUpdate: (patch: Partial<PosterSettings>) => void;
  onUpdateFooter: (i: number, patch: Partial<PosterSettings["footerItems"][number]>) => void;
  onChangeHostLayout: (v: PosterSettings["hostLayout"]) => void;
  onChangeFontScale: (v: number) => void;
  onChangeTextScale: (
    patch: Partial<
      Pick<PosterSettings, "visitorScale" | "visitorBold" | "hostScale" | "hostBold" | "roomScale" | "roomBold">
    >,
  ) => void;
  onSave: () => void;
  onReset: () => void;
  onDiscard: () => void;
};

function SettingsTab({
  settings: s,
  pending,
  dirty,
  onUpdate,
  onUpdateFooter,
  onChangeHostLayout,
  onChangeFontScale,
  onChangeTextScale,
  onSave,
  onReset,
  onDiscard,
}: SettingsTabProps) {
  return (
    <>
      <Card title="ขนาดตัวอักษร">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.8}
              max={2}
              step={0.05}
              value={s.fontScale}
              onChange={(e) => onChangeFontScale(Number(e.target.value))}
              className="h-1.5 flex-1 accent-teal-700"
            />
            <span className="w-12 shrink-0 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
              {Math.round(s.fontScale * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <button className={btnCls} onClick={() => onChangeFontScale(1)} disabled={s.fontScale === 1}>
              รีเซ็ตเป็น 100%
            </button>
            <p className="text-[11px] leading-snug text-zinc-400">
              เลื่อนแล้วมีผลกับ preview และหน้าแสดงผลจริงทันที ไม่ต้องกด &quot;บันทึก&quot;
            </p>
          </div>
        </div>
      </Card>

      <Card title="ขนาด/ความหนาตัวอักษรแยกส่วน">
        <div className="flex flex-col gap-3">
          <TextScaleRow
            label="ผู้มาติดต่อ (Visitor)"
            scale={s.visitorScale}
            bold={s.visitorBold}
            onScale={(v) => onChangeTextScale({ visitorScale: v })}
            onBold={(v) => onChangeTextScale({ visitorBold: v })}
          />
          <TextScaleRow
            label="ผู้รับแขก (Host)"
            scale={s.hostScale}
            bold={s.hostBold}
            onScale={(v) => onChangeTextScale({ hostScale: v })}
            onBold={(v) => onChangeTextScale({ hostBold: v })}
          />
          <TextScaleRow
            label="ห้องประชุม (Room)"
            scale={s.roomScale}
            bold={s.roomBold}
            onScale={(v) => onChangeTextScale({ roomScale: v })}
            onBold={(v) => onChangeTextScale({ roomBold: v })}
          />
          <p className="text-[11px] leading-snug text-zinc-400">
            คูณเพิ่มจากขนาดตัวอักษรรวมด้านบนอีกที — เลื่อนแล้วมีผลกับ preview และหน้าแสดงผลจริงทันที ไม่ต้องกด &quot;บันทึก&quot;
          </p>
        </div>
      </Card>

      <Card title="ส่วนหัว">
        <div className="flex flex-col gap-2">
          <Field label="ข้อความต้อนรับ">
            <input value={s.welcomeText} onChange={(e) => onUpdate({ welcomeText: e.target.value })} className={inputCls} />
          </Field>
          <Field label="ชื่อบริษัท (EN)">
            <input value={s.companyNameEn} onChange={(e) => onUpdate({ companyNameEn: e.target.value })} className={inputCls} />
          </Field>
          <Field label="ชื่อบริษัท (TH)">
            <input value={s.companyNameTh} onChange={(e) => onUpdate({ companyNameTh: e.target.value })} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.showMotto} onChange={(e) => onUpdate({ showMotto: e.target.checked })} />
            แสดงคำขวัญมุมขวาบน
          </label>
          <Field label="คำขวัญ (บรรทัดละข้อความ)">
            <textarea
              value={s.mottoLines.join("\n")}
              onChange={(e) => onUpdate({ mottoLines: e.target.value.split("\n") })}
              rows={4}
              className={inputCls}
              disabled={!s.showMotto}
            />
          </Field>
        </div>
      </Card>

      <Card title="ผู้รับแขก">
        <div className="flex flex-col gap-2">
          <Field label="รูปแบบการแสดงผู้รับแขก">
            <div className="flex rounded-md border border-zinc-300 p-0.5 text-sm dark:border-zinc-600">
              {(
                [
                  ["table", "แบบคอลัมน์ในตาราง"],
                  ["header", "แบบหัวข้อของแต่ละรายการ"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChangeHostLayout(v)}
                  disabled={pending}
                  className={`flex-1 rounded px-2 py-1 ${
                    s.hostLayout === v ? "bg-teal-700 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-zinc-400">
              มีผลกับหน้าแสดงผลจริงทันทีที่เลือก ไม่ต้องกด &quot;บันทึก&quot;
            </p>
          </Field>
          <Field label="ข้อความเมื่อยังไม่ระบุชื่อ">
            <input value={s.defaultHostName} onChange={(e) => onUpdate({ defaultHostName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="ข้อความเมื่อยังไม่ระบุฝ่าย">
            <input value={s.defaultHostDept} onChange={(e) => onUpdate({ defaultHostDept: e.target.value })} className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.editableHost} onChange={(e) => onUpdate({ editableHost: e.target.checked })} />
            ให้คลิกแก้ชื่อผู้รับแขกในหน้าแสดงผลได้ (ไม่บันทึกลงฐานข้อมูล)
          </label>
        </div>
      </Card>

      <Card title="ส่วนท้าย">
        <div className="flex flex-col gap-2">
          <Field label="ขอบคุณ (EN)">
            <input value={s.thanksEn} onChange={(e) => onUpdate({ thanksEn: e.target.value })} className={inputCls} />
          </Field>
          <Field label="ขอบคุณ (TH)">
            <input value={s.thanksTh} onChange={(e) => onUpdate({ thanksTh: e.target.value })} className={inputCls} />
          </Field>
          {s.footerItems.map((item, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Field label={`ค่านิยม ${i + 1} (EN)`}>
                <input value={item.en} onChange={(e) => onUpdateFooter(i, { en: e.target.value })} className={inputCls} />
              </Field>
              <Field label={`ค่านิยม ${i + 1} (TH)`}>
                <input value={item.th} onChange={(e) => onUpdateFooter(i, { th: e.target.value })} className={inputCls} />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      <Card title="โหมด TV">
        <div className="grid grid-cols-2 gap-2">
          <Field label="สลับหน้าทุก (วินาที)">
            <input
              type="number"
              min={5}
              max={600}
              value={s.tvPageIntervalSec}
              onChange={(e) => onUpdate({ tvPageIntervalSec: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
          <Field label="ดึงข้อมูลใหม่ทุก (วินาที)">
            <input
              type="number"
              min={10}
              max={3600}
              value={s.tvRefreshSec}
              onChange={(e) => onUpdate({ tvRefreshSec: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          ใช้เมื่อรายการเกินหนึ่งหน้าจอ TV — จะวนแสดงทีละหน้าไปเรื่อยๆ และดึงข้อมูลล่าสุดจากฐานข้อมูลอัตโนมัติ
        </p>
      </Card>

      <SaveBar dirty={dirty} pending={pending} onSave={onSave} onDiscard={onDiscard}>
        <button className={btnCls} onClick={onReset} disabled={pending}>
          คืนค่าเริ่มต้น
        </button>
      </SaveBar>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Card({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actions ? <div className="ml-auto flex gap-1">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

/** แถวปรับขนาด (คูณเพิ่มจาก fontScale) + ตัวหนา สำหรับข้อความส่วนใดส่วนหนึ่งของโปสเตอร์ */
function TextScaleRow({
  label,
  scale,
  bold,
  onScale,
  onBold,
}: {
  label: string;
  scale: number;
  bold: boolean;
  onScale: (v: number) => void;
  onBold: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <label className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={bold} onChange={(e) => onBold(e.target.checked)} />
          ตัวหนา
        </label>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0.8}
          max={2}
          step={0.05}
          value={scale}
          onChange={(e) => onScale(Number(e.target.value))}
          className="h-1.5 flex-1 accent-teal-700"
        />
        <span className="w-12 shrink-0 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
          {Math.round(scale * 100)}%
        </span>
      </div>
    </div>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 block text-xs text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

function SaveBar({
  dirty,
  pending,
  onSave,
  onDiscard,
  children,
}: {
  dirty: boolean;
  pending: boolean;
  onSave: () => void;
  onDiscard: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <button className={btnPrimaryCls} onClick={onSave} disabled={pending || !dirty}>
        {pending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
      <button className={btnCls} onClick={onDiscard} disabled={pending || !dirty}>
        ยกเลิกการแก้ไข
      </button>
      <div className="ml-auto flex gap-1">{children}</div>
    </div>
  );
}

