const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const upload = require('./multer');
const axios = require('axios');

function renderWithLayout(res, view, options = {}) {
  res.render(view, options, (err, html) => {
    if (err) {
      console.error('View render error:', err);
      return res.status(500).send('Error rendering view');
    }
    res.render('layout', { ...options, body: html }, (err, html) => {
      if (err) {
        console.error('Layout render error:', err);
        return res.status(500).send('Error rendering layout');
      }
      res.send(html);
    });
  });
}

exports.getHomePage = async (req, res) => {
  try {
    // For non-authenticated users, render the login page
    if (!req.user) {
      return renderWithLayout(res, 'pages/home', {
        title: 'Home Page',
        user: null,
        files: [],
        folders: []
      });
    }

    const [files, folders] = await Promise.all([
      prisma.file.findMany({
        where: { 
          folderId: null, 
          userId: req.user.id 
        },
        include: { 
          user: true, 
          folder: true 
        },
        orderBy: { 
          uploadedAt: 'desc' 
        }
      }),
      prisma.folder.findMany({
        where: { 
          parentId: null, 
          userId: req.user.id 
        },
        include: { 
          user: true, 
          parent: true,
          files: true,
          subfolders: true 
        },
        orderBy: { 
          createdAt: 'desc' 
        }
      })
    ]);

    renderWithLayout(res, 'pages/home', {
      title: 'Home Page',
      user: req.user,
      files: files || [],
      folders: folders || []
    });
  } catch (err) {
    console.error('Home page error:', err);
    res.status(500).send('Server Error');
  } }

  exports.createFolderFromHome = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not logged in" });
      }

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Folder name is required" });
      }

      const folder = await prisma.folder.create({
        data: { 
          name: name.trim(), 
          userId: req.user.id, 
          parentId: null 
        }
      });
      
      // Redirect back to home page after creating folder
      res.redirect('/');
    } catch (err) {
      console.error('Create folder error:', err);
      if (err.code === 'P2002') {
        return res.status(400).json({ message: "A folder with this name already exists" });
      }
      res.status(500).json({ message: "Error creating folder" });
    }
  }

exports.getRegisterPage = (req, res) => {
  try {
    renderWithLayout(res, 'pages/sign-up', {
      title: 'Register',
      user: null
    });
  } catch (err) {
    console.error('Register page error:', err);
    res.status(500).send('Error loading register page');
  }
}

exports.createFileFromHome = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not logged in" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Log the file object to see what Cloudinary returns
      console.log('Uploaded file:', req.file);

      // The Cloudinary URL is in path property when using multer-storage-cloudinary
      if (!req.file.path) {
        throw new Error('No URL received from Cloudinary');
      }

      const newFile = await prisma.file.create({
        data: {
          filename: req.file.originalname,
          url: req.file.path, // Cloudinary URL is in the path property
          size: req.file.size,
          mimeType: req.file.mimetype,
          userId: req.user.id,
          folderId: null,
          uploadedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Log the created file
      console.log('Created file:', newFile);

      // Redirect back to home page after file upload
      res.redirect('/');
    } catch (err) {
      console.error('Create file error:', err);
      if (err.code === 'P2002') {
        return res.status(400).json({ message: "A file with this URL already exists" });
      }
      res.status(500).json({ message: "Error saving file information: " + err.message });
    }
  }
];

exports.getFolderPage = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    if (isNaN(folderId)) {
      return res.status(400).send('Invalid folder ID');
    }
   
    const subfolders = await prisma.folder.findMany({
      where: {
        parentId: folderId,
        userId: req.user ? req.user.id : null
      }
      , 
      include: {
        user: true,
        parent: true,
      }
    })

    const files = await prisma.file.findMany({
      where: {
        folderId: folderId,
        userId: req.user ? req.user.id : null
      },
      include: {
        user: true,
        folder: true,
      }

  });
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        user: true,
        parent: true,
      }
    });

    renderWithLayout(res, 'pages/folder', {
      title: folder ? folder.name : 'Folder',
      user: req.user || null,
      folder,
      files: files || [],
      subfolders: subfolders || []
    })
  } catch (err) {
    console.error('Get folder page error:', err);
    res.status(500).send('Server Error');
  }
}

