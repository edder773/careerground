import process from 'node:process';
import { resolve } from 'node:path';
import { setTimeout as sleepFor } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const KST_OFFSET_MS = 9 * 60 * 60_000;

const integer = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : fallback;
};

export function evaluateKstReservation({
  observedAt = new Date(),
  targetHour = 8,
  targetMinute = 1,
  maxWaitMinutes = 20,
} = {}) {
  const observed = observedAt instanceof Date ? observedAt : new Date(observedAt);
  const hour = integer(targetHour, 8);
  const minute = integer(targetMinute, 1);
  const maximum = integer(maxWaitMinutes, 20);
  if (Number.isNaN(observed.getTime()))
    throw new Error('RESERVATION_OBSERVED_AT must be ISO 8601.');
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || maximum < 0) {
    throw new Error('Reservation configuration is outside the allowed range.');
  }

  const kst = new Date(observed.getTime() + KST_OFFSET_MS);
  const targetAt = new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), hour, minute) -
      KST_OFFSET_MS,
  );
  const waitMs = Math.max(0, targetAt.getTime() - observed.getTime());
  const maxWaitMs = maximum * 60_000;
  if (waitMs > maxWaitMs) {
    throw new Error(
      `Reservation wait ${Math.ceil(waitMs / 60_000)} minutes exceeds the ${maximum} minute safety limit.`,
    );
  }

  return {
    schema: 'careerground-early-reservation/v1',
    timeZone: 'Asia/Seoul',
    observedAt: observed.toISOString(),
    targetAt: targetAt.toISOString(),
    waitMs,
  };
}

export async function holdUntilKst(options = {}, sleep = sleepFor) {
  const reservation = evaluateKstReservation(options);
  process.stdout.write(`${JSON.stringify(reservation)}\n`);
  if (reservation.waitMs > 0) await sleep(reservation.waitMs);
  return reservation;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  await holdUntilKst({
    observedAt: process.env.RESERVATION_OBSERVED_AT || new Date(),
    targetHour: process.env.RESERVATION_TARGET_HOUR || 8,
    targetMinute: process.env.RESERVATION_TARGET_MINUTE || 1,
    maxWaitMinutes: process.env.RESERVATION_MAX_WAIT_MINUTES || 20,
  });
}
