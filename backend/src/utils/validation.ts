export interface VerifyRequestBody {
  target_address: string;
  chain_id: number;
  transaction_payload?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function validateVerifyRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Request body must be a JSON object."] };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.target_address !== "string" || b.target_address.trim().length === 0) {
    errors.push("target_address is required and must be a non-empty string.");
  } else if (!ADDRESS_REGEX.test(b.target_address)) {
    errors.push("target_address must be a valid EVM-style address (0x followed by 40 hex characters).");
  }

  if (typeof b.chain_id !== "number" || !Number.isInteger(b.chain_id) || b.chain_id <= 0) {
    errors.push("chain_id is required and must be a positive integer.");
  }

  if (b.transaction_payload !== undefined && typeof b.transaction_payload !== "string") {
    errors.push("transaction_payload must be a string when provided.");
  }

  return { valid: errors.length === 0, errors };
}
