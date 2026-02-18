import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const result = await getCirculatingSupplyToke();
    
    // THIS IS THE FIX: Wrapping the result in an object with the required key
    return NextResponse.json({
      circulatingSupply: Number(result)
    });

  } catch (error) {
    console.error('Error fetching circulating supply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch circulating supply' },
      { status: 500 },
    );
  }
}
