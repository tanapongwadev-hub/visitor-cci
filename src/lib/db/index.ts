import type { DataSource } from "typeorm";
import { AppDataSource } from "./data-source";

// Next.js hot-reload จะ re-evaluate module — เก็บ DataSource ไว้บน globalThis
// เพื่อไม่ให้เปิด connection pool ซ้ำทุกครั้งที่แก้โค้ด
const globalForDb = globalThis as unknown as {
  __dataSource?: DataSource;
  __dataSourceInit?: Promise<DataSource>;
};

export async function getDataSource(): Promise<DataSource> {
  if (globalForDb.__dataSource?.isInitialized) {
    return globalForDb.__dataSource;
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

export { Visitor } from "./entities/Visitor";
