'use client';

import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import type { OutbreakEvent } from '@/types/outbreak';

interface Props {
  outbreaks: OutbreakEvent[];
}

export default function ExportButton({ outbreaks }: Props) {
  const [open, setOpen] = useState(false);

  function exportCSV() {
    const headers = [
      'ID', 'Disease', 'Sector', 'Severity', 'Location',
      'State', 'LGA', 'Latitude', 'Longitude',
      'Reported Date', 'Status', 'Notes'
    ];

    const rows = outbreaks.map(o => [
      o.id,
      o.disease,
      o.sector,
      o.severity,
      o.location_name ?? '',
      o.state ?? '',
      o.lga ?? '',
      o.latitude ?? '',
      o.longitude ?? '',
      new Date(o.reported_at).toLocaleDateString('en-NG'),
      o.is_active ? 'Active' : 'Resolved',
      (o.notes ?? '').replace(/,/g, ';'),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `onehealth-hub-outbreaks-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  function exportPDF() {
    const date = new Date().toLocaleDateString('en-NG', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const rows = outbreaks.map(o => `
      <tr>
        <td>${o.disease}</td>
        <td>${o.sector}</td>
        <td style="color:${
          o.severity === 'critical' ? '#E24B4A' :
          o.severity === 'high'     ? '#BA7517' : '#1D9E75'
        };font-weight:600">${o.severity}</td>
        <td>${o.location_name ?? '—'}</td>
        <td>${o.state ?? '—'}</td>
        <td>${new Date(o.reported_at).toLocaleDateString('en-NG')}</td>
        <td>${o.notes ?? '—'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>OneHealth Hub — Surveillance Report</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
          h1   { font-size: 20px; color: #1D9E75; margin-bottom: 4px; }
          h2   { font-size: 13px; color: #555; font-weight: normal; margin-bottom: 24px; }
          .meta { font-size: 11px; color: #777; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 11px; color: #444; border-bottom: 2px solid #e5e7eb; }
          td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
          tr:nth-child(even) td { background: #fafafa; }
          .footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>OneHealth Hub</h1>
        <h2>Integrated Zoonotic Disease Surveillance — Nigeria</h2>
        <div class="meta">
          Report generated: ${date} &nbsp;|&nbsp;
          Total active outbreaks: ${outbreaks.length} &nbsp;|&nbsp;
          Source: onehealth-hub.vercel.app
        </div>

        <table>
          <thead>
            <tr>
              <th>Disease</th>
              <th>Sector</th>
              <th>Severity</th>
              <th>Location</th>
              <th>State</th>
              <th>Reported</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="footer">
          OneHealth Hub · Private Sector Health Alliance of Nigeria (PSHAN) ·
          Integrated Zoonotic Disease Surveillance Platform ·
          Generated ${date}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Download size={14} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            onClick={exportCSV}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800"
          >
            <Table size={14} className="text-teal-600" />
            Download CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <FileText size={14} className="text-red-500" />
            Export PDF Report
          </button>
        </div>
      )}
    </div>
  );
}