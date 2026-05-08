const mongoose = require('mongoose');

const pendingTransactionSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  merchant: { type: String, required: true },
  date: { type: Date, required: true },
  confidenceScore: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('PendingTransaction', pendingTransactionSchema);
