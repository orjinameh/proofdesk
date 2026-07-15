# X (Twitter) Participation Post Draft

---

**Draft A (feature-forward):**

Built ProofDesk for the #OKXAIGenesis hackathon 🔍

An Agent Service Provider that gives autonomous AI agents a trust check
*before* they sign a transaction — contract security, liquidity,
reputation & market structure, returned as a hash-verifiable
Verification Receipt.

REST + MCP + machine-readable manifest, zero paid API keys required.

[link]

---

**Draft B (problem-forward):**

Agents are starting to move real money with no human in the loop.
Most have no independent way to check what they're about to touch.

ProofDesk fixes that: call it before you transact, get back a
PASS/WARN/FAIL receipt with a SHA-256 hash an agent can verify wasn't
tampered with.

Built for #OKXAIGenesis as an A2MCP Agent Service Provider.

[link]

---

**Draft C (short):**

Shipped ProofDesk for #OKXAIGenesis — a trust-verification ASP so AI
agents can check a target before they transact, not after. REST + MCP,
hash-verifiable receipts, live demo below. [link]

---

*Note: replace `[link]` with the deployed backend URL, the demo
frontend URL, and/or a short demo video link before posting. Add the
official hackathon hashtag exactly as specified in OKX.AI's submission
requirements if it differs from `#OKXAIGenesis`.*

---

# Judges' Talking Points

Use these if asked direct questions during judging.

**"Why is this an ASP and not just an API?"**
Because the entire design is agent-first: discovery via a manifest and
an MCP tool interface (not a human-facing dashboard as the primary
surface), a structured decision-ready output (verdict + confidence, not
prose), and a receipt hash so the output is something an agent can
trust and pass along, not just consume once.

**"Why mock mode — isn't that fake?"**
The verification *logic and architecture* are real and production-shaped:
four independent, swappable provider interfaces, deterministic scoring,
weighted confidence aggregation, fail-safe orchestration. What's mocked
is only the upstream data source (GoPlus / DEX APIs), which the code
explicitly detects and reports (`mode: "mock"` in every receipt — we
never hide it). Swapping in live providers is a per-agent change, not a
rewrite.

**"How do you know an agent can trust the receipt?"**
`receipt_hash` is a SHA-256 hash over the receipt's canonical fields.
Any party holding the receipt can recompute the hash locally and
confirm nothing was altered after ProofDesk issued it. It's not a
cryptographic signature (no key custody in the MVP), but the mechanism
and the field are already in place for that upgrade.

**"What happens if a verification check fails internally?"**
The orchestrator wraps every agent call — if one throws, it's treated
as an inconclusive `WARNING` rather than crashing the whole request, so
a single flaky data source degrades gracefully instead of blocking the
agent entirely.

**"What's the business model / what happens after the hackathon?"**
Out of scope for the MVP by design (see `asp-manifest.json ->
tools[0].cost`), but the architecture already separates "verification
result" from "how it's paid for," so a pay-per-verification or
subscription model can sit in front of the existing orchestrator without
touching the verification logic itself.
