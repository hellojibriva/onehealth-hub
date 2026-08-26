'use client';

import { useState } from 'react';
import { WifiOff, Wifi, Send, ClipboardList, MapPin, Globe } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';
import { canonicalState, titleCase, zoneForState } from '@/lib/geo';
import { CANONICAL_DISEASES, CANONICAL_SIGNALS } from '@/lib/taxonomy';

interface FormData {
  disease_name:  string;
  sector:        string;
  severity:      string;
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

type LangKey = 'EN' | 'HA' | 'IG' | 'YO' | 'PCM';

const EMPTY: FormData = {
  disease_name:  '',
  sector:        'HUMAN',
  severity:      'MODERATE',
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

const LANGUAGE_LABELS: Record<LangKey, string> = {
  EN: 'English', HA: 'Hausa', IG: 'Igbo', YO: 'Yoruba', PCM: 'Pidgin',
};

const T: Record<LangKey, Record<string, string>> = {
  EN: {
    title: 'Field Data Collection',
    subtitle: 'OneHealth Hub - Nigeria Zoonotic Surveillance',
    online: 'Online', offline: 'Offline',
    offlineNotice: 'You are offline. Reports will be saved to your device and synced automatically when you reconnect.',
    pendingSync: 'report(s) pending sync',
    syncNow: 'Sync now', syncing: 'Syncing...',
    disease: 'Disease / Pathogen *', diseasePlaceholder: 'Select a disease or a reported sign',
    optDisease: 'Disease / hazard', optSignal: 'Community-reported signal (symptom or sign)',
    signalHint: 'Choose a sign only when no diagnosis has been confirmed. Signals are held for field verification and are never counted as confirmed disease.',
    offlineCapable: 'Works offline. Reports are stored on this device and synced when connectivity returns.',
    sector: 'Sector *', severity: 'Severity *',
    sectorHuman: 'Human', sectorAnimal: 'Animal', sectorEnv: 'Environmental', sectorZoo: 'Zoonotic',
    severityLow: 'Low', severityModerate: 'Moderate', severityHigh: 'High', severityCritical: 'Critical',
    locationName: 'Location name *', locationPlaceholder: 'e.g. General Hospital Lafia',
    state: 'State *', selectState: 'Select your state',
    lga: 'LGA', lgaPlaceholder: 'e.g. Lafia',
    ward: 'Ward', wardPlaceholder: 'e.g. Lafia Central Ward',
    coordinates: 'Coordinates', locating: '(locating)',
    clearRelocate: 'Clear and re-locate',
    latPlaceholder: 'Latitude, e.g. 8.5560', lonPlaceholder: 'Longitude, e.g. 8.5227',
    geoAutoFilled: 'Coordinates auto-filled - please confirm they look correct.',
    geoNotFound: 'Could not find coordinates automatically. Please enter them manually if known.',
    dateReported: 'Date reported', reportedBy: 'Reported by', reportedByPlaceholder: 'Officer name',
    notes: 'Notes / Description', notesPlaceholder: 'Additional details about the outbreak...',
    submit: 'Submit Report', saving: 'Saving...', saved: 'Report Saved!', saveOffline: 'Save Offline',
    backToDashboard: 'Back to dashboard',
    fillRequired: 'Please fill in Disease, State and Location.',
    submitFailed: 'Could not save online - your report was saved locally and will sync when possible.',
  },
  HA: {
    title: 'Tattara Bayanan Fili',
    subtitle: 'OneHealth Hub - Sa ido kan Cututtukan Dabbobi a Najeriya',
    online: 'Kan layi', offline: 'Ba kan layi ba',
    offlineNotice: 'Ba ka kan layi ba. Za a adana rahoton a naurarka kuma a aika shi ta atomatik idan ka sake haduwa da yanar gizo.',
    pendingSync: 'rahoto(ni) da ke jiran aikawa',
    syncNow: 'Aika yanzu', syncing: 'Ana aikawa...',
    disease: 'Cuta / Kwayar cuta *', diseasePlaceholder: 'Zabi cuta ko alamar da aka bayar da rahoto',
    optDisease: 'Cuta / Hatsari', optSignal: 'Alamar da al’umma ta bayar da rahoto',
    signalHint: 'Zabi alama kawai idan ba a tabbatar da cuta ba. Ana ajiye alamu domin tabbatarwa a fili.',
    offlineCapable: 'Yana aiki ba tare da yanar gizo ba. Ana adana rahoto a naurarka har sai an sami yanar gizo.',
    sector: 'Bangare *', severity: 'Girman Matsala *',
    sectorHuman: 'Dan Adam', sectorAnimal: 'Dabba', sectorEnv: 'Muhalli', sectorZoo: 'Cutar Dabba zuwa Mutum',
    severityLow: 'Kadan', severityModerate: 'Matsakaici', severityHigh: 'Girma', severityCritical: 'Mai Tsanani',
    locationName: 'Sunan wuri *', locationPlaceholder: 'misali Babban Asibitin Lafia',
    state: 'Jiha *', selectState: 'Zabi jihar ka',
    lga: 'Karamar Hukuma', lgaPlaceholder: 'misali Lafia',
    ward: 'Unguwa', wardPlaceholder: 'misali Unguwar Tsakiyar Lafia',
    coordinates: 'Wurin Taswira', locating: '(ana nemowa)',
    clearRelocate: 'Share da sake nema',
    latPlaceholder: 'Latitude, misali 8.5560', lonPlaceholder: 'Longitude, misali 8.5227',
    geoAutoFilled: 'An cika wurin taswira atomatik - da fatan za a tabbatar daidai ne.',
    geoNotFound: 'Ba a samu wurin taswira atomatik ba. Da fatan a shigar da shi da hannu idan an sani.',
    dateReported: 'Ranar rahoto', reportedBy: 'Wanda ya bayar da rahoto', reportedByPlaceholder: 'Sunan jamii',
    notes: 'Bayani / Karin bayani', notesPlaceholder: 'Karin bayani game da annobar...',
    submit: 'Aika Rahoto', saving: 'Ana adanawa...', saved: 'An Adana Rahoton!', saveOffline: 'Adana Ba Kan Layi',
    backToDashboard: 'Koma zuwa dashboard',
    fillRequired: 'Da fatan a cika Cuta, Jiha da Wuri.',
    submitFailed: 'Ba a iya adanawa kan layi ba - an adana rahoton a naura kuma za a aika shi nan gaba.',
  },
  IG: {
    title: 'Nchikota Data Ubi',
    subtitle: 'OneHealth Hub - Nleba Anya Oria Anumanu na Nigeria',
    online: 'Ntaneti', offline: 'Adighi n intaneti',
    offlineNotice: 'I noghi n ntaneti. A ga-echekwa akuko gi na ngwaoru gi ma ziga ya na akpaghi aka mgbe i nwetaghachiri ntaneti.',
    pendingSync: 'akuko na-echere izipu',
    syncNow: 'Ziga ugbu a', syncing: 'Na-eziga...',
    disease: 'Oria / Ihe na-ebute oria *', diseasePlaceholder: 'Họrọ ọrịa ma ọ bụ akara e kwuru',
    optDisease: 'Ọrịa / Ihe ize ndụ', optSignal: 'Akara obodo kọrọ',
    signalHint: 'Họrọ akara naanị mgbe a kwadobeghị ọrịa. A na-echekwa akara maka nkwenye n’ubi.',
    offlineCapable: 'Ọrụ na-aga n’enweghị ịntanịtị. A na-echekwa akụkọ na ngwaọrụ gị ruo mgbe ịntanịtị lọghachiri.',
    sector: 'Ngalaba *', severity: 'Ogo Ihe Ojoo *',
    sectorHuman: 'Mmadu', sectorAnimal: 'Anumanu', sectorEnv: 'Gburugburu', sectorZoo: 'Oria si n Anumanu gaa Mmadu',
    severityLow: 'Nta', severityModerate: 'Etiti', severityHigh: 'Ukwuu', severityCritical: 'Oke Ihe Ojoo',
    locationName: 'Aha ebe *', locationPlaceholder: 'dika Ulo Ogwu Lafia',
    state: 'Steeti *', selectState: 'Horo steeti gi',
    lga: 'LGA', lgaPlaceholder: 'dika Lafia',
    ward: 'Wadi', wardPlaceholder: 'dika Wadi Etiti Lafia',
    coordinates: 'Ebe Di N igodo', locating: '(na-acho)',
    clearRelocate: 'Hichapu na chogharia',
    latPlaceholder: 'Latitude, dika 8.5560', lonPlaceholder: 'Longitude, dika 8.5227',
    geoAutoFilled: 'Ejupụtala ebe n igodo n onwe ya - biko kwado na o ziri ezi.',
    geoNotFound: 'Achotaghi ebe n igodo na akpaghi aka. Biko tinye ya n aka ma o buru na i maara ya.',
    dateReported: 'Ubochi akuko', reportedBy: 'Onye koro akuko', reportedByPlaceholder: 'Aha onye oru',
    notes: 'Ndetu / Nkowa', notesPlaceholder: 'Nkowa ozo gbasara oria a...',
    submit: 'Ziga Akuko', saving: 'Na-echekwa...', saved: 'Echekwala Akuko!', saveOffline: 'Chekwaa n Adighi Ntaneti',
    backToDashboard: 'Laghachi na dashboard',
    fillRequired: 'Biko dejupụta Oria, Steeti na Ebe.',
    submitFailed: 'Enweghi ike ichekwa na ntaneti - echekwala akuko gi n ngwaoru gi, a ga-ezigakwa ya mgbe e nwere ohere.',
  },
  YO: {
    title: 'Ikojopo Data Ojula',
    subtitle: 'OneHealth Hub - Ibojuwo Arun Eranko ni Naijiria',
    online: 'Lori ayelujara', offline: 'Ko si lori ayelujara',
    offlineNotice: 'O ko si lori ayelujara. A o fi ijabo pamo si ero re ki a si fi ranse laifowoyi nigba ti o ba tun sopo mo ayelujara.',
    pendingSync: 'ijabo(awon) ti n duro de fifiranse',
    syncNow: 'Fi ranse nisisiyi', syncing: 'N fi ranse...',
    disease: 'Arun / Kokoro Arun *', diseasePlaceholder: 'Yan arun tabi ami ti a jabo',
    optDisease: 'Arun / Ewu', optSignal: 'Ami ti agbegbe jabo',
    signalHint: 'Yan ami nikan nigba ti a ko ba ti fi arun kan mule. A o pa ami mo fun iwadii ojula.',
    offlineCapable: 'O n sise lai si ayelujara. A o pa ijabo mo sori ero re titi ayelujara yoo fi pada.',
    sector: 'Eka *', severity: 'Bi O Se Le To *',
    sectorHuman: 'Eniyan', sectorAnimal: 'Eranko', sectorEnv: 'Ayika', sectorZoo: 'Arun Eranko si Eniyan',
    severityLow: 'Kekere', severityModerate: 'Alabode', severityHigh: 'Giga', severityCritical: 'Ideruba',
    locationName: 'Oruko ibi *', locationPlaceholder: 'bii Ile-iwosan Gbogbogbo Lafia',
    state: 'Ipinle *', selectState: 'Yan ipinle re',
    lga: 'LGA', lgaPlaceholder: 'bii Lafia',
    ward: 'Agbegbe (Ward)', wardPlaceholder: 'bii Agbegbe Aarin Lafia',
    coordinates: 'Ipo Aworan', locating: '(n wa)',
    clearRelocate: 'Nu ki o si tun wa',
    latPlaceholder: 'Latitude, bii 8.5560', lonPlaceholder: 'Longitude, bii 8.5227',
    geoAutoFilled: 'A ti fi ipo aworan kun laifowoyi - jowo sayewo pe o to.',
    geoNotFound: 'A ko le ri ipo aworan laifowoyi. Jowo te e sii pelu owo ti o ba mo.',
    dateReported: 'Ojo ijabo', reportedBy: 'Eni to jabo', reportedByPlaceholder: 'Oruko osise',
    notes: 'Akiyesi / Alaye', notesPlaceholder: 'Alaye afikun nipa ajakale-arun naa...',
    submit: 'Fi Ijabo Ranse', saving: 'N fi pamo...', saved: 'Ijabo Ti Fi Pamo!', saveOffline: 'Fi Pamo Lai si Ayelujara',
    backToDashboard: 'Pada si dashboard',
    fillRequired: 'Jowo kun Arun, Ipinle ati Ibi.',
    submitFailed: 'A ko le fi pamo lori ayelujara - a ti fi ijabo re pamo si ero, a o si fi ranse nigba ti o ba seese.',
  },
  PCM: {
    title: 'Field Data Collection',
    subtitle: 'OneHealth Hub - Nigeria Zoonotic Surveillance',
    online: 'Online', offline: 'Offline',
    offlineNotice: 'You no dey online. We go save your report for your device and send am automatic once you get network again.',
    pendingSync: 'report(s) wey dey wait to send',
    syncNow: 'Send am now', syncing: 'E dey send...',
    disease: 'Disease / Wetin dey cause am *', diseasePlaceholder: 'Pick disease or signal wey dem report',
    optDisease: 'Disease / hazard', optSignal: 'Signal wey community report',
    signalHint: 'Pick signal only if dem never confirm any disease. Signal dey wait for field check.',
    offlineCapable: 'E dey work without internet. Report go save for your phone until network come back.',
    sector: 'Sector *', severity: 'How E Bad Reach *',
    sectorHuman: 'Human', sectorAnimal: 'Animal', sectorEnv: 'Environment', sectorZoo: 'Animal-to-Human Sickness',
    severityLow: 'Small', severityModerate: 'Middle', severityHigh: 'Plenty', severityCritical: 'E Serious Well Well',
    locationName: 'Location name *', locationPlaceholder: 'e.g. General Hospital Lafia',
    state: 'State *', selectState: 'Pick your state',
    lga: 'LGA', lgaPlaceholder: 'e.g. Lafia',
    ward: 'Ward', wardPlaceholder: 'e.g. Lafia Central Ward',
    coordinates: 'Location Point', locating: '(e dey find am)',
    clearRelocate: 'Clear am and find again',
    latPlaceholder: 'Latitude, e.g. 8.5560', lonPlaceholder: 'Longitude, e.g. 8.5227',
    geoAutoFilled: 'We don fill the location point - abeg check say e correct.',
    geoNotFound: 'We no fit find the location point automatic. Abeg enter am yourself if you know am.',
    dateReported: 'Date wey you report am', reportedBy: 'Person wey report am', reportedByPlaceholder: 'Officer name',
    notes: 'Notes / Wetin Happen', notesPlaceholder: 'Any other gist about the outbreak...',
    submit: 'Send Report', saving: 'E dey save...', saved: 'Report Don Save!', saveOffline: 'Save Am Offline',
    backToDashboard: 'Go back to dashboard',
    fillRequired: 'Abeg fill Disease, State and Location.',
    submitFailed: 'We no fit save am online - we don save your report for your device, e go send once network dey.',
  },
}

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
  const [lang, setLang] = useState<LangKey>('EN');
  const t = T[lang];

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
      setGeoNotice(t.geoAutoFilled);
    } else {
      setGeoNotice(t.geoNotFound);
    }

