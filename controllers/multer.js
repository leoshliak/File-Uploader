const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Generate a unique filename
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    return {
      folder: 'uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'mp4', 'pdf', 'txt', 'docx', 'zip'],
      resource_type: 'auto',
      public_id: uniqueFilename.split('.')[0], // Remove file extension for public_id
      format: file.mimetype.split('/')[1], // Use the file's extension
      transformation: { quality: 'auto' } // Optimize image quality
    };
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB limit
  files: 1
};

module.exports = multer({
  storage,
  fileFilter,
  limits
});
