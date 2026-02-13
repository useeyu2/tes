const express = require('express');
const router = express.Router();
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const upload = require('../services/uploadService');
const { isAdmin } = require('../middlewares/authMiddleware');

// GET /data - Get all voting data
router.get('/data', async (req, res) => {
    try {
        const positions = await Position.find({ is_active: true });
        const candidates = await Candidate.find().populate('position');
        const myVotes = await Vote.find({ voter: req.user.id });

        res.json({
            success: true,
            data: {
                positions,
                candidates,
                myVotes: myVotes.map(v => ({ positionId: v.position, candidateId: v.candidate }))
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// POST /vote - Cast a vote
router.post('/vote', async (req, res) => {
    try {
        const { positionId, candidateId } = req.body;

        // Check if already voted
        const existingVote = await Vote.findOne({ voter: req.user.id, position: positionId });
        if (existingVote) {
            return res.status(400).json({ success: false, detail: 'You have already voted for this position.' });
        }

        const newVote = new Vote({
            voter: req.user.id,
            position: positionId,
            candidate: candidateId
        });

        await newVote.save();
        await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes_count: 1 } });

        res.json({ success: true, message: 'Vote cast successfully!', data: newVote });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ success: false, detail: 'You have already voted for this position.' });
        }
        res.status(500).json({ success: false, detail: e.message });
    }
});

// --- ADMIN ROUTES ---

// POST /positions - Create Position
router.post('/positions', isAdmin, async (req, res) => {
    try {
        const { title, description, max_votes } = req.body;
        if (!title) return res.status(400).json({ success: false, detail: 'Title is required' });

        const position = new Position({ title, description, max_votes });
        await position.save();
        res.json({ success: true, message: 'Position created successfully', data: position });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// POST /candidates - Add Candidate
router.post('/candidates', isAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { full_name, manifesto, position } = req.body;
        if (!full_name || !position) return res.status(400).json({ success: false, detail: 'Full name and position are required' });

        const photoUrl = req.file ? req.file.path : null;
        const candidate = new Candidate({
            full_name,
            manifesto,
            position,
            photoUrl
        });
        await candidate.save();
        res.json({ success: true, message: 'Candidate added successfully', data: candidate });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

// GET /results - Get detailed results
router.get('/results', async (req, res) => {
    try {
        const positions = await Position.find({});
        const candidates = await Candidate.find({});

        const report = positions.map(pos => {
            const posCandidates = candidates.filter(c => c.position && c.position.toString() === pos._id.toString());
            return {
                id: pos._id,
                position: pos.title,
                candidates: posCandidates.map(c => ({
                    name: c.full_name,
                    votes: c.votes_count,
                    photo: c.photoUrl
                }))
            };
        });

        res.json({ success: true, data: report });
    } catch (e) {
        res.status(500).json({ success: false, detail: e.message });
    }
});

module.exports = router;

