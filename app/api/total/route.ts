import { NextResponse } from 'next/server';
import { getTotalSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const debug = new URL(request.url).searchParams.get('debug') === '1';
    const result = await getTotalSupplyToke();
    return NextResponse.json(debug ? result : result.totalSupply);
  } catch (error) {
    console.error('Error fetching total supply:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch total TOKE supply' }, { status: 500 });
  }
} 
