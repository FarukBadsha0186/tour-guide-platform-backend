// controllers/tourist.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { TouristService } from "./tourist.service";


interface RequestUser {
  userId: string;
  role: string;
  email?: string;
}

// ===== Create Booking =====
const createBooking = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;
    const { packageId, tourDate, numberOfPeople, specialRequests } = req.body;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!packageId || !tourDate || !numberOfPeople) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "packageId, tourDate, and numberOfPeople are required"
      );
    }

    const result = await TouristService.createBooking({
      packageId,
      userId: user.userId,
      tourDate,
      numberOfPeople: parseInt(numberOfPeople),
      specialRequests,
    });

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Booking created successfully",
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

const createReview = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;
    const { bookingId, rating, comment, images } = req.body;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!bookingId || !rating) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "bookingId and rating are required"
      );
    }

    const result = await TouristService.createReview(user.userId, {
      bookingId,
      rating: parseInt(rating),
      comment,
      images,
    });

    res.status(httpStatus.CREATED).json({
      success: true,
      message: "Review submitted successfully",
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

const cancelBooking = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!bookingId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking ID is required");
    }

    const result = await TouristService.cancelBooking(
      bookingId as string,
      user.userId,
      cancellationReason
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Booking cancelled successfully",
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

    const result = await TouristService.getMyBookings(user.userId, query);

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


const getAllPackages = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as string) || "desc",
      search: req.query.search as string,
      location: req.query.location as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minDuration: req.query.minDuration ? parseInt(req.query.minDuration as string) : undefined,
      maxDuration: req.query.maxDuration ? parseInt(req.query.maxDuration as string) : undefined,
    };

    const result = await TouristService.getAllPackages(query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Packages retrieved successfully",
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

// controllers/tourist.controller.ts

// ... আগের imports

// =============================================
// ===== 1. Get All Availability =====
// =============================================
const getAllAvailability = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      packageId: req.query.packageId as string,
      guideId: req.query.guideId as string,
    };

    const result = await TouristService.getAllAvailability(query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "All availability retrieved successfully",
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

// =============================================
// ===== 2. Get Available Only =====
// =============================================
const getAvailableOnly = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      packageId: req.query.packageId as string,
      guideId: req.query.guideId as string,
    };

    const result = await TouristService.getAvailableOnly(query);

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







export const TouristController = {
  createBooking,
  createReview,
  cancelBooking,
   getMyBookings, 
    getAllPackages,
  getAllAvailability,
  getAvailableOnly,
  
};