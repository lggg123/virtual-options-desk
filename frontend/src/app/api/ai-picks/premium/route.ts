import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const csvPath = path.resolve(process.cwd(), 'data/top50_premium.csv');
  try {
    const csv = fs.readFileSync(csvPath, 'utf8');
    const [header, ...rows] = csv.trim().split('\n');
    const columns = header.split(',');
    const data = rows.map(row => {
      const values = row.split(',');
      return Object.fromEntries(values.map((v, i) => [columns[i], v]));
    });
    return NextResponse.json({ picks: data });
  } catch {
    return NextResponse.json({ error: 'Could not read premium picks.' }, { status: 500 });
  }
}
