const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    url: { type: String, required: true },
    caption: String,
    uploaded_at: { type: Date, default: Date.now },
    width: Number,
    height: Number
});

module.exports = mongoose.model('Photo', photoSchema);
