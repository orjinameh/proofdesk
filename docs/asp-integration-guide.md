# ProofDesk - ASP Integration Guide

This document explains, concretely, how another autonomous AI agent
should call ProofDesk before executing a financial action, and how it
should interpret the response.

## 1. When to call ProofDesk

Call ProofDesk **before** submitting any transaction that sends value to,
or interacts with, a target address the agent has not already verified in
this session:

- Before a token swap, to verify the token contract being bought.
- Before approving a spender contract.
- Before sending funds to a wallet address supplied by a user or by
  another agent.

## 2. Two ways to call it

### Option A - Plain REST (simplest, works with any HTTP-capable agent)

```
POST https://<proofdesk-host>/api/v1/verify
Content-Type: application/json

{
  "target_address": "0x88e082fb2b0eab8ba553fa74b3d27409fb3fac49",
  "chain_id": 1,
  "transaction_payload": "0x..."   // optional
}
```

### Option B - MCP tool envelope (for MCP-native agent runtimes)

First discover the tool:

```
GET https://<proofdesk-host>/mcp/tools
```

This returns the `proofdesk_verify_target` tool definition (name,
description, JSON input/output schema) - an MCP client can register this
directly without hardcoding anything about ProofDesk.

Then invoke it:

```
POST https://<proofdesk-host>/mcp/invoke
Content-Type: application/json

{
  "tool": "proofdesk_verify_target",
  "input": {
    "target_address": "0x88e082fb2b0eab8ba553fa74b3d27409fb3fac49",
    "chain_id": 1
  }
}
```

The response wraps the same Verification Receipt under `output`.

## 3. Interpreting the receipt

```json
{
  "provider": "ProofDesk",
  "receipt_id": "pd_...",
  "timestamp": "2026-07-16T12:00:00.000Z",
  "target_address": "0x...",
  "chain_id": 1,
  "verdict": "PASS",
  "confidence_score": 0.79,
  "checks": {
    "contract_security": { "status": "PASS", "details": [ "..." ] },
    "liquidity": { "status": "PASS", "details": [ "..." ] },
    "reputation": { "status": "PASS", "details": [ "..." ] },
    "market_structure": { "status": "PASS", "details": [ "..." ] }
  },
  "receipt_hash": "..."
}
```

Recommended agent decision policy:

| `verdict` | Recommended agent behavior |
|---|---|
| `PASS` | Proceed with the action. |
| `WARNING` | Proceed only if the agent's own risk tolerance allows it, or surface the specific `checks[*].details` to a human for confirmation before proceeding. |
| `FAIL` | Do not proceed. Surface the failing check(s) to the user/operator. |

Also consider `confidence_score` (0-1): a `WARNING` with a low confidence
score is a weaker signal than one with a high confidence score, and
agents with configurable risk thresholds may want to gate on both fields
together, e.g. `verdict !== "FAIL" && confidence_score >= 0.6`.

## 4. Verifying receipt integrity

Every receipt includes `receipt_hash`, a SHA-256 hash computed over the
receipt's core fields (everything except the hash itself, keys sorted).
An agent that stores or forwards a receipt can recompute this hash to
detect tampering:

```js
const crypto = require("crypto");
function verifyReceipt(receipt) {
  const { receipt_hash, ...core } = receipt;
  const canonical = JSON.stringify(core, Object.keys(core).sort());
  const recomputed = crypto.createHash("sha256").update(canonical).digest("hex");
  return recomputed === receipt_hash;
}
```

## 5. Error handling

| HTTP status | Meaning | Agent should |
|---|---|---|
| `400` | Invalid `target_address` / `chain_id` | Fix the request; do not treat as a verification result. |
| `500` | ProofDesk failed unexpectedly | Retry with backoff; if it persists, do not proceed with the underlying financial action (treat as inconclusive, not as PASS). |
| `501` (on `/api/v1/receipts/:id`) | Persistence not enabled on this deployment | Expected on deployments without `MONGODB_URI`; not an error condition. |

## 6. Mock vs. live mode

Every receipt's `mode` field is one of `mock`, `live`, or `mixed`. During
the hackathon, ProofDesk runs in `mock` mode (deterministic, realistic
simulated data, since no paid provider keys are configured). Agents
should treat `mock` mode as a fully valid verification result for demo
purposes, but a production deployment intended for real financial
decisions should run with `RPC_URL`, `GO_PLUS_API_KEY`, and
`DEX_API_KEY` configured so `mode` reports `live`.
