const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getPendingTransactions,
  createPendingExpense,
  confirmPending,
  dismissPending,
  setupSmsMock,
} = require('../controllers/pendingController');

router.route('/').get(protect, getPendingTransactions);
router.route('/').post(protect, createPendingExpense);
router.route('/mock').post(protect, setupSmsMock);
router.route('/:id/confirm').post(protect, confirmPending);
router.route('/:id/dismiss').post(protect, dismissPending);

module.exports = router;
