import { describe, expect, it, vi } from 'vitest';
import { evaluateKstReservation, holdUntilKst } from './hold-until-kst.mjs';

describe('early daily digest reservation', () => {
  it('holds a 07:45 KST reservation for 16 minutes', () => {
    expect(evaluateKstReservation({ observedAt: '2026-09-01T22:45:00.000Z' })).toMatchObject({
      targetAt: '2026-09-01T23:01:00.000Z',
      waitMs: 16 * 60_000,
    });
  });

  it('holds a 07:55 KST reservation for 6 minutes', () => {
    expect(evaluateKstReservation({ observedAt: '2026-09-01T22:55:00.000Z' })).toMatchObject({
      targetAt: '2026-09-01T23:01:00.000Z',
      waitMs: 6 * 60_000,
    });
  });

  it('continues immediately when GitHub starts the reservation after 08:01 KST', () => {
    expect(evaluateKstReservation({ observedAt: '2026-09-01T23:04:00.000Z' }).waitMs).toBe(0);
  });

  it('rejects an unexpectedly early start instead of holding a runner indefinitely', () => {
    expect(() => evaluateKstReservation({ observedAt: '2026-09-01T22:30:00.000Z' })).toThrow(
      /exceeds the 20 minute safety limit/,
    );
  });

  it('uses the injected sleep without waiting in tests', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    await holdUntilKst({ observedAt: '2026-09-01T22:55:00.000Z' }, sleep);
    expect(sleep).toHaveBeenCalledWith(6 * 60_000);
  });
});
