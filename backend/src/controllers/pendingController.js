const PendingTransaction = require('../models/PendingTransaction');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const { mapCategory } = require('../services/categoryMapper');
const { parseTransaction } = require('../services/transactionParser');

/**
 * GET /api/pending-expenses
 * Get all pending transactions for the authenticated user (status=pending)
 */
const getPendingTransactions = async (req, res) => {
  try {
    const pending = await PendingTransaction.find({
      userId: req.user._id,
      status: 'pending',
    }).sort({ createdAt: -1 });

    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/pending-expenses
 * Create a new pending expense from a detected transaction.
 * Accepts either raw message text (for server-side parsing) or pre-parsed data.
 */
const createPendingExpense = async (req, res) => {
  try {
    const { rawMessage, source, amount, merchant, category, transactionType, reference, date } = req.body;

    let parsedData;

    // If raw message is provided, parse it server-side
    if (rawMessage && !amount) {
      parsedData = parseTransaction(rawMessage, source || 'SMS');
      if (!parsedData) {
        return res.status(400).json({
          message: 'Could not extract transaction data from the message. It may not be a financial transaction.',
        });
      }
    } else if (amount) {
      // Pre-parsed data from client
      parsedData = {
        amount: Number(amount),
        merchant: merchant || 'Unknown',
        transactionType: transactionType || 'Debit',
        reference: reference || '',
        source: source || 'SMS',
        rawMessage: rawMessage || '',
        date: date || new Date().toISOString(),
      };
    } else {
      return res.status(400).json({ message: 'Please provide either rawMessage or amount.' });
    }

    // Validate amount
    if (!parsedData.amount || parsedData.amount <= 0) {
      return res.status(400).json({ message: 'Invalid transaction amount.' });
    }

    // Auto-categorize using category mapper
    const categoryResult = category
      ? { category, confidence: 100 }
      : mapCategory(parsedData.merchant);

    // Check for duplicate: same amount, merchant, and within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await PendingTransaction.findOne({
      userId: req.user._id,
      amount: parsedData.amount,
      merchant: parsedData.merchant,
      createdAt: { $gte: fiveMinutesAgo },
      status: 'pending',
    });

    if (duplicate) {
      return res.status(409).json({
        message: 'A similar transaction was detected recently. Ignoring duplicate.',
        existingId: duplicate._id,
      });
    }

    const pending = await PendingTransaction.create({
      userId: req.user._id,
      amount: parsedData.amount,
      merchant: parsedData.merchant,
      category: categoryResult.category,
      confidenceScore: categoryResult.confidence,
      transactionType: parsedData.transactionType,
      reference: parsedData.reference,
      source: parsedData.source,
      rawMessage: parsedData.rawMessage,
      date: parsedData.date ? new Date(parsedData.date) : new Date(),
      status: 'pending',
    });

    res.status(201).json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/pending-expenses/:id/confirm
 * Confirm a pending transaction — creates an Expense and removes the pending record.
 * Accepts optional overrides for amount, category, merchant, note.
 */
const confirmPending = async (req, res) => {
  try {
    const pending = await PendingTransaction.findById(req.params.id);

    if (!pending) {
      return res.status(404).json({ message: 'Pending transaction not found.' });
    }

    // Verify ownership
    if (pending.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (pending.status !== 'pending') {
      return res.status(400).json({ message: `Transaction already ${pending.status}.` });
    }

    // Apply user overrides or use pending values
    const finalAmount = req.body.amount ? Number(req.body.amount) : pending.amount;
    const finalCategory = req.body.category || pending.category;
    const finalMerchant = req.body.merchant || pending.merchant;
    const finalNote = req.body.note !== undefined ? req.body.note : pending.note;
    const finalDate = req.body.date ? new Date(req.body.date) : pending.date;

    if (finalAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    // Create confirmed expense
    const expense = await Expense.create({
      userId: req.user._id,
      title: finalMerchant || finalCategory, // Use merchant as title, fallback to category
      amount: finalAmount,
      category: finalCategory,
      merchant: finalMerchant,
      note: finalNote,
      source: pending.source,
      status: 'confirmed',
      reference: pending.reference,
      transactionType: pending.transactionType,
      account: pending.source === 'SMS' ? 'Bank Account' : 'UPI',
      date: finalDate,
    });

    // Budget alert check (same logic as expenseController)
    try {
      const user = await User.findById(req.user._id).select('preferences').lean();
      const prefs = user?.preferences;

      if (prefs?.budgetAlerts && prefs?.notifications) {
        const monthlyBudget = prefs.monthlyBudget || 5000;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyAgg = await Expense.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(req.user._id),
              date: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
        ]);

        const totalSpent = monthlyAgg[0]?.totalSpent || 0;
        const percentUsed = (totalSpent / monthlyBudget) * 100;

        if (percentUsed >= 100) {
          const existingAlert = await Notification.findOne({
            user: req.user._id,
            type: 'budget_alert',
            title: 'Budget Exceeded',
            createdAt: { $gte: startOfMonth },
          });
          if (!existingAlert) {
            await Notification.create({
              user: req.user._id,
              title: 'Budget Exceeded',
              message: 'Budget Exceeded: You have crossed your monthly budget.',
              type: 'budget_alert',
              icon: 'alert-circle',
            });
          }
        } else if (percentUsed >= 90) {
          const existingAlert = await Notification.findOne({
            user: req.user._id,
            type: 'budget_alert',
            title: 'High Budget Warning',
            createdAt: { $gte: startOfMonth },
          });
          if (!existingAlert) {
            await Notification.create({
              user: req.user._id,
              title: 'High Budget Warning',
              message: `Alert: You have used ${Math.round(percentUsed)}% of your budget.`,
              type: 'budget_alert',
              icon: 'alert-circle',
            });
          }
        }
      }
    } catch (alertErr) {
      console.log('Budget alert check error (non-critical):', alertErr.message);
    }

    // Remove pending transaction
    await PendingTransaction.findByIdAndDelete(req.params.id);

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/pending-expenses/:id/dismiss
 * Dismiss a pending transaction — removes it without creating an expense.
 */
const dismissPending = async (req, res) => {
  try {
    const pending = await PendingTransaction.findById(req.params.id);

    if (!pending) {
      return res.status(404).json({ message: 'Pending transaction not found.' });
    }

    // Verify ownership
    if (pending.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (pending.status !== 'pending') {
      return res.status(400).json({ message: `Transaction already ${pending.status}.` });
    }

    // Delete the pending transaction
    await PendingTransaction.findByIdAndDelete(req.params.id);

    res.json({ message: 'Transaction dismissed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/pending-expenses/mock
 * Generate mock pending transactions for testing/demo purposes.
 */
const setupSmsMock = async (req, res) => {
  try {
    const mockMessages = [
      'Rs.500 paid to AMAZON via UPI Ref 412345678901',
      'INR 150.00 debited from A/c XX4521 for SWIGGY order. Ref 523456789012',
      'Rs.1200 paid to UBER INDIA via UPI. Txn ID 634567890123',
      'Payment of Rs.799 to NETFLIX via credit card ending 4532. Ref 745678901234',
      'Rs.350 sent to FLIPKART via UPI Ref 856789012345',
      'INR 2,500.00 debited at CROMA ELECTRONICS. Ref 967890123456',
    ];

    const pendingDocs = [];

    for (const msg of mockMessages) {
      const parsed = parseTransaction(msg, 'SMS');
      if (parsed) {
        const categoryResult = mapCategory(parsed.merchant);

        pendingDocs.push({
          userId: req.user._id,
          amount: parsed.amount,
          merchant: parsed.merchant,
          category: categoryResult.category,
          confidenceScore: categoryResult.confidence,
          transactionType: parsed.transactionType,
          reference: parsed.reference,
          source: 'SMS',
          rawMessage: msg,
          date: new Date(),
          status: 'pending',
        });
      }
    }

    // Also add a notification-sourced mock
    pendingDocs.push({
      userId: req.user._id,
      amount: 299,
      merchant: 'Spotify',
      category: 'Entertainment',
      confidenceScore: 95,
      transactionType: 'Debit',
      reference: 'SPOT' + Date.now().toString().slice(-8),
      source: 'NOTIFICATION',
      rawMessage: '',
      date: new Date(),
      status: 'pending',
    });

    const created = await PendingTransaction.insertMany(pendingDocs);
    res.status(201).json({
      message: `${created.length} mock transactions generated successfully.`,
      count: created.length,
      transactions: created,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingTransactions,
  createPendingExpense,
  confirmPending,
  dismissPending,
  setupSmsMock,
};
