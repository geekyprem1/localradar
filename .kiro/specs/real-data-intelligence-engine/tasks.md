# Implementation Plan: Real Data Intelligence Engine

## Overview

This plan reworks LocalRadar's intelligence pipeline so every value returned to a user is
either sourced from real data or explicitly labeled with its provenance and confidence. It
threads a small set of honesty primitives (`ProvenanceLabel`, `DataSource`, `ConfidenceValue`)
through the scoring engine and the `/api/search` route handler, and fixes the concrete scoring
defects (double-counted booking bonus, overlapping closing tiers, inflated deal values,
mismatched audit mapping, name-based cache keys, dropped `country`, silent demo fallback).

Implementation language is **TypeScript** on the existing stack (Next.js 16.2.9 App Router route
handlers, React 19, Supabase). Property-based tests use **fast-check**; unit/integration tests
use **Vitest**. Per `AGENTS.md`, re-check `node_modules/next/dist/docs/` (esp.
`01-app/01-getting-started/15-route-handlers.md`) before editing `src/app/api/search/route.ts`.

Tasks build incrementally: honesty primitives and types first, then the pure producing
components (each with its property tests close by), then the scoring facade, then the route
handler and cache wiring, and finally end-to-end integration tests.

## Tasks

- [x] 1. Set up test tooling and honesty primitives
  - [x] 1.1 Add Vitest + fast-check and a test script
    - Add `vitest` and `fast-check` to `devDependencies`
    - Add `"test": "vitest run"` (single-run, no watch) to `package.json` scripts
    - Create a minimal `vitest.config.ts` compatible with the existing TS setup
    - _Requirements: (tooling for all testable requirements)_

  - [x] 1.2 Define provenance primitives in `src/types/scoring.ts`
    - Add `ProvenanceLabel`, `DataSource`, `ConfidenceValue`, `Provenanced<T>`
    - Add `ContactProvenance`, `SignalProvenance`, `SignalKey`
    - Extend `ScoredOpportunity` with `dealValue: DealValueResult`, `confidenceScore`,
      `signalProvenance`, `contactProvenance?`, and `competitorBenchmark.provenance`/`sampleSize`
    - _Requirements: 1.2, 3.1, 11.1, 11.2, 11.3, 11.4_

  - [x] 1.3 Extend `Business` and `Opportunity` types in `src/types/index.ts`
    - Add `place_id`, `contact_provenance?` to `Business`
    - Add `place_id`, `deal_value_min/max`, `deal_value_provenance`, `confidence`,
      `data_source`, and make `estimated_deal_value` nullable on `Opportunity`
    - _Requirements: 7.3, 9.1, 9.6, 11.2_

- [x] 2. Implement Currency_Formatter fix (`src/lib/currency.ts`)
  - [x] 2.1 Add case-insensitive country match and format-only range helper
    - Resolve supported countries (US, India, Canada, UK, Australia) case-insensitively
    - Default to USD for empty/null/unsupported country
    - Ensure `formatCurrencyRange` reformats without any FX conversion
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x]* 2.2 Write property test for multi-currency formatting
    - **Property 12: Multi-currency formats without conversion**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [x] 3. Implement Contact_Enricher (`src/lib/enrichment/contactEnricher.ts`)
  - [x] 3.1 Create the interface and `NoGuessContactEnricher` default
    - Define `ContactFields`, `EnrichedContact`, `ContactEnricher` interface
    - Implement `NoGuessContactEnricher` that never guesses; empty + `unavailable` by default
      and whenever the business has no website
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [x] 3.2 Implement `ExternalContactEnricher` with 10s timeout and honest labels
    - `real` on confirmed association, `estimated` on located-unconfirmed, `unavailable` on
      miss/failure/timeout; preserve existing values without overwriting with a guess
    - _Requirements: 1.3, 1.4, 1.7_

  - [x]* 3.3 Write property test for default enricher
    - **Property 1: Default contact enricher never guesses and always labels**
    - **Validates: Requirements 1.1, 1.2, 1.5, 1.6**

  - [x]* 3.4 Write property test for external enricher label mapping
    - **Property 2: External enricher label mapping is honest**
    - **Validates: Requirements 1.3, 1.4**

