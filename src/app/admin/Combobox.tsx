"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type ComboOption = { value: string; detail?: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** เรียกเมื่อเลือกจากรายการ (ได้ option เต็ม เช่น เอา detail ไปเติมช่องอื่น) */
  onSelect?: (opt: ComboOption) => void;
  options: ComboOption[];
  placeholder?: string;
  className?: string;
  /** ถ้ากำหนด จะมีตัวเลือก "เพิ่ม 'xxx'" เมื่อพิมพ์ค่าที่ยังไม่มีในรายการ */
  onCreate?: (value: string) => Promise<void> | void;
  createLabel?: string;
};

/**
 * dropdown แบบ select2: พิมพ์เพื่อค้นหา, เลือกด้วยเมาส์หรือลูกศร/Enter,
 * พิมพ์ค่าเองได้ (free text) และเพิ่มเข้าข้อมูลหลักได้จากในช่อง
 */
export default function Combobox({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  className = "",
  onCreate,
  createLabel = "เพิ่มในข้อมูลหลัก",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = ยังไม่พิมพ์ (แสดงทั้งหมด)
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const text = query ?? value;
  const q = (query ?? "").trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return options;
    const starts = options.filter((o) => o.value.toLowerCase().startsWith(q));
    const contains = options.filter(
      (o) => !o.value.toLowerCase().startsWith(q) && `${o.value} ${o.detail ?? ""}`.toLowerCase().includes(q),
    );
    return [...starts, ...contains];
  }, [options, q]);

  const typed = (query ?? "").trim();
  const exact = options.some((o) => o.value.toLowerCase() === typed.toLowerCase());
  const canCreate = Boolean(onCreate) && typed.length > 0 && !exact;
  const itemCount = filtered.length + (canCreate ? 1 : 0);

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // เลื่อนรายการที่ active ให้เห็น
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function close() {
    setOpen(false);
    setQuery(null);
  }

  function pick(opt: ComboOption) {
    onChange(opt.value);
    onSelect?.(opt);
    close();
  }

  async function create() {
    if (!onCreate || !typed) return;
    setBusy(true);
    try {
      await onCreate(typed);
      onChange(typed);
      close();
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => (itemCount ? (a + 1) % itemCount : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => (itemCount ? (a - 1 + itemCount) % itemCount : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (active < filtered.length) pick(filtered[active]);
        else if (canCreate) void create();
        else close();
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <div className="relative">
        <input
          value={text}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className={`${className} pr-7`}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="เปิดรายการ"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => (open ? close() : setOpen(true))}
          className="absolute inset-y-0 right-0 flex w-7 items-center justify-center text-zinc-400 hover:text-zinc-600"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
            <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open ? (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {filtered.length === 0 && !canCreate ? (
            <li className="px-3 py-1.5 text-xs text-zinc-500">
              {options.length === 0 ? "ยังไม่มีข้อมูลหลัก — พิมพ์ค่าเองได้" : "ไม่พบรายการ"}
            </li>
          ) : null}
          {filtered.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              data-index={i}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o)}
              className={`flex cursor-pointer items-baseline gap-2 px-3 py-1.5 ${
                i === active ? "bg-teal-700 text-white" : ""
              } ${o.value === value && i !== active ? "font-medium text-teal-700 dark:text-teal-400" : ""}`}
            >
              <span className="truncate">{o.value}</span>
              {o.detail ? (
                <span className={`ml-auto shrink-0 text-xs ${i === active ? "text-white/80" : "text-zinc-500"}`}>
                  {o.detail}
                </span>
              ) : null}
            </li>
          ))}
          {canCreate ? (
            <li
              role="option"
              aria-selected={false}
              data-index={filtered.length}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(filtered.length)}
              onClick={() => void create()}
              className={`cursor-pointer border-t border-zinc-200 px-3 py-1.5 dark:border-zinc-700 ${
                active === filtered.length ? "bg-teal-700 text-white" : "text-teal-700 dark:text-teal-400"
              }`}
            >
              {busy ? "กำลังเพิ่ม…" : `+ ${createLabel}: "${typed}"`}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
