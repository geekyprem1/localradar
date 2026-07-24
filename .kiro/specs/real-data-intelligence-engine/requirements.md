# Requirements Document

## Introduction

LocalRadar is a local-business lead intelligence tool for agencies, built on Next.js and Supabase. It searches Google Places for businesses in a given niche, city, and country, then runs a proprietary scoring engine to rank lead opportunities, estimate deal values, and recommend services.

A code audit found that the current intelligence pipeline mixes real data with fabricated data and contains several calculation defects. Fabricated contact emails, mock competitors, and heuristic "detected" signals are presented to users as if they were real facts. A silent demo/mock fallback can return entirely fake results without the user knowing. Several scoring modules contain bugs (dropped country/currency, double-counted booking signals, contradictory closing-probability tiers, inflated deal values, incorrect score-to-audit mapping) and cache persistence can mismatch records for same-named businesses.

The Real Data Intelligence Engine feature makes the engine return the best, fully real and accurate results. Every value shown to a user MUST either be sourced from real data, or be explicitly labeled with its provenance and confidence (e.g., "estimated", "heuristic", "not available"). Fabricated data presented as fact MUST be eliminated. Where real data genuinely cannot be produced (for example, a deployment with no Google Places API key), the system MUST return a clear error or empty state rather than silently substituting fabricated demo results.

This document defines the requirements for that feature. Design and implementation decisions (crawling strategy, enrichment providers, storage schema changes) are addressed in the design phase.

## Glossary

- **Search_Engine**: The server-side search API (`src/app/api/search/route.ts`) that authenticates the user, enforces limits, calls Google Places, invokes scoring, persists cache, and returns results.
- **Places_Provider**: The Google Places Text Search v1 external API used to fetch real business data.
- **Scoring_Engine**: The scoring library (`src/lib/scoring/`) that produces a `ScoredOpportunity` from a business and its competitors.
- **Signal_Extractor**: The `extractSignals` function that derives `BusinessSignals` from a business and competitors.
- **Opportunity_Scorer**: The `calculateOpportunityScore` function that produces the 0–100 opportunity score.
- **Closing_Probability_Estimator**: The `calculateClosingProbability` function that produces the closing probability percentage.
- **Deal_Value_Engine**: The `calculateDealValue` function that produces the estimated deal value range and services.
- **Service_Fit_Calculator**: The `calculateServiceFit` function that ranks agency service fit.
- **Audit_Generator**: The audit-building logic (currently `generateMockAudit`) that produces per-category issue and recommendation text.
- **Competitor_Benchmark_Service**: The component responsible for producing competitor review/rating/website benchmarks for a niche and city.
- **Contact_Enricher**: The component responsible for producing contact fields (emails, contact page) for a business.
- **Currency_Formatter**: The currency helper (`src/lib/currency.ts`) that formats amounts by country.
- **Cache_Manager**: The Supabase persistence and cache-read logic within Search_Engine that stores and retrieves searches, businesses, and opportunities.
- **Provenance_Label**: A machine- and human-readable indicator attached to a data field describing its origin. Allowed values: `real`, `estimated`, `heuristic`, `unavailable`.
- **Data_Source**: A field on a search result indicating whether the result set came from real provider data. Allowed values: `live`, `cache`, `sandbox`.
- **Confidence_Value**: A 0–100 integer indicating how reliable a produced value is.
- **Sandbox_Mode**: An explicitly labeled, non-real demonstration mode used only for sandbox/mock sessions, never returned to real users as real data.
- **Real_Value**: A value obtained directly from Places_Provider or another verified external source.
- **Business_Record**: A stored `Business` row and its in-memory `Business` representation.
- **Opportunity_Record**: A stored `Opportunity` row and its in-memory `Opportunity` representation.

## Requirements

### Requirement 1: Eliminate fabricated contact emails

**User Story:** As an agency user, I want contact emails to be real or clearly marked as unavailable, so that I do not send outreach to guessed addresses that bounce or damage my sender reputation.

#### Acceptance Criteria

