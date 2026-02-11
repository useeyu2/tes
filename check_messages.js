const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Message = require('./models/Message');
const User = require('./models/User');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        const messages = await Message.find({});
        console.log(`\nTotal Messages: ${messages.length}`);
        messages.forEach(m => {
            console.log(`- From: ${m.sender_role} (ID: ${m.sender_id}), Content: "${m.content.substring(0, 30)}..."`);
        });

        const distinctSenders = await Message.distinct('sender_id', { sender_role: 'Member' });
        console.log(`\nDistinct Member Senders: ${distinctSenders.length}`);

        for (const id of distinctSenders) {
            const user = await User.findById(id);
            console.log(`- Member: ${user ? user.full_name : 'NOT FOUND'} (${id})`);
        }

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
