const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    timestamp: { type: Date, default: Date.now }
});

// Prevent multiple votes for the same position by the same user
voteSchema.index({ voter: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
