const db = require('../config/db');

// ─── SET BUDGET ───────────────────────────────────────────────
// This creates OR updates a budget for a category in a specific month
exports.setBudget = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { category_id, month, year, budget_amount } = req.body;

    // INSERT OR UPDATE - if budget already exists for this category/month/year
    // update it instead of creating a duplicate
    await db.query(
      `INSERT INTO budget (user_id, category_id, month, year, budget_amount)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE budget_amount = ?`,
      [user_id, category_id, month, year, budget_amount, budget_amount]
    );

    res.status(201).json({ message: 'Budget set successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET BUDGETS ──────────────────────────────────────────────
// Gets all budgets for a month AND compares with actual spending
exports.getBudgets = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { month, year } = req.query;

    // This query does something powerful:
    // It gets each budget AND calculates how much was actually spent
    // SUM(e.amount) adds up all expenses for that category in that month
    // COALESCE means "if null use 0" - in case no expenses exist yet
    const [budgets] = await db.query(
      `SELECT 
        b.budget_id,
        ec.category_name,
        b.budget_amount,
        COALESCE(SUM(e.amount), 0) as spent_amount,
        b.budget_amount - COALESCE(SUM(e.amount), 0) as remaining_amount
      FROM budget b
      JOIN expense_categories ec ON b.category_id = ec.category_id
      LEFT JOIN expenses e ON b.user_id = e.user_id 
        AND b.category_id = e.category_id
        AND MONTH(e.expense_date) = b.month
        AND YEAR(e.expense_date) = b.year
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      GROUP BY b.budget_id, ec.category_name, b.budget_amount`,
      [user_id, month, year]
    );

    res.status(200).json(budgets);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE BUDGET ────────────────────────────────────────────
exports.deleteBudget = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM budget WHERE budget_id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.status(200).json({ message: 'Budget deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CHECK BUDGET ALERTS ──────────────────────────────────────
// Returns categories where spending is above 80% of budget
// This is used to trigger notifications
exports.getBudgetAlerts = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { month, year } = req.query;

    const [alerts] = await db.query(
      `SELECT 
        ec.category_name,
        b.budget_amount,
        COALESCE(SUM(e.amount), 0) as spent_amount,
        ROUND((COALESCE(SUM(e.amount), 0) / b.budget_amount) * 100, 2) as percentage_used
      FROM budget b
      JOIN expense_categories ec ON b.category_id = ec.category_id
      LEFT JOIN expenses e ON b.user_id = e.user_id 
        AND b.category_id = e.category_id
        AND MONTH(e.expense_date) = b.month
        AND YEAR(e.expense_date) = b.year
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      GROUP BY b.budget_id, ec.category_name, b.budget_amount
      HAVING percentage_used >= 80
      ORDER BY percentage_used DESC`,
      [user_id, month, year]
    );

    // For each alert, save a notification in the notifications table
    for (const alert of alerts) {
      const message = alert.percentage_used >= 100
        ? `You have exceeded your ${alert.category_name} budget!`
        : `Warning: You have used ${alert.percentage_used}% of your ${alert.category_name} budget`;

      await db.query(
        `INSERT INTO notifications (user_id, message, type)
         VALUES (?, ?, 'budget_alert')`,
        [user_id, message]
      );
    }

    res.status(200).json(alerts);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};