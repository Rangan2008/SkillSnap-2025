import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload resume to Cloudinary
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID for organization
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadResume = (fileBuffer, fileName, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `impetus/resumes/${userId}`,
        resource_type: 'raw',
        public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '').trim()}`,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete resume from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteResume = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get resume URL from public ID
 * @param {string} publicId - Cloudinary public ID
 * @returns {string} Secure URL
 */
export const getResumeUrl = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'raw',
    secure: true
  });
};

/**
 * Upload profile picture to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} userId - User ID for organization
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadProfilePicture = (fileBuffer, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `impetus/profile-pictures`,
        public_id: `user_${userId}_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ],
        overwrite: true
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary profile picture upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Upload job description to Cloudinary
 * @param {Buffer} fileBuffer - JD file buffer
 * @param {string} fileName - Original file name
 * @param {string} userId - User ID for organization
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadJobDescription = (fileBuffer, fileName, userId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `impetus/job-descriptions/${userId}`,
        resource_type: 'raw',
        public_id: `${Date.now()}_${fileName.replace(/\.[^/.]+$/, '').trim()}`,
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary JD upload error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete profile picture from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteProfilePicture = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary profile picture delete error:', error);
    throw error;
  }
};

export { cloudinary };
