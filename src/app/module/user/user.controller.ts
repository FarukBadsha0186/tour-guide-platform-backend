import { NextFunction, Request, Response } from "express"
import { catchAsync } from "../../utils/catchAsync"
import { sendResponse } from "../../utils/sendResponse"
import  httpStatus from "http-status";
import { UserServices } from "./user.service";


const uploadProfileImage =catchAsync (async(  req:Request,  res:Response , next:NextFunction )=>{

    if(!req.file){
       throw new Error("No FIle provided");


       
    }

    const userId =req.user?.userId


   const result=  await UserServices.uploadProfileImage(req.file?.buffer ,userId!)
    console.log(req.file,"req.file")
    sendResponse (res ,{
        statusCode :httpStatus.OK,
        success: true,
        message:"Profile Image upload Successfully",
        data:result
    })

})

 export const UserController ={
    uploadProfileImage,
 }