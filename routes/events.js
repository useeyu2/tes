const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const upload = require('../services/uploadService'); // Assuming we reuse upload service if needed, though plan said optional image URL string. Let's support file upload if needed later, but for now stick to simple structure.

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

// GET / - List all upcoming events
router.get('/', verifyToken, async (req, res) => {
    try {
        // Sort by date ascending (soonest first)
        // Filter out past events if desired? For now, list all or just upcoming.
        // Let's filter date >= today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Go back 1 day to handle timezone differences
        today.setDate(today.getDate() - 1);

        console.log('[DEBUG] Filtering events since:', today);
        const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
        console.log('[DEBUG] Events found:', events.length);
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
router.post('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
        return res.status(403).json({ detail: 'Permission denied' });
    }

    try {
        const { title, description, date, time, location, imageUrl, organizer } = req.body;

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
        console.log('[DEBUG] Event Created:', savedEvent);
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
            // Join
            event.rsvps.push(userId);
            await event.save();
            res.json({ success: true, message: 'RSVP successful', status: 'joined' });
        } else {
            // Leave
            event.rsvps.splice(index, 1);
            await event.save();
            res.json({ success: true, message: 'RSVP cancelled', status: 'left' });
        }
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// DELETE /:id - Delete Event (Admin Only)
router.delete('/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
        return res.status(403).json({ detail: 'Permission denied' });
    }

    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
