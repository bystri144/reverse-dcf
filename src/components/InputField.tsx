import Tooltip from './Tooltip';

interface Props {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
  suffix?: string;
  tooltip?: string;
  error?: string;
  step?: string;
  min?: string;
  disabled?: boolean;
}

export default function InputField({
  label,
  value,
  onChange,
  suffix,
  tooltip,
  error,
  step = 'any',
  min,
  disabled,
}: Props) {
  return (
    <div className="mb-3">
      <label className="flex items-center gap-1 text-xs font-medium text-text-muted mb-1">
        {label}
        {suffix && <span className="text-text-muted/60">({suffix})</span>}
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-[10px] text-gray-500 cursor-help font-bold">?</span>
          </Tooltip>
        )}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        min={min}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-error focus:ring-error/30'
            : 'border-border focus:ring-primary/30'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
