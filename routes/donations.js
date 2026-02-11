const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');
const upload = require('../services/uploadService');

// Submit Donation
router.post('/submit', upload.single('proof'), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { amount, payment_method, reference_number, description } = req.body;

        const transaction = new Transaction({
            user_id: decoded.id,
            amount: Number(amount),
            type: 'Donation',
            category: 'Donation',
            payment_method,
            reference_number,
            message: description,
            proof_url: req.file ? req.file.path : null,
            status: 'Pending'
        });

        await transaction.save();
        res.json({ message: 'Donation submitted successfully!', transaction });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
