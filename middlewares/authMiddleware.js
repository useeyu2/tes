const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ detail: 'Missing token' });

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
            return res.status(403).json({ detail: 'Access Denied: Admin role required' });
        }

        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ detail: 'Invalid or expired token' });
    }
};

module.exports = { isAdmin };
