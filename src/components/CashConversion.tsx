import type { CashConversionInputs, FcfMarginInputs, EbitBasedInputs } from '../types';
import InputField from './InputField';
import ToggleGroup from './ToggleGroup';

interface Props {
  cashConversion: CashConversionInputs;
  onChange: (cc: CashConversionInputs) => void;
}

function defaultFcf(): FcfMarginInputs {
  return {
    mode: 'fcfMargin',
    marginBehavior: 'constant',
    constantMargin: 0.10,
    baseMargin: 0.05,
    targetMargin: 0.15,
  };
}

function defaultEbit(): EbitBasedInputs {
  return {
    mode: 'ebitBased',
    marginBehavior: 'constant',
    constantEbitMargin: 0.15,
    baseEbitMargin: 0.10,
    targetEbitMargin: 0.20,
    taxRate: 0.21,
    daPct: 0.03,
    capexPct: 0.04,
    nwcPct: 0.10,
  };
}

function pctToStr(v: number): string {
  return v ? (v * 100).toString() : '';
}

function strToPct(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n / 100;
}

export default function CashConversion({ cashConversion: cc, onChange }: Props) {
  const setMode = (mode: string) => {
    onChange(mode === 'fcfMargin' ? defaultFcf() : defaultEbit());
  };

  return (
    <div>
      <ToggleGroup
        label="Cash Conversion"
        value={cc.mode}
        onChange={setMode}
        options={[
          { value: 'fcfMargin', label: 'FCF Margin' },
          { value: 'ebitBased', label: 'EBIT-based' },
        ]}
      />

      <ToggleGroup
        label="Margin Behavior"
        value={cc.marginBehavior}
        onChange={(v) => onChange({ ...cc, marginBehavior: v as 'constant' | 'ramp' })}
        options={[
          { value: 'constant', label: 'Constant' },
          { value: 'ramp', label: 'Ramp to Year 5' },
        ]}
      />

      {cc.mode === 'fcfMargin' ? (
        <FcfMarginFields cc={cc} onChange={onChange} />
      ) : (
        <EbitFields cc={cc} onChange={onChange} />
      )}
    </div>
  );
}

function FcfMarginFields({ cc, onChange }: { cc: FcfMarginInputs; onChange: (v: CashConversionInputs) => void }) {
  if (cc.marginBehavior === 'constant') {
    return (
      <InputField
        label="FCF Margin"
        suffix="%"
        value={pctToStr(cc.constantMargin)}
        onChange={(v) => onChange({ ...cc, constantMargin: strToPct(v) })}
        tooltip="Free Cash Flow as a percentage of revenue, applied uniformly for years 1–5 and terminal."
      />
    );
  }

  return (
    <>
      <InputField
        label="Base FCF Margin (Year 0)"
        suffix="%"
        value={pctToStr(cc.baseMargin)}
        onChange={(v) => onChange({ ...cc, baseMargin: strToPct(v) })}
        tooltip="Current FCF margin. Year 0 starting point for the ramp."
      />
      <InputField
        label="Target FCF Margin (Year 5)"
        suffix="%"
        value={pctToStr(cc.targetMargin)}
        onChange={(v) => onChange({ ...cc, targetMargin: strToPct(v) })}
        tooltip="Target FCF margin by year 5. Years 1–4 are linearly interpolated."
      />
    </>
  );
}

function EbitFields({ cc, onChange }: { cc: EbitBasedInputs; onChange: (v: CashConversionInputs) => void }) {
  return (
    <>
      {cc.marginBehavior === 'constant' ? (
        <InputField
          label="EBIT Margin"
          suffix="%"
          value={pctToStr(cc.constantEbitMargin)}
          onChange={(v) => onChange({ ...cc, constantEbitMargin: strToPct(v) })}
          tooltip="EBIT as a percentage of revenue, applied uniformly for years 1–5 and terminal."
        />
      ) : (
        <>
          <InputField
            label="Base EBIT Margin (Year 0)"
            suffix="%"
            value={pctToStr(cc.baseEbitMargin)}
            onChange={(v) => onChange({ ...cc, baseEbitMargin: strToPct(v) })}
            tooltip="Current EBIT margin. Year 0 starting point for the ramp."
          />
          <InputField
            label="Target EBIT Margin (Year 5)"
            suffix="%"
            value={pctToStr(cc.targetEbitMargin)}
            onChange={(v) => onChange({ ...cc, targetEbitMargin: strToPct(v) })}
            tooltip="Target EBIT margin by year 5. Years 1–4 are linearly interpolated."
          />
        </>
      )}
      <InputField
        label="Tax Rate"
        suffix="%"
        value={pctToStr(cc.taxRate)}
        onChange={(v) => onChange({ ...cc, taxRate: strToPct(v) })}
        tooltip="Corporate tax rate applied to EBIT to compute NOPAT."
      />
      <InputField
        label="D&A (% of Revenue)"
        suffix="%"
        value={pctToStr(cc.daPct)}
        onChange={(v) => onChange({ ...cc, daPct: strToPct(v) })}
        tooltip="Depreciation & Amortization as a percentage of revenue."
      />
      <InputField
        label="Capex (% of Revenue)"
        suffix="%"
        value={pctToStr(cc.capexPct)}
        onChange={(v) => onChange({ ...cc, capexPct: strToPct(v) })}
        tooltip="Capital expenditures as a percentage of revenue for years 1–5."
      />
      <InputField
        label="NWC (% of Revenue)"
        suffix="%"
        value={pctToStr(cc.nwcPct)}
        onChange={(v) => onChange({ ...cc, nwcPct: strToPct(v) })}
        tooltip="Net Working Capital as a percentage of revenue. Changes in NWC affect FCF."
      />
    </>
  );
}