- [x] 4. Implement Competitor_Benchmark_Service (`src/lib/scoring/competitorBenchmark.ts`)
  - [x] 4.1 Build benchmark from the live result set with self-exclusion
    - Define `PlaceLite`, `CompetitorBenchmarkResult`, `CompetitorBenchmarkService`
    - Compute avg reviews (whole) and avg rating (0.1, 0–5) from remaining competitors
    - Exclude scored business by place id; `real` when sample ≥ 3, `estimated` when 1–2,
      null averages + `estimated` + sampleSize 0 when 0; never hardcode values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x]* 4.2 Write property test for competitor benchmark
    - **Property 3: Competitor benchmark is computed, never hardcoded, and self-excluding**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Signal_Extractor honesty labeling (`src/lib/scoring/index.ts`)
  - [x] 6.1 Emit signal provenance and add website-inspection hook
    - Add `WebsiteInspection`/`WebsiteInspector`; update `extractSignals` to return
      `{ signals, provenance }`
    - Label booking/lead-form/whatsapp/appointment/website-age as `heuristic` when no
      inspection; Instagram-only/Facebook-only derived only from the website URL;
      underivable signals `unavailable`
    - _Requirements: 3.1, 3.2, 3.6, 3.7_

  - [x] 6.2 Implement central `phraseReason(text, label)` helper
    - Heuristic reasons use assumption language and avoid "detected/confirmed/verified/found";
      only `real` signals may use confirmation language
    - _Requirements: 3.3, 3.4, 3.5_

  - [x]* 6.3 Write property test for signal labeling
    - **Property 4: Signals are exhaustively and honestly labeled**
    - **Validates: Requirements 3.1, 3.2, 3.6**

  - [x]* 6.4 Write property test for reason phrasing
    - **Property 5: Reason phrasing matches provenance**
    - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 7. Fix Opportunity_Scorer (`src/lib/scoring/opportunityScore.ts`)
  - [x] 7.1 Remove flat booking bonus and enforce five-component weighted sum
    - Delete the additive `+5/+5` bonus; booking signals count only via the weighted booking
      component; integer clamp to `[0, 100]`; retain and document website/social floors
    - Add assertion that each category's five weights sum to `1.00 ± 0.001`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 7.2 Write property test for score composition
    - **Property 6: Opportunity score is the clamped weighted sum with no flat booking bonus**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x]* 7.3 Write property test for category weights
    - **Property 7: Category weights sum to one**
    - **Validates: Requirements 5.5**

  - [x]* 7.4 Write property test for score determinism
    - **Property 8: Opportunity score is deterministic**
    - **Validates: Requirements 5.6**

- [x] 8. Fix Closing_Probability_Estimator (`src/lib/scoring/closingProbability.ts`)
  - [x] 8.1 Redesign non-overlapping tiers and remove dead condition
    - Implement mutually-exclusive tier selection (Excellent 75–85, Good 55–74, Average 35–54,
      Weak 10–34); remove the dead `|| opportunityScore >= 20` clause; apply ±4 id variance
      before clamping to the selected tier
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x]* 8.2 Write property test for closing probability tiers
    - **Property 9: Closing probability falls in exactly one non-overlapping tier**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

  - [x]* 8.3 Write unit test for the removed dead clause
    - Scores in `[20, 34]` classify as Weak, not Average
    - _Requirements: 6.4_

- [x] 9. Fix Deal_Value_Engine (`src/lib/scoring/dealValue.ts`)
  - [x] 9.1 Produce min/max/midpoint range with country forwarding and provenance
    - Return `DealValueResult` with `min`, `max`, `representative = round((min+max)/2, 2)`,
      `formatted`, `provenance`; forward `country` to `formatCurrencyRange`;
      `unavailable` (nulls + '') when no valid range
    - _Requirements: 4.1, 4.2, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x]* 9.2 Write property test for valid deal value range
    - **Property 10: Deal value produces a valid, estimated range**
    - **Validates: Requirements 7.1, 7.3, 7.4**

  - [x]* 9.3 Write property test for midpoint stored value
    - **Property 11: Stored deal value is the midpoint below the maximum**
    - **Validates: Requirements 7.2**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement Audit_Generator (`src/lib/scoring/auditGenerator.ts`)
  - [x] 11.1 Generate presence-based, honestly-phrased audit messages
    - Create `generateAudit(scored)` replacing `generateMockAudit`; derive messages from
      component signal presence (not weight-scaled thresholds); social-only + no website emits
      no "outdated website detected" message; heuristic → assumption language; unavailable →
      no confirmed-detection message
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x]* 11.2 Write property test for audit message generation
    - **Property 14: Audit messages are presence-derived from the correct component and honestly phrased**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.6**

- [x] 12. Wire scoring facade and confidence (`src/lib/scoring/index.ts`)
  - [x] 12.1 Update `scoreBusinessOpportunity` signature and semantic mapping
    - Accept benchmark result, `country`, optional `inspection`; forward to sub-components;
      document legacy→semantic component mapping (website/reviews/seo/gbp/social)
    - _Requirements: 4.1, 8.1_

  - [x] 12.2 Compute bounded confidence with honest contributions
    - Integer `[0, 100]`; `unavailable` values contribute 0; reduce confidence by ≥20 when
      benchmark has `< 5` real competitors, floored at 0
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 12.4_

  - [x]* 12.3 Write property test for semantic score mapping
    - **Property 13: Backward-compatible scores map to their semantic components**
    - **Validates: Requirements 8.1**

  - [x]* 12.4 Write property test for confidence
    - **Property 18: Confidence is a bounded integer with honest contributions**
    - **Validates: Requirements 11.2, 11.5, 11.6, 12.4**

