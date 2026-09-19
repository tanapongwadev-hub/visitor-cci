import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeORM ใช้ dynamic require + decorators — ต้องให้ Node โหลดโดยตรง ไม่ผ่าน bundler
  serverExternalPackages: ["typeorm", "pg", "reflect-metadata"],

  // เปิดให้ ngrok tunnel เรียก dev server ได้ (มีผลแค่ตอน next dev)
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.dev",
    "*.ngrok.io",
  ],
};

export default nextConfig;
