import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const petPhotosDir = path.join(uploadsDir, 'pet-photos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(petPhotosDir)) {
  fs.mkdirSync(petPhotosDir, { recursive: true });
}

// Configure multer for pet photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, petPhotosDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `pet_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

// File filter for pet photos
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Multer upload configuration
export const uploadPetPhoto = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per upload
  },
  fileFilter: fileFilter
});

// Helper function to delete uploaded files (for cleanup)
export const deleteFile = (filename) => {
  try {
    const filePath = path.join(petPhotosDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to get file URL
export const getFileUrl = (filename) => {
  return `/uploads/pet-photos/${filename}`;
}; 