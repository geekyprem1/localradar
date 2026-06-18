import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/openai';
import { getServerUser, validateUsageAndEntitlement, incrementUsage } from '@/lib/entitlements';
import { decrypt } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized.' 
      }, { status: 401 });
    }

    // 1. IP Rate Limiting (max 100 requests per 15 minutes)
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip, 100);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        success: false, 
        message: 'Too many requests. Please try again in 15 minutes.' 
      }, { status: 429 });
    }

    // 2. Enforce Subscription Limits & Entitlement Gates
    const check = await validateUsageAndEntitlement(
      user.organization_id,
      user.subscription_tier,
      'pitch',
      user.is_mock
    );

    if (!check.allowed) {
      return NextResponse.json({
        success: false,
        reason: check.reason,
        message: 'This feature is locked on your current plan. Please upgrade to Pro.'
      }, { status: 403 });
    }

    const { businessId, pitchType } = await request.json();
    if (!businessId || !pitchType) {
      return NextResponse.json({ success: false, message: 'businessId and pitchType are required.' }, { status: 400 });
    }

    if (!['firstEmail', 'followup', 'linkedin', 'whatsapp'].includes(pitchType)) {
      return NextResponse.json({ success: false, message: 'Invalid pitchType.' }, { status: 400 });
    }

    // 3. Load Business Details (DB or Sandbox Mock fallback)
    let bizName = 'Preston Dental Clinic';
    let bizWebsite = 'https://www.prestondentalpractice.com';
    let bizRating = 3.9;
    let bizReviews = 34;
    let bizPhone = '(214) 555-0199';
    let bizAddress = '8383 Preston Rd, Dallas, TX 75225';

    if (!user.is_mock) {
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (bizErr || !biz) {
        return NextResponse.json({ success: false, message: 'Business not found.' }, { status: 404 });
      }

      bizName = biz.name;
      bizWebsite = biz.website || 'None';
      bizRating = Number(biz.rating || 0);
      bizReviews = biz.reviews_count || 0;
      bizPhone = biz.phone || 'None';
      bizAddress = biz.address || 'None';
    }

    // 4. Construct Prompts Securely on Server
    let systemPrompt = '';
    const userPrompt = `Generate pitch for ${bizName}`;
    let jsonKey = 'subject';
    let mockValue = { subject: 'Improve Preston Dental Clinic Conversion', body: 'Cold Email body' };

    if (pitchType === 'firstEmail') {
      jsonKey = 'subject';
      mockValue = { subject: `Improve ${bizName} Conversion`, body: `Hi team at ${bizName}, I saw your website and wanted to reach out...` };
      systemPrompt = `You are a SaaS Growth Copywriter. Generate a highly personalized First Cold Email sequence hook.
      Target Business: ${bizName}
      Website: ${bizWebsite}
      Rating: ${bizRating} (${bizReviews} reviews)
      Phone: ${bizPhone}
      Address: ${bizAddress}
      Focus on: Website design issues, reputation improvement, and online booking systems.
      Keep it brief, conversational, and direct. Output ONLY valid JSON in format:
      {
        "subject": "Subject line",
        "body": "Email body content"
      }`;
    } else if (pitchType === 'followup') {
      jsonKey = 'subject';
      mockValue = { subject: `Mock follow up for ${bizName}`, body: `Just checking in to see if you read my previous email...` };
      systemPrompt = `You are a SaaS Copywriter. Generate a value-driven follow-up cold email.
      Target Business: ${bizName}
      Provide value (e.g., offering a free mockup or audit details). Focus on scheduling a 10-minute call.
      Output ONLY valid JSON in format:
      {
        "subject": "Subject line",
        "body": "Follow-up email body content"
      }`;
    } else if (pitchType === 'linkedin') {
      jsonKey = 'body';
      mockValue = { body: `Hi, I noticed ${bizName} has some quick wins for local search rankings...` } as any;
      systemPrompt = `You are a SaaS Copywriter. Generate a brief, non-salesy LinkedIn DM sequence starting with their business type.
      Target Business: ${bizName}
      Keep it under 100 words. Focus on establishing a connection.
      Output ONLY valid JSON in format:
      {
        "body": "LinkedIn message content"
      }`;
    } else if (pitchType === 'whatsapp') {
      jsonKey = 'body';
      mockValue = { body: `Quick check for ${bizName}...` } as any;
      systemPrompt = `You are a Copywriter. Generate a high-converting, extremely short WhatsApp check-in query (under 50 words).
      Target Business: ${bizName}
      Output ONLY valid JSON in format:
      {
        "body": "WhatsApp message content"
      }`;
    }

    // 5. Increment usage tracking for pitches
    await incrementUsage(
      user.organization_id,
      user.subscription_tier,
      'pitches',
      1,
      user.is_mock
    );

    // 6. Resolve API Key & Model (Force model to deepseek-chat)
    let apiKey = '';
    const resolvedModel = 'deepseek/deepseek-chat';

    if (user.subscription_tier === 'agency' && !user.is_mock) {
      const { data: creds } = await supabase
        .from('byok_credentials')
        .select('*')
        .eq('organization_id', user.organization_id)
        .single();

      if (creds?.byok_enabled && creds?.encrypted_openrouter_key) {
        apiKey = decrypt(creds.encrypted_openrouter_key);
      }
    }

    if (!apiKey) {
      apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
    }

    const response = await generateAICompletion(
      systemPrompt,
      userPrompt,
      { [jsonKey]: mockValue[jsonKey as keyof typeof mockValue] },
      apiKey,
      resolvedModel
    );

    // 7. Increment usage tracking for tokens
    await incrementUsage(
      user.organization_id,
      user.subscription_tier,
      'tokens',
      600,
      user.is_mock
    );

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error: any) {
    console.error('Error in generate-pitch API:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Error executing AI generation'
    }, { status: 500 });
  }
}
