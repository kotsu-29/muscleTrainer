"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BodyPartBadge from "@/components/BodyPartBadge";
import type { BodyPartWithExercises } from "@/lib/types";

const COLOR_PRESETS = [
  "#FF6B6B",
  "#4D96FF",
  "#6BCB77",
  "#FFD93D",
  "#C780FA",
  "#FF9F45",
  "#4ECDC4",
  "#FF6B8B",
];

export default function ExercisesClient({
  bodyParts,
}: {
  bodyParts: BodyPartWithExercises[];
}) {
  const router = useRouter();
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseBodyPartId, setNewExerciseBodyPartId] = useState(bodyParts[0]?.id ?? "");
  const [newBodyPartName, setNewBodyPartName] = useState("");
  const [newBodyPartColor, setNewBodyPartColor] = useState(COLOR_PRESETS[0]);
  const [showAddBodyPart, setShowAddBodyPart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addExercise() {
    const name = newExerciseName.trim();
    if (!name || !newExerciseBodyPartId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bodyPartId: newExerciseBodyPartId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "追加に失敗しました");
      }
      setNewExerciseName("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function addBodyPart() {
    const name = newBodyPartName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/body-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color: newBodyPartColor }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "追加に失敗しました");
      }
      setNewBodyPartName("");
      setShowAddBodyPart(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "追加に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function deleteExercise(id: string) {
    if (!confirm("このメニューを削除しますか?")) return;
    const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "削除に失敗しました");
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="メニュー管理" subtitle="種目と部位タグを追加・編集" emoji="🏷️" />

      {error && (
        <p className="mx-5 mb-2 text-sm font-bold text-red-500">{error}</p>
      )}

      {/* Add exercise */}
      <section className="mx-5 rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="font-extrabold mb-3">新しいメニューを追加</h2>
        <div className="flex flex-col gap-2">
          <input
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
            placeholder="例: サイドレイズ"
            className="rounded-xl bg-[var(--background)] px-3 py-2.5 font-bold text-sm outline-none"
          />
          <select
            value={newExerciseBodyPartId}
            onChange={(e) => setNewExerciseBodyPartId(e.target.value)}
            className="rounded-xl bg-[var(--background)] px-3 py-2.5 font-bold text-sm outline-none"
          >
            {bodyParts.map((bp) => (
              <option key={bp.id} value={bp.id}>
                {bp.name}
              </option>
            ))}
          </select>
          <button
            onClick={addExercise}
            disabled={busy || !newExerciseName.trim()}
            className="rounded-2xl bg-[var(--color-primary)] py-2.5 font-extrabold text-white shadow-md active:scale-95 transition-transform disabled:opacity-40"
          >
            追加する
          </button>
        </div>
      </section>

      {/* Add body part */}
      <section className="mx-5 mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <button
          onClick={() => setShowAddBodyPart((v) => !v)}
          className="font-extrabold w-full text-left flex items-center justify-between"
        >
          部位タグを追加
          <span className="text-[var(--foreground)]/40">{showAddBodyPart ? "−" : "+"}</span>
        </button>
        {showAddBodyPart && (
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={newBodyPartName}
              onChange={(e) => setNewBodyPartName(e.target.value)}
              placeholder="例: 前腕"
              className="rounded-xl bg-[var(--background)] px-3 py-2.5 font-bold text-sm outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewBodyPartColor(c)}
                  className="h-8 w-8 rounded-full border-2"
                  style={{
                    backgroundColor: c,
                    borderColor: newBodyPartColor === c ? "var(--foreground)" : "transparent",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
            <button
              onClick={addBodyPart}
              disabled={busy || !newBodyPartName.trim()}
              className="rounded-2xl bg-[var(--color-secondary)] py-2.5 font-extrabold text-white shadow-md active:scale-95 transition-transform disabled:opacity-40"
            >
              部位タグを追加
            </button>
          </div>
        )}
      </section>

      {/* List */}
      <section className="mx-5 mt-4 mb-8 space-y-4">
        {bodyParts.map((bp) => (
          <div key={bp.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <BodyPartBadge name={bp.name} color={bp.color} />
            <ul className="mt-3 space-y-2">
              {bp.exercises.length === 0 && (
                <p className="text-sm font-bold text-[var(--foreground)]/40">メニューなし</p>
              )}
              {bp.exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--background)] px-3 py-2"
                >
                  <span className="font-bold text-sm">{ex.name}</span>
                  <button
                    onClick={() => deleteExercise(ex.id)}
                    className="h-7 w-7 rounded-full bg-red-50 text-xs active:scale-90 transition-transform"
                    aria-label="削除"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
