import type { DataSource } from "typeorm";
import { AppDataSource, entities } from "./data-source";

// Next.js hot-reload จะ re-evaluate module — เก็บ DataSource ไว้บน globalThis
// เพื่อไม่ให้เปิด connection pool ซ้ำทุกครั้งที่แก้โค้ด
const globalForDb = globalThis as unknown as {
  __dataSource?: DataSource;
  __dataSourceInit?: Promise<DataSource>;
};

// หลัง HMR class ของ entity จะเป็นคนละ reference กับที่ DataSource เดิมรู้จัก
// (EntityMetadataNotFoundError) — ถ้าเจอกรณีนี้ให้ปิด connection เดิมแล้วเปิดใหม่
function isStale(ds: DataSource): boolean {
  return entities.some((e) => !ds.hasMetadata(e));
}

export async function getDataSource(): Promise<DataSource> {
  const ds = await getOrInit();
  if (!isStale(ds)) return ds;
  // connection ที่กำลังเปิดอยู่ตอน HMR ถูกสร้างด้วย class ชุดเก่า — ตรวจซ้ำหลังเปิดเสร็จ แล้วเปิดใหม่อีกครั้ง
  return getOrInit();
}

async function getOrInit(): Promise<DataSource> {
  const cached = globalForDb.__dataSource;
  if (cached?.isInitialized) {
    if (!isStale(cached)) return cached;
    globalForDb.__dataSource = undefined;
    globalForDb.__dataSourceInit = undefined;
    await cached.destroy().catch(() => {});
  }

  if (!globalForDb.__dataSourceInit) {
    globalForDb.__dataSourceInit = AppDataSource.initialize()
      .then((ds) => {
        globalForDb.__dataSource = ds;
        return ds;
      })
      .catch((err) => {
        // ล้าง cache เมื่อ connect ไม่สำเร็จ เพื่อให้ request ถัดไปลองใหม่ได้
        globalForDb.__dataSourceInit = undefined;
        throw err;
      });
  }
  return globalForDb.__dataSourceInit;
}

export { VisitSchedule } from "./entities/VisitSchedule";
export { Setting } from "./entities/Setting";
export { MasterItem } from "./entities/MasterItem";
