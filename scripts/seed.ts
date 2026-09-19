/**
 * ใส่ข้อมูลตัวอย่าง (ตารางของ 17 SEPTEMBER 2026 จากไฟล์โปสเตอร์เดิม)
 *   npm run db:seed              -> วันที่ 2026-09-17
 *   npm run db:seed -- 2026-10-01 -> วันที่ที่กำหนด
 */
import "reflect-metadata";
import { AppDataSource } from "../src/lib/db/data-source";
import { VisitSchedule } from "../src/lib/db/entities/VisitSchedule";

const date = process.argv[2] ?? "2026-09-17";

const rows = [
  { time: "08:30", company: "กิจกรรม DEB", visitorNames: "", room: "ROOM 3" },
  { time: "09:00", company: "TYM", visitorNames: "MR. HATTORI, MR. SHUICHI\nMR. WEERANAH", room: "ROOM 2" },
  { time: "09:00", company: "R&D", visitorNames: "MR. RAPEEPAT", room: "ROOM 6" },
  { time: "09:00", company: "TH", visitorNames: "MR. PRAMOTE\nMR. TONGCHAI", room: "ROOM 5" },
  { time: "10:00", company: "MARIN", visitorNames: "MR. KRIT, MR. SUPASAN", room: "ROOM 7" },
  { time: "10:30", company: "GCC", visitorNames: "MR. NISHIMURA", room: "ROOM 1" },
  { time: "10:30", company: "SGM", visitorNames: "MR. KATSUKI\nMR. NAKAMURA\nMR. MITSUORA", room: "ROOM 1" },
];

async function main() {
  const ds = await AppDataSource.initialize();
  const repo = ds.getRepository(VisitSchedule);
  const existing = await repo.countBy({ date });
  if (existing > 0) {
    console.log(`วันที่ ${date} มีข้อมูลอยู่แล้ว ${existing} รายการ — ข้าม`);
  } else {
    await repo.save(rows.map((r, i) => repo.create({ ...r, date, sortOrder: i })));
    console.log(`ใส่ข้อมูลตัวอย่าง ${rows.length} รายการสำหรับวันที่ ${date} แล้ว`);
  }
  await ds.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
