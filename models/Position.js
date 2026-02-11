const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    description: String,
    max_votes: { type: Number, default: 1 }, // Typically 1, but maybe select 2 council members etc.
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Position', positionSchema);
