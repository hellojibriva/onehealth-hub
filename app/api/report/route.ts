import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { canonicalState, titleCase, zoneForState } from '@/lib/geo';

/**
 * Field report submissions from /collect.
 *
 * Migration 003 removed write access to `outbreaks` and `locations` from the
 * browser's anon key, so the form posts here instead. This route validates
 * the report and writes with the service role, the same way the USSD webhook
 * does. Only the fields below can be set; status and source are fixed.
 */

const SECTORS    = ['HUMAN', 'ANIMAL', 'ENVIRONMENTAL', 'ZOONOTIC'] as const;
const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;

// Nigeria's bounding box, with a small margin.
const LAT_RANGE = [3.5, 14.5];
const LON_RANGE = [2.5, 15.0];
const DEFAULT_LAT = 9.082;
const DEFAULT_LON = 8.675;

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function coordinate(value: unknown, [min, max]: number[], fallback: number): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

function isoDate(value: unknown): string {
  const today = new Date().toISOString().slice(0, 10);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return today;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || value > today) return today;
  return value;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const disease  = text(body.disease_name, 120);
  const place    = text(body.location_name, 120);
  const state    = canonicalState(text(body.state, 60));
  const sector   = SECTORS.find(s => s === body.sector);
  const severity = SEVERITIES.find(s => s === body.severity);

  if (!disease || !place || !state || !sector || !severity) {
    return NextResponse.json(
      { error: 'disease_name, location_name, a valid Nigerian state, sector and severity are required' },
      { status: 400 },
    );
  }

  const lga = text(body.lga, 80);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    let locationId: string | null = null;

    const { data: existing, error: findError } = await supabase
      .from('locations').select('id')
      .ilike('name', place)
      .eq('state', state)
      .limit(1).maybeSingle();
    if (findError) throw findError;

    if (existing) {
      locationId = existing.id;
    } else {
      const { data: created, error: locError } = await supabase
        .from('locations')
        .insert({
          name: place,
          state,
          lga: lga ? titleCase(lga) : null,
          ward: text(body.ward, 80),
          geopolitical_zone: zoneForState(state) ?? '',
          latitude:  coordinate(body.latitude,  LAT_RANGE, DEFAULT_LAT),
          longitude: coordinate(body.longitude, LON_RANGE, DEFAULT_LON),
        })
        .select('id').single();
      if (locError) throw locError;
      locationId = created.id;
    }

    const { error: outbreakError } = await supabase.from('outbreaks').insert({
      disease_name:  disease,
      sector,
      severity,
      status:        'ACTIVE',
      report_source: 'FACILITY',
      location_id:   locationId,
      start_date:    isoDate(body.start_date),
      description:   text(body.description, 2000),
      reported_by:   text(body.reported_by, 120),
    });
    if (outbreakError) throw outbreakError;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[api/report]', err);
    return NextResponse.json({ error: 'Could not save report' }, { status: 500 });
  }
}