1. THE Contact_Enricher SHALL NOT generate contact email values by pattern-guessing from a domain or business name (for example `info@{domain}`, `owner@{domain}`, `{name}@gmail.com`, or `contact.{name}@gmail.com`).
2. THE Contact_Enricher SHALL assign to every contact email field exactly one Provenance_Label drawn from the set {`real`, `estimated`, `unavailable`}.
3. WHERE a contact email is retrieved and confirmed from an external source, THE Contact_Enricher SHALL populate the contact email field with the retrieved value and attach a Provenance_Label of `real`.
4. WHERE a contact email is located on a source associated with the business but its association is not confirmed, THE Contact_Enricher SHALL populate the contact email field with the located value and attach a Provenance_Label of `estimated`.
5. WHERE a contact email cannot be retrieved from any external source, THE Contact_Enricher SHALL set the contact email field to empty and attach a Provenance_Label of `unavailable`.
6. WHERE a business has no website, THE Contact_Enricher SHALL set the contact email field to empty and attach a Provenance_Label of `unavailable`.
7. IF an external source lookup fails or does not return a result within 10 seconds, THEN THE Contact_Enricher SHALL set the contact email field to empty, attach a Provenance_Label of `unavailable`, and preserve any previously stored field values without overwriting them with a guessed value.
8. WHEN the Search_Engine returns a contact field, THE Search_Engine SHALL return that field together with its Provenance_Label of `real`, `estimated`, or `unavailable`.
9. IF a contact field carries a Provenance_Label of `unavailable`, THEN THE Search_Engine SHALL represent that field to the client as unavailable and SHALL NOT present it as a usable address.

### Requirement 2: Real competitor benchmarking

**User Story:** As an agency user, I want the review-gap benchmark to reflect actual local competitors, so that the opportunity score is based on the real market rather than fixed fake numbers.

#### Acceptance Criteria

1. THE Competitor_Benchmark_Service SHALL derive competitor benchmarks only from real Places_Provider results whose niche and city match the searched business's niche and city.
2. THE Competitor_Benchmark_Service SHALL NOT return competitor records with hardcoded or fixed ratings or fixed review counts under any condition.
3. WHEN at least the minimum required count of 3 real competitors is available for the searched niche and city, THE Competitor_Benchmark_Service SHALL compute the competitor average review count (rounded to the nearest whole number) and the competitor average rating (rounded to one decimal place, on a 0.0 to 5.0 scale) from those real competitors and attach a Provenance_Label of `real`.
4. THE Competitor_Benchmark_Service SHALL exclude the business being scored from its own competitor benchmark set by matching on the Places_Provider place identifier.
5. IF at least 1 but fewer than 3 real competitors are available for the searched niche and city, THEN THE Competitor_Benchmark_Service SHALL compute the benchmark from the available real competitors, attach a Provenance_Label of `estimated`, and record the competitor sample size used.
6. IF zero real competitors are available for the searched niche and city, THEN THE Competitor_Benchmark_Service SHALL return no competitor benchmark, attach a Provenance_Label of `estimated` with a recorded competitor sample size of 0, and SHALL NOT substitute hardcoded competitor values.
7. THE Search_Engine SHALL supply the real competitor set for the searched niche and city to the Scoring_Engine so that the review-gap component uses the real benchmarks.

### Requirement 3: Honest signal detection and labeling

**User Story:** As an agency user, I want signal statements to accurately describe what was verified versus what was assumed, so that I can trust the audit and pitch content I send to prospects.

#### Acceptance Criteria

1. THE Signal_Extractor SHALL assign every emitted signal exactly one Provenance_Label from the set {`real`, `heuristic`, `unavailable`}.
2. WHERE a booking system, lead form, WhatsApp integration, appointment system, or website-age/outdatedness signal has been inferred from the presence or absence of a website and phone number in the business record rather than from inspecting the business website, THE Signal_Extractor SHALL assign that signal a Provenance_Label of `heuristic`.
3. WHERE a signal carries a Provenance_Label of `heuristic`, THE Scoring_Engine SHALL phrase the associated reason text using assumption-indicating language (for example "likely", "may", "possibly", or "not verified") and SHALL NOT include confirmation terms such as "detected", "confirmed", "verified", or "found".
4. WHERE a signal carries a Provenance_Label of `heuristic` for the website-age or outdatedness of a business, THE Scoring_Engine SHALL phrase the reason as an unverified assumption and SHALL NOT state that an outdated website was "detected".
5. WHEN a business website is successfully inspected and confirms a booking system, lead form, chat integration, or appointment system, THE Signal_Extractor SHALL assign the corresponding signal a Provenance_Label of `real` and THE Scoring_Engine SHALL phrase the reason as a confirmed detection using confirmation language (for example "detected" or "confirmed").
6. THE Signal_Extractor SHALL derive the Instagram-only and Facebook-only signals only from actual website URL values present in the business record.
7. IF a signal cannot be derived from available data, THEN THE Signal_Extractor SHALL assign that signal a Provenance_Label of `unavailable` and SHALL exclude it from producing confirmed-detection reason text.

