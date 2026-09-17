// src/app/module/public/public.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { PublicService } from "./public.service";

// ===== 1. Get All Guides =====
const getAllGuides = async (req: Request, res: Response) => {
  try {
    const query = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      sortBy: (req.query.sortBy as string) || "rating",
      sortOrder: (req.query.sortOrder as string) || "desc",
      search: req.query.search as string,
      location: req.query.location as string,
      languages: req.query.languages as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      minExperience: req.query.minExperience ? parseInt(req.query.minExperience as string) : undefined,
    };

    const result = await PublicService.getAllGuides(query);

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

// ===== 2. Get All Packages =====
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

    const result = await PublicService.getAllPackages(query);

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

// ===== 3. Search Packages =====
const searchPackages = async (req: Request, res: Response) => {
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

    const result = await PublicService.searchPackages(query);

    res.status(httpStatus.OK).json({
      success: true,
      message: "Search results retrieved successfully",
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
// ========== EXPORT =============
// =============================================
export const PublicController = {
  getAllGuides,
  getAllPackages,
  searchPackages,
};