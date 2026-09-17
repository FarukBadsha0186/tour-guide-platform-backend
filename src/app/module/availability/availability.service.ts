// src/app/modules/availability/availability.service.ts

import status from "http-status";
import { DateHelpers } from "../../lib/dateHelper";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IAvailabilityQuery } from "../guide/guide.interface";
import { IAvailabilityFilter, ICreateAvailabilityPayload, IUpdateAvailabilityPayload } from "./availability.interface";
import { STATUS_CODES } from "node:http";



// ===== CREATE AVAILABILITY =====
const createAvailability = async (guideId: string, payload: ICreateAvailabilityPayload) => {
  const { dates, startTime, endTime, packageId } = payload;

  // Check if guide exists and is approved
  const guide = await prisma.guide.findUnique({
    where: { userId: guideId },
  });

  if (!guide) {
    throw new Error("Guide not found");
  }

  if (!guide.isApproved) {
    throw new Error("Guide is not approved yet. Please wait for admin approval.");
  }

  // Check if package exists (if packageId provided)
  if (packageId) {
    const packageExists = await prisma.tourPackage.findUnique({
      where: { id: packageId, guideId: guide.id },
    });

    if (!packageExists) {
      throw new Error("Package not found or doesn't belong to you");
    }

    if (packageExists.isDeleted) {
      throw new Error("Package has been deleted");
    }
  }

  // Validate and prepare availability data
  const availabilityData = [];

  for (const dateStr of dates) {
    // Parse date
    const parsedDate = DateHelpers.parseDate(dateStr);
    
    // Check if date is in future
    if (!DateHelpers.isFuture(parsedDate)) {
      throw new Error(`Date ${dateStr} must be in future`);
    }

    // Check if date is expired
    if (DateHelpers.isExpired(parsedDate)) {
      throw new Error(`Date ${dateStr} is expired`);
    }

    // Check if slot already exists
    const existingSlot = await prisma.guideAvailability.findFirst({
      where: {
        guideId: guide.id,
        date: parsedDate,
        startTime,
        endTime,
      },
    });

    if (existingSlot) {
      throw new Error(`Slot for ${dateStr} ${startTime}-${endTime} already exists`);
    }

    availabilityData.push({
      guideId: guide.id,
      packageId: packageId || null,
      date: parsedDate,
      startTime,
      endTime,
      isBooked: false,
    });
  }

  // Create availability
  const result = await prisma.guideAvailability.createMany({
    data: availabilityData,
  });

  return {
    success: true,
    message: `Created ${result.count} availability slots`,
    count: result.count,
  };
};

// ===== GET AVAILABILITY BY GUIDE =====
const getAvailabilityByGuide = async (filter: IAvailabilityFilter) => {
  const { guideId, packageId, date, isBooked, page = 1, limit = 10 } = filter;

  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const where: any = {};

  if (guideId) {
    where.guideId = guideId;
  }

  if (packageId) {
    where.packageId = packageId;
  }

  if (date) {
    const parsedDate = DateHelpers.parseDate(date as string);
    where.date = parsedDate;
  }

  if (isBooked !== undefined) {
    where.isBooked = isBooked;
  }

  // Always show only future dates
  where.date = {
    gte: DateHelpers.startOfDay(new Date()),
  };

  const [availabilities, total] = await Promise.all([
    prisma.guideAvailability.findMany({
      where,
      skip,
      take,
      orderBy: { date: "asc" },
      include: {
        guide: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                imageUrl: true,
              },
            },
          },
        },
        package: {
          select: {
            id: true,
            title: true,
            durationHours: true,
            pricePerPerson: true,
          },
        },
      },
    }),
    prisma.guideAvailability.count({ where }),
  ]);

  return {
    data: availabilities,
    meta: {
      page: parseInt(page as any),
      limit: parseInt(limit as any),
      total,
      totalPages: Math.ceil(total / parseInt(limit as any)),
    },
  };
};

// ===== GET SINGLE AVAILABILITY =====
const getAvailabilityById = async (availabilityId: string) => {
  const availability = await prisma.guideAvailability.findUnique({
    where: { id: availabilityId },
    include: {
      guide: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      },
      package: {
        select: {
          id: true,
          title: true,
          durationHours: true,
          pricePerPerson: true,
        },
      },
    },
  });

  if (!availability) {
    throw new Error("Availability not found");
  }

  return availability;
};

