import type {
  DcfInputs,
  DcfResult,
  YearProjection,
  CashConversionInputs,
  MarginBehavior,
  SolverError,
} from '../types';

const FORECAST_YEARS = 5;

export function projectRevenue(revenue0: number, g: number, years: number): number[] {
  const revenues = [revenue0];
  for (let t = 1; t <= years; t++) {
    revenues.push(revenues[t - 1] * (1 + g));
  }
  return revenues;
}

export function computeMargins(
  base: number,
  target: number,
  behavior: MarginBehavior,
  years: number,
): number[] {
  if (behavior === 'constant') {
    return Array.from({ length: years + 1 }, () => base);
  }
  return Array.from({ length: years + 1 }, (_, t) =>
    base + (target - base) * (t / years),
  );
}

export function computeFcfMarginMode(
  revenues: number[],
  margins: number[],
): { fcfs: number[]; projections: YearProjection[] } {
  const fcfs: number[] = [];
  const projections: YearProjection[] = [];

  for (let t = 1; t <= FORECAST_YEARS; t++) {
    const fcf = revenues[t] * margins[t];
    fcfs.push(fcf);
    projections.push({
      year: t,
      revenue: revenues[t],
      margin: margins[t],
      fcf,
      pvFcf: 0,
    });
  }

  return { fcfs, projections };
}

export function computeEbitMode(
  revenues: number[],
  ebitMargins: number[],
  taxRate: number,
  daPct: number,
  capexPct: number,
  nwcPct: number,
): { fcfs: number[]; projections: YearProjection[] } {
  const fcfs: number[] = [];
  const projections: YearProjection[] = [];
  const nwc0 = revenues[0] * nwcPct;

  for (let t = 1; t <= FORECAST_YEARS; t++) {
    const revenue = revenues[t];
    const ebit = revenue * ebitMargins[t];
    const nopat = ebit * (1 - taxRate);
    const da = revenue * daPct;
    const capex = revenue * capexPct;
    const nwc = revenue * nwcPct;
    const prevNwc = t === 1 ? nwc0 : revenues[t - 1] * nwcPct;
    const deltaNwc = nwc - prevNwc;
    const fcf = nopat + da - capex - deltaNwc;

    fcfs.push(fcf);
    projections.push({
      year: t,
      revenue,
      margin: ebitMargins[t],
      fcf,
      pvFcf: 0,
      ebit,
      nopat,
      da,
      capex,
      nwc,
      deltaNwc,
    });
  }

  return { fcfs, projections };
}

export function computeTerminalValueFcfMargin(
  revenue5: number,
  margin5: number,
  terminalGrowth: number,
  wacc: number,
): { tv: number; pvTv: number; fcf6: number } {
  const revenue6 = revenue5 * (1 + terminalGrowth);
  const fcf6 = revenue6 * margin5;
  const tv = fcf6 / (wacc - terminalGrowth);
  const pvTv = tv / Math.pow(1 + wacc, FORECAST_YEARS);
  return { tv, pvTv, fcf6 };
}

export function computeTerminalValueEbit(
  revenue5: number,
  ebitMargin5: number,
  taxRate: number,
  daPct: number,
  nwcPct: number,
  terminalGrowth: number,
  wacc: number,
): { tv: number; pvTv: number; fcf6: number } {
  const revenue6 = revenue5 * (1 + terminalGrowth);
  const ebit6 = revenue6 * ebitMargin5;
  const nopat6 = ebit6 * (1 - taxRate);
  const da6 = revenue6 * daPct;
  const capex6 = da6 * (1 + terminalGrowth);
  const deltaNwc6 = (revenue6 - revenue5) * nwcPct;
  const fcf6 = nopat6 + da6 - capex6 - deltaNwc6;
  const tv = fcf6 / (wacc - terminalGrowth);
  const pvTv = tv / Math.pow(1 + wacc, FORECAST_YEARS);
  return { tv, pvTv, fcf6 };
}

export function discountCashFlows(fcfs: number[], wacc: number): number[] {
  return fcfs.map((fcf, i) => fcf / Math.pow(1 + wacc, i + 1));
}

export function validateInputs(inputs: DcfInputs): SolverError | null {
  const { forecast, market } = inputs;

  if (forecast.wacc <= forecast.terminalGrowth) {
    return {
      type: 'wacc_lte_gt',
      message: 'WACC must be greater than the terminal growth rate.',
    };
  }

  if (market.mode === 'price' && market.sharesOutstanding <= 0) {
    return {
      type: 'invalid_input',
      message: 'Shares Outstanding must be greater than 0 in price mode.',
    };
  }

  return null;
}

