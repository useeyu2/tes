const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { isAdmin } = require('../middlewares/authMiddleware');
const bcrypt = require('bcryptjs');

router.use(isAdmin);

// Create New Member
router.post('/members', async (req, res) => {
    try {
        const { full_name, username, email, phone, password } = req.body;

        // Validate required fields
        if (!full_name || !username || !email || !phone || !password) {
            return res.status(400).json({ detail: 'All fields are required' });
        }

        // Check for duplicates
        const existingUser = await User.findOne({
            $or: [{ email }, { username }, { phone }]
        });

        if (existingUser) {
            if (existingUser.email === email) return res.status(400).json({ detail: 'Email already exists' });
            if (existingUser.username === username) return res.status(400).json({ detail: 'Username already exists' });
            if (existingUser.phone === phone) return res.status(400).json({ detail: 'Phone number already exists' });
        }

        const hashed_password = bcrypt.hashSync(password, 10);
        const newUser = new User({
            full_name,
            username,
            email,
            phone,
            hashed_password,
            role: 'Member',
            is_approved: true, // Auto-approve admin created users
            is_active: true
        });

        await newUser.save();

        res.json({
            success: true,
            message: 'Member created successfully',
            data: {
                _id: newUser._id,
                full_name: newUser.full_name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Get All Members
router.get('/members', async (req, res) => {
    try {
        const members = await User.find().select('-hashed_password');
        res.json({ success: true, data: members });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Get Pending Transactions
router.get('/transactions', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const txs = await Transaction.find(query)
            .populate('user_id', 'email full_name')
            .sort({ created_at: -1 });

        // Flatten for frontend
        const result = txs.map(tx => ({
            _id: tx._id,
            user_id: tx.user_id._id,
            user_email: tx.user_id.email,
            amount: tx.amount,
            payment_method: tx.payment_method,
            reference_number: tx.reference_number,
            created_at: tx.created_at,
            contribution_id: tx.contribution_id,
            status: tx.status,
            proof_url: tx.proof_url ? tx.proof_url.replace(/\\/g, '/').replace('public/', '/') : null,
            months: tx.months
        }));

        res.json({ success: true, data: result });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Update Member Role
router.patch('/members/:memberId/role', async (req, res) => {
    try {
        const { memberId } = req.params;
        const { role } = req.body;

        // Validate role
        const allowedRoles = ['Member', 'Admin', 'SuperAdmin'];
        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({ detail: 'Invalid role. Must be one of: ' + allowedRoles.join(', ') });
        }

        // Find and update user using findByIdAndUpdate to bypass full validation (e.g. missing username on legacy docs)
        const user = await User.findByIdAndUpdate(
            memberId,
            { role: role },
            { new: true, runValidators: false } // Disable validation to allow legacy users without username
        );

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        res.json({
            data: {
                _id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Reset Member Password
router.post('/members/:id/reset-password', async (req, res) => {
    console.log(`[ADMIN] Password reset requested for user ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ detail: 'Password must be at least 6 characters long' });
        }

        const hashed_password = bcrypt.hashSync(newPassword, 10);
        const user = await User.findByIdAndUpdate(id, { hashed_password }, { new: true });

        if (!user) return res.status(404).json({ detail: 'User not found' });

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (e) {
        console.error('[ADMIN] Password reset error:', e);
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Get Pending Users (not approved)
router.get('/pending-users', async (req, res) => {
    try {
        const pendingUsers = await User.find({ is_approved: false }).select('-hashed_password');
        res.json({ success: true, data: pendingUsers });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Approve User
router.patch('/users/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(
            id,
            { is_approved: true },
            { new: true, runValidators: false }
        );

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User approved successfully',
            data: {
                _id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                is_approved: user.is_approved
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Toggle Member Status (Activate/Deactivate)
router.patch('/members/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const user = await User.findByIdAndUpdate(
            id,
            { is_active },
            { new: true, runValidators: false }
        );

        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        res.json({
            success: true,
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: {
                _id: user._id,
                full_name: user.full_name,
                is_active: user.is_active
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Delete Member Permanently
router.delete('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user first to check if they exist
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        // Delete the user
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: `User ${user.full_name} has been permanently deleted`,
            data: {
                _id: user._id,
                full_name: user.full_name
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

const reminderService = require('../services/reminderService');

// Send Reminders to all 'Due' members
router.post('/trigger-reminders', async (req, res) => {
    try {
        const count = await reminderService.sendReminders();
        res.json({ success: true, message: `Reminders sent to ${count} members` });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

const Message = require('../models/Message');
const Welfare = require('../models/Welfare');
const Event = require('../models/Event');
const Expense = require('../models/Expense');

// Delete Transaction (Rejected only)
router.delete('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Find the transaction first
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ detail: 'Transaction not found' });
        }

        // Only allow deletion of rejected transactions
        if (transaction.status !== 'Rejected') {
            return res.status(400).json({
                detail: 'Only rejected transactions can be deleted',
                currentStatus: transaction.status
            });
        }

        // Delete the transaction
        await Transaction.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Rejected transaction deleted successfully',
            data: {
                _id: transaction._id,
                amount: transaction.amount,
                status: transaction.status
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

// Dashboard Overview Stats
router.get('/overview', async (req, res) => {
    try {
        const [
            unreadMessages,
            pendingWelfare,
            pendingApprovals,
            upcomingEvents,
            recentWelfare,
            recentExpenses,
            upcomingEventsList
        ] = await Promise.all([
            Message.countDocuments({
                $or: [
                    { receiver_id: req.user.id },
                    { receiver_id: null, sender_role: 'Member' }
                ],
                is_read: false
            }),
            Welfare.countDocuments({ status: 'Pending' }),
            Transaction.countDocuments({ status: 'Pending' }), // Approvals card
            Event.countDocuments({ date: { $gte: new Date() } }),
            Welfare.find().populate('user_id', 'full_name').sort({ created_at: -1 }).limit(3),
            Expense.find().sort({ date: -1 }).limit(3),
            Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(3)
        ]);

        const stats = {
            unreadMessages,
            pendingWelfare,
            pendingApprovals,
            upcomingEvents,
            recentWelfare: recentWelfare.map(r => ({
                _id: r._id,
                user_name: r.user_id?.full_name || 'Unknown',
                type: r.request_type,
                amount: r.amount_requested,
                status: r.status
            })),
            recentExpenses,
            upcomingEventsList
        };
        res.json({ success: true, data: stats });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, detail: e.message });
    }
});

module.exports = router;