### Requirement 4: Multi-currency deal values

**User Story:** As an agency user operating outside the United States, I want deal values shown in my country's currency, so that estimates are meaningful for my market.

#### Acceptance Criteria

1. WHEN the Search_Engine invokes the Scoring_Engine, THE Search_Engine SHALL forward the same country used for the Places_Provider search to the Scoring_Engine, and that country SHALL reach the Deal_Value_Engine.
2. WHEN the Deal_Value_Engine formats a deal value range, THE Deal_Value_Engine SHALL format both the minimum and the maximum of the range using the currency resolved for the forwarded country, without converting the underlying numeric amounts between currencies.
3. WHERE the forwarded country matches one of the supported countries (United States, India, Canada, United Kingdom, Australia) by case-insensitive comparison, THE Currency_Formatter SHALL format amounts using that country's currency code, locale, and symbol.
4. IF the forwarded country is empty, null, or does not match a supported country, THEN THE Currency_Formatter SHALL format amounts using the United States currency as the documented default.
5. THE Currency_Formatter SHALL NOT perform foreign-exchange conversion of amounts; it SHALL only reformat the given numeric amounts with the resolved currency's code, locale, and symbol.
6. THE Search_Engine SHALL forward the searched country to the Scoring_Engine on both the live search path and any labeled Sandbox_Mode path.

### Requirement 5: Correct opportunity score calculation

**User Story:** As an agency user, I want the opportunity score to count each factor once, so that scores are accurate and comparable across leads.

#### Acceptance Criteria

1. THE Opportunity_Scorer SHALL include each booking-related signal (`noBookingSystem`, `noLeadForm`, `noWhatsApp`, `noAppointment`) in the final opportunity score exactly once, solely through its contribution to the weighted booking component.
2. THE Opportunity_Scorer SHALL NOT apply any additive flat bonus or adjustment for `noBookingSystem`, `noLeadForm`, or any other booking-related signal outside the weighted sum of category components.
3. THE Opportunity_Scorer SHALL compute the pre-clamp score as the sum of exactly five weighted components (website, review gap, Google presence, booking, activity), with no component contributing more than once.
4. THE Opportunity_Scorer SHALL produce a final integer opportunity score in the inclusive range 0 to 100, clamping any computed value below 0 to 0 and any value above 100 to 100.
5. THE Opportunity_Scorer SHALL apply category weights whose sum equals 1.00 within a tolerance of ±0.001 for every supported category.
6. WHEN two businesses have identical input signals and identical normalized category, THE Opportunity_Scorer SHALL produce identical opportunity scores.

### Requirement 6: Correct closing probability tiers

**User Story:** As an agency user, I want closing probability to match its documented tier ranges, so that a "Weak" lead is not silently reported as "Average".

#### Acceptance Criteria

1. THE Closing_Probability_Estimator SHALL classify each opportunity score into exactly one of four tiers (Excellent, Good, Average, or Weak) and SHALL produce a final probability that falls within that tier's documented probability range.
2. WHERE a business is classified in the Weak tier, THE Closing_Probability_Estimator SHALL produce a final probability within the inclusive range 10 to 34 and SHALL NOT clamp, raise, or otherwise adjust that probability into the Average range (35 to 54) or any higher tier.
3. THE Closing_Probability_Estimator SHALL apply the following non-overlapping inclusive probability bounds so that any produced probability belongs to exactly one tier: Excellent 75 to 85, Good 55 to 74, Average 35 to 54, and Weak 10 to 34.
4. THE Closing_Probability_Estimator SHALL NOT contain tier-selection conditions that can never independently change the selected tier (dead or redundant conditions, such as an additional score threshold whose true cases are already fully covered by a preceding branch or by another clause within the same condition).
5. THE Closing_Probability_Estimator SHALL produce a probability in the inclusive range 0 to 100.

### Requirement 7: Honest deal value representation

**User Story:** As an agency user, I want the stored estimated deal value to represent a realistic figure rather than the top of the range, so that pipeline totals are not inflated.

