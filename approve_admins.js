require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function approveAdmins() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const result = await User.updateMany(
            { role: { $in: ['SuperAdmin', 'Admin'] } },
            { $set: { is_approved: true } }
        );

        console.log(`✅ Approved ${result.modifiedCount} admin/superadmin accounts`);

        const admins = await User.find({ role: { $in: ['SuperAdmin', 'Admin'] } });
        console.log('\nAdmin accounts:');
        admins.forEach(admin => {
            console.log(`  - ${admin.full_name} (${admin.email}) - Role: ${admin.role} - Approved: ${admin.is_approved}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

approveAdmins();
