import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null

        const uniquePublicId = Math.floor(Math.random() * 999999)

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'image',
            public_id: uniquePublicId,
            folder: 'user_avatars',
            allowed_formats: 'webp'
        })

        fs.unlinkSync(localFilePath);
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {
    uploadOnCloudinary
}