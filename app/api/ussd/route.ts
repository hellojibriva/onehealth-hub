// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canonicalState, titleCase, zoneForState } from '@/lib/geo'
import type { CanonicalSignal } from '@/lib/taxonomy'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MENUS = {
  EN: {
    welcome: `Welcome to OneHealth Hub\nSelect language:\n1. English\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Report outbreak\n2. Disease alerts\n3. Livestock tips\n4. Environmental alerts`,
    report_type: `What are you reporting?\n1. Human illness\n2. Sick animals\n3. Water/environment issue`,
    ask_state: `Please enter your state:`,
    ask_location: `Please enter your LGA or town name:`,
    symptoms_human: `What symptoms?\n1. Fever\n2. Diarrhea/vomiting\n3. Skin rash/sores\n4. Breathing difficulty\n5. Other`,
    symptoms_animal: `What signs?\n1. Sudden death\n2. Not eating/weak\n3. Skin sores/swelling\n4. Abortion/miscarriage\n5. Other`,
    symptoms_env: `What issue?\n1. Contaminated water\n2. Flooding\n3. Dead animals near water\n4. Unusual smell/waste\n5. Other`,
    confirm: `Report received. Thank you.\nA OneHealth officer will follow up within 24hrs.\nRef: OH-`,
    no_alerts: `No active alerts for your area right now. Stay safe and report any unusual illness or animal deaths.`,
    tips: `Livestock tip:\nVaccinate poultry against Newcastle disease. Report dead birds immediately to nearest vet.`,
    env: `Environmental alert:\nAvoid drinking untreated water. Boil water before use in affected areas.`,
  },
  HA: {
    welcome: `Barka da zuwa OneHealth Hub\nZabi harshe:\n1. Turanci\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Rahoton annoba\n2. Sanarwar cututtuka\n3. Shawarwarin dabbobi\n4. Sanarwar muhalli`,
    report_type: `Me kake rahoto?\n1. Cutar dan adam\n2. Dabbobi marasa lafiya\n3. Matsalar ruwa/muhalli`,
    ask_state: `Da fatan za a shigar da jihar ku:`,
    ask_location: `Da fatan za a shigar da unguwar ku ko birni:`,
    symptoms_human: `Wadanne alamu?\n1. Zazzabi\n2. Gudawa/amai\n3. Kurji/miki a fata\n4. Wahalar numfashi\n5. Wani abu`,
    symptoms_animal: `Wadanne alamu?\n1. Mutuwa ba zato\n2. Rashin ci/rauni\n3. Miki a fata\n4. Zubar ciki\n5. Wani abu`,
    symptoms_env: `Wace matsala?\n1. Ruwa mai gurbi\n2. Ambaliya\n3. Dabbobin da suka mutu kusa da ruwa\n4. Wari mara kyau\n5. Wani abu`,
    confirm: `An karbi rahoton. Na gode.\nJami'in OneHealth zai tuntube ka cikin awowi 24.\nRef: OH-`,
    no_alerts: `Babu sanarwa a yankin ka yanzu. Ka kasance lafiya kuma ka ba da rahoto game da duk wata cuta ko mutuwar dabbobi.`,
    tips: `Shawara kan dabbobi:\nAllurar rigakafin kaji daga cutar Newcastle. Kai garkuwa da tsuntsayen da suka mutu nan take.`,
    env: `Sanarwar muhalli:\nKauce sha ruwan da ba a kula ba. Dafar ruwa kafin amfani.`,
  },
  IG: {
    welcome: `Nnoo na OneHealth Hub\nHoo asuu:\n1. Bekee\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Koo ihe ojoo\n2. Ndeozi oria\n3. Ndumod anumanu\n4. Ndeozi gburugburu`,
    report_type: `Gini ka i na-ako?\n1. Oria mmadu\n2. Anumanu oria\n3. Nsogbu mmiri/gburugburu`,
    ask_state: `Biko tinye steeti gi:`,
    ask_location: `Biko tinye LGA ma obu obodo gi:`,
    symptoms_human: `Gini bu ihe mmadu na-enwe?\n1. Ahuru oku\n2. Afo/iwe\n3. Oria ahu\n4. Ike ikuku\n5. Ozo`,
    symptoms_animal: `Gini bu ihe anumanu na-enwe?\n1. Onwu na mberede\n2. Adighi eri nri\n3. Oria ahu\n4. Iwepu nwa n'afo\n5. Ozo`,
    symptoms_env: `Gini bu nsogbu?\n1. Mmiri ruru unyi\n2. Idei mmiri\n3. Anumanu nwuru anwu n'akuku mmiri\n4. Isi ojo\n5. Ozo`,
    confirm: `Anabata akuko. Daalu.\nOji OneHealth ga-akpotu gi n'ime awa 24.\nRef: OH-`,
    no_alerts: `Enweghị ndeozi ọ bụla maka mpaghara gị ugbu a. Nọrọ n'ahụike ma kọọ ọ bụla ọrịa ma ọ bụ ọnwụ anụmanụ.`,
    tips: `Ndumod anumanu:\nTinye ogwu oghere opa megide oria Newcastle. Koo nnunu nwuru anwu ozugbo.`,
    env: `Ndeozi gburugburu:\nZere imu mmiri na-aloghị ocha. Sie mmiri tupu iji n'ebe nwere nsogbu.`,
  },
  YO: {
    welcome: `Kaabo si OneHealth Hub\nYan ede:\n1. Gesi\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Jabo ajakale\n2. Ikilowo arun\n3. Imoran eranko\n4. Ikilowo ayika`,
    report_type: `Kini o n jabo?\n1. Arun eniyan\n2. Eranko aisan\n3. Isoro omi/ayika`,
    ask_state: `Jowo tẹ ipinlẹ rẹ sii:`,
    ask_location: `Jowo tẹ agbegbe tabi ilu rẹ sii:`,
    symptoms_human: `Awọn aami wo?\n1. Iba\n2. Igbe gburu/eebi\n3. Ara sisu\n4. Isoro emi\n5. Miiran`,
    symptoms_animal: `Awọn ami wo?\n1. Iku lojiji\n2. Ko je/ailera\n3. Ara sisu\n4. Sisọ oyun\n5. Miiran`,
    symptoms_env: `Isoro wo?\n1. Omi didoti\n2. Iyalenu\n3. Eranko ti o ku nitosi omi\n4. Oorun aidun\n5. Miiran`,
    confirm: `Ijabo gba. E se.\nOsi OneHealth yoo pe o pada laarin wakati 24.\nRef: OH-`,
    no_alerts: `Ko si ikilowo ti n ṣiṣẹ fun agbegbe rẹ ni bayi. Jẹ ki o wa ni ailewu ki o jabo eyikeyi aisan tabi iku eranko.`,
    tips: `Imoran eranko:\nDaabobo adie lodi si arun Newcastle. Jabo eye ti o ku lesekese si dokita eranko.`,
    env: `Ikilowo ayika:\nMase mu omi ti a ko toju. Se omi saaju lilo ni agbegbe ti o kan.`,
  },
  PCM: {
    welcome: `Welcome to OneHealth Hub\nPick your language:\n1. English\n2. Hausa\n3. Igbo\n4. Yoruba\n5. Pidgin`,
    main: `OneHealth Hub\n1. Report sickness\n2. Health alerts\n3. Animal tips\n4. Water wahala`,
    report_type: `Wetin you wan report?\n1. Person dey sick\n2. Animal dey sick\n3. Water or ground problem`,
    ask_state: `Abeg enter your state:`,
    ask_location: `Abeg enter your LGA or town:`,
    symptoms_human: `Wetin be d symptom?\n1. Fever\n2. Belle run/vomit\n3. Skin rash\n4. Breathing wahala\n5. Other`,
    symptoms_animal: `Wetin you notice?\n1. E die sudden\n2. E no dey chop/weak\n3. Skin sore\n4. E lose belle\n5. Other`,
    symptoms_env: `Wetin be d problem?\n1. Water don spoil\n2. Flood\n3. Animal don die near water\n4. Bad smell\n5. Other`,
    confirm: `We don receive your report. Thank you.\nOneHealth officer go call you back within 24hrs.\nRef: OH-`,
    no_alerts: `No active alert for your area now. Stay safe. Report any sick person or dead animal wey you see.`,
    tips: `Animal tip:\nVaccinate your poultry against Newcastle disease. Report any dead bird to vet office quick quick.`,
    env: `Water wahala:\nNo drink water wey no pure. Boil water before you use am for affected areas.`,
  },
}

