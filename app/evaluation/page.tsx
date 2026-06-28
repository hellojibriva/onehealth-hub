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

const SCALE = ['1', '2', '3', '4', '5']

type Role = 'farmer' | 'professional' | null

// ── INTRO FRAMES ──────────────────────────────────────────────────────────────
const INTRO_FRAMES = [
  {
    icon: '🏥',
    title: 'What is OneHealth Hub?',
    desc: 'OneHealth Hub is a digital surveillance platform built for Nigeria. It connects disease reports from farming communities, health facilities, and laboratories in one real-time dashboard — accessible on any phone.',
    color: '#065f46',
    bg: '#ecfdf5',
  },
  {
    icon: '🌍',
    title: 'One Health in Nigeria',
    desc: 'About 60% of human infectious diseases worldwide originate in animals. In Nigeria — Lassa Fever, Brucellosis, Bird Flu, Rabies — the human-animal-environment link is a daily reality, not a theory.',
    color: '#1e40af',
    bg: '#eff6ff',
  },
  {
    icon: '🐄',
    title: 'The Agriculture Connection',
    desc: 'Agronomists, animal scientists, veterinary officers, and farmers are often the first to observe zoonotic signals — before any clinic ever sees a patient. Your knowledge is frontline surveillance.',
    color: '#92400e',
    bg: '#fffbeb',
  },
  {
    icon: '🌊',
    title: 'Environment Matters',
    desc: 'Land use, water contamination, seasonal flooding, and deforestation all drive disease outbreaks. Environmental and agricultural professionals hold data that human health systems never see.',
    color: '#1e3a5f',
    bg: '#f0f9ff',
  },
  {
    icon: '📊',
    title: 'Why This Evaluation',
    desc: 'Your expertise — whether in animal science, agronomy, public health, or field surveillance — directly shapes how OneHealth Hub is developed and how it integrates with Nigeria\'s national systems.',
    color: '#6b21a8',
    bg: '#faf5ff',
  },
  {
    icon: '📋',
    title: 'How It Works',
    desc: 'The form takes 5–8 minutes. It starts by asking who you are — farmer or professional — then branches into questions matched to your background. All responses are completely anonymous.',
    color: '#065f46',
    bg: '#ecfdf5',
  },
]

