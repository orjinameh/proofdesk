import { VerificationReceipt } from "../api";

const VERDICT_LABEL: Record<string, string> = {
  PASS: "PASS",
  WARNING: "WARNING",
  FAIL: "FAIL",
};

function StatusPill({ status }: { status: "PASS" | "FAIL" | "WARNING" }) {
  return <span className={`pill pill-${status.toLowerCase()}`}>{status}</span>;
}

const CHECK_LABELS: Record<string, string> = {
  contract_security: "Contract security",
  liquidity: "Liquidity",
  reputation: "Reputation",
  market_structure: "Market structure",
};

export function ReceiptDisplay({ receipt }: { receipt: VerificationReceipt }) {
  return (
    <div className="receipt">
      <div className={`verdict-stamp verdict-stamp-${receipt.verdict.toLowerCase()}`}>
        {VERDICT_LABEL[receipt.verdict]}
      </div>

      <div className="receipt-meta">
        <div>
          <span className="field-label">receipt_id</span>
          <div className="mono-value">{receipt.receipt_id}</div>
        </div>
        <div>
          <span className="field-label">confidence_score</span>
          <div className="mono-value">{receipt.confidence_score.toFixed(2)}</div>
        </div>
        <div>
          <span className="field-label">mode</span>
          <div className="mono-value">{receipt.mode}</div>
        </div>
        <div>
          <span className="field-label">timestamp</span>
          <div className="mono-value">{receipt.timestamp}</div>
        </div>
      </div>

      <div className="checks-grid">
        {(Object.keys(receipt.checks) as (keyof typeof receipt.checks)[]).map((key) => {
          const check = receipt.checks[key];
          return (
            <div key={key} className="check-card">
              <div className="check-card-header">
                <span>{CHECK_LABELS[key]}</span>
                <StatusPill status={check.status} />
              </div>
              <ul>
                {check.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="receipt-hash">
        <span className="field-label">receipt_hash</span>
        <div className="mono-value hash-value">{receipt.receipt_hash}</div>
      </div>
    </div>
  );
}
