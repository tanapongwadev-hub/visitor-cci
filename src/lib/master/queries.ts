import { getDataSource, MasterItem } from "@/lib/db";
import { EMPTY_MASTER, isMasterType, type MasterData } from "./types";

/** ข้อมูลหลักทั้งหมด แยกตาม type เรียงตามชื่อ */
export async function getMasterData(): Promise<MasterData> {
  const ds = await getDataSource();
  const items = await ds.getRepository(MasterItem).find({ order: { name: "ASC" } });
  const data: MasterData = { room: [], company: [], host: [], department: [] };
  for (const it of items) {
    if (!isMasterType(it.type)) continue;
    data[it.type].push({ id: it.id, type: it.type, name: it.name, detail: it.detail });
  }
  // ให้เรียงแบบไม่สนตัวพิมพ์/ภาษาไทย
  const collator = new Intl.Collator("th");
  for (const k of Object.keys(data) as (keyof MasterData)[]) {
    data[k].sort((a, b) => collator.compare(a.name, b.name));
  }
  return data ?? EMPTY_MASTER;
}
