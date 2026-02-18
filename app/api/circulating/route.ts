import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug') === '1';
    
    // Get the numeric value
    const supplyValue = await getCirculatingSupplyToke();

    // Force the correct JSON structure: {"circulatingSupply": 419700154.123}
    const data = { 
      circulatingSupply: Number(supplyValue) 
    };

    // If debug is on, you can return everything, otherwise return exactly what the tracker wants
    return NextResponse.json(debug ? { ...data, raw: supplyValue } : data);
    
  } catch (error) {
    console.error('Error fetching circulating supply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch circulating TOKE supply' },
      { status: 500 },
    );
  }
}
