const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'SuperAdmin') {
        next();
    } else {
        res.status(403).json({ detail: 'Access Denied: Super Admin role required' });
    }
};

module.exports = { isSuperAdmin };
