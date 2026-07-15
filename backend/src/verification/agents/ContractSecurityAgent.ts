import { config } from "../../config/env";
import { logger } from "../../utils/logger";
import { seededFloat, seededInRange } from "../mockUtils";
import { AgentFinding, AgentResult, VerificationAgent, VerificationInput } from "../types";

/**
 * ContractSecurityAgent
 *
 * Responsible for assessing the smart-contract-level risk of a target
 * address: ownership renouncement, mint functions, honeypot patterns,
 * proxy/upgradeability risk, verified source availability, etc.
 *
 * Live mode (when GO_PLUS_API_KEY + RPC_URL are configured) would call
 * a provider such as GoPlus Security. This MVP ships a realistic mock
 * provider so the service is fully demoable without paid keys, with a
 * clearly separated interface so swapping in a live provider later is
 * a drop-in change.
 */

interface ContractSecurityProvider {
  assess(input: VerificationInput): Promise<AgentResult>;
}

class MockContractSecurityProvider implements ContractSecurityProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    const seed = `contract_security:${input.targetAddress}:${input.chainId}`;
    const riskRoll = seededFloat(seed);
    const findings: AgentFinding[] = [];

    const ownershipRenounced = riskRoll > 0.35;
    const hasMintFunction = riskRoll < 0.2;
    const isProxy = seededFloat(seed + ":proxy") < 0.15;
    const sourceVerified = seededFloat(seed + ":verified") > 0.1;

    findings.push({
      message: ownershipRenounced
        ? "Contract ownership has been renounced or is held by a null address."
        : "Contract ownership is retained by an externally owned account.",
      severity: ownershipRenounced ? "info" : "medium",
    });

    if (hasMintFunction) {
      findings.push({
        message: "An unrestricted mint function was detected in the contract bytecode.",
        severity: "high",
      });
    }

    if (isProxy) {
      findings.push({
        message: "Contract is upgradeable via a proxy pattern; logic can change post-deployment.",
        severity: "medium",
      });
    }

    findings.push({
      message: sourceVerified
        ? "Source code is verified and matches deployed bytecode."
        : "Source code is not verified on the block explorer.",
      severity: sourceVerified ? "info" : "medium",
    });

    let status: AgentResult["status"] = "PASS";
    if (hasMintFunction || !sourceVerified) {
      status = "WARNING";
    }
    if (hasMintFunction && !ownershipRenounced) {
      status = "FAIL";
    }

    const confidence = Number(seededInRange(seed + ":confidence", 0.72, 0.97).toFixed(2));

    return { status, confidence, findings, source: "mock" };
  }
}

class LiveContractSecurityProvider implements ContractSecurityProvider {
  async assess(input: VerificationInput): Promise<AgentResult> {
    // Placeholder for a real integration (e.g. GoPlus Security API) using
    // config.goPlusApiKey and config.rpcUrl. Not implemented in this MVP.
    logger.warn("LiveContractSecurityProvider invoked but not implemented; falling back to mock.");
    return new MockContractSecurityProvider().assess(input);
  }
}

export class ContractSecurityAgent implements VerificationAgent {
  readonly name = "ContractSecurityAgent";
  private provider: ContractSecurityProvider;

  constructor() {
    this.provider = config.flags.mockMode
      ? new MockContractSecurityProvider()
      : new LiveContractSecurityProvider();
  }

  async run(input: VerificationInput): Promise<AgentResult> {
    return this.provider.assess(input);
  }
}
