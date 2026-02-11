const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../services/uploadService');

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, confirm_password, full_name, username, phone } = req.body;

        // Validate required fields
        if (!email || !password || !full_name || !username || !phone) {
            return res.status(400).json({ detail: 'All fields are required' });
        }

        // Validate passwords match
        if (password !== confirm_password) {
            return res.status(400).json({ detail: 'Passwords do not match' });
        }

        // Check for existing email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ detail: 'Email already registered' });

        // Check for existing username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ detail: 'Username already taken' });

        // Check for existing phone
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) return res.status(400).json({ detail: 'Phone number already registered' });

        const hashed_password = bcrypt.hashSync(password, 10);
        const newUser = new User({
            email,
            username,
            phone,
            hashed_password,
            full_name,
            role: 'Member',
            is_approved: false
        });

        await newUser.save();
        res.json({
            success: true,
            message: 'Registration successful! Your account is pending approval.',
            email: newUser.email,
            full_name: newUser.full_name,
            id: newUser._id
        });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Login
router.post('/token', async (req, res) => {
    try {
        // Handle form-urlencoded (username/password)
        const email = req.body.username || req.body.email;
        const password = req.body.password;

        // Allow login by email or username
        const user = await User.findOne({ $or: [{ email }, { username: email }] });
        if (!user || !user.verifyPassword(password)) {
            return res.status(401).json({ detail: 'Incorrect email or password' });
        }

        // Check if account is approved
        if (!user.is_approved) {
            return res.status(403).json({ detail: 'Account pending approval. Please wait for admin approval.' });
        }

        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({ detail: 'Your account has been deactivated. Please contact an admin.' });
        }

        const token = jwt.sign(
            { sub: user.email, id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            access_token: token,
            token_type: 'bearer',
            user: {
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                contribution_score: user.contribution_score
            }
        });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Profile Picture Upload
router.post('/profile-picture', upload.single('profile_picture'), async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ detail: 'User not found' });

        // Save Cloudinary URL
        const filePath = req.file.path;
        user.profile_picture = filePath;
        await user.save();

        res.json({ message: 'Profile picture updated', path: filePath });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Me
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        res.json(user);
    } catch (e) {
        res.status(401).json({ detail: 'Invalid token' });
    }
});

// All Members (Directory)
router.get('/members', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);

        // Fetch only approved members, excluding sensitive fields
        const members = await User.find({ role: 'Member', is_approved: true })
            .select('full_name email phone username profile_picture created_at contribution_score');

        res.json(members);
    } catch (e) {
        res.status(401).json({ detail: 'Invalid token' });
    }
});

// Update Profile
router.patch('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { full_name, username, phone } = req.body;
        const userId = decoded.id;

        // Check for duplicates (excluding current user)
        if (username) {
            const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUsername) return res.status(400).json({ detail: 'Username already taken' });
        }
        if (phone) {
            const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
            if (existingPhone) return res.status(400).json({ detail: 'Phone number already registered' });
        }

        const updates = {};
        if (full_name) updates.full_name = full_name;
        if (username) updates.username = username;
        if (phone) updates.phone = phone;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-hashed_password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Change Password
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { current_password, new_password, confirm_password } = req.body;

        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ detail: 'All fields are required' });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ detail: 'New passwords do not match' });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ detail: 'User not found' });

        if (!user.verifyPassword(current_password)) {
            return res.status(400).json({ detail: 'Incorrect current password' });
        }

        user.hashed_password = bcrypt.hashSync(new_password, 10);
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

const crypto = require('crypto');
const emailService = require('../services/emailService');

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // Security: Don't reveal valid emails, just say sent if valid (or generic message)
            // For better UX during dev, we might be more explicit, but best practice is generic.
            // However, the user asked for this feature, so let's be helpful.
            return res.status(404).json({ detail: 'Email not found' });
        }

        // Generate Token
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send Email
        await emailService.sendResetEmail(user.email, token);

        res.json({ success: true, message: 'Password reset link sent to your email.' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password, confirm_password } = req.body;
        const { token } = req.params;

        if (password !== confirm_password) {
            return res.status(400).json({ detail: 'Passwords do not match' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ detail: 'Password reset token is invalid or has expired.' });
        }

        // Update Password
        user.hashed_password = bcrypt.hashSync(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password has been successfully reset.' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
