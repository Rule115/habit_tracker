import { describe, expect, it, vi } from "vitest";

// Mock auth & db supaya runtime next-auth / Prisma tidak dimuat di test.
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("~/server/db", () => ({ db: {} }));

import type { Session } from "next-auth";
import type { PrismaClient } from "../../../../generated/prisma";
import { TRPCError } from "@trpc/server";
import { createCallerFactory } from "~/server/api/trpc";
import { habitsRouter } from "./habits";

const createCaller = createCallerFactory(habitsRouter);

const USER_ID = "user-1";
const HABIT_ID = "habit-1";
const TODAY = new Date("2026-01-15T10:00:00.000Z");

interface MockDb {
  habit: { findUniqueOrThrow: ReturnType<typeof vi.fn> };
  checkIn: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
}

function makeDb(overrides: {
  ownerId?: string;
  checkIns?: { date: Date }[];
} = {}): MockDb {
  const { ownerId = USER_ID, checkIns = [] } = overrides;
  return {
    habit: {
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue({ id: HABIT_ID, userId: ownerId }),
    },
    checkIn: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findMany: vi.fn().mockResolvedValue(checkIns),
    },
  };
}

function makeCaller(db: MockDb, userId = USER_ID) {
  return createCaller({
    db: db as unknown as PrismaClient,
    session: {
      user: { id: userId },
      expires: new Date().toISOString(),
    } as unknown as Session,
    headers: new Headers(),
  });
}

describe("habits.checkIn (integration)", () => {
  it("membuat check-in milik user dan mengembalikan streak yang diperbarui", async () => {
    const db = makeDb({
      checkIns: [
        { date: new Date("2026-01-15") },
        { date: new Date("2026-01-14") },
      ],
    });
    const caller = makeCaller(db);

    const result = await caller.checkIn({
      habitId: HABIT_ID,
      date: TODAY,
    });

    expect(result.streak).toBe(2);
    expect(db.checkIn.upsert).toHaveBeenCalledOnce();
    const upsertCall = db.checkIn.upsert.mock.calls[0]?.[0] as {
      where: { habitId_date: { habitId: string; date: Date } };
    };
    expect(upsertCall.where.habitId_date.habitId).toBe(HABIT_ID);
    expect(upsertCall.where.habitId_date.date).toBeInstanceOf(Date);
  });

  it("mengembalikan streak 0 bila tidak ada check-in pada today", async () => {
    const db = makeDb({
      checkIns: [{ date: new Date("2026-01-13") }],
    });
    const caller = makeCaller(db);

    const result = await caller.checkIn({ habitId: HABIT_ID, date: TODAY });

    expect(result.streak).toBe(0);
  });

  it("menolak akses ke habit milik user lain (auth scope)", async () => {
    const db = makeDb({ ownerId: "user-lain" });
    const caller = makeCaller(db);

    await expect(
      caller.checkIn({ habitId: HABIT_ID, date: TODAY }),
    ).rejects.toBeInstanceOf(TRPCError);

    expect(db.checkIn.upsert).not.toHaveBeenCalled();
  });

  it("idempoten: check-in duplikat di hari sama tidak menambah streak", async () => {
    const db = makeDb({
      checkIns: [{ date: new Date("2026-01-15") }],
    });
    const caller = makeCaller(db);

    const result = await caller.checkIn({ habitId: HABIT_ID, date: TODAY });

    expect(result.streak).toBe(1);
  });
});
