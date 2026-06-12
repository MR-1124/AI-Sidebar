// ─────────────────────────────────────────────────────────────
// Unit Tests: Pricing utilities
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';

// Import only the pure utility functions (not cn which depends on clsx/twMerge)
const { calculateCost, formatCost, formatTokenCount } = await import('../src/lib/utils');

describe('calculateCost', () => {
  it('should calculate cost correctly with standard pricing', () => {
    // 1000 input tokens at $3/M, 500 output tokens at $15/M
    const cost = calculateCost(1000, 500, 3, 15);
    // Expected: (1000/1000000 * 3) + (500/1000000 * 15) = 0.003 + 0.0075 = 0.0105
    expect(cost).toBeCloseTo(0.0105, 4);
  });

  it('should return 0 for zero tokens', () => {
    expect(calculateCost(0, 0, 3, 15)).toBe(0);
  });

  it('should handle zero pricing', () => {
    expect(calculateCost(1000, 1000, 0, 0)).toBe(0);
  });
});

describe('formatCost', () => {
  it('should format small costs with 4 decimal places', () => {
    const result = formatCost(0.005);
    expect(result).toContain('0.005');
  });

  it('should format larger costs with 4 decimal places', () => {
    const result = formatCost(1.2345);
    expect(result).toContain('1.23');
  });

  it('should handle zero', () => {
    const result = formatCost(0);
    expect(result).toContain('0');
  });
});

describe('formatTokenCount', () => {
  it('should format small numbers without suffix', () => {
    expect(formatTokenCount(500)).toBe('500');
  });

  it('should format thousands with K suffix', () => {
    const result = formatTokenCount(1500);
    expect(result).toContain('1.5K');
  });

  it('should format millions with M suffix', () => {
    const result = formatTokenCount(2500000);
    expect(result).toContain('2.50M');
  });
});
