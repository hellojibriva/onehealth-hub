// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MENUS = {
  EN: {
    welcome: `Welcome to OneHealth Hub\nSelect language:\n1. English\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Report outbreak\n2. Disease alerts\n3. Livestock tips\n4. Environmental alerts`,
    report_type: `What are you reporting?\n1. Human illness\n2. Sick animals\n3. Water/environment issue`,
    confirm: `Report received. Thank you.\nA OneHealth officer will follow up within 24hrs.\nRef: OH-`,
    no_alerts: `No active alerts for your area right now. Stay safe and report any unusual illness or animal deaths.`,
    tips: `Livestock tip:\nVaccinate poultry against Newcastle disease. Report dead birds immediately to nearest vet.`,
    env: `Environmental alert:\nAvoid drinking untreated water. Boil water before use in affected areas.`,
  },
  HA: {
    welcome: `Barka da zuwa OneHealth Hub\nZabi harshe:\n1. Turanci\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Rahoton annoba\n2. Sanarwar cututtuka\n3. Shawarwarin dabbobi\n4. Sanarwar muhalli`,
    report_type: `Me kake rahoto?\n1. Cutar dan adam\n2. Dabbobi marasa lafiya\n3. Matsalar ruwa/muhalli`,
    confirm: `An karbi rahoton. Na gode.\nJami'in OneHealth zai tuntube ka cikin awowi 24.\nRef: OH-`,
    no_alerts: `Babu sanarwa a yankin ka yanzu. Ka kasance lafiya kuma ka ba da rahoto game da duk wata cuta ko mutuwar dabbobi.`,
    tips: `Shawara kan dabbobi:\nAllurar rigakafin kaji daga cutar Newcastle. Kai garkuwa da tsuntsayen da suka mutu nan take.`,
    env: `Sanarwar muhalli:\nKauce sha ruwan da ba a kula ba. Dafar ruwa kafin amfani.`,
  },
  IG: {
    welcome: `Nnoo na OneHealth Hub\nHoo asuu:\n1. Bekee\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Koo ihe ojoo\n2. Ndeozi oria\n3. Ndumod anumanu\n4. Ndeozi gburugburu`,
    report_type: `Gini ka i na-ako?\n1. Oria mmadu\n2. Anumanu oria\n3. Nsogbu mmiri/gburugburu`,
    confirm: `Anabata akuko. Daalu.\nOji OneHealth ga-akpotu gi n'ime awa 24.\nRef: OH-`,
    no_alerts: `Enweghị ndeozi ọ bụla maka mpaghara gị ugbu a. Nọrọ n'ahụike ma kọọ ọ bụla ọrịa ma ọ bụ ọnwụ anụmanụ.`,
    tips: `Ndumod anumanu:\nTinye ogwu oghere opa megide oria Newcastle. Koo nnunu nwuru anwu ozugbo.`,
    env: `Ndeozi gburugburu:\nZere imu mmiri na-aloghị ocha. Sie mmiri tupu iji n'ebe nwere nsogbu.`,
  },
  YO: {
    welcome: `Kaabo si OneHealth Hub\nYan ede:\n1. Gesi\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Jabo ajakale\n2. Ikilowo arun\n3. Imoran eranko\n4. Ikilowo ayika`,
    report_type: `Kini o n jabo?\n1. Arun eniyan\n2. Eranko aisan\n3. Isoro omi/ayika`,
    confirm: `Ijabo gba. E se.\nOsi OneHealth yoo pe o pada laarin wakati 24.\nRef: OH-`,
    no_alerts: `Ko si ikilowo ti n ṣiṣẹ fun agbegbe rẹ ni bayi. Jẹ ki o wa ni ailewu ki o jabo eyikeyi aisan tabi iku eranko.`,
    tips: `Imoran eranko:\nDaabobo adie lodi si arun Newcastle. Jabo eye ti o ku lesekese si dokita eranko.`,
    env: `Ikilowo ayika:\nMase mu omi ti a ko toju. Se omi saaju lilo ni agbegbe ti o kan.`,
  },
  PCM: {
    welcome: `Welcome to OneHealth Hub\nPick your language:\n1. English\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Report sickness\n2. Health alerts\n3. Animal tips\n4. Water wahala`,
    report_type: `Wetin you wan report?\n1. Person dey sick\n2. Animal dey sick\n3. Water or ground problem`,
    confirm: `We don receive your report. Thank you.\nOneHealth officer go call you back within 24hrs.\nRef: OH-`,
    no_alerts: `No active alert for your area now. Stay safe. Report any sick person or dead animal wey you see.`,
    tips: `Animal tip:\nVaccinate your poultry against Newcastle disease. Report any dead bird to vet office quick quick.`,
    env: `Water wahala:\nNo drink water wey no pure. Boil water before you use am for affected areas.`,
  },
}

