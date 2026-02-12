const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Photo = require('../models/Photo');
const upload = require('../services/uploadService');
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
router.post('/', isAdmin, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ detail: 'No file uploaded' });

        const newPhoto = new Photo({
            url: req.file.path,
            caption: req.body.caption || ''
        });

        await newPhoto.save();
        res.json({ success: true, message: 'Photo uploaded successfully', photo: newPhoto });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// DELETE /:id - Delete Photo (Admin Only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const photo = await Photo.findByIdAndDelete(req.params.id);
        if (!photo) return res.status(404).json({ detail: 'Photo not found' });
        res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
