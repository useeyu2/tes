const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    identifier: { type: String, required: true }, // Can be email or phone
    otp: { type: String, required: true },
    created_at: { type: Date, default: Date.now, expires: 300 }
});

module.exports = mongoose.model('OTP', otpSchema);
