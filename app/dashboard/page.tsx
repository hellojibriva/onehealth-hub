'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import RCCEAlertBanner from '@/components/RCCEAlertBanner'

type Sector = 'HUMAN' | 'ANIMAL' | 'ENVIRONMENTAL' | 'ALL'
type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'INFO' | 'WARNING'
type Status = 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'MONITORING'

interface Location {
  id: string
  name: string
  lga: string
  state: string
  geopolitical_zone: string
}

interface Outbreak {
  id: string
  disease_name: string
  sector: Sector
  status: Status
  severity: Severity
  start_date: string
  description: string
  reported_by: string
  locations: Location
}

interface Alert {
  id: string
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  is_read: boolean
  created_at: string
  outbreaks: { disease_name: string; sector: string } | null
}

interface CaseTrend {
  report_date: string
  confirmed_cases: number
  deaths: number
  recovered: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const sectorColors: Record<string, string> = {
  HUMAN: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  ANIMAL: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  ENVIRONMENTAL: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
}

const severityColors: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  MODERATE: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  HIGH: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-300 border border-red-500/30',
  INFO: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  WARNING: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'text-red-400',
  CONTAINED: 'text-amber-400',
  RESOLVED: 'text-emerald-400',
  MONITORING: 'text-sky-400',
}

const statusDot: Record<string, string> = {
  ACTIVE: 'bg-red-400 animate-pulse',
  CONTAINED: 'bg-amber-400',
  RESOLVED: 'bg-emerald-400',
  MONITORING: 'bg-sky-400',
}

