// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇳🇬' },
  { code: 'ha', label: 'Hausa', flag: '🌙' },
  { code: 'yo', label: 'Yoruba', flag: '🌍' },
  { code: 'ig', label: 'Igbo', flag: '🌿' },
  { code: 'pcm', label: 'Pidgin', flag: '🗣️' },
]

const CONTENT = {
  en: {
    title: 'OneHealth Hub',
    subtitle: 'Report sick animals. Get health warnings. Protect your family.',
    importance: 'Why this matters:',
    importanceText: 'Every year, diseases that start in animals kill thousands of Nigerians. When farmers report early, lives are saved. This platform makes reporting easy — on any phone, in your language, for free.',
    storyTitle: 'How it works',
    steps: [
      { icon: '🐄', title: 'You see something wrong', desc: 'Your cow is sick. Your chickens are dying. People in your village are falling ill.' },
      { icon: '📱', title: 'You report it — any phone', desc: 'Dial *384*12032026# on ANY basic phone. No internet needed. Takes 2 minutes. Free.' },
      { icon: '⚡', title: 'Government knows instantly', desc: 'Your report reaches the right officer immediately — no delays, no paperwork.' },
      { icon: '👨‍⚕️', title: 'Help comes to your area', desc: 'A vet officer or health worker is sent to investigate and assist.' },
      { icon: '🔔', title: 'You get warned first', desc: 'Before the next outbreak, you receive a warning in Hausa, Pidgin, Yoruba or Igbo.' },
      { icon: '🌍', title: 'Your community stays safe', desc: 'Early reporting stops disease from spreading across Nigeria.' },
    ],
    ussd: 'No smartphone needed',
    ussdSub: 'Dial *384*12032026# on any basic phone',
    cta1: 'Explore the Platform',
    cta2: 'Give Your Feedback (5 mins)',
    safe: 'Your report is safe and anonymous. No one will take your animals.',
  },
  ha: {
    title: 'OneHealth Hub',
    subtitle: 'Ka ba da rahoto game da dabbobi marasa lafiya. Ka karbi gargadi. Ka kare iyalinka.',
    importance: 'Me ya sa wannan yana da muhimmanci:',
    importanceText: 'Kowace shekara, cututtuka da ke farawa a cikin dabbobi suna kashe dubban \u2019yan Najeriya. Lokacin da manoma suka ba da rahoto da wuri, ana ceton rayuka. Wannan dandali yana saukaka ba da rahoto — a kowane waya, a harshen ka, kyauta.',
    storyTitle: 'Yadda yake aiki',
    steps: [
      { icon: '🐄', title: 'Ka ga wani abu mara kyau', desc: 'Shanun ka suna rashin lafiya. Kaji na mutuwa. Mutanen ƙauyenka suna kamu da cuta.' },
      { icon: '📱', title: 'Ka ba da rahoto — kowane waya', desc: 'Buga *384*12032026# a KOWANE wayar hannu. Ba a buƙatar intanet. Yana ɗaukar minti 2. Kyauta.' },
      { icon: '⚡', title: 'Gwamnati ta san nan take', desc: 'Rahotonka ya kai wurin jami\u2019in da ya dace nan take — babu jinkiri, babu takardu.' },
      { icon: '👨‍⚕️', title: 'Ana aika taimako zuwa yankin ka', desc: 'Ana aika likitan dabbobi ko ma’aikacin lafiya don bincike da taimako.' },
      { icon: '🔔', title: 'Ka sami gargadi da farko', desc: 'Kafin barkewar cutar gaba, za ka karbi gargadi cikin Hausa, Pidgin, Yoruba ko Igbo.' },
      { icon: '🌍', title: 'Al’ummar ka tana cikin aminci', desc: 'Ba da rahoto da wuri yana hana cutar yada ko’ina a Najeriya.' },
    ],
    ussd: 'Ba a buƙatar smartphone',
    ussdSub: 'Buga *384*12032026# a kowane wayar yau da kullun',
    cta1: 'Bincika Platform din',
    cta2: 'Ba da Ra\u2019ayin Ka (minti 5)',
    safe: 'Rahotonka yana da aminci kuma ba a san wanda ya ba da rahoto ba. Ba za a ƙwace dabbobin ka ba.',
  },
  yo: {
    title: 'OneHealth Hub',
    subtitle: 'Jabo eranko aisan. Gba ikilowo ilera. Daabo bo ebi rẹ.',
    importance: 'Idi ti eyi fi ṣe pataki:',
    importanceText: 'Ni gbogbo ọdun, awọn arun ti o bẹrẹ ninu eranko pa ẹgbẹẹgbẹrun awọn ara Naijiria. Nigba ti awọn agbẹ ba jabo ni kutukutu, a gba ẹmi là. Pẹpẹ yii jẹ ki ijabo rọrun — lori foonu eyikeyi, ni ede rẹ, fun ọfẹ.',
    storyTitle: 'Bii o ṣe n ṣiṣẹ',
    steps: [
      { icon: '🐄', title: 'O ri nkan ti ko tọ', desc: 'Màlúù rẹ n ṣaisan. Adie rẹ n kú. Eniyan ni abule rẹ n ṣaisan.' },
      { icon: '📱', title: 'O jabo — foonu eyikeyi', desc: 'Pe *384*12032026# lori FOONU eyikeyi. Ko nilo intanẹẹti. Gba iṣẹju 2. Ọfẹ.' },
      { icon: '⚡', title: 'Ijọba mọ lẹsẹkẹsẹ', desc: 'Ijabo rẹ de ọdọ oṣiṣẹ to tọ lẹsẹkẹsẹ — ko si idaduro, ko si iwe.' },
      { icon: '👨‍⚕️', title: 'Iranlọwọ wa si agbegbe rẹ', desc: 'Dokita eranko tabi oṣiṣẹ ilera ni a fi ranṣẹ lati ṣe iwadii ati iranlọwọ.' },
      { icon: '🔔', title: 'O gba ikilowo ni akọkọ', desc: 'Ṣaaju ibesile arun ti o tẹle, iwọ yoo gba ikilowo ni Yoruba, Hausa, Pidgin tabi Igbo.' },
      { icon: '🌍', title: 'Agbegbe rẹ wa ni ailewu', desc: 'Ijabo ni kutukutu da arun lọwọ lati tan kaakiri Naijiria.' },
    ],
    ussd: 'Ko nilo smartphone',
    ussdSub: 'Pe *384*12032026# lori foonu ipilẹ eyikeyi',
    cta1: 'Ṣawari Platform naa',
    cta2: 'Fun Wa Ni Ero Rẹ (iṣẹju 5)',
    safe: 'Ijabo rẹ jẹ ailewu ati airi-orukọ. Ko si ẹnikan ti yoo gba eranko rẹ.',
  },
  ig: {
    title: 'OneHealth Hub',
    subtitle: 'Kọọ anụmanụ ọrịa. Nata ọkwa ahụike. Chebe ezinụlọ gị.',
    importance: 'Ihe kpatara o ji dị mkpa:',
    importanceText: 'N\'ọdụn ọ bụla, ọrịa ndị malite na anụmanụ na-egbu ọtụtụ puku ndị Naịjirịa. Mgbe ndị ọrụ ugbo na-akọ n\'oge, a na-azọpụta ndụ. Ikpo okwu a na-eme nkọwa dị mfe — na ekwentị ọ bụla, n\'asụsụ gị, n\'efu.',
    storyTitle: 'Otú o si arụ ọrụ',
    steps: [
      { icon: '🐄', title: 'I hụ ihe na-adịghị mma', desc: 'Anụ ehi gị na-arịa ọrịa. Ọkụkọ gị na-anwụ. Ndị mmadụ n\'obodo gị na-arịa ọrịa.' },
      { icon: '📱', title: 'I kọọ — ekwentị ọ bụla', desc: 'Kpọọ *384*12032026# na EKWENTỊ ọ bụla. Achọghị ịntanetị. Na-ewe nkeji 2. N\'efu.' },
      { icon: '⚡', title: 'Gọọmentị maara ozugbo', desc: 'Nkọwa gị ruo n\'aka onye ọrụ kwesịrị ekwesị ozugbo — ọ nweghị ntụgharị, ọ nweghị akwụkwọ.' },
      { icon: '👨‍⚕️', title: 'Enyemaka na-abịa n\'mpaghara gị', desc: 'A na-eziga dọkịta anụmanụ ma ọ bụ onye ọrụ ahụike iji nyochaa ma nyere aka.' },
      { icon: '🔔', title: 'I nata ọkwa nke mbụ', desc: 'Tupu ọrịa ọzọ na-apụta, ị ga-enweta ọkwa n\'Igbo, Hausa, Pidgin ma ọ bụ Yoruba.' },
      { icon: '🌍', title: 'Obodo gị dị na nchekwa', desc: 'Ịkọ n\'oge na-egbochi ọrịa isi na-agbasa n\'ofe Naịjirịa.' },
    ],
    ussd: 'Smartphone achọghị',
    ussdSub: 'Kpọọ *384*12032026# na ekwentị ntọala ọ bụla',
    cta1: 'Nyochaa Platform ahụ',
    cta2: 'Nye Anyị Echiche Gị (nkeji 5)',
    safe: 'Nkọwa gị dị mma ma anonymous. Ọ dịghị onye ga-ewepụ anụmanụ gị.',
  },
  pcm: {
    title: 'OneHealth Hub',
    subtitle: 'Report sick animal. Get health warning. Protect your family.',
    importance: 'Why this thing dey important:',
    importanceText: 'Every year, sickness wey start from animal dey kill plenty Nigerians. When farmer report early, government fit save life. This app make am easy to report — on any phone, for your language, free of charge.',
    storyTitle: 'How e dey work',
    steps: [
      { icon: '🐄', title: 'You see something wrong', desc: 'Your cow dey sick. Your chicken dey die. People for your village dey fall sick.' },
      { icon: '📱', title: 'You report am — any phone', desc: 'Dial *384*12032026# on ANY basic phone. You no need internet. E take 2 minutes. E free.' },
      { icon: '⚡', title: 'Government know immediately', desc: 'Your report reach the right officer immediately — no delay, no paperwork.' },
      { icon: '👨‍⚕️', title: 'Help come to your area', desc: 'Vet officer or health worker go come check and help you.' },
      { icon: '🔔', title: 'You get warning first', desc: 'Before the next outbreak reach your area, you go receive warning in Pidgin, Hausa, Yoruba or Igbo.' },
      { icon: '🌍', title: 'Your community dey safe', desc: 'Early report stop sickness from spreading across Nigeria.' },
    ],
    ussd: 'Smartphone no necessary',
    ussdSub: 'Dial *384*12032026# on any ordinary phone',
    cta1: 'See the Platform',
    cta2: 'Give Us Your Feedback (5 mins)',
    safe: 'Your report dey safe and nobody go know your name. Nobody go carry your animal.',
  },
}

