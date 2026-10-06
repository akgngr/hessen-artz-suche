---
name: hessen-doctor-search
description: Specialized search and verification workflow for finding doctors, clinics, and specialists in Hessen with location, radius (km), contact verification, and language filtering.
---

# Hessen Doctor Search & Web Verification Procedure

When a user requests finding a doctor, medical practice, or healthcare specialist in Hessen (Germany):

## Phase 1: Search Execution
1. Translate user's medical query to official German medical terminology (e.g., "çocuk ortopedi" -> `Kinderorthopädie` or `Orthopädie`).
2. Call `suche_doktor` on `hessen-artz-suche` MCP server with `location`, `radius` (km), and `query`.

## Phase 2: Web Enrichment & Contact Verification
1. Inspect the returned doctor list.
2. If phone numbers, websites, or opening hours are missing or incomplete, execute a web search to check the official clinic website.
3. If the user requested specific languages (e.g. Turkish, English), verify whether the doctor or practice staff offers that language and prioritize them.

## Phase 3: Structured Presentation
Group and format each recommended doctor:
- **Doctor Name**: `[Title] [Full Name]`
- **Specialty & Sub-specialties**: `[Fachgebiet & Zusatzbezeichnungen]`
- **Distance**: `[X km]` from target location
- **Address**: `[Street, Zip Place]`
- **Phone**: `[Telephone]`
- **Links**: Profile, practice website, or Doctolib appointment booking link
