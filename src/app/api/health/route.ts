import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/db";

export async function GET() {
  try {
    const ds = await getDataSource();
    const [{ now }] = await ds.query("SELECT NOW() AS now");
    return NextResponse.json({ status: "ok", db: "connected", now });
  } catch (err) {
    return NextResponse.json(
      { status: "error", db: "disconnected", message: (err as Error).message },
      { status: 503 },
    );
  }
}
