/**
 * MCP-compatible tool definition for ProofDesk.
 *
 * This describes ProofDesk as a callable tool in the Model Context
 * Protocol shape, so any MCP-aware agent runtime (or an OKX.AI Agent
 * Service Provider registration) can introspect and invoke it without
 * custom integration work.
 */
export const proofDeskToolDefinition = {
  name: "proofdesk_verify_target",
  description:
    "Verify a blockchain target before an autonomous agent executes a financial action. " +
    "Returns a Verification Receipt with a PASS/FAIL/WARNING verdict, a confidence score, " +
    "and a breakdown across contract security, liquidity, reputation, and market structure checks.",
  input_schema: {
    type: "object",
    properties: {
      target_address: {
        type: "string",
        description: "The EVM-style contract or wallet address to verify (0x-prefixed, 40 hex chars).",
      },
      chain_id: {
        type: "number",
        description: "EVM chain ID the target lives on (e.g. 1 for Ethereum mainnet).",
      },
      transaction_payload: {
        type: "string",
        description:
          "Optional raw or encoded transaction payload the calling agent intends to submit, " +
          "used for additional context by future live checks.",
      },
    },
    required: ["target_address", "chain_id"],
  },
  output_schema: {
    type: "object",
    description: "A ProofDesk Verification Receipt.",
    properties: {
      provider: { type: "string", const: "ProofDesk" },
      receipt_id: { type: "string" },
      timestamp: { type: "string", format: "date-time" },
      target_address: { type: "string" },
      chain_id: { type: "number" },
      verdict: { type: "string", enum: ["PASS", "FAIL", "WARNING"] },
      confidence_score: { type: "number", minimum: 0, maximum: 1 },
      checks: {
        type: "object",
        properties: {
          contract_security: { type: "object" },
          liquidity: { type: "object" },
          reputation: { type: "object" },
          market_structure: { type: "object" },
        },
      },
      receipt_hash: { type: "string" },
      mode: { type: "string", enum: ["mock", "live", "mixed"] },
    },
  },
};
