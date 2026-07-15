import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { seededFloat, seededInRange } from "../mockUtils";
import { AgentFinding, AgentResult, VerificationAgent, VerificationInput } from "../types";

/**
 * MarketStructureAgent
 *
 * Looks at broader market-level health for the target asset: price
 * volatility, holder concentration, and buy/sell tax structure. This
 * complements LiquidityAgent (which is pool-specific) with a wider
 * view of whether the market around the asset looks manipulated or
 * fragile.
 */

interface MarketStructureProvider {
  assess(input: VerificationInput): Promise<AgentResult>;
}

class MockMarketStructureProvider implements MarketStructureProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    const seed = `market_structure:${input.targetAddress}:${input.chainId}`;
    const findings: AgentFinding[] = [];

    const topHolderPct = Number(seededInRange(seed + ":topholder", 1, 65).toFixed(1));
    const buyTaxPct = Number(seededInRange(seed + ":buytax", 0, 15).toFixed(1));
    const sellTaxPct = Number(seededInRange(seed + ":selltax", 0, 20).toFixed(1));
    const volatility24hPct = Number(seededInRange(seed + ":vol", 1, 80).toFixed(1));

    findings.push({
      message: `Largest single holder controls approximately ${topHolderPct}% of circulating supply.`,
      severity: topHolderPct > 40 ? "high" : topHolderPct > 20 ? "medium" : "info",
    });

    findings.push({
      message: `Transfer tax structure: ${buyTaxPct}% buy / ${sellTaxPct}% sell.`,
      severity: sellTaxPct > 10 ? "high" : sellTaxPct > 5 ? "medium" : "info",
    });

    findings.push({
      message: `24h price volatility: ${volatility24hPct}%.`,
      severity: volatility24hPct > 50 ? "high" : volatility24hPct > 25 ? "medium" : "info",
    });

    let status: AgentResult["status"] = "PASS";
    if (topHolderPct > 20 || sellTaxPct > 5 || volatility24hPct > 25) {
      status = "WARNING";
    }
    if (topHolderPct > 40 || sellTaxPct > 10) {
      status = "FAIL";
    }

    const confidence = Number(seededInRange(seed + ":confidence", 0.6, 0.93).toFixed(2));

    return { status, confidence, findings, source: "mock" };
  }
}

class LiveMarketStructureProvider implements MarketStructureProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    logger.warn("LiveMarketStructureProvider invoked but not implemented; falling back to mock.");
    return new MockMarketStructureProvider().assess(input);
  }
}

export class MarketStructureAgent implements VerificationAgent {
  readonly name = "MarketStructureAgent";
  private provider: MarketStructureProvider;

  constructor() {
    this.provider = config.flags.mockMode
      ? new MockMarketStructureProvider()
      : new LiveMarketStructureProvider();
  }

  async run(input: VerificationInput): Promise<AgentResult> {
    return this.provider.assess(input);
  }
}
