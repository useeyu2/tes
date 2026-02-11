require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const email = 'useeyuuu2@gmail.com';
        const newPassword = 'password123';
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        if (!user.username) {
            user.username = user.email.split('@')[0];
            console.log(`Setting missing username to: ${user.username}`);
        }
        user.hashed_password = hashedPassword;
        user.is_approved = true; // Ensure user is approved
        user.is_active = true;   // Ensure user is active
        await user.save();

        console.log(`Password reset for ${user.email} to: ${newPassword}`);
        console.log(`User Approved: ${user.is_approved}`);
        console.log(`User Active: ${user.is_active}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
