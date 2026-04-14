const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const pool = require('../config/db'); // adjust if your db path differs
const {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');

router.get('/categories', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM expense_categories ORDER BY category_name ASC'
      // no WHERE clause — categories are global, not per-user
    );
    res.json(rows);
  } catch (err) {
    console.error('Categories fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', verifyToken, async (req, res) => {
  const { category_name } = req.body;  // column is category_name, not name
  if (!category_name) return res.status(400).json({ error: 'Category name is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO expense_categories (category_name) VALUES (?)',
      [category_name]
    );
    res.status(201).json({ category_id: result.insertId, category_name });
  } catch (err) {
    console.error('Category create error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, addExpense);
router.get('/', verifyToken, getExpenses);
router.get('/summary', verifyToken, getExpenseSummary);
router.get('/:id', verifyToken, getExpenseById);
router.put('/:id', verifyToken, updateExpense);
router.delete('/:id', verifyToken, deleteExpense);

module.exports = router;