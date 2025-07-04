// filepath: app/api/auth/route.ts
import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user, session: data.session });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}