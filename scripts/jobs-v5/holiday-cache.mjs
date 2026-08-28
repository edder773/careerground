import { canonicalSha256 } from './canonical-json.mjs';
import { V5Error } from './contracts.mjs';

const SEOUL_WEEKDAY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
});

export function holidayCacheChecksum(cache) {
  const content = { ...cache };
  delete content.checksum;
  return canonicalSha256(content);
}

export function validateHolidayCache(cache) {
  if (!cache || cache.schemaVersion !== '1.0' || !/^\d{4}$/.test(String(cache.year)))
    throw new V5Error(
      'HOLIDAY_CACHE_INVALID',
      'Holiday cache metadata is invalid.',
      'FAILED_PREFLIGHT',
    );
  if (!cache.source?.url || !cache.source?.name || !Array.isArray(cache.holidays))
    throw new V5Error(
      'HOLIDAY_CACHE_INVALID',
      'Holiday cache source and holidays are required.',
      'FAILED_PREFLIGHT',
    );
  if (cache.checksum !== holidayCacheChecksum(cache))
    throw new V5Error(
      'HOLIDAY_CACHE_CORRUPT',
      'Holiday cache checksum mismatch.',
      'FAILED_PREFLIGHT',
    );
  return cache;
}

export async function resolveHolidayCache(
  cache,
  { now = new Date(), refresh, forceRefresh = false } = {},
) {
  validateHolidayCache(cache);
  const date = now.toISOString().slice(0, 10);
  const expired = date > cache.validUntil;
  if (!forceRefresh && !expired) return { cache, source: 'cache', warning: null };
  if (refresh) {
    try {
      const refreshed = validateHolidayCache(await refresh(cache.year));
      return { cache: refreshed, source: 'official-refresh', warning: null };
    } catch (error) {
      if (date <= cache.fallbackValidUntil)
        return { cache, source: 'cache-fallback', warning: String(error) };
      throw new V5Error(
        'HOLIDAY_REFRESH_FAILED',
        'Official holiday refresh failed and no valid fallback remains.',
        'FAILED_PREFLIGHT',
      );
    }
  }
  if (date <= cache.fallbackValidUntil)
    return {
      cache,
      source: 'cache-fallback',
      warning: expired
        ? 'Cache is past refresh validity.'
        : 'Refresh was requested without a provider.',
    };
  throw new V5Error('HOLIDAY_CACHE_EXPIRED', 'Holiday cache has expired.', 'FAILED_PREFLIGHT');
}

export function businessDayDecision(targetAsOfDate, cache) {
  validateHolidayCache(cache);
  const instant = new Date(`${targetAsOfDate}T12:00:00+09:00`);
  const weekday = SEOUL_WEEKDAY.format(instant);
  if (weekday === 'Sat' || weekday === 'Sun')
    return { status: 'SKIPPED_WEEKEND', reason: 'weekend' };
  const holiday = cache.holidays.find((entry) => entry.date === targetAsOfDate);
  if (holiday) return { status: 'SKIPPED_HOLIDAY', reason: holiday.name };
  return { status: 'RUNNING', reason: null };
}
