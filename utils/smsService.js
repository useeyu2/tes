const dotenv = require('dotenv');

dotenv.config();

const sendSMS = async (phone, otp) => {
    try {
        // 1. Log to console for development (Guaranteed method for user to see OTP without paying for SMS)
        console.log(`\n==================================================`);
        console.log(`[SMS SERVICE]   Sending OTP to ${phone}`);
        console.log(`[OTP CODE]      ${otp}`);
        console.log(`==================================================\n`);

        // 2. Placeholder for Real SMS Provider (e.g., Twilio)
        // If the user adds keys later, we can uncomment and implement this:
        /*
        if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
            const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            await client.messages.create({
                body: `Your Super Admin verification code is: ${otp}`,
                from: process.env.TWILIO_PHONE,
                to: phone
            });
        }
        */

        return true;
    } catch (error) {
        console.error('[SMS SERVICE ERROR]', error);
        return false;
    }
};

module.exports = { sendSMS };
