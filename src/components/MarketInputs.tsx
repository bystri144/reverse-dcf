import type { MarketInputs as MarketInputsType, Currency, UnitScale } from '../types';
import { unitLabel } from '../utils/format';
import InputField from './InputField';
import ToggleGroup from './ToggleGroup';

interface Props {
  market: MarketInputsType;
  currency: Currency;
  unitScale: UnitScale;
  onChange: (market: MarketInputsType) => void;
}

export default function MarketInputs({ market, currency, unitScale, onChange }: Props) {
  const units = unitLabel(currency, unitScale);

  const setMode = (mode: string) => {
    if (mode === 'price') {
      onChange({ mode: 'price', pricePerShare: 0, sharesOutstanding: 0 });
    } else {
      onChange({ mode: 'marketCap', marketCap: 0 });
    }
  };

  return (
    <div>
      <ToggleGroup
        label="Value Target"
        value={market.mode}
        onChange={setMode}
        options={[
          { value: 'price', label: 'Price per Share' },
          { value: 'marketCap', label: 'Market Cap' },
        ]}
      />

      {market.mode === 'price' ? (
        <>
          <InputField
            label="Market Price per Share"
            suffix={currency}
            value={market.pricePerShare || ''}
            onChange={(v) =>
              onChange({ ...market, pricePerShare: parseFloat(v) || 0 })
            }
            tooltip="Current market price per share you want to reverse-engineer."
          />
          <InputField
            label="Shares Outstanding"
            suffix={unitScale}
            value={market.sharesOutstanding || ''}
            onChange={(v) =>
              onChange({ ...market, sharesOutstanding: parseFloat(v) || 0 })
            }
            tooltip="Enter in the same scale as monetary values (e.g., if revenue is in millions, enter shares in millions too)."
            error={market.sharesOutstanding <= 0 && market.sharesOutstanding !== 0 ? 'Must be > 0' : undefined}
          />
        </>
      ) : (
        <InputField
          label="Market Capitalization"
          suffix={units}
          value={market.marketCap || ''}
          onChange={(v) =>
            onChange({ ...market, marketCap: parseFloat(v) || 0 })
          }
          tooltip="Total market capitalization to reverse-engineer."
        />
      )}
    </div>
  );
}
