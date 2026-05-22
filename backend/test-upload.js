import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import { uploadOnCloudinary, deleteFromCloudinary } from './src/config/cloudinary.js';

const testCloudinaryFlow = async () => {
  console.log('--- Starting Cloudinary Test Flow ---');

  const testFileName = 'test-image.png';
  const testFilePath = path.resolve(testFileName);
  try {
    console.log('Creating dummy image file for upload...');
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    await fs.writeFile(testFilePath, Buffer.from(base64Image, 'base64'));

    // 2. Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const uploadResult = await uploadOnCloudinary(testFilePath);

    if (!uploadResult) {
      console.error('Upload failed. Check your Cloudinary credentials in .env');
      return;
    }

    console.log(`Upload successful! Secure URL: ${uploadResult.secure_url}`);

    // 3. Delete from Cloudinary
    console.log('Deleting from Cloudinary...');
    const deleteResult = await deleteFromCloudinary(uploadResult.secure_url);

    if (deleteResult && deleteResult.result === 'ok') {
      console.log('Delete successful!');
    } else {
      console.error('Delete failed:', deleteResult);
    }
    
  } catch (err) {
    console.error('Test flow error:', err);
  } finally {
    console.log('--- Test Flow Complete ---');
  }
};

testCloudinaryFlow();