- [x] 13. Implement Cache_Manager helpers (`src/lib/cache/opportunityCache.ts`)
  - [x] 13.1 Persist and read keyed by `place_id` with label round-trip
    - Associate opportunities to businesses by `place_id`; store provenance/data_source/
      confidence; reject writes for businesses lacking a stable key (`missing_stable_key`);
      skip orphaned opportunities on read (`orphaned_skipped`); return stored labels unchanged
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x]* 13.2 Write property test for cache association round-trip
    - **Property 15: Cache association and honesty labels round-trip by place id**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.6, 9.7**

  - [x]* 13.3 Write unit tests for cache edge cases
    - Missing stable key rejected leaving prior cache unchanged (9.4); orphaned cached
      opportunity skipped on read (9.5)
    - _Requirements: 9.4, 9.5_

- [x] 14. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Rework Search_Engine path selection (`src/app/api/search/route.ts`)
  - [x] 15.1 Add API key usability check and remove silent demo fallback
    - Implement `isUsableKey` (reject empty, `'mock-key'`, placeholders); non-sandbox invalid
      key → `503 real_search_not_configured`; never fall back to `generateLeads` on live path
    - _Requirements: 10.1, 10.3, 10.6_

  - [x] 15.2 Implement live Places fetch with 10s timeout and honest errors/empty state
    - `AbortController` 10s timeout; provider error/timeout → `live_provider_unavailable` with
      no raw payload and no records; zero results → success empty set with `data_source:'live'`
      and `no_matches:true`; ensure no secrets/keys/stack traces leak
    - _Requirements: 10.2, 10.4, 12.1, 12.2, 12.5_

  - [x] 15.3 Wire sandbox path and country forwarding
    - Sandbox: `data_source:'sandbox'`, every record flagged non-real, non-real indicator
      present; forward `country` on both live and sandbox paths
    - _Requirements: 4.1, 4.6, 10.5, 10.7_

  - [x] 15.4 Integrate enricher, benchmark, scoring, and cache into the response
    - Normalize places to `Business` (real fields only, `place_id`); run `ContactEnricher`
      (per-business failure keeps business with `unavailable` labels); build benchmark once;
      score each business forwarding country; persist cache (non-sandbox) and set
      `data_source:'cache'` on cache reads; attach per-field provenance + confidence to every result
    - _Requirements: 1.8, 1.9, 2.7, 9.8, 11.1, 11.7, 12.3_

  - [x]* 15.5 Write property test for API key usability
    - **Property 16: API key usability classification**
    - **Validates: Requirements 10.3**

  - [x]* 15.6 Write property test for sandbox flagging
    - **Property 17: Sandbox results are fully flagged non-real**
    - **Validates: Requirements 10.5, 10.7**

  - [x]* 15.7 Write property test for error responses not leaking secrets
    - **Property 19: Error responses never leak secrets**
    - **Validates: Requirements 12.5**

  - [x]* 15.8 Write integration tests for route handler behavior (mocked fetch + Supabase)
    - Live returns only real place-id records (10.1, 10.6); provider failure omits payload,
      names provider, returns no records (10.2, 12.2); zero results stays `live` with
      `no_matches` (10.4, 12.1); enrichment failure keeps business with `unavailable` (12.3);
      cache hit sets `data_source:'cache'` (9.8)
    - _Requirements: 9.8, 10.1, 10.2, 10.4, 10.6, 12.1, 12.2, 12.3_

- [x] 16. Author Supabase migration
  - [x] 16.1 Add migration for place_id, deal range, provenance, confidence, data_source
    - Add columns/indexes/constraints per the design's migration plan (businesses.place_id +
      contact_provenance; opportunities place_id, deal_value_min/max, deal_value_provenance,
      confidence, data_source; nullable estimated_deal_value; range/confidence CHECKs)
    - _Requirements: 7.3, 9.1, 9.6, 11.2_

- [x] 17. Final checkpoint - Verify build and full test suite
  - Run `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test`; fix failures.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP.
- Each task references specific requirement sub-clauses for traceability.
- Checkpoints ensure incremental validation as pure components land before the route handler.
- Property tests use fast-check (`{ numRuns: 100 }` minimum) and are tagged with a comment:
  `// Feature: real-data-intelligence-engine, Property {number}: {property_text}`.
- Reference-model properties (6 and 15) reimplement the expected computation independently.
- Per `AGENTS.md`, re-check `node_modules/next/dist/docs/` before editing the route handler.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "4.2", "6.1", "7.1", "8.1", "9.1"] },
    { "id": 3, "tasks": ["3.4", "6.2", "6.3", "7.2", "7.3", "7.4", "8.2", "8.3", "9.2", "9.3"] },
    { "id": 4, "tasks": ["6.4", "11.1", "12.1", "13.1"] },
    { "id": 5, "tasks": ["11.2", "12.2", "12.3", "13.2", "13.3"] },
    { "id": 6, "tasks": ["12.4", "15.1", "15.2", "15.3", "16.1"] },
    { "id": 7, "tasks": ["15.4"] },
    { "id": 8, "tasks": ["15.5", "15.6", "15.7", "15.8"] }
  ]
}
```
