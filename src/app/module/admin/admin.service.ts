// services/admin.service.ts
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";
import {
  PackageStatus,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import {
  ITouristQuery,
  IGuideQuery,
  IUpdateUserStatus,
  IGetAllPackagesQuery,
  IApproveGuidePayload,
} from "./admin.interface";

// =============================================
// ========== PUBLIC SERVICE METHODS ==========
// =============================================

// ===== 1. Get All Tourists =====
const getAllTourists = async (query: ITouristQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [
      { role: Role.TOURIST },
      { isDeleted: false },
    ];

    // Filter by status
    if (query.status) {
      andConditions.push({ status: query.status as UserStatus });
    }

    // Search by name or email
    if (query.search) {
      andConditions.push({
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }

    const tourists = await prisma.user.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        role: true,
        status: true,
        emailVerified: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        tourist: {
          select: {
            id: true,
            contactNumber: true,
            address: true,
            nationality: true,
            dateOfBirth: true,
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.user.count({
      where: { AND: andConditions },
    });

    return {
      data: tourists,
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

// ===== 2. Get All Guides =====
const getAllGuides = async (query: IGuideQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [
      { role: Role.GUIDE },
      { isDeleted: false },
    ];

    // Filter by status
    if (query.status) {
      andConditions.push({ status: query.status as UserStatus });
    }

    // Filter by isApproved
    if (query.isApproved !== undefined) {
      andConditions.push({
        guide: {
          isApproved: query.isApproved,
        },
      });
    }

    // Search by name or email
    if (query.search) {
      andConditions.push({
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      });
    }

    const guides = await prisma.user.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        role: true,
        status: true,
        emailVerified: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        guide: {
          select: {
            id: true,
            licenseNumber: true,
            yearsExperience: true,
            languages: true,
            baseLocation: true,
            bio: true,
            isApproved: true,
            rating: true,
            totalReviews: true,
            hourlyRate: true,
            isAvailable: true,
            totalEarnings: true,
            totalBookings: true,
            _count: {
              select: {
                packages: true,
                bookings: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.user.count({
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

// ===== 3. Update User Status (Block/Unblock) =====
const updateUserStatus = async (
  userId: string,
  data: IUpdateUserStatus
) => {
  try {
    const { status } = data;

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.isDeleted) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cannot update status of deleted user"
      );
    }

    // Prevent admin from blocking other admins
    if (user.role === Role.ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Cannot block/unblock admin users"
      );
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: status as UserStatus,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== 4. Delete User (Soft Delete) =====
const deleteUser = async (userId: string) => {
  try {
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.isDeleted) {
      throw new AppError(httpStatus.BAD_REQUEST, "User already deleted");
    }

    // Prevent admin from deleting other admins
    if (user.role === Role.ADMIN) {
      throw new AppError(httpStatus.FORBIDDEN, "Cannot delete admin users");
    }

    // Soft delete
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isDeleted: true,
        deletedAt: true,
      },
    });

    return deletedUser;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== 5. Get User Details =====
const getUserDetails = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        googleId: true,
        authProvider: true,
        emailVerified: true,
        role: true,
        status: true,
        needPasswordChange: true,
        imageUrl: true,
        imagePublicId: true,
        isDeleted: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        tourist: {
          select: {
            id: true,
            contactNumber: true,
            address: true,
            nationality: true,
            dateOfBirth: true,
            createdAt: true,
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
        guide: {
          select: {
            id: true,
            licenseNumber: true,
            yearsExperience: true,
            languages: true,
            baseLocation: true,
            latitude: true,
            longitude: true,
            bio: true,
            isApproved: true,
            rating: true,
            totalReviews: true,
            hourlyRate: true,
            isAvailable: true,
            totalEarnings: true,
            totalBookings: true,
            createdAt: true,
            _count: {
              select: {
                packages: true,
                bookings: true,
                guideReviews: true,
              },
            },
          },
        },
        _count: {
          select: {
            userReviews: true,
            complaintsMade: true,
            complaintsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return user;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};



// src/app/module/admin/admin.service.ts

// ... আগের imports
import {
  IAdminBookingQuery,
  IAdminPaymentQuery,
} from "./admin.interface";

// =============================================
// ===== 1. Get All Bookings (Admin) =====
// =============================================
const getAllBookings = async (query: IAdminBookingQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [];

    // Filter by booking status
    if (query.status) {
      andConditions.push({ status: query.status });
    }

    // Filter by payment status
    if (query.paymentStatus) {
      andConditions.push({
        payment: { status: query.paymentStatus },
      });
    }

    // Filter by tourist email
    if (query.touristEmail) {
      andConditions.push({
        tourist: {
          user: {
            email: { contains: query.touristEmail, mode: "insensitive" },
          },
        },
      });
    }

    // Filter by guide email
    if (query.guideEmail) {
      andConditions.push({
        guide: {
          user: {
            email: { contains: query.guideEmail, mode: "insensitive" },
          },
        },
      });
    }

    // Filter by package
    if (query.packageId) {
      andConditions.push({ packageId: query.packageId });
    }

    // Filter by date range (tourDate)
    if (query.startDate || query.endDate) {
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      andConditions.push({ tourDate: dateFilter });
    }

    const sortField = ["createdAt", "tourDate", "totalPrice"].includes(sortBy)
      ? sortBy
      : "createdAt";

    const bookings = await prisma.booking.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
      take: limit,
      skip,
      orderBy: { [sortField]: sortOrder as "asc" | "desc" },
      include: {
        tourist: {
          include: {
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
        guide: {
          include: {
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
        package: {
          select: {
            id: true,
            title: true,
            meetingPoint: true,
            pricePerPerson: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            bKashTrxId: true,
            guideEarning: true,
            commissionFee: true,
            platformFee: true,
            paidAt: true,
            refundedAt: true,
            refundReason: true,
          },
        },
      },
    });

    const total = await prisma.booking.count({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
    });

    return {
      data: bookings,
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
// ===== 2. Get Single Booking Details (Admin) =====
// =============================================
const getBookingDetails = async (bookingId: string) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tourist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                status: true,
                emailVerified: true,
              },
            },
          },
        },
        guide: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true,
                status: true,
              },
            },
          },
        },
        package: {
          include: {
            guide: {
              include: {
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
        },
        payment: true,          // ← Full payment data
        review: true,           // ← Review if exists
        complaint: true,        // ← Complaint if exists
      },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    return booking;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

// =============================================
// ===== 3. Get All Payments (Admin) =====
// =============================================
const getAllPayments = async (query: IAdminPaymentQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    const andConditions: any[] = [];

    // Filter by payment status
    if (query.status) {
      andConditions.push({ status: query.status });
    }

    // Filter by payment method
    if (query.method) {
      andConditions.push({ paymentMethod: query.method });
    }

    // Filter by date range (createdAt)
    if (query.startDate || query.endDate) {
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      andConditions.push({ createdAt: dateFilter });
    }

    const sortField = ["createdAt", "amount", "paidAt"].includes(sortBy)
      ? sortBy
      : "createdAt";

    const payments = await prisma.payment.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
      take: limit,
      skip,
      orderBy: { [sortField]: sortOrder as "asc" | "desc" },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            tourDate: true,
            numberOfPeople: true,
            totalPrice: true,
            status: true,
            tourist: {
              include: {
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
            guide: {
              include: {
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
        },
      },
    });

    const total = await prisma.payment.count({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
    });

    // Calculate statistics
    const stats = await prisma.payment.groupBy({
      by: ["status"],
      _count: true,
      _sum: {
        amount: true,
        guideEarning: true,
        commissionFee: true,
        platformFee: true,
      },
    });

    return {
      data: payments,
      stats,
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


const approveGuide = async (
  userId: string,                    // 👈 ekhon userId (User.id)
  payload: IApproveGuidePayload
) => {
  const { isApproved } = payload;

  // 1. User.id diye Guide khujo
  const guide = await prisma.guide.findUnique({
    where: { userId },               // 👈 userId diye
    include: { user: true },
  });

  if (!guide) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Guide profile not found for this user"
    );
  }

  // 2. Already same status
  if (guide.isApproved === isApproved) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Guide is already ${isApproved ? "approved" : "rejected"}`
    );
  }

  // 3. User deleted
  if (guide.user.isDeleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot approve — user account is deleted"
    );
  }

  // 4. Approve korar age profile complete check
  if (isApproved) {
    const missing: string[] = [];

    if (!guide.licenseNumber || guide.licenseNumber === "PENDING") {
      missing.push("licenseNumber");
    }
    if (!guide.bio) missing.push("bio");
    if (!guide.languages || guide.languages.length === 0) {
      missing.push("languages");
    }
    if (!guide.baseLocation) missing.push("baseLocation");

    if (missing.length > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot approve — profile incomplete. Missing: ${missing.join(", ")}`
      );
    }
  }

  // 5. Transaction — Guide + User duitai update
  const result = await prisma.$transaction(async (tx) => {
    const updatedGuide = await tx.guide.update({
      where: { userId },             // 👈 userId
      data: { isApproved },
    });

    if (isApproved) {
      await tx.user.update({
        where: { id: userId },       // 👈 userId
        data: { status: UserStatus.ACTIVE },
      });
    }

    return updatedGuide;
  });

  return result;
};



const getAllPackages = async (query: IGetAllPackagesQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.status) {
    where.status = query.status;
  }

  if (typeof query.isDeleted === "boolean") {
    where.isDeleted = query.isDeleted;
  }

  if (query.guideId) {
    where.guideId = query.guideId;
  }

  const [packages, total] = await Promise.all([
    prisma.tourPackage.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        guide: {
          include: {
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
          select: { bookings: true },
        },
      },
    }),
    prisma.tourPackage.count({ where }),
  ]);

  return {
    data: packages,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ================================================================
// ============ APPROVE PACKAGE ============
// ================================================================
const approvePackage = async (
  packageId: string,
  payload: { status: PackageStatus }
) => {
  const { status } = payload;

  // 1. Status validate
  if (
    status !== PackageStatus.APPROVED &&
    status !== PackageStatus.REJECTED
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Status must be APPROVED or REJECTED"
    );
  }

  // 2. Package khujo
  const tourPackage = await prisma.tourPackage.findUnique({
    where: { id: packageId },
    include: {
      guide: {
        include: { user: true },
      },
    },
  });

  if (!tourPackage) {
    throw new AppError(httpStatus.NOT_FOUND, "Package not found");
  }

  // 3. Deleted
  if (tourPackage.isDeleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot approve — package is deleted"
    );
  }

  // 4. Guide approved
  if (!tourPackage.guide.isApproved) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot approve package — guide is not approved yet"
    );
  }

  // 5. Already same status
  if (tourPackage.status === status) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Package is already ${status}`
    );
  }

  // 6. Update
  const updated = await prisma.tourPackage.update({
    where: { id: packageId },
    data: { status },
    include: {
      guide: {
        include: {
          user: {
            select: { name: true, email: true, imageUrl: true },
          },
        },
      },
    },
  });

  return updated;
};





export const AdminService = {
  getAllTourists,
  getAllGuides,
  updateUserStatus,
  deleteUser,
  getUserDetails,

    getAllBookings,
  getBookingDetails,
  getAllPayments,


  approveGuide,
  getAllPackages,
  approvePackage,
};