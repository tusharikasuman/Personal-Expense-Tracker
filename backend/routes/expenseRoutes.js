const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');

// All expense routes are protected - verifyToken runs on all of them
// This is done by putting verifyToken before the controller function
router.post('/', verifyToken, addExpense);                    // POST   /api/expenses
router.get('/', verifyToken, getExpenses);                    // GET    /api/expenses
router.get('/summary', verifyToken, getExpenseSummary);       // GET    /api/expenses/summary
router.get('/:id', verifyToken, getExpenseById);              // GET    /api/expenses/101
router.put('/:id', verifyToken, updateExpense);               // PUT    /api/expenses/101
router.delete('/:id', verifyToken, deleteExpense);            // DELETE /api/expenses/101

module.exports = router;