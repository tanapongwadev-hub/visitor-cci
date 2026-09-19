import "reflect-metadata";
import { DataSource } from "typeorm";
import { types as pgTypes } from "pg";
import { VisitSchedule } from "./entities/VisitSchedule";
import { Setting } from "./entities/Setting";
import { MasterItem } from "./entities/MasterItem";

// ให้คอลัมน์ DATE คืนค่าเป็น string "YYYY-MM-DD" แทน JS Date (กันปัญหา timezone เลื่อนวัน)
pgTypes.setTypeParser(pgTypes.builtins.DATE, (v: string) => v);

const isProd = process.env.NODE_ENV === "production";

export const entities = [VisitSchedule, Setting, MasterItem];

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  // dev: sync schema อัตโนมัติจาก entity — prod: ใช้ migration เท่านั้น
  synchronize: !isProd,
  logging: !isProd ? ["error", "warn"] : false,
  entities,
  migrations: [__dirname + "/migrations/*.{ts,js}"],
});
