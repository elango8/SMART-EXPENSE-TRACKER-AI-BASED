const mongoose = require('mongoose');

const pendingTransactionSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  merchant: { type: String, required: true },
  date: { type: Date, required: true },
  confidenceScore: { type: Number, required: true },
  note: { type: String, default: '' },
  source: { type: String, enum: ['SMS', 'NOTIFICATION'], required: true, default: 'SMS' },
  status: { type: String, enum: ['pending', 'confirmed', 'dismissed'], default: 'pending' },
  transactionType: { type: String, enum: ['Debit', 'Credit'], default: 'Debit' },
  reference: { type: String, default: '' },
  rawMessage: { type: String, default: '' },
}, { timestamps: true });

// Index for efficient queries: user's pending transactions sorted by date
pendingTransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PendingTransaction', pendingTransactionSchema);
