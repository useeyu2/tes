const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Position = require('../models/Position');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
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

// GET /data - Get all voting data (Positions, Candidates, My Votes)
router.get('/data', verifyToken, async (req, res) => {
    try {
        const positions = await Position.find({ is_active: true });
        const candidates = await Candidate.find().populate('position');
        const myVotes = await Vote.find({ voter: req.user.id });

        res.json({
            positions,
            candidates,
            myVotes: myVotes.map(v => ({ positionId: v.position, candidateId: v.candidate }))
        });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// POST /vote - Cast a vote
router.post('/vote', verifyToken, async (req, res) => {
    try {
        const { positionId, candidateId } = req.body;

        // Check if already voted
        const existingVote = await Vote.findOne({ voter: req.user.id, position: positionId });
        if (existingVote) {
            return res.status(400).json({ detail: 'You have already voted for this position.' });
        }

        const newVote = new Vote({
            voter: req.user.id,
            position: positionId,
            candidate: candidateId
        });

        await newVote.save();

        // Increment candidate count
        await Candidate.findByIdAndUpdate(candidateId, { $inc: { votes_count: 1 } });

        res.json({ success: true, message: 'Vote cast successfully!', vote: newVote });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(400).json({ detail: 'You have already voted for this position.' });
        }
        res.status(500).json({ detail: e.message });
    }
});

// --- ADMIN ROUTES ---

// POST /positions - Create Position
router.post('/positions', verifyToken, async (req, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') return res.status(403).json({ detail: 'Denied' });
    try {
        const position = new Position(req.body);
        await position.save();
        res.json(position);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// POST /candidates - Add Candidate
router.post('/candidates', verifyToken, upload.single('photo'), async (req, res) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') return res.status(403).json({ detail: 'Denied' });
    try {
        const { full_name, manifesto, position } = req.body;
        const photoUrl = req.file ? req.file.path : null;

        const candidate = new Candidate({
            full_name,
            manifesto,
            position,
            photoUrl
        });
        await candidate.save();
        res.json(candidate);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

// GET /results - Get detailed results
router.get('/results', verifyToken, async (req, res) => {
    try {
        // Anyone can view results in this design (Transparency)
        // Or restrict to admin? Let's allow everyone.
        const positions = await Position.find({});
        const candidates = await Candidate.find({}); // Contains votes_count

        // Structure data for easier frontend consumption
        const report = positions.map(pos => {
            const posCandidates = candidates.filter(c => c.position.toString() === pos._id.toString());
            return {
                position: pos.title,
                candidates: posCandidates.map(c => ({
                    name: c.full_name,
                    votes: c.votes_count,
                    photo: c.photoUrl
                }))
            };
        });

        res.json(report);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

module.exports = router;
