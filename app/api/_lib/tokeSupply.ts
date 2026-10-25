type JsonRpcSuccess<T> = { jsonrpc: '2.0'; id: string; result: T };
type JsonRpcError = { jsonrpc: '2.0'; id: string; error: { code: number; message: string; data?: unknown } };
type TokenSupplyResult = { value: { amount: string; decimals: number; uiAmountString: string } };

export type SupplySource = 'rpc' | 'explorer-snapshot';
export type Supply = {
  totalSupply: number;
  decimals: number;
  source: SupplySource;
  asOf: string; // ISO time the figure was read from the chain
};

const TOKE_MINT = 'AmgUMQeqW8H74trc8UkKjzZWtxBdpS496wh4GLy2mCpo';
const TOKE_DECIMALS = 3;
const MAX_SUPPLY = 420_000_069; // fixed: mint authority is revoked, so supply can only fall (burns)
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const RPC_ATTEMPTS = 2;
// Pipeline output: Gate-A verified, reconciled against the chain every ~6h, timestamped.
const SNAPSHOT_URL = 'https://explorer.mctoken.xyz/api/v1/prospectus.json';
const TIMEOUT_MS = 4000;

const plausible = (n: number) => Number.isFinite(n) && n > 0 && n <= MAX_SUPPLY;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fromRpc(): Promise<Supply> {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 'toke-supply', method: 'getTokenSupply', params: [TOKE_MINT] });
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RPC_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
      const rpc = (await res.json()) as JsonRpcSuccess<TokenSupplyResult> | JsonRpcError;
      if ('error' in rpc) throw new Error(`RPC error ${rpc.error.code}: ${rpc.error.message}`);
      const n = Number(rpc.result.value.uiAmountString);
      if (!plausible(n)) throw new Error(`RPC returned implausible supply ${rpc.result.value.uiAmountString}`);
      return { totalSupply: n, decimals: rpc.result.value.decimals, source: 'rpc', asOf: new Date().toISOString() };
    } catch (e) {
      lastErr = e;
      if (attempt < RPC_ATTEMPTS) await sleep(300);
    }
  }
  throw lastErr;
}

export async function fromExplorerSnapshot(): Promise<Supply> {
  const res = await fetch(SNAPSHOT_URL, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`snapshot HTTP ${res.status}`);
  const j = (await res.json()) as { as_of?: string; token?: { mint?: string; current_supply?: number; decimals?: number } };
  const n = Number(j.token?.current_supply);
  if (j.token?.mint !== TOKE_MINT || !plausible(n) || !j.as_of) throw new Error('snapshot missing or implausible');
  return { totalSupply: n, decimals: j.token?.decimals ?? TOKE_DECIMALS, source: 'explorer-snapshot', asOf: j.as_of };
}

/**
 * Total supply of TOKE. Order: public RPC (2 attempts) → the pipeline's verified snapshot.
 * Throws if neither is available — callers return an error rather than an invented number.
 */
export async function getTotalSupplyToke(): Promise<Supply> {
  try {
    return await fromRpc();
  } catch (rpcErr) {
    console.warn('supply: RPC unavailable, trying explorer snapshot:', rpcErr);
    return await fromExplorerSnapshot();
  }
}

/** Circulating supply. Today this equals total supply (nothing is excluded). */
export async function getCirculatingSupplyToke(): Promise<Supply> {
  return getTotalSupplyToke();
}

/** Headers that say where the figure came from and when it was read. */
export function supplyHeaders(s: Supply): Record<string, string> {
  return { 'Cache-Control': 'no-store', 'X-Supply-Source': s.source, 'X-Supply-As-Of': s.asOf };
}
