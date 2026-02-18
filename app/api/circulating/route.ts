import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export async function GET(request: Request) {
  try {
    const result = await getCirculatingSupplyToke();
    
    // This creates the JSON structure: {"circulatingSupply": 419700154.123}
    return NextResponse.json({
      circulatingSupply: Number(result)
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supply' },
      { status: 500 }
    );
  }
}