    setGeocoding(false);
  }

  async function handleSubmit() {
    if (!form.disease_name || !form.state || !form.location_name) {
      alert(t.fillRequired);
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

      const stateName = canonicalState(form.state) ?? form.state;

      const { data: existingLoc } = await supabase
        .from('locations').select('id')
        .ilike('name', form.location_name)
        .eq('state', stateName)
        .limit(1).maybeSingle();

      if (existingLoc) {
        locationId = (existingLoc as unknown as LocationRow).id;
      } else {
        const { data: newLoc, error: locError } = await supabase
          .from('locations')
          .insert({
            name: form.location_name, state: stateName,
            lga: form.lga ? titleCase(form.lga) : null, ward: form.ward || null,
            geopolitical_zone: zoneForState(form.state) ?? '',
            latitude:  parseFloat(form.latitude)  || 9.082,
            longitude: parseFloat(form.longitude) || 8.675,
          } as any)
          .select('id').maybeSingle();

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
      alert(t.submitFailed);
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
          .ilike('name', item.location_name).limit(1).maybeSingle();

        if (existingLoc) {
          locationId = (existingLoc as unknown as LocationRow).id;
        } else {
          const { data: newLoc, error: locError } = await supabase
            .from('locations')
            .insert({
              name: item.location_name, state: canonicalState(item.state) ?? item.state,
              lga: item.lga ? titleCase(item.lga) : null, ward: item.ward || null,
              geopolitical_zone: zoneForState(item.state) ?? '',
              latitude:  parseFloat(item.latitude)  || 9.082,
              longitude: parseFloat(item.longitude) || 8.675,
            } as any)
            .select('id').maybeSingle();

          if (locError) throw locError;
          locationId = (newLoc as unknown as LocationRow)?.id ?? null;
        }

        const { error: outbreakError } = await supabase.from('outbreaks').insert({
          disease_name: item.disease_name, sector: item.sector,
          severity: item.severity, status: 'ACTIVE',
          report_source: 'FACILITY',
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

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-gray-400" />
            <select
              value={lang}
              onChange={e => setLang(e.target.value as LangKey)}
              className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none"
            >
              {(Object.keys(LANGUAGE_LABELS) as LangKey[]).map(code => (
                <option key={code} value={code} style={{ fontWeight: 700 }}>{LANGUAGE_LABELS[code]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList size={18} className="text-teal-600" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t.title}
              </h1>
            </div>
            <p className="text-xs text-gray-500">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
              isOnline
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? t.online : t.offline}
            </span>
          </div>
        </div>

        {!isOnline && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-4">
            <WifiOff size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {t.offlineNotice}
            </p>
          </div>
        )}

        {queueLen > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {queueLen} {t.pendingSync}
            </p>
            {isOnline ? (
              <button
                onClick={syncQueue}
                disabled={syncing}
                className="text-xs font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
              >
                {syncing ? t.syncing : t.syncNow}
              </button>
            ) : (
              <span className="text-xs text-blue-500/70">{t.offline}</span>
            )}
          </div>
        )}

        <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4 flex items-start gap-1.5">
          <WifiOff size={12} className="mt-0.5 flex-shrink-0 opacity-60" />
          {t.offlineCapable}
        </p>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              {t.disease}
            </label>
            <select
              value={form.disease_name}
              onChange={e => update('disease_name', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{t.diseasePlaceholder}</option>
              <optgroup label={t.optDisease}>
                {CANONICAL_DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
              </optgroup>
              <optgroup label={t.optSignal}>
                {CANONICAL_SIGNALS.map(sig => (
                  <option key={sig} value={`Community-reported: ${sig}`}>{sig}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-[11px] text-gray-500 mt-1">{t.signalHint}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.sector}</label>
              <select
                value={form.sector}
                onChange={e => update('sector', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="HUMAN">{t.sectorHuman}</option>
                <option value="ANIMAL">{t.sectorAnimal}</option>
                <option value="ENVIRONMENTAL">{t.sectorEnv}</option>
                <option value="ZOONOTIC">{t.sectorZoo}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.severity}</label>
              <select
                value={form.severity}
                onChange={e => update('severity', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="LOW">{t.severityLow}</option>
                <option value="MODERATE">{t.severityModerate}</option>
                <option value="HIGH">{t.severityHigh}</option>
                <option value="CRITICAL">{t.severityCritical}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.locationName}</label>
            <input
              value={form.location_name}
              onChange={e => update('location_name', e.target.value)}
              onBlur={handleLocationBlur}
              placeholder={t.locationPlaceholder}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.state}</label>
              <select
                value={form.state}
                onChange={e => update('state', e.target.value)}
                onBlur={handleLocationBlur}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t.selectState}</option>
                {NIGERIA_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.lga}</label>
              <input
                value={form.lga}
                onChange={e => update('lga', e.target.value)}
                onBlur={handleLocationBlur}
                placeholder={t.lgaPlaceholder}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.ward}</label>
            <input
              value={form.ward}
              onChange={e => update('ward', e.target.value)}
              onBlur={handleLocationBlur}
              placeholder={t.wardPlaceholder}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {t.coordinates} {geocoding && t.locating}
              </span>
              {(form.latitude || form.longitude) && (
                <button
                  type="button"
                  onClick={() => { update('latitude', ''); update('longitude', ''); setGeoNotice(null); }}
                  className="text-[11px] text-teal-600 hover:underline"
                >
                  {t.clearRelocate}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  value={form.latitude}
                  onChange={e => update('latitude', e.target.value)}
                  placeholder={t.latPlaceholder}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <input
                  value={form.longitude}
                  onChange={e => update('longitude', e.target.value)}
                  placeholder={t.lonPlaceholder}
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
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.dateReported}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => update('start_date', e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.reportedBy}</label>
              <input
                value={form.reported_by}
                onChange={e => update('reported_by', e.target.value)}
                placeholder={t.reportedByPlaceholder}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{t.notes}</label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder={t.notesPlaceholder}
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
            {saving ? t.saving : saved ? t.saved : isOnline ? t.submit : t.saveOffline}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          OneHealth Hub - <a href="/dashboard" className="text-teal-600 hover:underline">{t.backToDashboard}</a>
        </p>
      </div>
    </main>
  );
}