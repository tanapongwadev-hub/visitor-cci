"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** ย่อได้ต่ำสุดกี่เท่าของขนาดเดิม (0.55 = 55%) */
  minScale?: number;
};

/**
 * ข้อความบรรทัดเดียวที่ย่อ font-size ลงอัตโนมัติจนพอดีความกว้างของช่อง
 * (ไม่ตกบรรทัด ไม่ตัดคำ) — ถ้าเล็กจนถึง minScale แล้วยังไม่พอ จะตัดด้วย … แทน
 */
export default function FitText({ children, className = "", minScale = 0.55 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const fit = () => {
      el.style.fontSize = ""; // เริ่มจากขนาดเดิมทุกครั้ง
      const base = parseFloat(getComputedStyle(el).fontSize);
      if (!base) return;
      let scale = 1;
      // ลดทีละขั้นจนกว่าจะพอดีกับพื้นที่ที่ตัวเองได้ (clientWidth) — ใช้ได้ทั้งใน block และ flex
      while (el.scrollWidth > el.clientWidth + 1 && scale > minScale) {
        scale = Math.max(minScale, scale - 0.05);
        el.style.fontSize = `${base * scale}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children, minScale]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}
    >
      {children}
    </span>
  );
}
