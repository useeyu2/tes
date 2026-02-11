const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        const allUsers = await User.find({});
        console.log(`\nAll Users in DB: ${allUsers.length}`);
        allUsers.forEach(u => {
            console.log(`- User: ${u.full_name}, Email: ${u.email}, Role: ${u.role}, ID: ${u._id}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
