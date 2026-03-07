const db = require('../config/db');

// ─── ADD INCOME ───────────────────────────────────────────────
exports.addIncome = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { income_source, amount, income_date } = req.body;

    await db.query(
      `INSERT INTO income (user_id, income_source, amount, income_date) 
       VALUES (?, ?, ?, ?)`,
      [user_id, income_source, amount, income_date]
    );

    res.status(201).json({ message: 'Income added successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ALL INCOME ───────────────────────────────────────────
exports.getIncome = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { month, year } = req.query;

    let query = `
      SELECT * FROM income 
      WHERE user_id = ?
    `;
    const params = [user_id];

    if (month && year) {
      query += ` AND MONTH(income_date) = ? AND YEAR(income_date) = ?`;
      params.push(month, year);
    }

    query += ` ORDER BY income_date DESC`;

    const [income] = await db.query(query, params);

    res.status(200).json(income);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE INCOME ────────────────────────────────────────────
exports.updateIncome = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const { income_source, amount, income_date } = req.body;

    const [result] = await db.query(
      `UPDATE income 
       SET income_source = ?, amount = ?, income_date = ?
       WHERE income_id = ? AND user_id = ?`,
      [income_source, amount, income_date, id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.status(200).json({ message: 'Income updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE INCOME ────────────────────────────────────────────
exports.deleteIncome = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;

    const [result] = await db.query(
      `DELETE FROM income WHERE income_id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.status(200).json({ message: 'Income deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET INCOME SUMMARY ───────────────────────────────────────
// Total income per month - used for dashboard
exports.getIncomeSummary = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { month, year } = req.query;

    const [summary] = await db.query(
      `SELECT 
        income_source,
        SUM(amount) as total_amount,
        COUNT(income_id) as total_entries
      FROM income
      WHERE user_id = ?
        AND MONTH(income_date) = ?
        AND YEAR(income_date) = ?
      GROUP BY income_source
      ORDER BY total_amount DESC`,
      [user_id, month, year]
    );

    res.status(200).json(summary);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};