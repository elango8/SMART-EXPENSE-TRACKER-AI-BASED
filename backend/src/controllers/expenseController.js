const Expense = require('../models/Expense');

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
    const { amount, category, date, account } = req.body;
    let { title } = req.body;
    
    if (!amount || !category) {
      return res.status(400).json({ message: 'Please provide amount and category' });
    }

    if (!title) {
      title = category;
    }

    if (amount <= 0) {
  return res.status(400).json({ message: 'Amount must be greater than 0' });
}

    const expense = await Expense.create({
      userId: req.user._id,
      title,
      amount,
      category,
      account: account || 'Cash',
      date: date ? new Date(date) : new Date()
    });
    
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
