const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
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

// GET / - List all upcoming events
router.get('/', verifyToken, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        today.setDate(today.getDate() - 1);

        const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
        res.json(events);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// GET /:id - Get event details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('rsvps', 'full_name profile_picture');
        if (!event) return res.status(404).json({ detail: 'Event not found' });
        res.json(event);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// POST / - Create Event (Admin Only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { title, description, date, time, location, imageUrl, organizer } = req.body;
        if (!title || !date) return res.status(400).json({ detail: 'Title and date are required' });

        const newEvent = new Event({
            title,
            description,
            date,
            time,
            location,
            imageUrl,
            organizer
        });

        const savedEvent = await newEvent.save();
        res.json({ success: true, message: 'Event created successfully', event: savedEvent });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// POST /:id/rsvp - Toggle RSVP
router.post('/:id/rsvp', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ detail: 'Event not found' });

        const userId = req.user.id;
        const index = event.rsvps.indexOf(userId);

        if (index === -1) {
            event.rsvps.push(userId);
            await event.save();
            res.json({ success: true, message: 'RSVP successful', status: 'joined' });
        } else {
            event.rsvps.splice(index, 1);
            await event.save();
            res.json({ success: true, message: 'RSVP cancelled', status: 'left' });
        }
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// DELETE /:id - Delete Event (Admin Only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ detail: 'Event not found' });
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
