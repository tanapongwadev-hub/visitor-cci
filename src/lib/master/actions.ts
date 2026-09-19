"use server";

import { revalidatePath } from "next/cache";
import { ILike } from "typeorm";
import { getDataSource, MasterItem, VisitSchedule } from "@/lib/db";
import { getMasterData } from "./queries";
import { isMasterType, MASTER_LABEL, type MasterData, type MasterType } from "./types";

function clean(s: unknown, max = 255): string {
  return String(s ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

function assertType(type: unknown): asserts type is MasterType {
  if (!isMasterType(type)) throw new Error("ประเภทข้อมูลหลักไม่ถูกต้อง");
}

export async function loadMaster(): Promise<MasterData> {
  return getMasterData();
}

export async function createMaster(type: MasterType, name: string, detail = ""): Promise<MasterData> {
  assertType(type);
  const n = clean(name);
  if (!n) throw new Error("กรุณาระบุชื่อ");

  const ds = await getDataSource();
  const repo = ds.getRepository(MasterItem);
  // กันซ้ำแบบไม่สนตัวพิมพ์
  const dup = await repo.findOneBy({ type, name: ILike(n) });
  if (dup) throw new Error(`${MASTER_LABEL[type]} "${dup.name}" มีอยู่แล้ว`);

  await repo.save(repo.create({ type, name: n, detail: clean(detail) }));
  revalidatePath("/admin");
  return getMasterData();
}

export async function updateMaster(id: string, name: string, detail = ""): Promise<MasterData> {
  const n = clean(name);
  if (!n) throw new Error("กรุณาระบุชื่อ");

  const ds = await getDataSource();
  const repo = ds.getRepository(MasterItem);
  const item = await repo.findOneBy({ id });
  if (!item) throw new Error("ไม่พบรายการ (อาจถูกลบไปแล้ว)");

  const dup = await repo.findOneBy({ type: item.type, name: ILike(n) });
  if (dup && dup.id !== id) throw new Error(`${MASTER_LABEL[item.type as MasterType]} "${dup.name}" มีอยู่แล้ว`);

  item.name = n;
  item.detail = clean(detail);
  await repo.save(item);
  revalidatePath("/admin");
  return getMasterData();
}

export async function deleteMaster(id: string): Promise<MasterData> {
  const ds = await getDataSource();
  await ds.getRepository(MasterItem).delete({ id });
  revalidatePath("/admin");
  return getMasterData();
}

/**
 * นำเข้าค่าที่ใช้อยู่แล้วในตารางนัดทั้งหมด (ห้อง / บริษัท / ผู้รับแขก+ฝ่าย / ฝ่าย)
 * เข้าข้อมูลหลัก — ข้ามค่าที่มีอยู่แล้ว
 */
export async function importMasterFromSchedules(): Promise<{ data: MasterData; added: number }> {
  const ds = await getDataSource();
  const rows = await ds.getRepository(VisitSchedule).find();
  const repo = ds.getRepository(MasterItem);
  const existing = await repo.find();
  const seen = new Set(existing.map((e) => `${e.type}|${e.name.toLowerCase()}`));

  const toAdd: Partial<MasterItem>[] = [];
  const push = (type: MasterType, name: string, detail = "") => {
    const n = clean(name);
    if (!n) return;
    const key = `${type}|${n.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    toAdd.push({ type, name: n, detail: clean(detail) });
  };
  for (const r of rows) {
    push("room", r.room);
    push("company", r.company);
    push("host", r.hostName, r.hostDept);
    push("department", r.hostDept);
  }
  if (toAdd.length) await repo.save(toAdd.map((t) => repo.create(t)));
  revalidatePath("/admin");
  return { data: await getMasterData(), added: toAdd.length };
}
