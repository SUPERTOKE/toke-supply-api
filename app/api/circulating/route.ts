import { NextResponse } from 'next/server';

// Force Vercel to bypass all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MINT = 'AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo';

export async function GET() {
  try {
    // 1. Fetch from DexScreener
    const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${MINT}`, {
      cache: 'no-store'
    });
    const dexData = await dexResponse.json();

    const pairs = (dexData.pairs || []).filter((p: any) => p.chainId === 'solana');
    const bestPair = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

    if (!bestPair) throw new Error('No pairs');

    const price = Number(bestPair.priceUsd);
    const mcap = bestPair.marketCap || bestPair.fdv;
    const circulating = mcap / price;

    // 2. Return the required JSON format
    return NextResponse.json({
      circulatingSupply: circulating,
      total: 0,
      deployment: "success_v2" // This allows you to see if the update is live
    });

  } catch (error) {
    // Fallback if DexScreener is down
    return NextResponse.json({
      circulatingSupply: 419700154.123,
      total: 0,
      status: "fallback"
    });
  }
}