#### Acceptance Criteria

1. WHEN the Deal_Value_Engine computes a deal value for an Opportunity_Record, THE Deal_Value_Engine SHALL produce a minimum and a maximum deal value, each greater than or equal to 0.01 and less than or equal to 999,999,999.99, where the minimum is less than or equal to the maximum.
2. WHEN the Search_Engine stores a single estimated deal value on an Opportunity_Record, THE Search_Engine SHALL store the arithmetic midpoint of the produced minimum and maximum rounded to two decimal places, which SHALL be strictly less than the maximum whenever the minimum is less than the maximum.
3. WHEN the Search_Engine returns an Opportunity_Record to the client, THE Search_Engine SHALL include both the minimum and the maximum deal value of the produced range in the response so that a range can be displayed rather than only a single value.
4. WHEN the Deal_Value_Engine produces a deal value output, THE Deal_Value_Engine SHALL attach a Provenance_Label of `estimated` to that output.
5. IF the Deal_Value_Engine cannot produce a valid range where the minimum is less than or equal to the maximum, THEN THE Search_Engine SHALL omit the estimated deal value from the Opportunity_Record and attach a Provenance_Label of `unavailable`, retaining the remaining Opportunity_Record data unchanged.

### Requirement 8: Correct score mapping and audit generation

**User Story:** As an agency user, I want audit messages to match the business's actual weaknesses, so that a social-media-only business is not labeled with an unrelated issue such as "outdated website".

#### Acceptance Criteria

1. THE Scoring_Engine SHALL map each backward-compatible component score to the semantically matching opportunity component: website score to the Website Opportunity component, reviews score to the Review Gap component, SEO score to the Google Business Weakness component, GBP score to the Revenue Leakage component, and social score to the Growth Intent component.
2. THE Audit_Generator SHALL derive each audit message exclusively from the opportunity component that semantically corresponds to that message category.
3. WHEN a business has no detected website and at least one social-media-only presence, THE Audit_Generator SHALL NOT produce any website-category audit message stating that an outdated or slow website was detected.
4. THE Audit_Generator SHALL derive audit messages from the presence or absence of component signals rather than from fixed numeric thresholds applied to weight-scaled scores.
5. WHEN the Signal_Extractor labels a signal as `heuristic`, THE Audit_Generator SHALL phrase the corresponding audit message as an assumption rather than a confirmed detection.
6. WHEN the Signal_Extractor labels a signal as `unavailable`, THE Audit_Generator SHALL NOT produce a confirmed-detection audit message derived from that signal.

### Requirement 9: Cache integrity

**User Story:** As an agency user, I want cached results to match the correct business, so that opportunities are never attached to the wrong same-named business (for example, chain locations).

#### Acceptance Criteria

1. WHEN the Cache_Manager persists opportunities, THE Cache_Manager SHALL associate each Opportunity_Record with its Business_Record using the Business_Record's stable unique key, defined as a persistent identifier that remains constant for that business across searches and sessions, rather than the business name.
2. IF two or more Business_Records in one search share the same name, THEN THE Cache_Manager SHALL associate each Opportunity_Record only with the Business_Record whose stable unique key matches, with zero Opportunity_Records associated to a Business_Record other than the one that produced them.
3. WHEN the Cache_Manager reads cached results, THE Cache_Manager SHALL reconstruct each business-to-opportunity association by matching the stored stable unique key to the Business_Record's stable unique key, producing associations identical to those present at persist time.
4. IF a Business_Record has no stable unique key at persist time, THEN THE Cache_Manager SHALL reject that Business_Record's opportunities from the cache write and surface an error indicating a missing stable unique key, leaving previously cached results unchanged.
5. IF, when reading cached results, a cached Opportunity_Record's stored stable unique key does not match any known Business_Record, THEN THE Cache_Manager SHALL exclude that Opportunity_Record from the returned associations and record an indication that an orphaned cached record was skipped.
6. WHEN the Cache_Manager persists opportunities, THE Cache_Manager SHALL store the Provenance_Label and Data_Source values for each cached result.
7. WHEN the Cache_Manager reads cached results, THE Cache_Manager SHALL return the same Provenance_Label and Data_Source values that were stored at persist time, so that cached values retain their honesty labels.
8. WHEN a cached result set is returned, THE Search_Engine SHALL set the result Data_Source to `cache`.

