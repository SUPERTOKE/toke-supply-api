import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

// This forces Vercel to fetch fresh data on every request
export const revalidate = 0; 

export async function GET() {
  try {
    const result = await getCirculatingSupplyToke();
    
    return NextResponse.json({
      circulatingSupply: result.circulatingSupply,
      total: result.total,
      status: "updated-v2" // Extra tag to prove the update is live
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
