import { NextResponse } from 'next/server';

// Force Vercel to bypass all caching and ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MINT = 'AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo';

// Define the structure of DexScreener pair for Type Safety
interface DexPair {
  chainId: string;
  priceUsd: string;
  liquidity?: { usd?: number };
  marketCap?: number;
  fdv?: number;
}

export async function GET() {
  try {
    const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${MINT}`, {
      cache: 'no-store'
    });

    if (!dexResponse.ok) throw new Error(`DexScreener API error: ${dexResponse.status}`);
    
    const dexData = await dexResponse.json();

    // Type-safe filtering and sorting
    const pairs: DexPair[] = dexData.pairs || [];
    const solanaPairs = pairs.filter((p) => p.chainId === 'solana');
    
    const bestPair = solanaPairs.sort((a, b) => 
      (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0)
    )[0];

    if (!bestPair) throw new Error('No Solana pairs found for this mint');

    const price = Number(bestPair.priceUsd);
    const mcap = bestPair.marketCap || bestPair.fdv;

    if (!price || !mcap) throw new Error('Invalid price or market cap data');

    const circulating = mcap / price;

    // Return the specific JSON format required by trackers
    return NextResponse.json({
      circulatingSupply: circulating
    });

  } catch (error) {
    console.error('Circulating Supply Error:', error);
    // Hardcoded fallback to ensure the API never returns a blank page
    return NextResponse.json({
      circulatingSupply: 419700154.123,
      total: 0,
      status: "fallback"
    });
  }
}
