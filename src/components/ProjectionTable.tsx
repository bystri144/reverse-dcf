import type { DcfResult, CashConversionMode, Currency, UnitScale } from '../types';
import { formatTableNumber, formatPercent, unitLabel } from '../utils/format';

interface Props {
  result: DcfResult;
  cashConversionMode: CashConversionMode;
  currency: Currency;
  unitScale: UnitScale;
}

export default function ProjectionTable({ result, cashConversionMode, currency, unitScale }: Props) {
  const units = unitLabel(currency, unitScale);
  const isEbit = cashConversionMode === 'ebitBased';

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="p-4 border-b border-border">
        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
          Projection Table ({units})
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt">
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">Metric</th>
              {result.projections.map((p) => (
                <th key={p.year} className="text-right px-4 py-2 text-xs font-medium text-text-muted">
                  Year {p.year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <Row label="Revenue" values={result.projections.map((p) => formatTableNumber(p.revenue))} />
            <Row
              label={isEbit ? 'EBIT Margin' : 'FCF Margin'}
              values={result.projections.map((p) => formatPercent(p.margin))}
            />
            {isEbit && (
              <>
                <Row label="EBIT" values={result.projections.map((p) => formatTableNumber(p.ebit!))} />
                <Row label="NOPAT" values={result.projections.map((p) => formatTableNumber(p.nopat!))} />
                <Row label="D&A" values={result.projections.map((p) => formatTableNumber(p.da!))} />
                <Row label="Capex" values={result.projections.map((p) => formatTableNumber(p.capex!))} />
                <Row label="NWC" values={result.projections.map((p) => formatTableNumber(p.nwc!))} />
                <Row label="ΔNWC" values={result.projections.map((p) => formatTableNumber(p.deltaNwc!))} />
              </>
            )}
            <Row label="FCF" values={result.projections.map((p) => formatTableNumber(p.fcf))} bold />
            <Row label="PV(FCF)" values={result.projections.map((p) => formatTableNumber(p.pvFcf))} />
          </tbody>
          <tfoot>
            <tr className="bg-surface-alt">
              <td className="px-4 py-2 text-xs font-medium text-text-muted">Terminal Value (PV)</td>
              <td colSpan={5} className="text-right px-4 py-2 text-xs font-semibold">
                {formatTableNumber(result.pvTerminalValue)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Row({ label, values, bold }: { label: string; values: string[]; bold?: boolean }) {
  return (
    <tr>
      <td className={`px-4 py-1.5 text-xs ${bold ? 'font-semibold' : 'text-text-muted'}`}>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`text-right px-4 py-1.5 text-xs tabular-nums ${bold ? 'font-semibold' : ''}`}>
          {v}
        </td>
      ))}
    </tr>
  );
}
