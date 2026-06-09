'use client';

import { useState } from 'react';

const LIKERT = [1, 2, 3, 4, 5];
const LIKERT_LABELS: Record<number, string> = {
  1: 'Very Poor', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent',
};

function LikertRow({ label, field, value, onChange }: {
  label: string; field: string; value: number; onChange: (f: string, v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-700 dark:text-gray-300">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {LIKERT.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(field, n)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              value === n
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
            }`}
          >
            {n} — {LIKERT_LABELS[n]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
      <h2 className="text-base font-semibold text-teal-700 dark:text-teal-400 border-b border-gray-100 dark:border-gray-800 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

const EMPTY = {
  respondent_type: '',
  years_experience: '',
  used_similar_systems: '',
  systems_used: '',
  ease_of_use: 0,
  navigation: 0,
  visual_design: 0,
  mobile_friendliness: 0,
  loading_speed: 0,
  outbreak_reporting: 0,
  map_usefulness: 0,
  alert_system: 0,
  data_export: 0,
  offline_mode: 0,
  ussd_concept: 0,
  vs_sormas: '',
  vs_afydata: '',
  vs_dhis2: '',
  onehealth_advantage: '',
  best_feature: '',
  needs_improvement: '',
  would_recommend: '',
  additional_comments: '',
};

export default function EvaluationPage() {
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  function update(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.respondent_type || !form.ease_of_use || !form.outbreak_reporting) {
      setError('Please complete all required fields (marked *).');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message ?? 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">✓</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Thank you for your response!
          </h1>
          <p className="text-sm text-gray-500">
            Your evaluation has been recorded and will contribute to research on One Health digital surveillance systems in Nigeria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            OneHealth Hub — User Evaluation
          </h1>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            This form evaluates the usability and functionality of OneHealth Hub, an integrated zoonotic disease surveillance platform for Nigeria. Your responses will be used for academic research comparing digital One Health surveillance tools.
          </p>
          <p className="text-xs text-gray-400">Takes approximately 5–8 minutes. All responses are anonymous.</p>
        </div>

        {/* Section 1 — Respondent background */}
        <Section title="Section 1 — About You">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              I am a * 
            </label>
            <select
              value={form.respondent_type}
              onChange={e => update('respondent_type', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select your role</option>
              <option value="health_worker">Health Worker (nurse, CHO, doctor, lab scientist)</option>
              <option value="surveillance_officer">Disease Surveillance / Epidemiology Officer</option>
              <option value="farmer">Farmer / Livestock Owner</option>
              <option value="researcher">Public Health Researcher</option>
              <option value="program_officer">Programme / M&E Officer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Years of experience in health / agriculture
            </label>
            <select
              value={form.years_experience}
              onChange={e => update('years_experience', e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select range</option>
              <option value="0-2">0–2 years</option>
              <option value="3-5">3–5 years</option>
              <option value="6-10">6–10 years</option>
              <option value="10+">More than 10 years</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Have you used a digital disease surveillance system before?
            </label>
            <div className="flex gap-3">
              {['Yes', 'No'].map(opt => (
                <button key={opt} type="button"
                  onClick={() => update('used_similar_systems', opt)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    form.used_similar_systems === opt
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>

          {form.used_similar_systems === 'Yes' && (
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                Which systems have you used? (e.g. DHIS2, SORMAS, AfyData, NCDC tools)
              </label>
              <input
                value={form.systems_used}
                onChange={e => update('systems_used', e.target.value)}
                placeholder="List the systems you have used"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </Section>

        {/* Section 2 — Usability */}
        <Section title="Section 2 — Usability (1 = Very Poor, 5 = Excellent) *">
          <LikertRow label="Overall ease of use" field="ease_of_use" value={form.ease_of_use} onChange={update} />
          <LikertRow label="Ease of navigation (finding what you need)" field="navigation" value={form.navigation} onChange={update} />
          <LikertRow label="Visual design and layout" field="visual_design" value={form.visual_design} onChange={update} />
          <LikertRow label="Mobile friendliness" field="mobile_friendliness" value={form.mobile_friendliness} onChange={update} />
          <LikertRow label="Loading speed and performance" field="loading_speed" value={form.loading_speed} onChange={update} />
        </Section>

        {/* Section 3 — Features */}
        <Section title="Section 3 — Feature Evaluation (1 = Very Poor, 5 = Excellent) *">
          <LikertRow label="Outbreak reporting form (ease of submitting a report)" field="outbreak_reporting" value={form.outbreak_reporting} onChange={update} />
          <LikertRow label="Interactive Nigeria map (viewing outbreak locations)" field="map_usefulness" value={form.map_usefulness} onChange={update} />
          <LikertRow label="Alert and notification system" field="alert_system" value={form.alert_system} onChange={update} />
          <LikertRow label="Data export (CSV / PDF)" field="data_export" value={form.data_export} onChange={update} />
          <LikertRow label="Offline data collection capability" field="offline_mode" value={form.offline_mode} onChange={update} />
          <LikertRow label="USSD-based reporting concept (for farmers without smartphones)" field="ussd_concept" value={form.ussd_concept} onChange={update} />
        </Section>

        {/* Section 4 — Comparison */}
        <Section title="Section 4 — Comparison with Other Systems">
          <p className="text-xs text-gray-400 -mt-2">Answer based on your experience or perception. If you have not used a system, select "Not sure".</p>

          {[
            { field: 'vs_sormas', label: 'Compared to SORMAS, OneHealth Hub is:' },
            { field: 'vs_afydata', label: 'Compared to AfyData, OneHealth Hub is:' },
            { field: 'vs_dhis2', label: 'Compared to DHIS2, OneHealth Hub is:' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">{label}</label>
              <div className="flex flex-wrap gap-2">
                {['Much better', 'Better', 'About the same', 'Worse', 'Not sure'].map(opt => (
                  <button key={opt} type="button"
                    onClick={() => update(field, opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      (form as any)[field] === opt
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
                    }`}
                  >{opt}</button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              What do you think is OneHealth Hub's biggest advantage over existing tools?
            </label>
            <textarea
              value={form.onehealth_advantage}
              onChange={e => update('onehealth_advantage', e.target.value)}
              rows={3}
              placeholder="e.g. The One Health approach integrating human, animal and environmental data in one place..."
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </Section>

        {/* Section 5 — Open ended */}
        <Section title="Section 5 — Your Overall Opinion">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              What did you like most about OneHealth Hub?
            </label>
            <textarea
              value={form.best_feature}
              onChange={e => update('best_feature', e.target.value)}
              rows={2}
              placeholder="Describe the feature or aspect you found most useful..."
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              What needs improvement?
            </label>
            <textarea
              value={form.needs_improvement}
              onChange={e => update('needs_improvement', e.target.value)}
              rows={2}
              placeholder="What would make this platform more useful for your work?"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Would you recommend OneHealth Hub to colleagues or use it in your work?
            </label>
            <div className="flex flex-wrap gap-2">
              {['Definitely yes', 'Probably yes', 'Not sure', 'Probably not', 'Definitely not'].map(opt => (
                <button key={opt} type="button"
                  onClick={() => update('would_recommend', opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    form.would_recommend === opt
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-teal-400'
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
              Any other comments or suggestions?
            </label>
            <textarea
              value={form.additional_comments}
              onChange={e => update('additional_comments', e.target.value)}
              rows={3}
              placeholder="Anything else you would like to share..."
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </Section>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium rounded-xl transition-colors text-sm"
        >
          {submitting ? 'Submitting...' : 'Submit Evaluation'}
        </button>

        <p className="text-center text-xs text-gray-400 pb-6">
          OneHealth Hub · Integrated Zoonotic Disease Surveillance · Nigeria
        </p>
      </div>
    </main>
  );
}