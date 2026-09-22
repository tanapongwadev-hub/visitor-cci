"use client";

import { useEffect, useRef } from "react";
import type { PosterSettings } from "./types";

export const SETTINGS_POLL_MS = 3000;

/**
 * poll /api/settings เป็นระยะ แล้วเรียก onChange เมื่อค่าในฐานข้อมูลต่างจาก current
 * — ให้หน้าแสดงผล/preview บนเครื่องอื่น (เช่น เปิดผ่าน ngrok) ตามการเลื่อนสเกลใน admin ได้โดยไม่ต้อง reload
 */
export function useLiveSettings(
  current: PosterSettings,
  onChange: (next: PosterSettings) => void,
  enabled = true,
  intervalMs = SETTINGS_POLL_MS,
) {
  // เก็บค่าล่าสุดใน ref เพื่อไม่ต้องสร้าง interval ใหม่ทุกครั้งที่ current/onChange เปลี่ยน
  const currentRef = useRef("");
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    currentRef.current = JSON.stringify(current);
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const tick = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/settings", {
          cache: "no-store",
          // ข้ามหน้าเตือนของ ngrok free tier ที่จะตอบ HTML แทน JSON
          headers: { "ngrok-skip-browser-warning": "1" },
        });
        if (!res.ok || stopped) return;
        const next = (await res.json()) as PosterSettings;
        if (!stopped && JSON.stringify(next) !== currentRef.current) onChangeRef.current(next);
      } catch {
        // เครือข่ายหลุดชั่วคราว — รอรอบถัดไป
      }
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, intervalMs]);
}
