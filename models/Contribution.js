const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // Format: "YYYY-MM"
    year: { type: Number, required: true },
    amount_due: { type: Number, required: true },
    amount_paid: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending', 'Due', 'Late', 'Waived'], default: 'Due' },
    due_date: { type: Date, required: true },
    paid_at: Date
}, { timestamps: true });

contributionSchema.index({ user_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Contribution', contributionSchema);
