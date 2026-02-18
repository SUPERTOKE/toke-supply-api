type JsonRpcSuccess<T> = { jsonrpc: '2.0'; id: string; result: T };
type JsonRpcError = { jsonrpc: '2.0'; id: string; error: { code: number; message: string; data?: unknown } };

// Hardcoded Mint Address
const DEFAULT_TOKE_MINT = 'AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo';

/**
 * Standard fetch wrapper for RPC calls
 */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}) ${url}${text ? `: ${text.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as T;
}

/**
 * Fetches the EXACT total supply from the Solana Mainnet RPC
 */
export async function getCirculatingSupplyToke() {
  const mint = DEFAULT_TOKE_MINT;
  const rpcUrl = 'https://api.mainnet-beta.solana.com';

  const body = {
    jsonrpc: '2.0',
    id: 'toke-supply',
    method: 'getTokenSupply',
    params: [mint],
  };

  try {
    const rpc = await fetchJson<JsonRpcSuccess<any> | JsonRpcError>(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store', // Ensures fresh data
    });

    if ('error' in rpc) {
      throw new Error(`RPC error ${rpc.error.code}: ${rpc.error.message}`);
    }

    // uiAmountString is the most accurate representation of the supply
    const exactSupply = Number(rpc.result.value.uiAmountString);

    return {
      circulatingSupply: exactSupply,
      source: 'rpc-direct'
    };

  } catch (error) {
    console.error('RPC Error:', error);
    // Static fallback to your verified number if the RPC is down
    return {
      circulatingSupply: 419700154.123,
      source: 'static-fallback'
    };
  }
}
