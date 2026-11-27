import { Schema, model, Document, Model } from 'mongoose';

export interface IBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
}

export interface ISettings extends Document {
  tenantId: string;
  legalName: string;
  tradeName?: string;
  address: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  bankDetails: IBankDetails;
  invoiceTerms: string;
  defaultTolerancePercent: number;
  updatedAt: Date;
}

export interface ISettingsModel extends Model<ISettings> {
  getSettings(tenantId: string): Promise<ISettings>;
}

const BankDetailsSchema = new Schema<IBankDetails>({
  bankName: { type: String, default: 'State Bank of India' },
  accountNumber: { type: String, default: '389201948201' },
  ifscCode: { type: String, default: 'SBIN0001234' },
  branch: { type: String, default: 'Main Industrial Branch' }
}, { _id: false });

const SettingsSchema = new Schema<ISettings>({
  tenantId: { type: String, required: true, unique: true, index: true },
  legalName: { type: String, required: true, default: () => process.env.FACTORY_NAME || 'ZenLyft Foods Manufacturing Pvt Ltd' },
  tradeName: { type: String, default: 'ZenLyft Foods' },
  address: { type: String, required: true, default: 'Industrial Estate, Tiruchirappalli, Tamil Nadu - 620015' },
  gstin: { type: String, required: true, default: () => process.env.FACTORY_GSTIN || '33AAAAA0000A1Z5' },
  stateName: { type: String, required: true, default: () => process.env.FACTORY_STATE || 'Tamil Nadu' },
  stateCode: { type: String, required: true, default: () => process.env.FACTORY_STATE_CODE || '33' },
  bankDetails: { type: BankDetailsSchema, default: () => ({}) },
  invoiceTerms: { 
    type: String, 
    default: '1. Payment due within 30 days of invoice.\n2. Goods once dispatched cannot be returned without prior written authorization.\n3. All disputes subject to local jurisdiction.' 
  },
  defaultTolerancePercent: { type: Number, default: 2 },
  updatedAt: { type: Date, default: Date.now }
});

SettingsSchema.statics.getSettings = async function(tenantId: string): Promise<ISettings> {
  let doc = await this.findOne({ tenantId });
  if (!doc) {
    doc = await this.create({
      tenantId,
      legalName: process.env.FACTORY_NAME || 'ZenLyft Foods Manufacturing Pvt Ltd',
      tradeName: 'ZenLyft Foods',
      address: 'Industrial Estate, Tiruchirappalli, Tamil Nadu - 620015',
      gstin: process.env.FACTORY_GSTIN || '33AAAAA0000A1Z5',
      stateName: process.env.FACTORY_STATE || 'Tamil Nadu',
      stateCode: process.env.FACTORY_STATE_CODE || '33',
      bankDetails: {
        bankName: 'State Bank of India',
        accountNumber: '389201948201',
        ifscCode: 'SBIN0001234',
        branch: 'Industrial Estate Branch'
      },
      invoiceTerms: '1. Payment due within 30 days.\n2. In accordance with Section 31 of CGST Act.',
      defaultTolerancePercent: 2
    });
  }
  return doc;
};

export const Settings = model<ISettings, ISettingsModel>('Settings', SettingsSchema);
