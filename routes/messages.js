const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Send Message (Member to Admin)
router.post('/send', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { content, subject } = req.body;

        const message = new Message({
            sender_id: decoded.id,
            sender_role: 'Member',
            content,
            subject: subject || 'General Inquiry'
        });

        await message.save();
        res.json({ success: true, message: 'Message sent to admin.' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Get My Messages (Member)
router.get('/my', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const messages = await Message.find({
            $or: [
                { sender_id: decoded.id },
                { receiver_id: decoded.id }
            ]
        }).sort({ created_at: 1 });

        res.json(messages);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Admin: Get all conversations (list unique members who sent messages)
router.get('/admin/conversations', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify admin role
        const user = await User.findById(decoded.id);
        if (!user || user.role === 'Member') {
            return res.status(403).json({ detail: 'Access Denied: Admin role required' });
        }

        const members = await Message.distinct('sender_id', { sender_role: 'Member' });
        const conversations = await User.find({ _id: { $in: members } }, 'full_name email phone profile_picture');

        // Enhance with last message and unread count
        const enhancedConvs = await Promise.all(conversations.map(async (m) => {
            const lastMsg = await Message.findOne({
                $or: [{ sender_id: m._id }, { receiver_id: m._id }]
            }).sort({ created_at: -1 });

            const unreadCount = await Message.countDocuments({
                sender_id: m._id,
                is_read: false
            });

            return {
                ...m.toObject(),
                last_message: lastMsg,
                unread_count: unreadCount
            };
        }));

        res.json(enhancedConvs);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Admin: Get specific conversation
router.get('/admin/user/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await User.findById(decoded.id);
        if (!admin || admin.role === 'Member') {
            return res.status(403).json({ detail: 'Access Denied: Admin role required' });
        }

        const messages = await Message.find({
            $or: [
                { sender_id: req.params.id },
                { receiver_id: req.params.id }
            ]
        }).sort({ created_at: 1 });

        // Mark as read
        await Message.updateMany(
            { sender_id: req.params.id, is_read: false },
            { is_read: true }
        );

        res.json(messages);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Admin: Reply
router.post('/admin/reply', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await User.findById(decoded.id);
        if (!admin || admin.role === 'Member') {
            return res.status(403).json({ detail: 'Access Denied: Admin role required' });
        }

        const { receiver_id, content } = req.body;

        const message = new Message({
            sender_id: decoded.id,
            receiver_id,
            sender_role: 'Admin',
            content
        });

        await message.save();
        res.json({ success: true, message: 'Reply sent.' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
