'use client';

import { useState } from 'react';
import { WifiOff, Wifi, Send, ClipboardList, MapPin, Globe } from 'lucide-react';
import { getSupabase } from '@/lib/supabaseClient';

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
    subtitle: 'OneHealth Hub · Nigeria Zoonotic Surveillance',
    online: 'Online', offline: 'Offline',
    offlineNotice: 'You are offline. Reports will be saved to your device and synced automatically when you reconnect.',
    pendingSync: 'report(s) pending sync',
    syncNow: 'Sync now →', syncing: 'Syncing...',
    disease: 'Disease / Pathogen *', diseasePlaceholder: 'e.g. Lassa fever',
    sector: 'Sector *', severity: 'Severity *',
    sectorHuman: 'Human', sectorAnimal: 'Animal', sectorEnv: 'Environmental', sectorZoo: 'Zoonotic',
    severityLow: 'Low', severityModerate: 'Moderate', severityHigh: 'High', severityCritical: 'Critical',
    locationName: 'Location name *', locationPlaceholder: 'e.g. General Hospital Lafia',
    state: 'State *', selectState: 'Select your state',
    lga: 'LGA', lgaPlaceholder: 'e.g. Lafia',
    ward: 'Ward', wardPlaceholder: 'e.g. Lafia Central Ward',
    coordinates: 'Coordinates', locating: '(locating…)',
    clearRelocate: 'Clear & re-locate',
    latPlaceholder: 'Latitude, e.g. 8.5560', lonPlaceholder: 'Longitude, e.g. 8.5227',
    geoAutoFilled: 'Coordinates auto-filled — please confirm they look correct.',
    geoNotFound: 'Could not find coordinates automatically. Please enter them manually if known.',
    dateReported: 'Date reported', reportedBy: 'Reported by', reportedByPlaceholder: 'Officer name',
    notes: 'Notes / Description', notesPlaceholder: 'Additional details about the outbreak...',
    submit: 'Submit Report', saving: 'Saving...', saved: '✓ Report Saved!', saveOffline: 'Save Offline',
    backToDashboard: 'Back to dashboard',
    fillRequired: 'Please fill in Disease, State and Location.',
    submitFailed: 'Could not save online — your report was saved locally and will sync when possible.',
  },
  HA: {
    title: 'Tattara Bayanan Fili',
    subtitle: 'OneHealth Hub · Sa ido kan Cututtukan Dabbobi a Najeriya',
    online: 'Kan layi', offline: 'Ba kan layi ba',
    offlineNotice: 'Ba ka kan layi ba. Za a adana rahoton a na\'urarka kuma a aika shi ta atomatik idan ka sake haduwa da yanar gizo.',
    pendingSync: 'rahoto(ni) da ke jiran aikawa',
    syncNow: 'Aika yanzu →', syncing: 'Ana aikawa...',
    disease: 'Cuta / Kwayar cuta *', diseasePlaceholder: 'misali Zazzabin Lassa',
    sector: 'Bangare *', severity: 'Girman Matsala *',
    sectorHuman: 'Dan Adam', sectorAnimal: 'Dabba', sectorEnv: 'Muhalli', sectorZoo: 'Cutar Dabba zuwa Mutum',
    severityLow: 'Kadan', severityModerate: 'Matsakaici', severityHigh: 'Girma', severityCritical: 'Mai Tsanani',
    locationName: 'Sunan wuri *', locationPlaceholder: 'misali Babban Asibitin Lafia',
    state: 'Jiha *', selectState: 'Zabi jihar ka',
    lga: 'Karamar Hukuma', lgaPlaceholder: 'misali Lafia',
    ward: 'Unguwa', wardPlaceholder: 'misali Unguwar Tsakiyar Lafia',
    coordinates: 'Wurin Taswira', locating: '(ana nemowa…)',
    clearRelocate: 'Share & sake nema',
    latPlaceholder: 'Latitude, misali 8.5560', lonPlaceholder: 'Longitude, misali 8.5227',
    geoAutoFilled: 'An cika wurin taswira atomatik — da fatan za a tabbatar daidai ne.',
    geoNotFound: 'Ba a samu wurin taswira atomatik ba. Da fatan a shigar da shi da hannu idan an sani.',
    dateReported: 'Ranar rahoto', reportedBy: 'Wanda ya bayar da rahoto', reportedByPlaceholder: 'Sunan jami\'i',
    notes: 'Bayani / Karin bayani', notesPlaceholder: 'Karin bayani game da annobar...',
    submit: 'Aika Rahoto', saving: 'Ana adanawa...', saved: '✓ An Adana Rahoton!', saveOffline: 'Adana Ba Kan Layi',
    backToDashboard: 'Koma zuwa dashboard',
    fillRequired: 'Da fatan a cika Cuta, Jiha da Wuri.',
    submitFailed: 'Ba a iya adanawa kan layi ba — an adana rahoton a na\'ura kuma za a aika shi nan gaba.',
  },
  IG: {
    title: 'Nchikota Data Ubi',
    subtitle: 'OneHealth Hub · Nleba Anya Oria Anụmanụ na Nigeria',
    online: 'Ntanetị', offline: 'Adịghị n\'ịntanetị',
    offlineNotice: 'Ị nọghị n\'ịntanetị. A ga-echekwa akụkọ gị na ngwaọrụ gị ma ziga ya na akpaghị aka mgbe ị nwetaghachiri ntanetị.',
    pendingSync: 'akụkọ na-echere izipu',
    syncNow: 'Ziga ugbu a →', syncing: 'Na-eziga...',
    disease: 'Oria / Ihe na-ebute oria *', diseasePlaceholder: 'dịka Oria Lassa',
    sector: 'Ngalaba *', severity: 'Ogo Ihe Ọjọọ *',
    sectorHuman: 'Mmadụ', sectorAnimal: 'Anụmanụ', sectorEnv: 'Gburugburu', sectorZoo: 'Oria si n\'Anụmanụ gaa Mmadụ',
    severityLow: 'Nta', severityModerate: 'Etiti', severityHigh: 'Ukwuu', severityCritical: 'Oke Ihe Ọjọọ',
    locationName: 'Aha ebe *', locationPlaceholder: 'dịka Ụlọ Ọgwụ Lafia',
    state: 'Steeti *', selectState: 'Họrọ steeti gị',
    lga: 'LGA', lgaPlaceholder: 'dịka Lafia',
    ward: 'Wadị', wardPlaceholder: 'dịka Wadị Etiti Lafia',
    coordinates: 'Ebe Dị N\'ígódò', locating: '(na-achọ…)',
    clearRelocate: 'Hichapụ & chọgharịa',
    latPlaceholder: 'Latitude, dịka 8.5560', lonPlaceholder: 'Longitude, dịka 8.5227',
    geoAutoFilled: 'Ejupụtala ebe n\'igodo n\'onwe ya — biko kwado na ọ ziri ezi.',
    geoNotFound: 'Achọtaghị ebe n\'ígódò na akpaghị aka. Biko tinye ya n\'aka ma ọ bụrụ na ị maara ya.',
    dateReported: 'Ụbọchị akụkọ', reportedBy: 'Onye kọrọ akụkọ', reportedByPlaceholder: 'Aha onye ọrụ',
    notes: 'Ndetu / Nkọwa', notesPlaceholder: 'Nkọwa ọzọ gbasara ọrịa a...',
    submit: 'Ziga Akụkọ', saving: 'Na-echekwa...', saved: '✓ Echekwala Akụkọ!', saveOffline: 'Chekwaa n\'Adịghị Ntanetị',
    backToDashboard: 'Laghachi na dashboard',
    fillRequired: 'Biko dejupụta Oria, Steeti na Ebe.',
    submitFailed: 'Enweghị ike ichekwa na ntanetị — echekwala akụkọ gị n\'ngwaọrụ gị, a ga-ezigakwa ya mgbe e nwere ohere.',
  },
  YO: {
    title: 'Ikojọpọ Data Ojula',
    subtitle: 'OneHealth Hub · Ibojuwo Arun Eranko ni Naijiria',
    online: 'Lori ayelujara', offline: 'Ko si lori ayelujara',
    offlineNotice: 'O ko si lori ayelujara. A o fi ijabo pamọ si ẹrọ rẹ ki a si fi ranṣẹ laifọwọyi nigba ti o ba tun sopọ mọ ayelujara.',
    pendingSync: 'ijabo(awọn) ti n duro de fifiranṣẹ',
    syncNow: 'Fi ranṣẹ nisisiyi →', syncing: 'N fi ranṣẹ...',
    disease: 'Arun / Kokoro Arun *', diseasePlaceholder: 'bii Iba Lassa',
    sector: 'Eka *', severity: 'Bi O Ṣe Le To *',
    sectorHuman: 'Eniyan', sectorAnimal: 'Eranko', sectorEnv: 'Ayika', sectorZoo: 'Arun Eranko si Eniyan',
    severityLow: 'Kekere', severityModerate: 'Alabọde', severityHigh: 'Giga', severityCritical: 'Idẹruba',
    locationName: 'Orukọ ibi *', locationPlaceholder: 'bii Ile-iwosan Gbogbogbo Lafia',
    state: 'Ipinlẹ *', selectState: 'Yan ipinlẹ rẹ',
    lga: 'LGA', lgaPlaceholder: 'bii Lafia',
    ward: 'Agbegbe (Ward)', wardPlaceholder: 'bii Agbegbe Aarin Lafia',
    coordinates: 'Ipo Aworan', locating: '(n wa…)',
    clearRelocate: 'Nu & tun wa',
    latPlaceholder: 'Latitude, bii 8.5560', lonPlaceholder: 'Longitude, bii 8.5227',
    geoAutoFilled: 'A ti fi ipo aworan kun laifọwọyi — jọwọ ṣayẹwo pe o tọ.',
    geoNotFound: 'A ko le ri ipo aworan laifọwọyi. Jọwọ tẹ ẹ sii pẹlu ọwọ ti o ba mọ.',
    dateReported: 'Ọjọ ijabo', reportedBy: 'Ẹni to jabo', reportedByPlaceholder: 'Orukọ oṣiṣẹ',
    notes: 'Akiyesi / Alaye', notesPlaceholder: 'Alaye afikun nipa ajakale-arun naa...',
    submit: 'Fi Ijabo Ranṣẹ', saving: 'N fi pamọ...', saved: '✓ Ijabo Ti Fi Pamọ!', saveOffline: 'Fi Pamọ Lai si Ayelujara',
    backToDashboard: 'Pada si dashboard',
    fillRequired: 'Jọwọ kun Arun, Ipinlẹ ati Ibi.',
    submitFailed: 'A ko le fi pamọ lori ayelujara — a ti fi ijabo rẹ pamọ si ẹrọ, a o si fi ranṣẹ nigba ti o ba ṣeeṣe.',
  },
  PCM: {
    title: 'Field Data Collection',
    subtitle: 'OneHealth Hub · Nigeria Zoonotic Surveillance',
    online: 'Online', offline: 'Offline',
    offlineNotice: 'You no dey online. We go save your report for your device and send am automatic once you get network again.',
    pendingSync: 'report(s) wey dey wait to send',
    syncNow: 'Send am now →', syncing: 'E dey send...',
    disease: 'Disease / Wetin dey cause am *', diseasePlaceholder: 'e.g. Lassa fever',
    sector: 'Sector *', severity: 'How E Bad Reach *',
    sectorHuman: 'Human', sectorAnimal: 'Animal', sectorEnv: 'Environment', sectorZoo: 'Animal-to-Human Sickness',
    severityLow: 'Small', severityModerate: 'Middle', severityHigh: 'Plenty', severityCritical: 'E Serious Well Well',
    locationName: 'Location name *', locationPlaceholder: 'e.g. General Hospital Lafia',
    state: 'State *', selectState: 'Pick your state',
    lga: 'LGA', lgaPlaceholder: 'e.g. Lafia',
    ward: 'Ward', wardPlaceholder: 'e.g. Lafia Central Ward',
    coordinates: 'Location Point', locating: '(e dey find am…)',
    clearRelocate: 'Clear am & find again',
    latPlaceholder: 'Latitude, e.g. 8.5560', lonPlaceholder: 'Longitude, e.g. 8.5227',
    geoAutoFilled: 'We don fill the location point — abeg check say e correct.',
    geoNotFound: 'We no fit find the location point automatic. Abeg enter am yourself if you know am.',
    dateReported: 'Date wey you report am', reportedBy: 'Person wey report am', reportedByPlaceholder: 'Officer name',
    notes: 'Notes / Wetin Happen', notesPlaceholder: 'Any other gist about the outbreak...',
    submit: 'Send Report', saving: 'E dey save...', saved: '✓ Report Don Save!', saveOffline: 'Save Am Offline',
    backToDashboard: 'Go back to dashboard',
    fillRequired: 'Abeg fill Disease, State and Location.',
    submitFailed: 'We no fit save am online — we don save your report for your device, e go send once network dey.',
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

      const { data: existingLoc } = await supabase
        .from('locations').select('id')
        .ilike('name', form.location_name).limit(1).maybeSingle();

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
              name: item.location_name, state: item.state,
              lga: item.lga || null, ward: item.ward || null,
              geopolitical_zone: '',
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
              className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 focus:outline-none"
            >
              {(Object.keys(LANGUAGE_LABELS) as LangKey[]).map(code => (
                <option key={code} value={code}>{LANGUAGE_LABELS[code]}</option>
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
          <div className="flex