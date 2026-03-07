const express = require('express');
// Router lets us define routes separately from server.js - keeps code organized
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');

// verifyToken is our middleware - only used on routes that need authentication
const verifyToken = require('../middleware/authMiddleware');

// Public routes - anyone can access these (no token needed)
router.post('/register', register);   // POST /api/auth/register
router.post('/login', login);         // POST /api/auth/login

// Protected route - must be logged in (token required)
// verifyToken runs first, then getProfile
router.get('/profile', verifyToken, getProfile);  // GET /api/auth/profile

module.exports = router;