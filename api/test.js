module.exports = (req, res) => {
    res.json({
        status: 'Alive',
        message: 'API directory routing is working!',
        env: {
            node: process.version,
            hasDbUrl: !!(process.env.MONGODB_URL || process.env.MONGODB_Url)
        }
    });
};
