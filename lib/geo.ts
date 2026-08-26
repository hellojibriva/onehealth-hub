// ============================================================
// GEOGRAPHY — OneHealth Hub
// Single source of truth for Nigerian state names and the
// state -> geopolitical zone mapping.
//
// Geography is always represented as: State -> LGA/Town
// e.g. "Jigawa -> Doko". Free-text entries (USSD, field form)
// are canonicalised through canonicalState() before display,
// filtering or aggregation so the same place is never counted
// twice under different spellings.
// ============================================================

export const GEOPOLITICAL_ZONES = [
  'North West',
  'North East',
  'North Central',
  'South West',
  'South East',
  'South South',
] as const

export type GeopoliticalZone = typeof GEOPOLITICAL_ZONES[number]

/** The 36 states + FCT, in their canonical written form. */
export const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const

export type NigeriaState = typeof NIGERIA_STATES[number]

export const STATE_TO_ZONE: Record<NigeriaState, GeopoliticalZone> = {
  'FCT': 'North Central', 'Nasarawa': 'North Central', 'Niger': 'North Central',
  'Benue': 'North Central', 'Kogi': 'North Central', 'Kwara': 'North Central',
  'Plateau': 'North Central',

  'Kano': 'North West', 'Kaduna': 'North West', 'Katsina': 'North West',
  'Kebbi': 'North West', 'Sokoto': 'North West', 'Zamfara': 'North West',
  'Jigawa': 'North West',

  'Borno': 'North East', 'Yobe': 'North East', 'Adamawa': 'North East',
  'Taraba': 'North East', 'Bauchi': 'North East', 'Gombe': 'North East',

  'Lagos': 'South West', 'Ogun': 'South West', 'Oyo': 'South West',
  'Osun': 'South West', 'Ondo': 'South West', 'Ekiti': 'South West',

  'Anambra': 'South East', 'Enugu': 'South East', 'Imo': 'South East',
  'Abia': 'South East', 'Ebonyi': 'South East',

  'Rivers': 'South South', 'Delta': 'South South', 'Edo': 'South South',
  'Bayelsa': 'South South', 'Cross River': 'South South', 'Akwa Ibom': 'South South',
}

/**
 * Spelling variants seen in free-text USSD input and field forms.
 * Keys are lower-cased and whitespace-collapsed.
 */
const STATE_ALIASES: Record<string, NigeriaState> = {
  'abuja': 'FCT',
  'fct abuja': 'FCT',
  'abuja fct': 'FCT',
  'federal capital territory': 'FCT',
  'akwaibom': 'Akwa Ibom',
  'crossriver': 'Cross River',
  'nassarawa': 'Nasarawa',
  'nasarawa state': 'Nasarawa',
}

function squash(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Lower-cased canonical state name -> canonical state name. */
const STATE_LOOKUP: Record<string, NigeriaState> = NIGERIA_STATES.reduce(
  (acc, state) => { acc[squash(state)] = state; return acc },
  {} as Record<string, NigeriaState>
)

/**
 * Resolve any spelling of a Nigerian state to its canonical form.
 * Returns null when the value cannot be resolved — callers should
 * surface that as "Unspecified" rather than guessing.
 */
export function canonicalState(raw?: string | null): NigeriaState | null {
  if (!raw) return null
  const key = squash(raw).replace(/\bstate\b$/, '').trim()
  return STATE_LOOKUP[key] ?? STATE_ALIASES[key] ?? STATE_ALIASES[squash(raw)] ?? null
}

/** Canonical state name for display; falls back to a tidied version of the input. */
export function displayState(raw?: string | null): string {
  const canonical = canonicalState(raw)
  if (canonical) return canonical
  if (!raw?.trim()) return 'Unspecified'
  return titleCase(raw)
}

export function zoneForState(raw?: string | null): GeopoliticalZone | null {
  const state = canonicalState(raw)
  return state ? STATE_TO_ZONE[state] : null
}

export function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.length <= 3 && word === word.toUpperCase()
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Standard geographic label used across the map, cards and exports:
 * "Jigawa → Garki", or just "Jigawa" when nothing finer is known.
 *
 * `siteName` is the fallback for records where the LGA has not been
 * established yet — a USSD reporter is asked for "your LGA or town", so a
 * settlement name is often all we have. Showing the settlement is better than
 * showing the state alone, but it is never written into the LGA column: an
 * unconfirmed town must not become a reporting unit of its own.
 */
export function formatPlace(
  state?: string | null,
  lga?: string | null,
  siteName?: string | null
): string {
  const s = displayState(state)
  const raw = lga?.trim() ? lga : siteName?.trim() ? siteName : null
  const l = raw ? titleCase(raw) : null
  return l && l.toLowerCase() !== s.toLowerCase() ? `${s} → ${l}` : s
}
