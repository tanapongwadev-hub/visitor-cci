"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * ย่อเนื้อหาความกว้างคงที่ (default 1024px = โปสเตอร์) ให้พอดีกับความกว้างของ container
 * โดยใช้ transform: scale — เนื้อหาข้างในยังเรนเดอร์ที่ขนาดจริง
 */
export default function ScaledPreview({ children, width = 1024 }: { children: ReactNode; width?: number }) {
  const POSTER_WIDTH = width;
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      setScale(Math.min(1, outer.clientWidth / POSTER_WIDTH));
      setInnerHeight(inner.offsetHeight);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [POSTER_WIDTH]);

  return (
    <div ref={outerRef} className="w-full overflow-hidden">
      <div style={{ height: innerHeight * scale }}>
        <div
          ref={innerRef}
          style={{ width: POSTER_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
