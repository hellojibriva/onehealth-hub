'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { RCCEAlert } from '@/lib/rcce-types'

interface Props {
  userZone?: string
  userLanguageCode?: string
}

const ZONE_FLAG: Record<string, string> = {
  'North West':    '🟢',
  'North East':    '🟡',
  'North Central': '🔵',
  'South West':    '🟠',
  'South East':    '🔴',
  'South South':   '🟣',
}

export default function RCCEAlertBanner({ userZone, userLanguageCode }: Props) {
  const [alerts, setAlerts] = useState<RCCEAlert[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveAlerts()
  }, [userZone])

  async function fetchActiveAlerts() {
    const supabase = getSupabase()
    setLoading(true)
    let query = supabase
      .from('rcce_alerts')
      .select('*')
      .eq('status', 'SENT')
      .order('sent_at', { ascending: false })
      .limit(5)

    if (userZone) {
      query = query.eq('geopolitical_zone', userZone)
    }

    const { data, error } = await query
    if (!error && data) setAlerts(data)
    setLoading(false)
  }

  async function markAcknowledged(alertId: string) {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('rcce_deliveries').upsert({
      alert_id: alertId,
      user_id: user.id,
      delivery_channel: 'APP',
      acknowledged_at: new Date().toISOString(),
    })
  }

  if (loading) return <div style={{color: 'red', padding: '10px'}}>RCCE Loading...</div>
 if (alerts.length === 0) return <div style={{color: 'red', padding: '10px'}}>RCCE: No alerts found for zone: {userZone ?? 'no zone'}</div>

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">
          Community Health Alerts
        </h2>
        {userZone && (
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {ZONE_FLAG[userZone] ?? '📍'} {userZone}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-amber-50 overflow-hidden"
          >
            <div className="flex items-start gap-3 p-4">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTypeIcon type={alert.alert_type} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    {alert.disease}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{alert.language_name}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">
                  {alert.title}
                </p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                  {alert.body_text}
                </p>
              </div>

              <button
                onClick={() => {
                  const next = expanded === alert.id ? null : alert.id
                  setExpanded(next)
                  if (next) markAcknowledged(alert.id)
                }}
                className="flex-shrink-0 text-xs text-red-600 font-semibold hover:text-red-800 transition-colors"
              >
                {expanded === alert.id ? 'Less ↑' : 'More ↓'}
              </button>
            </div>

            {expanded === alert.id && (
              <div className="border-t border-red-100 px-4 pb-4 pt-3 space-y-4">
                {alert.prevention_tips?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Prevention Tips
                    </p>
                    <ul className="space-y-1.5">
                      {alert.prevention_tips.map((tip, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-green-500 font-bold mt-0.5">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.action_items?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      What To Do
                    </p>
                    <ul className="space-y-1.5">
                      {alert.action_items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-amber-500 font-bold">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.where_to_go && (
                  <div className="rounded-lg bg-white border border-red-100 px-3 py-2.5 flex gap-2 items-start">
                    <span className="text-base">📍</span>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Where to Go
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">{alert.where_to_go}</p>
                    </div>
                  </div>
                )}

                {alert.ussd_screen_1 && (
                  <div className="rounded-lg bg-gray-900 text-green-400 px-3 py-2.5 font-mono text-xs leading-relaxed">
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">
                      Also available on USSD
                    </p>
                    {alert.ussd_screen_1}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AlertTypeIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    SEASONAL:  '🌦️',
    OUTBREAK:  '🚨',
    ADVISORY:  '🐄',
    USSD:      '📱',
  }
  return <span className="text-xl">{icons[type] ?? '⚠️'}</span>
}
