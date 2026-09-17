

// services/payment.service.ts
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import config from "../../config/index";
import { redisclient } from "../../lib/redis";
import { prisma } from "../../lib/prisma";
import {
  BookingStatus,
  PaymentStatus,
  PackageStatus,
} from "../../../generated/prisma/enums";
import {
  IBkashPaymentRequest,
  IBkashPaymentResponse,
} from "./payment.interface";


const getBkashIdToken = async (): Promise<string> => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";

    let bkashIdToken = await redisclient.get(IdTokenKey);
    const bkashIdTokenTTL = await redisclient.ttl(IdTokenKey);

    const bkashRefreshToken = await redisclient.get(RefreshTokenKey);
    const bkashRefreshTokenTTL = await redisclient.ttl(RefreshTokenKey);

    // ===== DEBUG LOGS =====
    console.log("=== bKash Debug Start ===");
    console.log("Base URL:", config.bkash_base_url);
    console.log("App Key:", config.bkash_app_key);
    console.log("Username:", config.bkash_user_name);
    console.log("Password Length:", config.bkash_password?.length);
    console.log("Existing Token:", bkashIdToken ? "YES" : "NO");
    console.log("Existing Token TTL:", bkashIdTokenTTL);
    console.log("=== bKash Debug End ===");

    // ===== Refresh Token Logic =====
    if (
      (bkashIdTokenTTL <= 600 || !bkashIdToken) &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_user_name,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        }
      );

      if (!refreshTokenResponse.ok) {
        const errorData = await refreshTokenResponse.json();
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          errorData.statusMessage || "Bkash Token Refresh Failed"
        );
      }

      const result = await refreshTokenResponse.json();
      bkashIdToken = result.id_token;

      if (bkashIdToken) {
        await redisclient.set(IdTokenKey, bkashIdToken, {
          expiration: { type: "EX", value: 60 * 60 },
        });
      } else {
        throw new AppError(
          httpStatus.BAD_GATEWAY,
          "Invalid token received from refresh"
        );
      }

      return bkashIdToken;
    }

    if (bkashIdTokenTTL > 600 && bkashIdToken) {
      return bkashIdToken;
    }

    // ===== Grant New Token =====
    const requestBody = {
      app_key: config.bkash_app_key,
      app_secret: config.bkash_app_secret,
    };

    console.log(
      "🔍 Request URL:",
      `${config.bkash_base_url}/tokenized/checkout/token/grant`
    );
    console.log("🔍 Request Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_user_name,
          password: config.bkash_password,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("🔍 Response Status:", response.status);

    const responseText = await response.text();
    console.log("🔍 Response Body:", responseText);

    if (!response.ok) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        `Bkash Token Grant Failed: ${responseText}`
      );
    }

    const result = JSON.parse(responseText);

    if (!result.id_token || !result.refresh_token) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        "Invalid token response from bKash"
      );
    }

    await redisclient.set(IdTokenKey, result.id_token, {
      expiration: { type: "EX", value: 60 * 60 },
    });

    await redisclient.set(RefreshTokenKey, result.refresh_token, {
      expiration: { type: "EX", value: 60 * 60 * 24 * 28 },
    });

    return result.id_token;
  } catch (error: any) {
    console.error("❌ bKash Error:", error);
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.BAD_GATEWAY, error.message);
  }
};

// ===== Generate Booking Reference =====
const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

