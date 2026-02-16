const Contribution = require('../models/Contribution');
const User = require('../models/User');
const emailService = require('./emailService');

const sendReminders = async () => {
    try {
        // Find contributions that are 'Due' (generated but not paid)
        const pending = await Contribution.find({ status: 'Due' }).populate('user_id');
        let count = 0;

        for (const contrib of pending) {
            if (contrib.user_id && contrib.user_id.email) {
                const amount = contrib.amount_due || 1000;
                console.log(`[BREVO] Sending reminder to ${contrib.user_id.full_name} (${contrib.user_id.email}) for month ${contrib.month} (Amount: ₦${amount})`);
                await emailService.sendReminderEmail(contrib.user_id.email, contrib.user_id.full_name, contrib.month, amount);
                count++;
            }
        }

        return count;
    } catch (e) {
        console.error("Reminder error:", e);
        return 0;
    }
};

module.exports = { sendReminders };
