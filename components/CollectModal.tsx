'use client';

import { useState } from 'react';
import { X, WifiOff, Wifi, Send, ClipboardList } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

interface FormData {
  disease_name:    string;
  sector:          string;
  severity:        string;
  location_name:   string;
  state:           string;
  lga:             string;
  latitude:        string;
  longitude:       string;
  description:     string;
  reported_by:     string;
  start_date:      string;
}

const EMPTY: FormData = {
  disease_name:  '',
  sector:        'HUMAN',
  severity:      'MODERATE',
  location_name: '',
  state:         '',
  lga:           '',
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
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]');
  } catch { return []; }
}

function saveToQueue(data: FormData) {
  const queue = getQueue();
  queue.push(data);
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

function clearQueue() {
  localStorage.removeItem(OFFLINE_KEY);
}

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function CollectModal({ open, onClose }: Props) {
  const [form,      setForm]      = useState<FormData>(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [syncing,   setSyncing]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [queueLen,  setQueueLen]  = useState(() => getQueue().length);
  const [isOnline,  setIsOnline]  = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  if (!open) return null;

  function update(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
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
        .from('locations')
        .select('id')
        .ilike('name', form.location_name)
        .limit(1)
        .single();

      if (existingLoc) {
        locationId = existingLoc.id;
      } else {
        const { data: newLoc } = await supabase
          .from('locations')
          .insert({
            name:              form.location_name,
            state:             form.state,
            lga:               form.lga || null,
            geopolitical_zone: '',
            latitude:          parseFloat(form.latitude) || 9.082,
            longitude:         parseFloat(form.longitude) || 8.675,
          })
          .select('id')
          .single();
        locationId = newLoc?.id ?? null;
      }

      await supabase.from('outbreaks').insert({
        disease_name: form.disease_name,
        sector:       form.sector,
        severity:     form.severity,
        status:       'ACTIVE',
        location_id:  locationId,
        start_date:   form.start_date,
        description:  form.description || null,
        reported_by:  form.reported_by || null,
      });

      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); setForm(EMPTY); }, 2000);
    } catch {
      saveToQueue(form);
      setQueueLen(getQueue().length);
      setSaving(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); setForm(EMPTY); }, 2000);
    }
  }

  async function syncQueue() {
    const queue = getQueue();
    if (queue.length === 0) return;
    setSyncing(true);

    const supabase = getSupabase();
    let synced = 0;

    for (const item of queue) {
      try {
        let locationId: string | null = null;
        const { data: existingLoc } = await supabase
          .from('locations')
          .select('id')
          .ilike('name', item.location_name)
          .limit(1)
          .single();

        if (existingLoc) {
          locationId = existingLoc.id;
        } else {
          const { data: newLoc } = await supabase
            .from('locations')
            .insert({
              name:              item.location_name,
              state:             item.state,
              lga:               item.lga || null,
              geopolitical_zone: '',
              latitude:          parseFloat(item.latitude) || 9.082,
              longitude:         parseFloat(item.longitude) || 8.675,
            })
            .select('id')
            .single();
          locationId = newLoc?.id ?? null;
        }

        await supabase.from('outbreaks').insert({
          disease_name: item.disease_name,
          sector:       item.sector,
          severity:     item.severity,
          status:       'ACTIVE',
          location_id:  locationId,
          start_date:   item.start_date,
          description:  item.description || null,
          reported_by:  item.reported_by || null,
        });
        synced++;
      } catch { continue; }
    }

    if (synced === queue.length) clearQueue();
    setQueueLen(getQueue().length);
    setSyncing(false);
    alert(`${synced} of ${queue.length} records synced successfully.`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-teal-600" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Report Outbreak
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {queueLen > 0 && (
              <button
                onClick={syncQueue}
                disabled={syncing || !isOnline}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50"
              >
                <Wifi size={12} />
                {syncing ? 'Syncing...' : `Sync ${queueLen} pending`}
              </button>
            )}
            <div className={`flex items-center gap-1 text-xs ${isOnline ? 'text-teal-600' : 'text-amber-500'}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {!isOnline && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <WifiOff size={14} className="text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                You are offline. Data will be saved locally and synced when you reconnect.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                Disease / Pathogen *
              </label>
              <input
                value={form.disease_name}
                onChange={e => update('disease_name', e.target.value)}
                placeholder="e.g. Lassa fever"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Sector *</label>
              <select
                value={form.sector}
                onChange={e => update('sector', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="LOW">Low</option>
                <option value="MODERATE">Moderate</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Location name *</label>
              <input
                value={form.location_name}
                onChange={e => update('location_name', e.target.value)}
                placeholder="e.g. General Hospital Lafia"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">State *</label>
              <select
                value={form.state}
                onChange={e => update('state', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                placeholder="e.g. Lafia"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Latitude</label>
              <input
                value={form.latitude}
                onChange={e => update('latitude', e.target.value)}
                placeholder="e.g. 8.5560"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Longitude</label>
              <input
                value={form.longitude}
                onChange={e => update('longitude', e.target.value)}
                placeholder="e.g. 8.5227"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Date reported</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => update('start_date', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Reported by</label>
              <input
                value={form.reported_by}
                onChange={e => update('reported_by', e.target.value)}
                placeholder="Officer name"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Notes / Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Additional details about the outbreak..."
                rows={3}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || saved}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              saved
                ? 'bg-teal-600 text-white'
                : 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60'
            }`}
          >
            <Send size={14} />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : isOnline ? 'Submit Report' : 'Save Offline'}
          </button>
        </div>
      </div>
    </div>
  );
}