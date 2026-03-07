const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  setBudget,
  getBudgets,
  deleteBudget,
  getBudgetAlerts
} = require('../controllers/budgetController');

router.post('/', verifyToken, setBudget);                // POST   /api/budget
router.get('/', verifyToken, getBudgets);                // GET    /api/budget?month=11&year=2023
router.delete('/:id', verifyToken, deleteBudget);        // DELETE /api/budget/37
router.get('/alerts', verifyToken, getBudgetAlerts);     // GET    /api/budget/alerts?month=11&year=2023

module.exports = router;