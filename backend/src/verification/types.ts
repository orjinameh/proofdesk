export type CheckStatus = "PASS" | "FAIL" | "WARNING";

export type Verdict = "PASS" | "FAIL" | "WARNING";

export interface VerificationInput {
  targetAddress: string;
  chainId: number;
  transactionPayload?: string;
}

export interface AgentFinding {
  message: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
}

/**
 * The normalized output every verification agent must return.
 * confidence is a 0..1 float representing how confident the agent is
 * in its own assessment (not the same as the status).
 */
export interface AgentResult {
  status: CheckStatus;
  confidence: number;
  findings: AgentFinding[];
  source: "mock" | "live";
}

export interface VerificationAgent {
  readonly name: string;
  run(input: VerificationInput): Promise<AgentResult>;
}

export interface CheckSummary {
  status: CheckStatus;
  details: string[];
}

export interface VerificationChecks {
  contract_security: CheckSummary;
  liquidity: CheckSummary;
  reputation: CheckSummary;
  market_structure: CheckSummary;
}

export interface VerificationReceipt {
  provider: "ProofDesk";
  receipt_id: string;
  timestamp: string;
  target_address: string;
  chain_id: number;
  verdict: Verdict;
  confidence_score: number;
  checks: VerificationChecks;
  receipt_hash: string;
  mode: "mock" | "live" | "mixed";
}
