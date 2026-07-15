import { Router, Request, Response } from "express";
import { proofDeskToolDefinition } from "./toolDefinition";
import { VerificationOrchestrator } from "../verification/VerificationOrchestrator";
import { ReceiptGenerator } from "../receipts/ReceiptGenerator";
import { validateVerifyRequest } from "../utils/validation";
import { logger } from "../utils/logger";

const router = Router();
const orchestrator = new VerificationOrchestrator();
const receiptGenerator = new ReceiptGenerator();

/**
 * GET /mcp/tools
 *
 * Standard MCP-style tool discovery endpoint. An agent runtime (or the
 * OKX.AI ASP registry) can call this to learn what ProofDesk offers
 * and how to call it, without any out-of-band documentation.
 */
router.get("/tools", (_req: Request, res: Response) => {
  res.status(200).json({ tools: [proofDeskToolDefinition] });
});

/**
 * POST /mcp/invoke
 *
 * Generic MCP-style tool invocation endpoint. Body shape:
 * { "tool": "proofdesk_verify_target", "input": { ...VerificationInput } }
 *
 * This mirrors the same underlying logic as POST /api/v1/verify but
 * speaks the MCP "tool" envelope, which is what most MCP client
 * runtimes expect when calling a registered tool by name.
 */
router.post("/invoke", async (req: Request, res: Response) => {
  const { tool, input } = req.body as { tool?: string; input?: unknown };

  if (tool !== proofDeskToolDefinition.name) {
    return res.status(400).json({
      error: "unknown_tool",
      message: `This server only exposes the "${proofDeskToolDefinition.name}" tool.`,
    });
  }

  const validation = validateVerifyRequest(input);
  if (!validation.valid) {
    return res.status(400).json({ error: "invalid_input", details: validation.errors });
  }

  const { target_address, chain_id, transaction_payload } = input as {
    target_address: string;
    chain_id: number;
    transaction_payload?: string;
  };

  try {
    const { checks, confidence_score, verdict, mode } = await orchestrator.runAll({
      targetAddress: target_address,
      chainId: chain_id,
      transactionPayload: transaction_payload,
    });

    const receipt = receiptGenerator.build({
      targetAddress: target_address,
      chainId: chain_id,
      checks,
      confidenceScore: confidence_score,
      verdict,
      mode,
    });

    return res.status(200).json({ tool: proofDeskToolDefinition.name, output: receipt });
  } catch (err) {
    logger.error("MCP tool invocation failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(500).json({ error: "tool_invocation_failed" });
  }
});

export default router;
