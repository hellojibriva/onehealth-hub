// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getSupabase } from '@/lib/supabaseClient'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import RCCEAlertBanner from '@/components/RCCEAlertBanner'
import SORMASExportPanel from '@/components/SORMASExportPanel'
import { formatPlace, zoneForState } from '@/lib/geo'
import { normalizeEvent, publicReporter, scrubReporterDetails } from '@/lib/taxonomy'

const NigeriaMap = dynamic(() => import('@/components/NigeriaMap'), { ssr: false })

type Sector = 'HUMAN' | 'ANIMAL' | 'ENVIRONMENTAL' | 'ZOONOTIC' | 'ALL'

// One label set for the four One Health sectors, used by the filter chips.
const SECTOR_LABELS: Record<Sector, string> = {
  ALL:           'All sectors',
  HUMAN:         'Human',
  ANIMAL:        'Animal',
  ENVIRONMENTAL: 'Environmental',
  ZOONOTIC:      'Zoonotic',
}

const EVENT_TYPE_STYLE: Record<string, string> = {
  DISEASE: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  SIGNAL:  'bg-teal-500/20 text-teal-300 border border-teal-500/30',
}
type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'INFO' | 'WARNING'
type Status = 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'MONITORING'

interface Location {
  id: string
  name: string
  lga: string
  state: string
  geopolitical_zone: string
  latitude?: number
  longitude?: number
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

const supabase = getSupabase()

const sectorColors: Record<string, string> = {
  HUMAN: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  ANIMAL: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  ENVIRONMENTAL: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  ZOONOTIC: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
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
  const [activeTab, setActiveTab] = useState<'events' | 'trends' | 'alerts'>('events')
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
          setUserZone(zoneForState(profile.state) ?? undefined)
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

  // Every record is classified once, here, so the cards, the map and the counts
  // can never disagree about what an event is called or what kind of event it is.
  const events = outbreaks.map(o => {
    const event = normalizeEvent(o.disease_name, o.report_source)
    return {
      ...o,
      event,
      place: formatPlace(o.locations?.state, o.locations?.lga, o.locations?.name),
      reporter: publicReporter(o.reported_by, o.report_source, o.id),
      summary: scrubReporterDetails(o.description),
    }
  })

  const filtered = sectorFilter === 'ALL' ? events : events.filter(o => o.sector === sectorFilter)
  const signalCount = events.filter(e => e.event.eventType === 'SIGNAL').length

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const newThisWeek = events.filter(e => new Date(e.start_date).getTime() >= sevenDaysAgo).length
  const activeCount = outbreaks.filter(o => o.status === 'ACTIVE').length
  const criticalCount = outbreaks.filter(o => o.severity === 'CRITICAL').length
  const humanCount = outbreaks.filter(o => o.sector === 'HUMAN').length
  const animalCount = outbreaks.filter(o => o.sector === 'ANIMAL').length
  const envCount = outbreaks.filter(o => o.sector === 'ENVIRONMENTAL').length
  const zoonoticCount = outbreaks.filter(o => o.sector === 'ZOONOTIC').length
  const unreadAlerts = alerts.filter(a => !a.is_read).length

  const sectorData = [
    { sector: 'Human', count: humanCount, fill: '#f43f5e' },
    { sector: 'Animal', count: animalCount, fill: '#10b981' },
    { sector: 'Environmental', count: envCount, fill: '#38bdf8' },
    { sector: 'Zoonotic', count: zoonoticCount, fill: '#a855f7' },
  ]

  const mapOutbreaks = events.map(o => ({
    id: o.id,
    disease: o.event.label,
    eventType: o.event.eventType,
    eventTypeLabel: o.event.eventTypeLabel,
    signal: o.event.signal,
    sector: o.sector.toLowerCase(),
    severity: o.severity.toLowerCase(),
    latitude: o.locations?.latitude ?? null,
    longitude: o.locations?.longitude ?? null,
    location_name: o.locations?.name ?? null,
    state: o.locations?.state ?? null,
    lga: o.locations?.lga ?? null,
    place: o.place,
    notes: o.summary,
    reported_at: o.start_date,
    status: o.status.toLowerCase(),
  }))

  return (
    <div className="min-h-screen bg-slate-950">
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
            <span className="text-[10px] uppercase tracking-widest text-amber-300/80 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-full font-semibold">Research prototype</span>
            <a href="/welcome" className="text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 px-3 py-1.5 rounded-full transition-colors font-medium">How it works</a>
            <a href="/rcce" className="text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-colors font-medium">RCCE alerts</a>
            <a href="/collect" className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 rounded-full transition-colors font-semibold">+ Report</a>
            {unreadAlerts > 0 && (
              <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-1 rounded-full">
                {unreadAlerts} new alert{unreadAlerts > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <RCCEAlertBanner userZone={userZone} />

        <SurveillancePipeline />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active events', value: activeCount, accent: 'text-red-400', sub: `${newThisWeek} new in last 7 days` },
            { label: 'Critical severity', value: criticalCount, accent: 'text-orange-400', sub: 'Require action' },
            { label: 'Community signals', value: signalCount, accent: 'text-teal-400', sub: 'Awaiting verification' },
            { label: 'Events tracked', value: outbreaks.length, accent: 'text-emerald-400', sub: 'All four sectors' },
          ].map((card) => (
            <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <p className="text-slate-400 text-xs mb-1">{card.label}</p>
              <p className={`text-3xl font-bold ${card.accent}`}>{loading ? '\u2014' : card.value}</p>
              <p className="text-slate-500 text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white text-sm font-medium mb-4">Reported case trends over time</h2>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading chart…</div>
            ) : caseTrends.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data available for this view</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={caseTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="report_date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} />
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
            {loading ? (
              <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">Loading chart…</div>
            ) : outbreaks.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">No data available for this view</div>
            ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sectorData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="sector" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="count" name="Outbreaks" radius={[4, 4, 0, 0]}>
                  {sectorData.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
            <h2 className="text-white text-sm font-medium">Situational awareness — GIS</h2>
            <p className="text-slate-500 text-xs">Marker size = severity · colour = sector</p>
          </div>
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl h-[540px] flex items-center justify-center text-slate-500 text-sm">Loading map…</div>
          ) : (
            <NigeriaMap outbreaks={mapOutbreaks} />
          )}
        </div>

        <div>
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit mb-6">
            {(['events', 'trends', 'alerts'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors capitalize ${activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'}`}>
                {tab} {tab === 'alerts' && unreadAlerts > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadAlerts}</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === 'events' && (
            <div>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['ALL', 'HUMAN', 'ANIMAL', 'ENVIRONMENTAL', 'ZOONOTIC'] as const).map((s) => (
                  <button key={s} onClick={() => setSectorFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sectorFilter === s ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'}`}>
                    {SECTOR_LABELS[s]}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="text-slate-500 text-sm py-8 text-center">Loading events…</div>
              ) : filtered.length === 0 ? (
                <div className="text-slate-500 text-sm py-8 text-center">No data available for this view</div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((outbreak) => (
                    <div key={outbreak.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-colors">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[outbreak.status]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[outbreak.status]}`} />
                              {outbreak.status}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_TYPE_STYLE[outbreak.event.eventType]}`}>
                              {outbreak.event.eventTypeLabel}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sectorColors[outbreak.sector]}`}>
                              {SECTOR_LABELS[outbreak.sector] ?? outbreak.sector}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[outbreak.severity]}`}>{outbreak.severity}</span>
                          </div>
                          <h3 className="text-white font-semibold">{outbreak.event.label}</h3>
                          {outbreak.event.eventType === 'SIGNAL' && (
                            <p className="text-teal-300/80 text-xs mt-1">
                              Symptom/sign · not a diagnosis. Requires field verification.
                            </p>
                          )}
                          {outbreak.summary && (
                            <p className="text-slate-400 text-sm mt-1">{outbreak.summary}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-500 shrink-0">
                          <p className="text-slate-300 font-medium">{outbreak.place}</p>
                          <p className="mt-1">Since {new Date(outbreak.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          <p className="text-slate-600 mt-1">{outbreak.reporter}</p>
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
                <div className="text-slate-500 text-sm py-8 text-center">No data available for this view</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`bg-slate-900 border rounded-xl p-5 transition-colors ${alert.is_read ? 'border-slate-800' : 'border-slate-700'}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[alert.severity]}`}>{alert.severity}</span>
                          {!alert.is_read && <span className="w-2 h-2 bg-red-400 rounded-full" />}
                          {alert.outbreaks && <span className="text-slate-500 text-xs">{alert.outbreaks.disease_name}</span>}
                        </div>
                        <p className="text-white font-medium text-sm">{alert.title}</p>
                        <p className="text-slate-400 text-sm mt-1">{alert.message}</p>
                      </div>
                      <p className="text-slate-600 text-xs shrink-0">
                        {new Date(alert.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <SORMASExportPanel />

        <footer className="border-t border-slate-800 pt-6 text-center space-y-1">
          <p className="text-slate-600 text-xs">OneHealth Hub · Integrated Zoonotic Disease Surveillance · Built with Next.js + Supabase</p>
          <p className="text-slate-600 text-xs">
            Research prototype — not a production national surveillance system. Reporter identities are not published.
          </p>
        </footer>
      </main>
    </div>
  )
}

// A compact statement of what the platform is and how a report travels through
// it. Kept as a static strip rather than a chart: it explains the architecture,
// it does not claim to measure anything.
function SurveillancePipeline() {
  const stages = [
    { label: 'Community / field', detail: 'USSD · offline field form' },
    { label: 'Surveillance', detail: 'Human · Animal · Environmental · Zoonotic' },
    { label: 'Situational awareness', detail: 'GIS · severity · trends' },
    { label: 'Response', detail: 'RCCE in the zone’s language' },
  ]

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-slate-300 text-sm">
        A multilingual digital One Health surveillance prototype for Nigeria.
      </p>
      <div className="mt-4 flex flex-wrap items-stretch gap-2">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-stretch gap-2">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 min-w-[9.5rem]">
              <p className="text-white text-xs font-semibold">{stage.label}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">{stage.detail}</p>
            </div>
            {i < stages.length - 1 && (
              <span className="self-center text-slate-700 text-sm" aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-xs mt-3">
        Research prototype. The USSD and SORMAS pathways are demonstrated workflows, not live production integrations.
      </p>
    </section>
  )
}
