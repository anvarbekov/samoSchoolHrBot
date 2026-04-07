// lib/cloudinary.js
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'hr-candidates',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(buffer)
  })
}

export async function uploadFromUrl(url, options = {}) {
  const result = await cloudinary.uploader.upload(url, {
    folder: 'hr-candidates',
    resource_type: 'auto',
    ...options,
  })
  return result
}

export { cloudinary }
