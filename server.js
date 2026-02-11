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
app.use(express.static(path.join(__dirname, 'public')));
console.log('Middleware initialized');

// Debug Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database Connection
console.log('Attempting to connect to MongoDB...');
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('🔥 MongoDB error:', err.message);
});

connectDB();

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
