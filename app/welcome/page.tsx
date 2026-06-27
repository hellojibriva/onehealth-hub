// @ts-nocheck
'use client'

import { useState } from 'react'

export default function WelcomePage() {
  const [lang, setLang] = useState<'en' | 'ha' | 'yo' | 'ig' | 'pcm' | null>(null)

  const content = {
    en: {
      greeting: 'Welcome to OneHealth Hub',
      tagline: 'A free tool to report sick animals, sick people, and get health alerts — on any phone.',
      what: 'What can you do here?',
      features: [
        { icon: '🐄', text: 'Report if your animal is sick or dying' },
        { icon: '🤒', text: 'Report if people in your area are falling sick' },
        { icon: '🔔', text: 'Get health alerts for your area in your language' },
        { icon: '📱', text: 'Works without internet — even on basic phones via USSD' },
      ],
      cta: 'Explore the Platform',
      evaluate: 'Give Us Your Feedback (5 mins)',
      ussd: 'No smartphone? Dial *384*131# on any phone',
    },
    ha: {
      greeting: 'Barka da zuwa OneHealth Hub',
      tagline: 'Kayan aiki kyauta don ba da rahoto game da dabbobi ko mutanen da suka kamu da cuta — a kowane waya.',
      what: 'Me za ka iya yi anan?',
      features: [
        { icon: '🐄', text: 'Ba da rahoto idan dabbobin ka suna rashin lafiya ko mutuwa' },
        { icon: '🤒', text: 'Ba da rahoto idan mutane a yankin ka suna kamu da cuta' },
        { icon: '🔔', text: 'Karɓi sanarwar lafiya a yankin ka cikin harshen ka' },
        { icon: '📱', text: 'Yana aiki ba tare da intanet ba — ma a wayoyin yau da kullun ta USSD' },
      ],
      cta: 'Bincika Platform din',
      evaluate: 'Ba da Ra\'ayin Ka (minti 5)',
      ussd: 'Babu smartphone? Buga *384*131# a kowane waya',
    },
    yo: {
      greeting: 'Kaabo si OneHealth Hub',
      tagline: 'Elo ọfẹ lati jabo eranko tabi eniyan aisan — lori foonu eyikeyi.',
      what: 'Kini o le ṣe nibi?',
      features: [
        { icon: '🐄', text: 'Jabo ti eranko rẹ ba n ṣaisan tabi ku' },
        { icon: '🤒', text: 'Jabo ti eniyan ni agbegbe rẹ ba n ṣaisan' },
        { icon: '🔔', text: 'Gba ikilowo ilera fun agbegbe rẹ ni ede rẹ' },
        { icon: '📱', text: 'Ṣiṣẹ laisi intanẹẹti — paapaa lori foonu ipilẹ nipasẹ USSD' },
      ],
      cta: 'Ṣawari Platform naa',
      evaluate: 'Fun Wa Ni Ero Rẹ (iṣẹju 5)',
      ussd: 'Ko si smartphone? Pe *384*131# lori foonu eyikeyi',
    },
    ig: {
      greeting: 'Nnoo na OneHealth Hub',
      tagline: 'Ngwa ọrụ efu iji kọọ anụmanụ ma ọ bụ mmadụ ọrịa — n\'ekwentị ọ bụla.',
      what: 'Gịnị ka ị nwere ike ime ebe a?',
      features: [
        { icon: '🐄', text: 'Kọọ ma anụmanụ gị na-arịa ọrịa ma ọ bụ na-anwụ' },
        { icon: '🤒', text: 'Kọọ ma ndị mmadụ n\'mpaghara gị na-arịa ọrịa' },
        { icon: '🔔', text: 'Nata ọkwa ahụike maka mpaghara gị n\'asụsụ gị' },
        { icon: '📱', text: 'Na-arụ ọrụ na-enweghị ịntanetị — ọbụna n\'ekwentị ntọala site na USSD' },
      ],
      cta: 'Nyochaa Platform ahụ',
      evaluate: 'Nye Anyị Echiche Gị (nkeji 5)',
      ussd: 'Enweghị smartphone? Kpọọ *384*131# n\'ekwentị ọ bụla',
    },
    pcm: {
      greeting: 'Welcome to OneHealth Hub',
      tagline: 'Free app wey you fit use report sick animal or sick person — on any phone at all.',
      what: 'Wetin you fit do here?',
      features: [
        { icon: '🐄', text: 'Report if your animal dey sick or dey die' },
        { icon: '🤒', text: 'Report if people for your area dey fall sick' },
        { icon: '🔔', text: 'Receive health warning for your area for your own language' },
        { icon: '📱', text: 'E work without internet — even on ordinary phone with USSD' },
      ],
      cta: 'See the Platform',
      evaluate: 'Give Us Your Feedback (5 mins)',
      ussd: 'No get smartphone? Dial *384*131# on any phone',
    },
  }

  if (!lang) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">1H</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">OneHealth Hub</h1>
          <p className="text-sm text-gray-500 mb-6">Choose your language / Zabi harshe / Yan ede / Hoo asuu / Pick language</p>

          <div className="space-y-3">
            {[
              { code: 'en', label: '🇳🇬 English' },
              { code: 'ha', label: '🌙 Hausa' },
              { code: 'yo', label: '🌍 Yoruba' },
              { code: 'ig', label: '🌿 Igbo' },
              { code: 'pcm', label: '🗣️ Pidgin' },
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as any)}
                className="w-full py-3.5 rounded-2xl bg-teal-50 border-2 border-teal-100 text-teal-700 font-semibold text-sm hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const c = content[lang]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-emerald-700 px-4 py-8">
      <div className="max-w-sm mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">1H</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{c.greeting}</h1>
          <p className="text-teal-100 text-sm leading-relaxed">{c.tagline}</p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-3xl p-6 mb-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{c.what}</h2>
          <div className="space-y-4">
            {c.features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <p className="text-sm text-gray-700 font-medium leading-snug mt-1">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* USSD note */}
        <div className="bg-white/10 rounded-2xl px-4 py-3 mb-4 text-center">
          <p className="text-teal-100 text-xs font-medium">📱 {c.ussd}</p>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <a
            href="/dashboard"
            className="block w-full py-4 rounded-2xl bg-white text-teal-700 font-bold text-center text-sm hover:bg-teal-50 transition-colors shadow-lg"
          >
            {c.cta} →
          </a>
          <a
            href="/evaluation"
            className="block w-full py-4 rounded-2xl bg-teal-500 border-2 border-white/30 text-white font-bold text-center text-sm hover:bg-teal-400 transition-colors"
          >
            📝 {c.evaluate}
          </a>
        </div>

        {/* Language switcher */}
        <button
          onClick={() => setLang(null)}
          className="w-full mt-4 py-2 text-teal-200 text-xs font-medium hover:text-white transition-colors"
        >
          🌐 Change language
        </button>
      </div>
    </div>
  )
}
