// ============================================================
// SURVEILLANCE TAXONOMY — OneHealth Hub
//
// One place that decides, for every record on the platform:
//   1. Is this a DISEASE event or a community-reported SIGNAL?
//   2. What is the canonical name for it?
//   3. What may be shown publicly about who reported it?
//
// Rationale
// ---------
// Records reach the platform from three routes (USSD, the field
// collection form, and seeded reference events) and each route
// produced its own spellings — "Bruscellosis", "Lassa fevee",
// "Lassa fever", "Community-reported: Abortion/miscarriage".
//
// A syndromic sign such as "Abortion/miscarriage" is NOT a
// diagnosis and must never sit in the same list as Brucellosis.
// Normalising on read keeps historical rows usable without
// rewriting the operational database, and guarantees the map,
// the cards, the filters and the exports all agree.
// ============================================================

export type EventType = 'DISEASE' | 'SIGNAL'

/** Canonical disease/hazard vocabulary. Nothing outside this list is a diagnosis. */
export const CANONICAL_DISEASES = [
  'Anthrax',
  'Avian Influenza (H5N1)',
  'Brucellosis',
  'Cholera',
  'Crude Oil Contamination',
  'Lassa Fever',
  'Malaria',
  'Meningitis (CSM)',
  'Mpox',
  'Rabies',
  'Rift Valley Fever',
  'Yellow Fever',
] as const

export type CanonicalDisease = typeof CANONICAL_DISEASES[number]

/**
 * Every spelling written into the database, mapped to one canonical name.
 * Keys are lower-cased and whitespace-collapsed.
 */
const DISEASE_SYNONYMS: Record<string, CanonicalDisease> = {
  // Brucellosis — "Bruscellosis" was the recurring misspelling.
  'brucellosis': 'Brucellosis',
  'bruscellosis': 'Brucellosis',
  'brucelosis': 'Brucellosis',
  'brucella': 'Brucellosis',

  // Lassa Fever — four variants existed in the operational data.
  'lassa': 'Lassa Fever',
  'lassa fever': 'Lassa Fever',
  'lassa fevee': 'Lassa Fever',
  'lassa fevr': 'Lassa Fever',
  'lassa haemorrhagic fever': 'Lassa Fever',

  'avian influenza': 'Avian Influenza (H5N1)',
  'avian influenza h5n1': 'Avian Influenza (H5N1)',
  'avian influenza (h5n1)': 'Avian Influenza (H5N1)',
  'h5n1': 'Avian Influenza (H5N1)',
  'bird flu': 'Avian Influenza (H5N1)',

  'meningitis': 'Meningitis (CSM)',
  'meningitis (csm)': 'Meningitis (CSM)',
  'csm': 'Meningitis (CSM)',
  'cerebrospinal meningitis': 'Meningitis (CSM)',

  'cholera': 'Cholera',
  'rabies': 'Rabies',
  'anthrax': 'Anthrax',
  'mpox': 'Mpox',
  'monkeypox': 'Mpox',
  'malaria': 'Malaria',
  'yellow fever': 'Yellow Fever',
  'rift valley fever': 'Rift Valley Fever',
  'crude oil contamination': 'Crude Oil Contamination',
}

/**
 * Canonical community/syndromic signals. These mirror the USSD sign menus.
 * They describe what a reporter observed — never what a patient or animal has.
 */
export const CANONICAL_SIGNALS = [
  'Abortion/miscarriage',
  'Breathing difficulty',
  'Contaminated water',
  'Dead animals near water',
  'Diarrhea/vomiting',
  'Fever',
  'Fever and vomiting',
  'Flooding',
  'Not eating/weak',
  'Skin rash/sores',
  'Skin sores/swelling',
  'Sudden death',
  'Unusual smell/waste',
  'Other (unspecified)',
] as const

export type CanonicalSignal = typeof CANONICAL_SIGNALS[number]

/**
 * Free-text and local-language descriptions mapped onto canonical signals.
 * "Zawo da Amai" is Hausa for diarrhoea and vomiting; "Runny stomach" is the
 * common Nigerian English phrasing for the same presentation.
 */
const SIGNAL_SYNONYMS: Record<string, CanonicalSignal> = {
  'abortion/miscarriage': 'Abortion/miscarriage',
  'abortion': 'Abortion/miscarriage',
  'miscarriage': 'Abortion/miscarriage',
  'breathing difficulty': 'Breathing difficulty',
  'contaminated water': 'Contaminated water',
  'dead animals near water': 'Dead animals near water',
  'diarrhea/vomiting': 'Diarrhea/vomiting',
  'diarrhoea/vomiting': 'Diarrhea/vomiting',
  'zawo da amai': 'Diarrhea/vomiting',
  'runny stomach': 'Diarrhea/vomiting',
  'fever': 'Fever',
  'fever and vomiting': 'Fever and vomiting',
  'fever and vomitting': 'Fever and vomiting',
  'flooding': 'Flooding',
  'not eating/weak': 'Not eating/weak',
  'skin rash/sores': 'Skin rash/sores',
  'skin sores/swelling': 'Skin sores/swelling',
  'sudden death': 'Sudden death',
  'unusual smell/waste': 'Unusual smell/waste',
  'other': 'Other (unspecified)',
  'other (unspecified)': 'Other (unspecified)',
}

