const PendingTransaction = require('../models/PendingTransaction');
const Transaction = require('../models/Transaction');

const getPendingTransactions = async (req, res) => {
  try {
    const pending = await PendingTransaction.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setupSmsMock = async (req, res) => {
  try {
    const mocks = [
      { userId: req.user._id, amount: 300, merchant: 'Blue Bottle Coffee', category: 'Dining & Drinks', date: new Date(), confidenceScore: 92 },
      { userId: req.user._id, amount: 3423, merchant: 'Consolidated Edison', category: 'Utilities', date: new Date(), confidenceScore: 98 },
      { userId: req.user._id, amount: 325, merchant: 'Flipkart', category: 'Apparel', date: new Date(), confidenceScore: 74 }
    ];
    await PendingTransaction.insertMany(mocks);
    res.json({ message: 'Mock data generated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmPending = async (req, res) => {
  try {
    const pending = await PendingTransaction.findById(req.params.id);
    if (!pending) return res.status(404).json({ message: 'Not found' });
    
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: req.body.amount || pending.amount,
      category: req.body.category || pending.category,
      merchant: req.body.merchant || pending.merchant,
      date: req.body.date || pending.date,
      isAutoDetected: true,
      confidenceScore: pending.confidenceScore
    });

    await PendingTransaction.findByIdAndDelete(req.params.id);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectPending = async (req, res) => {
  try {
    await PendingTransaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rejected mapping' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPendingTransactions, setupSmsMock, confirmPending, rejectPending };
