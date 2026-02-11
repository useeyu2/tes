const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    // For development, we can mostly rely on console logs if credentials aren't present
    // But here is a placeholder structure for Gmail or others
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTP = async (email, otp) => {
    try {
        // 1. Log to console for development (Guaranteed method for user to see OTP)
        console.log(`\n==================================================`);
        console.log(`[EMAIL SERVICE] Sending OTP to ${email}`);
        console.log(`[OTP CODE]      ${otp}`);
        console.log(`==================================================\n`);

        // 2. Try sending real email if credentials exist
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const info = await transporter.sendMail({
                from: '"Alumni System" <no-reply@alumnisystem.com>',
                to: email,
                subject: 'Your Verification Code',
                text: `Your Super Admin verification code is: ${otp}. It expires in 5 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #1e3a8a;">Verification Code</h2>
                        <p>You are registering as a Super Admin.</p>
                        <p>Your OTP code is:</p>
                        <h1 style="background: #f3f4f6; display: inline-block; padding: 10px 20px; border-radius: 8px;">${otp}</h1>
                        <p>This code expires in 5 minutes.</p>
                    </div>
                `
            });
            console.log('Message sent: %s', info.messageId);
        } else {
            console.log('[EMAIL SERVICE] No real email credentials found in .env. check console for OTP.');
        }

        return true;
    } catch (error) {
        console.error('[EMAIL SERVICE ERROR]', error);
        return false;
    }
};

module.exports = { sendOTP };
