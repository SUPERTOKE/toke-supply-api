type JsonRpcSuccess<T> = { jsonrpc: '2.0'; id: string; result: T };
type JsonRpcError = { jsonrpc: '2.0'; id: string; error: { code: number; message: string; data?: unknown } };

// Hardcoded Mint Address
const DEFAULT_TOKE_MINT = 'AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo';

function getSolanaRpcUrl(): string {
  // Removed Helius - Using Public RPC
  return 'https://api.mainnet-beta.solana.com';
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}) ${url}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

export async function getTotalSupplyToke() {
  const mint = DEFAULT_TOKE_MINT;
  const rpcUrl = getSolanaRpcUrl();

  const body = {
    jsonrpc: '2.0',
    id: 'toke-supply',
    method: 'getTokenSupply',
    params: [mint],
  };

  const rpc = await fetchJson<JsonRpcSuccess<any> | JsonRpcError>(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store', // Bypasses cache
  });

  if ('error' in rpc) {
    throw new Error(`RPC error ${rpc.error.code}: ${rpc.error.message}`);
  }

  return {
    totalSupply: Number(rpc.result.value.uiAmountString),
    decimals: rpc.result.value.decimals
  };
}

export async function getCirculatingSupplyToke() {
  const mint = DEFAULT_TOKE_MINT;

  try {
    const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
    const dex = await fetchJson<any>(dexUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    const pairs = (dex.pairs || []).filter((p: any) => (p.chainId || '').toLowerCase() === 'solana');
    const best = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    
    if (!best) throw new Error('No Solana pairs');

    const priceUsd = Number(best.priceUsd);
    const marketCapUsd = typeof best.marketCap === 'number' ? best.marketCap : best.fdv;

    const circulating = marketCapUsd / priceUsd;

    return {
      circulatingSupply: circulating,
      total: 0 // As requested for verification
    };
  } catch (e) {
    const total = await getTotalSupplyToke();
    return {
      circulatingSupply: total.totalSupply,
      total: 0
    };
  }
}
