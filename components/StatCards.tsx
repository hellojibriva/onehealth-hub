'use client';

import { AlertTriangle, Flame, Bell, Activity, MapPin } from 'lucide-react';
import type { DashboardStats } from '@/types/outbreak';

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  variant?: 'danger' | 'warning' | 'success' | 'default';
}

const variantStyles: Record<string, { value: string; sub: string }> = {
  danger:  { value: 'text-red-500',   sub: 'text-red-400'   },
  warning: { value: 'text-amber-500', sub: 'text-amber-400' },
  success: { value: 'text-teal-600',  sub: 'text-teal-500'  },
  default: { value: 'text-gray-900 dark:text-gray-100', sub: 'text-gray-500' },
};

function StatCard({ label, value, sub, icon, variant = 'default' }: StatCardProps) {
  const styles = variantStyles[variant];
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
        <span className="opacity-70">{icon}</span>
        {label}
      </div>
      <div className={`text-2xl font-semibold leading-tight ${styles.value}`}>
        {value}
      </div>
      {sub && (
        <div className={`text-xs ${styles.sub}`}>{sub}</div>
      )}
    </div>
  );
}

export default function StatCards({ data }: { data: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        label="Active outbreaks"
        value={data.activeOutbreaks}
        sub={`+${data.weeklyChange} this week`}
        icon={<AlertTriangle size={14} />}
        variant="danger"
      />
      <StatCard
        label="Critical severity"
        value={data.criticalSeverity}
        sub="Require action"
        icon={<Flame size={14} />}
        variant="danger"
      />
      <StatCard
        label="Unread alerts"
        value={data.unreadAlerts}
        sub="Pending review"
        icon={<Bell size={14} />}
        variant="warning"
      />
      <StatCard
        label="Events tracked"
        value={data.totalTracked}
        sub="All sectors"
        icon={<Activity size={14} />}
        variant="default"
      />
      <StatCard
        label="States affected"
        value={data.statesAffected}
        sub="of 36 states"
        icon={<MapPin size={14} />}
        variant="success"
      />
    </div>
  );
}