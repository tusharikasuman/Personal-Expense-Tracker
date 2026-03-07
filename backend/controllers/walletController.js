const db = require('../config/db');

// ─── GET WALLET BALANCE ───────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const [wallet] = await db.query(
      `SELECT * FROM wallet WHERE user_id = ?`,
      [user_id]
    );

    if (wallet.length === 0) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.status(200).json(wallet[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── ADD MONEY TO WALLET ──────────────────────────────────────
exports.addMoney = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { amount } = req.body;

    // Add amount to existing balance
    await db.query(
      `UPDATE wallet SET balance = balance + ? WHERE user_id = ?`,
      [amount, user_id]
    );

    // Record this as a transaction
    await db.query(
      `INSERT INTO transactions (sender_user_id, amount, status, description)
       VALUES (?, ?, 'success', 'Money added to wallet')`,
      [user_id, amount]
    );

    // Get updated balance to send back
    const [wallet] = await db.query(
      `SELECT balance FROM wallet WHERE user_id = ?`,
      [user_id]
    );

    res.status(200).json({
      message: 'Money added successfully',
      new_balance: wallet[0].balance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── TRANSFER MONEY ───────────────────────────────────────────
// Send money from one user to another
exports.transferMoney = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_email, amount, description } = req.body;

    // Find receiver by email
    const [receiver] = await db.query(
      `SELECT user_id, firstname FROM users WHERE email = ?`,
      [receiver_email]
    );

    if (receiver.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const receiver_id = receiver[0].user_id;

    // Make sure sender is not sending to themselves
    if (sender_id === receiver_id) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // Check sender has enough balance
    const [senderWallet] = await db.query(
      `SELECT balance FROM wallet WHERE user_id = ?`,
      [sender_id]
    );

    if (senderWallet[0].balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Generate a unique reference number for this transaction
    // Date.now() gives current timestamp in milliseconds - always unique
    const reference_no = 'TXN' + Date.now();

    // Deduct from sender
    await db.query(
      `UPDATE wallet SET balance = balance - ? WHERE user_id = ?`,
      [amount, sender_id]
    );

    // Add to receiver
    await db.query(
      `UPDATE wallet SET balance = balance + ? WHERE user_id = ?`,
      [amount, receiver_id]
    );

    // Record transaction
    await db.query(
      `INSERT INTO transactions 
        (sender_user_id, receiver_user_id, amount, status, reference_no, description)
       VALUES (?, ?, ?, 'success', ?, ?)`,
      [sender_id, receiver_id, amount, reference_no, description]
    );

    res.status(200).json({
      message: `Successfully transferred ₹${amount} to ${receiver[0].firstname}`,
      reference_no
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET TRANSACTION HISTORY ──────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get all transactions where user is either sender OR receiver
    const [transactions] = await db.query(
      `SELECT 
        t.transaction_id,
        t.amount,
        t.status,
        t.reference_no,
        t.description,
        t.transaction_date,
        sender.firstname as sender_name,
        receiver.firstname as receiver_name
      FROM transactions t
      LEFT JOIN users sender ON t.sender_user_id = sender.user_id
      LEFT JOIN users receiver ON t.receiver_user_id = receiver.user_id
      WHERE t.sender_user_id = ? OR t.receiver_user_id = ?
      ORDER BY t.transaction_date DESC`,
      [user_id, user_id]
    );

    res.status(200).json(transactions);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── PAY BILL ─────────────────────────────────────────────────
exports.payBill = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { bill_type, biller_name, account_number, amount } = req.body;

    // Check wallet balance
    const [wallet] = await db.query(
      `SELECT balance FROM wallet WHERE user_id = ?`,
      [user_id]
    );

    if (wallet[0].balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct from wallet
    await db.query(
      `UPDATE wallet SET balance = balance - ? WHERE user_id = ?`,
      [amount, user_id]
    );

    // Record in bill_payments table
    await db.query(
      `INSERT INTO bill_payments 
        (user_id, bill_type, biller_name, account_number, amount, status, paid_at)
       VALUES (?, ?, ?, ?, ?, 'paid', NOW())`,
      [user_id, bill_type, biller_name, account_number, amount]
    );

    // Also record as a transaction
    const reference_no = 'BILL' + Date.now();
    await db.query(
      `INSERT INTO transactions 
        (sender_user_id, amount, status, reference_no, description)
       VALUES (?, ?, 'success', ?, ?)`,
      [user_id, amount, reference_no, `Bill payment - ${bill_type}`]
    );

    res.status(200).json({ message: 'Bill paid successfully', reference_no });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};