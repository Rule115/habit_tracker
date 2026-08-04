"use client";

import { useState } from "react";
import type { Habit } from "../../../../../generated/prisma";
import { api } from "~/trpc/react";
import { HabitForm } from "./HabitForm";

export function HabitManager() {
  const utils = api.useUtils();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const listQuery = api.habits.list.useQuery();
  const deleteMutation = api.habits.delete.useMutation({
    onSuccess: () => {
      void utils.habits.list.invalidate();
    },
  });

  const handleDelete = (habit: Habit) => {
    if (
      window.confirm(
        `Hapus habit "${habit.name}"?\nSemua check-in terkait juga akan dihapus.`,
      )
    ) {
      deleteMutation.mutate({ id: habit.id });
    }
  };

  if (listQuery.isLoading) {
    return <p className="text-gray-500">Memuat habits…</p>;
  }

  if (listQuery.error) {
    return (
      <p className="text-red-600">
        Gagal memuat: {listQuery.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Daftar Habit ({listQuery.data?.length ?? 0})
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowCreate((s) => !s);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {showCreate ? "Tutup" : "+ Tambah Habit"}
        </button>
      </div>

      {showCreate && (
        <HabitForm mode="create" onDone={() => setShowCreate(false)} />
      )}

      {editing && (
        <HabitForm
          mode="edit"
          initial={editing}
          onDone={() => setEditing(null)}
        />
      )}

      {listQuery.data && listQuery.data.length > 0 ? (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border border-gray-300 px-3 py-2">Nama</th>
              <th className="border border-gray-300 px-3 py-2">Frekuensi</th>
              <th className="border border-gray-300 px-3 py-2">Dibuat</th>
              <th className="border border-gray-300 px-3 py-2 text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {listQuery.data.map((habit) => (
              <tr key={habit.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-3 py-2 font-medium">
                  {habit.name}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  {habit.frequency}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-gray-600">
                  {new Date(habit.createdAt).toLocaleDateString("id-ID")}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(habit);
                      setShowCreate(false);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(habit)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables?.id === habit.id
                      ? "Menghapus…"
                      : "Hapus"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 italic">
          Belum ada habit. Klik &quot;+ Tambah Habit&quot; untuk membuat.
        </p>
      )}
    </div>
  );
}