/** Prefix historically written by the USSD handler into `outbreaks.disease_name`. */
const COMMUNITY_PREFIX = /^community[-\s]?reported\s*:\s*/i

function squash(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export interface NormalizedEvent {
  /** DISEASE = a named diagnosis or hazard. SIGNAL = an observed sign, not a diagnosis. */
  eventType: EventType
  /** Human label for the event type, e.g. "Community-reported signal". */
  eventTypeLabel: string
  /** Canonical disease name, or the canonical signal name for a SIGNAL. */
  label: string
  /** Populated only for SIGNAL events — the sign or symptom observed. */
  signal: string | null
  /** True when the raw value could not be matched to the canonical vocabulary. */
  unmapped: boolean
  /** The original database value, kept for provenance. */
  raw: string
}

/**
 * Classify and canonicalise one record.
 *
 * `source` is `outbreaks.report_source`. A record is a SIGNAL when it carries
 * the community-report prefix, when it arrived through the community channel,
 * or when the free text names a sign rather than a diagnosis.
 */
export function normalizeEvent(
  rawName?: string | null,
  source?: string | null
): NormalizedEvent {
  const raw = (rawName ?? '').trim()
  const isCommunity = squash(source ?? '') === 'community'
  const hadPrefix = COMMUNITY_PREFIX.test(raw)
  const stripped = raw.replace(COMMUNITY_PREFIX, '').trim()
  const key = squash(stripped)

  const signalLabel = SIGNAL_SYNONYMS[key] ?? null
  const diseaseLabel = DISEASE_SYNONYMS[key] ?? null

  // A recognised diagnosis reported through a facility channel.
  if (diseaseLabel && !hadPrefix && !isCommunity) {
    return {
      eventType: 'DISEASE',
      eventTypeLabel: 'Disease event',
      label: diseaseLabel,
      signal: null,
      unmapped: false,
      raw,
    }
  }

  // Anything from the community channel, anything carrying the prefix, and any
  // free text that reads as a sign rather than a diagnosis, is a signal.
  if (hadPrefix || isCommunity || signalLabel) {
    return {
      eventType: 'SIGNAL',
      eventTypeLabel: hadPrefix || isCommunity
        ? 'Community-reported signal'
        : 'Reported signal',
      label: signalLabel ?? (stripped || 'Unspecified sign'),
      signal: signalLabel ?? (stripped || 'Unspecified sign'),
      unmapped: !signalLabel,
      raw,
    }
  }

  // Everything left is an unrecognised facility entry — shown as written,
  // flagged so it can be triaged into the vocabulary.
  return {
    eventType: 'DISEASE',
    eventTypeLabel: 'Disease event',
    label: stripped || 'Unspecified',
    signal: null,
    unmapped: true,
    raw,
  }
}

/** Canonical disease name for a raw value, or null when it is not a diagnosis. */
export function canonicalDisease(raw?: string | null): CanonicalDisease | null {
  if (!raw) return null
  return DISEASE_SYNONYMS[squash(raw.replace(COMMUNITY_PREFIX, ''))] ?? null
}

/** Canonical signal name for a raw value, or null when it is not a known sign. */
export function canonicalSignal(raw?: string | null): CanonicalSignal | null {
  if (!raw) return null
  return SIGNAL_SYNONYMS[squash(raw.replace(COMMUNITY_PREFIX, ''))] ?? null
}

// ------------------------------------------------------------
// Reporter privacy
// ------------------------------------------------------------

/**
 * Matches the phone-number shapes that reached the database through USSD
 * (+2347034255829, 07034255829, 234 803 620 9236).
 */
const PHONE_PATTERN = /(\+?234[\s-]?\d[\d\s-]{7,}\d|\b0\d{10}\b)/g

export function looksLikePhoneNumber(value?: string | null): boolean {
  if (!value) return false
  return new RegExp(PHONE_PATTERN.source).test(value.trim())
}

/** Stable, non-reversible reporter reference, e.g. "CR-7AF810". */
export function reporterId(recordId?: string | null): string {
  const hex = (recordId ?? '').replace(/[^0-9a-f]/gi, '').slice(0, 6).toUpperCase()
  return `CR-${hex || 'UNKNOWN'}`
}

/**
 * Public-safe reporter label.
 *
 * Community reports are attributed to a per-report reporter ID derived from the
 * record's own UUID — traceable to the record by an authorised officer, but not
 * reversible to a phone number by a visitor. Institutional and officer
 * attributions on facility reports (NCDC Field Officer, NESREA, …) are kept.
 */
export function publicReporter(
  reportedBy?: string | null,
  source?: string | null,
  recordId?: string | null
): string {
  const isCommunity = squash(source ?? '') === 'community'
  if (isCommunity || looksLikePhoneNumber(reportedBy)) {
    return `Community reporter · ${reporterId(recordId)}`
  }
  return reportedBy?.trim() || 'Not attributed'
}

/**
 * Remove any phone number written into a free-text description, and replace the
 * historical "Reported via USSD by <phone>" preamble with the channel-and-role
 * form used across the platform.
 */
export function scrubReporterDetails(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/Reported via USSD by\s+\+?[\d\s-]+/gi, 'Reported via USSD · Community reporter')
    .replace(new RegExp(PHONE_PATTERN.source, 'g'), '[reporter contact withheld]')
    .trim()
}
