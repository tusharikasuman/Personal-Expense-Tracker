const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  addIncome,
  getIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary
} = require('../controllers/incomeController');

router.post('/', verifyToken, addIncome);              // POST   /api/income
router.get('/', verifyToken, getIncome);               // GET    /api/income
router.get('/summary', verifyToken, getIncomeSummary); // GET    /api/income/summary
router.put('/:id', verifyToken, updateIncome);         // PUT    /api/income/67
router.delete('/:id', verifyToken, deleteIncome);      // DELETE /api/income/67

module.exports = router;