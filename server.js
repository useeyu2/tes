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
// Serve static files - Vercel handles this via output configuration usually, but for express:
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/health', (req, res) => res.status(200).send('OK'));

console.log('Middleware initialized');

// Debug Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// View Engine
app.set('view engine', 'ejs');
// Fix for Vercel: ensure views path is absolute and correct
app.set('views', path.join(__dirname, 'views'));

// Database Connection
// Database Connection (Serverless Pattern)
// Database Connection (Cached Source for Serverless)
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('=> Using existing database connection');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable buffering
            serverSelectionTimeoutMS: 5000,
        };

        const dbUrl = process.env.MONGODB_URL || process.env.MONGODB_Url;

        if (!dbUrl) {
            throw new Error('❌ MONGODB_URL is missing in environment variables');
        }

        console.log('=> Creating new database connection...');
        cached.promise = mongoose.connect(dbUrl.trim(), opts).then((mongoose) => {
            console.log('✅ New MongoDB connection established');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ MongoDB connection error:', e);
        throw e;
    }

    return cached.conn;
};

// Ensure connection for every request (Middleware)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
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
