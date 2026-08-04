import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { streakLength } from "~/lib/streak";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export const habitsRouter = createTRPCRouter({
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