// ===== bKash API Call =====
const callBkashAPI = async (
  endpoint: string,
  method: string,
  body?: any
) => {
  const token = await getBkashIdToken();

  console.log("=== bKash API Call ===");
  console.log("URL:", `${config.bkash_base_url}${endpoint}`);
  console.log("Token:", token.substring(0, 30) + "...");
  console.log("X-APP-Key:", config.bkash_app_key);
  console.log("Body:", JSON.stringify(body, null, 2));

  const response = await fetch(`${config.bkash_base_url}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token,
      "X-APP-Key": config.bkash_app_key,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log("Response Status:", response.status);
  const responseText = await response.text();
  console.log("Response Body:", responseText);

  if (!response.ok) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `Bkash API Error: ${response.status} - ${responseText}`
    );
  }

  return JSON.parse(responseText);
};

// ===== Create bKash Payment =====
const createBkashPayment = async (
  amount: number,
  merchantInvoiceNumber: string
) => {
  try {
    const callbackURL = `${config.bkas_call_back_url}/bkash/callback`;

    console.log("=== Create Payment Debug ===");
    console.log("Amount:", amount);
    console.log("Invoice:", merchantInvoiceNumber);
    console.log("Callback URL:", callbackURL);

    const response = await callBkashAPI("/tokenized/checkout/create", "POST", {
      mode: "0011",
      payerReference: merchantInvoiceNumber,
      callbackURL: callbackURL,
      amount: amount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: merchantInvoiceNumber,
    });

    console.log(" bKash Response:", JSON.stringify(response, null, 2));

    return {
      success: true,
      paymentId: response.paymentID,
      bkashURL: response.bkashURL,
      amount: response.amount,
      transactionStatus: response.transactionStatus,
      createTime: response.createTime,
      invoiceNumber: merchantInvoiceNumber,
    };
  } catch (error: any) {
    console.error(" Create Payment Error:", error);
    return {
      success: false,
      error: error.message || "Payment creation failed",
    };
  }
};

// ===== Execute bKash Payment =====
const executeBkashPayment = async (paymentId: string) => {
  try {
    const response = await callBkashAPI(
      "/tokenized/checkout/execute",
      "POST",
      {
        paymentID: paymentId,
      }
    );

    return {
      success: true,
      paymentId: response.paymentID,
      amount: response.amount,
      currency: response.currency,
      transactionStatus: response.transactionStatus,
      merchantInvoiceNumber: response.merchantInvoiceNumber,
      trxID: response.trxID,
      completedTime: response.completedTime,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Payment execution failed",
    };
  }
};


// const initializePayment = async (
//   paymentData: IBkashPaymentRequest
// ): Promise<IBkashPaymentResponse> => {
//   try {
//     const {
//       packageId,
//       userId,
//       numberOfPeople,
//       tourDate,
//       specialRequests,
//     } = paymentData;

//     // 1. Check tour package
//     const tourPackage = await prisma.tourPackage.findUnique({
//       where: { id: packageId },
//       include: {
//         guide: {
//           include: {
//             user: true,
//           },
//         },
//       },
//     });

//     if (!tourPackage) {
//       throw new AppError(httpStatus.NOT_FOUND, "Tour package not found");
//     }

//     if (tourPackage.status !== PackageStatus.APPROVED) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "Tour package is not available"
//       );
//     }

//     if (tourPackage.isDeleted) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Tour package is deleted");
//     }

//     // 2. Check group size
//     if (
//       numberOfPeople < tourPackage.minGroupSize ||
//       numberOfPeople > tourPackage.maxGroupSize
//     ) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         `Group size must be between ${tourPackage.minGroupSize} and ${tourPackage.maxGroupSize}`
//       );
//     }

//     // 3. Check tourist
//     const tourist = await prisma.tourist.findUnique({
//       where: { userId },
//       include: {
//         user: true,
//       },
//     });

//     if (!tourist) {
//       throw new AppError(httpStatus.NOT_FOUND, "Tourist profile not found");
//     }

//     // 4. Prevent guide from booking own package
//     if (tourPackage.guide.user.id === userId) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "You cannot book your own tour package"
//       );
//     }

//     // 5. Validate tour date
//     const tourDateObj = new Date(tourDate);
//     if (isNaN(tourDateObj.getTime())) {
//       throw new AppError(httpStatus.BAD_REQUEST, "Invalid tour date format");
//     }

//     if (tourDateObj < new Date()) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         "Tour date cannot be in the past"
//       );
//     }

//     // 6. Calculate total price
//     const totalPrice = numberOfPeople * tourPackage.pricePerPerson;

//     // 7. Calculate fees (10% platform fee)
//     const platformFee = totalPrice * 0.1;
//     const guideEarning = totalPrice - platformFee;

//     // 8. Create booking
//     const booking = await prisma.booking.create({
//       data: {
//         bookingReference: generateBookingReference(),
//         touristId: tourist.id,
//         guideId: tourPackage.guideId,
//         packageId: tourPackage.id,
//         tourDate: tourDateObj,
//         numberOfPeople,
//         totalPrice,
//         specialRequests: specialRequests || null,
//         status: BookingStatus.PENDING_PAYMENT,
//         paymentDeadline: new Date(Date.now() + 30 * 60 * 1000), // 30 min
//       },
//     });

//     // 9. Create payment record
//     const payment = await prisma.payment.create({
//       data: {
//         bookingId: booking.id,
//         amount: totalPrice,
//         paymentMethod: "bKash",
//         status: PaymentStatus.INITIATED,
//         commissionFee: platformFee,
//         guideEarning: guideEarning,
//         platformFee: platformFee,
//       },
//     });

//     // 10. Call bKash
//     const invoiceNumber = `BKASH-${booking.id.slice(0, 8)}-${Date.now()}`;
//     const paymentResult = await createBkashPayment(totalPrice, invoiceNumber);

//     if (!paymentResult.success) {
//       // Rollback booking and payment
//       await prisma.booking.update({
//         where: { id: booking.id },
//         data: {
//           status: BookingStatus.CANCELLED,
//           cancelledAt: new Date(),
//         },
//       });

//       await prisma.payment.update({
//         where: { id: payment.id },
//         data: {
//           status: PaymentStatus.FAILED,
//         },
//       });

//       throw new AppError(
//         httpStatus.BAD_GATEWAY,
//         (paymentResult as any).error || "Payment initialization failed"
//       );
//     }

//     // 11. Update payment with bKash data
//     await prisma.payment.update({
//       where: { id: payment.id },
//       data: {
//         paymentData: {
//           paymentId: paymentResult.paymentId,
//           invoiceNumber: paymentResult.invoiceNumber,
//           bkashURL: paymentResult.bkashURL,
//           createTime: paymentResult.createTime,
//         },
//       },
//     });

//     //  Return with all required fields
//     return {
//       success: true,
//       paymentId: paymentResult.paymentId,
//       bkashURL: paymentResult.bkashURL,
//       bookingReference: booking.bookingReference,
//       amount: Number(paymentResult.amount) || totalPrice,
//       transactionStatus: paymentResult.transactionStatus || "Initiated",
//     };
//   } catch (error: any) {
//     if (error instanceof AppError) throw error;
//     throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
//   }
// };






// ===== 2. Execute Payment (Callback) =====

const initializePayment = async (
  paymentData: IBkashPaymentRequest
): Promise<IBkashPaymentResponse> => {
  try {
    const {
      packageId,
      userId,
      numberOfPeople,
      tourDate,
      specialRequests,
    } = paymentData;

    // 1. Check tour package
    const tourPackage = await prisma.tourPackage.findUnique({
      where: { id: packageId },
      include: {
        guide: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!tourPackage) {
      throw new AppError(httpStatus.NOT_FOUND, "Tour package not found");
    }

    if (tourPackage.status !== PackageStatus.APPROVED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Tour package is not available");
    }

    if (tourPackage.isDeleted) {
      throw new AppError(httpStatus.BAD_REQUEST, "Tour package is deleted");
    }

    // 2. Check group size
    if (
      numberOfPeople < tourPackage.minGroupSize ||
      numberOfPeople > tourPackage.maxGroupSize
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Group size must be between ${tourPackage.minGroupSize} and ${tourPackage.maxGroupSize}`
      );
    }

    // 3. Check tourist
    const tourist = await prisma.tourist.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!tourist) {
      throw new AppError(httpStatus.NOT_FOUND, "Tourist profile not found");
    }

    // 4. Prevent guide from booking own package
    if (tourPackage.guide.user.id === userId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot book your own tour package"
      );
    }

    // 5. Validate tour date
    const tourDateObj = new Date(tourDate);
    if (isNaN(tourDateObj.getTime())) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid tour date format");
    }

    if (tourDateObj < new Date()) {
      throw new AppError(httpStatus.BAD_REQUEST, "Tour date cannot be in the past");
    }

    // ✅ 6. Find existing booking (Tourist create করা)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        touristId: tourist.id,
        packageId: tourPackage.id,
        tourDate: tourDateObj,
        status: BookingStatus.PENDING_PAYMENT,     // ← শুধু PENDING
      },
      include: {
        payment: true,
      },
    });

    if (!existingBooking) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "No pending booking found. Please create a booking first."
      );
    }

    // ✅ 7. Check if payment already exists
    if (existingBooking.payment) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Payment already initiated for this booking"
      );
    }

    // 8. Calculate total price
    const totalPrice = numberOfPeople * tourPackage.pricePerPerson;

    // 9. Calculate fees (10% platform fee)
    const platformFee = totalPrice * 0.1;
    const guideEarning = totalPrice - platformFee;

    // ✅ 10. Create payment record for existing booking
    const payment = await prisma.payment.create({
      data: {
        bookingId: existingBooking.id,             // ← Existing booking
        amount: totalPrice,
        paymentMethod: "bKash",
        status: PaymentStatus.INITIATED,
        commissionFee: platformFee,
        guideEarning: guideEarning,
        platformFee: platformFee,
      },
    });

    // 11. Call bKash
    const invoiceNumber = `BKASH-${existingBooking.id.slice(0, 8)}-${Date.now()}`;
    const paymentResult = await createBkashPayment(totalPrice, invoiceNumber);

    if (!paymentResult.success) {
      // Rollback payment
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        (paymentResult as any).error || "Payment initialization failed"
      );
    }

    // 12. Update payment with bKash data
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentData: {
          paymentId: paymentResult.paymentId,
          invoiceNumber: paymentResult.invoiceNumber,
          bkashURL: paymentResult.bkashURL,
          createTime: paymentResult.createTime,
        },
      },
    });

    // Return with all required fields
    return {
      success: true,
      paymentId: paymentResult.paymentId,
      bkashURL: paymentResult.bkashURL,
      bookingReference: existingBooking.bookingReference,  // ← Existing booking
      amount: Number(paymentResult.amount) || totalPrice,
      transactionStatus: paymentResult.transactionStatus || "Initiated",
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};


