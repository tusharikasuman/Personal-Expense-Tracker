const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/authMiddleware');

// GET all savings goals
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch savings goals' });
  }
});


// POST create new goal
router.post('/', verifyToken, async (req, res) => {
  const { goal_name, target_amount, deadline } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO savings_goals 
       (user_id, goal_name, target_amount, saved_amount, deadline) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.user_id, goal_name, target_amount, 0, deadline]
    );

    res.json({
      goal_id: result.insertId,
      goal_name,
      target_amount,
      saved_amount: 0,
      deadline
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create savings goal' });
  }
});


// PUT add money to goal
router.put('/:id', verifyToken, async (req, res) => {
  const { current_amount_add } = req.body;

  try {
    await pool.query(
      `UPDATE savings_goals 
       SET saved_amount = saved_amount + ? 
       WHERE goal_id = ? AND user_id = ?`,
      [current_amount_add, req.params.id, req.user.user_id]
    );

    res.json({ message: 'Amount added successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});


// DELETE goal (optional but recommended)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM savings_goals WHERE goal_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );

    res.json({ message: 'Goal deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;