// services/tourist.service.ts
import httpStatus from "http-status";
import { IAvailabilityQuery, IAvailableOnlyQuery, IBookingQuery, ICreateBooking, ICreateReview, IGuideAvailabilityQuery, ITouristPackageQuery } from "./touris.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { BookingStatus, PackageStatus, Role, UserStatus } from "../../../generated/prisma/enums";





const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
};


const createBooking = async (bookingData: ICreateBooking) => {
  try {
    const { packageId, userId, tourDate, numberOfPeople, specialRequests } =
      bookingData;

    // 1. Check tourist profile
    const tourist = await prisma.tourist.findUnique({
      where: { userId },
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
    });

    if (!tourist) {
      throw new AppError(httpStatus.NOT_FOUND, "Tourist profile not found");
    }

    // 2. Check tour package
    const tourPackage = await prisma.tourPackage.findUnique({
      where: { id: packageId },
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
    });

    if (!tourPackage) {
      throw new AppError(httpStatus.NOT_FOUND, "Tour package not found");
    }

    if (tourPackage.status !== PackageStatus.APPROVED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Tour package is not available"
      );
    }

    if (tourPackage.isDeleted) {
      throw new AppError(httpStatus.BAD_REQUEST, "Tour package is deleted");
    }

    // 3. Check group size
    if (
      numberOfPeople < tourPackage.minGroupSize ||
      numberOfPeople > tourPackage.maxGroupSize
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Group size must be between ${tourPackage.minGroupSize} and ${tourPackage.maxGroupSize}`
      );
    }

    // 4. Prevent guide from booking own package
    if (tourPackage.guide.user.id === userId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot book your own tour package"
      );
    }

    // 5. Validate tour date (not in the past)
    const tourDateObj = new Date(tourDate);
    if (isNaN(tourDateObj.getTime())) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid tour date format");
    }

    if (tourDateObj < new Date()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Tour date cannot be in the past"
      );
    }

    tourDateObj.setHours(0, 0, 0, 0);

  
    const availability = await prisma.guideAvailability.findFirst({
      where: {
        guideId: tourPackage.guideId,
        date: tourDateObj,
      },
    });

    // 6.1 Check if availability exists
    if (!availability) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Guide is not available on this date. Please try another date."
      );
    }

    // 6.2 Check if slot is already booked
    if (availability.isBooked) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This date is already booked. Please try another date."
      );
    }

    
    const existingBooking = await prisma.booking.findFirst({
      where: {
        touristId: tourist.id,
        packageId: tourPackage.id,
        tourDate: tourDateObj,
        status: {
          notIn: [BookingStatus.CANCELLED, BookingStatus.REFUNDED],
        },
      },
    });

    if (existingBooking) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You already have a booking for this package on this date"
      );
    }

    // 8. Calculate total price
    const totalPrice = numberOfPeople * tourPackage.pricePerPerson;

   
    const booking = await prisma.$transaction(async (tx) => {
      // 9.1 Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingReference: generateBookingReference(),
          touristId: tourist.id,
          guideId: tourPackage.guideId,
          packageId: tourPackage.id,
          tourDate: tourDateObj,
          numberOfPeople,
          totalPrice,
          specialRequests: specialRequests || null,
          status: BookingStatus.PENDING_PAYMENT,
          paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        },
        include: {
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
        },
      });

      await tx.guideAvailability.update({
        where: { id: availability.id },
        data: {
          isBooked: true,
          packageId: tourPackage.id,
        },
      });

      return newBooking;
    });

    return booking;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};


const createReview = async (
  userId: string,
  reviewData: ICreateReview
) => {
  try {
    const { bookingId, rating, comment, images } = reviewData;

    // 1. Validate rating
    if (rating < 1 || rating > 5) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Rating must be between 1 and 5"
      );
    }

    // 2. Check tourist profile
    const tourist = await prisma.tourist.findUnique({
      where: { userId },
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
    });

    if (!tourist) {
      throw new AppError(httpStatus.NOT_FOUND, "Tourist profile not found");
    }

    // 3. Check booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        review: true,
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
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // 4. Authorization - Only tourist who booked
    if (booking.touristId !== tourist.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only review your own bookings"
      );
    }

    // 5. Only COMPLETED bookings can be reviewed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You can only review completed bookings"
      );
    }

    // 6. Check if review already exists
    if (booking.review) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You have already reviewed this booking"
      );
    }

    // 7. Create review + Update guide rating (transaction)
    const result = await prisma.$transaction(async (tx) => {
      // 7.1 Create review
      const review = await tx.review.create({
        data: {
          bookingId,
          touristId: tourist.userId,
          guideId: booking.guideId,
          rating,
          comment: comment || null,
          images: images || [],
        },
        include: {
          tourist: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
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
          booking: {
            select: {
              id: true,
              bookingReference: true,
              tourDate: true,
            },
          },
        },
      });

      // 7.2 Calculate new guide rating
      const allReviews = await tx.review.findMany({
        where: {
          guideId: booking.guideId,
          isDeleted: false,
        },
        select: {
          rating: true,
        },
      });

      const totalReviews = allReviews.length;
      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      // 7.3 Update guide rating
      await tx.guide.update({
        where: { id: booking.guideId },
        data: {
          rating: Number(avgRating.toFixed(2)),
          totalReviews: totalReviews,
        },
      });

      return review;
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};


const cancelBooking = async (
  bookingId: string,
  userId: string,
  cancellationReason?: string
) => {
  try {
    // 1. Check tourist profile
    const tourist = await prisma.tourist.findUnique({
      where: { userId },
    });

    if (!tourist) {
      throw new AppError(httpStatus.NOT_FOUND, "Tourist profile not found");
    }

    // 2. Check booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // 3. Authorization - Only own booking
    if (booking.touristId !== tourist.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only cancel your own bookings"
      );
    }

    // 4. Only PENDING_PAYMENT can be cancelled
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot cancel booking with status: ${booking.status}. Only PENDING_PAYMENT bookings can be cancelled.`
      );
    }

    // 5. Cancel booking + Free availability slot (transaction)
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: cancellationReason || "Cancelled by tourist",
        },
      });

      // 5.2 Free up availability slot
      await tx.guideAvailability.updateMany({
        where: {
          guideId: booking.guideId,
          date: booking.tourDate,
          isBooked: true,
        },
        data: {
          isBooked: false,
          packageId: null,
        },
      });

      return updatedBooking;
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getMyBookings = async (userId: string, query: IBookingQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    // Check tourist profile
    const tourist = await prisma.tourist.findUnique({
      where: { userId },
    });

    if (!tourist) {
      throw new AppError(httpStatus.NOT_FOUND, "Tourist profile not found");
    }

    const andConditions: any[] = [{ touristId: tourist.id }];

    // Filter by status
    if (query.status) {
      andConditions.push({ status: query.status });
    }

    // Filter by package
    if (query.packageId) {
      andConditions.push({ packageId: query.packageId });
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      andConditions.push({ tourDate: dateFilter });
    }

    const bookings = await prisma.booking.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
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
        package: {
          select: {
            id: true,
            title: true,
            meetingPoint: true,
            durationHours: true,
            pricePerPerson: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            bKashTrxId: true,
            paidAt: true,
          },
        },
        review: true,
      },
    });

    const total = await prisma.booking.count({
      where: { AND: andConditions },
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




const getAllPackages = async (query: ITouristPackageQuery) => {
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
            role: Role.GUIDE,
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

    // Filter by location
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

    // Filter by price
    if (query.minPrice || query.maxPrice) {
      const priceFilter: any = {};
      if (query.minPrice) priceFilter.gte = Number(query.minPrice);
      if (query.maxPrice) priceFilter.lte = Number(query.maxPrice);
      andConditions.push({ pricePerPerson: priceFilter });
    }

    // Filter by duration
    if (query.minDuration || query.maxDuration) {
      const durationFilter: any = {};
      if (query.minDuration) durationFilter.gte = Number(query.minDuration);
      if (query.maxDuration) durationFilter.lte = Number(query.maxDuration);
      andConditions.push({ durationHours: durationFilter });
    }

    const sortField = ["pricePerPerson", "durationHours", "createdAt"].includes(sortBy)
      ? sortBy
      : "createdAt";

    const packages = await prisma.tourPackage.findMany({
      where: { AND: andConditions },
      take: limit,
      skip,
      orderBy: { [sortField]: sortOrder as "asc" | "desc" },
      include: {
        guide: {
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            baseLocation: true,
            yearsExperience: true,
            languages: true,
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
// ===== Get All Availability (Both Booked & Available) =====
// =============================================
const getAllAvailability = async (query: IAvailabilityQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 20;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    // Filter by guide
    if (query.guideId) {
      andConditions.push({ guideId: query.guideId });
    }

    // Filter by package
    if (query.packageId) {
      andConditions.push({ packageId: query.packageId });
    }

    // Filter by date range
    if (query.startDate || query.endDate) {
      const dateFilter: any = {};
      if (query.startDate) dateFilter.gte = new Date(query.startDate);
      if (query.endDate) dateFilter.lte = new Date(query.endDate);
      andConditions.push({ date: dateFilter });
    }

    const availabilities = await prisma.guideAvailability.findMany({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
      take: limit,
      skip,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        guide: {
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            baseLocation: true,
            yearsExperience: true,
            languages: true,
            hourlyRate: true,
            isAvailable: true,
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

    const total = await prisma.guideAvailability.count({
      where: andConditions.length > 0 ? { AND: andConditions } : {},
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
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};


const getAvailableOnly = async (query: IAvailableOnlyQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 20;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const andConditions: any[] = [
      { isBooked: false },             
    ];

    // Filter by guide
    if (query.guideId) {
      andConditions.push({ guideId: query.guideId });
    }

    // Filter by package
    if (query.packageId) {
      andConditions.push({ packageId: query.packageId });
    }

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
      include: {
        guide: {
          select: {
            id: true,
            rating: true,
            totalReviews: true,
            baseLocation: true,
            yearsExperience: true,
            languages: true,
            hourlyRate: true,
            isAvailable: true,
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
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};





export const TouristService = {
  createBooking,
  createReview,
  cancelBooking, 
  getMyBookings, 
  getAllPackages,
    getAllAvailability,
  getAvailableOnly,    
};