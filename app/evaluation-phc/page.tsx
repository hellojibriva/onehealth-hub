// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
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

const INTRO_FRAMES = [
  {
    icon: '🏥',
    title: 'What is OneHealth Hub?',
    desc: 'OneHealth Hub is a digital surveillance platform built for Nigeria. It connects disease reports from communities, health facilities, and laboratories — in one real-time dashboard.',
    color: '#065f46',
    bg: '#ecfdf5',
  },
  {
    icon: '🌍',
    title: 'The One Health Approach',
    desc: 'Human health, animal health, and the environment are deeply connected. A disease outbreak in animals today can become a human epidemic tomorrow.',
    color: '#1e40af',
    bg: '#eff6ff',
  },
  {
    icon: '🐄',
    title: 'The Animal Link',
    desc: 'Diseases like Lassa Fever, Brucellosis, Rabies, and Bird Flu originate in animals before crossing to humans. Early detection in animals saves human lives.',
    color: '#92400e',
    bg: '#fffbeb',
  },
  {
    icon: '🌊',
    title: 'The Environment',
    desc: 'Contaminated water, flooding, drought, and seasonal changes drive disease outbreaks. Environmental surveillance is as critical as clinical surveillance.',
    color: '#1e3a5f',
    bg: '#f0f9ff',
  },
  {
    icon: '🧑‍⚕️',
    title: 'You Are the Bridge',
    desc: 'In your daily work, you already see the connection between sick animals, the environment, and the patients or communities you serve. This platform is built for people like you.',
    color: '#6b21a8',
    bg: '#faf5ff',
  },
  {
    icon: '📋',
    title: 'This Evaluation',
    desc: 'We want your honest experience and opinion. Your responses will help shape how OneHealth Hub is developed and how it integrates with Nigeria\'s national surveillance systems.',
    color: '#065f46',
    bg: '#ecfdf5',
  },
]

