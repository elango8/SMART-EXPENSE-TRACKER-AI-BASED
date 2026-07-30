const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  merchant: {
    type: String,
    default: ''
  },
  note: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['MANUAL', 'SMS', 'NOTIFICATION'],
    default: 'MANUAL'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'dismissed'],
    default: 'confirmed'
  },
  reference: {
    type: String,
    default: ''
  },
  transactionType: {
    type: String,
    enum: ['Debit', 'Credit'],
    default: 'Debit'
  },
  account: {
    type: String,
    required: true,
    default: 'Cash'
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
