import { v2 as cloudinary } from 'cloudinary';
import { unlink } from 'fs/promises';

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
} else {
  console.warn('Cloudinary credentials missing. Uploads will be skipped.');
}

const uploadOnCloudinary = async (localFilePath) => {
  if (!isCloudinaryConfigured) return null;
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'eventone/posters',
      format: 'webp',
      quality: 80,
      width: 1200,
      crop: 'limit',
    });

    console.log('File uploaded on Cloudinary!');
    await unlink(localFilePath); // clean up after successful upload
    return response;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    try {
      await unlink(localFilePath);
    } catch (unlinkError) {
      console.error('Failed to clean up local file:', unlinkError);
    }
    return null;
  }
};

const deleteFromCloudinary = async (cloudinaryUrl) => {
  if (!isCloudinaryConfigured) return null;
  try {
    if (!cloudinaryUrl) return null;

    // Extract public_id from URL
    const parts = cloudinaryUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;

    let publicIdStartIndex = uploadIndex + 1;
    // Skip version tag (e.g. v123456789)
    if (
      parts[publicIdStartIndex] &&
      parts[publicIdStartIndex].startsWith('v') &&
      !isNaN(parts[publicIdStartIndex].substring(1))
    ) {
      publicIdStartIndex++;
    }

    const publicIdWithExt = parts.slice(publicIdStartIndex).join('/');
    const publicId = publicIdWithExt.includes('.')
      ? publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'))
      : publicIdWithExt;

    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Old file deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion failed:', error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
