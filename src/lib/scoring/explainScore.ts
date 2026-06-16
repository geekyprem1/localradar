import { ScoredOpportunity } from '@/types/scoring';

/**
 * Explainability Engine
 *
 * Generates concise, human-readable explanation tags
 * for every scored component.
 */
export function generateExplanation(scored: ScoredOpportunity): string[] {
  const explanations: string[] = [];

  // Top-level summary
  if (scored.opportunityLevel === 'High') {
    explanations.push(`🔥 High Opportunity — Score ${scored.opportunityScore}/100`);
  } else if (scored.opportunityLevel === 'Medium') {
    explanations.push(`⚡ Medium Opportunity — Score ${scored.opportunityScore}/100`);
  } else {
    explanations.push(`✓ Low Opportunity — Score ${scored.opportunityScore}/100`);
  }

  // Closing probability context
  if (scored.closingProbability >= 70) {
    explanations.push(`🎯 ${scored.closingProbability}% closing probability — very likely to convert`);
  } else if (scored.closingProbability >= 40) {
    explanations.push(`📊 ${scored.closingProbability}% closing probability — moderate conversion chance`);
  }

  // Deal value
  explanations.push(`💰 Estimated deal: ${scored.dealValue.formatted}`);

  // Best service fit
  explanations.push(`🏷️ Best fit: ${scored.bestFit.agencyType} (${scored.bestFit.level})`);

  // Add all breakdown reasons
  scored.reasons.forEach(reason => {
    explanations.push(`✓ ${reason}`);
  });

  return explanations;
}

/**
 * Short vulnerability tags for table display
 */
export function getVulnerabilityTags(scored: ScoredOpportunity): string[] {
  const tags: string[] = [];
  const b = scored.breakdown;

  if (b.websiteOpportunity.score >= 20) tags.push('No Website');
  else if (b.websiteOpportunity.score >= 15) tags.push('Weak Website');
  
  if (b.reviewGap.score >= 15) tags.push('Review Gap');
  else if (b.reviewGap.score >= 10) tags.push('Low Reviews');
  
  if (b.gbpWeakness.score >= 10) tags.push('Weak GBP');
  
  if (b.revenueLeakage.score >= 8) tags.push('Revenue Leak');
  else if (b.revenueLeakage.score >= 5) tags.push('No Booking');
  
  if (scored.bestFit.score >= 50) tags.push(scored.bestFit.agencyType + ' Fit');

  if (tags.length === 0) tags.push('Moderate Signals');

  return tags;
}
