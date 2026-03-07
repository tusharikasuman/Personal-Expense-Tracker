const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ─── REGISTER ───────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    // Destructure - pull these values out of the request body
    // This is the data the frontend sends when user fills the signup form
    const { firstname, lastname, email, password } = req.body;

    // Check if a user with this email already exists in DB
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    // existingUser will be an array - if length > 0, email is taken
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // bcrypt.hash converts plain password → secure hash
    // 10 is the "salt rounds" - higher = more secure but slower
    // Example: 'test123' → '$2b$10$xK9zQ...' (can never be reversed)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database with the hashed password
    const [result] = await db.query(
      'INSERT INTO users (firstname, lastname, email, password) VALUES (?, ?, ?, ?)',
      [firstname, lastname, email, hashedPassword]
    );

    // After inserting, MySQL gives back insertId - the new user's ID
    // We create a wallet for this user automatically
    await db.query(
      'INSERT INTO wallet (user_id, balance) VALUES (?, ?)',
      [result.insertId, 0.00]
    );

    res.status(201).json({ message: 'User registered successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?', 
      [email]
    );

    // If no user found with that email
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // users is an array, we want the first (and only) result
    const user = users[0];

    // bcrypt.compare checks if plain password matches the stored hash
    // Returns true or false
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // jwt.sign creates a token containing user data
    // This token is sent to frontend and stored there
    // Frontend sends this token with every future request to prove identity
    // '7d' means token expires after 7 days
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send token + basic user info back to frontend
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET PROFILE ─────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    // req.user was set by authMiddleware - contains the logged in user's id
    const [users] = await db.query(
      // We never return password - security best practice
      'SELECT user_id, firstname, lastname, email, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    res.status(200).json(users[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};