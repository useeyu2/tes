const brevo = require('@getbrevo/brevo');

const apiInstance = new brevo.TransactionalEmailsApi();
if (process.env.BREVO_API_KEY) {
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
}

const sendResetEmail = async (to, tokenOrCode) => {
    // Determine if it's a code (6 digits) or a token (longer hex)
    const isCode = tokenOrCode.length === 6 && !isNaN(tokenOrCode);
    const resetLink = `https://${process.env.VERCEL_URL || 'localhost:8080'}/reset-password/${tokenOrCode}`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Password Reset Request - SKOSA";
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = { name: "SKOSA Alumni", email: process.env.EMAIL_FROM || "noreply@skosa.com" };

    sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1e3a8a;">Password Reset Request</h2>
            <p>You requested a password reset for your SKOSA account.</p>
            ${isCode ? `
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">${tokenOrCode}</span>
                </div>
                <p>Enter this 6-digit code on the reset page to continue.</p>
            ` : `
                <p>Please click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="padding: 12px 24px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
            `}
            <p style="font-size: 12px; color: #666; margin-top: 30px;">This code/link will expire in 1 hour.</p>
            <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        </div>
    `;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Reset email sent to ${to} via Brevo`);
        return true;
    } catch (error) {
        console.error('❌ Brevo Email Error:', error);
        return false;
    }
};

const sendReminderEmail = async (to, name, month, amount = 1000) => {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Contribution Reminder - ${month}`;
    sendSmtpEmail.to = [{ email: to, name: name }];
    sendSmtpEmail.sender = { name: "SKOSA Alumni", email: process.env.EMAIL_FROM || "noreply@skosa.com" };

    sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1e3a8a;">Contribution Reminder</h2>
            <p>Dear ${name},</p>
            <p>This is a friendly reminder regarding your alumni contribution for <strong>${month}</strong>.</p>
            <p>The monthly contribution amount is <strong>₦${amount.toLocaleString()}</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://${process.env.VERCEL_URL || 'localhost:8080'}/contributions" style="padding: 12px 24px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Pay Contribution</a>
            </div>
            <p>If you have already made this payment, please ensure you have uploaded your proof of payment on the portal.</p>
            <p>Thank you for your continued support!</p>
        </div>
    `;

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Reminder email sent to ${to} via Brevo`);
        return true;
    } catch (error) {
        console.error('❌ Brevo Reminder Error:', error);
        return false;
    }
};

module.exports = { sendResetEmail, sendReminderEmail };
