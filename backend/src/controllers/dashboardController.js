const Expense = require('../models/Expense');
const PendingTransaction = require('../models/PendingTransaction');
const User = require('../models/User');
const mongoose = require('mongoose');

const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // 1. Monthly aggregation — total + count
    const monthlyAgg = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthlyTotal = monthlyAgg[0]?.totalSpent || 0;
    const monthlyCount = monthlyAgg[0]?.count || 0;

    // 2. Weekly transaction count
    const weeklyAgg = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
        },
      },
    ]);

    const weeklyCount = weeklyAgg[0]?.count || 0;

    // 3. Top spending category this month
    const categoryAgg = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    const topCategory = categoryAgg[0]
      ? { name: categoryAgg[0]._id, amount: categoryAgg[0].total }
      : null;

    // 4. Most recent transaction
    const recentTransaction = await Expense.findOne({ userId })
      .sort({ date: -1 })
      .select('title amount category date')
      .lean();

    // 5. Budget remaining
    const user = await User.findById(userId).select('preferences').lean();
    const monthlyBudget = user?.preferences?.monthlyBudget || 5000;
    const budgetRemaining = monthlyBudget - monthlyTotal;

    // 6. Pending transaction count
    const pendingCount = await PendingTransaction.countDocuments({ userId });

    res.json({
      monthlyTotal,
      monthlyCount,
      weeklyCount,
      topCategory,
      recentTransaction,
      monthlyBudget,
      budgetRemaining,
      pendingCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardSummary };
