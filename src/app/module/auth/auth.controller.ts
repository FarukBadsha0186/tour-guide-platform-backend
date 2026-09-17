import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";
import z from "zod";
import { TouristValidation } from "../auth/auth.validation";
import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma"


 const registerTourist = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    await AuthService.registerTourist(payload);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Tourist registration OTP sent",
      data: null,
    });
  });

  const registerGuide = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    await AuthService.registerGuide(payload);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Guide registration OTP sent",
      data: null,
    });
  });

  // ===== VERIFY EMAIL (Common for Both) =====
  const verifyUserEmail = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await AuthService.verifyUserEmail(payload);

    const { accessToken, refreshToken,  tourist, guide } = result;

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Email verified successfully",
      data: {
        accessToken,
        refreshToken,
        tourist,
        guide,
      },
    });
  });


const loginUser = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const result = await AuthService.loginUser(payload);
	const { accessToken, refreshToken , role } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "logged in successfully",
		data: {

			Role:role,
			accessToken,
			refreshToken,
			
			
		},
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as unknown as IRequestUser;

	if (!user) {
		throw new Error("User information is missing in the request");
	}

	const result = await AuthService.getMe(user);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new Error("Refresh token is missing");
	}
	const result = await AuthService.refreshToken(req.cookies.refreshToken);
	const { accessToken, refreshToken: newRefreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", newRefreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken: newRefreshToken,
		},
	});
});


const googleLogin = catchAsync(async (req: Request, res: Response) => {

	const payload = req.body;
	const result =  await AuthService.googleLogin(payload)

	const { accessToken, refreshToken } = result;

	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: false,
		sameSite: "none",
		maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
	});
	

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: {
			accessToken,
			refreshToken,
			
		},
	});
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {

	const payload = req.body;

	await AuthService.forgotPassword(payload);

	

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `OTP sent to Email : ${payload.email} ` ,
		data: null,
	});
});


const resetPassword = catchAsync(async (req: Request, res: Response) => {

	const payload = req.body;
	 await AuthService.resetPassword(payload)

	

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Reset password  successfully",
		data: null
	});
});



export const AuthController = {
	registerTourist,
	registerGuide,
	verifyUserEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword
};
