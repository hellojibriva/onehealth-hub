// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

// ============================================================
// SORMAS Export Panel — OneHealth Hub
// Shows USSD reports, allows verification and SORMAS export
// ============================================================

interface USSDReport {
  id: string
  phone_number: string
  report_type: string
  location_text: string
  language: string
  created_at: string
  verified: boolean
  verified_at?: string
  field_notes?: string
  disease_suspected?: string
  sormas_synced: boolean
  sormas_synced_at?: string
  sormas_case_id?: string
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  HUMAN: '🤒 Human Illness',
  ANIMAL: '🐄 Animal Illness/Death',
  ENVIRONMENTAL: '🌊 Environmental',
}

const LANG_LABELS: Record<string, string> = {
  en: 'English', ha: 'Hausa', yo: 'Yoruba', ig: 'Igbo', pcm: 'Pidgin'
}

function buildSORMASPayload(report: USSDReport) {
  const now = new Date().toISOString()
  return {
    // SORMAS standard fields
    uuid: report.id,
    reportDate: report.created_at?.split('T')[0] ?? now.split('T')[0],
    reportingUser: {
      uuid: 'ONEHEALTH-HUB',
      firstName: 'OneHealth',
      lastName: 'Hub',
    },
    disease: report.disease_suspected ?? 'UNDEFINED',
    diseaseDetails: `Community report via USSD (${report.report_type})`,
    region: {
      uuid: 'NG',
      caption: report.location_text?.split(',')[1]?.trim() ?? 'Nigeria',
    },
    district: {
      uuid: report.id,
      caption: report.location_text?.split(',')[0]?.trim() ?? 'Unknown LGA',
    },
    reportingType: 'COMMUNITY',
    sourceType: 'USSD',
    sourceDetails: `OneHealth Hub USSD Report · Language: ${LANG_LABELS[report.language] ?? report.language} · Phone: ${report.phone_number}`,
    investigationStatus: 'PENDING',
    caseClassification: 'NOT_CLASSIFIED',
    outcome: 'NO_OUTCOME',
    fieldNotes: report.field_notes ?? '',
    // OneHealth Hub metadata
    _source: 'OneHealth Hub',
    _sourceVersion: '1.0',
    _exportedAt: now,
    _reportType: report.report_type,
    _language: report.language,
    _verifiedAt: report.verified_at ?? null,
  }
}

