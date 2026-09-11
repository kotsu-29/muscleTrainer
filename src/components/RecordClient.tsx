"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import BodyPartBadge from "@/components/BodyPartBadge";
import PageHeader from "@/components/PageHeader";
import type { BodyPartWithExercises, WorkoutLogDto } from "@/lib/types";

const WEIGHT_STEP = 2.5;

function NumberStepper({
  label,
  unit,
  value,
  step,
  min,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  step: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white border-2 border-[var(--foreground)]/5 p-2 shadow-sm flex flex-col items-center gap-1">
      <p className="text-[10px] font-bold text-[var(--foreground)]/50 truncate">{label}</p>
      <button
        type="button"
        onClick={() => onChange(Number((value + step).toFixed(2)))}
        className="h-6 w-6 shrink-0 rounded-full bg-[var(--foreground)]/5 font-bold text-sm leading-none active:scale-90 transition-transform"
      >
        +
      </button>
      <div className="flex items-baseline justify-center gap-0.5 w-full overflow-hidden">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full min-w-0 text-center text-lg font-extrabold outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <span className="text-[9px] font-bold text-[var(--foreground)]/50 -mt-1">{unit}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
        className="h-6 w-6 shrink-0 rounded-full bg-[var(--foreground)]/5 font-bold text-sm leading-none active:scale-90 transition-transform"
      >
        −
      </button>
    </div>
  );
}