exports.createFolderInFolder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const parentId = parseInt(req.params.id, 10);
    if (isNaN(parentId)) {
      return res.status(400).json({ message: "Invalid parent folder ID" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    // Check if parent folder exists and belongs to user
    const parentFolder = await prisma.folder.findUnique({
      where: { id: parentId }
    });

    if (!parentFolder) {
      return res.status(404).json({ message: "Parent folder not found" });
    }

    if (parentFolder.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to add to this folder" });
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        userId: req.user.id,
        parentId: parentId
      }
    });

    // Redirect back to the parent folder page
    res.redirect(`/folder/${parentId}`);
  } catch (err) {
    console.error('Create folder in folder error:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ message: "A folder with this name already exists in this location" });
    }
    res.status(500).json({ message: "Error creating folder" });
  }
}

exports.createFileInFolder = [
  upload.single('file'),
  async (req, res) => {
    try {
      const parentId = parseInt(req.params.id, 10);
      if (isNaN(parentId)) {
        return res.status(400).json({ message: "Invalid folder ID" });
      }

      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId }
      })

      if (!parentFolder) {
        return res.status(404).json({ message: "Parent folder not found" });
      }

      if (!req.user || parentFolder.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to add files to this folder" });
      }

      const { file } = req;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
    
      if (!file.path) {
        throw new Error('No URL received from Cloudinary');
      }

      const newFile = await prisma.file.create({
        data: {
          filename: file.originalname,
          url: file.path, 
          size: file.size,
          mimeType: file.mimetype,
          userId: req.user.id,
          folderId: parentId,
          uploadedAt: new Date(),
          updatedAt: new Date(),
        }
      })

      console.log('Created file:', newFile);

      res.redirect(`/folder/${parentId}`);

    } catch (err) {
      console.error('Create file in folder error:', err);
      res.status(500).json({ message: "Error saving file information" });
    }
  }
]

exports.deleteFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    if (isNaN(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    // Check if folder exists and belongs to user
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        files: true,
        subfolders: true
      }
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (folder.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this folder" });
    }

    // Recursive function to delete folder contents
    async function deletefolderContents(folderId) {
      // Get all subfolders
      const subfolders = await prisma.folder.findMany({
        where: { parentId: folderId },
        include: { files: true, subfolders: true }
      });

      // Recursively delete contents of each subfolder
      for (const subfolder of subfolders) {
        await deletefolderContents(subfolder.id);
      }

      // Delete all files in this folder
      await prisma.file.deleteMany({
        where: { folderId: folderId }
      });

      // Delete the folder itself
      await prisma.folder.delete({
        where: { id: folderId }
      });
    }

    // Start the recursive deletion
    await deletefolderContents(folderId);

    // Redirect back to the parent folder or home
    res.redirect(folder.parentId ? `/folder/${folder.parentId}` : '/');
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ message: "Error deleting folder" });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    if (isNaN(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Folder name is required"});
    } 

    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const updateFolder = await prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
    })
   
    res.redirect(folder.parentId ? `/folder/${folder.parentId}` : '/');
  } catch (err) {
    console.error('Rename folder error:', err);
    res.status(500).json({ message: "Error renaming folder" });
  }
}

exports.deleteFile = async (req, res) => {
  

  try {
    const fileId = parseInt(req.params.id, 10);
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }

      const file = await prisma.file.findUnique({
        where: { id: fileId },
      })

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const parentId = file.folderId;

      const deleteFile = await prisma.file.delete({
        where: { id: fileId }
      });

      res.redirect(parentId ? `/folder/${parentId}` : '/');
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ message: "Error deleting file" });
  }
}

exports.downloadFile = async (req, res) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has permission to download
    if (!req.user || file.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to download this file" });
    }

    try {
      // Fetch the file from Cloudinary
      const response = await axios({
        method: 'GET',
        url: file.url,
        responseType: 'stream'
      });

      // Set headers for force download
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.setHeader('Content-Length', response.headers['content-length']);

      // Pipe the file stream to the response
      response.data.pipe(res);
    } catch (error) {
      console.error('Error downloading from Cloudinary:', error);
      res.status(500).json({ message: "Error downloading file" });
    }
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ message: "Error downloading file" });
  }
}