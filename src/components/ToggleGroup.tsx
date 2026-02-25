interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ToggleGroup({ options, value, onChange, label }: Props) {
  return (
    <div className="mb-3">
      {label && (
        <label className="block text-xs font-medium text-text-muted mb-1.5">{label}</label>
      )}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt.value
                ? 'bg-primary text-white'
                : 'bg-white text-text-muted hover:bg-surface-alt'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
