const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Photo = require('../models/Photo');
const upload = require('../services/uploadService');
const { isAdmin } = require('../middlewares/authMiddleware');

// GET / - List all photos
router.get('/', async (req, res) => {
    try {
        const photos = await Photo.find().sort({ uploaded_at: -1 });
        res.json({ success: true, data: photos });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// POST / - Upload Photos (Admin Only) - Supports multiple files
router.post('/', isAdmin, upload.array('photos', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Parse captions from request body (sent as JSON string or individual fields)
        let captions = [];
        if (req.body.captions) {
            try {
                captions = JSON.parse(req.body.captions);
            } catch (e) {
                captions = Array.isArray(req.body.captions) ? req.body.captions : [req.body.captions];
            }
        }

        // Create photo documents for each uploaded file
        const uploadedPhotos = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const caption = captions[i] || '';

            const newPhoto = new Photo({
                url: file.path,
                caption: caption
            });

            await newPhoto.save();
            uploadedPhotos.push(newPhoto);
        }

        res.json({
            success: true,
            message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
            data: uploadedPhotos
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Upload failed', detail: e.message });
    }
});

// DELETE /:id - Delete Photo (Admin Only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const photo = await Photo.findByIdAndDelete(req.params.id);
        if (!photo) return res.status(404).json({ success: false, detail: 'Photo not found' });
        res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

module.exports = router;