export default function DashboardPage() {
  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [caseTrends, setCaseTrends] = useState<CaseTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [sectorFilter, setSectorFilter] = useState<Sector>('ALL')
  const [activeTab, setActiveTab] = useState<'outbreaks' | 'trends' | 'alerts'>('outbreaks')
  const [userZone, setUserZone] = useState<string | undefined>(undefined)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('state')
          .eq('id', user.id)
          .single()
        if (profile?.state) {
          const zoneMap: Record<string, string> = {
            'FCT': 'North Central', 'Nasarawa': 'North Central', 'Niger': 'North Central',
            'Benue': 'North Central', 'Kogi': 'North Central', 'Kwara': 'North Central', 'Plateau': 'North Central',
            'Lagos': 'South West', 'Ogun': 'South West', 'Oyo': 'South West',
            'Osun': 'South West', 'Ondo': 'South West', 'Ekiti': 'South West',
            'Kano': 'North West', 'Kaduna': 'North West', 'Katsina': 'North West',
            'Kebbi': 'North West', 'Sokoto': 'North West', 'Zamfara': 'North West', 'Jigawa': 'North West',
            'Borno': 'North East', 'Yobe': 'North East', 'Adamawa': 'North East',
            'Taraba': 'North East', 'Bauchi': 'North East', 'Gombe': 'North East',
            'Anambra': 'South East', 'Enugu': 'South East', 'Imo': 'South East',
            'Abia': 'South East', 'Ebonyi': 'South East',
            'Rivers': 'South South', 'Delta': 'South South', 'Edo': 'South South',
            'Bayelsa': 'South South', 'Cross River': 'South South', 'Akwa Ibom': 'South South',
          }
          setUserZone(zoneMap[profile.state] ?? undefined)
        }
      }

      const [outbreakRes, alertRes, caseRes] = await Promise.all([
        supabase.from('outbreaks').select('*, locations(*)').order('start_date', { ascending: false }),
        supabase.from('alerts').select('*, outbreaks(disease_name, sector)').order('created_at', { ascending: false }).limit(10),
        supabase.from('cases').select('report_date, confirmed_cases, deaths, recovered').order('report_date', { ascending: true }).limit(30),
      ])

      if (outbreakRes.data) setOutbreaks(outbreakRes.data as Outbreak[])
      if (alertRes.data) setAlerts(alertRes.data as Alert[])
      if (caseRes.data) {
        const byDate: Record<string, CaseTrend> = {}
        caseRes.data.forEach((c: CaseTrend) => {
          if (!byDate[c.report_date]) {
            byDate[c.report_date] = { report_date: c.report_date, confirmed_cases: 0, deaths: 0, recovered: 0 }
          }
          byDate[c.report_date].confirmed_cases += c.confirmed_cases
          byDate[c.report_date].deaths += c.deaths
          byDate[c.report_date].recovered += c.recovered
        })
        setCaseTrends(Object.values(byDate))
      }

      setLoading(false)
    }

    fetchAll()

    const channel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
        setAlerts((prev) => [payload.new as Alert, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = sectorFilter === 'ALL' ? outbreaks : outbreaks.filter(o => o.sector === sectorFilter)
  const activeCount = outbreaks.filter(o => o.status === 'ACTIVE').length
  const criticalCount = outbreaks.filter(o => o.severity === 'CRITICAL').length
  const humanCount = outbreaks.filter(o => o.sector === 'HUMAN').length
  const animalCount = outbreaks.filter(o => o.sector === 'ANIMAL').length
  const envCount = outbreaks.filter(o => o.sector === 'ENVIRONMENTAL').length
  const unreadAlerts = alerts.filter(a => !a.is_read).length

  const sectorData = [
    { sector: 'Human', count: humanCount, fill: '#f43f5e' },
    { sector: 'Animal', count: animalCount, fill: '#10b981' },
    { sector: 'Environmental', count: envCount, fill: '#38bdf8' },
  ]

  return (
    <div className="min-h-screen bg-slate-950">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="text-emerald-400 text-sm font-bold">1H</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm leading-none">OneHealth Hub</h1>
              <p className="text-slate-400 text-xs mt-0.5">Integrated Zoonotic Disease Surveillance · Nigeria</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/rcce"
              className="text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              📣 Community Alerts
            </a>
            <a
              href="/collect"
              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-full transition-colors font-semibold"
            >
              + Report
            </a>
            <a
              href="/export"
              className="text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              ↓ Export
            </a>
            {unreadAlerts > 0 && (
              <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-1 rounded-full">
                {unreadAlerts} new alert{unreadAlerts > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* RCCE Banner */}
        <RCCEAlertBanner userZone={userZone} />

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active outbreaks', value: activeCount, accent: 'text-red-400', sub: '+1 this week' },
            { label: 'Critical severity', value: criticalCount, accent: 'text-orange-400', sub: 'Require action' },
            { label: 'Unread alerts', value: unreadAlerts, accent: 'text-amber-400', sub: 'Pending review' },
            { label: 'Events tracked', value: outbreaks.length, accent: 'text-emerald-400', sub: 'All sectors' },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-400 text-xs mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.accent}`}>
                {loading ? '—' : card.value}
              </p>
              <p className="text-slate-500 text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white text-sm font-medium mb-4">Outbreak trends over time</h2>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading chart…</div>
            ) : caseTrends.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No case data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={caseTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="report_date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="confirmed_cases" stroke="#f43f5e" strokeWidth={2} dot={false} name="Confirmed" />
                  <Line type="monotone" dataKey="deaths" stroke="#fb923c" strokeWidth={2} dot={false} name="Deaths" />
                  <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2} dot={false} name="Recovered" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white text-sm font-medium mb-4">By sector</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sectorData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="sector" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="count" name="Outbreaks" radius={[4, 4, 0, 0]}>
                  {sectorData.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit mb-6">
            {(['outbreaks', 'trends', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors capitalize ${
                  activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab} {tab === 'alerts' && unreadAlerts > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadAlerts}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'outbreaks' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['ALL', 'HUMAN', 'ANIMAL', 'ENVIRONMENTAL'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSectorFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      sectorFilter === s
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-slate-500 text-sm py-8 text-center">Loading outbreaks…</div>
              ) : filtered.length === 0 ? (
                <div className="text-slate-500 text-sm py-8 text-center">No outbreaks found for this filter.</div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((outbreak) => (
                    <div key={outbreak.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[outbreak.status]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[outbreak.status]}`} />
                              {outbreak.status}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sectorColors[outbreak.sector]}`}>
                              {outbreak.sector}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[outbreak.severity]}`}>
                              {outbreak.severity}
                            </span>
                          </div>
                          <h3 className="text-white font-semibold">{outbreak.disease_name}</h3>
                          <p className="text-slate-400 text-sm mt-1">{outbreak.description}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500 shrink-0">
                          <p className="text-slate-300 font-medium">{outbreak.locations?.state}</p>
                          <p>{outbreak.locations?.lga}</p>
                          <p className="mt-1">Since {new Date(outbreak.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-slate-600 mt-1">Reported by: {outbreak.reported_by}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-400 text-sm">Detailed trends view coming in Phase 2.</p>
              <p className="text-slate-600 text-xs mt-1">Will include per-disease, per-zone, and cross-sector trend analysis.</p>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-slate-500 text-sm py-8 text-center">Loading alerts…</div>
              ) : alerts.length === 0 ? (
                <div className="text-slate-500 text-sm py-8 text-center">No alerts yet.</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id}
                    className={`bg-slate-900 border rounded-xl p-5 transition-colors ${
                      alert.is_read ? 'border-slate-800' : 'border-slate-700'
                    }`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[alert.severity]}`}>
                            {alert.severity}
                          </span>
                          {!alert.is_read && <span className="w-2 h-2 bg-red-400 rounded-full" />}
                          {alert.outbreaks && (
                            <span className="text-slate-500 text-xs">{alert.outbreaks.disease_name}</span>
                          )}
                        </div>
                        <p className="text-white font-medium text-sm">{alert.title}</p>
                        <p className="text-slate-400 text-sm mt-1">{alert.message}</p>
                      </div>
                      <p className="text-slate-600 text-xs shrink-0">
                        {new Date(alert.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <footer className="border-t border-slate-800 pt-6 text-center">
          <p className="text-slate-600 text-xs">
            OneHealth Hub · Integrated Zoonotic Disease Surveillance · Built with Next.js + Supabase
          </p>
        </footer>
      </main>
    </div>
  )
}