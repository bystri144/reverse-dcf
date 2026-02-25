import type { Currency, UnitScale } from '../types';
import { UNIT_LABELS } from '../engine/constants';

export function formatNumber(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return (value * 100).toFixed(decimals) + '%';
}

export function unitLabel(currency: Currency, unit: UnitScale): string {
  return `${currency}, ${UNIT_LABELS[unit]}`;
}

export function formatTableNumber(value: number): string {
  return formatNumber(value, 1);
}
