"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** ย่อได้ต่ำสุดกี่เท่าของขนาดเดิม (0.55 = 55%) */
  minScale?: number;
  /** ยอมตัดบรรทัดได้สูงสุดกี่บรรทัด (ที่ขนาดเดิม) ก่อนจะเริ่มย่อ font-size — 1 = ห้ามตัดบรรทัด */
  maxLines?: number;
  /** ค่าที่เปลี่ยนแล้วต้องวัดใหม่ (เช่น ตัวคูณขนาด/น้ำหนักตัวอักษร) — inline font-size ที่ย่อไว้จะไม่ตามค่า CSS ใหม่เอง */
  fitKey?: string | number;
};

/**
 * ข้อความที่ปรับตัวให้พอดีความกว้างของช่อง ตามลำดับ:
 * 1. บรรทัดเดียวที่ขนาดเดิม
 * 2. ตัดบรรทัดที่ขนาดเดิม (ไม่เกิน maxLines) — เพื่อให้ตัวคูณขนาดที่ตั้งไว้มีผลจริงแม้คอลัมน์แคบ
 * 3. ย่อ font-size ลงทีละขั้นจนพอดี (บรรทัดเดียว) — ถ้าถึง minScale แล้วยังไม่พอ จะตัดด้วย … แทน
 */
export default function FitText({ children, className = "", minScale = 0.55, maxLines = 2, fitKey }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const fit = () => {
      // เริ่มจากขนาดเดิม บรรทัดเดียว ทุกครั้ง
      el.style.fontSize = "";
      el.style.whiteSpace = "nowrap";
      const base = parseFloat(getComputedStyle(el).fontSize);
      if (!base) return;
      // ใช้ clientWidth/scrollWidth/offsetHeight (หน่วย layout) — ไม่โดน transform: scale ของ preview/TV รบกวน
      const overflows = () => el.scrollWidth > el.clientWidth + 1;
      if (!overflows()) return;

      let scale = 1;
      const shrink = () => {
        scale = Math.max(minScale, scale - 0.05);
        el.style.fontSize = `${base * scale}px`;
      };

      if (maxLines > 1) {
        const lineHeight = el.offsetHeight; // ความสูงบรรทัดเดียวที่ขนาดเดิม (สัดส่วนคงที่เมื่อย่อ)
        el.style.whiteSpace = "normal";
        // ตัดบรรทัดได้ไม่เกิน maxLines และไม่มีคำเดียวที่กว้างเกินช่อง — ถ้ายังไม่ได้ ค่อยๆ ย่อลงขณะยังตัดบรรทัดอยู่
        const fitsWrapped = () =>
          !overflows() && (lineHeight ? Math.round(el.offsetHeight / (lineHeight * scale)) <= maxLines : false);
        while (!fitsWrapped() && scale > minScale) shrink();
        if (fitsWrapped()) return;
        // ถึงขั้นต่ำแล้วยังไม่พอ — กลับไปบรรทัดเดียวแล้วตัดด้วย … (ด้านล่าง)
        scale = 1;
        el.style.fontSize = "";
        el.style.whiteSpace = "nowrap";
      }

      // ลดทีละขั้นจนกว่าจะพอดีกับพื้นที่ที่ตัวเองได้ (clientWidth) — ใช้ได้ทั้งใน block และ flex
      while (overflows() && scale > minScale) shrink();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children, minScale, maxLines, fitKey]);

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
