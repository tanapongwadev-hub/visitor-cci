import type { Metadata, Viewport } from "next";
import TvSchedule from "@/components/schedule/TvSchedule";
import { isValidDate, todayBangkok } from "@/components/schedule/types";
import { getPosterSettings, getScheduleForDate } from "@/lib/schedule/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visitor Schedule (TV)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

type Props = { searchParams: Promise<{ date?: string }> };

/**
 * หน้าสำหรับจอ TV แนวตั้ง — เปิดแบบเต็มจอ (F11 / kiosk mode)
 * ไม่ใส่ ?date= จะใช้วันนี้ (เวลาไทย) และเปลี่ยนวันเองหลังเที่ยงคืนเมื่อ refresh
 */
export default async function TvPage({ searchParams }: Props) {
  const { date: qDate } = await searchParams;
  const date = isValidDate(qDate) ? qDate : todayBangkok();

  const [data, settings] = await Promise.all([getScheduleForDate(date), getPosterSettings()]);

  return <TvSchedule data={data} settings={settings} />;
}
