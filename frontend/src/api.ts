export interface CheckSummary {
  status: "PASS" | "FAIL" | "WARNING";
  details: string[];
}

export interface VerificationReceipt {
  provider: string;
  receipt_id: string;
  timestamp: string;
  target_address: string;
  chain_id: number;
  verdict: "PASS" | "FAIL" | "WARNING";
  confidence_score: number;
  checks: {
    contract_security: CheckSummary;
    liquidity: CheckSummary;
    reputation: CheckSummary;
    market_structure: CheckSummary;
  };
  receipt_hash: string;
  mode: "mock" | "live" | "mixed";
}

export interface ApiErrorBody {
  provider?: string;
  error: string;
  details?: string[];
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function verifyTarget(
  targetAddress: string,
  chainId: number
): Promise<VerificationReceipt> {
  const response = await fetch(`${API_BASE_URL}/api/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_address: targetAddress, chain_id: chainId }),
  });

  const body = await response.json();

  if (!response.ok) {
    const err = body as ApiErrorBody;
    const detail = err.details?.join(" ") || err.message || err.error;
    throw new Error(detail || "Verification request failed.");
  }

  return body as VerificationReceipt;
}
