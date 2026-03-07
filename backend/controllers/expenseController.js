const db = require('../config/db');

// ─── ADD EXPENSE ─────────────────────────────────────────────
exports.addExpense = async (req, res) => {
  try {
    // req.user.user_id comes from the JWT token via authMiddleware
    // So we always know WHICH user is adding the expense
    const user_id = req.user.user_id;

    const { amount, expense_date, category_id, payment_id, note } = req.body;

    // Insert the expense into the database
    const [result] = await db.query(
      `INSERT INTO expenses (user_id, amount, expense_date, category_id, payment_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, amount, expense_date, category_id, payment_id]
    );

    // If a note was provided, insert it into expense_notes table
    // This is why we have a separate expense_notes table
    if (note) {
      await db.query(
        `INSERT INTO expense_notes (expense_id, note) VALUES (?, ?)`,
        [result.insertId, note]
      );
    }

    res.status(201).json({ message: 'Expense added successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ALL EXPENSES ─────────────────────────────────────────
exports.getExpenses = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // req.query lets us get optional filters from the URL
    // Example: /api/expenses?month=11&year=2023
    const { month, year } = req.query;

    // JOIN expense_categories to get category name
    // JOIN expense_notes to get note if it exists (LEFT JOIN means show expense even if no note)
    // JOIN payment_methods to get payment name
    let query = `
      SELECT 
        e.expense_id,
        e.amount,
        e.expense_date,
        ec.category_name,
        pm.payment_name,
        en.note
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
      LEFT JOIN expense_notes en ON e.expense_id = en.expense_id
      LEFT JOIN payment_methods pm ON e.payment_id = pm.payment_id
      WHERE e.user_id = ?
    `;

    // params array holds values to replace ? in query
    const params = [user_id];

    // If month and year are provided, filter by them
    if (month && year) {
      query += ` AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?`;
      params.push(month, year);
    }

    query += ` ORDER BY e.expense_date DESC`;

    const [expenses] = await db.query(query, params);

    res.status(200).json(expenses);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET SINGLE EXPENSE ───────────────────────────────────────
exports.getExpenseById = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // req.params.id gets the id from the URL
    // Example: /api/expenses/101 → req.params.id = 101
    const { id } = req.params;

    const [expenses] = await db.query(
      `SELECT 
        e.expense_id,
        e.amount,
        e.expense_date,
        ec.category_name,
        pm.payment_name,
        en.note
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
      LEFT JOIN expense_notes en ON e.expense_id = en.expense_id
      LEFT JOIN payment_methods pm ON e.payment_id = pm.payment_id
      WHERE e.expense_id = ? AND e.user_id = ?`,
      [id, user_id]
    );

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(expenses[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE EXPENSE ───────────────────────────────────────────
exports.updateExpense = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const { amount, expense_date, category_id, payment_id, note } = req.body;

    // Make sure this expense belongs to this user before updating
    const [existing] = await db.query(
      `SELECT * FROM expenses WHERE expense_id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await db.query(
      `UPDATE expenses 
       SET amount = ?, expense_date = ?, category_id = ?, payment_id = ?
       WHERE expense_id = ? AND user_id = ?`,
      [amount, expense_date, category_id, payment_id, id, user_id]
    );

    // Update note if provided
    if (note) {
      // INSERT OR UPDATE - if note exists update it, if not create it
      await db.query(
        `INSERT INTO expense_notes (expense_id, note) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE note = ?`,
        [id, note, note]
      );
    }

    res.status(200).json({ message: 'Expense updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE EXPENSE ───────────────────────────────────────────
exports.deleteExpense = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    // Delete note first because of foreign key constraint
    // (expense_notes.expense_id references expenses.expense_id)
    await db.query(
      `DELETE FROM expense_notes WHERE expense_id = ?`, 
      [id]
    );

    const [result] = await db.query(
      `DELETE FROM expenses WHERE expense_id = ? AND user_id = ?`,
      [id, user_id]
    );

    // affectedRows tells us if anything was actually deleted
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET EXPENSE SUMMARY ──────────────────────────────────────
// This is used for the dashboard - total spent per category
exports.getExpenseSummary = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { month, year } = req.query;

    const [summary] = await db.query(
      `SELECT 
        ec.category_name,
        SUM(e.amount) as total_spent,
        COUNT(e.expense_id) as total_transactions
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.category_id
      WHERE e.user_id = ? 
        AND MONTH(e.expense_date) = ? 
        AND YEAR(e.expense_date) = ?
      GROUP BY ec.category_name
      ORDER BY total_spent DESC`,
      [user_id, month, year]
    );

    res.status(200).json(summary);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};