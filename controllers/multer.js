// multer.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "uploads";
    let allowedFormats = ["jpg", "png", "jpeg", "gif", "webp", "mp4", "pdf", "txt", "docx", "zip"];

    return {
      folder,
      allowed_formats: allowedFormats,
      // you can also generate a custom public_id here if needed
    };
  },
});

// Multer instance
const upload = multer({ storage });

export default upload;
