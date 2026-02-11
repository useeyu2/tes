const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'skosa/others';
        let resource_type = 'auto'; // Support images and PDFs

        if (file.fieldname === 'profile_picture') {
            folder = 'skosa/profiles';
        } else if (file.fieldname === 'proof') {
            folder = 'skosa/proofs';
            resource_type = 'raw'; // PDFs must be 'raw' in some configs, or 'auto'
        } else if (file.fieldname === 'photo') {
            folder = 'skosa/gallery';
        }

        return {
            folder: folder,
            resource_type: resource_type,
            public_id: file.fieldname + '-' + Date.now(),
        };
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(file.originalname.toLowerCase());

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error("Only images and PDFs are allowed!"));
    }
});

module.exports = upload;
