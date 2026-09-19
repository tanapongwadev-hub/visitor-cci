import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeORM ใช้ dynamic require + decorators — ต้องให้ Node โหลดโดยตรง ไม่ผ่าน bundler
  serverExternalPackages: ["typeorm", "pg", "reflect-metadata"],
};

export default nextConfig;
