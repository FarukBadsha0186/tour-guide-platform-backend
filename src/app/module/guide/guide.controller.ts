// src/app/modules/guide/guide.controller.ts

import { Request, Response } from "express";
import { GuideServices } from "./guide.service";

import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { AppError } from "../../utils/AppError";




// ===== UPDATE GUIDE PROFILE (WITH IMAGE) =====


const updateMyProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;


  let payload = req.body;
  if (req.body.guideData) {
    payload = JSON.parse(req.body.guideData);
  }

  let profileImageUrl: string | undefined;

  
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "guide-profiles");
    profileImageUrl = result.secure_url;
  }

  // 
  const result = await GuideServices.updateMyProfile(userId, payload, profileImageUrl);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guide profile updated successfully",
    data: result,
  });
});

// ===== GET MY PROFILE =====
const getMyProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.userId;

  const result = await GuideServices.getMyProfile(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guide profile retrieved successfully",
    data: result,
  });
});


// ===== CREATE PACKAGE =====
const createPackage = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const payload = req.body;

  const result = await GuideServices.createPackage(guideId, payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Tour package created successfully. Waiting for admin approval.",
    data: result,
  });
});

// ===== GET ALL PACKAGES (PUBLIC) =====
const getAllPackages = catchAsync(async (req: Request, res: Response) => {
  const result = await GuideServices.getAllPackages(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Packages retrieved successfully",
    data: result,
  });
});

// ===== GET PACKAGE BY ID =====
const getPackageById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GuideServices.getPackageById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Package retrieved successfully",
    data: result,
  });
});

// ===== UPDATE PACKAGE =====
const updatePackage = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const { id } = req.params;
  const payload = req.body;

  const result = await GuideServices.updatePackage(id as string, guideId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Package updated successfully. Waiting for admin re-approval.",
    data: result,
  });
});

// ===== DELETE PACKAGE =====
const deletePackage = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const { id } = req.params;

  const result = await GuideServices.deletePackage(id as string, guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Package deleted successfully",
    data: result,
  });
});

// ===== GET MY PACKAGES (GUIDE) =====
const getMyPackages = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const result = await GuideServices.getMyPackages(guideId, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My packages retrieved successfully",
    data: result,
  });
});



interface RequestUser {
  userId: string;
  role: string;
  email?: string;
}


const getMyBookings = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as string) || "desc",
      status: req.query.status as string,
      packageId: req.query.packageId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await GuideServices.getMyBookings(user.userId , query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  }
};

// ===== 2. Get Booking Details =====
const getBookingDetails = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;
    const { bookingId } = req.params;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!bookingId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking ID is required");
    }

    const result = await GuideServices.getBookingDetails(
      bookingId as string,
      user.userId
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Booking details retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  }
};

// ===== 3. Update Booking Status =====


const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;
    const { bookingId } = req.params;
    const { status, cancellationReason } = req.body;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!bookingId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking ID is required");
    }

    if (!status) {
      throw new AppError(httpStatus.BAD_REQUEST, "Status is required");
    }

    if (!["COMPLETED", "CANCELLED"].includes(status)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Status must be either COMPLETED or CANCELLED"
      );
    }

    const result = await GuideServices.updateBookingStatus(
      bookingId as string,
      user.userId,
      {
        status,
        cancellationReason,
      }
    );

    // Response with refund (if CANCELLED)
    res.status(httpStatus.OK).json({
      success: true,
      message: result.message,
      data: {
        booking: result.booking,
        refund: (result as any).refund || null,    
      },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Something went wrong",
      });
    }
  }
};







export const GuideControllers = {
  updateMyProfile,
  getMyProfile,

   createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  getMyPackages,

   getMyBookings,
  getBookingDetails,
  updateBookingStatus,
};