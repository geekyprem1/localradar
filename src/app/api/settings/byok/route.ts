import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/entitlements';
import { encrypt } from '@/lib/encryption';
import { supabase } from '@/lib/supabase';

// In-memory BYOK store for mock organizations in Sandbox Mode
const sandboxBYOKStore = new Map<string, {
  byok_enabled: boolean;
  has_google: boolean;
  has_openrouter: boolean;
  has_supabase_url: boolean;
  has_supabase_anon: boolean;
}>();

export async function GET(request: Request) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (user.is_mock) {
      const mockCreds = sandboxBYOKStore.get(user.organization_id) || {
        byok_enabled: false,
        has_google: false,
        has_openrouter: false,
        has_supabase_url: false,
        has_supabase_anon: false,
      };
      return NextResponse.json({
        success: true,
        byok_enabled: mockCreds.byok_enabled,
        has_google_places_key: mockCreds.has_google,
        has_openrouter_key: mockCreds.has_openrouter,
        has_supabase_url: mockCreds.has_supabase_url,
        has_supabase_anon: mockCreds.has_supabase_anon,
      });
    }

    // Fetch from Supabase
    const { data: creds, error } = await supabase
      .from('byok_credentials')
      .select('*')
      .eq('organization_id', user.organization_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      byok_enabled: creds?.byok_enabled || false,
      has_google_places_key: !!creds?.encrypted_google_places_key,
      has_openrouter_key: !!creds?.encrypted_openrouter_key,
      has_supabase_url: !!creds?.encrypted_supabase_url,
      has_supabase_anon: !!creds?.encrypted_supabase_anon,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (user.subscription_tier !== 'agency_plus') {
      return NextResponse.json({ success: false, message: 'Only Agency Plus users can configure BYOK credentials.' }, { status: 403 });
    }

    const {
      byok_enabled,
      google_places_key,
      openrouter_key,
      supabase_url,
      supabase_anon
    } = await request.json();

    if (user.is_mock) {
      const prev = sandboxBYOKStore.get(user.organization_id) || {
        byok_enabled: false,
        has_google: false,
        has_openrouter: false,
        has_supabase_url: false,
        has_supabase_anon: false,
      };

      const updated = {
        byok_enabled: !!byok_enabled,
        has_google: google_places_key === '••••••••' ? prev.has_google : !!google_places_key,
        has_openrouter: openrouter_key === '••••••••' ? prev.has_openrouter : !!openrouter_key,
        has_supabase_url: supabase_url === '••••••••' ? prev.has_supabase_url : !!supabase_url,
        has_supabase_anon: supabase_anon === '••••••••' ? prev.has_supabase_anon : !!supabase_anon,
      };

      sandboxBYOKStore.set(user.organization_id, updated);
      return NextResponse.json({ success: true, message: 'Sandbox BYOK settings updated.' });
    }

    const updateObj: any = {
      organization_id: user.organization_id,
      byok_enabled: !!byok_enabled,
      updated_at: new Date().toISOString(),
    };

    const prevInfo = await supabase
      .from('byok_credentials')
      .select('*')
      .eq('organization_id', user.organization_id)
      .single();

    const currentCreds = prevInfo.data;

    if (google_places_key !== undefined) {
      if (google_places_key === '••••••••') {
        updateObj.encrypted_google_places_key = currentCreds?.encrypted_google_places_key;
      } else if (google_places_key === '') {
        updateObj.encrypted_google_places_key = null;
      } else {
        updateObj.encrypted_google_places_key = encrypt(google_places_key);
      }
    }

    if (openrouter_key !== undefined) {
      if (openrouter_key === '••••••••') {
        updateObj.encrypted_openrouter_key = currentCreds?.encrypted_openrouter_key;
      } else if (openrouter_key === '') {
        updateObj.encrypted_openrouter_key = null;
      } else {
        updateObj.encrypted_openrouter_key = encrypt(openrouter_key);
      }
    }

    if (supabase_url !== undefined) {
      if (supabase_url === '••••••••') {
        updateObj.encrypted_supabase_url = currentCreds?.encrypted_supabase_url;
      } else if (supabase_url === '') {
        updateObj.encrypted_supabase_url = null;
      } else {
        updateObj.encrypted_supabase_url = encrypt(supabase_url);
      }
    }

    if (supabase_anon !== undefined) {
      if (supabase_anon === '••••••••') {
        updateObj.encrypted_supabase_anon = currentCreds?.encrypted_supabase_anon;
      } else if (supabase_anon === '') {
        updateObj.encrypted_supabase_anon = null;
      } else {
        updateObj.encrypted_supabase_anon = encrypt(supabase_anon);
      }
    }

    const { error } = await supabase
      .from('byok_credentials')
      .upsert(updateObj, { onConflict: 'organization_id' });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'BYOK Credentials saved successfully.' });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
