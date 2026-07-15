import { useState } from "react";
import { VerifyForm } from "./components/VerifyForm";
import { ReceiptDisplay } from "./components/ReceiptDisplay";
import { verifyTarget, VerificationReceipt } from "./api";
import "./App.css";

export default function App() {
  const [receipt, setReceipt] = useState<VerificationReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(address: string, chainId: number) {
    setIsLoading(true);
    setError(null);
    setReceipt(null);
    try {
      const result = await verifyTarget(address, chainId);
      setReceipt(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">◆</span> ProofDesk
        </div>
        <div className="brand-tagline">Agent Service Provider — trust verification for autonomous agents</div>
      </header>

      <main className="app-main">
        <section className="panel panel-form">
          <h1>Request a Verification Receipt</h1>
          <p className="panel-copy">
            Enter a target address the way an agent would before executing a
            transaction against it. ProofDesk runs four independent checks
            and returns a hash-verifiable receipt.
          </p>
          <VerifyForm onSubmit={handleSubmit} isLoading={isLoading} />
          {error && <div className="error-banner">{error}</div>}
        </section>

        <section className="panel panel-receipt">
          {!receipt && !isLoading && (
            <div className="empty-state">
              Run a verification to see the receipt here.
            </div>
          )}
          {isLoading && <div className="empty-state">Running verification checks…</div>}
          {receipt && <ReceiptDisplay receipt={receipt} />}
        </section>
      </main>
    </div>
  );
}
