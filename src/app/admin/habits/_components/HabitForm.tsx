"use client";

import { useState } from "react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { Habit } from "../../../../../generated/prisma";
import { api } from "~/trpc/react";
import type { AppRouter } from "~/server/api/root";

interface Props {
  mode: "create" | "edit";
  initial?: Habit;
  onDone: () => void;
}

export function HabitForm({ mode, initial, onDone }: Props) {
  const utils = api.useUtils();
  const [name, setName] = useState(initial?.name ?? "");
  const [frequency, setFrequency] = useState(initial?.frequency ?? "daily");
  const [error, setError] = useState<string | null>(null);

  const createMutation = api.habits.create.useMutation({
    onSuccess: () => {
      void utils.habits.list.invalidate();
      onDone();
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  const updateMutation = api.habits.update.useMutation({
    onSuccess: () => {
      void utils.habits.list.invalidate();
      onDone();
    },
    onError: (err: TRPCClientErrorLike<AppRouter>) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "create") {
      createMutation.mutate({ name, frequency });
    } else if (initial) {
      updateMutation.mutate({ id: initial.id, name, frequency });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-gray-300 rounded p-4 bg-gray-50 space-y-3"
    >
      <h3 className="font-semibold">
        {mode === "create" ? "Tambah Habit Baru" : `Edit: ${initial?.name}`}
      </h3>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">
          Nama Habit
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Mis. Baca 20 halaman"
          className="border rounded px-3 py-2 w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Frekuensi
        </label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="daily">Daily (setiap hari)</option>
          <option value="weekly">Weekly (mingguan)</option>
          <option value="weekdays">Weekdays (Senin–Jumat)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isPending
            ? "Menyimpan…"
            : mode === "create"
              ? "Simpan"
              : "Update"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
