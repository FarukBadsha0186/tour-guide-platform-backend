// import { v2 as Cloudinary } from "cloudinary";
// import config from "../config";



// Cloudinary.config({
// 	cloud_name: config.cloudinary_cloud_name,
// 	api_key: config.cloudinary_api_key,
// 	api_secret: config.cloudinary_api_secret,
// });


// export const uploadToCloudinary = (fileBuffer: Buffer, folder: string = "guides") => {
//   return new Promise((resolve, reject) => {
//     const uploadStream = Cloudinary.uploader.upload_stream(
//       {
//         folder: folder,
//         resource_type: "image",
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     );
//     uploadStream.end(fileBuffer);
//   });
// };
// export const cloudinary = Cloudinary;


import { v2 as Cloudinary } from "cloudinary";
import config from "../config";

Cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

export const cloudinary = Cloudinary;

// ✅ ADD THIS FUNCTION WITH PROPER TYPES
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  // other fields if needed
}

export const uploadToCloudinary = (
  fileBuffer: Buffer, 
  folder: string = "guides"
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = Cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryUploadResult);
      }
    );
    uploadStream.end(fileBuffer);
  });
};