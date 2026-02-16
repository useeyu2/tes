const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    contribution_amount: { type: Number, default: 1000 },
    bank_name: { type: String, default: 'GT Bank' },
    account_number: { type: String, default: '1029215993' },
    account_name: { type: String, default: 'Usman Umar' },
    contact_email: { type: String, default: '' },
    contact_phone: { type: String, default: '' },
    updated_at: { type: Date, default: Date.now }
});

// Ensure only one document exists
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