export default function WelcomePage() {
  const [lang, setLang] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!lang) return
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setActiveStep(s => (s + 1) % 6)
        setAnimating(false)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [lang])

  if (!lang) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
        <div style={{ maxWidth: 360, width: '100%' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28, fontWeight: 900, color: 'white',
            }}>1H</div>
            <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>OneHealth Hub</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8 }}>
              Nigeria · Zoonotic Disease Surveillance
            </p>
          </div>

          {/* Language picker */}
          <div style={{
            background: 'white', borderRadius: 24, padding: 24,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              Choose your language
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setLang(l.code)}
                  style={{
                    padding: '14px 20px', borderRadius: 14,
                    border: '2px solid #d1fae5', background: '#f0fdf4',
                    color: '#065f46', fontWeight: 700, fontSize: 15,
                    cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#065f46'
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.borderColor = '#065f46'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f0fdf4'
                    e.currentTarget.style.color = '#065f46'
                    e.currentTarget.style.borderColor = '#d1fae5'
                  }}
                >
                  <span style={{ fontSize: 22 }}>{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const c = CONTENT[lang]
  const step = c.steps[activeStep]

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4', fontFamily: 'system-ui, sans-serif' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
        padding: '40px 20px 60px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.15)', borderRadius: 50,
          padding: '6px 16px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>1H</span>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600 }}>OneHealth Hub · Nigeria</span>
        </div>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
          {c.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.6, maxWidth: 340, margin: '0 auto 24px' }}>
          {c.subtitle}
        </p>

        {/* USSD pill */}
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 16, padding: '10px 20px',
        }}>
          <span style={{ color: '#6ee7b7', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            📱 {c.ussd}
          </span>
          <span style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: 2, marginTop: 2 }}>
            *384*12032026#
          </span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>{c.ussdSub}</span>
        </div>
      </div>

      {/* Why it matters */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          background: '#fef3c7', border: '2px solid #f59e0b',
          borderRadius: 20, padding: '20px 20px', margin: '-20px 0 24px',
          position: 'relative',
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            ⚠️ {c.importance}
          </p>
          <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6, margin: 0 }}>
            {c.importanceText}
          </p>
        </div>

        {/* Animated story strip */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' }}>
            {c.storyTitle}
          </p>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            {c.steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                style={{
                  width: i === activeStep ? 24 : 8, height: 8,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: i === activeStep ? '#065f46' : '#bbf7d0',
                  transition: 'all 0.3s',
                }} />
            ))}
          </div>

          {/* Active step card */}
          <div style={{
            background: 'white', borderRadius: 24,
            padding: 28, textAlign: 'center',
            boxShadow: '0 4px 24px rgba(6,79,60,0.12)',
            border: '2px solid #d1fae5',
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(8px)' : 'translateY(0)',
            transition: 'all 0.3s',
            minHeight: 180,
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{step.icon}</div>
            <div style={{
              display: 'inline-block', background: '#065f46', color: 'white',
              fontSize: 11, fontWeight: 800, borderRadius: 50, padding: '3px 12px',
              marginBottom: 10, letterSpacing: 0.5,
            }}>
              {activeStep + 1} / 6
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#064e3b', margin: '0 0 8px' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>
              {step.desc}
            </p>
          </div>

          {/* Tap to advance */}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
            Tap the dots above to navigate • Auto-advances every 2.5 seconds
          </p>
        </div>

        {/* Safety notice */}
        <div style={{
          background: '#ecfdf5', border: '1px solid #6ee7b7',
          borderRadius: 16, padding: '14px 16px', marginBottom: 24,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🔒</span>
          <p style={{ fontSize: 13, color: '#065f46', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
            {c.safe}
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          <a href="/dashboard" style={{
            display: 'block', textAlign: 'center', padding: '16px',
            borderRadius: 18, background: '#065f46', color: 'white',
            fontWeight: 800, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(6,79,60,0.3)',
          }}>
            {c.cta1} →
          </a>
          <a href="/evaluation" style={{
            display: 'block', textAlign: 'center', padding: '16px',
            borderRadius: 18, background: 'white', color: '#065f46',
            fontWeight: 800, fontSize: 15, textDecoration: 'none',
            border: '2px solid #065f46',
          }}>
            📝 {c.cta2}
          </a>
        </div>

        {/* Language switcher */}
        <div style={{ textAlign: 'center', paddingBottom: 32 }}>
          <button onClick={() => { setLang(null); setActiveStep(0) }}
            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer' }}>
            🌐 Change language
          </button>
        </div>
      </div>
    </div>
  )
}
