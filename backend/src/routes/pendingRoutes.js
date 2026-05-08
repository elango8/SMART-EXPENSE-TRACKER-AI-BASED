const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPendingTransactions, setupSmsMock, confirmPending, rejectPending } = require('../controllers/pendingController');

router.route('/').get(protect, getPendingTransactions);
router.route('/mock').post(protect, setupSmsMock);
router.route('/:id/confirm').post(protect, confirmPending);
router.route('/:id/reject').post(protect, rejectPending);

module.exports = router;
