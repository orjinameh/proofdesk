import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { seededFloat, seededInRange } from "../mockUtils";
import { AgentFinding, AgentResult, VerificationAgent, VerificationInput } from "../types";

/**
 * LiquidityAgent
 *
 * Assesses whether the target has sufficient, locked, and stable
 * liquidity - a core signal for whether an agent-executed swap or
 * transfer is likely to succeed at a fair price and not be a rug pull.
 *
 * Live mode would call a DEX aggregator / liquidity data provider
 * (e.g. via DEX_API_KEY). Mock provider below is deterministic and
 * realistic for demo purposes.
 */

interface LiquidityProvider {
  assess(input: VerificationInput): Promise<AgentResult>;
}

class MockLiquidityProvider implements LiquidityProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    const seed = `liquidity:${input.targetAddress}:${input.chainId}`;
    const findings: AgentFinding[] = [];

    const liquidityUsd = Math.round(seededInRange(seed + ":usd", 500, 4_500_000));
    const liquidityLocked = seededFloat(seed + ":locked") > 0.3;
    const lockDurationDays = liquidityLocked
      ? Math.round(seededInRange(seed + ":lockdays", 30, 720))
      : 0;
    const slippageEstimatePct = Number(seededInRange(seed + ":slippage", 0.1, 12).toFixed(2));

    findings.push({
      message: `Estimated pooled liquidity: $${liquidityUsd.toLocaleString("en-US")}.`,
      severity: liquidityUsd < 10_000 ? "high" : liquidityUsd < 50_000 ? "medium" : "info",
    });

    findings.push({
      message: liquidityLocked
        ? `Liquidity appears locked for approximately ${lockDurationDays} days.`
        : "No liquidity lock detected; liquidity could be pulled at any time.",
      severity: liquidityLocked ? "info" : "high",
    });

    findings.push({
      message: `Estimated slippage on a representative trade size: ${slippageEstimatePct}%.`,
      severity: slippageEstimatePct > 8 ? "high" : slippageEstimatePct > 3 ? "medium" : "info",
    });

    let status: AgentResult["status"] = "PASS";
    if (liquidityUsd < 50_000 || slippageEstimatePct > 3) {
      status = "WARNING";
    }
    if (liquidityUsd < 5_000 || !liquidityLocked) {
      status = liquidityUsd < 5_000 ? "FAIL" : "WARNING";
    }

    const confidence = Number(seededInRange(seed + ":confidence", 0.65, 0.95).toFixed(2));

    return { status, confidence, findings, source: "mock" };
  }
}

class LiveLiquidityProvider implements LiquidityProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    // Placeholder for a real DEX liquidity data integration using
    // config.dexApiKey. Not implemented in this MVP.
    logger.warn("LiveLiquidityProvider invoked but not implemented; falling back to mock.");
    return new MockLiquidityProvider().assess(input);
  }
}

export class LiquidityAgent implements VerificationAgent {
  readonly name = "LiquidityAgent";
  private provider: LiquidityProvider;

  constructor() {
    this.provider = config.flags.mockMode ? new MockLiquidityProvider() : new LiveLiquidityProvider();
  }

  async run(input: VerificationInput): Promise<AgentResult> {
    return this.provider.assess(input);
  }
}
