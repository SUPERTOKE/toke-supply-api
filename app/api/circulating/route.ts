import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === '1';
    
    // Fetch the supply data from your library
    const result = await getCirculatingSupplyToke();

    // The image requirement specifically asks for: {"circulatingSupply": number}
    const responseBody = {
      circulatingSupply: typeof result === 'object' ? result.circulatingSupply : result
    };

    // If debug is requested, you can return the full result object instead
    return NextResponse.json(debug ? result : responseBody);
    
  } catch (error) {
    console.error('Error fetching circulating supply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch circulating TOKE supply' },
      { status: 500 },
    );
  }
}
