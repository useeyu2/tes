const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor_id: { type: String, required: true }, // User ID or "SYSTEM"
    action: { type: String, required: true }, // e.g., "VERIFY_PAYMENT"
    resource: { type: String, required: true }, // e.g., "transactions"
    target_id: String,
    details: mongoose.Schema.Types.Mixed,
    ip_address: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
