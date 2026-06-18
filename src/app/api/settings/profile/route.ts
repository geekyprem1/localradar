import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/entitlements';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key-placeholder';

// Server-side admin client to bypass RLS restrictions for profile management
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// In-memory profile store for mock users in Sandbox Mode
const sandboxProfileStore = new Map<string, {
  full_name: string;
  organization_name: string;
}>();

export async function GET(request: Request) {
  try {
    const user = await getServerUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (user.is_mock) {
      const mockProfile = sandboxProfileStore.get(user.id) || {
        full_name: (user as any).full_name || 'Alex Rivera (Sandbox)',
        organization_name: 'My Local Agency',
      };
      return NextResponse.json({
        success: true,
        full_name: mockProfile.full_name,
        organization_name: mockProfile.organization_name,
      });
    }

    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('full_name, organization_id')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
    }

    let organizationName = 'My Local Agency';
    if (profile?.organization_id) {
      // 2. Fetch organization profile
      const { data: org, error: orgErr } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();
      
      if (!orgErr && org?.name) {
        organizationName = org.name;
      }
    }

    return NextResponse.json({
      success: true,
      full_name: profile?.full_name || '',
      organization_name: organizationName,
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

    const { full_name, organization_name } = await request.json();

    if (!full_name || !full_name.trim()) {
      return NextResponse.json({ success: false, message: 'Full name is required.' }, { status: 400 });
    }

    if (!organization_name || !organization_name.trim()) {
      return NextResponse.json({ success: false, message: 'Organization name is required.' }, { status: 400 });
    }

    if (user.is_mock) {
      sandboxProfileStore.set(user.id, {
        full_name: full_name.trim(),
        organization_name: organization_name.trim(),
      });
      return NextResponse.json({
        success: true,
        message: 'Sandbox profile updated successfully!',
      });
    }

    // 1. Update user full name
    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update({ full_name: full_name.trim() })
      .eq('id', user.id);

    if (userErr) {
      return NextResponse.json({ success: false, message: userErr.message }, { status: 500 });
    }

    // 2. Fetch user's organization ID
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileErr) {
      return NextResponse.json({ success: false, message: profileErr.message }, { status: 500 });
    }

    if (!profile?.organization_id) {
      return NextResponse.json({ success: false, message: 'Organization not found for this user.' }, { status: 404 });
    }

    // 3. Update organization name
    const { error: orgErr } = await supabaseAdmin
      .from('organizations')
      .update({ name: organization_name.trim() })
      .eq('id', profile.organization_id);

    if (orgErr) {
      return NextResponse.json({ success: false, message: orgErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile and Organization settings saved successfully!',
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
