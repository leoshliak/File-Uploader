const express = require('express');
const router = express.Router();
const controllers = require('../controllers/controllers');

router.get('/', controllers.getHomePage);
router.post('/newFolderHome', controllers.createFolderFromHome);
router.post('/newFileHome', controllers.createFileFromHome);

// Error handling for file uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' 
        ? 'File is too large. Maximum size is 10MB'
        : 'Error uploading file'
    });
  }
  if (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ message: 'Server error during upload' });
  }
  next();
});

module.exports = router;