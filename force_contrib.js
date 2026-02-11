const mongoose = require('mongoose');
const User = require('./models/User');
const Contribution = require('./models/Contribution');
require('dotenv').config();

async function forceContribution() {
    try {
        if (!process.env.MONGODB_URL) {
            console.error('MONGODB_URL not found in .env');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ full_name: /Usman Umar/i });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Found User: ${user.full_name}, Role: ${user.role}`);

        const today = new Date();
        const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // Check if exists
        const exists = await Contribution.findOne({ user_id: user._id, month });
        if (exists) {
            console.log('Contribution already exists:', exists);
            // Force status to Due if it's not Paid
            if (exists.status !== 'Paid') {
                exists.status = 'Due';
                await exists.save();
                console.log('Updated status to Due');
            }
        } else {
            const newContrib = await Contribution.create({
                user_id: user._id,
                month,
                year: today.getFullYear(),
                amount_due: 2000,
                status: 'Due',
                due_date: new Date(today.getFullYear(), today.getMonth() + 1, 5)
            });
            console.log('Created new Due contribution:', newContrib);
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

forceContribution();