export default function RecordClient({
  bodyParts,
  initialLogs,
  today,
  initialDate,
}: {
  bodyParts: BodyPartWithExercises[];
  initialLogs: WorkoutLogDto[];
  today: string;
  initialDate?: string;
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate ?? today);
  const [selectedBodyPartId, setSelectedBodyPartId] = useState(bodyParts[0]?.id ?? "");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState(20);
  const [reps, setReps] = useState(10);
  const [sets, setSets] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState(initialLogs);

  const selectedBodyPart = bodyParts.find((bp) => bp.id === selectedBodyPartId);
  const selectedExercise = useMemo(
    () => bodyParts.flatMap((bp) => bp.exercises).find((e) => e.id === selectedExerciseId),
    [bodyParts, selectedExerciseId]
  );

  const isToday = date === today;

  async function refreshLogsForDate(d: string) {
    const res = await fetch(`/api/logs?from=${d}T00:00:00&to=${d}T23:59:59`);
    const data = await res.json();
    setLogs(data);
  }

  function selectDate(next: string) {
    setDate(next);
    if (next === (initialDate ?? today)) {
      setLogs(initialLogs);
    } else {
      refreshLogsForDate(next);
    }
  }

  function resetForm() {
    setEditingId(null);
    setSelectedExerciseId(null);
    setWeight(20);
    setReps(10);
    setSets(3);
  }

  function selectExercise(exerciseId: string) {
    setSelectedExerciseId(exerciseId);
    const owner = bodyParts.find((bp) => bp.exercises.some((e) => e.id === exerciseId));
    if (owner) setSelectedBodyPartId(owner.id);
    if (editingId) return;
    // 同じ種目の記録が既にあれば、直前のセットの重量・回数を引き継いで
    // 「もう1セット」を素早く記録できるようにする(重量を変えて追加する場合を想定)
    const lastForExercise = logs.find((l) => l.exerciseId === exerciseId);
    if (lastForExercise) {
      setWeight(lastForExercise.weight);
      setReps(lastForExercise.reps);
      setSets(1);
    }
  }

  async function handleSubmit() {
    if (!selectedExerciseId) {
      setError("トレーニングメニューを選択してください");
      return;
    }
    setError(null);
    setSubmitting(true);
    const wasEditing = editingId !== null;
    try {
      const payload = {
        date: `${date}T12:00:00`,
        exerciseId: selectedExerciseId,
        weight,
        reps,
        sets,
      };
      const res = wasEditing
        ? await fetch(`/api/logs/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/logs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "保存に失敗しました");
      }

      if (wasEditing) {
        resetForm();
      } else {
        // 種目は選択したままにして、続けて次のセットを記録しやすくする
        setSets(1);
      }
      await refreshLogsForDate(date);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(log: WorkoutLogDto) {
    setEditingId(log.id);
    setSelectedBodyPartId(log.exercise.bodyPartId);
    setSelectedExerciseId(log.exerciseId);
    setWeight(log.weight);
    setReps(log.reps);
    setSets(log.sets);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("この記録を削除しますか?")) return;
    await fetch(`/api/logs/${id}`, { method: "DELETE" });
    if (editingId === id) resetForm();
    await refreshLogsForDate(date);
    router.refresh();
  }

  const totalVolumeToday = logs.reduce((sum, l) => sum + l.weight * l.reps * l.sets, 0);
  const setsLoggedForSelected = selectedExerciseId
    ? logs
        .filter((l) => l.exerciseId === selectedExerciseId)
        .reduce((sum, l) => sum + l.sets, 0)
    : 0;

  const groupedLogs = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, WorkoutLogDto[]>();
    for (const log of logs) {
      const arr = map.get(log.exerciseId);
      if (arr) {
        arr.push(log);
      } else {
        map.set(log.exerciseId, [log]);
        order.push(log.exerciseId);
      }
    }
    return order.map((exerciseId) => {
      const items = map.get(exerciseId)!;
      return {
        exerciseId,
        exercise: items[0].exercise,
        volume: items.reduce((s, l) => s + l.weight * l.reps * l.sets, 0),
        // logs は新しい順に並んでいるため、セット番号表示用に古い順へ反転する
        items: [...items].reverse(),
      };
    });
  }, [logs]);

  return (
    <div className="max-w-md mx-auto">
      <PageHeader
        title={isToday ? "今日のトレーニング" : "トレーニング記録"}
        subtitle="種目を選んで、重量・回数・セット数を記録しよう"
        emoji="💪"
      />

      <div className="px-5">
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => selectDate(e.target.value)}
          className="w-full rounded-2xl bg-white border-2 border-[var(--foreground)]/5 px-4 py-2.5 font-bold text-sm shadow-sm"
        />
      </div>

      {/* Body part tabs */}
      <div className="mt-4 px-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {bodyParts.map((bp) => (
          <button
            key={bp.id}
            onClick={() => setSelectedBodyPartId(bp.id)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
              selectedBodyPartId === bp.id
                ? "text-white scale-105 shadow-md"
                : "bg-white text-[var(--foreground)]/60 border border-[var(--foreground)]/10"
            )}
            style={selectedBodyPartId === bp.id ? { backgroundColor: bp.color } : undefined}
          >
            {bp.name}
          </button>
        ))}
      </div>

      {/* Exercise chips */}
      <div className="mt-3 px-5 flex flex-wrap gap-2">
        {selectedBodyPart?.exercises.length ? (
          selectedBodyPart.exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => selectExercise(ex.id)}
              className={clsx(
                "rounded-xl px-3 py-2 text-sm font-bold border-2 transition-all",
                selectedExerciseId === ex.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "border-transparent bg-white text-[var(--foreground)]/70 shadow-sm"
              )}
            >
              {ex.name}
            </button>
          ))
        ) : (
          <p className="text-sm text-[var(--foreground)]/50 px-1">
            このタグのメニューがまだありません。「メニュー」タブから追加できます。
          </p>
        )}
      </div>

      {/* Input form */}
      <div className="mt-4 mx-5 rounded-3xl bg-gradient-to-br from-white to-[var(--color-primary)]/5 border-2 border-[var(--foreground)]/5 p-4 shadow-md">
        {selectedExercise ? (
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="font-extrabold text-[var(--foreground)]">
              {selectedExercise.name} を記録
            </p>
            {!editingId && (
              <button
                onClick={resetForm}
                className="text-xs font-bold text-[var(--foreground)]/40 shrink-0"
              >
                選択を解除
              </button>
            )}
          </div>
        ) : (
          <p className="mb-3 font-bold text-[var(--foreground)]/40 text-sm">
            上のメニューから種目を選んでください
          </p>
        )}
        {selectedExercise && setsLoggedForSelected > 0 && !editingId && (
          <p className="mb-3 text-xs font-bold text-[var(--color-secondary)]">
            この種目は{setsLoggedForSelected}セット記録済み。重量を変えて次のセットを記録できます 💪
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          <NumberStepper label="重量" unit="kg" value={weight} step={WEIGHT_STEP} min={0} onChange={setWeight} />
          <NumberStepper label="回数" unit="回" value={reps} step={1} min={1} onChange={setReps} />
          <NumberStepper label="セット" unit="set" value={sets} step={1} min={1} onChange={setSets} />
        </div>

        {error && <p className="mt-3 text-sm font-bold text-red-500">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedExerciseId}
            className="flex-1 rounded-2xl bg-[var(--color-primary)] py-3 font-extrabold text-white shadow-lg shadow-[var(--color-primary)]/30 active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
          >
            {editingId ? "更新する" : "記録する"}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-2xl bg-[var(--foreground)]/5 px-4 font-bold text-[var(--foreground)]/60"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>

      {/* Today's logs */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-extrabold text-[var(--foreground)]">
            {isToday ? "今日の記録" : `${date} の記録`}
          </h2>
          {logs.length > 0 && (
            <span className="text-xs font-bold text-[var(--foreground)]/50">
              総ボリューム {Math.round(totalVolumeToday).toLocaleString()} kg
            </span>
          )}
        </div>

        {groupedLogs.length === 0 ? (
          <p className="rounded-2xl bg-white/60 border-2 border-dashed border-[var(--foreground)]/10 px-4 py-8 text-center text-sm font-bold text-[var(--foreground)]/40">
            まだ記録がありません。最初の1セットを記録しよう!
          </p>
        ) : (
          <ul className="space-y-3 pb-4">
            {groupedLogs.map((group) => (
              <li
                key={group.exerciseId}
                className="rounded-2xl bg-white shadow-sm border-l-4 overflow-hidden"
                style={{ borderColor: group.exercise.bodyPart.color }}
              >
                <div className="flex items-center justify-between gap-2 px-4 pt-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-extrabold truncate">{group.exercise.name}</p>
                    <BodyPartBadge
                      name={group.exercise.bodyPart.name}
                      color={group.exercise.bodyPart.color}
                      size="sm"
                    />
                  </div>
                  <span className="text-xs font-bold text-[var(--foreground)]/40 shrink-0">
                    計 {Math.round(group.volume).toLocaleString()}kg
                  </span>
                </div>
                <div className="px-4 py-2 space-y-1.5">
                  {group.items.map((log, i) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 rounded-xl bg-[var(--background)] px-3 py-1.5"
                    >
                      <span className="text-[10px] font-extrabold text-[var(--foreground)]/40 w-9 shrink-0">
                        Set{i + 1}
                      </span>
                      <p className="flex-1 min-w-0 text-sm font-bold text-[var(--foreground)]/80">
                        {log.weight}kg × {log.reps}回 × {log.sets}set
                      </p>
                      <button
                        onClick={() => startEdit(log)}
                        className="h-7 w-7 shrink-0 rounded-full bg-white text-xs active:scale-90 transition-transform"
                        aria-label="編集"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="h-7 w-7 shrink-0 rounded-full bg-red-50 text-xs active:scale-90 transition-transform"
                        aria-label="削除"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    selectExercise(group.exerciseId);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full py-2 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                >
                  + この種目にセットを追加
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
