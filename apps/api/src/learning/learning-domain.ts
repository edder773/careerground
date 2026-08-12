export function nextReview(
  previous: { repetitionCount: number; intervalDays: number },
  rating: number,
) {
  if (!Number.isInteger(rating) || rating < 0 || rating > 5)
    throw new Error('rating은 0~5 정수여야 합니다.');
  if (rating < 3) return { repetitionCount: 0, intervalDays: 1 };
  const repetitionCount = previous.repetitionCount + 1;
  const intervalDays =
    repetitionCount === 1
      ? 1
      : repetitionCount === 2
        ? 3
        : Math.max(
            4,
            Math.round(previous.intervalDays * (rating === 5 ? 2.2 : rating === 4 ? 1.8 : 1.4)),
          );
  return { repetitionCount, intervalDays };
}

export function dueAtFrom(now: Date, intervalDays: number) {
  return new Date(now.getTime() + intervalDays * 86_400_000);
}
