const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  getWallet,
  addMoney,
  transferMoney,
  getTransactions,
  payBill
} = require('../controllers/walletController');

router.get('/', verifyToken, getWallet);                    // GET  /api/wallet
router.post('/add', verifyToken, addMoney);                 // POST /api/wallet/add
router.post('/transfer', verifyToken, transferMoney);       // POST /api/wallet/transfer
router.get('/transactions', verifyToken, getTransactions);  // GET  /api/wallet/transactions
router.post('/pay-bill', verifyToken, payBill);             // POST /api/wallet/pay-bill

module.exports = router;