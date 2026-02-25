import type { DcfResult, SolverError, Currency, UnitScale, ValueTargetMode } from '../types';
import { formatNumber, formatPercent, unitLabel } from '../utils/format';

interface Props {
  result: DcfResult | null;
  error: SolverError | null;
  loading: boolean;
  currency: Currency;
  unitScale: UnitScale;
  valueMode: ValueTargetMode;
}

export default function OutputPanel({ result, error, loading, currency, unitScale, valueMode }: Props) {
  const units = unitLabel(currency, unitScale);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-error/30 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-error mb-2">Calculation Error</h3>
        <p className="text-sm text-error/80 mb-4">{error.message}</p>
        {error.details && (
          <div className="text-xs text-text-muted space-y-1 border-t border-error/20 pt-3">
            <p>Implied value at lower bound: {formatNumber(error.details.impliedAtLow!)}</p>
            <p>Implied value at upper bound: {formatNumber(error.details.impliedAtHigh!)}</p>
            <p>Target: {formatNumber(error.details.target!)}</p>
          </div>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        Enter your inputs to see the implied revenue CAGR.
      </div>
    );
  }

  const valueLabel = valueMode === 'price' ? 'Implied Price per Share' : 'Implied Market Cap';
  const targetLabel = valueMode === 'price' ? 'Market Price' : 'Market Cap';
  const valueSuffix = valueMode === 'price' ? currency : units;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white">
        <p className="text-sm opacity-80 mb-1">Implied Revenue CAGR (Years 1–5)</p>
        <p className="text-4xl font-bold tracking-tight">{formatPercent(result.impliedCAGR)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Enterprise Value"
          value={formatNumber(result.enterpriseValue)}
          suffix={units}
        />
        <MetricCard
          label="Equity Value"
          value={formatNumber(result.equityValue)}
          suffix={units}
        />
        <MetricCard
          label={valueLabel}
          value={formatNumber(result.impliedValue)}
          suffix={valueSuffix}
        />
        <MetricCard
          label={targetLabel}
          value={formatNumber(result.target)}
          suffix={valueSuffix}
        />
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <h4 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">Value Bridge</h4>
        <div className="flex items-center gap-2 text-sm">
          <BridgeStep label="EV" value={formatNumber(result.enterpriseValue)} suffix={units} />
          <span className="text-text-muted">−</span>
          <BridgeStep label="Net Debt" value={formatNumber(result.enterpriseValue - result.equityValue)} suffix={units} />
          <span className="text-text-muted">=</span>
          <BridgeStep label="Equity" value={formatNumber(result.equityValue)} suffix={units} highlight />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-text-muted">{suffix}</p>
    </div>
  );
}

function BridgeStep({ label, value, suffix, highlight }: { label: string; value: string; suffix: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 text-center ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-surface-alt'}`}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</p>
      <p className="text-[10px] text-text-muted">{suffix}</p>
    </div>
  );
}
