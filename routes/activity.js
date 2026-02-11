const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Welfare = require('../models/Welfare');
const jwt = require('jsonwebtoken');

router.get('/all', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const txs = await Transaction.find({ user_id: decoded.id }).sort({ created_at: -1 });
        const welfare = await Welfare.find({ user_id: decoded.id }).sort({ created_at: -1 });

        const activity = [
            ...txs.map(t => ({
                type: 'payment',
                title: `${t.category} Submission`,
                subtitle: `${t.month ? t.month + ' - ' : ''}₦${t.amount.toLocaleString()}`,
                status: t.status,
                date: t.created_at
            })),
            ...welfare.map(w => ({
                type: 'welfare',
                title: `Welfare Request: ${w.request_type}`,
                subtitle: `₦${w.amount_requested.toLocaleString()}`,
                status: w.status,
                date: w.created_at
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(activity);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

router.get('/recent', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch last 5 transactions
        const txs = await Transaction.find({ user_id: decoded.id })
            .sort({ created_at: -1 })
            .limit(5);

        // Fetch last 5 welfare requests
        const welfare = await Welfare.find({ user_id: decoded.id })
            .sort({ created_at: -1 })
            .limit(5);

        // Combine and sort
        const activity = [
            ...txs.map(t => ({
                type: 'payment',
                title: `${t.category} Submission`,
                subtitle: `${t.month ? t.month + ' - ' : ''}₦${t.amount.toLocaleString()}`,
                status: t.status,
                date: t.created_at
            })),
            ...welfare.map(w => ({
                type: 'welfare',
                title: `Welfare Request: ${w.request_type}`,
                subtitle: `₦${w.amount_requested.toLocaleString()}`,
                status: w.status,
                date: w.created_at
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        res.json(activity);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
