import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke, supplyHeaders } from '../_lib/tokeSupply';

// Prevents Vercel from serving an old cached version
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const s = await getCirculatingSupplyToke();
    // Body stays exactly {"circulatingSupply": <number>}; source and timestamp are in the headers.
    return NextResponse.json({ circulatingSupply: s.totalSupply }, { headers: supplyHeaders(s) });
  } catch (error) {
    console.error('circulating supply unavailable:', error);
    return NextResponse.json(
      { error: 'TOKE supply temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } },
    );
  }
}