// Default zone to fall back on when the caller has not told us their state.
// Hausa is the localised pathway for all three northern zones, so North West is
// only a starting point — getLatestAlert() widens the search to the language
// alone if that zone has nothing. English is the general language and belongs to
// no single zone, so it has no default.
const LANG_TO_ZONE: Record<string, string | null> = {
  'EN': null,
  'HA': 'North West',
  'IG': 'South East',
  'YO': 'South West',
  'PCM': 'South South',
}

const LANG_CODE_MAP: Record<string, string> = {
  'EN': 'en', 'HA': 'ha', 'IG': 'ig', 'YO': 'yo', 'PCM': 'pcm'
}


// Sign/symptom menu options, expressed in the canonical signal vocabulary so a
// USSD report lands on the dashboard under the same label the map filters use.
const SYMPTOM_LABELS: Record<string, Record<string, CanonicalSignal>> = {
  HUMAN: {
    '1': 'Fever', '2': 'Diarrhea/vomiting', '3': 'Skin rash/sores',
    '4': 'Breathing difficulty', '5': 'Other (unspecified)',
  },
  ANIMAL: {
    '1': 'Sudden death', '2': 'Not eating/weak', '3': 'Skin sores/swelling',
    '4': 'Abortion/miscarriage', '5': 'Other (unspecified)',
  },
  ENVIRONMENTAL: {
    '1': 'Contaminated water', '2': 'Flooding', '3': 'Dead animals near water',
    '4': 'Unusual smell/waste', '5': 'Other (unspecified)',
  },
}

