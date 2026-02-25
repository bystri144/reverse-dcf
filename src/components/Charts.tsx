import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { DcfResult, Currency, UnitScale } from '../types';
import { unitLabel, formatNumber } from '../utils/format';

interface Props {
  result: DcfResult;
  currency: Currency;
  unitScale: UnitScale;
}

const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#f97316'];

export default function Charts({ result, currency, unitScale }: Props) {
  const units = unitLabel(currency, unitScale);

  const revenueData = result.revenues.map((rev, i) => ({
    year: `Y${i}`,
    Revenue: Math.round(rev * 10) / 10,
  }));

  const fcfData = result.projections.map((p) => ({
    year: `Y${p.year}`,
    FCF: Math.round(p.fcf * 10) / 10,
  }));

  const pvData = [
    ...result.projections.map((p) => ({
      name: `Y${p.year} FCF`,
      value: Math.round(p.pvFcf * 10) / 10,
    })),
    {
      name: 'Terminal',
      value: Math.round(result.pvTerminalValue * 10) / 10,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatNumber(p.value)} {units}
          </p>
        ))}
      </div>
    );
  };

  const BarTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-medium">{payload[0]?.payload?.name}</p>
        <p>PV: {formatNumber(payload[0]?.value)} {units}</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-white p-4">
        <h4 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">
          Revenue ({units})
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: '#2563eb', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <h4 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">
          Free Cash Flow ({units})
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={fcfData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="FCF"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ fill: '#16a34a', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-border bg-white p-4 lg:col-span-2">
        <h4 className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wide">
          PV Contribution ({units})
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={pvData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip content={<BarTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {pvData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
