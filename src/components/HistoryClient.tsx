"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BodyPartBadge from "@/components/BodyPartBadge";
import type { WorkoutLogDto } from "@/lib/types";

type Day = { date: string; logs: WorkoutLogDto[]; totalVolume: number };

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekday})`;
}

export default function HistoryClient({ days }: { days: Day[] }) {
  const router = useRouter();
  const [openDate, setOpenDate] = useState<string | null>(days[0]?.date ?? null);

  async function handleDelete(id: string) {
    if (!confirm("この記録を削除しますか?")) return;
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="トレーニング履歴" subtitle="過去の記録をふりかえろう" emoji="📅" />

      {days.length === 0 ? (
        <p className="mx-5 rounded-2xl bg-white/60 border-2 border-dashed border-[var(--foreground)]/10 px-4 py-10 text-center text-sm font-bold text-[var(--foreground)]/40">
          まだ記録がありません
        </p>
      ) : (
        <ul className="px-5 space-y-3 pb-6">
          {days.map((day) => {
            const isOpen = openDate === day.date;
            const bodyPartNames = Array.from(
              new Map(day.logs.map((l) => [l.exercise.bodyPart.id, l.exercise.bodyPart])).values()
            );
            return (
              <li key={day.date} className="rounded-3xl bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenDate(isOpen ? null : day.date)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="text-left">
                    <p className="font-extrabold">{formatDate(day.date)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {bodyPartNames.map((bp) => (
                        <BodyPartBadge key={bp.id} name={bp.name} color={bp.color} size="sm" />
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[var(--foreground)]/40">総ボリューム</p>
                    <p className="font-extrabold text-[var(--color-primary)]">
                      {Math.round(day.totalVolume).toLocaleString()}kg
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {day.logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 rounded-2xl bg-[var(--background)] px-3 py-2 border-l-4"
                        style={{ borderColor: log.exercise.bodyPart.color }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold truncate text-sm">{log.exercise.name}</p>
                          <p className="text-xs font-bold text-[var(--foreground)]/60">
                            {log.weight}kg × {log.reps}回 × {log.sets}set
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="h-7 w-7 rounded-full bg-red-50 text-xs active:scale-90 transition-transform"
                          aria-label="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                    <Link
                      href={`/?date=${day.date}`}
                      className="block text-center text-xs font-bold text-[var(--color-secondary)] pt-1"
                    >
                      この日を編集する →
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
