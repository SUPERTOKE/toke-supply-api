import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const result = await getCirculatingSupplyToke();
    
    // Returning multiple keys to verify JSON structure
    return NextResponse.json({
      circulatingSupply: Number(result),
      total: 0,
      lastUpdated: new Date().toISOString() // Added a timestamp to verify the data is fresh
    });

  } catch (error) {
    console.error('Error fetching circulating supply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch circulating supply' },
      { status: 500 },
    );
  }
}
