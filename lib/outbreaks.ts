import { getSupabase } from './supabaseClient';
import type { OutbreakEvent, DashboardStats } from '@/types/outbreak';
export async function getActiveOutbreaks(): Promise<OutbreakEvent[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('outbreaks')
      .select(`
        id,
        disease_name,
        sector,
        severity,
        status,
        description,
        start_date,
        updated_at,
        locations (
          name,
          state,
          lga,
          latitude,
          longitude
        )
      `)
      .eq('status', 'ACTIVE')
      .order('start_date', { ascending: false });

    if (error) {
console.error('[getActiveOutbreaks]', JSON.stringify(error));
      return [];
    }

    return (data ?? []).map((row: any) => ({
      id:            row.id,
      disease:       row.disease_name,
      sector:        row.sector?.toLowerCase(),
      severity:      row.severity?.toLowerCase(),
      status:        row.status,
      latitude:      row.locations?.latitude,
      longitude:     row.locations?.longitude,
      location_name: row.locations?.name,
      state:         row.locations?.state,
      lga:           row.locations?.lga,
      reported_at:   row.start_date,
      updated_at:    row.updated_at,
      is_active:     row.status === 'ACTIVE',
      notes:         row.description,
    })) as OutbreakEvent[];
  } catch (err) {
    console.error('[getActiveOutbreaks] unexpected error:', err);
    return [];
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const supabase = getSupabase();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [allRes, critRes, alertRes, trackedRes, weekRes, statesRes] = await Promise.all([
      supabase.from('outbreaks').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('outbreaks').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE').eq('severity', 'CRITICAL'),
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('outbreaks').select('id', { count: 'exact', head: true }),
      supabase.from('outbreaks').select('id', { count: 'exact', head: true }).gte('start_date', oneWeekAgo.toISOString()),
      supabase.from('outbreaks').select('location_id').eq('status', 'ACTIVE'),
    ]);

    const statesAffected = statesRes.data
      ? new Set(statesRes.data.map((r: any) => r.location_id)).size
      : 0;

    return {
      activeOutbreaks:  allRes.count     ?? 0,
      criticalSeverity: critRes.count    ?? 0,
      unreadAlerts:     alertRes.count   ?? 0,
      totalTracked:     trackedRes.count ?? 0,
      statesAffected,
      weeklyChange:     weekRes.count    ?? 0,
    };
  } catch (err) {
    console.error('[getDashboardStats] unexpected error:', err);
    return {
      activeOutbreaks: 0, criticalSeverity: 0, unreadAlerts: 0,
      totalTracked: 0, statesAffected: 0, weeklyChange: 0,
    };
  }
}

export function subscribeToOutbreaks(
  onInsert: (payload: { new: any }) => void
) {
  const supabase = getSupabase();
  return supabase
    .channel('outbreaks-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'outbreaks' }, onInsert)
    .subscribe();
}