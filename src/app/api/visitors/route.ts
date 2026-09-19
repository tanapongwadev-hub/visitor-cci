import { NextResponse } from "next/server";
import { getDataSource, Visitor } from "@/lib/db";

export async function GET() {
  const ds = await getDataSource();
  const visitors = await ds
    .getRepository(Visitor)
    .find({ order: { createdAt: "DESC" }, take: 100 });
  return NextResponse.json(visitors);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const ds = await getDataSource();
  const repo = ds.getRepository(Visitor);
  const visitor = repo.create({
    name: body.name,
    email: body.email ?? null,
    company: body.company ?? null,
    purpose: body.purpose ?? null,
  });
  await repo.save(visitor);
  return NextResponse.json(visitor, { status: 201 });
}
