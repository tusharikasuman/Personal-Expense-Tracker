const db = require('../config/db');

// ─── MAIN DASHBOARD SUMMARY ───────────────────────────────────
// This single API call returns everything needed for the dashboard
exports.getDashboard = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { month, year } = req.query;

    // ── 1. Total Income for the month ──────────────────────────
    // SUM adds up all income entries for this user in this month
    const [incomeData] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_income
       FROM income
       WHERE user_id = ? 
         AND MONTH(income_date) = ? 
         AND YEAR(income_date) = ?`,
      [user_id, month, year]
    );

    // ── 2. Total Expenses for the month ────────────────────────
    const [expenseData] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses
       FROM expenses
       WHERE user_id = ? 
         AND MONTH(expense_date) = ? 
         AND YEAR(expense_date) = ?`,
      [user_id, month, year]
    );

    // ── 3. Expenses broken down by category ────────────────────
    // This is used to draw the pie chart on the dashboard
    const [categoryBreakdown] = await db.query(
      `SELECT 
        ec.category_name,
        COALESCE(SUM(e.amount), 0) as total_spent
       FROM expenses e
       JOIN expense_categories ec ON e.category_id = ec.category_id
       WHERE e.user_id = ?
         AND MONTH(e.expense_date) = ?
         AND YEAR(e.expense_date) = ?
       GROUP BY ec.category_name
       ORDER BY total_spent DESC`,
      [user_id, month, year]
    );

    // ── 4. Budget vs Actual spending ───────────────────────────
    // Shows progress bars on dashboard - how much of budget is used
    const [budgetComparison] = await db.query(
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
       GROUP BY b.budget_id, ec.category_name, b.budget_amount`,
      [user_id, month, year]
    );

    // ── 5. Last 5 transactions ──────────────────────────────────
    // Recent activity shown at bottom of dashboard
    const [recentExpenses] = await db.query(
      `SELECT 
        e.expense_id,
        e.amount,
        e.expense_date,
        ec.category_name,
        pm.payment_name
       FROM expenses e
       LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
       LEFT JOIN payment_methods pm ON e.payment_id = pm.payment_id
       WHERE e.user_id = ?
       ORDER BY e.expense_date DESC
       LIMIT 5`,
      [user_id]
    );

    // ── 6. Wallet Balance ───────────────────────────────────────
    const [walletData] = await db.query(
      `SELECT balance FROM wallet WHERE user_id = ?`,
      [user_id]
    );

    // ── 7. Unread Notifications count ──────────────────────────
    const [notifData] = await db.query(
      `SELECT COUNT(*) as unread_count 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [user_id]
    );

    // ── 8. Savings Goals progress ──────────────────────────────
    const [goals] = await db.query(
      `SELECT 
        goal_name,
        target_amount,
        saved_amount,
        deadline,
        status,
        ROUND((saved_amount / target_amount) * 100, 2) as percentage_saved
       FROM savings_goals
       WHERE user_id = ? AND status = 'active'`,
      [user_id]
    );

    // Calculate savings for this month
    // savings = income - expenses
    const total_income = incomeData[0].total_income;
    const total_expenses = expenseData[0].total_expenses;
    const total_savings = total_income - total_expenses;

    // Send everything back in one response object
    res.status(200).json({
      summary: {
        total_income,
        total_expenses,
        total_savings,
        wallet_balance: walletData[0]?.balance || 0,
        unread_notifications: notifData[0].unread_count
      },
      category_breakdown: categoryBreakdown,
      budget_comparison: budgetComparison,
      recent_expenses: recentExpenses,
      savings_goals: goals
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── MONTHLY TREND ────────────────────────────────────────────
// Returns income vs expense for last 6 months
// Used to draw the line chart on dashboard
exports.getMonthlyTrend = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [incomeTrend] = await db.query(
      `SELECT 
        MONTH(income_date) as month,
        YEAR(income_date) as year,
        SUM(amount) as total
       FROM income
       WHERE user_id = ?
         AND income_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY YEAR(income_date), MONTH(income_date)
       ORDER BY year ASC, month ASC`,
      [user_id]
    );

    const [expenseTrend] = await db.query(
      `SELECT 
        MONTH(expense_date) as month,
        YEAR(expense_date) as year,
        SUM(amount) as total
       FROM expenses
       WHERE user_id = ?
         AND expense_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY YEAR(expense_date), MONTH(expense_date)
       ORDER BY year ASC, month ASC`,
      [user_id]
    );

    res.status(200).json({
      income_trend: incomeTrend,
      expense_trend: expenseTrend
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET NOTIFICATIONS ────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [notifications] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [user_id]
    );

    // Mark all as read when user opens notifications
    await db.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [user_id]
    );

    res.status(200).json(notifications);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};