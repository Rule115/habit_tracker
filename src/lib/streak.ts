const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Jumlah hari berturut-turut yang berakhir pada `today` dan memiliki check-in.
 * Murni: tidak memanggil `new Date()` / `Date.now()` — semua waktu lewat argumen `today`.
 */
export function streakLength(
  checkIns: { date: Date }[],
  today: Date = new Date(),
): number {
  const todayStart = startOfDay(today);
  const checkedDays = new Set(
    checkIns
      .map(({ date }) => startOfDay(date))
      .filter((dayStart) => dayStart <= todayStart),
  );

  if (!checkedDays.has(todayStart)) return 0;

  let streak = 0;
  for (
    let cursor = todayStart;
    checkedDays.has(cursor);
    cursor -= MS_PER_DAY
  ) {
    streak++;
  }

  return streak;
}

/** Normalisasi timestamp apa pun ke tengah malam (awal hari) UTC-invariant. */
function startOfDay(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_DAY) * MS_PER_DAY;
}
