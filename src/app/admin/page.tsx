import type { Metadata } from "next";
import AdminPanel from "./AdminPanel";
import { isValidDate, todayBangkok } from "@/components/schedule/types";
import { getDatesWithData, getPosterSettings, getScheduleForDate } from "@/lib/schedule/queries";
import { getMasterData } from "@/lib/master/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin - Visitor Schedule",
};

type Props = { searchParams: Promise<{ date?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { date: qDate } = await searchParams;
  const date = isValidDate(qDate) ? qDate : todayBangkok();

  const [schedule, settings, dates, master] = await Promise.all([
    getScheduleForDate(date),
    getPosterSettings(),
    getDatesWithData(),
    getMasterData(),
  ]);

  return (
    <AdminPanel
      initialSchedule={schedule}
      initialSettings={settings}
      initialDates={dates}
      initialMaster={master}
      today={todayBangkok()}
    />
  );
}