type LangKey = 'EN' | 'HA' | 'IG' | 'YO' | 'PCM'

async function getLatestAlert(zone: string | null, langCode: string): Promise<string | null> {
  async function query(withZone: boolean) {
    let q = supabase
      .from('rcce_alerts')
      .select('body_text, disease, prevention_tips, where_to_go, ussd_screen_1')
      .eq('status', 'SENT')
      .eq('language_code', langCode)
    if (withZone && zone) q = q.eq('geopolitical_zone', zone)
    const { data } = await q.order('sent_at', { ascending: false }).limit(1).maybeSingle()
    return data
  }

  // Prefer the caller's own zone; otherwise fall back to the most recent alert
  // in their language, since Hausa serves three zones and English serves all six.
  const data = (zone ? await query(true) : null) ?? await query(false)

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
    .maybeSingle()

  if (session?.language) lang = session.language as LangKey

  // Step 1: Language selection
  if (text === '') {
    await supabase.from('ussd_sessions').upsert({
      phone_number: phoneNumber,
      session_id: sessionId,
      current_step: 'language',
    }, { onConflict: 'phone_number' })
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
    }, { onConflict: 'phone_number' })
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
      const zone = LANG_TO_ZONE[lang] ?? null
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

  // Step 4: Report type chosen — ask for state
  if (step === 3 && inputs[1] === '1') {
    return new NextResponse(`CON ${MENUS[lang].ask_state}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 5: State entered — show symptom/sign menu based on report type
  if (step === 4 && inputs[1] === '1') {
    const typeMap: Record<string, string> = {
      '1': 'HUMAN', '2': 'ANIMAL', '3': 'ENVIRONMENTAL'
    }
    const reportType = typeMap[inputs[2]] || 'HUMAN'
    const menu = MENUS[lang]
    const symptomMenu =
      reportType === 'HUMAN' ? menu.symptoms_human :
      reportType === 'ANIMAL' ? menu.symptoms_animal :
      menu.symptoms_env

    return new NextResponse(`CON ${symptomMenu}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 6: Symptom chosen — ask for LGA/town
  if (step === 5 && inputs[1] === '1') {
    return new NextResponse(`CON ${MENUS[lang].ask_location}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Step 7: Location entered — save report and confirm
  if (step === 6 && inputs[1] === '1') {
    const typeMap: Record<string, string> = {
      '1': 'HUMAN', '2': 'ANIMAL', '3': 'ENVIRONMENTAL'
    }
    const reportType = typeMap[inputs[2]] || 'HUMAN'
    const stateInput = inputs[3]?.trim() || 'Unspecified'
    const symptomChoice = inputs[4]
    const townInput = inputs[5]?.trim() || 'Unspecified'
    const ref = Math.random().toString(36).substring(2, 8).toUpperCase()

    const symptomLabel = SYMPTOM_LABELS[reportType]?.[symptomChoice] ?? 'Other (unspecified)'
    const stateName = canonicalState(stateInput) ?? 'Unspecified'
    const townName = townInput === 'Unspecified' ? 'Unspecified' : titleCase(townInput)
    const zone = zoneForState(stateInput) ?? LANG_TO_ZONE[lang] ?? 'Unassigned'

    // Keep the raw audit log. This table holds the reporter's phone number so a
    // field officer can follow up; it must not be exposed to unauthenticated
    // readers (see data/migrations/002_restrict_ussd_reports.sql).
    await supabase.from('ussd_reports').insert({
      phone_number: phoneNumber,
      report_type: reportType,
      location_text: `${stateName}, ${townName}`,
      language: lang,
      synced: true,
    })

    // Write directly to locations + outbreaks so it appears on the dashboard
    try {
      let locationId: string | null = null

      const { data: existingLoc } = await supabase
        .from('locations').select('id')
        .ilike('name', townName).eq('state', stateName).limit(1).maybeSingle()

      if (existingLoc) {
        locationId = existingLoc.id
      } else {
        const { data: newLoc } = await supabase
          .from('locations')
          .insert({
            name: townName,
            state: stateName,
            // The USSD prompt asks for "your LGA or town", so we do not know
            // which we were given. Recording a settlement as its own LGA is how
            // Doko — a town in Garki LGA — became a Jigawa LGA in the data.
            // Left null for a field officer to establish during follow-up.
            lga: null,
            ward: null,
            geopolitical_zone: zone,
            // Placed at the national centroid until a field officer confirms the
            // town during follow-up. Coordinates are deliberately not guessed.
            latitude: 9.082,
            longitude: 8.675,
          })
          .select('id').maybeSingle()
        locationId = newLoc?.id ?? null
      }

      // The reporter's phone number stays in `ussd_reports` (the audit log an
      // officer needs for follow-up) and is deliberately NOT written into
      // `outbreaks`, which is read by the public dashboard.
      await supabase.from('outbreaks').insert({
        disease_name: `Community-reported: ${symptomLabel}`,
        sector: reportType,
        severity: 'MODERATE',
        status: 'ACTIVE',
        report_source: 'COMMUNITY',
        location_id: locationId,
        start_date: new Date().toISOString().slice(0, 10),
        description: `Reported via USSD · Community reporter. Sign/symptom: ${symptomLabel}. State: ${stateName}, Town/LGA: ${townName}. Language: ${lang}. Follow-up required to confirm details.`,
        reported_by: null,
      })
    } catch (err) {
      console.error('USSD-to-outbreaks sync failed:', err)
    }

    const menu = MENUS[lang]
    return new NextResponse(`END ${menu.confirm}${ref}`, {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return new NextResponse(`END Session ended. Dial again.`, {
    headers: { 'Content-Type': 'text/plain' },
  })
}