export default function PHCEvaluationPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [introFrame, setIntroFrame] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({
    common_diseases: [],
    zoonotic_knowledge: [],
  })

  useEffect(() => {
    if (!showIntro) return
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setIntroFrame(f => {
          if (f >= INTRO_FRAMES.length - 1) return f
          return f + 1
        })
        setAnimating(false)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [showIntro])

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
    {
      title: 'About You',
      domain: null,
      content: (
        <div className="space-y-6">
          <Q label="What is your role?">
            {[
              'Community Health Officer (CHO)',
              'Community Health Extension Worker (CHEW)',
              'Junior CHEW',
              'Nurse / Midwife',
              'Laboratory Scientist / Technician',
              'Disease Surveillance & Notification Officer (DSNO)',
              'Environmental Health Officer',
              'Medical Officer / Doctor',
              'Other',
            ].map(v => <Btn key={v} label={v} selected={form.role === v} onClick={() => set('role', v)} />)}
          </Q>
          <Q label="What state are you based in?">
            <select className="Input" style={{ color: "#111827", background: "white" }} value={form.state ?? ''} onChange={e => set('state', e.target.value)}>
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Q>
          <Q label="How many years have you worked in your role?">
            {['Less than 1 year', '1–3 years', '4–7 years', '8–15 years', 'More than 15 years'].map(v => (
              <Btn key={v} label={v} selected={form.years_experience === v} onClick={() => set('years_experience', v)} />
            ))}
          </Q>
          <Q label="Have you ever used any digital disease reporting tool in your work?">
            {['Yes — DHIS2', 'Yes — SORMAS', 'Yes — another tool', 'No — we use paper forms', 'No — no formal reporting system'].map(v => (
              <Btn key={v} label={v} selected={form.digital_tool_used === v} onClick={() => set('digital_tool_used', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Human Health — What You See',
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
          <Q label="Do you think disease detection would improve if human health, animal health, and environmental data were visible on one platform?">
            {['Yes, definitely', 'Probably yes', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.integrated_data_value === v} onClick={() => set('integrated_data_value', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Animal Health — The Connection',
      domain: '🐄 Animal Health',
      content: (
        <div className="space-y-6">
          <Q label="Do patients or community members ever mention sick or dying animals when they come to your facility?">
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
    {
      title: 'Environment — Seasonal & Environmental Disease Drivers',
      domain: '🌍 Environmental Health',
      content: (
        <div className="space-y-6">
          <Q label="In your experience, do seasonal or environmental changes affect the diseases you see at your facility?">
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
          <Q label="Do you think zoonotic diseases you see could be detected earlier if there was a system connecting human, animal, and environmental surveillance?">
            {['Yes, definitely', 'Probably yes', 'Not sure', 'Probably not', 'No'].map(v => (
              <Btn key={v} label={v} selected={form.integrated_surveillance_value === v} onClick={() => set('integrated_surveillance_value', v)} />
            ))}
          </Q>
          <Q label="What is the biggest barrier to zoonotic disease detection at your facility right now?">
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
    {
      title: 'OneHealth Hub — Platform Evaluation',
      domain: '💻 Platform',
      content: (
        <div className="space-y-6">
          <div className="rounded-xl px-4 py-3 mb-2" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
            <p className="text-xs font-medium" style={{ color: '#065f46' }}>
              Please visit <span className="font-bold">onehealth-hub.vercel.app</span> and explore the platform for 3–5 minutes before rating below.
            </p>
          </div>
          {[
            { label: 'Overall ease of use', field: 'rate_ease_of_use' },
            { label: 'Dashboard — seeing human, animal & environmental data together', field: 'rate_dashboard' },
            { label: 'Outbreak reporting form', field: 'rate_report_form' },
            { label: 'GIS disease map showing outbreak locations across Nigeria', field: 'rate_map' },
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
          <Q label="Should frontline health workers receive formal training in zoonotic disease recognition as part of their routine scope of work?">
            {['Strongly agree', 'Agree', 'Not sure', 'Disagree', 'Strongly disagree'].map(v => (
              <Btn key={v} label={v} selected={form.frontline_zoonotic_training === v} onClick={() => set('frontline_zoonotic_training', v)} />
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
          <Q label="Would you support OneHealth Hub being formally integrated into your facility's disease reporting workflow?">
            {['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'].map(v => (
              <Btn key={v} label={v} selected={form.would_adopt === v} onClick={() => set('would_adopt', v)} />
            ))}
          </Q>
        </div>
      )
    },
    {
      title: 'Your Experience & Suggestions',
      domain: null,
      content: (
        <div className="space-y-6">
          <Q label="In your own words — what is the single most valuable thing OneHealth Hub could do for your work?">
            <textarea className="Input resize-none min-h-[90px]" style={{ color: "#111827", background: "white" }}
              placeholder="Write here (optional)..."
              value={form.most_valuable ?? ''}
              onChange={e => set('most_valuable', e.target.value)} />
          </Q>
          <Q label="What is missing from OneHealth Hub that would make it more useful for detecting zoonotic diseases?">
            <textarea className="Input resize-none min-h-[90px]" style={{ color: "#111827", background: "white" }}
              placeholder="Write here (optional)..."
              value={form.what_is_missing ?? ''}
              onChange={e => set('what_is_missing', e.target.value)} />
          </Q>
          <Q label="Any other comments or suggestions?">
            <textarea className="Input resize-none min-h-[80px]" style={{ color: "#111827", background: "white" }}
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

    const payload = {
      ...form,
      common_diseases: form.common_diseases?.join(', '),
      zoonotic_knowledge: form.zoonotic_knowledge?.join(', '),
      respondent_type: 'phc_worker',
      submitted_at: new Date().toISOString(),
    }

    // Save to Supabase
    await supabase.from('evaluation_responses').insert(payload)

    // Send to Google Sheets via proxy
    try {
      await fetch('/api/sheets-phc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.log('Sheets sync failed silently', e)
    }

    setSaving(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your response has been recorded. Your professional experience is invaluable to advancing One Health surveillance in Nigeria.
          </p>
          <div className="mt-6 p-4 rounded-xl" style={{ background: '#ecfdf5' }}>
            <p className="text-xs font-medium" style={{ color: '#065f46' }}>
              OneHealth Hub · Integrated Zoonotic Disease Surveillance · Nigeria
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── ANIMATED INTRO ──
  if (showIntro) {
    const frame = INTRO_FRAMES[introFrame]
    const isLast = introFrame === INTRO_FRAMES.length - 1
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)' }}>
        <div style={{ maxWidth: 400, width: '100%' }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: 22, fontWeight: 900, color: 'white',
            }}>1H</div>
            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0 }}>
              OneHealth Hub
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>
              Integrated Zoonotic Disease Surveillance · Nigeria
            </p>
          </div>

          {/* Animated frame */}
          <div style={{
            background: frame.bg, borderRadius: 24,
            padding: 28, textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(8px)' : 'translateY(0)',
            transition: 'all 0.3s',
            minHeight: 210,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{frame.icon}</div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: frame.color, margin: '0 0 10px' }}>
              {frame.title}
            </h2>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>
              {frame.desc}
            </p>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '20px 0' }}>
            {INTRO_FRAMES.map((_, i) => (
              <button key={i} onClick={() => setIntroFrame(i)}
                style={{
                  width: i === introFrame ? 24 : 8, height: 8,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: i === introFrame ? 'white' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s', padding: 0,
                }} />
            ))}
          </div>

          {/* Buttons */}
          {isLast ? (
            <button onClick={() => setShowIntro(false)}
              style={{
                width: '100%', padding: '16px', borderRadius: 18,
                background: 'white', color: '#065f46',
                fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}>
              Start Evaluation →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowIntro(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 16,
                  background: 'rgba(255,255,255,0.15)', color: 'white',
                  fontWeight: 600, fontSize: 13,
                  border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                }}>
                Skip
              </button>
              <button onClick={() => {
                setAnimating(true)
                setTimeout(() => {
                  setIntroFrame(f => Math.min(f + 1, INTRO_FRAMES.length - 1))
                  setAnimating(false)
                }, 300)
              }}
                style={{
                  flex: 2, padding: '14px', borderRadius: 16,
                  background: 'white', color: '#065f46',
                  fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer',
                }}>
                Next →
              </button>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
            Tap dots to navigate · Auto-advances every 3 seconds
          </p>
        </div>
      </div>
    )
  }

  // ── FORM ──
  const currentStep = steps[step]
  const progress = (step / steps.length) * 100

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#f0fdf4' }}>
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-3"
            style={{ background: '#065f46' }}>
            🌍 OneHealth Hub Evaluation
          </div>
        </div>

        <div className="bg-white rounded-full h-2 mb-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#065f46' }} />
        </div>
        <p className="text-xs text-center text-gray-400 mb-6">
          Step {step + 1} of {steps.length}
        </p>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          {currentStep.domain && (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-3"
              style={{ background: '#ecfdf5', color: '#065f46' }}>
              {currentStep.domain}
            </div>
          )}
          <h2 className="text-lg font-bold text-gray-800 mb-4">{currentStep.title}</h2>
          {currentStep.content}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              ← Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold"
              style={{ background: '#065f46' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: '#16a34a' }}>
              {saving ? 'Submitting...' : '✓ Submit Evaluation'}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Anonymous · Community-Centred One Health Surveillance · Nigeria
        </p>
      </div>

      <style jsx>{`
        .Input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #111827 !important;
          background: white !important;
          outline: none;
          -webkit-text-fill-color: #111827 !important;
        }
        .Input:focus {
          border-color: #059669;
          box-shadow: 0 0 0 2px rgba(5,150,105,0.1);
        }
        textarea.Input {
          color: #111827 !important;
          background: white !important;
          -webkit-text-fill-color: #111827 !important;
        }
        select.Input {
          color: #111827 !important;
          background: white !important;
          -webkit-text-fill-color: #111827 !important;
        }
        select.Input option {
          color: #111827 !important;
          background: white !important;
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
        selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
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
              value === s ? 'border-emerald-500 bg-emerald-500 text-white'
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