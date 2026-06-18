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

    const { 
      systemPrompt, 
      userPrompt, 
      fallbackData, 
      clientModel 
    } = await request.json();

    // 3. Increment usage tracking for pitches
    await incrementUsage(
      user.organization_id,
      user.subscription_tier,
      'pitches',
      1,
      user.is_mock
    );

    // 4. Resolve API Key & Model
    let apiKey = '';
    let resolvedModel = clientModel || 'deepseek/deepseek-chat';

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
      fallbackData,
      apiKey,
      resolvedModel
    );

    // 5. Increment usage tracking for tokens
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
