import { describe, it, expect } from 'vitest';
import {
  projectRevenue,
  computeMargins,
  computeFcfMarginMode,
  computeEbitMode,
  computeTerminalValueEbit,
  discountCashFlows,
  runDcf,
  validateInputs,
  checkFcf5,
} from '../dcf';
import type { DcfInputs } from '../../types';

function makeBasicInputs(overrides?: Partial<DcfInputs>): DcfInputs {
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

describe('projectRevenue', () => {
  it('projects revenue correctly for 5 years at 10% growth', () => {
    const revenues = projectRevenue(1000, 0.10, 5);
    expect(revenues).toHaveLength(6);
    expect(revenues[0]).toBe(1000);
    expect(revenues[1]).toBeCloseTo(1100, 2);
    expect(revenues[5]).toBeCloseTo(1000 * Math.pow(1.1, 5), 2);
  });

  it('handles negative growth', () => {
    const revenues = projectRevenue(1000, -0.20, 5);
    expect(revenues[1]).toBeCloseTo(800, 2);
    expect(revenues[5]).toBeCloseTo(1000 * Math.pow(0.8, 5), 2);
  });

  it('handles zero growth', () => {
    const revenues = projectRevenue(500, 0, 5);
    revenues.forEach((r) => expect(r).toBe(500));
  });
});

describe('computeMargins', () => {
  it('constant mode returns uniform margins', () => {
    const margins = computeMargins(0.10, 0.10, 'constant', 5);
    expect(margins).toHaveLength(6);
    margins.forEach((m) => expect(m).toBeCloseTo(0.10));
  });

  it('ramp mode: year 0 = base, year 5 = target, linear interpolation', () => {
    const margins = computeMargins(0.05, 0.15, 'ramp', 5);
    expect(margins[0]).toBeCloseTo(0.05);
    expect(margins[1]).toBeCloseTo(0.07);
    expect(margins[2]).toBeCloseTo(0.09);
    expect(margins[3]).toBeCloseTo(0.11);
    expect(margins[4]).toBeCloseTo(0.13);
    expect(margins[5]).toBeCloseTo(0.15);
  });
});

describe('computeFcfMarginMode', () => {
  it('computes FCF as revenue * margin', () => {
    const revenues = [1000, 1100, 1210, 1331, 1464.1, 1610.51];
    const margins = [0.10, 0.10, 0.10, 0.10, 0.10, 0.10];
    const { fcfs } = computeFcfMarginMode(revenues, margins);
    expect(fcfs).toHaveLength(5);
    expect(fcfs[0]).toBeCloseTo(110, 2);
    expect(fcfs[4]).toBeCloseTo(161.051, 2);
  });
});

describe('computeEbitMode', () => {
  it('computes FCF correctly with EBIT inputs', () => {
    const revenues = projectRevenue(1000, 0.10, 5);
    const ebitMargins = computeMargins(0.20, 0.20, 'constant', 5);
    const { fcfs, projections } = computeEbitMode(
      revenues, ebitMargins, 0.21, 0.03, 0.04, 0.10,
    );

    expect(fcfs).toHaveLength(5);
    expect(projections).toHaveLength(5);

    const p1 = projections[0];
    expect(p1.ebit).toBeCloseTo(1100 * 0.20, 2);
    expect(p1.nopat).toBeCloseTo(1100 * 0.20 * 0.79, 2);
    expect(p1.da).toBeCloseTo(1100 * 0.03, 2);
    expect(p1.capex).toBeCloseTo(1100 * 0.04, 2);
    expect(p1.nwc).toBeCloseTo(1100 * 0.10, 2);
    expect(p1.deltaNwc).toBeCloseTo(1100 * 0.10 - 1000 * 0.10, 2);
    expect(p1.fcf).toBeCloseTo(
      1100 * 0.20 * 0.79 + 1100 * 0.03 - 1100 * 0.04 - (1100 * 0.10 - 1000 * 0.10),
      2,
    );
  });
});

describe('computeTerminalValueEbit', () => {
  it('uses Capex6 = DA6 * (1+gT) and deltaNWC6 = (Rev6-Rev5) * nwcPct', () => {
    const revenue5 = 1610.51;
    const ebitMargin5 = 0.20;
    const taxRate = 0.21;
    const daPct = 0.03;
    const nwcPct = 0.10;
    const gT = 0.02;
    const wacc = 0.10;

    const { tv, fcf6 } = computeTerminalValueEbit(
      revenue5, ebitMargin5, taxRate, daPct, nwcPct, gT, wacc,
    );

    const rev6 = revenue5 * 1.02;
    const ebit6 = rev6 * 0.20;
    const nopat6 = ebit6 * 0.79;
    const da6 = rev6 * 0.03;
    const capex6 = da6 * 1.02;
    const deltaNwc6 = (rev6 - revenue5) * 0.10;
    const expectedFcf6 = nopat6 + da6 - capex6 - deltaNwc6;

    expect(fcf6).toBeCloseTo(expectedFcf6, 4);
    expect(tv).toBeCloseTo(expectedFcf6 / (wacc - gT), 2);
  });
});

describe('discountCashFlows', () => {
  it('discounts at end-year convention', () => {
    const fcfs = [100, 100, 100];
    const pvs = discountCashFlows(fcfs, 0.10);
    expect(pvs[0]).toBeCloseTo(100 / 1.10, 4);
    expect(pvs[1]).toBeCloseTo(100 / 1.21, 4);
    expect(pvs[2]).toBeCloseTo(100 / 1.331, 4);
  });
});

describe('validation', () => {
  it('rejects WACC <= terminal growth', () => {
    const inputs = makeBasicInputs({
      forecast: { wacc: 0.02, terminalGrowth: 0.03 },
    });
    const err = validateInputs(inputs);
    expect(err).not.toBeNull();
    expect(err!.type).toBe('wacc_lte_gt');
  });

  it('rejects shares <= 0 in price mode', () => {
    const inputs = makeBasicInputs({
      market: { mode: 'price', pricePerShare: 100, sharesOutstanding: 0 },
    });
    const err = validateInputs(inputs);
    expect(err).not.toBeNull();
    expect(err!.type).toBe('invalid_input');
  });

  it('passes valid inputs', () => {
    const inputs = makeBasicInputs();
    expect(validateInputs(inputs)).toBeNull();
  });
});

describe('checkFcf5 negative', () => {
  it('triggers exact error when FCF5 is negative', () => {
    const inputs = makeBasicInputs({
      cashConversion: {
        mode: 'fcfMargin',
        marginBehavior: 'constant',
        constantMargin: -0.05,
        baseMargin: -0.05,
        targetMargin: -0.05,
      },
    });
    const err = checkFcf5(0.10, inputs);
    expect(err).not.toBeNull();
    expect(err!.type).toBe('negative_fcf5');
    expect(err!.message).toBe(
      'FCF in the last explicit year is negative, therefore Gordon terminal value cannot be used.',
    );
  });
});

describe('price mode vs market cap mode consistency', () => {
  it('produces consistent equity values', () => {
    const priceInputs = makeBasicInputs({
      market: { mode: 'price', pricePerShare: 100, sharesOutstanding: 10 },
    });
    const mcapInputs = makeBasicInputs({
      market: { mode: 'marketCap', marketCap: 1000 },
    });

    const g = 0.08;
    const priceResult = runDcf(g, priceInputs);
    const mcapResult = runDcf(g, mcapInputs);

    expect(priceResult.equityValue).toBeCloseTo(mcapResult.equityValue, 4);
    expect(priceResult.enterpriseValue).toBeCloseTo(mcapResult.enterpriseValue, 4);
  });
});
