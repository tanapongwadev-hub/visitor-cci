"use server";

import { revalidatePath } from "next/cache";
import { getDataSource, Visitor } from "@/lib/db";

export async function addVisitor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const ds = await getDataSource();
  const repo = ds.getRepository(Visitor);
  await repo.save(
    repo.create({
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
      purpose: String(formData.get("purpose") ?? "").trim() || null,
    }),
  );
  revalidatePath("/");
}
