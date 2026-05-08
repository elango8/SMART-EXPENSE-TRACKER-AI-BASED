const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  merchant: { type: String, required: true },
  date: { type: Date, required: true },
  isAutoDetected: { type: Boolean, default: false },
  confidenceScore: { type: Number, default: null },
  notes: { type: String, default: '' },
  account: { type: String, default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
