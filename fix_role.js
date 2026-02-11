const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB via " + process.env.MONGODB_URL);

        const email = 'useeyuu2@gmail.com';

        // Find first
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found!");
            // List all emails
            const all = await User.find({}, 'email full_name');
            console.log("Available users:", all);
        } else {
            console.log(`Found user: ${user.full_name}, Role: ${user.role}`);
            user.role = 'SuperAdmin';
            await user.save();
            console.log(`UPDATED user: ${user.full_name} to Role: ${user.role}`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
