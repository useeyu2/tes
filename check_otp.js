const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OTP = require('./models/OTP');

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        const otps = await OTP.find({});
        console.log(`\nTotal OTPs in DB: ${otps.length}`);
        otps.forEach(o => {
            console.log(`- Email: '${o.email}', Code: '${o.otp}', Created: ${o.created_at}`);
            const timeDiff = (new Date() - new Date(o.created_at)) / 1000;
            console.log(`  Time since creation: ${timeDiff} seconds (Expires in 300s)`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
