# OneHealth Hub

A multilingual digital One Health surveillance **research prototype** for Nigeria.

It demonstrates one pathway end to end: a community observation reaches a
surveillance workflow from a basic phone, is placed on a map alongside human,
animal and environmental events, and comes back to the same community as a risk
communication message in that zone's language.

> **Research prototype — not a production national surveillance system.**
> The USSD and SORMAS pathways are demonstrated architectures. There is no live
> Africa's Talking subscription and no live SORMAS connection behind this
> deployment.

## The pathway

```
Community / field
  USSD (Africa's Talking-compatible endpoint) · offline field form
        │
        ▼
Surveillance
  Human + Animal + Environmental + Zoonotic
        │
        ▼
Situational awareness
  GIS · severity · trends
        │
        ▼
Response
  RCCE → geopolitical zone → local language → community
```

## What is real, and what is demonstrated

| Capability | Status |
| --- | --- |
| Dashboard, GIS map, sector and severity filters | Implemented, live data from Supabase |
| Field data collection with offline store-and-forward | Implemented — reports queue in browser storage and sync on reconnect |
| RCCE compose → schedule → send → delivery history | Implemented |
| USSD reporting and alert retrieval | Implemented as an Africa's Talking-compatible webhook (`app/api/ussd/route.ts`). **Concept/prototype** — no live short-code subscription |
| SORMAS interoperability | **Concept only.** Exports a SORMAS-shaped JSON file for manual import. No live SORMAS connection, no credentials, nothing pushed to any national system |

## Surveillance taxonomy

`lib/taxonomy.ts` is the single place that decides what a record is called and
what kind of record it is. Two categories, kept strictly apart:

- **Disease event** — a named diagnosis or hazard from the canonical vocabulary
  (`Brucellosis`, `Lassa Fever`, `Avian Influenza (H5N1)`, …). One spelling per
  disease, everywhere: map, cards, filters, alerts, exports.
- **Community-reported signal** — a symptom or sign observed and reported, such
  as `Abortion/miscarriage` or `Diarrhea/vomiting`. A signal is **not** a
  diagnosis and is never counted as one. It carries a sector and a location and
  waits for field verification.

Historical rows are normalised on read, so past spellings stay usable without
rewriting the operational database. `data/migrations/001` applies the same
normalisation at rest.

## Geography

Locations are always written as **State → LGA/Town**, e.g. `Jigawa → Doko`.
`lib/geo.ts` canonicalises free-text state names and owns the single
state → geopolitical zone mapping used by the dashboard, the USSD handler and
the field form.

## Language pathways

| Geopolitical zone | Primary localised pathway |
| --- | --- |
| North East | Hausa |
| North West | Hausa |
| North Central | Hausa |
| South West | Yoruba |
| South East | Igbo |
| South South | Nigerian Pidgin |

English remains available for every zone as the general/default language.
`data/seed/rcce_demo_alerts.sql` seeds one demonstration alert per pathway.

## Reporter privacy

A reporter's phone number is never published.

- The USSD handler writes the phone number **only** to `ussd_reports`, the audit
  log a field officer needs for follow-up. It is not written to `outbreaks`,
  which the public dashboard reads.
- Community reports are attributed as `Community reporter · CR-XXXXXX` — a
  reference derived from the record's own ID, resolvable by an authorised
  officer, not reversible to a phone number by a visitor.
- SORMAS exports carry the reporter reference, never the number.
- `data/migrations/002` puts row level security on `ussd_reports` so the audit
  log is not readable through the public anon key.

Run both migrations before treating any deployment as safe to share.

## Setup

```bash
npm install
npm run dev
```

Environment (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Point an Africa's Talking USSD channel at `POST /api/ussd` to exercise the
reporting flow against a real handset.

## Database scripts

| Script | Purpose |
| --- | --- |
| `data/migrations/001_normalise_surveillance_taxonomy.sql` | Remove reporter phone numbers from `outbreaks`, fold duplicate disease spellings, move syndromic free text onto the signal convention, canonicalise state names and zones |
| `data/migrations/002_restrict_ussd_reports.sql` | Row level security on the USSD audit log |
| `data/seed/rcce_demo_alerts.sql` | One RCCE demo alert per zone/language pathway |

## Stack

Next.js (App Router) · TypeScript · Supabase · Leaflet · Recharts · Tailwind.

---

© 2026 Jibrin Abi Precious. Research prototype — shared for academic evaluation.
See `/about`.
