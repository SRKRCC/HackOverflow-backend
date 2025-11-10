import multer from "multer";
import type { Request, Response, NextFunction } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 8
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// More flexible team registration upload - allows any number of member photos
export const teamRegistrationUpload = upload.any();

export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        message: 'File size too large. Maximum allowed size is 5MB per file.'
      });
      return;
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        message: 'Too many files uploaded. Maximum 8 files allowed.'
      });
      return;
    }
  }

  if (error.message === 'Only image files are allowed') {
    res.status(400).json({
      success: false,
      message: 'Only image files are allowed. Please upload JPG, PNG, or similar image formats.'
    });
    return;
  }

  next(error);
};export const singleFileUpload = upload.single('file');
export const multipleFileUpload = upload.array('files', 10);