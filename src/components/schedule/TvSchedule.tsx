"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SchedulePoster from "./SchedulePoster";
import type { PosterSettings, ScheduleData, ScheduleRow } from "./types";
import styles from "./tv.module.css";

const POSTER_WIDTH = 1024;
/** ความสูงขั้นต่ำของโปสเตอร์ (หน่วย px ที่กว้าง 1024) — เท่าโปสเตอร์ต้นฉบับ 2:3 เพื่อให้มีที่ให้แถวรายการเสมอ */
const MIN_POSTER_HEIGHT = 1536;

type Size = { width: number; height: number };

type Props = {
  data: ScheduleData;
  settings: PosterSettings;
  /** ขนาดกรอบแสดงผล — ไม่ใส่ = ใช้ขนาด viewport (สำหรับจอ TV จริง) */
  size?: Size;
  /** โหมด preview ใน admin: ไม่ต้อง refresh ข้อมูลเอง */
  preview?: boolean;
};

/**
 * แสดงโปสเตอร์เต็มจอ TV แนวตั้ง
 * - ย่อ/ขยายโปสเตอร์ (กว้าง 1024) ให้พอดีความกว้างจอ และยืดความสูงให้เต็มจอ
 * - วัดความสูงจริงของแต่ละแถว แล้วแบ่งเป็นหน้าเท่าที่ใส่ได้
 * - ถ้ามีมากกว่า 1 หน้า สลับหน้าทุก tvPageIntervalSec วินาที วนลูป
 * - refresh ข้อมูลจาก server ทุก tvRefreshSec วินาที
 */
export default function TvSchedule({ data, settings, size, preview = false }: Props) {
  const router = useRouter();
  const [windowSize, setWindowSize] = useState<Size | null>(null);

  // ขนาด viewport จริง (ใช้เมื่อไม่ได้กำหนด size)
  useEffect(() => {
    if (size) return;
    const update = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const id = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", update);
    };
  }, [size]);

  const viewport = size ?? windowSize;
  // จอแนวตั้ง: ขยายให้กว้างเต็มจอ แล้วยืดความสูงโปสเตอร์ให้เต็มจอพอดี
  // จอเตี้ย/แนวนอน: ความสูงโปสเตอร์ไม่ต่ำกว่า MIN_POSTER_HEIGHT แล้วย่อทั้งใบให้พอดีความสูง จัดกลาง (letterbox)
  const scaleByWidth = viewport ? viewport.width / POSTER_WIDTH : 1;
  const posterHeight = viewport
    ? Math.max(MIN_POSTER_HEIGHT, Math.round(viewport.height / scaleByWidth))
    : MIN_POSTER_HEIGHT;
  const scale = viewport ? Math.min(scaleByWidth, viewport.height / posterHeight) : 1;
  const offsetX = viewport ? Math.round((viewport.width - POSTER_WIDTH * scale) / 2) : 0;

  // ---------- วัดขนาดและแบ่งหน้า ----------
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<ScheduleRow[][]>([data.rows]);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || !viewport) return;

    let cancelled = false;
    const compute = () => {
      if (cancelled) return;
      const poster = el.querySelector<HTMLElement>("[data-poster]");
      const rowEls = Array.from(el.querySelectorAll<HTMLElement>("[data-row]"));
      if (!poster) return;

      // ช่องว่างระหว่างการ์ด (row-gap) — ดีไซน์แบบหัวข้อรายการมีช่องว่างนี้, แบบตารางไม่มี (0)
      // ต้องแยกออกจาก "chrome" เพราะจำนวนช่องว่างขึ้นกับจำนวนแถวต่อหน้า ไม่ใช่ค่าคงที่
      const scheduleEl = rowEls[0]?.parentElement;
      const gap = scheduleEl ? parseFloat(getComputedStyle(scheduleEl).rowGap) || 0 : 0;

      const rowHeights = rowEls.map((r) => r.offsetHeight);
      const rowsTotal =
        rowHeights.reduce((a, b) => a + b, 0) + gap * Math.max(0, rowHeights.length - 1);
      // ความสูงส่วนที่ไม่ใช่แถว (header + หัวตาราง + thanks + footer + margin)
      const chrome = poster.offsetHeight - rowsTotal;
      const available = posterHeight - chrome;

      const result: ScheduleRow[][] = [];
      let current: ScheduleRow[] = [];
      let used = 0;
      data.rows.forEach((row, i) => {
        const h = rowHeights[i] ?? 108;
        const withGap = current.length > 0 ? gap : 0;
        if (current.length > 0 && used + withGap + h > available) {
          result.push(current);
          current = [];
          used = 0;
        }
        used += (current.length > 0 ? gap : 0) + h;
        current.push(row);
      });
      if (current.length > 0 || result.length === 0) result.push(current);
      setPages(result);
    };

    compute();
    // วัดซ้ำหลังฟอนต์โหลดเสร็จ เพราะความสูงข้อความอาจเปลี่ยน
    document.fonts?.ready.then(compute);
    return () => {
      cancelled = true;
    };
  }, [data, settings, viewport, posterHeight]);

  // ---------- สลับหน้า ----------
  // คำนวณหน้าจากเวลาจริง (ไม่นับ tick) — ถ้า browser หน่วง timer ตอนแท็บซ่อน
  // พอกลับมาแสดงจะข้ามไปหน้าที่ถูกต้องทันที ไม่ค้างหน้าเดิม
  const [page, setPage] = useState(0);
  const pageCount = pages.length;
  const safePage = Math.min(page, pageCount - 1);
  const startRef = useRef(0);

  useEffect(() => {
    if (pageCount <= 1) return;
    const ms = Math.max(5, settings.tvPageIntervalSec) * 1000;
    startRef.current = Date.now();
    const tick = () => {
      const next = Math.floor((Date.now() - startRef.current) / ms) % pageCount;
      setPage((p) => (p === next ? p : next));
    };
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [pageCount, settings.tvPageIntervalSec]);

  // ---------- refresh ข้อมูล ----------
  useEffect(() => {
    if (preview) return;
    const ms = Math.max(10, settings.tvRefreshSec) * 1000;
    const id = setInterval(() => router.refresh(), ms);
    return () => clearInterval(id);
  }, [preview, settings.tvRefreshSec, router]);

  const pageData: ScheduleData = useMemo(
    () => ({ ...data, rows: pages[safePage] ?? [] }),
    [data, pages, safePage],
  );

  if (!viewport) return <div className={styles.screen} />;

  return (
    <div className={styles.screen} style={size ? { width: size.width, height: size.height } : undefined}>
      {/* สำเนาสำหรับวัดขนาด: เรนเดอร์ทุกแถวที่ความกว้าง 1024 แต่ซ่อนไว้ */}
      <div ref={measureRef} className={styles.measure} aria-hidden>
        <SchedulePoster data={data} settings={{ ...settings, editableHost: false }} compact measure />
      </div>

      <div
        key={safePage}
        className={styles.stage}
        style={{ width: POSTER_WIDTH, height: posterHeight, left: offsetX, transform: `scale(${scale})` }}
      >
        <SchedulePoster
          data={pageData}
          settings={{ ...settings, editableHost: false }}
          compact
          fillHeight={posterHeight}
        />
      </div>

      {pageCount > 1 ? (
        <div className={styles.dots} style={{ left: offsetX, transform: `scale(${scale})` }}>
          {pages.map((_, i) => (
            <span key={i} className={i === safePage ? styles.dotActive : styles.dot} />
          ))}
          <span className={styles.pageLabel}>
            {safePage + 1}/{pageCount}
          </span>
        </div>
      ) : null}
    </div>
  );
}
