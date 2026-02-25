export type Currency =
  | 'CZK' | 'USD' | 'EUR'
  | 'AUD' | 'BRL' | 'CAD' | 'CHF' | 'CNY' | 'DKK' | 'GBP'
  | 'HKD' | 'HUF' | 'IDR' | 'ILS' | 'INR' | 'JPY' | 'KRW'
  | 'MXN' | 'MYR' | 'NOK' | 'NZD' | 'PHP' | 'PLN' | 'RON'
  | 'RUB' | 'SEK' | 'SGD' | 'THB' | 'TRY' | 'TWD' | 'ZAR';

export type UnitScale = 'thousands' | 'millions' | 'billions';

export type RevenueBasis = 'LTM' | 'lastFY';

export type ValueTargetMode = 'price' | 'marketCap';

export type CashConversionMode = 'fcfMargin' | 'ebitBased';

export type MarginBehavior = 'constant' | 'ramp';

export interface GlobalSettings {
  currency: Currency;
  unitScale: UnitScale;
  revenueBasis: RevenueBasis;
}

export interface MarketInputsPrice {
  mode: 'price';
  pricePerShare: number;
  sharesOutstanding: number;
}

export interface MarketInputsMarketCap {
  mode: 'marketCap';
  marketCap: number;
}

export type MarketInputs = MarketInputsPrice | MarketInputsMarketCap;

export interface FcfMarginInputs {
  mode: 'fcfMargin';
  marginBehavior: MarginBehavior;
  constantMargin: number;
  baseMargin: number;
  targetMargin: number;
}

export interface EbitBasedInputs {
  mode: 'ebitBased';
  marginBehavior: MarginBehavior;
  constantEbitMargin: number;
  baseEbitMargin: number;
  targetEbitMargin: number;
  taxRate: number;
  daPct: number;
  capexPct: number;
  nwcPct: number;
}

export type CashConversionInputs = FcfMarginInputs | EbitBasedInputs;

export interface ForecastInputs {
  wacc: number;
  terminalGrowth: number;
}

export interface CapitalStructureInputs {
  netDebt: number;
}

export interface DcfInputs {
  revenue0: number;
  market: MarketInputs;
  cashConversion: CashConversionInputs;
  forecast: ForecastInputs;
  capitalStructure: CapitalStructureInputs;
}

export interface YearProjection {
  year: number;
  revenue: number;
  margin: number;
  fcf: number;
  pvFcf: number;
  ebit?: number;
  nopat?: number;
  da?: number;
  capex?: number;
  nwc?: number;
  deltaNwc?: number;
}

export interface DcfResult {
  impliedCAGR: number;
  revenues: number[];
  projections: YearProjection[];
  terminalValue: number;
  pvTerminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  impliedValue: number;
  target: number;
}

export interface SolverError {
  type: 'no_solution' | 'negative_fcf5' | 'wacc_lte_gt' | 'invalid_input';
  message: string;
  details?: {
    impliedAtLow?: number;
    impliedAtHigh?: number;
    target?: number;
  };
}

export type SolverResult =
  | { success: true; result: DcfResult }
  | { success: false; error: SolverError };
