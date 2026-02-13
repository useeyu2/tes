const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Expense = require('../models/Expense');

// Monthly Summary
router.get('/summary/monthly', async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const verified = await Transaction.aggregate([
            { $match: { status: 'Verified', created_at: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const pending = await Transaction.aggregate([
            { $match: { status: 'Pending', created_at: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            success: true,
            data: {
                collected: verified[0]?.total || 0,
                pending: pending[0]?.total || 0,
                target: 1500 * (await User.countDocuments({ role: 'Member' }))
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch monthly summary', detail: e.message });
    }
});

// Annual Financial Report
router.get('/summary/annual', async (req, res) => {
    try {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        // Total Raised (Verified Transactions)
        const raisedResult = await Transaction.aggregate([
            { $match: { status: 'Verified', created_at: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRaised = raisedResult[0]?.total || 0;

        // Total Expenses
        const expenseResult = await Expense.aggregate([
            { $match: { date: { $gte: startOfYear } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalExpenses = expenseResult[0]?.total || 0;

        res.json({
            success: true,
            data: {
                total: totalRaised,
                expenses: totalExpenses,
                balance: totalRaised - totalExpenses
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch annual summary', detail: e.message });
    }
});

module.exports = router;
