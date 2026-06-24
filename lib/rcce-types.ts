// ============================================================
// RCCE MODULE TYPES — OneHealth Hub
// ============================================================

export type AlertType = 'SEASONAL' | 'OUTBREAK' | 'ADVISORY' | 'USSD'
export type AlertStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'ARCHIVED'
export type DeliveryChannel = 'APP' | 'USSD' | 'SMS'

export interface RCCEAlert {
  id: string
  title: string
  disease: string
  alert_type: AlertType
  season_id?: string
  geopolitical_zone: string
  language_code: string
  language_name: string
  body_text: string
  prevention_tips: string[]
  action_items: string[]
  where_to_go: string
  ussd_screen_1?: string
  ussd_screen_2?: string
  ussd_screen_3?: string
  trigger_month?: number
  scheduled_date?: string
  sent_at?: string
  status: AlertStatus
  created_by?: string
  created_at: string
  updated_at: string
}

export interface RCCEDelivery {
  id: string
  alert_id: string
  user_id: string
  delivery_channel: DeliveryChannel
  delivered_at: string
  acknowledged_at?: string
  zone?: string
  language_code?: string
}

export interface ZoneLanguage {
  id: string
  geopolitical_zone: string
  language: string
  language_code: string
  is_primary: boolean
}

export interface RCCESeason {
  id: string
  name: string
  start_month: number
  end_month: number
  description: string
}

// Six geopolitical zones of Nigeria
export const GEOPOLITICAL_ZONES = [
  'North West',
  'North East',
  'North Central',
  'South West',
  'South East',
  'South South',
] as const

export type GeopoliticalZone = typeof GEOPOLITICAL_ZONES[number]

// Zone → primary language mapping
export const ZONE_PRIMARY_LANGUAGE: Record<GeopoliticalZone, { name: string; code: string }> = {
  'North West':    { name: 'Hausa',           code: 'ha'  },
  'North East':    { name: 'Hausa',           code: 'ha'  },
  'North Central': { name: 'English',         code: 'en'  },
  'South West':    { name: 'Yoruba',          code: 'yo'  },
  'South East':    { name: 'Igbo',            code: 'ig'  },
  'South South':   { name: 'Nigerian Pidgin', code: 'pcm' },
}

// All supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'ha',  name: 'Hausa' },
  { code: 'yo',  name: 'Yoruba' },
  { code: 'ig',  name: 'Igbo' },
  { code: 'pcm', name: 'Nigerian Pidgin' },
  { code: 'kr',  name: 'Kanuri' },
  { code: 'en',  name: 'English' },
]

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const DISEASE_OPTIONS = [
  'Lassa Fever',
  'Cholera',
  'Brucellosis',
  'Meningitis (CSM)',
  'Avian Influenza',
  'Mpox',
  'Rabies',
  'Anthrax',
  'Rift Valley Fever',
  'Malaria',
  'Other',
]

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  SEASONAL:  'Seasonal Alert',
  OUTBREAK:  'Active Outbreak',
  ADVISORY:  'Livestock Advisory',
  USSD:      'USSD-Only Alert',
}

export const STATUS_COLORS: Record<AlertStatus, string> = {
  DRAFT:     'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  SENT:      'bg-green-100 text-green-700',
  ARCHIVED:  'bg-amber-100 text-amber-700',
}

// USSD character limit per screen
export const USSD_CHAR_LIMIT = 160
