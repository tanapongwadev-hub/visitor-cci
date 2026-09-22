import { NextResponse } from "next/server";
import { getPosterSettings } from "@/lib/schedule/queries";

export const dynamic = "force-dynamic";

/** ค่าตั้งค่าโปสเตอร์ล่าสุด — ให้หน้าแสดงผล/preview บนเครื่องอื่น poll เพื่อตามการเปลี่ยนแปลงได้ทันที */
export async function GET() {
  const settings = await getPosterSettings();
  return NextResponse.json(settings, { headers: { "Cache-Control": "no-store" } });
}
