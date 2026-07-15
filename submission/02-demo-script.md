# Demo Walkthrough & 90-Second Demo Script

## Demo Walkthrough (for a live judging session, ~3-4 min)

**Setup (before judges arrive):**
- Backend deployed on Render, `/health` returning `{"status":"ok"}`.
- Frontend deployed and pointed at the backend.
- Terminal window ready with `docs/curl-examples.md` open.

**Walkthrough:**

1. **Frame the problem (15s).** "Autonomous agents move real value, but
   most have no independent way to check what they're about to interact
   with. ProofDesk is that check — a trust-verification service built
   for agents to call, not humans."

2. **Show the manifest (15s).** Open
   `https://<backend>/asp-manifest.json` in a browser. "This is how an
   agent — or the OKX.AI registry — discovers ProofDesk automatically:
   the tool name, its input/output schema, all machine-readable."

3. **Show MCP discovery (15s).**
   `curl https://<backend>/mcp/tools | jq` — point out the tool
   definition matches the manifest exactly.

4. **Run a live verification (30s).** In the frontend: paste a sample
   address, pick Ethereum, click "Run verification." Narrate the
   verdict stamp and the four check cards as they render. "PASS,
   WARNING, and FAIL are all real, deterministic outcomes — not random
   — so the same address always gives the same receipt."

5. **Show the receipt hash (15s).** Point at `receipt_hash` in the UI.
   "Every receipt is SHA-256 hashed over its fields, so a receiving
   agent can verify it wasn't tampered with in transit — this is the
   difference between a plain API response and something an agent can
   actually treat as a trust artifact."

6. **Close (10s).** "It runs with zero paid API keys today, in
   deterministic mock mode, but every provider interface is already
   separated so live data sources are a drop-in swap, not a rewrite."

---

## 90-Second Demo Script (recorded / stage version)

> Autonomous agents are starting to move real money — swaps, approvals,
> transfers — often with no human watching the moment it happens. The
> problem is: most agents have no independent way to check whether the
> thing they're about to interact with is actually safe.
>
> That's what ProofDesk does. It's an Agent Service Provider — a
> service built to be called by other AI agents, not by people. Before
> an agent executes a financial action, it calls ProofDesk with a
> target address, and gets back a Verification Receipt.
>
> [show the frontend / curl call]
>
> That receipt runs four independent checks — contract security,
> liquidity, reputation, and market structure — and comes back with a
> verdict: pass, fail, or warning, plus a confidence score, plus a
> SHA-256 hash over the whole thing so any agent that receives this
> receipt can verify it hasn't been tampered with.
>
> [point at verdict stamp and hash]
>
> ProofDesk speaks three languages so any agent can use it: plain REST,
> an MCP-compatible tool interface, and a machine-readable manifest for
> registry discovery — that's this file right here, which is exactly
> what an A2MCP registry like OKX.AI's needs to find and call it
> automatically.
>
> [show /asp-manifest.json]
>
> It runs today on realistic, deterministic mock data with zero paid
> API keys, but every verification agent behind it — security,
> liquidity, reputation, market structure — is built as an independent
> module with a live-provider interface already defined, so plugging in
> real data sources post-hackathon is a drop-in change.
>
> ProofDesk — trust verification, built for agents to call each other.
