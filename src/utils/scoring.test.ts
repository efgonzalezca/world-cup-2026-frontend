import { describe, it, expect } from 'vitest';
import { calculatePoints } from './scoring';

describe('calculatePoints', () => {
  it('returns 7 for exact score match', () => {
    expect(calculatePoints(2, 1, 2, 1).total).toBe(7);
  });

  it('returns 2 for correct result only (non-draw)', () => {
    expect(calculatePoints(2, 0, 3, 1).total).toBe(2);
  });

  it('returns 0 for completely wrong', () => {
    expect(calculatePoints(1, 0, 0, 2).total).toBe(0);
  });

  it('returns 3 for correct result + local goals', () => {
    const r = calculatePoints(2, 1, 2, 0);
    expect(r.resultPoints).toBe(2);
    expect(r.localScorePoints).toBe(1);
    expect(r.drawBonus).toBe(0);
    expect(r.total).toBe(3);
  });

  it('returns 7 for exact draw (0-0)', () => {
    const r = calculatePoints(0, 0, 0, 0);
    expect(r.exactScoreBonus).toBe(3);
    expect(r.drawBonus).toBe(0);
    expect(r.total).toBe(7);
  });

  it('returns 7 for exact draw (2-2)', () => {
    const r = calculatePoints(2, 2, 2, 2);
    expect(r.exactScoreBonus).toBe(3);
    expect(r.drawBonus).toBe(0);
    expect(r.total).toBe(7);
  });

  describe('draw bonus — non-exact draw gives +1', () => {
    it('returns 3 for non-exact draw (0-0 pred, 1-1 real)', () => {
      const r = calculatePoints(0, 0, 1, 1);
      expect(r.resultPoints).toBe(2);
      expect(r.drawBonus).toBe(1);
      expect(r.exactScoreBonus).toBe(0);
      expect(r.total).toBe(3);
    });

    it('returns 3 for non-exact draw (2-2 pred, 3-3 real)', () => {
      const r = calculatePoints(2, 2, 3, 3);
      expect(r.resultPoints).toBe(2);
      expect(r.drawBonus).toBe(1);
      expect(r.total).toBe(3);
    });

    it('does NOT give draw bonus when prediction is not a draw', () => {
      const r = calculatePoints(1, 0, 2, 2);
      expect(r.drawBonus).toBe(0);
    });

    it('does NOT give draw bonus when result is not a draw', () => {
      const r = calculatePoints(1, 1, 2, 0);
      expect(r.drawBonus).toBe(0);
    });
  });
});
