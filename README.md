# ProofDesk

**Trust verification as a service, for autonomous AI agents.**

ProofDesk is an OKX.AI Agent Service Provider (ASP). Before an autonomous
agent executes a financial action against a blockchain target (a swap, a
transfer, an approval), it calls ProofDesk and receives a **Verification
Receipt**: a signed-style, hash-verifiable JSON object describing whether
that target passed checks across contract security, liquidity, reputation,
and market structure.

```
Agent requests verification
        |
        v
ProofDesk verification engine  (4 parallel checks)
        |
        v
Verification Receipt  (PASS / FAIL / WARNING + confidence + SHA-256 hash)
        |
        v
Agent decides whether to continue or stop
```

ProofDesk runs fully **without any paid API keys** - it ships with a
deterministic, realistic mock verification mode so it's demoable and
gradeable out of the box, with clearly separated provider interfaces so
live data sources can be dropped in later.

---

## 1. Repository layout

```
proofdesk/
├── backend/                  # The ASP itself - the only service required to register
│   ├── src/
│   │   ├── index.ts          # Express app entry point
│   │   ├── config/           # env loading, DB connection
│   │   ├── routes/verify.ts  # POST /api/v1/verify (+ receipt lookup)
│   │   ├── mcp/               # MCP tool definition + /mcp/tools, /mcp/invoke
│   │   ├── verification/      # ContractSecurity / Liquidity / Reputation / MarketStructure agents + orchestrator
│   │   ├── receipts/          # ReceiptGenerator (SHA-256 hashing) + optional Mongo model
│   │   └── utils/             # logger, request validation
│   ├── asp-manifest.json     # Machine-readable service description for agent discovery
│   ├── .env.example
│   └── package.json
├── frontend/                  # Optional demo UI (not required for ASP registration)
├── docs/
│   ├── openapi.yaml
│   ├── curl-examples.md
│   ├── ProofDesk.postman_collection.json
│   └── asp-integration-guide.md
├── examples/                  # Real sample receipts (PASS / WARNING / FAIL)
├── scripts/generate-sample-receipts.js
├── render.yaml
└── README.md
```

---

## 2. Local setup

Requires Node.js 18+.

```bash
git clone <this-repo>
cd proofdesk/backend
npm install
cp .env.example .env
```

## 3. Environment setup

Open `backend/.env` and review the variables (see full descriptions in
`.env.example`). **Nothing is required to run the MVP** - if
`RPC_URL`, `GO_PLUS_API_KEY`, or `DEX_API_KEY` are missing, ProofDesk
automatically runs in **mock mode**, producing deterministic, realistic
verification data.

| Variable | Required? | Purpose |
|---|---|---|
| `PORT` | no (defaults to 4000) | HTTP port |
| `NODE_ENV` | no | `development` / `production` |
| `CORS_ORIGIN` | no | Allowed frontend origin |
| `MONGODB_URI` | no | Enables receipt persistence + lookup by ID |
| `RPC_URL` | no | Enables live on-chain checks |
| `GO_PLUS_API_KEY` | no | Enables live contract security provider |
| `DEX_API_KEY` | no | Enables live liquidity provider |
| `PRIVATE_KEY` | no | Reserved; unused in this MVP |

## 4. Running the backend

```bash
cd backend
npm run dev        # ts-node-dev, hot reload, http://localhost:4000
# or
npm run build && npm start   # production build
```

Verify it's up:

```bash
curl -s http://localhost:4000/health | jq
```

## 5. Running the frontend (optional demo UI)

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your backend URL
npm run dev             # http://localhost:5173
```

The frontend is a convenience for human judges to click through a demo.
It is **not** part of the ASP contract - agents talk to the backend
directly via REST or the MCP interface.

## 6. Render deployment

This repo includes `render.yaml` at the root, configured as a Render
Blueprint with two services:

1. `proofdesk-backend` - the ASP (Node/Express), required.
2. `proofdesk-frontend` - the optional static demo UI.

Steps:

1. Push this repo to GitHub.
2. In Render, choose **New > Blueprint** and point it at the repo.
3. Render reads `render.yaml` and provisions both services.
4. Set the optional env vars (`MONGODB_URI`, `RPC_URL`, `GO_PLUS_API_KEY`,
   `DEX_API_KEY`) on `proofdesk-backend` in the Render dashboard if you
   want live mode - otherwise leave them blank and mock mode is used.
5. Once `proofdesk-backend` has a live URL, set `VITE_API_BASE_URL` on
   `proofdesk-frontend` to that URL and redeploy the frontend.
6. Confirm `GET https://<your-backend>.onrender.com/health` returns
   `{"status":"ok", ...}`.

## 7. Connecting to OKX.AI ASP registration

ProofDesk exposes everything an A2MCP-style registry needs to discover
and call it without custom integration:

- **Manifest**: `GET /asp-manifest.json` (also served at
  `/.well-known/asp-manifest.json`) - machine-readable service
  description, tool schema, and base URLs.
- **MCP tool discovery**: `GET /mcp/tools`
- **MCP tool invocation**: `POST /mcp/invoke`
- **Plain REST**: `POST /api/v1/verify` for any agent runtime that
  prefers a direct HTTP call over the MCP envelope.

To register with OKX.AI:

1. Deploy the backend (Render steps above) and confirm `/health` and
   `/asp-manifest.json` are reachable publicly.
2. Fill in the placeholder fields in `backend/asp-manifest.json`
   (`provider.contact`, `provider.homepage`, `service.base_url`) with
   your real deployed URL.
3. Submit the manifest URL (`https://<your-backend>/asp-manifest.json`)
   to the OKX.AI ASP registry per their submission flow.
4. See `docs/asp-integration-guide.md` for exactly how a calling agent
   should invoke ProofDesk and interpret the receipt.

---

## 8. API summary

Full detail in `docs/openapi.yaml`, `docs/curl-examples.md`, and the
Postman collection at `docs/ProofDesk.postman_collection.json`.

**`POST /api/v1/verify`**

```json
// Request
{
  "target_address": "0x88e082fb2b0eab8ba553fa74b3d27409fb3fac49",
  "chain_id": 1
}
```

Returns a `VerificationReceipt` - see `examples/receipt-pass.json`,
`examples/receipt-warning.json`, and `examples/receipt-fail.json` for
real, generated examples of each verdict type.

---

## 9. Design notes

- **Modularity**: each verification dimension is an independent agent
  (`ContractSecurityAgent`, `LiquidityAgent`, `ReputationAgent`,
  `MarketStructureAgent`) behind a common `VerificationAgent` interface,
  orchestrated by `VerificationOrchestrator`. Swapping mock providers
  for live ones is a drop-in change per agent.
- **Determinism**: mock results are seeded from `(target_address,
  chain_id, agent name)`, so the same target always returns the same
  mock verdict - important for demoing and for judges re-running the
  same address.
- **Receipt integrity**: every receipt carries a SHA-256 hash over its
  canonical fields (`ReceiptGenerator.hash`), so a receiving agent can
  detect if a receipt was altered in transit.
- **Fail-safe orchestration**: if an individual agent throws, the
  orchestrator treats it as an inconclusive `WARNING` rather than
  crashing the whole request.
