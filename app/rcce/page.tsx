// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import {
  RCCEAlert, AlertStatus, AlertType,
  GEOPOLITICAL_ZONES, ZONE_PRIMARY_LANGUAGE,
  SUPPORTED_LANGUAGES, MONTHS, DISEASE_OPTIONS,
  ALERT_TYPE_LABELS, STATUS_COLORS, USSD_CHAR_LIMIT,
} from '@/lib/rcce-types'

type Tab = 'compose' | 'manage' | 'history'

const EMPTY_FORM = {
  title: '',
  disease: '',
  alert_type: 'SEASONAL' as AlertType,
  geopolitical_zone: '',
  language_code: 'en',
  language_name: 'English',
  body_text: '',
  prevention_tips: ['', '', '', ''],
  action_items: ['', '', ''],
  where_to_go: '',
  ussd_screen_1: '',
  ussd_screen_2: '',
  ussd_screen_3: '',
  trigger_month: undefined as number | undefined,
}

export default function RCCEPage() {
  const [tab, setTab] = useState<Tab>('manage')
  const [alerts, setAlerts] = useState<RCCEAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterZone, setFilterZone] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => { fetchAlerts() }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function fetchAlerts() {
    const supabase = getSupabase()
    setLoading(true)
    const { data } = await supabase
      .from('rcce_alerts')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setAlerts(data as any)
    setLoading(false)
  }

  function handleZoneChange(zone: string) {
    const lang = ZONE_PRIMARY_LANGUAGE[zone as keyof typeof ZONE_PRIMARY_LANGUAGE]
    setForm(f => ({
      ...f,
      geopolitical_zone: zone,
      language_code: lang?.code ?? 'en',
      language_name: lang?.name ?? 'English',
    }))
  }

  function updateTip(index: number, value: string) {
    setForm(f => {
      const tips = [...f.prevention_tips]
      tips[index] = value
      return { ...f, prevention_tips: tips }
    })
  }

  function updateAction(index: number, value: string) {
    setForm(f => {
      const items = [...f.action_items]
      items[index] = value
      return { ...f, action_items: items }
    })
  }

  async function handleSave(status: AlertStatus) {
    const supabase = getSupabase()
    if (!form.title || !form.disease || !form.geopolitical_zone || !form.body_text) {
      showToast('Please fill in all required fields', 'error')
      return
    }
    setSaving(true)

    const payload = {
      ...form,
      prevention_tips: form.prevention_tips.filter(Boolean),
      action_items: form.action_items.filter(Boolean),
      status,
      sent_at: status === 'SENT' ? new Date().toISOString() : null,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase.from('rcce_alerts').update(payload as any).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('rcce_alerts').insert(payload as any))
    }

    setSaving(false)
    if (error) {
      showToast('Save failed: ' + error.message, 'error')
    } else {
      showToast(status === 'SENT' ? 'Alert sent to community!' : 'Alert saved as ' + status.toLowerCase())
      setForm(EMPTY_FORM)
      setEditingId(null)
      setTab('manage')
      fetchAlerts()
    }
  }

  function handleEdit(alert: RCCEAlert) {
    setForm({
      title: alert.title,
      disease: alert.disease,
      alert_type: alert.alert_type,
      geopolitical_zone: alert.geopolitical_zone,
      language_code: alert.language_code,
      language_name: alert.language_name,
      body_text: alert.body_text,
      prevention_tips: [...(alert.prevention_tips ?? []), '', '', ''].slice(0, 4),
      action_items: [...(alert.action_items ?? []), '', ''].slice(0, 3),
      where_to_go: alert.where_to_go ?? '',
      ussd_screen_1: alert.ussd_screen_1 ?? '',
      ussd_screen_2: alert.ussd_screen_2 ?? '',
      ussd_screen_3: alert.ussd_screen_3 ?? '',
      trigger_month: alert.trigger_month,
    })
    setEditingId(alert.id)
    setTab('compose')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleArchive(id: string) {
    const supabase = getSupabase()
    await supabase.from('rcce_alerts').update({ status: 'ARCHIVED' } as any).eq('id', id)
    fetchAlerts()
    showToast('Alert archived')
  }

  async function handleSendDirect(id: string) {
    const supabase = getSupabase()
    await supabase.from('rcce_alerts')
      .update({ status: 'SENT', sent_at: new Date().toISOString() } as any)
      .eq('id', id)
    fetchAlerts()
    showToast('Alert sent!')
  }

  const filtered = alerts.filter(a => {
    if (filterZone && a.geopolitical_zone !== filterZone) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const ussd1Len = form.ussd_screen_1.length
  const ussd2Len = form.ussd_screen_2.length
  const ussd3Len = form.ussd_screen_3.length

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Risk Communication & Community Engagement
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Compose and schedule seasonal health alerts for communities across all six geopolitical zones
              </p>
            </div>
            <button
              onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setTab('compose') }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + New Alert
            </button>
          </div>

          <div className="flex gap-6 mt-4">
            {(['DRAFT', 'SCHEDULED', 'SENT', 'ARCHIVED'] as AlertStatus[]).map(s => (
              <div key={s} className="text-center">
                <p className="text-lg font-bold text-gray-800">
                  {alerts.filter(a => a.status === s).length}
                </p>
                <p className="text-xs text-gray-500">{s.charAt(0) + s.slice(1).toLowerCase()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-0">
          {([
            { key: 'compose', label: editingId ? '✏️ Edit Alert' : '✏️ Compose' },
            { key: 'manage',  label: '📋 Manage Alerts' },
            { key: 'history', label: '📜 Delivery History' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {tab === 'compose' && (
          <div className="space-y-6">
            <Section title="Alert Details">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Alert Title *</Label>
                  <input
                    className="Input"
                    placeholder="e.g. Lassa Fever Dry Season Warning — North West"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Disease *</Label>
                  <select className="Input" value={form.disease}
                    onChange={e => setForm(f => ({ ...f, disease: e.target.value }))}>
                    <option value="">Select disease</option>
                    {DISEASE_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <Label>Alert Type *</Label>
                  <select className="Input" value={form.alert_type}
                    onChange={e => setForm(f => ({ ...f, alert_type: e.target.value as AlertType }))}>
                    {Object.entries(ALERT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Geopolitical Zone *</Label>
                  <select className="Input" value={form.geopolitical_zone}
                    onChange={e => handleZoneChange(e.target.value)}>
                    <option value="">Select zone</option>
                    {GEOPOLITICAL_ZONES.map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>

                <div>
                  <Label>Language</Label>
                  <select className="Input" value={form.language_code}
                    onChange={e => {
                      const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value)
                      setForm(f => ({ ...f, language_code: e.target.value, language_name: lang?.name ?? '' }))
                    }}>
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                  {form.geopolitical_zone && (
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-selected for {form.geopolitical_zone}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Auto-trigger Month</Label>
                  <select className="Input" value={form.trigger_month ?? ''}
                    onChange={e => setForm(f => ({
                      ...f, trigger_month: e.target.value ? Number(e.target.value) : undefined
                    }))}>
                    <option value="">Manual only</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Alert sends automatically this month</p>
                </div>
              </div>
            </Section>

            <Section title="Alert Message">
              <Label>Main Body Text * <span className="text-gray-400 font-normal">(in {form.language_name})</span></Label>
              <textarea
                className="Input min-h-[100px] resize-y"
                placeholder="Write the alert message in the selected language..."
                value={form.body_text}
                onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))}
              />

              <div className="mt-4">
                <Label>Prevention Tips (up to 4)</Label>
                <div className="space-y-2">
                  {form.prevention_tips.map((tip, i) => (
                    <input key={i} className="Input" placeholder={`Tip ${i + 1}...`}
                      value={tip} onChange={e => updateTip(i, e.target.value)} />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label>Action Items (up to 3)</Label>
                <div className="space-y-2">
                  {form.action_items.map((item, i) => (
                    <input key={i} className="Input" placeholder={`Action ${i + 1}...`}
                      value={item} onChange={e => updateAction(i, e.target.value)} />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Label>Where to Seek Help</Label>
                <input className="Input"
                  placeholder="e.g. Nearest PHC or call NCDC: 0800-9700-0010"
                  value={form.where_to_go}
                  onChange={e => setForm(f => ({ ...f, where_to_go: e.target.value }))} />
              </div>
            </Section>

            <Section title="USSD Alert Screens" subtitle="Max 160 characters per screen">
              {[
                { key: 'ussd_screen_1', label: 'Screen 1 — Opening (greeting + risk statement)', len: ussd1Len },
                { key: 'ussd_screen_2', label: 'Screen 2 — Prevention tips + menu', len: ussd2Len },
                { key: 'ussd_screen_3', label: 'Screen 3 — Action / referral + end', len: ussd3Len },
              ].map(({ key, label, len }) => (
                <div key={key} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <Label>{label}</Label>
                    <span className={`text-xs font-mono font-semibold ${len > USSD_CHAR_LIMIT ? 'text-red-600' : 'text-gray-400'}`}>
                      {len}/{USSD_CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    className={`Input font-mono text-sm resize-none min-h-[80px] ${len > USSD_CHAR_LIMIT ? 'border-red-400 bg-red-50' : ''}`}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder="Write USSD screen text..."
                  />
                  {(form as any)[key] && (
                    <div className="mt-1 rounded bg-gray-900 text-green-400 font-mono text-xs p-2.5 leading-relaxed whitespace-pre-wrap">
                      {(form as any)[key]}
                    </div>
                  )}
                </div>
              ))}
            </Section>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSave('DRAFT')}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave('SCHEDULED')}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg border border-blue-300 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                Schedule
              </button>
              <button
                onClick={() => handleSave('SENT')}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Sending...' : 'Send Now →'}
              </button>
            </div>
          </div>
        )}

        {tab === 'manage' && (
          <div>
            <div className="flex gap-3 mb-5">
              <select className="Input max-w-xs text-sm" value={filterZone}
                onChange={e => setFilterZone(e.target.value)}>
                <option value="">All Zones</option>
                {GEOPOLITICAL_ZONES.map(z => <option key={z}>{z}</option>)}
              </select>
              <select className="Input max-w-xs text-sm" value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {['DRAFT', 'SCHEDULED', 'SENT', 'ARCHIVED'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 py-8 text-center">Loading alerts...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm font-medium">No alerts yet</p>
                <p className="text-xs mt-1">Compose your first seasonal alert above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(alert => (
                  <div key={alert.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[alert.status]}`}>
                            {alert.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {ALERT_TYPE_LABELS[alert.alert_type]}
                          </span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">
                            {alert.geopolitical_zone} · {alert.language_name}
                          </span>
                          {alert.trigger_month && (
                            <>
                              <span className="text-xs text-gray-400">·</span>
                              <span className="text-xs text-blue-600 font-medium">
                                🗓 Triggers: {MONTHS[alert.trigger_month - 1]}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="font-semibold text-gray-800 text-sm leading-snug">{alert.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{alert.body_text}</p>
                        {alert.ussd_screen_1 && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                            <span>📱</span> USSD screens configured
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {alert.status !== 'SENT' && alert.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleEdit(alert)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {alert.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSendDirect(alert.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                          >
                            Send
                          </button>
                        )}
                        {alert.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleArchive(alert.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <RCCEDeliveryHistory />
        )}
      </div>

      <style jsx>{`
        .Input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          background: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .Input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22,163,74,0.1);
        }
      `}</style>
    </div>
  )
}

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
      {children}
    </label>
  )
}

function RCCEDeliveryHistory() {
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('rcce_deliveries')
        .select('*, rcce_alerts(title, disease, geopolitical_zone, language_name)')
        .order('delivered_at', { ascending: false })
        .limit(50)
      if (data) setDeliveries(data)
      setLoading(false)
    }
    fetchHistory()
  }, [])

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading history...</p>
  if (deliveries.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-3">📬</p>
      <p className="text-sm">No deliveries recorded yet</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {deliveries.map(d => (
        <div key={d.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <span className="text-lg">{d.delivery_channel === 'USSD' ? '📱' : '🔔'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {d.rcce_alerts?.title ?? 'Alert'}
            </p>
            <p className="text-xs text-gray-400">
              {d.delivery_channel} · {d.rcce_alerts?.geopolitical_zone} ·{' '}
              {new Date(d.delivered_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            d.acknowledged_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {d.acknowledged_at ? 'Read' : 'Unread'}
          </span>
        </div>
      ))}
    </div>
  )
}
