import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, {method: 'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify({"jsonrpc": "2.0", "id": "test", "method": "getAsset", "params": {"id": "AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo"}})});
    const data = await response.json();
    const rawSupply = data.result.token_info.supply;
    const totalSupply = rawSupply / Math.pow(10, 3);
    return NextResponse.json(totalSupply);
  } 
  catch (error) {console.error('Error fetching total supply:', error); return NextResponse.json({ success: false, error: 'Failed to fetch total TOKE supply' }, { status: 500 });}
} 