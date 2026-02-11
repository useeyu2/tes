const nodemailer = require('nodemailer');

const sendResetEmail = async (to, token) => {
    const resetLink = `http://localhost:8080/reset-password/${token}`;

    // Check if email credentials exist
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: 'Password Reset Request - SKOSA',
            html: `
                <h3>Password Reset Request</h3>
                <p>You requested a password reset. Please click the link below to reset your password:</p>
                <a href="${resetLink}" style="padding: 10px 20px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending email:', error);
            // Fallback to console log in dev
            console.log('--- SIMULATED EMAIL ---');
            console.log(`To: ${to}`);
            console.log(`Reset Link: ${resetLink}`);
            console.log('-----------------------');
            return false;
        }
    } else {
        // Simulation Mode
        console.log('--- SIMULATED EMAIL (No Credentials) ---');
        console.log(`To: ${to}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('----------------------------------------');
        return true;
    }
};

module.exports = { sendResetEmail };
