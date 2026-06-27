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

const ZOONOTIC_DISEASES = [
  'Lassa Fever', 'Rabies', 'Brucellosis', 'Avian Influenza (Bird Flu)',
  'Anthrax', 'Mpox', 'Rift Valley Fever', 'Cholera', 'None of the above'
]

const COMMON_DISEASES = [
  'Lassa Fever', 'Malaria', 'Typhoid', 'Brucellosis', 'Rabies',
  'Cholera', 'Mpox', 'Avian Influenza', 'Respiratory Illness',
  'Tuberculosis', 'Skin Infections', 'Other'
]

const SCALE = ['1', '2', '3', '4', '5']

export default function PHCEvaluationPage() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    common_diseases: [],
    zoonotic_knowledge: [],
  })

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleArray(field: string, value: string) {
    setForm(f => {
      const arr = f[field] ?? []
      return {
        ...f,
        [field]: arr.includes(value)
          ? arr.filter((v: string) => v !== value)
          : [...arr, value]
      }
    })
  }

  const steps = [
    // ── STEP 1: About You ──────────────────────────────────────
    {
      title: 'About You',
      domain: null,
      content: (
        <div className="space-y-6">
          <Q label="What is your role at the PHC facility?">
            {[
              'Community Health Officer (CHO)',
              'Community Health Extension Worker (CHEW)',
              'Junior CHEW',
              'Nurse / Midwife',
              'Laboratory Scientist / Technician',
              'Disease Surveillance & Notification Officer (DSNO)',
              'Environmental Health Officer',
              'Medical Officer',
              'Other',
            ].map(v => <Btn key={v} label={v} selected={form.role === v} onClick={() => set('role', v)} />)}
          </Q>
          <Q label="What state are you based in?">
            <select className="Input" value={form.state ?? ''} onChange={e => set('state', e.target.value)}>
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Q>
          <Q label="How many years have you worked at a PHC facility?">
            {['Less than 1 year', '1–3 years', '4–7 years', '8–15 years', 'More than 15 years'].map(v => (
              <Btn key={v} label={v} selected={form.years_experience === v} onClick={() => set('years_experience', v)} />
            ))}
          </Q>
          <Q label="Have you ever used any digital disease reporting tool in your work?">
            {['Yes — DHIS2', 'Yes — SORMAS', 'Yes — another tool', 'No — we use paper forms', 'No — we have no formal reporting system'].map(v => (
              <Btn key={v} label={v} selected={form.digital_tool_used === v} onClick={() => set('digital_tool_used', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 2: Human Health Domain ────────────────────────────
    {
      title: 'Human Health — What You See in the Clinic',
      domain: '🧑‍⚕️ Human Health',
      content: (
        <div className="space-y-6">
          <Q label="Which diseases do you most commonly diagnose or treat at your facility? (Select all that apply)">
            <div className="grid grid-cols-2 gap-2">
              {COMMON_DISEASES.map(v => (
                <Btn key={v} label={v}
                  selected={form.common_diseases?.includes(v)}
                  onClick={() => toggleArray('common_diseases', v)} />
              ))}
            </div>
          </Q>
          <Q label="In the last 6 months, have you treated a patient whose illness you suspected was linked to an animal or the environment?">
            {['Yes, more than once', 'Yes, once or twice', 'Not sure', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.suspected_zoonotic === v} onClick={() => set('suspected_zoonotic', v)} />
            ))}
          </Q>
          <Q label="When you suspect a patient's illness came from an animal or environmental source — what do you currently do?">
            {[
              'I document it in the patient record only',
              'I report it to my supervisor',
              'I report it to the DSNO',
              'I try to contact a vet or livestock officer',
              'Nothing — there is no system for this',
              'Other',
            ].map(v => (
              <Btn key={v} label={v} selected={form.zoonotic_action === v} onClick={() => set('zoonotic_action', v)} />
            ))}
          </Q>
          <Q label="Do you think disease reporting would improve if PHC workers could see animal and environmental data alongside their patient data?">
            {['Yes, definitely', 'Probably yes', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.integrated_data_value === v} onClick={() => set('integrated_data_value', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 3: Animal Health Domain ───────────────────────────
    {
      title: 'Animal Health — The Connection You Already See',
      domain: '🐄 Animal Health',
      content: (
        <div className="space-y-6">
          <Q label="Do patients or family members ever mention sick or dying animals when they come to your facility?">
            {['Yes, frequently', 'Yes, sometimes', 'Rarely', 'Never', 'I have not paid attention to this'].map(v => (
              <Btn key={v} label={v} selected={form.patients_mention_animals === v} onClick={() => set('patients_mention_animals', v)} />
            ))}
          </Q>
          <Q label="Have you ever seen a cluster of similar illness at your facility that you later connected to a livestock event — such as a market, slaughter, or animal deaths nearby?">
            {['Yes', 'I suspected it but could not confirm', 'No', 'Not sure'].map(v => (
              <Btn key={v} label={v} selected={form.cluster_livestock_link === v} onClick={() => set('cluster_livestock_link', v)} />
            ))}
          </Q>
          <Q label="Do you currently have any formal way to communicate with veterinary or livestock officers when you suspect animal involvement in a human case?">
            {['Yes, we have a formal channel', 'Sometimes informally', 'No formal channel exists', 'I do not know who to contact'].map(v => (
              <Btn key={v} label={v} selected={form.vet_communication === v} onClick={() => set('vet_communication', v)} />
            ))}
          </Q>
          <Q label="If you could see real-time reports of sick or dying animals from your community on a dashboard — would it change how you diagnose or investigate cases?">
            {['Yes, significantly', 'Yes, somewhat', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.animal_data_impact === v} onClick={() => set('animal_data_impact', v)} />
            ))}
          </Q>
          <Q label="What percentage of farming households in your catchment area do you think own a basic mobile phone?">
            {['Almost all (>80%)', 'Most (50–80%)', 'Some (20–50%)', 'Few (<20%)', 'I do not know'].map(v => (
              <Btn key={v} label={v} selected={form.phone_ownership_estimate === v} onClick={() => set('phone_ownership_estimate', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 4: Environmental Health Domain ────────────────────
    {
      title: 'Environment — Seasonal and Environmental Disease Drivers',
      domain: '🌍 Environmental Health',
      content: (
        <div className="space-y-6">
          <Q label="In your experience, do environmental or seasonal changes affect the diseases you see at your facility?">
            {[
              'Yes — dry season brings different diseases than rainy season',
              'Yes — flooding or drought affects disease patterns',
              'Yes — farming and harvest seasons affect disease patterns',
              'Somewhat',
              'No noticeable pattern',
            ].map(v => (
              <Btn key={v} label={v} selected={form.seasonal_pattern === v} onClick={() => set('seasonal_pattern', v)} />
            ))}
          </Q>
          <Q label="Have you ever linked a patient's illness to an environmental source — contaminated water, dead animals near a water source, unusual rodent activity, or waste sites?">
            {['Yes, more than once', 'Yes, once', 'I suspected it but could not confirm', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.environmental_link === v} onClick={() => set('environmental_link', v)} />
            ))}
          </Q>
          <Q label="Do you currently have any way to report environmental health risks — such as contaminated water sources or unusual animal deaths near settlements?">
            {['Yes, formal reporting channel exists', 'Informal only', 'No mechanism exists', 'I do not know'].map(v => (
              <Btn key={v} label={v} selected={form.env_reporting_mechanism === v} onClick={() => set('env_reporting_mechanism', v)} />
            ))}
          </Q>
          <Q label="Would receiving seasonal disease alerts — warning you that Lassa Fever or Cholera risk is elevated in your area this season — help you prepare your facility?">
            {['Yes, very much', 'Yes, somewhat', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.seasonal_alerts_value === v} onClick={() => set('seasonal_alerts_value', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 5: Zoonoses Knowledge ─────────────────────────────
    {
      title: 'Zoonoses — Diseases That Cross Between Animals and Humans',
      domain: '🔬 Zoonoses',
      content: (
        <div className="space-y-6">
          <Q label="Which of these diseases do you know can pass from animals to humans? (Select all that apply)">
            <div className="grid grid-cols-2 gap-2">
              {ZOONOTIC_DISEASES.map(v => (
                <Btn key={v} label={v}
                  selected={form.zoonotic_knowledge?.includes(v)}
                  onClick={() => toggleArray('zoonotic_knowledge', v)} />
              ))}
            </div>
          </Q>
          <Q label="In your training or practice, were you taught how to identify a possible zoonotic case — one that may have originated from an animal?">
            {['Yes, formally trained', 'Yes, learned on the job', 'Briefly mentioned in training', 'No, never covered', 'Not sure'].map(v => (
              <Btn key={v} label={v} selected={form.zoonotic_training === v} onClick={() => set('zoonotic_training', v)} />
            ))}
          </Q>
          <Q label="Do you think the zoonotic diseases you see at your facility could be detected earlier if there was a system connecting human, animal, and environmental surveillance?">
            {['Yes, definitely', 'Probably yes', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.integrated_surveillance_value === v} onClick={() => set('integrated_surveillance_value', v)} />
            ))}
          </Q>
          <Q label="What is the biggest barrier to zoonotic disease detection at your PHC facility right now?">
            {[
              'No system to connect human and animal health data',
              'No training in zoonotic disease recognition',
              'Farmers do not report sick animals early enough',
              'No communication channel with veterinary sector',
              'No laboratory capacity for confirmation',
              'Other',
            ].map(v => (
              <Btn key={v} label={v} selected={form.zoonotic_barrier === v} onClick={() => set('zoonotic_barrier', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 6: Platform Evaluation ────────────────────────────
    {
      title: 'OneHealth Hub — Platform Evaluation',
      domain: '💻 Platform',
      content: (
        <div className="space-y-6">
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl px-4 py-3 mb-2">
            <p className="text-emerald-400 text-xs font-medium">
              Please visit <span className="font-bold">onehealth-hub.vercel.app</span> and explore for 3–5 minutes before rating the platform below.
            </p>
          </div>
          {[
            { label: 'Overall ease of use', field: 'rate_ease_of_use' },
            { label: 'Dashboard — seeing human, animal & environmental data together', field: 'rate_dashboard' },
            { label: 'Outbreak reporting form', field: 'rate_report_form' },
            { label: 'GIS disease map showing outbreak locations', field: 'rate_map' },
            { label: 'Multilingual community alerts (Hausa, Yoruba, Igbo, Pidgin)', field: 'rate_multilingual' },
            { label: 'SORMAS/DHIS2 interoperability concept', field: 'rate_sormas' },
            { label: 'Offline data capture for areas with poor connectivity', field: 'rate_offline' },
          ].map(({ label, field }) => (
            <Q key={field} label={`${label} (1 = Very Poor, 5 = Excellent)`}>
              <Scale value={form[field]} onChange={v => set(field, v)} />
            </Q>
          ))}
          <Q label="If farmers could report sick animals by dialling a code on any basic phone — without internet — how useful would that be for early disease detection in your catchment area?">
            {['Extremely useful', 'Very useful', 'Somewhat useful', 'Not very useful', 'Not useful'].map(v => (
              <Btn key={v} label={v} selected={form.ussd_feasibility === v} onClick={() => set('ussd_feasibility', v)} />
            ))}
          </Q>
          <Q label="After seeing OneHealth Hub — does it address the human-animal-environment connection you encounter in your daily work?">
            {['Yes, completely', 'Yes, mostly', 'Partially', 'Not really', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.addresses_oh_gap === v} onClick={() => set('addresses_oh_gap', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 7: Policy ─────────────────────────────────────────
    {
      title: 'One Health Policy — Your Opinion',
      domain: '🏛️ Policy',
      content: (
        <div className="space-y-6">
          <Q label="Should PHC facilities be formally designated as the entry point for One Health surveillance in Nigeria — connecting human, animal, and environmental health reporting?">
            {['Strongly agree', 'Agree', 'Not sure', 'Disagree', 'Strongly disagree'].map(v => (
              <Btn key={v} label={v} selected={form.phc_as_entry_point === v} onClick={() => set('phc_as_entry_point', v)} />
            ))}
          </Q>
          <Q label="Should CHEWs and CHOs receive formal training in zoonotic disease recognition as part of their routine scope of work?">
            {['Strongly agree', 'Agree', 'Not sure', 'Disagree', 'Strongly disagree'].map(v => (
              <Btn key={v} label={v} selected={form.chew_zoonotic_training === v} onClick={() => set('chew_zoonotic_training', v)} />
            ))}
          </Q>
          <Q label="Should verified community disease reports automatically feed into Nigeria's national surveillance system (NCDC/IDSR) after review by a health officer?">
            {[
              'Yes — after officer review and confirmation',
              'Yes — automatically without waiting',
              'Not sure',
              'No — keep them separate',
            ].map(v => (
              <Btn key={v} label={v} selected={form.national_integration === v} onClick={() => set('national_integration', v)} />
            ))}
          </Q>
          <Q label="Would you support OneHealth Hub being formally integrated into your PHC facility's disease reporting workflow?">
            {['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'].map(v => (
              <Btn key={v} label={v} selected={form.would_adopt === v} onClick={() => set('would_adopt', v)} />
            ))}
          </Q>
        </div>
      )
    },

    // ── STEP 8: Open Ended ─────────────────────────────────────
    {
      title: 'Your Experience & Suggestions',
      domain: null,
      content: (
        <div className="space-y-6">
          <Q label="In your own words — what is the single most valuable thing OneHealth Hub could do for your work as a PHC worker?">
            <textarea className="Input resize-none min-h-[90px]"
              placeholder="Write here (optional)..."
              value={form.most_valuable ?? ''}
              onChange={e => set('most_valuable', e.target.value)} />
          </Q>
          <Q label="What is missing from OneHealth Hub that would make it more useful for detecting zoonotic diseases at PHC level?">
            <textarea className="Input resize-none min-h-[90px]"
              placeholder="Write here (optional)..."
              value={form.what_is_missing ?? ''}
              onChange={e => set('what_is_missing', e.target.value)} />
          </Q>
          <Q label="Any other comments or suggestions?">
            <textarea className="Input resize-none min-h-[80px]"
              placeholder="Write here (optional)..."
              value={form.other_comments ?? ''}
              onChange={e => set('other_comments', e.target.value)} />
          </Q>
        </div>
      )
    },
  ]

  async function handleSubmit() {
    setSaving(true)
    const supabase = getSupabase()
    await supabase.from('evaluation_responses').insert({
      ...form,
      common_diseases: form.common_diseases?.join(', '),
      zoonotic_knowledge: form.zoonotic_knowledge?.join(', '),
      respondent_type: 'phc_worker',
      submitted_at: new Date().toISOString(),
    })
    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your response has been recorded. Your experience as a PHC worker is invaluable to this research on One Health surveillance in Nigeria.
          </p>
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl">
            <p className="text-xs text-emerald-700 font-medium">
              OneHealth Hub · Community-Centred One Health Surveillance · Nigeria
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = steps[step]
  const progress = (step / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-8">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-3">
            <span>🌍</span> OneHealth Hub — PHC Worker Evaluation
          </div>
          <h1 className="text-lg font-bold text-gray-800">
            One Health Surveillance at PHC Level
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            For community health workers, nurses, DSNOs and PHC staff · Anonymous · 8–10 minutes
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-full h-2 mb-2 overflow-hidden shadow-inner">
          <div className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-center text-gray-400 mb-6">
          Step {step + 1} of {steps.length}
        </p>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          {currentStep.domain && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              {currentStep.domain}
            </div>
          )}
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
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-2xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {saving ? 'Submitting...' : '✓ Submit Evaluation'}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Anonymous · Community-Centred One Health Surveillance Framework · Nigeria
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
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5,150,105,0.1);
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
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-emerald-200'
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
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-emerald-200'
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