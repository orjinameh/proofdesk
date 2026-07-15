import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { seededFloat, seededInRange } from "../mockUtils";
import { AgentFinding, AgentResult, VerificationAgent, VerificationInput } from "../types";

/**
 * ReputationAgent
 *
 * Aggregates off-chain / social-graph style signals: age of the
 * address or contract, prior flags from community blocklists,
 * transaction history diversity, and known-scam-address matches.
 *
 * This agent is intentionally the most likely to return WARNING in
 * the mock data set, since reputation signals are inherently fuzzy -
 * mirroring how real reputation providers behave (rarely a hard
 * PASS/FAIL, usually a confidence-weighted signal).
 */

interface ReputationProvider {
  assess(input: VerificationInput): Promise<AgentResult>;
}

class MockReputationProvider implements ReputationProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    const seed = `reputation:${input.targetAddress}:${input.chainId}`;
    const findings: AgentFinding[] = [];

    const addressAgeDays = Math.round(seededInRange(seed + ":age", 1, 900));
    const knownBlocklistHit = seededFloat(seed + ":blocklist") < 0.08;
    const txCount = Math.round(seededInRange(seed + ":txcount", 5, 50_000));
    const uniqueCounterparties = Math.round(seededInRange(seed + ":counterparties", 2, 5_000));

    findings.push({
      message: `Address first observed approximately ${addressAgeDays} days ago.`,
      severity: addressAgeDays < 7 ? "medium" : "info",
    });

    findings.push({
      message: `${txCount.toLocaleString("en-US")} historical transactions across ${uniqueCounterparties.toLocaleString(
        "en-US"
      )} unique counterparties.`,
      severity: txCount < 20 ? "medium" : "info",
    });

    if (knownBlocklistHit) {
      findings.push({
        message: "Address matches an entry on a known scam / phishing blocklist aggregator.",
        severity: "critical",
      });
    } else {
      findings.push({
        message: "No matches found against known scam or phishing blocklists.",
        severity: "info",
      });
    }

    let status: AgentResult["status"] = "PASS";
    if (addressAgeDays < 7 || txCount < 20) {
      status = "WARNING";
    }
    if (knownBlocklistHit) {
      status = "FAIL";
    }

    const confidence = Number(seededInRange(seed + ":confidence", 0.55, 0.9).toFixed(2));

    return { status, confidence, findings, source: "mock" };
  }
}

class LiveReputationProvider implements ReputationProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    // Placeholder for a real reputation/blocklist API integration.
    logger.warn("LiveReputationProvider invoked but not implemented; falling back to mock.");
    return new MockReputationProvider().assess(input);
  }
}

export class ReputationAgent implements VerificationAgent {
  readonly name = "ReputationAgent";
  private provider: ReputationProvider;

  constructor() {
    this.provider = config.flags.mockMode ? new MockReputationProvider() : new LiveReputationProvider();
  }

  async run(input: VerificationInput): Promise<AgentResult> {
    return this.provider.assess(input);
  }
}
