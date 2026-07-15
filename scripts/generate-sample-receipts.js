/**
 * generate-sample-receipts.js
 *
 * Standalone (dependency-free) script that mirrors the exact logic in
 * src/verification/* and src/receipts/ReceiptGenerator.ts, so we can
 * produce real, accurate example receipts for documentation without
 * needing to boot the full server. If you change the TypeScript
 * verification logic, update this file to match.
 */
const crypto = require("crypto");

function seededFloat(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest("hex");
  const slice = hash.slice(0, 8);
  const intVal = parseInt(slice, 16);
  return intVal / 0xffffffff;
}
function seededInRange(seed, min, max) {
  return min + seededFloat(seed) * (max - min);
}

function contractSecurity(addr, chainId) {
  const seed = `contract_security:${addr}:${chainId}`;
  const riskRoll = seededFloat(seed);
  const findings = [];
  const ownershipRenounced = riskRoll > 0.35;
  const hasMintFunction = riskRoll < 0.2;
  const isProxy = seededFloat(seed + ":proxy") < 0.15;
  const sourceVerified = seededFloat(seed + ":verified") > 0.1;

  findings.push(ownershipRenounced
    ? "Contract ownership has been renounced or is held by a null address."
    : "Contract ownership is retained by an externally owned account.");
  if (hasMintFunction) findings.push("An unrestricted mint function was detected in the contract bytecode.");
  if (isProxy) findings.push("Contract is upgradeable via a proxy pattern; logic can change post-deployment.");
  findings.push(sourceVerified
    ? "Source code is verified and matches deployed bytecode."
    : "Source code is not verified on the block explorer.");

  let status = "PASS";
  if (hasMintFunction || !sourceVerified) status = "WARNING";
  if (hasMintFunction && !ownershipRenounced) status = "FAIL";
  const confidence = Number(seededInRange(seed + ":confidence", 0.72, 0.97).toFixed(2));
  return { status, confidence, findings };
}

function liquidity(addr, chainId) {
  const seed = `liquidity:${addr}:${chainId}`;
  const findings = [];
  const liquidityUsd = Math.round(seededInRange(seed + ":usd", 500, 4500000));
  const liquidityLocked = seededFloat(seed + ":locked") > 0.3;
  const lockDurationDays = liquidityLocked ? Math.round(seededInRange(seed + ":lockdays", 30, 720)) : 0;
  const slippageEstimatePct = Number(seededInRange(seed + ":slippage", 0.1, 12).toFixed(2));

  findings.push(`Estimated pooled liquidity: $${liquidityUsd.toLocaleString("en-US")}.`);
  findings.push(liquidityLocked
    ? `Liquidity appears locked for approximately ${lockDurationDays} days.`
    : "No liquidity lock detected; liquidity could be pulled at any time.");
  findings.push(`Estimated slippage on a representative trade size: ${slippageEstimatePct}%.`);

  let status = "PASS";
  if (liquidityUsd < 50000 || slippageEstimatePct > 3) status = "WARNING";
  if (liquidityUsd < 5000 || !liquidityLocked) status = liquidityUsd < 5000 ? "FAIL" : "WARNING";
  const confidence = Number(seededInRange(seed + ":confidence", 0.65, 0.95).toFixed(2));
  return { status, confidence, findings };
}

function reputation(addr, chainId) {
  const seed = `reputation:${addr}:${chainId}`;
  const findings = [];
  const addressAgeDays = Math.round(seededInRange(seed + ":age", 1, 900));
  const knownBlocklistHit = seededFloat(seed + ":blocklist") < 0.08;
  const txCount = Math.round(seededInRange(seed + ":txcount", 5, 50000));
  const uniqueCounterparties = Math.round(seededInRange(seed + ":counterparties", 2, 5000));

  findings.push(`Address first observed approximately ${addressAgeDays} days ago.`);
  findings.push(`${txCount.toLocaleString("en-US")} historical transactions across ${uniqueCounterparties.toLocaleString("en-US")} unique counterparties.`);
  findings.push(knownBlocklistHit
    ? "Address matches an entry on a known scam / phishing blocklist aggregator."
    : "No matches found against known scam or phishing blocklists.");

  let status = "PASS";
  if (addressAgeDays < 7 || txCount < 20) status = "WARNING";
  if (knownBlocklistHit) status = "FAIL";
  const confidence = Number(seededInRange(seed + ":confidence", 0.55, 0.9).toFixed(2));
  return { status, confidence, findings };
}

