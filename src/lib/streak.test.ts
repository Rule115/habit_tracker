import { describe, expect, it } from "vitest";
import { streakLength } from "./streak";

const T = new Date("2026-01-15T08:30:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const d = (offsetDays: number) => new Date(T.getTime() + offsetDays * DAY);

const ci = (offsetDays: number) => ({ date: d(offsetDays) });

describe("streakLength", () => {
  it("mengembalikan 0 untuk array check-in kosong", () => {
    expect(streakLength([], T)).toBe(0);
  });

  it("mengembalikan 0 bila tidak ada check-in pada today", () => {
    // 2 hari berturut-turut tapi TIDAK termasuk hari ini
    const checkIns = [ci(-2), ci(-1)];
    expect(streakLength(checkIns, T)).toBe(0);
  });

  it("happy path: menghitung hari berturut-turut yang berakhir pada today", () => {
    // hari ini + 3 hari sebelumnya = streak 4
    const checkIns = [ci(-3), ci(-2), ci(-1), ci(0)];
    expect(streakLength(checkIns, T)).toBe(4);
  });

  it("mengabaikan check-in bertanggal setelah today (masa depan)", () => {
    // besok + lusa tidak boleh menambah streak
    const checkIns = [ci(-1), ci(0), ci(1), ci(2)];
    expect(streakLength(checkIns, T)).toBe(2);
  });

  it("menghitung duplikat di hari yang sama sebagai satu", () => {
    // tiga check-in pada hari yang sama (today) tetap streak 1
    const checkIns = [ci(0), ci(0), ci(0)];
    expect(streakLength(checkIns, T)).toBe(1);
  });

  it("berhenti menghitung saat ada gap (streak putus)", () => {
    // hari ini ada, kemarin TIDAK ada, maka streak = 1 (bukan 2)
    const checkIns = [ci(0), ci(-2)];
    expect(streakLength(checkIns, T)).toBe(1);
  });

  it("check-in lama yang tidak nyambung tidak menambah streak", () => {
    // streak 3 hari (kemarin lusa, kemarin, hari ini), plus check-in 10 hari lalu
    const checkIns = [ci(-10), ci(-2), ci(-1), ci(0)];
    expect(streakLength(checkIns, T)).toBe(3);
  });

  it("tanggal dengan komponen jam tetap dinormalisasi ke tengah malam", () => {
    // dua check-in di hari yang sama dengan jam berbeda → 1
    const checkIns = [
      { date: new Date("2026-01-15T01:00:00.000Z") },
      { date: new Date("2026-01-15T23:59:00.000Z") },
    ];
    expect(streakLength(checkIns, T)).toBe(1);
  });
});
