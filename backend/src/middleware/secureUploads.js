import path from 'path';

const uploadsPath = path.resolve(process.cwd(), 'uploads');

export const secureUploads = (req, res, next) => {
  try {
    const requestedFile = req.path;

    // Normalize path
    const safePath = path.normalize(requestedFile);

    // Resolve final absolute path
    const resolvedPath = path.resolve(uploadsPath, '.' + safePath);

    // Prevent path traversal
    if (!resolvedPath.startsWith(uploadsPath)) {
      return res.status(403).json({
        message: 'Access denied'
      });
    }

    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'File access error'
    });
  }
};