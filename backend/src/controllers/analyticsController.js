const Expense = require('../models/Expense');

const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Category-wise aggregation
    const categoryData = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const monthlyData = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $month: "$date" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const monthlyTrends = monthlyData.map(item => ({
      month: months[item._id - 1],
      amount: item.total
    }));

    // Total spending
    const totalSpent = categoryData.reduce((sum, item) => sum + item.total, 0);

    // Format response
    const categoryBreakdown = categoryData.map(item => ({
      name: item._id,
      amount: item.total,
      percentage: totalSpent
        ? Math.round((item.total / totalSpent) * 100)
        : 0
    }));

    res.json({
      totalSpent,
      categoryBreakdown,
      monthlyTrends
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics };