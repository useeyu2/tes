require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Contribution = require('./models/Contribution');
const Welfare = require('./models/Welfare');
const Transaction = require('./models/Transaction');
const Message = require('./models/Message');
const OTP = require('./models/OTP');
const Position = require('./models/Position');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');
const Event = require('./models/Event');
const Photo = require('./models/Photo');
const Expense = require('./models/Expense');
const AuditLog = require('./models/AuditLog');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB for cleanup...');

        const collectionsToClear = [
            { name: 'Contributions', model: Contribution },
            { name: 'Welfare Requests', model: Welfare },
            { name: 'Transactions', model: Transaction },
            { name: 'Messages', model: Message },
            { name: 'OTPs', model: OTP },
            { name: 'Positions', model: Position },
            { name: 'Candidates', model: Candidate },
            { name: 'Votes', model: Vote },
            { name: 'Events', model: Event },
            { name: 'Photos', model: Photo },
            { name: 'Expenses', model: Expense },
            { name: 'Audit Logs', model: AuditLog }
        ];

        for (const item of collectionsToClear) {
            const result = await item.model.deleteMany({});
            console.log(`Cleared ${item.name}: ${result.deletedCount} records deleted.`);
        }

        // Handle Users separately to preserve Admin
        const admins = await User.find({ role: { $in: ['Admin', 'SuperAdmin'] } });
        console.log(`Found ${admins.length} Admin/SuperAdmin accounts to preserve.`);

        const result = await User.deleteMany({ role: { $nin: ['Admin', 'SuperAdmin'] } });
        console.log(`Cleared non-admin Users: ${result.deletedCount} records deleted.`);

        console.log('\n--- Cleanup Complete ---');
        console.log('Admins remaining:');
        admins.forEach(u => console.log(`- ${u.full_name} (${u.email}) [${u.role}]`));

        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanup();
