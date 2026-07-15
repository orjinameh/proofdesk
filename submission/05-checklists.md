# Checklists

## Deployment Checklist

- [ ] Push repo to GitHub (public or accessible to OKX.AI reviewers)
- [ ] In Render: **New > Blueprint**, point at the repo, confirm it
      picks up `render.yaml` at the root
- [ ] Confirm `proofdesk-backend` builds (`npm install && npm run build`)
      and starts (`npm start`) without errors in the Render logs
- [ ] Set optional env vars on `proofdesk-backend` if enabling live mode
      (`MONGODB_URI`, `RPC_URL`, `GO_PLUS_API_KEY`, `DEX_API_KEY`) —
      otherwise leave blank for mock mode
- [ ] Confirm `GET https://<backend>.onrender.com/health` returns
      `{"status":"ok", ...}`
- [ ] Confirm `GET https://<backend>.onrender.com/asp-manifest.json`
      returns valid JSON
- [ ] Confirm `POST https://<backend>.onrender.com/api/v1/verify` with a
      sample body returns a full receipt
- [ ] Set `VITE_API_BASE_URL` on `proofdesk-frontend` to the backend's
      live URL, redeploy frontend
- [ ] Confirm the frontend loads and a verification run completes
      end-to-end in the browser
- [ ] Update `backend/asp-manifest.json` placeholder fields
      (`provider.contact`, `provider.homepage`, `service.base_url`) with
      real values, redeploy backend

## Registration Checklist (OKX.AI A2MCP ASP)

- [ ] Backend is publicly reachable and `/health` is green
- [ ] `/asp-manifest.json` is reachable and has no remaining
      `REPLACE_WITH_...` placeholders
- [ ] `GET /mcp/tools` returns the `proofdesk_verify_target` tool
      definition matching the manifest
- [ ] `POST /mcp/invoke` successfully returns a receipt for a valid
      sample input
- [ ] Submit the manifest URL to the OKX.AI ASP registry per their
      current submission flow (check OKX.AI's docs for the latest
      process, since this can change)
- [ ] Confirm the Agent ID assigned by OKX.AI is recorded somewhere
      accessible to the team (intentionally not included in this
      generated submission package — add it once issued)
- [ ] Re-test discovery + invocation from the registry side once
      registered, if OKX.AI provides a sandbox/test-call feature

## Environment Variable Checklist

Backend (`backend/.env`):

- [ ] `PORT` — set or left default (4000)
- [ ] `NODE_ENV` — `production` on Render, `development` locally
- [ ] `CORS_ORIGIN` — set to the deployed frontend URL (or `*` for the
      hackathon demo)
- [ ] `MONGODB_URI` — set only if persistence/receipt-lookup is desired
- [ ] `RPC_URL` — set only if enabling live on-chain checks
- [ ] `GO_PLUS_API_KEY` — set only if enabling live contract security
- [ ] `DEX_API_KEY` — set only if enabling live liquidity data
- [ ] `PRIVATE_KEY` — leave blank; unused in this MVP
- [ ] Confirm `.env` is in `.gitignore` and was never committed

Frontend (`frontend/.env`):

- [ ] `VITE_API_BASE_URL` — points at the deployed backend

## Testing Checklist

- [ ] `GET /health` → `200`, `status: "ok"`
- [ ] `POST /api/v1/verify` with a valid address/chain → `200`, full
      receipt with `verdict`, `confidence_score`, `checks`, `receipt_hash`
- [ ] `POST /api/v1/verify` with an invalid address (e.g. `"not-an-address"`)
      → `400` with `details` explaining why
- [ ] `POST /api/v1/verify` with a missing `chain_id` → `400`
- [ ] Same `target_address` + `chain_id` called twice → identical
      `verdict` and `checks` (determinism check)
- [ ] `GET /mcp/tools` → `200`, returns `proofdesk_verify_target`
- [ ] `POST /mcp/invoke` with a valid tool name/input → `200`, receipt
      under `output`
- [ ] `POST /mcp/invoke` with an unknown tool name → `400`,
      `error: "unknown_tool"`
- [ ] `GET /asp-manifest.json` → `200`, valid JSON, schema matches
      `/mcp/tools` output
- [ ] `GET /api/v1/receipts/:id` without `MONGODB_URI` set → `501`
- [ ] `GET /api/v1/receipts/:id` with `MONGODB_URI` set, after a prior
      verify call → `200` with the stored receipt
- [ ] Recompute `receipt_hash` locally (per
      `docs/asp-integration-guide.md`) and confirm it matches for at
      least one receipt
- [ ] Frontend: submit a valid address, confirm the verdict stamp and
      four check cards render
- [ ] Frontend: submit an invalid address, confirm inline validation
      blocks submission before hitting the API
