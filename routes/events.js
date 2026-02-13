const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { isAdmin } = require('../middlewares/authMiddleware');

// GET / - List all upcoming events
router.get('/', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        today.setDate(today.getDate() - 1);

        const events = await Event.find({ date: { $gte: today } }).sort({ date: 1 });
        res.json({ success: true, data: events });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// GET /:id - Get event details
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('rsvps', 'full_name profile_picture');
        if (!event) return res.status(404).json({ success: false, detail: 'Event not found' });
        res.json({ success: true, data: event });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// POST / - Create Event (Admin Only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { title, description, date, time, location, imageUrl, organizer } = req.body;
        if (!title || !date) return res.status(400).json({ success: false, detail: 'Title and date are required' });

        const newEvent = new Event({
            title,
            description,
            date,
            time,
            location,
            imageUrl,
            organizer,
            created_by: req.user.id
        });

        const savedEvent = await newEvent.save();
        res.json({ success: true, message: 'Event created successfully', data: savedEvent });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// POST /:id/rsvp - Toggle RSVP
router.post('/:id/rsvp', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, detail: 'Event not found' });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, detail: 'Unauthorized' });

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
        res.status(500).json({ success: false, detail: e.message });
    }
});

// DELETE /:id - Delete Event (Admin Only)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ success: false, detail: 'Event not found' });
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

module.exports = router;

