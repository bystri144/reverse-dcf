import type { Currency, UnitScale } from '../types';

export const CURRENCIES: Currency[] = [
  'CZK', 'USD', 'EUR',
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'DKK', 'GBP',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW',
  'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RON',
  'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR',
];

export const UNIT_LABELS: Record<UnitScale, string> = {
  thousands: 'thousands',
  millions: 'millions',
  billions: 'billions',
};

export const DEFAULTS = {
  currency: 'CZK' as Currency,
  unitScale: 'millions' as UnitScale,
  wacc: 0.10,
  terminalGrowth: 0.02,
  fcfMargin: 0.10,
  ebitMargin: 0.15,
  taxRate: 0.21,
  daPct: 0.03,
  capexPct: 0.04,
  nwcPct: 0.10,
} as const;
