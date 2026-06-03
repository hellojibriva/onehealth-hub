'use client';

import { useEffect, useRef, useState } from 'react';
import type { OutbreakEvent } from '@/types/outbreak';

type Disease = 'all' | string;
type Sector  = 'all' | 'human' | 'animal' | 'environmental' | 'zoonotic';

interface Props {
  outbreaks: OutbreakEvent[];
}

const SECTOR_COLORS: Record<string, string> = {
  human:         '#E24B4A',
  animal:        '#BA7517',
  environmental: '#1D9E75',
  zoonotic:      '#378ADD',
};

const NIGERIA_CENTER: [number, number] = [9.0820, 8.6753];
const NIGERIA_ZOOM = 6;

function Toggle({ label, checked, onChange, id }: {
  label: string; checked: boolean; onChange: () => void; id: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs text-gray-500 font-medium cursor-pointer select-none">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 ${
          checked ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

export default function NigeriaMap({ outbreaks }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const heatRef    = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [disease,    setDisease]    = useState<Disease>('all');
  const [sector,     setSector]     = useState<Sector>('all');
  const [showHeat,   setShowHeat]   = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [ready,      setReady]      = useState(false);

  const diseaseOptions = ['all', ...Array.from(new Set(outbreaks.map(o => o.disease))).sort()];

  useEffect(() => {
    if (typeof window === 'undefined' || leafletRef.current) return;

    async function init() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      await import('leaflet.heat');

      if (!mapRef.current) return;
      if ((mapRef.current as any)._leaflet_id) return;

      const map = L.map(mapRef.current, {
        center: NIGERIA_CENTER,
        zoom:   NIGERIA_ZOOM,
        zoomControl: true,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      leafletRef.current = { L, map };
      setReady(true);
    }

    init();

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !leafletRef.current) return;
    const { L, map } = leafletRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (heatRef.current) { heatRef.current.remove(); heatRef.current = null; }

    const filtered = outbreaks.filter(o => {
      const diseaseMatch = disease === 'all' || o.disease === disease;
      const sectorMatch  = sector  === 'all' || o.sector  === sector;
      return diseaseMatch && sectorMatch;
    });

    if (showHeat) {
      const heatPoints = filtered.map(o => {
        const intensity = o.severity === 'critical' ? 1.0 : o.severity === 'high' ? 0.7 : 0.4;
        return [o.latitude, o.longitude, intensity] as [number, number, number];
      });
      // @ts-ignore
      heatRef.current = L.heatLayer(heatPoints, {
        radius:   30,
        blur:     20,
        maxZoom:  10,
        gradient: { 0.3: '#1D9E75', 0.6: '#BA7517', 1.0: '#E24B4A' },
      }).addTo(map);
    }

    if (showLayers) {
      filtered.forEach(o => {
        if (!o.latitude || !o.longitude) return;
        const color  = SECTOR_COLORS[o.sector] ?? '#888';
        const radius = o.severity === 'critical' ? 14 : o.severity === 'high' ? 10 : 7;

        const marker = L.circleMarker([o.latitude, o.longitude], {
          radius,
          color:       color,
          weight:      2,
          fillColor:   color,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="min-width:160px;font-size:13px;line-height:1.8">
            <strong>${o.location_name ?? 'Unknown'}</strong><br/>
            <span style="color:#666">Disease:</span> ${o.disease}<br/>
            <span style="color:#666">Sector:</span> ${o.sector}<br/>
            <span style="color:#666">Severity:</span>
            <span style="font-weight:600;color:${
              o.severity === 'critical' ? '#E24B4A' :
              o.severity === 'high'     ? '#BA7517' : '#1D9E75'
            }">${o.severity}</span><br/>
            ${o.notes ? `<span style="color:#666">Notes:</span> ${o.notes}<br/>` : ''}
            <span style="color:#666">Reported:</span> ${new Date(o.reported_at).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}
          </div>
        `);

        marker.addTo(map);
        markersRef.current.push(marker);
      });
    }
  }, [ready, outbreaks, disease, sector, showHeat, showLayers]);

  const filteredCount = outbreaks.filter(o =>
    (disease === 'all' || o.disease === disease) &&
    (sector  === 'all' || o.sector  === sector)
  ).length;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <label htmlFor="diseaseFilter" className="text-xs text-gray-500 font-medium">Disease</label>
          <select
            id="diseaseFilter"
            value={disease}
            onChange={e => setDisease(e.target.value)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {diseaseOptions.map(d => (
              <option key={d} value={d}>{d === 'all' ? 'All diseases' : d}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sectorFilter" className="text-xs text-gray-500 font-medium">Sector</label>
          <select
            id="sectorFilter"
            value={sector}
            onChange={e => setSector(e.target.value as Sector)}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All sectors</option>
            <option value="human">Human</option>
            <option value="animal">Animal</option>
            <option value="environmental">Environmental</option>
            <option value="zoonotic">Zoonotic</option>
          </select>
        </div>

        <Toggle label="Heatmap"           checked={showHeat}   onChange={() => setShowHeat(v => !v)}   id="heatToggle"   />
        <Toggle label="One Health layers" checked={showLayers} onChange={() => setShowLayers(v => !v)} id="layersToggle" />

        <span className="ml-auto text-xs text-gray-400">{filteredCount} event(s) shown</span>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ height: '480px', width: '100%' }} />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {Object.entries(SECTOR_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: c }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-400">Marker size = severity</span>
      </div>
    </div>
  );
}