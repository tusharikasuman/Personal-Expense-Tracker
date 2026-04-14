const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
const savingsGoalsRouter = require('./routes/savingsGoals');
// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/income', require('./routes/incomeRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/savings-goals', savingsGoalsRouter);

app.get('/', (req, res) => res.send('Expense Tracker API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

