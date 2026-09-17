// src/app/module/public/public.service.ts
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  PackageStatus,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import {
  IPublicPackageQuery,
  IPublicGuideQuery,
} from "./public.interface";

// =============================================
// ========== PUBLIC SERVICE METHODS ==========
// =============================================

// ===== 1. Get All Guides (Public) =====
const getAllGuides = async (query: IPublicGuideQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "rating";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [
      { isApproved: true },
      {
        user: {
          isDeleted: false,
          status: UserStatus.ACTIVE,
          role: Role.GUIDE,
        },
      },
    ];

    // Search by name (via user)
    if (query.search) {
      andConditions.push({
        user: {
          name: { contains: query.search, mode: "insensitive" },
        },
      });
    }

    // Filter by location
    if (query.location) {
      andConditions.push({
        baseLocation: { contains: query.location, mode: "insensitive" },
      });
    }

    // Filter by languages
    if (query.languages) {
      const langArray = query.languages.split(",").map((l) => l.trim());
      andConditions.push({
        languages: { hasSome: langArray },
      });
    }

    // Filter by min rating
    if (query.minRating) {
      andConditions.push({
        rating: { gte: Number(query.minRating) },
      });
    }

    // Filter by min experience
    if (query.minExperience) {
      andConditions.push({
        yearsExperience: { gte: Number(query.minExperience) },
      });
    }

    // Determine sort field
    const sortField = ["rating", "yearsExperience", "hourlyRate", "totalReviews"].includes(sortBy)
      ? sortBy
      : "rating";

    const guides = await prisma.guide.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortField]: sortOrder as "asc" | "desc" },
      select: {
        id: true,
        yearsExperience: true,
        languages: true,
        baseLocation: true,
        bio: true,
        rating: true,
        totalReviews: true,
        hourlyRate: true,
        isAvailable: true,
        totalBookings: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            packages: true,
          },
        },
      },
    });

    const total = await prisma.guide.count({
      where: { AND: andConditions },
    });

    return {
      data: guides,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== 2. Get All Packages with Available Slots =====
const getAllPackages = async (query: IPublicPackageQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [
      { status: PackageStatus.APPROVED },
      { isDeleted: false },
      {
        guide: {
          isApproved: true,
          user: {
            isDeleted: false,
            status: UserStatus.ACTIVE,
          },
        },
      },
    ];

    // Search by title or description
    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }

    // Filter by location (meetingPoint or guide.baseLocation)
    if (query.location) {
      andConditions.push({
        OR: [
          { meetingPoint: { contains: query.location, mode: "insensitive" } },
          {
            guide: {
              baseLocation: { contains: query.location, mode: "insensitive" },
            },
          },
        ],
      });
    }

    // Filter by price range
    if (query.minPrice || query.maxPrice) {
      const priceFilter: any = {};
      if (query.minPrice) priceFilter.gte = Number(query.minPrice);
      if (query.maxPrice) priceFilter.lte = Number(query.maxPrice);
      andConditions.push({ pricePerPerson: priceFilter });
    }

    // Filter by duration range
    if (query.minDuration || query.maxDuration) {
      const durationFilter: any = {};
      if (query.minDuration) durationFilter.gte = Number(query.minDuration);
      if (query.maxDuration) durationFilter.lte = Number(query.maxDuration);
      andConditions.push({ durationHours: durationFilter });
    }

    // Determine sort field
    const sortField = ["pricePerPerson", "durationHours", "createdAt"].includes(sortBy)
      ? sortBy
      : "createdAt";

    const packages = await prisma.tourPackage.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortField]: sortOrder as "asc" | "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        durationHours: true,
        pricePerPerson: true,
        maxGroupSize: true,
        minGroupSize: true,
        meetingPoint: true,
        inclusions: true,
        exclusions: true,
        itinerary: true,
        createdAt: true,
        guide: {
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            baseLocation: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    // ✅ Add available slots count for each package
    const packagesWithSlots = await Promise.all(
      packages.map(async (pkg) => {
        const availableSlotsCount = await prisma.guideAvailability.count({
          where: {
            guideId: pkg.guide.id,
            isBooked: false,
            date: { gte: new Date() }, // Future dates only
          },
        });

        return {
          ...pkg,
          availableSlots: availableSlotsCount,
        };
      })
    );

    const total = await prisma.tourPackage.count({
      where: { AND: andConditions },
    });

    return {
      data: packagesWithSlots,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== 3. Search Packages (with Filters) =====
const searchPackages = async (query: IPublicPackageQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [
      { status: PackageStatus.APPROVED },
      { isDeleted: false },
      {
        guide: {
          isApproved: true,
          user: {
            isDeleted: false,
            status: UserStatus.ACTIVE,
          },
        },
      },
    ];

    // ✅ Search by title or description
    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }

    // ✅ Filter by location
    if (query.location) {
      andConditions.push({
        OR: [
          { meetingPoint: { contains: query.location, mode: "insensitive" } },
          {
            guide: {
              baseLocation: { contains: query.location, mode: "insensitive" },
            },
          },
        ],
      });
    }

    // ✅ Filter by price
    if (query.minPrice || query.maxPrice) {
      const priceFilter: any = {};
      if (query.minPrice) priceFilter.gte = Number(query.minPrice);
      if (query.maxPrice) priceFilter.lte = Number(query.maxPrice);
      andConditions.push({ pricePerPerson: priceFilter });
    }

    // ✅ Filter by duration
    if (query.minDuration || query.maxDuration) {
      const durationFilter: any = {};
      if (query.minDuration) durationFilter.gte = Number(query.minDuration);
      if (query.maxDuration) durationFilter.lte = Number(query.maxDuration);
      andConditions.push({ durationHours: durationFilter });
    }

    // ✅ Sort
    const sortField = ["pricePerPerson", "durationHours", "createdAt"].includes(sortBy)
      ? sortBy
      : "createdAt";

    const packages = await prisma.tourPackage.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortField]: sortOrder as "asc" | "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        durationHours: true,
        pricePerPerson: true,
        maxGroupSize: true,
        minGroupSize: true,
        meetingPoint: true,
        inclusions: true,
        exclusions: true,
        itinerary: true,
        createdAt: true,
        guide: {
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            baseLocation: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.tourPackage.count({
      where: { AND: andConditions },
    });

    return {
      data: packages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

// =============================================
// ========== EXPORT =============
// =============================================
export const PublicService = {
  getAllGuides,
  getAllPackages,
  searchPackages,
};