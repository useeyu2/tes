const express = require('express');
const router = express.Router();
const Welfare = require('../models/Welfare');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../middlewares/authMiddleware');

// Create Request (Member)
router.post('/request', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { request_type, amount_requested, description } = req.body;
        const request = await Welfare.create({
            user_id: decoded.id,
            request_type,
            amount_requested,
            description
        });

        res.json({ message: "Request submitted successfully", request });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// My Requests (Member)
router.get('/my-requests', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const requests = await Welfare.find({ user_id: decoded.id }).sort({ created_at: -1 });
        res.json(requests);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Get All (Admin)
router.get('/all', isAdmin, async (req, res) => {
    try {
        const requests = await Welfare.find().populate('user_id', 'full_name email').sort({ created_at: -1 });

        const result = requests.map(r => ({
            _id: r._id,
            user_id: r.user_id._id,
            user_name: r.user_id.full_name,
            user_email: r.user_id.email,
            request_type: r.request_type,
            amount_requested: r.amount_requested,
            description: r.description,
            status: r.status,
            created_at: r.created_at
        }));

        res.json(result);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Update Request Status (Admin)
router.patch('/:id/status', isAdmin, async (req, res) => {
    try {
        const { status, admin_comments } = req.body;
        const validStatuses = ['Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Disbursed'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ detail: 'Invalid status' });
        }

        const request = await Welfare.findByIdAndUpdate(
            req.params.id,
            { status, admin_comments, updated_at: Date.now() },
            { new: true }
        );

        if (!request) return res.status(404).json({ detail: 'Request not found' });

        res.json({ message: `Status updated to ${status}`, request });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Update Request Details (Admin)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { request_type, amount_requested, description } = req.body;
        const request = await Welfare.findByIdAndUpdate(
            req.params.id,
            { request_type, amount_requested, description, updated_at: Date.now() },
            { new: true }
        );

        if (!request) return res.status(404).json({ detail: 'Request not found' });

        res.json({ message: "Request updated successfully", request });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Delete Request (Admin)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const request = await Welfare.findByIdAndDelete(req.params.id);
        if (!request) return res.status(404).json({ detail: 'Request not found' });

        res.json({ message: "Request deleted successfully" });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
