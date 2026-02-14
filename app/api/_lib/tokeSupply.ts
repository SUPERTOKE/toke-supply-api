type JsonRpcSuccess<T> = { jsonrpc: '2.0'; id: string; result: T };
type JsonRpcError = { jsonrpc: '2.0'; id: string; error: { code: number; message: string; data?: unknown } };

const DEFAULT_TOKE_MINT = 'AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo';

function getTokeMint(): string {
  return process.env.TOKE_MINT?.trim() || DEFAULT_TOKE_MINT;
}

function getSolanaRpcUrl(): string {
  const heliusKey = process.env.HELIUS_API_KEY?.trim();
  if (heliusKey) return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
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

export async function getTotalSupplyToke(opts?: { mint?: string }) {
  const mint = opts?.mint || getTokeMint();
  const rpcUrl = getSolanaRpcUrl();

  type GetTokenSupplyResult = {
    context: { slot: number };
    value: {
      amount: string; // raw integer string
      decimals: number;
      uiAmount: number | null;
      uiAmountString: string;
    };
  };

  const body = {
    jsonrpc: '2.0',
    id: 'toke-supply',
    method: 'getTokenSupply',
    params: [mint],
  };

  const rpc = await fetchJson<JsonRpcSuccess<GetTokenSupplyResult> | JsonRpcError>(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if ('error' in rpc) {
    throw new Error(`RPC error ${rpc.error.code}: ${rpc.error.message}`);
  }

  const { decimals, uiAmountString } = rpc.result.value;
  const totalSupply = Number(uiAmountString);
  if (!Number.isFinite(totalSupply) || totalSupply <= 0) {
    throw new Error(`Invalid uiAmountString returned by RPC: ${uiAmountString}`);
  }

  return {
    mint,
    source: rpcUrl.includes('helius-rpc.com') ? 'helius-rpc' : 'solana-public-rpc',
    totalSupply,
    totalSupplyExact: uiAmountString,
    uiAmountString,
    decimals,
  } as const;
}

export async function getCirculatingSupplyToke(opts?: { mint?: string }) {
  const mint = opts?.mint || getTokeMint();

  // DexScreener exposes an estimated marketCap; we can derive circulating supply as:
  // circulating = marketCapUSD / priceUSD
  // This matches how many trackers estimate "circulating" for SPL tokens.
  type DexPair = {
    chainId?: string;
    liquidity?: { usd?: number };
    priceUsd?: string;
    marketCap?: number;
    fdv?: number;
  };
  type DexScreenerTokenResponse = { schemaVersion: string; pairs?: DexPair[] };

  try {
    const dexUrl = `https://api.dexscreener.com/latest/dex/tokens/${mint}`;
    const dex = await fetchJson<DexScreenerTokenResponse>(dexUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });

    const pairs = (dex.pairs || []).filter((p) => (p.chainId || '').toLowerCase() === 'solana');
    const best = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    if (!best) throw new Error('DexScreener returned no Solana pairs');

    const priceUsd = Number(best.priceUsd);
    const marketCapUsd = typeof best.marketCap === 'number' ? best.marketCap : best.fdv;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) throw new Error('DexScreener missing/invalid priceUsd');
    if (!Number.isFinite(marketCapUsd as number) || (marketCapUsd as number) <= 0) {
      throw new Error('DexScreener missing marketCap/fdv');
    }

    const circulating = (marketCapUsd as number) / priceUsd;
    if (!Number.isFinite(circulating) || circulating <= 0) throw new Error('Derived circulating supply invalid');

    return {
      mint,
      source: 'dexscreener',
      circulatingSupply: circulating,
      used: typeof best.marketCap === 'number' ? 'marketCap' : 'fdv',
    } as const;
  } catch (e) {
    // Fallback to on-chain total supply if DexScreener is down or missing fields.
    const total = await getTotalSupplyToke({ mint });
    return {
      mint,
      source: 'rpc-fallback',
      circulatingSupply: total.totalSupply,
      used: 'totalSupply',
    } as const;
  }
}

