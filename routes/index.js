const express = require('express');
const router = express.Router();
const controllers = require('../controllers/controllers');

router.get('/', controllers.getHomePage);
router.post('/newFolderHome', controllers.createFolderFromHome);
router.post('/newFileHome', controllers.createFileFromHome);
router.get('/folder/:id', controllers.getFolderPage);
router.post('/folder/:id/newFolder', controllers.createFolderInFolder);
router.post('/folder/:id/newFile', controllers.createFileInFolder);
router.post('/folder/:id/rename', controllers.renameFolder);
router.post('/folder/:id/delete', controllers.deleteFolder);
router.post('/file/:id/delete', controllers.deleteFile);
router.get('/file/:id/download', controllers.downloadFile);

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