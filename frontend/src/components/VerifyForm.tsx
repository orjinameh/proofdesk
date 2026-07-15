import { FormEvent, useState } from "react";

interface Chain {
  id: number;
  label: string;
}

const CHAINS: Chain[] = [
  { id: 1, label: "Ethereum" },
  { id: 56, label: "BNB Chain" },
  { id: 137, label: "Polygon" },
  { id: 8453, label: "Base" },
  { id: 42161, label: "Arbitrum" },
];

interface VerifyFormProps {
  onSubmit: (address: string, chainId: number) => void;
  isLoading: boolean;
}

export function VerifyForm({ onSubmit, isLoading }: VerifyFormProps) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(1);
  const [touched, setTouched] = useState(false);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValidAddress) return;
    onSubmit(address.trim(), chainId);
  }

  function fillSample() {
    setAddress("0x1f9840a85d5af5bf1d1762f925bdaddc4201f984");
    setTouched(false);
  }

  return (
    <form className="verify-form" onSubmit={handleSubmit}>
      <label className="field-label" htmlFor="target_address">
        target_address
      </label>
      <input
        id="target_address"
        className="mono-input"
        placeholder="0x..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        onBlur={() => setTouched(true)}
        spellCheck={false}
        autoComplete="off"
      />
      {touched && !isValidAddress && (
        <div className="field-error">Enter a valid 0x-prefixed, 40-character hex address.</div>
      )}

      <label className="field-label" htmlFor="chain_id">
        chain_id
      </label>
      <select
        id="chain_id"
        className="mono-input"
        value={chainId}
        onChange={(e) => setChainId(Number(e.target.value))}
      >
        {CHAINS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} ({c.id})
          </option>
        ))}
      </select>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Verifying…" : "Run verification"}
        </button>
        <button type="button" className="btn-ghost" onClick={fillSample} disabled={isLoading}>
          Use sample address
        </button>
      </div>
    </form>
  );
}
