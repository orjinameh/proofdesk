import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { VerificationChecks, VerificationReceipt, Verdict } from "../verification/types";

interface BuildReceiptParams {
  targetAddress: string;
  chainId: number;
  checks: VerificationChecks;
  confidenceScore: number;
  verdict: Verdict;
  mode: "mock" | "live" | "mixed";
}

/**
 * ReceiptGenerator
 *
 * Produces the machine-readable Verification Receipt that agents rely
 * on to make a go / no-go decision. The receipt is deterministic given
 * its inputs (aside from receipt_id and timestamp, which are unique
 * per request by design) and includes a SHA-256 hash over the
 * canonical payload so a receiving agent - or a downstream auditor -
 * can verify the receipt has not been tampered with in transit.
 */
export class ReceiptGenerator {
  build(params: BuildReceiptParams): VerificationReceipt {
    const receipt_id = `pd_${uuidv4()}`;
    const timestamp = new Date().toISOString();

    const receiptCore = {
      provider: "ProofDesk" as const,
      receipt_id,
      timestamp,
      target_address: params.targetAddress,
      chain_id: params.chainId,
      verdict: params.verdict,
      confidence_score: params.confidenceScore,
      checks: params.checks,
      mode: params.mode,
    };

    const receipt_hash = this.hash(receiptCore);

    return {
      ...receiptCore,
      receipt_hash,
    };
  }

  /**
   * Verifies a previously issued receipt hasn't been altered by
   * recomputing the hash over its core fields and comparing.
   */
  verify(receipt: VerificationReceipt): boolean {
    const { receipt_hash, ...core } = receipt;
    return this.hash(core) === receipt_hash;
  }

  private hash(payload: Record<string, unknown>): string {
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }
}
