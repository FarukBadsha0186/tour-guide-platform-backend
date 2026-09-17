

import status from "http-status";
import { BookingStatus, PackageStatus, PaymentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreatePackagePayload, IGuideBookingQuery, IPackageFilter, IUpdateBookingStatus, IUpdateGuideProfile, IUpdatePackagePayload } from "./guide.interface";

import { sendEmailWithAttachment } from "../../lib/nodemailer";
import { generateInvoicePDF } from "../../lib/pdf";
import { PaymentService } from "../payment/payement.service";



// guide.service.ts - Update profile
const updateMyProfile = async (userId: string, payload: IUpdateGuideProfile, profileImage?: string) => {
  
  const existingGuide = await prisma.guide.findUnique({
    where: { userId },
  });

  if (!existingGuide) {
    throw new Error("Guide profile not found");
  }

  //  Update Guide data
  const updateData: any = {
    licenseNumber: payload.licenseNumber,
    yearsExperience: payload.yearsExperience,
    languages: payload.languages,
    baseLocation: payload.baseLocation,
    bio: payload.bio,
    hourlyRate: payload.hourlyRate,
  };

  
  if (profileImage) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        imageUrl: profileImage,
      },
    });
  }

  // Update guide
  const updatedGuide = await prisma.guide.update({
    where: { userId },
    data: updateData,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          imageUrl: true,  
        },
      },
    },
  });

  return updatedGuide;
};

// ===== GET MY PROFILE =====
const getMyProfile = async (userId: string) => {
  const guide = await prisma.guide.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!guide) {
    throw new Error("Guide profile not found");
  }

  return guide;
};

