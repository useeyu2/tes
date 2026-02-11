const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    manifesto: String,
    photoUrl: String,
    position: { type: mongoose.Schema.Types.ObjectId, ref: 'Position', required: true },
    votes_count: { type: Number, default: 0 } // Cache count for performance
});

module.exports = mongoose.model('Candidate', candidateSchema);
