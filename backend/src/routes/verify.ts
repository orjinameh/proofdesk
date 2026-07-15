import { Router, Request, Response } from "express";
import { VerificationOrchestrator } from "../verification/VerificationOrchestrator";
import { ReceiptGenerator } from "../receipts/ReceiptGenerator";
import { ReceiptModel } from "../receipts/ReceiptModel";
import { config } from "../config/env";
import { logger } from "../utils/logger";
import { validateVerifyRequest } from "../utils/validation";

const router = Router();
const orchestrator = new VerificationOrchestrator();
const receiptGenerator = new ReceiptGenerator();

/**
 * POST /api/v1/verify
 *
 * Main ProofDesk entry point. An autonomous agent (or a human via the
 * demo frontend) calls this before executing a financial action
 * against `target_address`, and receives a signed-style Verification
 * Receipt back that it can use to decide whether to proceed.
 */
router.post("/verify", async (req: Request, res: Response) => {
  const validation = validateVerifyRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      provider: "ProofDesk",
      error: "invalid_request",
      details: validation.errors,
    });
  }

  const { target_address, chain_id, transaction_payload } = req.body as {
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

    if (config.flags.persistenceEnabled) {
      ReceiptModel.create(receipt).catch((err) => {
        logger.error("Failed to persist receipt", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    logger.info("Verification complete", {
      receipt_id: receipt.receipt_id,
      verdict: receipt.verdict,
      target: target_address,
    });

    return res.status(200).json(receipt);
  } catch (err) {
    logger.error("Verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(500).json({
      provider: "ProofDesk",
      error: "verification_failed",
      message: "An unexpected error occurred while running verification checks.",
    });
  }
});

/**
 * GET /api/v1/receipts/:receiptId
 *
 * Optional lookup endpoint - only functional when MongoDB persistence
 * is enabled. Lets an agent (or judge) re-fetch a previously issued
 * receipt by ID and independently verify its hash.
 */
router.get("/receipts/:receiptId", async (req: Request, res: Response) => {
  if (!config.flags.persistenceEnabled) {
    return res.status(501).json({
      provider: "ProofDesk",
      error: "persistence_disabled",
      message: "Receipt lookup requires MONGODB_URI to be configured.",
    });
  }

  const receipt = await ReceiptModel.findOne({ receipt_id: req.params.receiptId }).lean();
  if (!receipt) {
    return res.status(404).json({ provider: "ProofDesk", error: "not_found" });
  }

  return res.status(200).json(receipt);
});

export default router;