const createPackage = async (guideId: string, payload: ICreatePackagePayload) => {
  
  const guide = await prisma.guide.findUnique({
    where: { userId: guideId },
    include: { user: true },
  });

  if (!guide) {
    throw new Error("Guide not found");
  }

  if (!guide.isApproved) {
    throw new Error("Guide is not approved yet. Please wait for admin approval.");
  }

  // Create package with PENDING status
  const newPackage = await prisma.tourPackage.create({
    data: {
        guideId: guide.id,
      title: payload.title,
      description: payload.description,
      durationHours: payload.durationHours,
      pricePerPerson: payload.pricePerPerson,
      maxGroupSize: payload.maxGroupSize,
      minGroupSize: payload.minGroupSize || 1,
      meetingPoint: payload.meetingPoint || null,
      status: PackageStatus.PENDING,
      itinerary: {},
      inclusions: [],
      exclusions: [],
    },
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

  return newPackage;
};

// ===== GET ALL PACKAGES (PUBLIC) =====
const getAllPackages = async (filter: IPackageFilter) => {
  const { search, status, minPrice, maxPrice, duration, page = 1, limit = 10 } = filter;

  const skip = (parseInt(page as any) - 1) * parseInt(limit as any);
  const take = parseInt(limit as any);

  const where: any = {
    isDeleted: false,
  };

  if (!status) {
    where.status = PackageStatus.APPROVED;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (minPrice || maxPrice) {
    where.pricePerPerson = {};
    if (minPrice) where.pricePerPerson.gte = parseFloat(minPrice as any);
    if (maxPrice) where.pricePerPerson.lte = parseFloat(maxPrice as any);
  }

  if (duration) {
    where.durationHours = parseInt(duration as any);
  }

  const [packages, total] = await Promise.all([
    prisma.tourPackage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
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
    }),
    prisma.tourPackage.count({ where }),
  ]);

  return {
    data: packages,
    meta: {
      page: parseInt(page as any),
      limit: parseInt(limit as any),
      total,
      totalPages: Math.ceil(total / parseInt(limit as any)),
    },
  };
};

// ===== GET PACKAGE BY ID =====
const getPackageById = async (packageId: string) => {
  const packageData = await prisma.tourPackage.findUnique({
    where: { id: packageId, isDeleted: false },
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

  if (!packageData) {
    throw new Error("Package not found");
  }

  if (packageData.status !== PackageStatus.APPROVED) {
    throw new Error("Package is not available yet");
  }

  return packageData;
};

// ===== UPDATE PACKAGE =====
const updatePackage = async (packageId: string, guideId: string, payload: IUpdatePackagePayload) => {
  const existingPackage = await prisma.tourPackage.findUnique({
    where: { id: packageId },
  });

  if (!existingPackage) {
    throw new Error("Package not found");
  }

  if (existingPackage.guideId !== guideId) {
    throw new Error("You don't have permission to update this package");
  }

  if (existingPackage.isDeleted) {
    throw new Error("Package has been deleted");
  }

  const updatedPackage = await prisma.tourPackage.update({
    where: { id: packageId },
    data: {
      title: payload.title,
      description: payload.description,
      durationHours: payload.durationHours,
      pricePerPerson: payload.pricePerPerson,
      maxGroupSize: payload.maxGroupSize,
      minGroupSize: payload.minGroupSize,
      meetingPoint: payload.meetingPoint || null,
      status: PackageStatus.PENDING,
    },
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

  return updatedPackage;
};

// ===== SOFT DELETE PACKAGE =====
const deletePackage = async (packageId: string, guideId: string) => {
  const existingPackage = await prisma.tourPackage.findUnique({
    where: { id: packageId },
  });

  if (!existingPackage) {
    throw new Error("Package not found");
  }

  if (existingPackage.guideId !== guideId) {
    throw new Error("You don't have permission to delete this package");
  }

  const deletedPackage = await prisma.tourPackage.update({
    where: { id: packageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return deletedPackage;
};

// ===== GET MY PACKAGES (GUIDE) =====
const getMyPackages = async (guideId: string, filter: any) => {
  const { status, page = 1, limit = 10 } = filter;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const where: any = {
    guideId,
    isDeleted: false,
  };

  if (status) {
    where.status = status;
  }

  const [packages, total] = await Promise.all([
    prisma.tourPackage.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
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
    }),
    prisma.tourPackage.count({ where }),
  ]);

  return {
    data: packages,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};




const getMyBookings = async (userId: string, query: IGuideBookingQuery) => {
  try {
    const limit = query.limit ? Number(query.limit) : 10;
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";

    // Check guide profile
    const guide = await prisma.guide.findUnique({
      where: { userId },
    });

    if (!guide) {
      throw new AppError(status.NOT_FOUND, "Guide profile not found");
    }

    const andConditions: any[] = [{ guideId: guide.id }];

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
            guideEarning: true,
            commissionFee: true,
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
    throw new AppError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

// ===== 2. Get Booking Details =====
const getBookingDetails = async (bookingId: string, userId: string) => {
  try {
    // Check guide profile
    const guide = await prisma.guide.findUnique({
      where: { userId },
    });

    if (!guide) {
      throw new AppError(status.NOT_FOUND, "Guide profile not found");
    }

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
                 // User এ contactNumber আছে কিনা চেক করুন
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
        payment: true,
        review: true,
        complaint: true,
      },
    });

    if (!booking) {
      throw new AppError(status.NOT_FOUND, "Booking not found");
    }

    // Authorization check
    if (booking.guideId !== guide.id) {
      throw new AppError(
        status.FORBIDDEN,
        "You are not allowed to view this booking"
      );
    }

    return booking;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};




const updateBookingStatus = async (
  bookingId: string,
  userId: string,
  data: IUpdateBookingStatus
) => {
  try {
   
    const guide = await prisma.guide.findUnique({
      where: { userId },
    });

    if (!guide) {
      throw new AppError(status.NOT_FOUND, "Guide profile not found");
    }

  
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        package: true,
      },
    });

    if (!booking) {
      throw new AppError(status.NOT_FOUND, "Booking not found");
    }

 
    if (booking.guideId !== guide.id) {
      throw new AppError(
        status.FORBIDDEN,
        "You are not allowed to update this booking"
      );
    }

  
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError(
        status.BAD_REQUEST,
        `Cannot update booking with status: ${booking.status}. Only CONFIRMED bookings can be updated.`
      );
    }

    
    if (data.status === "COMPLETED") {
    
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          tourist: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          guide: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
          package: {
            select: { title: true, meetingPoint: true },
          },
          payment: true,
        },
      });

    
      try {
        const pdfBuffer = await generateInvoicePDF(
          updatedBooking as any,
          "COMPLETED"
        );

        const pdfFileName = `Invoice-${updatedBooking.bookingReference}.pdf`;

        await sendEmailWithAttachment({
          to: updatedBooking.tourist.user.email,
          subject: `Tour Booking Confirmation - ${updatedBooking.bookingReference}`,
          templateName: "booking_completed",
          templateData: {
            touristName: updatedBooking.tourist.user.name,
            bookingReference: updatedBooking.bookingReference,
            tourDate: new Date(updatedBooking.tourDate).toLocaleDateString(
              "en-GB"
            ),
            numberOfPeople: updatedBooking.numberOfPeople,
            totalAmount: `BDT ${updatedBooking.totalPrice.toFixed(2)}`,
          },
          pdfBuffer,
          pdfFileName,
        });
      } catch (error: any) {
        console.error("❌ PDF/Email error (COMPLETED):", error.message);
      }

      return {
        success: true,
        message: "Booking marked as completed successfully",
        booking: updatedBooking,
      };
    }

   
    if (data.status === "CANCELLED") {
      let refundResult: any = null;

      if (booking.payment && booking.payment.bKashTrxId) {
        console.log("💰 Calling bKash Refund API...");
        console.log("bKash TrxID:", booking.payment.bKashTrxId);
        console.log("Amount:", booking.payment.amount);

       
        const bkashPaymentId = (booking.payment.paymentData as any)?.paymentId;

        if (!bkashPaymentId) {
          throw new AppError(
            status.BAD_REQUEST,
            "bKash Payment ID not found for refund"
          );
        }

        refundResult = await PaymentService.refundBkashPayment(

           bkashPaymentId,
           booking.payment.amount,
           "Customer Cancelled The Booking",
           booking.payment.bKashTrxId,
           `BOOKING-${booking.bookingReference}`
        );

        if (!refundResult.success) {
          console.error("❌ bKash Refund Failed:", refundResult.error);
          throw new AppError(
            status.BAD_GATEWAY,
            `bKash Refund Failed: ${refundResult.error}`
          );
        }

        console.log(" bKash Refund Success:", refundResult);
      }


      const result = await prisma.$transaction(async (tx) => {
        // 2.1 Update booking status
        const updatedBooking = await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason:
              data.cancellationReason || "Cancelled by guide",
          },
        });

        // 2.2 Update payment status → REFUNDED
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundedAt: new Date(),
              refundReason:
                data.cancellationReason || "Cancelled by guide",
            },
          });
        }

        // 2.3 Free availability slot
        await tx.guideAvailability.updateMany({
          where: {
            guideId: guide.id,
            date: booking.tourDate,
            isBooked: true,
          },
          data: {
            isBooked: false,
            packageId: null,
          },
        });

        // 2.4 Update guide stats (decrement)
        await tx.guide.update({
          where: { id: guide.id },
          data: {
            totalEarnings: {
              decrement: booking.payment?.guideEarning || 0,
            },
            totalBookings: {
              decrement: 1,
            },
          },
        });

        return updatedBooking;
      });

   
      try {
     
        const fullBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            tourist: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
            guide: {
              include: {
                user: { select: { name: true, email: true } },
              },
            },
            package: {
              select: { title: true, meetingPoint: true },
            },
            payment: true,
          },
        });

        if (fullBooking) {
          const pdfBuffer = await generateInvoicePDF(
            fullBooking as any,
            "CANCELLED"
          );

          const pdfFileName = `Invoice-${fullBooking.bookingReference}.pdf`;

          await sendEmailWithAttachment({
            to: fullBooking.tourist.user.email,
            subject: `Booking Cancelled + Refund Confirmation - ${fullBooking.bookingReference}`,
            templateName: "booking_canceled",
            templateData: {
              touristName: fullBooking.tourist.user.name,
              bookingReference: fullBooking.bookingReference,
              tourDate: new Date(fullBooking.tourDate).toLocaleDateString(
                "en-GB"
              ),
              numberOfPeople: fullBooking.numberOfPeople,
              cancellationReason:
                data.cancellationReason || "Cancelled by guide",
              refundAmount: `BDT ${fullBooking.totalPrice.toFixed(2)}`,
            },
            pdfBuffer,
            pdfFileName,
          });
        }
      } catch (error: any) {
        console.error("❌ PDF/Email error (CANCELLED):", error.message);
      }

      return {
        success: true,
        message:
          "Booking cancelled successfully. Refund processed to tourist.",
        booking: result,
        refund: refundResult,
      };
    }

   
    throw new AppError(status.BAD_REQUEST, "Invalid status provided");
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};



export const GuideServices = {
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