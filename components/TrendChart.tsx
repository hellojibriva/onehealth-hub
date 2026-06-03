'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { OutbreakEvent } from '@/types/outbreak';

interface Props {
  outbreaks: OutbreakEvent[];
}

const SECTOR_COLORS: Record<string, string> = {
  human:         '#E24B4A',
  animal:        '#BA7517',
  environmental: '#1D9E75',
  zoonotic:      '#378ADD',
};

const SECTORS = ['human', 'animal', 'environmental', 'zoonotic'] as const;

function buildChartData(outbreaks: OutbreakEvent[]) {
  // Group outbreaks by month and sector
  const map: Record<string, Record<string, number>> = {};

  outbreaks.forEach(o => {
    const date = new Date(o.reported_at);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!map[month]) map[month] = { human: 0, animal: 0, environmental: 0, zoonotic: 0 };
    const sector = o.sector?.toLowerCase();
    if (sector && map[month][sector] !== undefined) {
      map[month][sector]++;
    }
  });

  // Sort by date and format for display
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }),
      ...counts,
    }));
}

export default function TrendChart({ outbreaks }: Props) {
  const data = buildChartData(outbreaks);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Outbreak trends over time</h3>
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No trend data available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Outbreak trends over time</h3>
        <span className="text-xs text-gray-400">All time · by sector</span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--tw-bg, #1f2937)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#E5E7EB', marginBottom: 4 }}
            itemStyle={{ color: '#D1D5DB' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          />
          {SECTORS.map(sector => (
            <Line
              key={sector}
              type="monotone"
              dataKey={sector}
              name={sector.charAt(0).toUpperCase() + sector.slice(1)}
              stroke={SECTOR_COLORS[sector]}
              strokeWidth={2}
              dot={{ r: 3, fill: SECTOR_COLORS[sector] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}