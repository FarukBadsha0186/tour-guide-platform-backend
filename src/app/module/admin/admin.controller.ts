// controllers/admin.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { AdminService } from "../admin/admin.service";

interface RequestUser {
  userId: string;
  role: string;
  email?: string;
}

// ===== 1. Get All Tourists =====
const getAllTourists = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as string) || "desc",
      status: req.query.status as string,
      search: req.query.search as string,
    };

    const result = await AdminService.getAllTourists(query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Tourists retrieved successfully",
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

// ===== 2. Get All Guides =====
const getAllGuides = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as string) || "desc",
      status: req.query.status as string,
      isApproved: req.query.isApproved
        ? req.query.isApproved === "true"
        : undefined,
      search: req.query.search as string,
    };

    const result = await AdminService.getAllGuides(query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Guides retrieved successfully",
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

// ===== 3. Update User Status (Block/Unblock) =====
const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    if (!status) {
      throw new AppError(httpStatus.BAD_REQUEST, "Status is required");
    }

    if (!["ACTIVE", "BLOCKED"].includes(status)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Status must be either ACTIVE or BLOCKED"
      );
    }

    const result = await AdminService.updateUserStatus(userId as string, {
      status,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: `User ${status === "ACTIVE" ? "unblocked" : "blocked"} successfully`,
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

// ===== 4. Delete User (Soft Delete) =====
const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    const result = await AdminService.deleteUser(userId as string);

    res.status(httpStatus.OK).json({
      success: true,
      message: "User deleted successfully",
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

// ===== 5. Get User Details =====
const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
    }

    const result = await AdminService.getUserDetails(userId as string);

    res.status(httpStatus.OK).json({
      success: true,
      message: "User details retrieved successfully",
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


const getAllBookings = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as string) || "desc",
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      touristEmail: req.query.touristEmail as string,
      guideEmail: req.query.guideEmail as string,
      packageId: req.query.packageId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await AdminService.getAllBookings(query);

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

// =============================================
// ===== 2. Get Booking Details =====
// =============================================
const getBookingDetails = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking ID is required");
    }

    const result = await AdminService.getBookingDetails(bookingId as string);

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

// =============================================
// ===== 3. Get All Payments =====
// =============================================
const getAllPayments = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "createdAt",
      sortOrder: (req.query.sortOrder as string) || "desc",
      status: req.query.status as string,
      method: req.query.method as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await AdminService.getAllPayments(query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Payments retrieved successfully",
      data: result.data,
      stats: result.stats,
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


export const AdminController = {
  getAllTourists,
  getAllGuides,
  updateUserStatus,
  deleteUser,
  getUserDetails,
   getAllBookings,
  getBookingDetails,
  getAllPayments,
};