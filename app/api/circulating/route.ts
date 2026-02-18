import { NextResponse } from 'next/server';
import { getCirculatingSupplyToke } from '../_lib/tokeSupply';

// Force Vercel to bypass all caching and ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0; 

export async function GET() {
  try {
    const result = await getCirculatingSupplyToke();
    
    // Return ONLY the required key
    return NextResponse.json({
      circulatingSupply: result.circulatingSupply
    });

  } catch (error) {
    console.error('Error fetching circulating supply:', error);
    return NextResponse.json(
      { error: "Failed to fetch circulating supply" }, 
      { status: 500 }
    );
  }
}