export default function EvaluationPage() {
  const [showIntro, setShowIntro] = useState(true)
  const [introFrame, setIntroFrame] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [role, setRole] = useState<Role>(null)
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  // Auto-advance intro
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

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ── FARMER STEPS ──────────────────────────────────────────────────────────
  const farmerSteps = [
    {
      title: 'About You',
      content: (
        <div className="space-y-6">
          <Q label="What state are you in right now?">
            <select className="Input" style={{ color: "#111827", background: "white" }} value={form.state ?? ''} onChange={e => set('state', e.target.value)}>
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Q>
          <Q label="What do you do for a living?">
            {['I farm crops', 'I raise animals (cattle, goats, poultry, pigs)', 'I do both farming and livestock', 'I work in a rural community', 'Other'].map(v => (
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
      title: 'Reporting Sickness',
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
          <div className="rounded-xl px-4 py-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
            <p className="text-xs font-medium" style={{ color: '#065f46' }}>
              Please visit <span className="font-bold">onehealth-hub.vercel.app/welcome</span> to see the platform before answering
            </p>
          </div>
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
      title: 'USSD — Reporting by Phone',
      content: (
        <div className="space-y-6">
          <div className="rounded-xl p-4 font-mono text-xs leading-relaxed"
            style={{ background: '#111827', color: '#4ade80' }}>
            <p style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Example — what you see when you dial
            </p>
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
          <Q label="Would you feel safe that reporting a sick animal would NOT lead to your animals being taken away?">
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
            <textarea className="Input resize-none min-h-[80px]" style={{ color: "#111827", background: "white" }}
              placeholder="Write here (optional)..."
              value={form.farmer_suggestion ?? ''}
              onChange={e => set('farmer_suggestion', e.target.value)} />
          </Q>
        </div>
      )
    },
  ]

  // ── PROFESSIONAL STEPS ────────────────────────────────────────────────────
  const professionalSteps = [
    {
      title: 'About You',
      content: (
        <div className="space-y-6">
          <Q label="What is your professional background?">
            {[
              // Public health
              'Disease Surveillance / Epidemiology Officer',
              'Public Health Researcher',
              'Programme / M&E Officer',
              'Policy Maker / Government Official',
              // Agriculture & environment
              'Agronomist',
              'Animal Scientist',
              'Environmentalist / Environmental Scientist',
              'Veterinary / Livestock Extension Officer',
              'Fisheries Officer',
              'Forestry Officer',
              'Agricultural Extension Worker',
              // Other
              'Other',
            ].map(v => (
              <Btn key={v} label={v} selected={form.role === v} onClick={() => set('role', v)} />
            ))}
          </Q>
          <Q label="What state are you in?">
            <select className="Input" style={{ color: "#111827", background: "white" }} value={form.state ?? ''} onChange={e => set('state', e.target.value)}>
              <option value="">Select your state</option>
              {NIGERIA_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Q>
          <Q label="Have you used any digital disease or agricultural reporting system before?">
            {['Yes — DHIS2', 'Yes — SORMAS', 'Yes — another system', 'No, never'].map(v => (
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
          <Q label="How do you currently report disease outbreaks or unusual events in your work?">
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
          <div className="rounded-xl px-4 py-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
            <p className="text-xs font-medium" style={{ color: '#065f46' }}>
              Please visit <span className="font-bold">onehealth-hub.vercel.app</span> and explore for 3 minutes before rating
            </p>
          </div>
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
            <textarea className="Input resize-none min-h-[80px]" style={{ color: "#111827", background: "white" }}
              placeholder="Write here (optional)..."
              value={form.biggest_advantage ?? ''}
              onChange={e => set('biggest_advantage', e.target.value)} />
          </Q>
          <Q label="What needs to be improved?">
            <textarea className="Input resize-none min-h-[80px]" style={{ color: "#111827", background: "white" }}
              placeholder="Write here (optional)..."
              value={form.needs_improvement ?? ''}
              onChange={e => set('needs_improvement', e.target.value)} />
          </Q>
          <Q label="Any other comments?">
            <textarea className="Input resize-none min-h-[80px]" style={{ color: "#111827", background: "white" }}
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

    const payload = {
      ...form,
      respondent_type: role,
      submitted_at: new Date().toISOString(),
    }

    // Save to Supabase
    await supabase.from('evaluation_responses').insert(payload)

    // Send to Google Sheets via proxy
    try {
      await fetch('/api/sheets', {
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

  // ── SUBMITTED ──
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your response has been recorded. You are helping to improve disease surveillance across Nigeria and Africa.
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
            background: frame.bg, borderRadius: 24, padding: 28, textAlign: 'center',
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
                  borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0,
                  background: i === introFrame ? 'white' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s',
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

  // ── ROLE SELECTION ──
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#f0fdf4' }}>
        <div style={{ maxWidth: 380, width: '100%' }}>
          <div className="text-center mb-8">
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: '#065f46', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: 20, fontWeight: 900, color: 'white',
            }}>1H</div>
            <h1 className="text-xl font-bold text-gray-800">OneHealth Hub</h1>
            <p className="text-sm text-gray-500 mt-1">User Evaluation · Anonymous · 5–8 minutes</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <p className="text-sm font-bold text-gray-700 mb-4 text-center">Who are you?</p>
            <div className="space-y-3">
              <button onClick={() => setRole('farmer')}
                className="w-full py-5 rounded-2xl text-left px-5 transition-all"
                style={{ background: '#f0fdf4', border: '2px solid #bbf7d0' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#16a34a'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#bbf7d0'}>
                <p className="text-2xl mb-1">🌾</p>
                <p className="font-bold text-gray-800 text-sm">Farmer / Community Member</p>
                <p className="text-xs text-gray-500 mt-0.5">I farm, raise animals, or live in a rural community</p>
              </button>

              <button onClick={() => setRole('professional')}
                className="w-full py-5 rounded-2xl text-left px-5 transition-all"
                style={{ background: '#eff6ff', border: '2px solid #bfdbfe' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#bfdbfe'}>
                <p className="text-2xl mb-1">🔬</p>
                <p className="font-bold text-gray-800 text-sm">Agriculture / Public Health Professional</p>
                <p className="text-xs text-gray-500 mt-0.5">Agronomist, animal scientist, researcher, surveillance officer, policy maker</p>
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
    <div className="min-h-screen px-4 py-8" style={{ background: '#f0fdf4' }}>
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white text-xs font-bold px-4 py-1.5 rounded-full"
            style={{ background: role === 'farmer' ? '#065f46' : '#1e40af' }}>
            {role === 'farmer' ? '🌾 Farmer Evaluation' : '🔬 Professional Evaluation'}
          </div>
        </div>

        <div className="bg-white rounded-full h-2 mb-2 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#065f46' }} />
        </div>
        <p className="text-xs text-center text-gray-400 mb-6">
          Step {step + 1} of {totalSteps}
        </p>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
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
          {step < totalSteps - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold"
              style={{ background: '#065f46' }}>
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: '#16a34a' }}>
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