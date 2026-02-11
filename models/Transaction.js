const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['Contribution', 'Donation', 'Welfare', 'Project'], default: 'Contribution' },
    payment_method: { type: String, required: true }, // "Bank Transfer", "Cash", etc.
    reference_number: String,
    proof_url: String, // Path to receipt/pdf
    category: { type: String, enum: ['Contribution', 'Donation', 'Welfare', 'Project'], default: 'Contribution' },
    status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    contribution_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contribution' }, // Optional link
    month: String, // Single month (deprecated, use months)
    months: [String], // Array of months: ["2026-01", "2026-02"]
    message: String, // Motivation / Note
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verified_at: Date,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