export default function SORMASExportPanel() {
  const [reports, setReports] = useState<USSDReport[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [verifyForm, setVerifyForm] = useState<Record<string, { notes: string; disease: string }>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'exported'>('pending')

  useEffect(() => { fetchReports() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchReports() {
    const supabase = getSupabase()
    setLoading(true)
    const { data } = await supabase
      .from('ussd_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setReports(data as USSDReport[])
    setLoading(false)
  }

  async function handleVerify(report: USSDReport) {
    const supabase = getSupabase()
    setVerifying(report.id)
    const vf = verifyForm[report.id] ?? { notes: '', disease: '' }

    await supabase.from('ussd_reports').update({
      verified: true,
      verified_at: new Date().toISOString(),
      field_notes: vf.notes,
      disease_suspected: vf.disease,
    }).eq('id', report.id)

    setVerifying(null)
    setExpandedId(null)
    showToast('Report verified ✓')
    fetchReports()
  }

  async function handleExport(report: USSDReport) {
    const supabase = getSupabase()
    setExporting(report.id)

    const payload = buildSORMASPayload(report)

    // Log the export
    await supabase.from('sormas_exports').insert({
      ussd_report_id: report.id,
      sormas_payload: payload,
      export_method: 'MANUAL',
      status: 'PENDING',
    })

    // Mark as synced
    await supabase.from('ussd_reports').update({
      sormas_synced: true,
      sormas_synced_at: new Date().toISOString(),
    }).eq('id', report.id)

    // Download the JSON
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sormas_case_${report.id.slice(0, 8)}_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setExporting(null)
    showToast('Exported to SORMAS format ↓')
    fetchReports()
  }

  const filtered = reports.filter(r => {
    if (filter === 'pending') return !r.verified && !r.sormas_synced
    if (filter === 'verified') return r.verified && !r.sormas_synced
    if (filter === 'exported') return r.sormas_synced
    return true
  })

  const pendingCount = reports.filter(r => !r.verified && !r.sormas_synced).length
  const verifiedCount = reports.filter(r => r.verified && !r.sormas_synced).length
  const exportedCount = reports.filter(r => r.sormas_synced).length

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-semibold text-sm">SORMAS Interoperability</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Verify community USSD reports and export to SORMAS-compatible format
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatPill label="Pending" value={pendingCount} color="text-amber-400" />
            <StatPill label="Verified" value={verifiedCount} color="text-blue-400" />
            <StatPill label="Exported" value={exportedCount} color="text-emerald-400" />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-4 bg-slate-800 rounded-lg p-1 w-fit">
          {(['all', 'pending', 'verified', 'exported'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Flow diagram */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <FlowStep icon="📱" label="Farmer USSD" color="text-slate-300" />
          <Arrow />
          <FlowStep icon="📋" label="Pending Review" color="text-amber-400" />
          <Arrow />
          <FlowStep icon="✅" label="Officer Verifies" color="text-blue-400" />
          <Arrow />
          <FlowStep icon="↗️" label="Export to SORMAS" color="text-emerald-400" />
          <Arrow />
          <FlowStep icon="🏛️" label="SORMAS / DHIS2" color="text-purple-400" />
        </div>
      </div>

      {/* Report list */}
      <div className="divide-y divide-slate-800">
        {loading ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">Loading reports...</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            <p className="text-2xl mb-2">📭</p>
            <p>No {filter === 'all' ? '' : filter} reports yet</p>
          </div>
        ) : (
          filtered.map(report => (
            <div key={report.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  report.sormas_synced ? 'bg-emerald-400' :
                  report.verified ? 'bg-blue-400' : 'bg-amber-400 animate-pulse'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white text-sm font-medium">
                      {REPORT_TYPE_LABELS[report.report_type] ?? report.report_type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      report.sormas_synced ? 'bg-emerald-500/20 text-emerald-300' :
                      report.verified ? 'bg-blue-500/20 text-blue-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {report.sormas_synced ? 'Exported' : report.verified ? 'Verified' : 'Pending'}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {LANG_LABELS[report.language] ?? report.language}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs">
                    📍 {report.location_text} · {report.phone_number}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {report.created_at ? new Date(report.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'Unknown date'}
                  </p>

                  {report.disease_suspected && (
                    <p className="text-blue-400 text-xs mt-1">
                      🔬 Suspected: {report.disease_suspected}
                    </p>
                  )}
                  {report.field_notes && (
                    <p className="text-slate-400 text-xs mt-1 italic">"{report.field_notes}"</p>
                  )}
                  {report.sormas_synced_at && (
                    <p className="text-emerald-500 text-xs mt-1">
                      ↗ Exported {new Date(report.sormas_synced_at).toLocaleDateString('en-NG')}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {!report.verified && !report.sormas_synced && (
                    <button
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
                    >
                      Verify
                    </button>
                  )}
                  {report.verified && !report.sormas_synced && (
                    <button
                      onClick={() => handleExport(report)}
                      disabled={exporting === report.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors font-medium disabled:opacity-50"
                    >
                      {exporting === report.id ? 'Exporting...' : '↗ Export'}
                    </button>
                  )}
                  {report.sormas_synced && (
                    <button
                      onClick={() => handleExport(report)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:bg-slate-800 transition-colors"
                    >
                      ↓ Re-export
                    </button>
                  )}
                </div>
              </div>

              {/* Verify form */}
              {expandedId === report.id && (
                <div className="mt-3 ml-5 bg-slate-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    Field Verification
                  </p>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Suspected Disease</label>
                    <input
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="e.g. Lassa Fever, Anthrax, Brucellosis..."
                      value={verifyForm[report.id]?.disease ?? ''}
                      onChange={e => setVerifyForm(f => ({
                        ...f, [report.id]: { ...f[report.id], disease: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Field Notes</label>
                    <textarea
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                      rows={2}
                      placeholder="What did the field investigation find?"
                      value={verifyForm[report.id]?.notes ?? ''}
                      onChange={e => setVerifyForm(f => ({
                        ...f, [report.id]: { ...f[report.id], notes: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(report)}
                      disabled={verifying === report.id}
                      className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {verifying === report.id ? 'Saving...' : '✓ Confirm Verification'}
                    </button>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-4 py-2 rounded-lg border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/30">
        <p className="text-slate-600 text-xs">
          Exported files are SORMAS-compatible JSON. Import manually into SORMAS or configure API credentials for automatic push. Each export is logged in <code className="text-slate-500">sormas_exports</code>.
        </p>
      </div>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-3 py-1.5">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-slate-500 text-xs">{label}</span>
    </div>
  )
}

function FlowStep({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span>{icon}</span>
      <span className={`font-medium ${color}`}>{label}</span>
    </div>
  )
}

function Arrow() {
  return <span className="text-slate-600">→</span>
}