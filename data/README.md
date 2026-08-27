# Research Data Layer — OneHealth Hub

This directory holds versioned analytical assets for the brucellosis
evidence-integration research module. It is isolated from application code
(`app/`, `components/`, `lib/`) and from Supabase. Nothing in this directory
is imported, fetched, or executed by the application yet.

See `CLAUDE.md` at the project root for the governing project instructions,
scientific interpretation rules, and architecture constraints.

## Status

**Scaffolding only.** No datasets have been added yet. Each subdirectory
below contains a placeholder `README.md` (and, for the processed layer, a
`LINEAGE.md`) describing what will eventually live there. The four validated
datasets (WAHIS extract, 21-study evidence layer, study–state bridge, Final
State Concordance v2.0) will be added in a separate, explicitly approved
step. No data has been fabricated or reconstructed to fill these folders.

## Structure and category definitions

```
data/
├── raw/               source data as received — never edited in place
│   └── wahis/
├── source-derived/    analytical assets derived from source material via
│   │                  documented extraction/compilation — not raw, not
│   │                  computed/matched output
│   ├── scoping-review/
│   └── study-state-bridge/
├── processed/         derived/computed output built from raw +
│   │                  source-derived inputs via documented transformation
│   │                  logic (see each dataset's LINEAGE.md)
│   └── state-concordance-v2/
├── geo/                verified geographic boundary assets (e.g. Nigeria
│                        state GeoJSON) — none added yet
├── dictionaries/        one data dictionary per dataset — none added yet
└── provenance/          cross-cutting source citations and version history
```

### Category rules

- **raw/** — data as received from its source (e.g. WOAH/WAHIS). Corrections
  or updates produce a new version; existing raw files are never overwritten
  in place. Missing values remain missing — never converted to zero or
  otherwise inferred.
- **source-derived/** — assets built from source material through a
  documented, traceable process (e.g. extraction from a scoping-review
  workbook, or linking study geography to explicit Nigerian states). These
  are not raw, but they are not computed concordance output either. No
  geographic assignment is invented — multi-regional studies without
  explicitly documented individual states retain that uncertainty rather
  than being assigned to states.
- **processed/** — output computed from raw and source-derived inputs (e.g.
  spatial/temporal/species concordance, evidence-gap classification). Each
  processed dataset must carry a `LINEAGE.md` documenting its inputs and
  transformation logic.
- **geo/** — boundary/geometry assets only. Kept separate from tabular
  evidence data. Placement relative to `public/` (for client-side Leaflet
  consumption) will be decided when GIS component work is approved — not in
  this scaffolding step.
- **dictionaries/** — column-level definitions (name, type, allowed values,
  missingness meaning) per dataset.
- **provenance/** — `SOURCES.md` (citation, retrieval date, license/usage
  terms per dataset) and `CHANGELOG.md` (version history of derived
  datasets).
