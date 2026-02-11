const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        const email = 'useeyuu2@gmail.com'; // usman umar's email from check_messages.js
        const result = await User.findOneAndUpdate(
            { email },
            { role: 'SuperAdmin' },
            { new: true }
        );

        if (result) {
            console.log(`Successfully promoted ${result.full_name} to ${result.role}`);
        } else {
            console.log(`User with email ${email} not found.`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
