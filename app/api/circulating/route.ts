import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export async function GET() {
  try {
    const result = await getCirculatingSupplyToke();
    
    // Returns exactly {"circulatingSupply": 419700154.123}
    return NextResponse.json({
      circulatingSupply: result.circulatingSupply
    });

  } catch (error) {
    return NextResponse.json({ error: "API Error" }, { status: 500 });
  }
}
