import "reflect-metadata";
import { DataSource } from "typeorm";
import { Visitor } from "./entities/Visitor";

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  // dev: sync schema อัตโนมัติจาก entity — prod: ใช้ migration เท่านั้น
  synchronize: !isProd,
  logging: !isProd ? ["error", "warn"] : false,
  entities: [Visitor],
  migrations: [__dirname + "/migrations/*.{ts,js}"],
});
