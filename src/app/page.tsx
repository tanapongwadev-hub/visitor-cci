import Link from "next/link";
import { todayBangkok } from "@/components/schedule/types";

export default function Home() {
  const today = todayBangkok();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8 font-sans">
      <div>
        <h1 className="text-3xl font-bold">Visitor CCI</h1>
        <p className="mt-1 text-zinc-500">ระบบตารางผู้มาติดต่อ — Chiewchan Industry</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/schedule?date=${today}`}
          className="rounded-xl border border-zinc-200 p-5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <div className="text-lg font-semibold">หน้าแสดงผล</div>
          <div className="mt-1 text-sm text-zinc-500">โปสเตอร์ตารางนัดของวันนี้ ({today})</div>
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-zinc-200 p-5 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <div className="text-lg font-semibold">Admin</div>
          <div className="mt-1 text-sm text-zinc-500">จัดการรายการ ดูตัวอย่าง และตั้งค่าโปสเตอร์</div>
        </Link>
      </div>
    </main>
  );
}