function getMargins(cc: CashConversionInputs): number[] {
  if (cc.mode === 'fcfMargin') {
    return cc.marginBehavior === 'constant'
      ? computeMargins(cc.constantMargin, cc.constantMargin, 'constant', FORECAST_YEARS)
      : computeMargins(cc.baseMargin, cc.targetMargin, 'ramp', FORECAST_YEARS);
  } else {
    return cc.marginBehavior === 'constant'
      ? computeMargins(cc.constantEbitMargin, cc.constantEbitMargin, 'constant', FORECAST_YEARS)
      : computeMargins(cc.baseEbitMargin, cc.targetEbitMargin, 'ramp', FORECAST_YEARS);
  }
}

export function getTarget(inputs: DcfInputs): number {
  if (inputs.market.mode === 'price') {
    return inputs.market.pricePerShare;
  }
  return inputs.market.marketCap;
}

export function runDcf(g: number, inputs: DcfInputs): DcfResult {
  const { revenue0, cashConversion, forecast, capitalStructure, market } = inputs;
  const { wacc, terminalGrowth } = forecast;

  const revenues = projectRevenue(revenue0, g, FORECAST_YEARS);
  const margins = getMargins(cashConversion);

  let fcfs: number[];
  let projections: YearProjection[];

  if (cashConversion.mode === 'fcfMargin') {
    const result = computeFcfMarginMode(revenues, margins);
    fcfs = result.fcfs;
    projections = result.projections;
  } else {
    const result = computeEbitMode(
      revenues,
      margins,
      cashConversion.taxRate,
      cashConversion.daPct,
      cashConversion.capexPct,
      cashConversion.nwcPct,
    );
    fcfs = result.fcfs;
    projections = result.projections;
  }

  const pvFcfs = discountCashFlows(fcfs, wacc);
  projections.forEach((p, i) => { p.pvFcf = pvFcfs[i]; });

  const revenue5 = revenues[FORECAST_YEARS];
  const margin5 = margins[FORECAST_YEARS];

  let tv: number, pvTv: number;
  if (cashConversion.mode === 'fcfMargin') {
    const termResult = computeTerminalValueFcfMargin(revenue5, margin5, terminalGrowth, wacc);
    tv = termResult.tv;
    pvTv = termResult.pvTv;
  } else {
    const termResult = computeTerminalValueEbit(
      revenue5,
      margin5,
      cashConversion.taxRate,
      cashConversion.daPct,
      cashConversion.nwcPct,
      terminalGrowth,
      wacc,
    );
    tv = termResult.tv;
    pvTv = termResult.pvTv;
  }

  const sumPvFcfs = pvFcfs.reduce((a, b) => a + b, 0);
  const ev = sumPvFcfs + pvTv;
  const equityValue = ev - capitalStructure.netDebt;

  let impliedValue: number;
  if (market.mode === 'price') {
    impliedValue = equityValue / market.sharesOutstanding;
  } else {
    impliedValue = equityValue;
  }

  return {
    impliedCAGR: g,
    revenues,
    projections,
    terminalValue: tv,
    pvTerminalValue: pvTv,
    enterpriseValue: ev,
    equityValue,
    impliedValue,
    target: getTarget(inputs),
  };
}

export function checkFcf5(g: number, inputs: DcfInputs): SolverError | null {
  const { revenue0, cashConversion, forecast } = inputs;
  const revenues = projectRevenue(revenue0, g, FORECAST_YEARS);
  const margins = getMargins(cashConversion);

  let fcf5: number;

  if (cashConversion.mode === 'fcfMargin') {
    fcf5 = revenues[FORECAST_YEARS] * margins[FORECAST_YEARS];
  } else {
    const rev5 = revenues[FORECAST_YEARS];
    const ebit5 = rev5 * margins[FORECAST_YEARS];
    const nopat5 = ebit5 * (1 - cashConversion.taxRate);
    const da5 = rev5 * cashConversion.daPct;
    const capex5 = rev5 * cashConversion.capexPct;
    const nwc5 = rev5 * cashConversion.nwcPct;
    const nwc4 = revenues[FORECAST_YEARS - 1] * cashConversion.nwcPct;
    const deltaNwc5 = nwc5 - nwc4;
    fcf5 = nopat5 + da5 - capex5 - deltaNwc5;
  }

  if (fcf5 < 0) {
    return {
      type: 'negative_fcf5',
      message:
        'FCF in the last explicit year is negative, therefore Gordon terminal value cannot be used.',
    };
  }

  if (forecast.wacc <= forecast.terminalGrowth) {
    return {
      type: 'wacc_lte_gt',
      message: 'WACC must be greater than the terminal growth rate.',
    };
  }

  return null;
}