function marketStructure(addr, chainId) {
  const seed = `market_structure:${addr}:${chainId}`;
  const findings = [];
  const topHolderPct = Number(seededInRange(seed + ":topholder", 1, 65).toFixed(1));
  const buyTaxPct = Number(seededInRange(seed + ":buytax", 0, 15).toFixed(1));
  const sellTaxPct = Number(seededInRange(seed + ":selltax", 0, 20).toFixed(1));
  const volatility24hPct = Number(seededInRange(seed + ":vol", 1, 80).toFixed(1));

  findings.push(`Largest single holder controls approximately ${topHolderPct}% of circulating supply.`);
  findings.push(`Transfer tax structure: ${buyTaxPct}% buy / ${sellTaxPct}% sell.`);
  findings.push(`24h price volatility: ${volatility24hPct}%.`);

  let status = "PASS";
  if (topHolderPct > 20 || sellTaxPct > 5 || volatility24hPct > 25) status = "WARNING";
  if (topHolderPct > 40 || sellTaxPct > 10) status = "FAIL";
  const confidence = Number(seededInRange(seed + ":confidence", 0.6, 0.93).toFixed(2));
  return { status, confidence, findings };
}

const STATUS_WEIGHT = { PASS: 1, WARNING: 0.5, FAIL: 0 };

function orchestrate(addr, chainId) {
  const cs = contractSecurity(addr, chainId);
  const lq = liquidity(addr, chainId);
  const rp = reputation(addr, chainId);
  const ms = marketStructure(addr, chainId);
  const results = [cs, lq, rp, ms];

  const verdict = results.some(r => r.status === "FAIL") ? "FAIL"
    : results.some(r => r.status === "WARNING") ? "WARNING" : "PASS";

  const weighted = results.map(r => r.confidence * STATUS_WEIGHT[r.status]);
  const confidence_score = Number(Math.max(0, Math.min(1, weighted.reduce((a, b) => a + b, 0) / weighted.length)).toFixed(2));

  const checks = {
    contract_security: { status: cs.status, details: cs.findings },
    liquidity: { status: lq.status, details: lq.findings },
    reputation: { status: rp.status, details: rp.findings },
    market_structure: { status: ms.status, details: ms.findings },
  };

  return { checks, confidence_score, verdict };
}

function buildReceipt(addr, chainId, receiptIdSeed, timestamp) {
  const { checks, confidence_score, verdict } = orchestrate(addr, chainId);
  const receipt_id = `pd_${receiptIdSeed}`;
  const core = {
    provider: "ProofDesk",
    receipt_id,
    timestamp,
    target_address: addr,
    chain_id: chainId,
    verdict,
    confidence_score,
    checks,
    mode: "mock",
  };
  const canonical = JSON.stringify(core, Object.keys(core).sort());
  const receipt_hash = crypto.createHash("sha256").update(canonical).digest("hex");
  return { ...core, receipt_hash };
}

// Three addresses chosen (via brute-force search over the deterministic
// mock logic) to land on PASS, WARNING, and FAIL respectively, so the
// sample set demonstrates all three verdict types.
const samples = [
  { label: "pass", addr: "0x88e082fb2b0eab8ba553fa74b3d27409fb3fac49", chainId: 1 },
  { label: "warning", addr: "0x581624a116f565a62844e24070365372b43527af", chainId: 1 },
  { label: "fail", addr: "0x0de4bf8ed54bbd167495522b71b48a7e37b0d933", chainId: 1 },
];

const fixedTimestamp = "2026-07-16T12:00:00.000Z";
const results = {};
for (const s of samples) {
  const r = buildReceipt(s.addr, s.chainId, s.label + "-sample-0000", fixedTimestamp);
  results[s.label] = r;
}
console.log(JSON.stringify(results, null, 2));
