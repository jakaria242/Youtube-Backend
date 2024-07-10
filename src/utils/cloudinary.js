import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


 // Upload an image
 const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if (localFilePath) {
        // upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto"
            })
        // file has been uploaded successfully
        //  console.log("file is uploaded on cloudinary ", response.url);

        // remove file start
        fs.unlinkSync(localFilePath)
        // remove file end

           return response;

           // upload the file on cloudinary
        }else{
           null
        }
    } catch (error) {
        fs.unlinkSync(localFilePath)  //remove the locally saved temporary file as the upload oparetion faild
        return null;
    }
 }

 export { uploadOnCloudinary }