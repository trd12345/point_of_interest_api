import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export class ImageService {
    constructor() {
        // Configure Cloudinary with environment variables
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    /**
     * Upload an image buffer to Cloudinary and return the secure URL.
     */
    async uploadImage(fileBuffer: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "placemarks", // Organization in Cloudinary
                },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error("Cloudinary upload failed"));
                    resolve(result.secure_url);
                }
            );

            // Pipe buffer to upload stream
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }
}
