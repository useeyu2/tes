const Contribution = require('../models/Contribution');
const User = require('../models/User');

const sendReminders = async () => {
    try {
        const pending = await Contribution.find({ status: 'Pending' }).populate('user_id');
        let count = 0;

        for (const contrib of pending) {
            // In a real system, you would call an SMS/Email API here
            console.log(`[SIMULATION] Sending reminder to ${contrib.user_id.full_name} (${contrib.user_id.email}) for month ${contrib.month}`);
            count++;
        }

        return count;
    } catch (e) {
        console.error("Reminder error:", e);
        return 0;
    }
};

module.exports = { sendReminders };
