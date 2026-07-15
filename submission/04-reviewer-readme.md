# ProofDesk — Reviewer README

*This is a condensed, judge-facing version of the full README. For
complete setup detail see the root `README.md`.*

## What this is

An OKX.AI Agent Service Provider: a trust-verification service that
autonomous agents call before executing a financial action against a
blockchain target. Returns a hash-verifiable Verification Receipt with
a PASS/WARNING/FAIL verdict.

## Fastest way to evaluate this submission

1. **No setup needed** — read three real, generated example receipts:
   `examples/receipt-pass.json`, `examples/receipt-warning.json`,
   `examples/receipt-fail.json`.
2. **Or run it locally in under 2 minutes:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   curl -s -X POST http://localhost:4000/api/v1/verify \
     -H "Content-Type: application/json" \
     -d '{"target_address":"0x88e082fb2b0eab8ba553fa74b3d27409fb3fac49","chain_id":1}' | jq
   ```
   No API keys required — this runs in deterministic mock mode
   automatically.
3. **Or check the deployed instance** (once live): `GET
   https://<deployed-backend>/health` and `/asp-manifest.json`.

## Where to look in the code

| What | Where |
|---|---|
| Main verify endpoint | `backend/src/routes/verify.ts` |
| MCP tool interface | `backend/src/mcp/mcpRoutes.ts`, `backend/src/mcp/toolDefinition.ts` |
| Verification agents (4, modular) | `backend/src/verification/agents/` |
| Orchestration + scoring | `backend/src/verification/VerificationOrchestrator.ts` |
| Receipt generation + hashing | `backend/src/receipts/ReceiptGenerator.ts` |
| ASP manifest (agent discovery) | `backend/asp-manifest.json` |
| Env config + mock-mode detection | `backend/src/config/env.ts` |

## What to check for quality

- **Modularity**: 4 independent verification agents behind one shared
  interface (`VerificationAgent`), each with a separated mock/live
  provider implementation.
- **Determinism**: the same `(target_address, chain_id)` always returns
  the same mock verdict — verify this by calling `/api/v1/verify` twice
  with the same address.
- **Integrity**: `receipt_hash` is a real SHA-256 hash over canonical
  receipt fields — recompute it yourself (see
  `docs/asp-integration-guide.md` section 4) to confirm it's not
  decorative.
- **Fail-safety**: `VerificationOrchestrator.safeRun` catches individual
  agent failures and degrades to `WARNING` instead of a 500.
- **Zero-dependency demoability**: no paid API keys anywhere in the
  request path for mock mode; `config.flags.mockMode` is derived, not
  hardcoded.

## Full documentation index

- `README.md` — full setup, deployment, and design notes
- `docs/asp-integration-guide.md` — exactly how a calling agent should
  use ProofDesk and interpret responses
- `docs/openapi.yaml` — full REST API spec
- `docs/curl-examples.md` — copy-pasteable requests
- `docs/ProofDesk.postman_collection.json` — importable Postman collection
- `examples/` — real generated sample receipts
- `submission/` — this hackathon submission package
