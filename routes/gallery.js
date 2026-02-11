const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Photo = require('../models/Photo');
const upload = require('../services/uploadService');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ detail: 'Invalid token' });
    }
};

// GET / - List all photos
router.get('/', verifyToken, async (req, res) => {
    try {
        const photos = await Photo.find().sort({ uploaded_at: -1 });
        res.json(photos);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// POST / - Upload Photo (Admin Only)
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
        return res.status(403).json({ detail: 'Permission denied' });
    }

    try {
        if (!req.file) return res.status(400).json({ detail: 'No file uploaded' });

        const newPhoto = new Photo({
            url: `/uploads/${req.file.filename}`, // Assuming local storage for now
            caption: req.body.caption || ''
        });

        await newPhoto.save();
        res.json({ success: true, message: 'Photo uploaded successfully', photo: newPhoto });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// DELETE /:id - Delete Photo (Admin Only)
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
        return res.status(403).json({ detail: 'Permission denied' });
    }

    try {
        await Photo.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
