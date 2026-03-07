const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
  getDashboard,
  getMonthlyTrend,
  getNotifications
} = require('../controllers/dashboardController');

router.get('/', verifyToken, getDashboard);              // GET /api/dashboard?month=11&year=2023
router.get('/trend', verifyToken, getMonthlyTrend);      // GET /api/dashboard/trend
router.get('/notifications', verifyToken, getNotifications); // GET /api/dashboard/notifications

module.exports = router;