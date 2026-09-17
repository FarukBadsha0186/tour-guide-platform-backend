// src/app/modules/availability/availability.controller.ts

import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AvailabilityServices } from "./availability.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus, { status } from "http-status";
import { AppError } from "../../utils/AppError";
import { GuideServices } from "../guide/guide.service";


// ===== CREATE AVAILABILITY =====
const createAvailability = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const payload = req.body;

  const result = await AvailabilityServices.createAvailability(guideId, payload);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Availability created successfully",
    data: result,
  });
});

// ===== GET AVAILABILITY BY GUIDE =====
const getAvailabilityByGuide = catchAsync(async (req: Request, res: Response) => {
  const result = await AvailabilityServices.getAvailabilityByGuide(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Availability retrieved successfully",
    data: result,
  });
});

// ===== GET SINGLE AVAILABILITY =====
const getAvailabilityById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AvailabilityServices.getAvailabilityById(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Availability retrieved successfully",
    data: result,
  });
});

// ===== UPDATE AVAILABILITY =====
const updateAvailability = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const { id } = req.params;
  const payload = req.body;

  const result = await AvailabilityServices.updateAvailability(id as string, guideId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Availability updated successfully",
    data: result,
  });
});

// ===== DELETE AVAILABILITY =====
const deleteAvailability = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const guideId = req.user?.userId;
  const { id } = req.params;

  const result = await AvailabilityServices.deleteAvailability(id as string, guideId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Availability deleted successfully",
    data: result,
  });
});

// ===== GET AVAILABILITY BY PACKAGE =====
const getAvailabilityByPackage = catchAsync(async (req: Request, res: Response) => {
  const { packageId } = req.params;
  const result = await AvailabilityServices.getAvailabilityByPackage(packageId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Availability retrieved successfully",
    data: result,
  });
});


// controllers/guide.controller.ts

// ... আগের function গুলো

// ===== 4. Get All Availability =====
const getAllAvailability = async (req: Request, res: Response) => {
  try {
    const user = req.user ;

    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "User not authenticated");
    }

    const query = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const result = await AvailabilityServices.getAllAvailability(user.userId, query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Availability retrieved successfully",
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

// ===== 5. Get Available Only =====
const getAvailableOnly = async (req: Request, res: Response) => {
  try {
    const user = req.user ;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const query = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const result = await AvailabilityServices.getAvailableOnly(user.userId, query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Available slots retrieved successfully",
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



// ===== EXPORT =====
export const AvailabilityControllers = {
  createAvailability,
  getAvailabilityByGuide,
  getAvailabilityById,
  updateAvailability,
  deleteAvailability,
  getAvailabilityByPackage,


   getAllAvailability,    
  getAvailableOnly, 
};