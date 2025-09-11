import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle both JSON and multipart/form-data requests
 * If images are not provided, this middleware simply passes through
 * If content-type is application/json, it processes normally
 * If content-type is multipart/form-data, it delegates to imageUploadMiddleware
 */
export const flexibleUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.get('Content-Type') || '';
  
  // If it's a JSON request, proceed normally
  if (contentType.includes('application/json')) {
    console.log('Processing JSON request');
    return next();
  }
  
  // If it's multipart/form-data, delegate to image upload middleware
  if (contentType.includes('multipart/form-data')) {
    console.log('Processing multipart/form-data request with potential images');
    // Import dynamically to avoid circular dependencies
    import('../middlewares/imageUpload.js').then(({ imageUploadMiddleware }) => {
      imageUploadMiddleware(req, res, next);
    }).catch((error) => {
      console.error('Error loading image upload middleware:', error);
      return res.status(500).json({ error: 'Failed to process image uploads' });
    });
    return;
  }
  
  // For other content types, proceed normally
  console.log('Processing request with content type:', contentType);
  next();
};

export default flexibleUploadMiddleware;
