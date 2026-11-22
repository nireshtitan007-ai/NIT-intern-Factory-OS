import { Schema, model, Document, ClientSession } from 'mongoose';

export interface ICounter extends Document {
  tenantId: string;
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  tenantId: { type: String, required: true },
  key: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

CounterSchema.index({ tenantId: 1, key: 1 }, { unique: true });

export const Counter = model<ICounter>('Counter', CounterSchema);

/**
 * Generates an atomic monotonically increasing sequence number per tenant and key.
 * Used for tamper-proof document numbering (runs, orders, invoices, payments, credit notes).
 */
export async function getNextSequence(
  tenantId: string,
  key: string,
  session?: ClientSession | null
): Promise<number> {
  const options = { new: true, upsert: true, session: session || undefined };
  const counter = await Counter.findOneAndUpdate(
    { tenantId, key },
    { $inc: { seq: 1 } },
    options
  );
  return counter ? counter.seq : 1;
}
