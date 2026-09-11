"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import PageHeader from "@/components/PageHeader";
import type { BodyPartWithExercises, BodyPartStat, ExerciseTrendPoint } from "@/lib/types";

const PERIODS = [
  { key: "1w", label: "1週間", days: 7 },
  { key: "1m", label: "1ヶ月", days: 30 },
  { key: "3m", label: "3ヶ月", days: 90 },
  { key: "all", label: "全期間", days: null },
] as const;

function formatShortDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function StatsClient({
  bodyParts,
  hasAnyExercise,
}: {
  bodyParts: BodyPartWithExercises[];
  hasAnyExercise: boolean;
}) {
  const [periodKey, setPeriodKey] = useState<(typeof PERIODS)[number]["key"]>("1m");
  const allExercises = useMemo(() => bodyParts.flatMap((bp) => bp.exercises), [bodyParts]);
  const [exerciseId, setExerciseId] = useState<string>(allExercises[0]?.id ?? "");

  const [bodyPartStats, setBodyPartStats] = useState<BodyPartStat[]>([]);
  const [trend, setTrend] = useState<ExerciseTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const period = PERIODS.find((p) => p.key === periodKey)!;
  const { from, to } = useMemo(() => {
    const to = new Date();
    const from = period.days ? new Date(Date.now() - period.days * 86400000) : null;
    return {
      from: from ? from.toISOString().slice(0, 10) : undefined,
      to: to.toISOString().slice(0, 10),
    };
  }, [period]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", `${from}T00:00:00`);
    params.set("to", `${to}T23:59:59`);

    Promise.all([
      fetch(`/api/stats/body-parts?${params.toString()}`).then((r) => r.json()),
      exerciseId
        ? fetch(
            `/api/stats/exercise?exerciseId=${exerciseId}&${params.toString()}`
          ).then((r) => r.json())
        : Promise.resolve([]),
    ])
      .then(([bp, ex]) => {
        setBodyPartStats(bp);
        setTrend(ex);
      })
      .finally(() => setLoading(false));
  }, [from, to, exerciseId]);

  if (!hasAnyExercise) {
    return (
      <div className="max-w-md mx-auto">
        <PageHeader title="グラフ" subtitle="記録を可視化しよう" emoji="📈" />
        <p className="mx-5 rounded-2xl bg-white/60 border-2 border-dashed border-[var(--foreground)]/10 px-4 py-10 text-center text-sm font-bold text-[var(--foreground)]/40">
          まず「メニュー」タブからトレーニングメニューを追加してください
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="グラフ" subtitle="記録を可視化しよう" emoji="📈" />

      <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriodKey(p.key)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
              periodKey === p.key
                ? "bg-[var(--color-secondary)] text-white shadow-md"
                : "bg-white text-[var(--foreground)]/60 border border-[var(--foreground)]/10"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Body part volume */}
      <section className="mt-5 mx-5 rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-extrabold mb-3">部位別トレーニングボリューム</h2>
        {bodyPartStats.length === 0 ? (
          <p className="text-sm font-bold text-[var(--foreground)]/40 py-6 text-center">
            この期間の記録がありません
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bodyPartStats} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(value) => [`${Math.round(Number(value)).toLocaleString()} kg`, "総ボリューム"]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Bar dataKey="totalVolume" radius={[10, 10, 0, 0]}>
                {bodyPartStats.map((entry) => (
                  <Cell key={entry.bodyPartId} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Exercise trend */}
      <section className="mt-4 mx-5 mb-8 rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-extrabold shrink-0">種目別 重量の推移</h2>
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="min-w-0 flex-1 rounded-xl bg-[var(--background)] px-2 py-1.5 text-sm font-bold outline-none"
          >
            {bodyParts.map((bp) => (
              <optgroup key={bp.id} label={bp.name}>
                {bp.exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {trend.length === 0 ? (
          <p className="text-sm font-bold text-[var(--foreground)]/40 py-6 text-center">
            {loading ? "読み込み中..." : "この期間の記録がありません"}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} unit="kg" />
              <Tooltip
                labelFormatter={(label) => formatShortDate(String(label))}
                formatter={(value) => [`${value} kg`, "最大重量"]}
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
              />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  );
}
