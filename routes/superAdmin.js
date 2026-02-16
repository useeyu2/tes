const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendSMS } = require('../utils/smsService');
const bcrypt = require('bcryptjs');
const { isAdmin } = require('../middlewares/authMiddleware');
const { isSuperAdmin } = require('../middlewares/superAdminMiddleware');
const SystemSettings = require('../models/SystemSettings');

// 1. Direct Registration Route
router.post('/register', async (req, res) => {
    try {
        const { full_name, username, email, phone, password, confirm_password } = req.body;

        // Basic Validations
        if (!full_name || !username || !email || !phone || !password || !confirm_password) {
            return res.status(400).json({ detail: 'All fields are required' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ detail: 'Passwords do not match' });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [{ email }, { username }, { phone }]
        });
        if (existingUser) {
            return res.status(400).json({ detail: 'Email, Phone or Username already exists' });
        }

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Super Admin
        const newUser = new User({
            full_name,
            username,
            email,
            phone,
            hashed_password: hashedPassword, // Fixed field name
            role: 'SuperAdmin',
            contribution_score: 0
        });

        await newUser.save();

        res.json({ success: true, message: 'Super Admin registered successfully!' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ detail: e.message });
    }
});

// --- Settings Management (Super Admin Only) ---

// Get Settings
router.get('/settings', isAdmin, isSuperAdmin, async (req, res) => {
    try {
        const settings = await SystemSettings.getSettings();
        res.json({ success: true, data: settings });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Update Settings
router.put('/settings', isAdmin, isSuperAdmin, async (req, res) => {
    try {
        const { contribution_amount, bank_name, account_number, account_name, contact_email, contact_phone } = req.body;

        const settings = await SystemSettings.getSettings();

        if (contribution_amount) settings.contribution_amount = contribution_amount;
        if (bank_name) settings.bank_name = bank_name;
        if (account_number) settings.account_number = account_number;
        if (account_name) settings.account_name = account_name;
        if (contact_email !== undefined) settings.contact_email = contact_email;
        if (contact_phone !== undefined) settings.contact_phone = contact_phone;

        settings.updated_at = Date.now();
        await settings.save();

        res.json({ success: true, message: 'System settings updated successfully', data: settings });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
