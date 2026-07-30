const Expense = require('../models/Expense');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

const getExpenses = async (req, res) => {
  try {
    const userId = req.user._id; // safer

    // Build query object
    const query = { userId };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate + 'T23:59:59.999Z')
      };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    res.json(expenses);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addExpense = async (req, res) => {
  try {
    const { amount, category, date, account, merchant, source, status, note, reference, transactionType } = req.body;
    let { title } = req.body;
    
    if (!amount || !category) {
      return res.status(400).json({ message: 'Please provide amount and category' });
    }

    if (!title) {
      title = merchant || category;
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      title,
      amount,
      category,
      merchant: merchant || '',
      note: note || '',
      source: source || 'MANUAL',
      status: status || 'confirmed',
      reference: reference || '',
      transactionType: transactionType || 'Debit',
      account: account || 'Cash',
      date: date ? new Date(date) : new Date()
    });

    // --- Budget Alert Notifications ---
    try {
      const user = await User.findById(req.user._id).select('preferences').lean();
      const prefs = user?.preferences;

      // Only generate alerts if budgetAlerts AND notifications are enabled
      if (prefs?.budgetAlerts && prefs?.notifications) {
        const monthlyBudget = prefs.monthlyBudget || 5000;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get total monthly spending including the new expense
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

        // Check thresholds and create notification if crossed
        if (percentUsed >= 100) {
          // Check if we already sent this alert this month
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
        } else if (percentUsed >= 80) {
          const existingAlert = await Notification.findOne({
            user: req.user._id,
            type: 'budget_alert',
            title: 'Budget Warning',
            createdAt: { $gte: startOfMonth },
          });
          if (!existingAlert) {
            await Notification.create({
              user: req.user._id,
              title: 'Budget Warning',
              message: `Warning: You have used ${Math.round(percentUsed)}% of your budget.`,
              type: 'budget_alert',
              icon: 'alert-circle',
            });
          }
        }
      }
    } catch (alertErr) {
      // Budget alerts are non-critical — log error but don't fail the expense creation
      console.log('Budget alert check error (non-critical):', alertErr.message);
    }
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Find expense
    const expense = await Expense.findById(expenseId);

    // Check if expense exists
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check ownership
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Update fields (only if provided)
    const { title, amount, category, account, date } = req.body;

    if (title) expense.title = title;
    if (amount !== undefined) expense.amount = amount;
    if (category) expense.category = category;
    if (account) expense.account = account;
    if (date) expense.date = new Date(date);

    // Save updated expense
    const updatedExpense = await expense.save();

    res.json(updatedExpense);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Find expense
    const expense = await Expense.findById(expenseId);

    // Check if exists
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check ownership
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Delete expense
    await expense.deleteOne();

    res.json({ message: 'Expense deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getExpenses, addExpense , updateExpense , deleteExpense };
