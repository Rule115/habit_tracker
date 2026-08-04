import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PrismaClient } from "../../../../generated/prisma";
import { streakLength } from "~/lib/streak";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Helper: pastikan habit milik user yang login. Lempar FORBIDDEN bila bukan milik,
 * NOT_FOUND bila tidak ada. Mencegah enumeration (penyerang tidak tahu habit ada atau tidak).
 */
async function assertHabitOwnership(opts: {
  db: PrismaClient;
  habitId: string;
  userId: string;
}) {
  const habit = await opts.db.habit.findUnique({
    where: { id: opts.habitId },
    select: { userId: true },
  });

  if (!habit) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Habit tidak ditemukan." });
  }
  if (habit.userId !== opts.userId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export const habitsRouter = createTRPCRouter({
  /** Daftar semua habit milik user yang login. */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.habit.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  /** Buat habit baru terkait user yang login. */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name tidak boleh kosong"),
        frequency: z.string().min(1, "Frequency tidak boleh kosong"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.habit.create({
        data: {
          name: input.name,
          frequency: input.frequency,
          userId: ctx.session.user.id,
        },
      });
    }),

  /** Perbarui habit milik user. Cek auth scope sebelum update. */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name tidak boleh kosong"),
        frequency: z.string().min(1, "Frequency tidak boleh kosong"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertHabitOwnership({
        db: ctx.db,
        habitId: input.id,
        userId: ctx.session.user.id,
      });

      return ctx.db.habit.update({
        where: { id: input.id },
        data: {
          name: input.name,
          frequency: input.frequency,
        },
      });
    }),

  /** Hapus habit milik user. Cek auth scope sebelum delete.
   * Catatan: CheckIn terkait otomatis terhapus karena onDelete: Cascade di skema.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertHabitOwnership({
        db: ctx.db,
        habitId: input.id,
        userId: ctx.session.user.id,
      });

      await ctx.db.habit.delete({ where: { id: input.id } });
      return { success: true as const };
    }),

  /** Catat check-in harian untuk sebuah habit. */
  checkIn: protectedProcedure
    .input(z.object({ habitId: z.string(), date: z.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      const today = input.date ?? new Date();

      const habit = await ctx.db.habit.findUniqueOrThrow({
        where: { id: input.habitId },
        select: { userId: true },
      });

      if (habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.checkIn.upsert({
        where: {
          habitId_date: { habitId: input.habitId, date: toDateOnly(today) },
        },
        create: { habitId: input.habitId, date: toDateOnly(today) },
        update: {},
      });

      const checkIns = await ctx.db.checkIn.findMany({
        where: { habitId: input.habitId },
        select: { date: true },
      });

      return { streak: streakLength(checkIns, today) };
    }),
});