const executePayment = async (paymentId: string): Promise<any> => {
  try {
    // Find payment by bKash paymentId
    const payment = await prisma.payment.findFirst({
      where: {
        paymentData: {
          path: ["paymentId"],
          equals: paymentId,
        },
      },
      include: {
        booking: {
          include: {
            package: {
              include: {
                guide: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            tourist: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment already completed");
    }

    // Execute bKash payment
    const executionResult = await executeBkashPayment(paymentId);

    if (!executionResult.success) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      });

      throw new AppError(
        httpStatus.BAD_GATEWAY,
        (executionResult as any).error || "Payment execution failed"
      );
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        bKashTrxId: executionResult.trxID,
        paidAt: new Date(),
        paymentData: {
          ...(payment.paymentData as any),
          executionResult,
        },
      },
    });

    // Update guide earnings
    await prisma.guide.update({
      where: { id: payment.booking.guideId },
      data: {
        totalEarnings: {
          increment: payment.guideEarning,
        },
        totalBookings: {
          increment: 1,
        },
      },
    });

    return {
      success: true,
      booking: updatedBooking,
      payment: updatedPayment,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};




const refundBkashPayment = async (
  paymentId: string,
  amount: number,
  reason: string = "Customer Request",
  trxId: string,
  sku: string = "Booking Cancellation"
) => {
  try {
    console.log("=== Refund Payment Debug ===");
    console.log("Payment ID:", paymentId);
    console.log("Amount:", amount);
    console.log("Reason:", reason);
    console.log("Trx ID:", trxId);
    console.log("SKU:", sku);

    const response = await callBkashAPI(
      "/tokenized/checkout/payment/refund",
      "POST",
      {
        paymentID: paymentId,
        trxID: trxId,
        amount: amount.toString(),
        sku: sku,
        reason: reason,
      }
    );

    console.log(" bKash Refund Response:", JSON.stringify(response, null, 2));

    return {
      success: true,
      refundId: response.refundTrxID,
      paymentId: response.paymentID,
      amount: response.amount,
      trxID: response.trxID,
      refundStatus: response.transactionStatus || "Completed",
      completedTime: response.completedTime,
      fullResponse: response,
    };
  } catch (error: any) {
    console.error("❌ Refund Error:", error);
    return {
      success: false,
      error: error.message || "Refund failed",
    };
  }
};


export const PaymentService = {
  initializePayment,
  executePayment,
  refundBkashPayment
};