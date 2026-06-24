'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

interface Alert {
  id:          string;
  title:       string;
  body?:       string | null;
  severity:    string;
  is_read:     boolean;
  created_at:  string;
}

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

export default function AlertBell() {
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  useEffect(() => {
    const supabase = getSupabase();

    async function fetchAlerts() {
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setAlerts((data ?? []) as Alert[]);
      setLoading(false);
    }
    fetchAlerts();

    const channel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          setAlerts(prev => [payload.new as Alert, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    const supabase = getSupabase();
    await supabase.from('alerts').update({ is_read: true }).eq('is_read', false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Alerts"
      >
        <Bell size={18} className="text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Alerts {unreadCount > 0 && <span className="text-red-500">({unreadCount} unread)</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-teal-600 hover:text-teal-500 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="p-4 text-sm text-gray-400 text-center">Loading...</div>
            )}
            {!loading && alerts.length === 0 && (
              <div className="p-4 text-sm text-gray-400 text-center">No alerts yet.</div>
            )}
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`flex gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                  !alert.is_read ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: SEVERITY_COLORS[alert.severity] ?? '#888' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug font-medium">
                    {alert.title}
                  </p>
                  {alert.body && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(alert.created_at)}</p>
                </div>
                {!alert.is_read && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}