import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  Currency,
  UnitScale,
  RevenueBasis,
  MarketInputs as MarketInputsType,
  CashConversionInputs,
  DcfInputs,
  DcfResult,
  SolverError,
} from './types';
import { DEFAULTS } from './engine/constants';
import { solveImpliedCAGR } from './engine/solver';
import { unitLabel } from './utils/format';
import GlobalSettings from './components/GlobalSettings';
import MarketInputsComp from './components/MarketInputs';
import CashConversion from './components/CashConversion';
import InputField from './components/InputField';
import OutputPanel from './components/OutputPanel';
import Charts from './components/Charts';
import ProjectionTable from './components/ProjectionTable';

function pctToStr(v: number): string {
  return v ? (v * 100).toString() : '';
}

function strToPct(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n / 100;
}

export default function App() {
  const [currency, setCurrency] = useState<Currency>(DEFAULTS.currency);
  const [unitScale, setUnitScale] = useState<UnitScale>(DEFAULTS.unitScale);
  const [revenueBasis, setRevenueBasis] = useState<RevenueBasis>('LTM');

  const [market, setMarket] = useState<MarketInputsType>({
    mode: 'price',
    pricePerShare: 0,
    sharesOutstanding: 0,
  });

  const [revenue0, setRevenue0] = useState<number>(0);
  const [netDebt, setNetDebt] = useState<number>(0);
  const [wacc, setWacc] = useState<number>(DEFAULTS.wacc);
  const [terminalGrowth, setTerminalGrowth] = useState<number>(DEFAULTS.terminalGrowth);

  const [cashConversion, setCashConversion] = useState<CashConversionInputs>({
    mode: 'fcfMargin',
    marginBehavior: 'constant',
    constantMargin: DEFAULTS.fcfMargin,
    baseMargin: 0.05,
    targetMargin: 0.15,
  });

  const [result, setResult] = useState<DcfResult | null>(null);
  const [error, setError] = useState<SolverError | null>(null);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleGlobal = (field: string, value: string) => {
    if (field === 'currency') setCurrency(value as Currency);
    if (field === 'unitScale') setUnitScale(value as UnitScale);
    if (field === 'revenueBasis') setRevenueBasis(value as RevenueBasis);
  };

  const compute = useCallback(() => {
    const hasTarget = market.mode === 'price'
      ? market.pricePerShare > 0 && market.sharesOutstanding > 0
      : market.marketCap > 0;

    if (!hasTarget || revenue0 <= 0) {
      setResult(null);
      setError(null);
      return;
    }

    setLoading(true);

    const inputs: DcfInputs = {
      revenue0,
      market,
      cashConversion,
      forecast: { wacc, terminalGrowth },
      capitalStructure: { netDebt },
    };

    setTimeout(() => {
      const solverResult = solveImpliedCAGR(inputs);
      if (solverResult.success) {
        setResult(solverResult.result);
        setError(null);
      } else {
        setResult(null);
        setError(solverResult.error);
      }
      setLoading(false);
    }, 0);
  }, [revenue0, market, cashConversion, wacc, terminalGrowth, netDebt]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(compute, 200);
    return () => clearTimeout(debounceRef.current);
  }, [compute]);

  const units = unitLabel(currency, unitScale);
  const basisHint = revenueBasis === 'LTM'
    ? 'Ensure all inputs (margins, net debt) are based on the Last Twelve Months.'
    : 'Ensure all inputs (margins, net debt) are based on the Last Fiscal Year.';

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text">Reverse DCF</h1>
            <p className="text-xs text-text-muted">Implied Revenue Growth Calculator</p>
          </div>
          <GlobalSettings
            currency={currency}
            unitScale={unitScale}
            revenueBasis={revenueBasis}
            onChange={handleGlobal}
          />
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-xs text-blue-700">
          {basisHint}
        </div>

        <div className="flex gap-6 items-start">
          {/* Left Panel */}
          <div className="w-[360px] shrink-0 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
            <Section title="Market Value">
              <MarketInputsComp
                market={market}
                currency={currency}
                unitScale={unitScale}
                onChange={setMarket}
              />
            </Section>

            <Section title="Operating Base">
              <InputField
                label="Revenue"
                suffix={units}
                value={revenue0 || ''}
                onChange={(v) => setRevenue0(parseFloat(v) || 0)}
                tooltip={`Base revenue (${revenueBasis === 'LTM' ? 'Last Twelve Months' : 'Last Fiscal Year'}).`}
              />
            </Section>

            <Section title="Capital Structure">
              <InputField
                label="Net Debt"
                suffix={units}
                value={netDebt || ''}
                onChange={(v) => setNetDebt(parseFloat(v) || 0)}
                tooltip="Net Debt = Total Debt − Cash. Negative means net cash (increases equity value)."
              />
            </Section>

            <Section title="Forecast & Discounting">
              <InputField
                label="WACC"
                suffix="%"
                value={pctToStr(wacc)}
                onChange={(v) => setWacc(strToPct(v))}
                tooltip="Weighted Average Cost of Capital. Must be greater than terminal growth."
                error={wacc <= terminalGrowth && wacc > 0 ? 'Must be > terminal growth' : undefined}
              />
              <InputField
                label="Terminal Growth Rate"
                suffix="%"
                value={pctToStr(terminalGrowth)}
                onChange={(v) => setTerminalGrowth(strToPct(v))}
                tooltip="Long-term perpetual growth rate for the Gordon Growth Model. Default 2%."
              />
              <p className="text-[10px] text-text-muted">
                Explicit forecast: 5 years &middot; End-year discounting &middot; Gordon Growth terminal value
              </p>
            </Section>

            <Section title="Cash Conversion">
              <CashConversion
                cashConversion={cashConversion}
                onChange={setCashConversion}
              />
            </Section>
          </div>

          {/* Main Panel */}
          <div className="flex-1 min-w-0 space-y-4">
            <OutputPanel
              result={result}
              error={error}
              loading={loading}
              currency={currency}
              unitScale={unitScale}
              valueMode={market.mode}
            />

            {result && (
              <>
                <Charts
                  result={result}
                  currency={currency}
                  unitScale={unitScale}
                />
                <ProjectionTable
                  result={result}
                  cashConversionMode={cashConversion.mode}
                  currency={currency}
                  unitScale={unitScale}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <h3 className="text-xs font-semibold text-text uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}