// ===== UPDATE AVAILABILITY =====
const updateAvailability = async (
  availabilityId: string,
  guideId: string,
  payload: IUpdateAvailabilityPayload
) => {
  // Check if availability exists and belongs to guide
  const existingAvailability = await prisma.guideAvailability.findUnique({
    where: { id: availabilityId },
  });

  if (!existingAvailability) {
    throw new Error("Availability not found");
  }

  // Check if guide owns this availability
  const guide = await prisma.guide.findUnique({
    where: { userId: guideId },
  });

  if (!guide || existingAvailability.guideId !== guide.id) {
    throw new Error("You don't have permission to update this availability");
  }

  if (existingAvailability.isBooked) {
    throw new Error("Cannot update booked availability");
  }

  const updateData: any = {};

  if (payload.date) {
    const parsedDate = DateHelpers.parseDate(payload.date);
    if (!DateHelpers.isFuture(parsedDate)) {
      throw new Error("Date must be in future");
    }
    updateData.date = parsedDate;
  }

  if (payload.startTime) {
    updateData.startTime = payload.startTime;
  }

  if (payload.endTime) {
    updateData.endTime = payload.endTime;
  }

  if (payload.isBooked !== undefined) {
    updateData.isBooked = payload.isBooked;
  }

  const updated = await prisma.guideAvailability.update({
    where: { id: availabilityId },
    data: updateData,
    include: {
      guide: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return updated;
};

// ===== DELETE AVAILABILITY =====
const deleteAvailability = async (availabilityId: string, guideId: string) => {
  const existingAvailability = await prisma.guideAvailability.findUnique({
    where: { id: availabilityId },
  });

  if (!existingAvailability) {
    throw new Error("Availability not found");
  }

  // Check if guide owns this availability
  const guide = await prisma.guide.findUnique({
    where: { userId: guideId },
  });

  if (!guide || existingAvailability.guideId !== guide.id) {
    throw new Error("You don't have permission to delete this availability");
  }

  if (existingAvailability.isBooked) {
    throw new Error("Cannot delete booked availability");
  }

  await prisma.guideAvailability.delete({
    where: { id: availabilityId },
  });

  return {
    success: true,
    message: "Availability deleted successfully",
  };
};

// ===== GET AVAILABILITY FOR PACKAGE =====
const getAvailabilityByPackage = async (packageId: string) => {
  const availabilities = await prisma.guideAvailability.findMany({
    where: {
      packageId,
      date: {
        gte: DateHelpers.startOfDay(new Date()),
      },
      isBooked: false,
    },
    orderBy: { date: "asc" },
  });

  return availabilities;
};




const getAllAvailability = async (
  userId: string,
  query: IAvailabilityQuery
) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    // Check guide profile
    const guide = await prisma.guide.findUnique({
      where: { userId },
    });

    if (!guide) {
      throw new AppError(status.NOT_FOUND, "Guide profile not found");
    }

    const andConditions: any[] = [{ guideId: guide.id }];

    // Filter by date range
    if (query.startDate || query.endDate) {
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      andConditions.push({ date: dateFilter });
    }

    const availabilities = await prisma.guideAvailability.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        isBooked: true,
        date: true,
        startTime: true,
        endTime: true,
        packageId: true,
      },
    });

    const total = await prisma.guideAvailability.count({
      where: { AND: andConditions },
    });

    return {
      data: availabilities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== 5. Get Available Only (isBooked: false) =====
const getAvailableOnly = async (
  userId: string,
  query: IAvailabilityQuery
) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    // Check guide profile
    const guide = await prisma.guide.findUnique({
      where: { userId },
    });

    if (!guide) {
      throw new AppError(status.NOT_FOUND, "Guide profile not found");
    }

    const andConditions: any[] = [
      { guideId: guide.id },
      { isBooked: false },  
    ];

    // Filter by date range
    if (query.startDate || query.endDate) {
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      andConditions.push({ date: dateFilter });
    }

    const availabilities = await prisma.guideAvailability.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      select: {
        id: true,
        isBooked: true,
        date: true,
        startTime: true,
        endTime: true,
        packageId: true,
      },
    });

    const total = await prisma.guideAvailability.count({
      where: { AND: andConditions },
    });

    return {
      data: availabilities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== EXPORT =====
export const AvailabilityServices = {
  createAvailability,
  getAvailabilityByGuide,
  getAvailabilityById,
  updateAvailability,
  deleteAvailability,
  getAvailabilityByPackage,


  getAllAvailability,     
  getAvailableOnly,  
};