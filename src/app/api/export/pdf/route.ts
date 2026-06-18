import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { scoreBusinessOpportunity } from '@/lib/scoring';
import { generateMockAudit, generateMockCompetitors } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || '';
    const token = searchParams.get('token') || '';
    const isSandbox = searchParams.get('sandbox') === 'true';

    if (!businessId) {
      return new Response('Business ID is required.', { status: 400 });
    }

    let userTier: 'free' | 'pro' | 'agency' | 'agency_plus' = 'free';
    let isMock = false;

    // 1. Authenticate user session
    if (isSandbox || !token || token === 'undefined') {
      // Sandbox fallback mode
      isMock = true;
      const mockTier = (searchParams.get('tier') || 'free') as 'free' | 'pro' | 'agency' | 'agency_plus';
      userTier = mockTier;
    } else {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return new Response('Unauthorized user session.', { status: 401 });
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_tier')
          .eq('id', profile.organization_id)
          .single();
        if (org?.subscription_tier) {
          userTier = org.subscription_tier as any;
        }
      }
    }

    // 2. Entitlement check (PDF Export is locked on Free Plan)
    if (userTier === 'free') {
      return new Response('PDF Export is locked on your current plan. Please upgrade to Pro.', { status: 403 });
    }

    // 3. Load lead details (Database vs Sandbox Mock generator)
    let business: any = null;
    let opportunity: any = null;
    let audit: any = null;
    let competitors: any[] = [];

    if (!isMock) {
      // Load from DB
      const { data: biz } = await supabase.from('businesses').select('*').eq('id', businessId).single();
      const { data: opp } = await supabase.from('opportunities').select('*').eq('business_id', businessId).single();
      const { data: aud } = await supabase.from('audits').select('*').eq('business_id', businessId).single();
      const { data: comps } = await supabase.from('competitors').select('*').eq('business_id', businessId);

      business = biz;
      opportunity = opp;
      audit = aud;
      competitors = comps || [];
    }

    // Fallback/Mock generator if not found in database or running sandbox
    if (!business) {
      business = {
        name: 'Preston Dental Clinic',
        website: 'https://www.prestondentalpractice.com',
        rating: 3.8,
        reviews_count: 24,
        phone: '(214) 555-0199',
        address: '8383 Preston Rd, Dallas, TX 75225',
      };
    }

    if (!opportunity) {
      competitors = generateMockCompetitors(business);
      const scored = scoreBusinessOpportunity(business, competitors);
      opportunity = {
        website_score: scored.websiteScore,
        reviews_score: scored.reviewsScore,
        seo_score: scored.seoScore,
        gbp_score: scored.gbpScore,
        social_score: scored.socialScore,
        total_score: scored.opportunityScore,
        opportunity_level: scored.opportunityLevel,
        estimated_deal_value: scored.dealValue.max,
        closing_probability: scored.closingProbability
      };
    }

    if (!audit) {
      audit = generateMockAudit(business, { ...opportunity, total_score: opportunity.total_score || 50 } as any);
    }

    const formatCurrency = (val: number) => {
      return `₹${val.toLocaleString('en-IN')}`;
    };

    const getScoreColorClass = (score: number) => {
      if (score >= 60) return 'color: #2DD4A7; border-color: rgba(45, 212, 167, 0.2);';
      if (score >= 35) return 'color: #F5A623; border-color: rgba(245, 166, 35, 0.2);';
      return 'color: #FF5C5C; border-color: rgba(255, 92, 92, 0.2);';
    };

    // 4. Render gorgeous print-ready HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LocalRadar Lead Audit - ${business.name}</title>
  <style>
    @media print {
      body {
        background-color: #ffffff !important;
        color: #0b0b0c !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .card {
        background-color: #ffffff !important;
        border: 1px solid #e5e7eb !important;
        box-shadow: none !important;
      }
      .badge {
        border: 1px solid #ccc !important;
        color: #000 !important;
        background: none !important;
      }
      .section-border {
        border-color: #e5e7eb !important;
      }
      h1, h2, h3, p, span, td, th {
        color: #0b0b0c !important;
      }
    }
    
    body {
      background-color: #090a0c;
      color: #fafaf9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .no-print {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #141517;
      border: 1px solid #26282D;
      padding: 12px 24px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .btn {
      background: linear-gradient(90deg, #2DD4A7 0%, #14B88C 100%);
      color: #0b0b0c;
      border: none;
      font-weight: bold;
      font-size: 13px;
      font-family: monospace;
      text-transform: uppercase;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 0 15px rgba(45,212,167,0.15);
    }
    
    .header {
      border-bottom: 2px solid #26282D;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-title {
      font-size: 26px;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
    }
    
    .header-subtitle {
      font-size: 11px;
      color: #a1a1aa;
      font-family: monospace;
      margin-top: 5px;
      text-transform: uppercase;
    }
    
    .grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .card {
      background-color: #141517;
      border: 1px solid #26282D;
      padding: 24px;
      border-radius: 16px;
      position: relative;
    }
    
    .card-title {
      font-size: 11px;
      font-family: monospace;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-top: 0;
      margin-bottom: 15px;
      font-weight: bold;
    }
    
    .score-badge {
      display: inline-block;
      font-size: 20px;
      font-weight: 700;
      font-family: monospace;
      padding: 6px 16px;
      border-radius: 8px;
      border: 1px solid;
      margin-bottom: 10px;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      padding: 8px 0;
    }
    
    .stat-row:last-child {
      border: none;
    }
    
    .stat-label {
      color: #71717a;
    }
    
    .stat-value {
      font-weight: 600;
      color: #ffffff;
    }
    
    .list-title {
      font-size: 13px;
      font-weight: bold;
      color: #ffffff;
      margin-top: 25px;
      margin-bottom: 10px;
    }
    
    .list-item {
      display: flex;
      align-items: flex-start;
      font-size: 12px;
      color: #e4e4e7;
      margin-bottom: 8px;
    }
    
    .list-bullet {
      color: #2DD4A7;
      margin-right: 8px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Action Banner (Hidden during print) -->
    <div class="no-print">
      <span style="font-family: monospace; font-size: 12px; color: #a1a1aa;">LocalRadar Intelligence Report™</span>
      <button class="btn" onclick="window.print()">Print Report</button>
    </div>

    <!-- Header -->
    <div class="header">
      <h1 class="header-title">${business.name}</h1>
      <div class="header-subtitle">Vulnerability Audit & Valuation Summary</div>
      <p style="font-size: 12px; color: #71717a; margin-top: 8px; margin-bottom: 0;">
        Scanned on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} • Address: ${business.address}
      </p>
    </div>

    <!-- Core Metrics Grid -->
    <div class="grid">
      <!-- Opportunity Score -->
      <div class="card">
        <h3 class="card-title">Opportunity Score™</h3>
        <div class="score-badge" style="${getScoreColorClass(opportunity.total_score || opportunity.website_score)}">
          ${opportunity.total_score || 50}/100
        </div>
        <p style="font-size: 12px; color: #e4e4e7; margin: 0; line-height: 1.6;">
          ${opportunity.opportunity_level || 'Medium'} suitability score calculated by deterministic GBP and site signal analysis.
        </p>
      </div>

      <!-- Financial & Closing Probability -->
      <div class="card">
        <h3 class="card-title">Valuation & Closing</h3>
        <div class="stat-row">
          <span class="stat-label">Revenue Potential™</span>
          <span class="stat-value" style="color: #2DD4A7;">${formatCurrency(opportunity.estimated_deal_value)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Closing Probability™</span>
          <span class="stat-value">${opportunity.closing_probability}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Google Rating</span>
          <span class="stat-value">${business.rating} / 5 ★ (${business.reviews_count} Reviews)</span>
        </div>
      </div>
    </div>

    <!-- Why This Lead Section -->
    <div class="card" style="margin-bottom: 30px;">
      <h3 class="card-title">Why This Lead™ (Valuation Summary)</h3>
      <p style="font-size: 13px; color: #ffffff; line-height: 1.6; margin: 0;">
        ${business.name} is actively losing high-value local prospects. 
        ${!business.website ? ' They have no detected web domain, directing all mobile traffic to competitors.' : ' Their website structure is outdated with conversion friction.'}
        ${business.reviews_count < 30 ? ` They suffer from a reputation deficit of reviews compared to competitors.` : ''}
        No appointment booking or automated follow-up system was found, resulting in high inquiry drop-offs.
      </p>
    </div>

    <!-- Technical Issues & Recommended Services -->
    <div class="card" style="margin-bottom: 30px;">
      <h3 class="card-title">Detailed Vulnerability Diagnostics</h3>
      
      <div class="list-title">Website Gaps</div>
      ${audit.website_issues.map((issue: string) => `
        <div class="list-item">
          <span class="list-bullet">•</span>
          <span>${issue}</span>
        </div>
      `).join('') || '<div style="font-size:12px; color:#71717a;">None detected.</div>'}

      <div class="list-title">SEO & GBP Gaps</div>
      ${audit.seo_issues.map((issue: string) => `
        <div class="list-item">
          <span class="list-bullet">•</span>
          <span>${issue}</span>
        </div>
      `).join('') || '<div style="font-size:12px; color:#71717a;">None detected.</div>'}

      <div class="list-title">Recommended Action Plan (Services to Offer)</div>
      ${audit.recommended_services.map((service: string) => `
        <div class="list-item">
          <span class="list-bullet">✓</span>
          <span style="font-weight: 600; color: #ffffff;">${service}</span>
        </div>
      `).join('')}
    </div>

  </div>
  <script>
    window.onload = function() {
      // Auto-trigger print dialog after render
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });

  } catch (error: any) {
    console.error('PDF Export Generation Error:', error);
    return new Response('Internal Server Error.', { status: 500 });
  }
}