### Requirement 10: Remove silent demo/mock fallback

**User Story:** As an agency user, I want to never receive fabricated demo data disguised as real results, so that every lead I act on reflects a real business.

#### Acceptance Criteria

1. THE Search_Engine SHALL NOT return fabricated demo or mock business results within any result set whose Data_Source is `live`.
2. IF the Places_Provider returns an error, or does not respond within 10 seconds, THEN THE Search_Engine SHALL return an error response indicating that live results could not be retrieved, SHALL NOT substitute fabricated demo results, and SHALL return no lead records.
3. IF a non-sandbox request is received while no Google Places API key is configured, or the configured key is a placeholder or otherwise invalid value, THEN THE Search_Engine SHALL return an error response indicating that real search is not configured, and SHALL NOT return fabricated demo results.
4. WHEN the Places_Provider returns zero matching businesses for a non-sandbox request, THE Search_Engine SHALL return an empty result set with Data_Source set to `live`, and SHALL NOT substitute fabricated demo results.
5. WHERE the session is an explicit sandbox session, THE Search_Engine SHALL set the result Data_Source to `sandbox` and SHALL flag every returned record as non-real.
6. THE Search_Engine SHALL NOT set the Data_Source to `live` for any result set that contains one or more fabricated records.
7. WHEN the Search_Engine returns a result set with Data_Source `sandbox`, THE Search_Engine SHALL include a non-real-data indicator that the client can use to visibly warn the user that the data is not real.

### Requirement 11: Data provenance and confidence labeling

**User Story:** As an agency user, I want each result to disclose where its data came from and how confident the system is, so that I can judge which leads to trust.

#### Acceptance Criteria

1. WHEN the Search_Engine returns a result set, THE Search_Engine SHALL attach exactly one Data_Source value from the set {`live`, `cache`, `sandbox`} to that result set.
2. WHEN the Scoring_Engine scores an opportunity, THE Scoring_Engine SHALL attach a Confidence_Value expressed as an integer in the inclusive range 0 to 100 to that opportunity.
3. WHERE a produced value is a Real_Value, THE Scoring_Engine SHALL attach the Provenance_Label `real` to that value.
4. WHERE a produced value is not a Real_Value, THE Scoring_Engine SHALL attach exactly one Provenance_Label from the set {`estimated`, `heuristic`, `unavailable`} to that value.
5. IF a value cannot be produced because its underlying data source returns no data or fails, THEN THE Scoring_Engine SHALL attach the Provenance_Label `unavailable` to that value and SHALL set the value's contribution to the Confidence_Value to 0.
6. WHEN the competitor benchmark is based on fewer than 5 real competitors, THE Scoring_Engine SHALL reduce the Confidence_Value by at least 20 points relative to the Confidence_Value the same opportunity would receive from a benchmark of 5 or more real competitors, without allowing the Confidence_Value to fall below 0.
7. WHEN the Search_Engine returns a result set, THE Search_Engine SHALL include the Data_Source, each value's Provenance_Label, and the Confidence_Value in the returned response for every result.

### Requirement 12: Error and empty-state handling

**User Story:** As an agency user, I want clear errors and empty states when real data is unavailable, so that I understand what happened instead of seeing fake or blank results.

#### Acceptance Criteria

1. WHEN a live search completes and zero real businesses match the query, THE Search_Engine SHALL return a success response containing an empty result set together with a distinct "no matching businesses found" indicator that is distinguishable from any error response.
2. IF the Places_Provider request fails, including an error response, no response within a defined request timeout of 10 seconds, or provider unavailability, THEN THE Search_Engine SHALL return an error response that identifies the live data provider as the source of the failure and SHALL NOT include the provider's raw error payload.
3. IF contact enrichment fails for a business, THEN THE Search_Engine SHALL still include that business in the result set with each affected contact field labeled `unavailable`, and SHALL NOT cause the overall search to fail.
4. IF competitor benchmarking fails for a niche and city, THEN THE Scoring_Engine SHALL complete scoring using a benchmark labeled `estimated`, assign a Confidence_Value strictly lower than the value it would assign using an actual benchmark, and attach a reduced-confidence indicator to the result rather than aborting scoring.
5. THE Search_Engine SHALL NOT include internal secrets, API keys, credentials, or raw stack traces in any error response, indicator, or field label returned to the client.
