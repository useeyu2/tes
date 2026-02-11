const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendSMS } = require('../utils/smsService');
const bcrypt = require('bcryptjs');

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

module.exports = router;
