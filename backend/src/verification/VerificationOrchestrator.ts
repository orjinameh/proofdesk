import { logger } from "../utils/logger";
import { ContractSecurityAgent } from "./agents/ContractSecurityAgent";
import { LiquidityAgent } from "./agents/LiquidityAgent";
import { ReputationAgent } from "./agents/ReputationAgent";
import { MarketStructureAgent } from "./agents/MarketStructureAgent";
import {
  AgentResult,
  CheckStatus,
  CheckSummary,
  VerificationChecks,
  VerificationInput,
  Verdict,
} from "./types";

interface OrchestratedResult {
  checks: VerificationChecks;
  confidence_score: number;
  verdict: Verdict;
  mode: "mock" | "live" | "mixed";
}

const STATUS_WEIGHT: Record<CheckStatus, number> = {
  PASS: 1,
  WARNING: 0.5,
  FAIL: 0,
};

/**
 * VerificationOrchestrator
 *
 * Runs every verification agent in parallel, aggregates their
 * individual results into the four public check categories, and
 * derives an overall confidence score + verdict.
 *
 * Verdict logic:
 *  - Any agent returning FAIL              -> overall FAIL
 *  - No FAIL but any agent returns WARNING -> overall WARNING
 *  - All agents PASS                        -> overall PASS
 *
 * Confidence score is a weighted blend of each agent's own reported
 * confidence and its status weight, so a WARNING from a highly
 * confident agent pulls the score down more than a WARNING from an
 * agent that wasn't sure to begin with.
 */
export class VerificationOrchestrator {
  private contractSecurityAgent = new ContractSecurityAgent();
  private liquidityAgent = new LiquidityAgent();
  private reputationAgent = new ReputationAgent();
  private marketStructureAgent = new MarketStructureAgent();

  async runAll(input: VerificationInput): Promise<OrchestratedResult> {
    logger.info("Running verification agents", {
      target: input.targetAddress,
      chainId: input.chainId,
    });

    const [contractSecurity, liquidity, reputation, marketStructure] = await Promise.all([
      this.safeRun(this.contractSecurityAgent.run.bind(this.contractSecurityAgent), input),
      this.safeRun(this.liquidityAgent.run.bind(this.liquidityAgent), input),
      this.safeRun(this.reputationAgent.run.bind(this.reputationAgent), input),
      this.safeRun(this.marketStructureAgent.run.bind(this.marketStructureAgent), input),
    ]);

    const checks: VerificationChecks = {
      contract_security: this.toSummary(contractSecurity),
      liquidity: this.toSummary(liquidity),
      reputation: this.toSummary(reputation),
      market_structure: this.toSummary(marketStructure),
    };

    const results = [contractSecurity, liquidity, reputation, marketStructure];
    const verdict = this.deriveVerdict(results);
    const confidence_score = this.deriveConfidence(results);
    const mode = this.deriveMode(results);

    return { checks, confidence_score, verdict, mode };
  }

  private async safeRun(
    fn: (input: VerificationInput) => Promise<AgentResult>,
    input: VerificationInput
  ): Promise<AgentResult> {
    try {
      return await fn(input);
    } catch (err) {
      logger.error("Verification agent threw an error; treating as WARNING", {
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        status: "WARNING",
        confidence: 0.3,
        findings: [{ message: "Agent failed to complete; treated as inconclusive.", severity: "medium" }],
        source: "mock",
      };
    }
  }

  private toSummary(result: AgentResult): CheckSummary {
    return {
      status: result.status,
      details: result.findings.map((f) => f.message),
    };
  }

  private deriveVerdict(results: AgentResult[]): Verdict {
    if (results.some((r) => r.status === "FAIL")) return "FAIL";
    if (results.some((r) => r.status === "WARNING")) return "WARNING";
    return "PASS";
  }

  private deriveConfidence(results: AgentResult[]): number {
    const weighted = results.map((r) => r.confidence * STATUS_WEIGHT[r.status]);
    const avg = weighted.reduce((a, b) => a + b, 0) / weighted.length;
    return Number(Math.max(0, Math.min(1, avg)).toFixed(2));
  }

  private deriveMode(results: AgentResult[]): "mock" | "live" | "mixed" {
    const sources = new Set(results.map((r) => r.source));
    if (sources.size === 1) {
      return sources.has("mock") ? "mock" : "live";
    }
    return "mixed";
  }
}
