const mongoose = require('mongoose');
const User = require('./models/User');
const Contribution = require('./models/Contribution');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/skosa_alumni');
        console.log('Connected to MongoDB');

        // 1. Find the user "Usman Umar"
        const user = await User.findOne({ full_name: /Usman Umar/i });
        if (!user) {
            console.log('User "Usman Umar" not found.');
            return;
        }

        console.log(`User Found: ${user.full_name}, Role: ${user.role}, ID: ${user._id}`);

        // 2. Check for contributions
        const contributions = await Contribution.find({ user_id: user._id });
        console.log(`Found ${contributions.length} contributions for this user.`);

        contributions.forEach(c => {
            console.log(`- Month: ${c.month}, Status: ${c.status}, Amount: ${c.amount_due}`);
        });

        if (user.role === 'SuperAdmin') {
            console.log('\n[WARNING] User is SuperAdmin. Monthly dues are NOT generated for SuperAdmins.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

checkData();
