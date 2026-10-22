import { NextResponse } from "next/server";
import { getPosterSettings } from "@/lib/schedule/queries";
import { todayBangkok } from "@/components/schedule/types";

export const dynamic = "force-dynamic";

/**
 * ค่าตั้งค่าโปสเตอร์ล่าสุด — ให้หน้าแสดงผล/preview บนเครื่องอื่น poll เพื่อตามการเปลี่ยนแปลงได้ทันที
 * ส่ง `today` ที่คำนวณจากนาฬิกา server ไปด้วย เพื่อให้จอ TV ใช้วันที่ของ server
 * ตรวจการข้ามวัน ไม่ใช่นาฬิกาของเครื่อง TV เอง (ซึ่งอาจตั้งผิด)
 */
export async function GET() {
  const settings = await getPosterSettings();
  return NextResponse.json(
    { ...settings, today: todayBangkok() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
