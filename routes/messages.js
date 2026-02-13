const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { isAdmin } = require('../middlewares/authMiddleware');

// General middleware for any logged in user
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ detail: 'Invalid or expired token' });
    }
};

// Send Message (Member to Admin)
router.post('/send', verifyToken, async (req, res) => {
    try {
        const { content, subject } = req.body;

        const message = new Message({
            sender_id: req.user.id,
            sender_role: 'Member',
            content,
            subject: subject || 'General Inquiry'
        });

        await message.save();
        res.json({ success: true, message: 'Message sent to admin.', data: message });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// Get My Messages (Member)
router.get('/my', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender_id: req.user.id },
                { receiver_id: req.user.id }
            ]
        }).sort({ created_at: 1 });

        res.json({ success: true, data: messages });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// Admin: Get all conversations (list unique members who sent messages)
router.get('/admin/conversations', isAdmin, async (req, res) => {
    try {
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

        res.json({ success: true, data: enhancedConvs });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// Admin: Get specific conversation
router.get('/admin/user/:id', isAdmin, async (req, res) => {
    try {
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

        res.json({ success: true, data: messages });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// Admin: Reply
router.post('/admin/reply', isAdmin, async (req, res) => {
    try {
        const { receiver_id, content } = req.body;

        const message = new Message({
            sender_id: req.user.id,
            receiver_id,
            sender_role: 'Admin',
            content
        });

        await message.save();
        res.json({ success: true, message: 'Reply sent.', data: message });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

module.exports = router;
