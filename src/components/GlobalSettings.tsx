import type { Currency, UnitScale, RevenueBasis } from '../types';
import { CURRENCIES } from '../engine/constants';

interface Props {
  currency: Currency;
  unitScale: UnitScale;
  revenueBasis: RevenueBasis;
  onChange: (field: string, value: string) => void;
}

export default function GlobalSettings({ currency, unitScale, revenueBasis, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[120px]">
        <label className="block text-xs font-medium text-text-muted mb-1">Currency</label>
        <select
          value={currency}
          onChange={(e) => onChange('currency', e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[120px]">
        <label className="block text-xs font-medium text-text-muted mb-1">Units</label>
        <select
          value={unitScale}
          onChange={(e) => onChange('unitScale', e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="thousands">Thousands</option>
          <option value="millions">Millions</option>
          <option value="billions">Billions</option>
        </select>
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-medium text-text-muted mb-1">Revenue Basis</label>
        <select
          value={revenueBasis}
          onChange={(e) => onChange('revenueBasis', e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="LTM">LTM (Last Twelve Months)</option>
          <option value="lastFY">Last Fiscal Year</option>
        </select>
      </div>
    </div>
  );
}
