const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    hashed_password: { type: String, required: true },
    full_name: { type: String, required: true },
    role: { type: String, enum: ['Member', 'Admin', 'SuperAdmin', 'Treasurer', 'Secretary', 'Auditor', 'Chairman'], default: 'Member' },
    is_active: { type: Boolean, default: true },
    is_approved: { type: Boolean, default: false },
    phone: String,
    graduation_year: Number,
    contribution_score: { type: Number, default: 0 },
    profile_picture: { type: String, default: null },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    created_at: { type: Date, default: Date.now }
});

userSchema.methods.verifyPassword = function (password) {
    return bcrypt.compareSync(password, this.hashed_password);
};

module.exports = mongoose.model('User', userSchema);
