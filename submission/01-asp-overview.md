# ProofDesk — OKX.AI Genesis Hackathon Submission

## ASP Name
**ProofDesk**

## Short Description (for registry listing, ~1 sentence)
ProofDesk is a trust-verification Agent Service Provider that issues
hash-verifiable Verification Receipts for blockchain targets, so
autonomous agents can decide whether to proceed with a financial action
before they sign anything.

## Full ASP Description

Autonomous agents are increasingly trusted to move real value —
swapping tokens, approving spenders, sending funds — often with no human
in the loop at the moment of execution. The weak point in that pipeline
isn't the agent's reasoning, it's the fact that the agent usually has no
independent, structured way to check whether the thing it's about to
interact with is safe.

ProofDesk closes that gap. It's a machine-to-machine service: an agent
calls ProofDesk with a target address and chain ID *before* it executes
a transaction, and gets back a **Verification Receipt** — a structured,
hash-verifiable JSON object with a `PASS` / `WARNING` / `FAIL` verdict,
a confidence score, and a breakdown across four independent checks:

- **Contract security** — ownership, mint functions, proxy/upgrade risk, source verification
- **Liquidity** — pool depth, lock status, slippage
- **Reputation** — address age, transaction history, blocklist matches
- **Market structure** — holder concentration, buy/sell tax, volatility

Every receipt is hashed (SHA-256) over its canonical fields, so a
receiving agent — or a downstream auditor — can detect tampering.
ProofDesk exposes itself three ways so any agent runtime can use it
without custom integration: plain REST (`POST /api/v1/verify`), an
MCP-compatible tool interface (`GET /mcp/tools`, `POST /mcp/invoke`),
and a machine-readable ASP manifest (`/asp-manifest.json`) for registry
discovery.

The MVP runs entirely on deterministic, realistic mock data — no paid
API keys required — with a clean provider-interface separation so live
data sources (GoPlus Security, a DEX liquidity API, an RPC endpoint)
are a drop-in swap, not a rewrite.

## A2MCP Service Description

```
Protocol: A2MCP
Service:  ProofDesk
Category: trust-verification
Tool:     proofdesk_verify_target
Input:    { target_address: string, chain_id: number, transaction_payload?: string }
Output:   Verification Receipt (verdict, confidence_score, checks, receipt_hash)
Discovery: GET /asp-manifest.json, GET /mcp/tools
Invoke:    POST /mcp/invoke  { "tool": "proofdesk_verify_target", "input": {...} }
Auth:      none (hackathon MVP)
Cost:      free during hackathon
```

Full manifest: `backend/asp-manifest.json`.
Full tool schema: `backend/src/mcp/toolDefinition.ts`.

## Feature List

- `POST /api/v1/verify` — REST endpoint returning a Verification Receipt
- `GET /mcp/tools` / `POST /mcp/invoke` — MCP-compatible tool interface
- `GET /asp-manifest.json` — machine-readable ASP manifest for registry discovery
- Four independent, modular verification agents behind a common interface
- `VerificationOrchestrator` — parallel execution, weighted confidence scoring, fail-safe error handling
- `ReceiptGenerator` — deterministic, SHA-256-hashed Verification Receipts
- Optional MongoDB persistence + receipt lookup by ID (`GET /api/v1/receipts/:id`)
- Zero-paid-API mock mode with deterministic, realistic results (auto-detected from missing env vars)
- Structured JSON logging, centralized error handling, input validation
- OpenAPI spec, Postman collection, curl examples, real generated sample receipts
- Optional React demo frontend for human-facing walkthroughs
- Render Blueprint (`render.yaml`) for one-click deployment

## Architecture Overview

```
                 ┌────────────────────────────┐
Agent / Judge -> │  REST  /api/v1/verify        │
                 │  MCP   /mcp/tools, /invoke   │─┐
                 │  Manifest /asp-manifest.json │ │
                 └───────────────┬──────────────┘ │
                                 v                 │
                  ┌─────────────────────────┐      │
                  │ VerificationOrchestrator │<─────┘
                  └─────────────┬────────────┘
           ┌─────────┬──────────┼──────────┬─────────┐
           v          v          v          v
   ContractSecurity Liquidity Reputation MarketStructure
       Agent          Agent      Agent        Agent
   (mock/live)     (mock/live) (mock/live)  (mock/live)
           └─────────┴──────────┴──────────┴─────────┘
                                 v
                       ReceiptGenerator
                     (SHA-256 hashed JSON)
                                 v
                     Verification Receipt
                   (returned to caller;
                    optionally persisted
                    to MongoDB)
```

Each agent implements the same `VerificationAgent` interface
(`{ run(input) => { status, confidence, findings, source } }`) and
selects a mock or live provider at construction time based on which
environment variables are configured — the orchestrator and routes
never know which mode is active.

## Example Verification Workflow

1. An agent is about to swap into token `0x88e0...ac49` on Ethereum
   mainnet (`chain_id: 1`).
2. It calls `POST /api/v1/verify` (or the MCP `proofdesk_verify_target`
   tool) with that address and chain ID.
3. ProofDesk runs all four checks in parallel (~sub-second, since mock
   mode has no external network calls).
4. ProofDesk returns a receipt: `verdict: "PASS"`, `confidence_score:
   0.79`, with per-check details (see `examples/receipt-pass.json`).
5. The agent's policy is "proceed on PASS, ask a human on WARNING, abort
   on FAIL" — it proceeds with the swap.
6. If the agent later needs to prove it checked, it can present the
   receipt plus its `receipt_hash`; anyone can recompute the hash to
   confirm the receipt wasn't altered.

See `docs/asp-integration-guide.md` for the full calling contract and
decision-policy guidance, and `examples/` for real generated receipts
covering all three verdict types.
