import { describe, it, expect } from 'vitest';
import { brentSolver, solveImpliedCAGR } from '../solver';
import { runDcf } from '../dcf';
import type { DcfInputs } from '../../types';

describe('brentSolver', () => {
  it('finds root of simple function', () => {
    const root = brentSolver((x) => x * x - 4, 0, 5);
    expect(root).not.toBeNull();
    expect(root!).toBeCloseTo(2.0, 8);
  });

  it('finds root of negative function', () => {
    const root = brentSolver((x) => x + 3, -10, 10);
    expect(root).not.toBeNull();
    expect(root!).toBeCloseTo(-3.0, 8);
  });

  it('returns null when no bracket exists', () => {
    const root = brentSolver((x) => x * x + 1, 0, 10);
    expect(root).toBeNull();
  });
});

function makeInputs(overrides?: Partial<DcfInputs>): DcfInputs {
  return {
    revenue0: 1000,
    market: { mode: 'price', pricePerShare: 100, sharesOutstanding: 10 },
    cashConversion: {
      mode: 'fcfMargin',
      marginBehavior: 'constant',
      constantMargin: 0.10,
      baseMargin: 0.05,
      targetMargin: 0.15,
    },
    forecast: { wacc: 0.10, terminalGrowth: 0.02 },
    capitalStructure: { netDebt: 200 },
    ...overrides,
  };
}

describe('solveImpliedCAGR', () => {
  it('finds a known CAGR from a hand-crafted target', () => {
    const knownG = 0.08;
    const inputs = makeInputs();
    const forwardResult = runDcf(knownG, inputs);

    const targetInputs: DcfInputs = {
      ...inputs,
      market: {
        mode: 'price',
        pricePerShare: forwardResult.impliedValue,
        sharesOutstanding: 10,
      },
    };

    const solverResult = solveImpliedCAGR(targetInputs);
    expect(solverResult.success).toBe(true);
    if (solverResult.success) {
      expect(solverResult.result.impliedCAGR).toBeCloseTo(knownG, 4);
    }
  });

  it('works in market cap mode', () => {
    const knownG = 0.12;
    const inputs: DcfInputs = {
      ...makeInputs(),
      market: { mode: 'marketCap', marketCap: 1000 },
    };
    const forwardResult = runDcf(knownG, inputs);

    const targetInputs: DcfInputs = {
      ...inputs,
      market: { mode: 'marketCap', marketCap: forwardResult.impliedValue },
    };

    const solverResult = solveImpliedCAGR(targetInputs);
    expect(solverResult.success).toBe(true);
    if (solverResult.success) {
      expect(solverResult.result.impliedCAGR).toBeCloseTo(knownG, 4);
    }
  });

  it('returns WACC error when WACC <= terminal growth', () => {
    const inputs = makeInputs({
      forecast: { wacc: 0.02, terminalGrowth: 0.03 },
    });
    const result = solveImpliedCAGR(inputs);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('wacc_lte_gt');
    }
  });

  it('returns no_solution with details for extreme targets', () => {
    const inputs = makeInputs({
      market: { mode: 'price', pricePerShare: 999999, sharesOutstanding: 10 },
    });
    const result = solveImpliedCAGR(inputs);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('no_solution');
      expect(result.error.details).toBeDefined();
      expect(result.error.details!.impliedAtLow).toBeDefined();
      expect(result.error.details!.impliedAtHigh).toBeDefined();
      expect(result.error.details!.target).toBe(999999);
    }
  });

  it('detects negative FCF5 at solved growth rate', () => {
    const inputs = makeInputs({
      cashConversion: {
        mode: 'fcfMargin',
        marginBehavior: 'ramp',
        constantMargin: 0.10,
        baseMargin: 0.10,
        targetMargin: -0.10,
      },
      market: { mode: 'marketCap', marketCap: 50 },
    });
    const result = solveImpliedCAGR(inputs);
    if (!result.success) {
      expect(['negative_fcf5', 'no_solution']).toContain(result.error.type);
    }
  });
});
