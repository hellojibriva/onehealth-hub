'use client';

import { useState } from 'react';
import { WifiOff, Wifi, Send, ClipboardList, MapPin } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

interface FormData {
  disease_name:  string;
  sector:        string;
  severity:      string;
  report_source: string;
  location_name: string;
  state:         string;
  lga:           string;
  ward:          string;
  latitude:      string;
  longitude:     string;
  description:   string;
  reported_by:   string;
  start_date:    string;
}

interface LocationRow {
  id: string;
}

const EMPTY: FormData = {
  disease_name:  '',
  sector:        'HUMAN',
  severity:      'MODERATE',
  report_source: 'FACILITY',
  location_name: '',
  state:         '',
  lga:           '',
  ward:          '',
  latitude:      '',
  longitude:     '',
  description:   '',
  reported_by:   '',
  start_date:    new Date().toISOString().slice(0, 10),
};

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara'
];

const OFFLINE_KEY = 'onehealth_offline_queue';

function getQueue(): FormData[] {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]'); }
  catch { return []; }
}

function saveToQueue(data: FormData) {
  const queue = getQueue();
  queue.push(data);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

function clearQueue() { localStorage.removeItem(OFFLINE_KEY); }

async function geocodeLocation(query: string): Promise<{ lat: string; lon: string } | null> {
  if (!query.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ng&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;
    return { lat: results[0].lat, lon: results[0].lon };
  } catch {
    return null;
  }
}

export default function CollectPage() {
  const [form,     setForm]     = useState<FormData>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [syncing,  setSyncing]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [queueLen, setQueueLen] = useState(() => getQueue().length);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  function update(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleLocationBlur() {
    if (!form.location_name.trim() || !form.state) return;
    if (form.latitude || form.longitude) return;

    setGeocoding(true);
    setGeoNotice(null);

    const query = [form.location_name, form.ward, form.lga, form.state, 'Nigeria']
      .filter(Boolean)
      .join(', ');

    const result = await geocodeLocation(query);

    if (result) {
      setForm(prev => ({ ...prev, latitude: result.lat, longitude: result.lon }));
      setGeoNotice('Coordinates auto-filled — please confirm they look correct.');
    } else {
      setGeoNotice('Could not find coordinates automatically. Please enter them manually if known.');
    }

    setGeocoding(false);
  }

  async function handleSubmit() {
    if (!form.disease_name || !form.state || !form.location_name) {
      alert('Please fill in Disease, State and Location.');
      return;
    }
    setSaving(true);

    if (!isOnline) {
      saveToQueue(form);
      setQueueLen(getQueue().length);
      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); setForm(EMPTY); }, 2000);
      return;
    }

    try {
      const supabase = getSupabase();
      let locationId: string | null = null;

      const { data: existingLoc } = await supabase
        .from('locations').select('id')
        .ilike('name', form.location_name).limit(1).single();

      if (existingLoc) {
        locationId = (existingLoc as unknown as LocationRow).id;
      } else {
        const { data: newLoc, error: locError } = await supabase
          .from('locations')
          .insert({
            name: form.location_name, state: form.state,
            lga: form.lga || null, ward: form.ward || null,
            geopolitical_zone: '',
            latitude:  parseFloat(form.latitude)  || 9.082,
            longitude: parseFloat(form.longitude) || 8.675,
          } as any)
          .select('id').single();

        if (locError) throw locError;
        locationId = (newLoc as unknown as LocationRow)?.id ?? null;
      }

      const { error: outbreakError } = await supabase.from('outbreaks').insert({
        disease_name: form.disease_name, sector: form.sector,
        severity: form.severity, status: 'ACTIVE',
        report_source: 'FACILITY',
        location_id: locationId, start_date: form.start_date,
        description: form.description || null,
        reported_by: form.reported_by || null,
      } as any);

      if (outbreakError) throw outbreakError;

      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); setGeoNotice(null); setForm(EMPTY); }, 2500);
    } catch (err) {
      console.error('Submission failed:', err);
      saveToQueue(form);
      setQueueLen(getQueue().length);
      setSaving(false);
      alert('Could not save online — your report was saved locally and will sync when possible.');
    }
  }

  async function syncQueue() {
    const queue = getQueue();
    if (!queue.length) return;
    setSyncing(true);
    const supabase = getSupabase();
    let synced = 0;

    for (const item of queue) {
      try {
        let locationId: string | null = null;
        const { data: existingLoc } = await supabase
          .from('locations').select('id')
          .ilike('name', item.location_name).limit(1).single();

        if (existingLoc) {
          locationId = (existingLoc as unknown as LocationRow).id;
        } else {
          const { data: newLoc, error: locError } = await supabase
            .from('locations')
            .insert({
              name: item.location_name, state: item.state,
              lga: item.lga || null, ward: item.ward || null,
              geopolitical_zone: '',
              latitude:  parseFloat(item.latitude)  || 9.082,
              longitude: parseFloat(item.longitude) || 8.675,
            } as any)
            .select('id').single();

          if (locError) throw locError;
          locationId = (newLoc as unknown as LocationRow)?.id ?? null;
        }

        const { error: outbreakError } = await supabase.from('outbreaks').insert({
          disease_name: item.disease_name, sector: item.sector,
          severity: item.severity, status: 'ACTIVE',
          report_source: item.report_source || 'FACILITY',
          location_id: locationId, start_date: item.start_date,
          description: item.description || null,
          reported_by: item.reported_by || null,
        } as any);

        if (outbreakError) throw outbreakError;
        synced++;
      } catch (err) {
        console.error('Sync failed for item:', item, err);
        continue;
      }
    }

    if (synced === queue.length) clearQueue();
    setQueueLen(getQueue().length);
    setSyncing(false);
    alert(`${synced} of ${queue.length} records synced.`);
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={18} className="text-teal-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Field Data Collection
              </h1>
            </div>
            <p className="text-xs text-gray-500">OneHealth Hub · Nigeria Zoonotic Surveillance</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
              isOnline
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-4">
            <WifiOff size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              You are offline. Reports will be saved to your device and synced automatically when you reconnect.
            </p>
          </div>
        )}

        {queueLen > 0 && isOnline && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {queueLen} report{queueLen > 1 ? 's' : ''} pending sync
            </p>
            <button
              onClick={syncQueue}
              disabled={syncing}
              className="text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync now →'}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Report source *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update('report_source', 'FACILITY')}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.report_source === 'FACILITY'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                🏥 Facility
              </button>
              <button
                type="button"
                onClick={() => update('report_source', 'COMMUNITY')}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  form.report_source === 'COMMUNITY'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                🧑‍🤝‍🧑 Community
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Facility = observed at a hospital/clinic/vet post. Community = reported by a resident, farmer, or informal source.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Disease / Pathogen *
            </label>
            <input
              value={form.disease_name}
              onChange={e => update('disease_name', e.target.value)}
              placeholder="e.g. Lassa fever"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Sector *</label>
              <select
                value={form.sector}
                onChange={e => update('sector', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="HUMAN">Human</option>
                <option value="ANIMAL">Animal</option>
                <option value="ENVIRONMENTAL">Environmental</option>
                <option value="ZOONOTIC">Zoonotic</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Severity *</label>
              <select
                value={form.severity}
                onChange={e => update('severity', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="LOW">Low</option>
                <option value="MODERATE">Moderate</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Location name *</label>
            <input
              value={form.location_name}
              onChange={e => update('location_name', e.target.value)}
              onBlur={handleLocationBlur}
              placeholder="e.g. General Hospital Lafia"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">State *</label>
              <select
                value={form.state}
                onChange={e => update('state', e.target.value)}
                onBlur={handleLocationBlur}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select state</option>
                {NIGERIA_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">LGA</label>
              <input
                value={form.lga}
                onChange={e => update('lga', e.target.value)}
                onBlur={handleLocationBlur}
                placeholder="e.g. Lafia"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Ward</label>
            <input
              value={form.ward}
              onChange={e => update('ward', e.target.value)}
              onBlur={handleLocationBlur}
              placeholder="e.g. Lafia Central Ward"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Coordinates {geocoding && '(locating…)'}
              </span>
              {(form.latitude || form.longitude) && (
                <button
                  type="button"
                  onClick={() => { update('latitude', ''); update('longitude', ''); setGeoNotice(null); }}
                  className="text-[11px] text-teal-600 hover:underline"
                >
                  Clear & re-locate
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  value={form.latitude}
                  onChange={e => update('latitude', e.target.value)}
                  placeholder="Latitude, e.g. 8.5560"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <input
                  value={form.longitude}
                  onChange={e => update('longitude', e.target.value)}
                  placeholder="Longitude, e.g. 8.5227"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            {geoNotice && (
              <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-1.5">
                <MapPin size={11} className="shrink-0" />
                {geoNotice}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Date reported</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => update('start_date', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Reported by</label>
              <input
                value={form.reported_by}
                onChange={e => update('reported_by', e.target.value)}
                placeholder="Officer name"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Notes / Description</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Additional details about the outbreak..."
              rows={3}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
              saved
                ? 'bg-teal-600 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60'
            }`}
          >
            <Send size={14} />
            {saving ? 'Saving...' : saved ? '✓ Report Saved!' : isOnline ? 'Submit Report' : 'Save Offline'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          OneHealth Hub · <a href="/dashboard" className="text-teal-600 hover:underline">Back to dashboard</a>
        </p>
      </div>
    </main>
  );
}