// @ts-nocheck
'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara','Outside Nigeria'
]

const SCALE = ['1','2','3','4','5']

type Role = 'farmer' | 'professional' | null

export default function EvaluationPage() {
  const [role, setRole] = useState<Role>(null)
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ── FARMER STEPS ──────────────────────────────────────────────
  const farmerSteps = [
    {
      title: 'About You',
      content: (
        <div className="space-y-6">
          <Q label="What state are you in right now?">
            <select className="Input" value={form.state ?? ''} onChange={e => set('state', e.target.value)}>
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Q>
          <Q label="What do you do for a living?">
            {['I farm crops', 'I raise animals (cattle, goats, poultry, pigs)', 'I do both farming and livestock', 'I work in a community / village', 'Other'].map(v => (
              <Btn key={v} label={v} selected={form.occupation === v} onClick={() => set('occupation', v)} />
            ))}
          </Q>
          <Q label="Do you have a smartphone?">
            {['Yes', 'No, just a basic phone', 'I share a phone with family'].map(v => (
              <Btn key={v} label={v} selected={form.has_smartphone === v} onClick={() => set('has_smartphone', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Reporting Sickness Today',
      content: (
        <div className="space-y-6">
          <Q label="If one of your animals got sick right now — what would you do first?">
            {[
              'Call a vet or livestock officer',
              'Tell a neighbour or family member',
              'Sell the animal quickly before it dies',
              'Wait and see if it gets better',
              'I would not know what to do',
            ].map(v => (
              <Btn key={v} label={v} selected={form.sick_animal_action === v} onClick={() => set('sick_animal_action', v)} />
            ))}
          </Q>
          <Q label="Have you ever been afraid to report a sick animal because you thought the government would take it away or punish you?">
            {['Yes, I have been afraid', 'A little afraid', 'Not afraid', 'I have never reported before'].map(v => (
              <Btn key={v} label={v} selected={form.fear_of_reporting === v} onClick={() => set('fear_of_reporting', v)} />
            ))}
          </Q>
          <Q label="After reporting a sick animal or sick person — do you usually get any feedback or update?">
            {['Yes always', 'Sometimes', 'Rarely', 'Never', 'I have never reported'].map(v => (
              <Btn key={v} label={v} selected={form.receives_feedback === v} onClick={() => set('receives_feedback', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'About This Platform',
      content: (
        <div className="space-y-6">
          <p className="text-xs text-teal-600 font-medium bg-teal-50 rounded-xl px-4 py-3">
            Please visit onehealth-hub.vercel.app/welcome to see the platform before answering these questions
          </p>
          <Q label="Was the platform easy to understand?">
            {['Very easy', 'Easy', 'A little confusing', 'Very confusing', 'I could not open it'].map(v => (
              <Btn key={v} label={v} selected={form.ease_of_use === v} onClick={() => set('ease_of_use', v)} />
            ))}
          </Q>
          <Q label="Did the health alerts (warnings about disease) make sense to you?">
            {['Yes, very clear', 'Mostly clear', 'A bit confusing', 'Not clear at all', 'I did not see any alerts'].map(v => (
              <Btn key={v} label={v} selected={form.alert_clarity === v} onClick={() => set('alert_clarity', v)} />
            ))}
          </Q>
          <Q label="Did seeing a health warning in your own language (Hausa, Pidgin, Yoruba, Igbo) help you understand it better?">
            {['Yes, very much', 'A little', 'It did not make a difference', 'I did not notice'].map(v => (
              <Btn key={v} label={v} selected={form.language_helped === v} onClick={() => set('language_helped', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'USSD — Reporting by Phone Call',
      content: (
        <div className="space-y-6">
          <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl leading-relaxed">
            <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">Example USSD screen</p>
            Welcome to OneHealth Hub{'\n'}
            Pick your language:{'\n'}
            1. English{'\n'}
            2. Hausa{'\n'}
            3. Igbo{'\n'}
            4. Yoruba{'\n'}
            5. Pidgin
          </div>
          <Q label="If you could report a sick animal by dialling a short code on ANY phone (even without internet) — would you use it?">
            {['Yes, definitely', 'Probably yes', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.ussd_would_use === v} onClick={() => set('ussd_would_use', v)} />
            ))}
          </Q>
          <Q label="What would stop you from using it? (pick the biggest reason)">
            {[
              'I am afraid of what government will do',
              'I do not trust the system',
              'No phone signal in my area',
              'I do not know how to use it',
              'Nothing would stop me',
            ].map(v => (
              <Btn key={v} label={v} selected={form.ussd_barrier === v} onClick={() => set('ussd_barrier', v)} />
            ))}
          </Q>
          <Q label="Would you feel safe that reporting a sick animal here would NOT lead to your animals being taken away?">
            {['Yes, I would feel safe', 'Maybe', 'Not sure', 'No, I would still be afraid'].map(v => (
              <Btn key={v} label={v} selected={form.feel_safe === v} onClick={() => set('feel_safe', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Your Opinion',
      content: (
        <div className="space-y-6">
          <Q label="Overall — do you think a tool like this would help farmers and communities in Nigeria?">
            {['Yes, very much', 'Probably yes', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.overall_useful === v} onClick={() => set('overall_useful', v)} />
            ))}
          </Q>
          <Q label="Would you tell other farmers about this tool?">
            {['Yes, definitely', 'Probably', 'Not sure', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.would_recommend === v} onClick={() => set('would_recommend', v)} />
            ))}
          </Q>
          <Q label="What is one thing you would change or add to make this better for farmers?">
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none min-h-[80px]"
              placeholder="Write here (optional)..."
              value={form.farmer_suggestion ?? ''}
              onChange={e => set('farmer_suggestion', e.target.value)}
            />
          </Q>
        </div>
      )
    },
  ]

  // ── PROFESSIONAL STEPS ────────────────────────────────────────
  const professionalSteps = [
    {
      title: 'About You',
      content: (
        <div className="space-y-6">
          <Q label="What is your role?">
            {[
              'Community Health Worker / CHO',
              'Veterinary / Livestock Extension Officer',
              'Disease Surveillance / Epidemiology Officer',
              'Nurse / Doctor / Lab Scientist',
              'Agricultural Extension Worker',
              'B.Agric Graduate (Animal Science, Agronomy, Fisheries, Forestry etc)',
              'Public Health Researcher',
              'Programme / M&E Officer',
              'Policy Maker / Government Official',
              'Other',
            ].map(v => (
              <Btn key={v} label={v} selected={form.role === v} onClick={() => set('role', v)} />
            ))}
          </Q>
          <Q label="What state are you in right now?">
            <select className="Input" value={form.state ?? ''} onChange={e => set('state', e.target.value)}>
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Q>
          <Q label="Have you used any digital disease reporting system before?">
            {['Yes — SORMAS', 'Yes — DHIS2', 'Yes — another system', 'No, never'].map(v => (
              <Btn key={v} label={v} selected={form.used_digital === v} onClick={() => set('used_digital', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Current Reporting Reality',
      content: (
        <div className="space-y-6">
          <Q label="How do you currently report disease outbreaks or unusual illness in your work?">
            {[
              'Paper forms submitted to supervisor',
              'Phone call to supervisor',
              'WhatsApp message',
              'SORMAS or DHIS2',
              'We have no formal system',
              'Other',
            ].map(v => (
              <Btn key={v} label={v} selected={form.current_method === v} onClick={() => set('current_method', v)} />
            ))}
          </Q>
          <Q label="After you report, how long does it take for the right person to receive the information?">
            {['Same day', '1–3 days', '4–7 days', 'More than one week', 'I do not know'].map(v => (
              <Btn key={v} label={v} selected={form.report_delay === v} onClick={() => set('report_delay', v)} />
            ))}
          </Q>
          <Q label="In your experience, do farmers and community members report sick animals or unusual illness early enough?">
            {['Yes, usually on time', 'Sometimes', 'Rarely — they delay', 'Almost never', 'I do not know'].map(v => (
              <Btn key={v} label={v} selected={form.community_reporting === v} onClick={() => set('community_reporting', v)} />
            ))}
          </Q>
          <Q label="What is the biggest reason farmers do NOT report sick animals in your area?">
            {[
              'Fear their animals will be seized or destroyed',
              'No easy way to report',
              'They do not know who to call',
              'They do not trust the authorities',
              'Language barrier',
              'Other',
            ].map(v => (
              <Btn key={v} label={v} selected={form.farmer_barrier === v} onClick={() => set('farmer_barrier', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Platform Evaluation',
      content: (
        <div className="space-y-6">
          <p className="text-xs text-teal-600 font-medium bg-teal-50 rounded-xl px-4 py-3">
            Please visit onehealth-hub.vercel.app and explore for 3 minutes before rating
          </p>
          {[
            { label: 'Overall ease of use', field: 'ease_of_use' },
            { label: 'Dashboard clarity (understanding the data)', field: 'dashboard_clarity' },
            { label: 'Outbreak reporting form', field: 'report_form' },
            { label: 'Nigeria disease map', field: 'map_quality' },
            { label: 'Alert and notification system', field: 'alert_system' },
            { label: 'Offline capability (works without internet)', field: 'offline_mode' },
            { label: 'USSD for farmers without smartphones', field: 'ussd_value' },
            { label: 'Multilingual alerts (Hausa, Yoruba, Igbo, Pidgin)', field: 'language_value' },
          ].map(({ label, field }) => (
            <Q key={field} label={label + ' (1 = Very Poor, 5 = Excellent)'}>
              <Scale value={form[field]} onChange={v => set(field, v)} />
            </Q>
          ))}
        </div>
      )
    },
    {
      title: 'One Health & Interoperability',
      content: (
        <div className="space-y-6">
          <Q label="In your opinion, does Nigeria need a community-level tool that captures disease signals BEFORE they reach hospitals or formal systems?">
            {['Yes, urgently', 'Yes, it would help', 'Not sure', 'No, existing systems are enough'].map(v => (
              <Btn key={v} label={v} selected={form.need_community_tool === v} onClick={() => set('need_community_tool', v)} />
            ))}
          </Q>
          <Q label="Should verified reports from a community tool like this automatically feed into SORMAS or DHIS2?">
            {[
              'Yes — after a health officer reviews and confirms',
              'Yes — automatically without waiting',
              'Not sure',
              'No — it should stay separate',
            ].map(v => (
              <Btn key={v} label={v} selected={form.sormas_integration === v} onClick={() => set('sormas_integration', v)} />
            ))}
          </Q>
          <Q label="Compared to tools you have used or heard of — how would you rate OneHealth Hub overall?">
            {['Much better', 'Better', 'About the same', 'Not as good', 'Cannot compare'].map(v => (
              <Btn key={v} label={v} selected={form.comparison === v} onClick={() => set('comparison', v)} />
            ))}
          </Q>
          <Q label="Would you recommend OneHealth Hub to colleagues or use it in your work?">
            {['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'].map(v => (
              <Btn key={v} label={v} selected={form.would_recommend === v} onClick={() => set('would_recommend', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Your Thoughts',
      content: (
        <div className="space-y-6">
          <Q label="What is OneHealth Hub's biggest advantage over existing tools?">
            <textarea className="Input resize-none min-h-[80px]"
              placeholder="Write here (optional)..."
              value={form.biggest_advantage ?? ''}
              onChange={e => set('biggest_advantage', e.target.value)} />
          </Q>
          <Q label="What needs to be improved?">
            <textarea className="Input resize-none min-h-[80px]"
              placeholder="Write here (optional)..."
              value={form.needs_improvement ?? ''}
              onChange={e => set('needs_improvement', e.target.value)} />
          </Q>
          <Q label="Any other comments?">
            <textarea className="Input resize-none min-h-[80px]"
              placeholder="Write here (optional)..."
              value={form.other_comments ?? ''}
              onChange={e => set('other_comments', e.target.value)} />
          </Q>
        </div>
      )
    },
  ]

  const steps = role === 'farmer' ? farmerSteps : professionalSteps
  const totalSteps = steps.length
  const progress = (step / totalSteps) * 100

  async function handleSubmit() {
    setSaving(true)
    const supabase = getSupabase()
    await supabase.from('evaluation_responses').insert({
      ...form,
      respondent_type: role,
      submitted_at: new Date().toISOString(),
    })
    setSaving(false)
    setSubmitted(true)
  }

  // ── SUBMITTED ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your response has been recorded. You are helping to improve disease surveillance across Nigeria and Africa.
          </p>
          <div className="mt-6 p-4 bg-teal-50 rounded-xl">
            <p className="text-xs text-teal-700 font-medium">
              OneHealth Hub · Integrated Zoonotic Disease Surveillance · Nigeria
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── ROLE SELECTION ──
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl font-bold">1H</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">OneHealth Hub</h1>
            <p className="text-sm text-gray-500 mt-1">User Evaluation · Anonymous · 5 minutes</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm font-bold text-gray-700 mb-4 text-center">Who are you?</p>
            <div className="space-y-3">
              <button
                onClick={() => setRole('farmer')}
                className="w-full py-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-100 transition-all text-left px-5"
              >
                <p className="text-2xl mb-1">🌾</p>
                <p className="font-bold text-gray-800 text-sm">Farmer / Community Member</p>
                <p className="text-xs text-gray-500 mt-0.5">I farm, raise animals, or live in a rural community</p>
              </button>

              <button
                onClick={() => setRole('professional')}
                className="w-full py-5 rounded-2xl bg-blue-50 border-2 border-blue-100 hover:border-blue-400 hover:bg-blue-100 transition-all text-left px-5"
              >
                <p className="text-2xl mb-1">🏥</p>
                <p className="font-bold text-gray-800 text-sm">Health / Agriculture Professional</p>
                <p className="text-xs text-gray-500 mt-0.5">Health worker, vet officer, researcher, policy maker, agric graduate</p>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            All responses are anonymous · OneHealth Hub · Nigeria
          </p>
        </div>
      </div>
    )
  }

  // ── FORM STEPS ──
  const currentStep = steps[step]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">
            {role === 'farmer' ? '🌾 Farmer Evaluation' : '🏥 Professional Evaluation'}
          </span>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-full h-2 mb-2 overflow-hidden">
          <div className="h-full bg-teal-500 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-center text-gray-400 mb-6">
          Step {step + 1} of {totalSteps}
        </p>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{currentStep.title}</h2>
          {currentStep.content}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              ← Back
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-2xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Submitting...' : '✓ Submit'}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Anonymous · OneHealth Hub · Nigeria
        </p>
      </div>

      <style jsx>{`
        .Input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #111827;
          background: white;
          outline: none;
        }
        .Input:focus {
          border-color: #14b8a6;
          box-shadow: 0 0 0 2px rgba(20,184,166,0.1);
        }
      `}</style>
    </div>
  )
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3 leading-snug">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Btn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
        selected
          ? 'border-teal-500 bg-teal-50 text-teal-700'
          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-teal-200'
      }`}>
      {selected ? '✓ ' : ''}{label}
    </button>
  )
}

function Scale({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex gap-2">
        {SCALE.map(s => (
          <button key={s} onClick={() => onChange(s)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
              value === s
                ? 'border-teal-500 bg-teal-500 text-white'
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-teal-200'
            }`}>
            {s}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">Very Poor</span>
        <span className="text-xs text-gray-400">Excellent</span>
      </div>
    </div>
  )
}
