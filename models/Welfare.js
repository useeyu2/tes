const mongoose = require('mongoose');

const welfareSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    request_type: {
        type: String,
        enum: ['Medical Emergency', 'Bereavement', 'Wedding', 'Job Loss', 'Other'],
        required: true
    },
    amount_requested: { type: Number, required: true },
    description: { type: String, required: true },
    proof_docs: [String],
    status: {
        type: String,
        enum: ['Pending', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Disbursed'],
        default: 'Pending'
    },
    admin_comments: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Welfare', welfareSchema);
