require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'public')));

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

console.log('Middleware initialized');

// Debug Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// View Engine
// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Database Connection
// Database Connection (Serverless Pattern)
let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('=> Using existing database connection');
        return;
    }

    const dbUrl = process.env.MONGODB_URL || process.env.MONGODB_Url;

    if (!dbUrl) {
        console.error('❌ MONGODB_URL (or MONGODB_Url) is missing!');
        return;
    }

    console.log('=> Creating new database connection...');
    try {
        const db = await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 5000,
        });
        isConnected = db.connections[0].readyState;
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
    }
};

// Connect immediately
connectDB();

// Ensure connection is established before processing requests (Middleware)
app.use(async (req, res, next) => {
    if (!isConnected) {
        await connectDB();
    }
    next();
});

// Debug Root Route
// app.get('/', (req, res) => res.send('Server is Running (Debug Mode)'));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/contributions', require('./routes/contributions'));
app.use('/api/v1/welfare', require('./routes/welfare'));
app.use('/api/v1/reports', require('./routes/reports'));
app.use('/api/v1/activity', require('./routes/activity'));
app.use('/api/v1/donations', require('./routes/donations'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/super-admin', require('./routes/superAdmin'));
app.use('/api/v1/events', require('./routes/events'));
app.use('/api/v1/gallery', require('./routes/gallery'));
app.use('/api/v1/voting', require('./routes/voting'));
app.use('/api/v1/expenses', require('./routes/expenses'));


// --- Frontend Routes ---
app.use('/', require('./routes/views'));

// Start Server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