const LANG_TO_ZONE: Record<string, string> = {
  'EN': 'North Central',
  'HA': 'North West',
  'IG': 'South East',
  'YO': 'South West',
  'PCM': 'South South',
}

const LANG_CODE_MAP: Record<string, string> = {
  'EN': 'en', 'HA': 'ha', 'IG': 'ig', 'YO': 'yo', 'PCM': 'pcm'
}

type LangKey = 'EN' | 'HA' | 'IG' | 'YO' | 'PCM'

async function getLatestAlert(zone: string, langCode: string): Promise<string | null> {
  const { data } = await supabase
    .from('rcce_alerts')
    .select('body_text, disease, prevention_tips, where_to_go, ussd_screen_1')
    .eq('status', 'SENT')
    .eq('geopolitical_zone', zone)
    .eq('language_code', langCode)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  if (data.ussd_screen_1) return data.ussd_screen_1

  let text = `${data.disease}: ${data.body_text}`
  if (data.prevention_tips?.[0]) text += `\n${data.prevention_tips[0]}`
  if (data.where_to_go) text += `\n${data.where_to_go}`
  return text.slice(0, 160)
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const sessionId = formData.get('sessionId') as string
  const phoneNumber = formData.get('phoneNumber') as string
  const text = (formData.get('text') as string) || ''
  const inputs = text.split('*')
  const step = inputs.length

  let lang: LangKey = 'EN'
  const { data: session } = await supabase
    .from('ussd_sessions')
    .select('language')
    .eq('phone_number', phoneNumber)
    .single()

  if (session?.language) lang = session.language as LangKey

  // Step 1: Language selection
  if (text === '') {
    await supabase.from('ussd_sessions').upsert({
      phone_number: phoneNumber,
      session_id: sessionId,
      current_step: 'language',
    })
    return new NextResponse(`CON ${MENUS.EN.welcome}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 2: Language chosen — show main menu
  if (step === 1) {
    const langMap: Record<string, LangKey> = {
      '1': 'EN', '2': 'HA', '3': 'IG', '4': 'YO', '5': 'PCM'
    }
    lang = langMap[inputs[0]] || 'EN'
    await supabase.from('ussd_sessions').upsert({
      phone_number: phoneNumber,
      session_id: sessionId,
      language: lang,
      current_step: 'main_menu',
    })
    return new NextResponse(`CON ${MENUS[lang].main}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 3: Main menu choice
  if (step === 2) {
    const choice = inputs[1]
    const menu = MENUS[lang]

    if (choice === '1') {
      return new NextResponse(`CON ${menu.report_type}`, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    if (choice === '2') {
      // Pull live alert from rcce_alerts
      const zone = LANG_TO_ZONE[lang] ?? 'North Central'
      const langCode = LANG_CODE_MAP[lang] ?? 'en'
      const alertText = await getLatestAlert(zone, langCode)
      const response = alertText ?? menu.no_alerts
      return new NextResponse(`END ${response}`, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    if (choice === '3') {
      return new NextResponse(`END ${menu.tips}`, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    if (choice === '4') {
      return new NextResponse(`END ${menu.env}`, {
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    return new NextResponse(`END Invalid option. Please dial again.`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 4: Report type chosen — ask for location
  if (step === 3 && inputs[1] === '1') {
    return new NextResponse(`CON Please enter your LGA or town name:`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 5: Location entered — save report and confirm
  if (step === 4 && inputs[1] === '1') {
    const typeMap: Record<string, string> = {
      '1': 'HUMAN', '2': 'ANIMAL', '3': 'ENVIRONMENTAL'
    }
    const reportType = typeMap[inputs[2]] || 'HUMAN'
    const location = inputs[3]
    const ref = Math.random().toString(36).substring(2, 8).toUpperCase()

    await supabase.from('ussd_reports').insert({
      phone_number: phoneNumber,
      report_type: reportType,
      location_text: location,
      language: lang,
      synced: false,
    })

    const menu = MENUS[lang]
    return new NextResponse(`END ${menu.confirm}${ref}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new NextResponse(`END Session ended. Dial again.`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}