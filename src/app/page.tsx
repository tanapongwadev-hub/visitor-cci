import { getDataSource, Visitor } from "@/lib/db";
import { addVisitor } from "./actions";

export const dynamic = "force-dynamic";

async function getVisitors() {
  try {
    const ds = await getDataSource();
    const visitors = await ds
      .getRepository(Visitor)
      .find({ order: { createdAt: "DESC" }, take: 50 });
    return { visitors, error: null as string | null };
  } catch (err) {
    return { visitors: [] as Visitor[], error: (err as Error).message };
  }
}

export default async function Home() {
  const { visitors, error } = await getVisitors();

  return (
    <main className="mx-auto max-w-3xl p-8 font-sans">
      <h1 className="mb-6 text-3xl font-bold">Visitor CCI</h1>

      {error ? (
        <div className="mb-6 rounded border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">เชื่อมต่อฐานข้อมูลไม่ได้</p>
          <p className="mt-1 text-sm">{error}</p>
          <p className="mt-2 text-sm">
            ตรวจสอบ <code>DATABASE_URL</code> ใน <code>.env</code> หรือรัน{" "}
            <code>docker compose up -d</code>
          </p>
        </div>
      ) : null}

      <form
        action={addVisitor}
        className="mb-8 grid gap-3 rounded border border-zinc-200 p-4 dark:border-zinc-700"
      >
        <h2 className="text-lg font-semibold">ลงทะเบียนผู้มาติดต่อ</h2>
        <input
          name="name"
          required
          placeholder="ชื่อ-นามสกุล *"
          className="rounded border px-3 py-2"
        />
        <input name="email" type="email" placeholder="อีเมล" className="rounded border px-3 py-2" />
        <input name="company" placeholder="บริษัท" className="rounded border px-3 py-2" />
        <textarea name="purpose" placeholder="วัตถุประสงค์" className="rounded border px-3 py-2" />
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
        >
          บันทึก
        </button>
      </form>

      <h2 className="mb-3 text-lg font-semibold">รายชื่อล่าสุด ({visitors.length})</h2>
      {visitors.length === 0 ? (
        <p className="text-zinc-500">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {visitors.map((v) => (
            <li key={v.id} className="py-3">
              <div className="font-medium">{v.name}</div>
              <div className="text-sm text-zinc-500">
                {[v.company, v.email].filter(Boolean).join(" · ")}
              </div>
              {v.purpose ? <div className="mt-1 text-sm">{v.purpose}</div> : null}
              <div className="mt-1 text-xs text-zinc-400">
                {new Date(v.createdAt).toLocaleString("th-TH")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
