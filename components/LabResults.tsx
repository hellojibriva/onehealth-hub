'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FlaskConical, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LabResult {
  id:                   string;
  sample_id:            string;
  specimen_type:        string;
  test_method:          string;
  pathogen:             string;
  result:               string;
  ct_value?:            number | null;
  collection_date:      string;
  result_date?:         string | null;
  lab_name:             string;
  requesting_facility?: string | null;
  outbreak_id?:         string | null;
  notes?:               string | null;
  created_at:           string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function ResultBadge({ result }: { result: string }) {
  const r = result.toLowerCase();
  if (r === 'positive') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
      <XCircle size={12} /> Positive
    </span>
  );
  if (r === 'negative') return (
    <span className="flex items-center gap-1 text-xs font-semibold text-teal-600">
      <CheckCircle size={12} /> Negative
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
      <AlertCircle size={12} /> Inconclusive
    </span>
  );
}

export default function LabResults() {
  const [results,  setResults]  = useState<LabResult[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'all' | 'positive' | 'negative' | 'inconclusive'>('all');
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    async function fetch() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('lab_results')
        .select('*')
        .order('collection_date', { ascending: false });
      setResults((data ?? []) as LabResult[]);
      setLoading(false);
    }
    fetch();

    // Real-time
    const supabase = getSupabase();
    const channel = supabase
      .channel('lab-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lab_results' },
        (payload) => setResults(prev => [payload.new as LabResult, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = results.filter(r => {
    const matchFilter = filter === 'all' || r.result.toLowerCase() === filter;
    const matchSearch = search === '' ||
      r.sample_id.toLowerCase().includes(search.toLowerCase()) ||
      r.pathogen.toLowerCase().includes(search.toLowerCase()) ||
      r.lab_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.requesting_facility ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const positiveCount     = results.filter(r => r.result.toLowerCase() === 'positive').length;
  const negativeCount     = results.filter(r => r.result.toLowerCase() === 'negative').length;
  const inconclusiveCount = results.filter(r => r.result.toLowerCase() === 'inconclusive').length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <FlaskConical size={16} className="text-teal-600" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Laboratory Results
          </h3>
          <span className="text-xs text-gray-400">({results.length} total)</span>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-red-500">{positiveCount} positive</span>
          <span className="text-xs font-medium text-teal-600">{negativeCount} negative</span>
          <span className="text-xs font-medium text-amber-500">{inconclusiveCount} inconclusive</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <input
          type="text"
          placeholder="Search sample ID, pathogen, lab..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
        />
        <div className="flex gap-1">
          {(['all', 'positive', 'negative', 'inconclusive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading lab results...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No results found.</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['Sample ID', 'Pathogen',