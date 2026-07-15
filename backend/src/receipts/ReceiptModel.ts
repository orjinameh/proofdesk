import mongoose, { Schema, Document } from "mongoose";

/**
 * Optional persistence layer. ProofDesk works perfectly well without
 * MongoDB configured - this is only used when MONGODB_URI is set, to
 * let judges/agents look up a previously issued receipt by ID.
 */
export interface ReceiptDocument extends Document {
  receipt_id: string;
  timestamp: string;
  target_address: string;
  chain_id: number;
  verdict: string;
  confidence_score: number;
  checks: Record<string, unknown>;
  receipt_hash: string;
  mode: string;
}

const ReceiptSchema = new Schema<ReceiptDocument>(
  {
    receipt_id: { type: String, required: true, unique: true, index: true },
    timestamp: { type: String, required: true },
    target_address: { type: String, required: true, index: true },
    chain_id: { type: Number, required: true },
    verdict: { type: String, required: true },
    confidence_score: { type: Number, required: true },
    checks: { type: Schema.Types.Mixed, required: true },
    receipt_hash: { type: String, required: true },
    mode: { type: String, required: true },
  },
  { timestamps: false }
);

export const ReceiptModel = mongoose.model<ReceiptDocument>("Receipt", ReceiptSchema);
