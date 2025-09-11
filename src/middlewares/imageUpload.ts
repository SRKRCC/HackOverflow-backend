import type { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary (you'll need to set these environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Only allow image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WEBP images are allowed'));
    }
  },
});

/**
 * Upload buffer to Cloudinary
 */
const uploadToCloudinary = (buffer: Buffer, originalName: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'hackoverflow/profiles', // Organize in folders
        public_id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto' } // Optimize images
        ]
      },
      (error: any, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * Middleware to handle image uploads and inject URLs back into request body
 * Expects images in the order: lead profile image, then member profile images
 */
export const imageUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Use multer to parse multipart/form-data with flexible field handling
  const uploadFields = upload.fields([
    { name: 'leadImage', maxCount: 1 },
    { name: 'memberImages', maxCount: 10 }, // For multiple member images
    { name: 'memberImage', maxCount: 1 },   // For single member image (alternative naming)
    { name: 'data', maxCount: 1 } // JSON data
  ]);

  uploadFields(req, res, async (err: any) => {
    if (err) {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            error: 'Unexpected file field. Use: leadImage, memberImages, or data fields only.' 
          });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: `File validation error: ${err.message}` });
    }

    try {
      // Parse JSON data from form field
      if (req.body.data) {
        try {
          req.body = JSON.parse(req.body.data);
        } catch (parseError) {
          return res.status(400).json({ error: 'Invalid JSON data format' });
        }
      }

      const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] };
      console.log('Received files:', Object.keys(files));
      
      // Process lead image
      if (files.leadImage && files.leadImage[0]) {
        console.log('Processing lead image...');
        const leadImageUrl = await uploadToCloudinary(
          files.leadImage[0].buffer,
          files.leadImage[0].originalname
        );
        
        // Inject URL into request body
        if (req.body.data?.lead) {
          req.body.data.lead.profile_image = leadImageUrl;
          console.log('Lead image uploaded:', leadImageUrl);
        }
      }

      // Process member images - handle both array and single file approaches
      let memberImageFiles: Express.Multer.File[] = [];
      
      if (files.memberImages && files.memberImages.length > 0) {
        memberImageFiles = files.memberImages;
      } else if (files.memberImage && files.memberImage.length > 0) {
        memberImageFiles = files.memberImage;
      }

      if (memberImageFiles.length > 0) {
        console.log(`Processing ${memberImageFiles.length} member images...`);
        const memberImageUrls = await Promise.all(
          memberImageFiles.map(file => 
            uploadToCloudinary(file.buffer, file.originalname)
          )
        );

        // Inject URLs into request body in the same order
        if (req.body.data?.members && Array.isArray(req.body.data.members)) {
          req.body.data.members.forEach((member: any, index: number) => {
            if (memberImageUrls[index]) {
              member.profile_image = memberImageUrls[index];
              console.log(`Member ${index} image uploaded:`, memberImageUrls[index]);
            }
          });
        }
      }

      next();
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload images to cloud storage' });
    }
  });
};

export default imageUploadMiddleware;
