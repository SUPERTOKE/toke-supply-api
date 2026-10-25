import { NextResponse } from 'next/server';
import { fromExplorerSnapshot, getTotalSupplyToke, supplyHeaders } from '../_lib/tokeSupply';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const debug = params.get('debug') === '1';
    // ?debug=1&source=snapshot exercises the fallback path on demand (for checks).
    const s = debug && params.get('source') === 'snapshot' ? await fromExplorerSnapshot() : await getTotalSupplyToke();
    return NextResponse.json(debug ? s : s.totalSupply, { headers: supplyHeaders(s) });
  } catch (error) {
    console.error('total supply unavailable:', error);
    return NextResponse.json(
      { success: false, error: 'TOKE supply temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } },
    );
  }
}
