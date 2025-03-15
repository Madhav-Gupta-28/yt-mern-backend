import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// config cloudinary
cloudinary.config({ 
    cloud_name:   "dl0qcjq7w", 
    api_key:   "425744338623651", 
    api_secret:  "tCNVWn19a4qhQpyG0MLwRj1-8Z0" 
});

export const uploadOnCloudinary = async (localFilePath) => { 
    try {
        if(!localFilePath) return null;
        
        // Upload an image
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        // File uploaded successfully
        fs.unlinkSync(localFilePath);
        return response;

    } catch(error) {
        console.log("Cloudinary upload error:", error);
        // Remove the locally saved temporary file as the upload operation failed
        if(localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}


export const deleteFromCloudinary = async (publicId) => {
    try{
        await cloudinary.uploader.destroy(publicId);
    }catch(error){
        console.log(error);
    }
}

