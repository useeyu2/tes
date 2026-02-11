const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const uploadDirs = ['public/uploads/profiles', 'public/uploads/proofs'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage configurations
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'profile_picture') {
            cb(null, 'public/uploads/profiles');
        } else {
            cb(null, 'public/uploads/proofs');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log(`[DEBUG] File Filter: originalname=${file.originalname}, mimetype=${file.mimetype}`);
        const filetypes = /jpeg|jpg|png|pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        console.log(`[DEBUG] Rejected! mimetype=${mimetype}, extname=${extname}`);
        cb(new Error("Only images and PDFs are allowed!"));
    }
});

module.exports = upload;
