'use client';

import { useEffect, useState } from 'react';
import StatCards from '@/components/StatCards';
import NigeriaMap from '@/components/NigeriaMap';
import TrendChart from '@/components/TrendChart';
import AlertBell from '@/components/AlertBell';
import ExportButton from '@/components/ExportButton';
import { getActiveOutbreaks, getDashboardStats } from '@/lib/outbreaks';
import type { OutbreakEvent, DashboardStats } from '@/types/outbreak';

const SECTOR_COLORS: Record<string, string> = {
  human:         '#E24B4A',
  animal:        '#BA7517',
  environmental: '#1D9E75',
  zoonotic:      '#378ADD',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#E24B4A',
  high:     '#BA7517',
  moderate: '#1D9E75',
  low:      '#888',
};

function timeAgo(iso: string) {
  const diffHrs = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (diffHrs < 1)  return 'Just now';
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [outbreaks, setOutbreaks] = useState<OutbreakEvent[]>([]);
  const [stats, setStats]         = useState<DashboardStats>({
    activeOutbreaks: 0, criticalSeverity: 0, unreadAlerts: 0,
    totalTracked: 0, statesAffected: 0, weeklyChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [o, s] = await Promise.all([getActiveOutbreaks(), getDashboardStats()]);
      setOutbreaks(o);
      setStats(s);
      setLoading(false);
    }
    load();
  }, []);

  const sectors = ['human', 'animal', 'environmental', 'zoonotic'] as const;
  const sectorCounts = sectors.map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: outbreaks.filter(o => o.sector === s).length,
    color: SECTOR_COLORS[s],
  }));
  const maxCount = Math.max(...sectorCounts.map(c => c.count), 1);

  const recent = [...outbreaks]
    .sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime())
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              OneHealth Hub
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Integrated Zoonotic Disease Surveillance · Nigeria
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton outbreaks={outbreaks} />
            <AlertBell />
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <StatCards data={stats} />
        )}

        {/* Map */}
        <section>
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Outbreak map — Nigeria
          </h2>
          {loading ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 h-[520px] bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : (
            <NigeriaMap outbreaks={outbreaks} />
          )}
        </section>

        {/* Trend chart */}
        <TrendChart outbreaks={outbreaks} />

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Sector breakdown */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Outbreaks by sector</h3>
            <div className="space-y-3">
              {sectorCounts.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0">{c.label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.count / maxCount) * 100}%`, background: c.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-6 text-right">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent alerts */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Recent alerts</h3>
            <div className="space-y-3">
              {recent.length === 0 && !loading && (
                <p className="text-sm text-gray-400">No active alerts.</p>
              )}
              {recent.map(o => (
                <div key={o.id} className="flex gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: SEVERITY_COLORS[o.severity] ?? '#888' }}
                  />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {o.disease} — {o.location_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.severity.charAt(0).toUpperCase() + o.severity.slice(1)} · {timeAgo(o.reported_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}