"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

/** รับ "9:5", "0905", "09.05", "09:05" -> "09:05" — คืน null ถ้าไม่ใช่เวลา */
function normalize(raw: string): string | null {
  const s = raw.trim();
  if (!s) return "";
  let m = s.match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (!m) m = s.match(/^(\d{2})(\d{2})$/);
  if (!m) m = s.match(/^(\d{1,2})$/)?.concat("0") as RegExpMatchArray | null;
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/** time picker แบบ 24 ชั่วโมงเสมอ ไม่ขึ้นกับ locale ของเครื่อง */
export default function TimePicker24({ value, onChange, className = "" }: Props) {
  // เก็บค่าที่กำลังพิมพ์ แยกจาก value จริง — ถ้า value จากข้างนอกเปลี่ยน (เรียงตามเวลา / โหลดวันใหม่)
  // ให้ยึด value ใหม่ (pattern "derive state from props" ตาม React docs)
  const [draft, setDraft] = useState({ forValue: value, text: value });
  const text = draft.forValue === value ? draft.text : value;
  const setText = (t: string) => setDraft({ forValue: value, text: t });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // ปิดเมื่อคลิกนอก / กด Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // เลื่อนคอลัมน์ให้เห็นค่าที่เลือกอยู่ตอนเปิด
  useEffect(() => {
    if (!open) return;
    hourRef.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "center" });
    minuteRef.current?.querySelector<HTMLElement>("[data-active=true]")?.scrollIntoView({ block: "center" });
  }, [open]);

  const [h = "", m = ""] = value.split(":");

  function commit(raw: string) {
    const n = normalize(raw);
    if (n === null) {
      setText(value); // ไม่ถูกต้อง -> คืนค่าเดิม
      return;
    }
    setText(n);
    if (n !== value) onChange(n);
  }

  function pick(nextH: string, nextM: string) {
    onChange(`${nextH}:${nextM}`);
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      // ปิดเมื่อ focus ออกนอก component (เช่น กด Tab ไปช่องถัดไป)
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <div className="flex">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit((e.target as HTMLInputElement).value);
              setOpen(false);
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder="09:00"
          inputMode="numeric"
          maxLength={5}
          className={`${className} rounded-r-none font-mono tabular-nums`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          aria-label="เลือกเวลา"
          className="rounded-r-md border border-l-0 border-zinc-300 bg-zinc-50 px-2 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-1 flex rounded-md border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <Column ref={hourRef} items={HOURS} active={h} onPick={(v) => pick(v, m || "00")} />
          <Column
            ref={minuteRef}
            items={MINUTES.includes(m) || !m ? MINUTES : [...MINUTES, m].sort()}
            active={m}
            onPick={(v) => {
              pick(h || "09", v);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Column({
  ref,
  items,
  active,
  onPick,
}: {
  ref: React.Ref<HTMLDivElement>;
  items: string[];
  active: string;
  onPick: (v: string) => void;
}) {
  return (
    <div ref={ref} className="max-h-48 w-14 overflow-y-auto py-1 first:border-r first:border-zinc-200 dark:first:border-zinc-700">
      {items.map((v) => (
        <button
          key={v}
          type="button"
          data-active={v === active}
          onMouseDown={(e) => e.preventDefault()} // กัน input blur ก่อนคลิก
          onClick={() => onPick(v)}
          className={`block w-full px-2 py-1 text-center font-mono tabular-nums ${
            v === active ? "bg-teal-700 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
