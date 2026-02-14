import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const debug = new URL(request.url).searchParams.get('debug') === '1';
    const result = await getCirculatingSupplyToke();
    return NextResponse.json(debug ? result : result.circulatingSupply);
  } catch (error) {
    console.error('Error fetching circulating supply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch circulating TOKE supply' },
      { status: 500 },
    );
  }
} 
