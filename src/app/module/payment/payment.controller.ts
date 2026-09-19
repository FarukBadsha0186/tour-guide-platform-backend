// controllers/payment.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { PaymentService } from "../payment/payement.service";



interface RequestUser {
  userId: string;
  role: string;
  email?: string;
}

// ===== 1. Initialize Payment =====
const initializePayment = async (req: Request, res: Response) => {
  try {
    const user = req.user as RequestUser;
    const { packageId, numberOfPeople, tourDate, specialRequests } = req.body;

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!packageId || !numberOfPeople || !tourDate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "packageId, numberOfPeople, and tourDate are required"
      );
    }

    const result = await PaymentService.initializePayment({
      packageId,
      userId: user.userId,
      numberOfPeople: parseInt(numberOfPeople),
      tourDate,
      specialRequests,
    });

    res.status(httpStatus.OK).json({
      success: true,
      message: "Payment initialized successfully",
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

// ===== 2. Payment Callback =====
const paymentCallback = async (req: Request, res: Response) => {
  try {
    // const { paymentID, status } = req.body;

    const data: any = req.method === "GET" ? req.query : req.body;
const paymentID = data.paymentID || data.paymentId;
const status = data.status;

    console.log(" Payment Callback Received:", { paymentID, status });

    if (!paymentID) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment ID is required");
    }

    if (status === "success" || status === "completed") {
      const result = await PaymentService.executePayment(paymentID);
      const successUrl = `${process.env.APP_URL}/payment-success?bookingId=${result.booking.id}&trxId=${result.payment.bKashTrxId}`;
      console.log(" Payment successful, redirecting to:", successUrl);
      res.redirect(successUrl);
    } else if (status === "cancel") {
      res.redirect(`${process.env.APP_URL}/payment-failed?reason=cancelled`);
    } else {
      res.redirect(`${process.env.APP_URL}/payment-failed?reason=failed`);
    }
  } catch (error: any) {
    console.error(" Payment callback error:", error);
    res.redirect(
      `${process.env.APP_URL}/payment-failed?error=${encodeURIComponent(error.message)}`
    );
  }
};


export const PaymentController = {
  initializePayment,
  paymentCallback,
};