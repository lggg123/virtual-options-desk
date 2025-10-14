import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_CREWAI_API_URL || '';
  if (!apiUrl) {
    return NextResponse.json({ error: 'CREWAI API URL not set.' }, { status: 500 });
  }
  try {
    const res = await fetch(`${apiUrl}/top_breakout_picks?n=10`);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `CrewAI API error: ${err}` }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json({ picks: data.top_picks || [] });
  } catch (e) {
    return NextResponse.json({ error: `Failed to fetch from CrewAI: ${e}` }, { status: 500 });
  }
}
