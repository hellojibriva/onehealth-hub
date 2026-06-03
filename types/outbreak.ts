export type OutbreakSector   = 'human' | 'animal' | 'environmental' | 'zoonotic';
export type OutbreakSeverity = 'critical' | 'high' | 'moderate' | 'low';
export type OutbreakDisease  =
  | 'lassa'
  | 'lassa fever'
  | 'mpox'
  | 'cholera'
  | 'avian influenza'
  | 'rabies'
  | 'yellow fever'
  | 'meningitis'
  | 'other';

export interface OutbreakEvent {
  id:            string;
  disease:       string;
  sector:        OutbreakSector;
  severity:      OutbreakSeverity;
  status:        string;
  latitude:      number;
  longitude:     number;
  location_name: string;
  state:         string;
  lga?:          string | null;
  reported_at:   string;
  updated_at?:   string | null;
  is_active:     boolean;
  notes?:        string | null;
}

export interface DashboardStats {
  activeOutbreaks:  number;
  criticalSeverity: number;
  unreadAlerts:     number;
  totalTracked:     number;
  statesAffected:   number;
  weeklyChange:     number;
}