import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, type Application, type Request, type Response } from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import z from "zod";
import { redisclient } from "./app/lib/redis";
import crypto from "crypto";
import { UserRoutes } from "./app/module/user/user.route";

import { GuideRoutes } from "./app/module/guide/guide.route";
import { AvailabilityRoutes } from "./app/module/availability/availability.router";
import { getBkashIdToken } from "./app/lib/bkas";
import { paymentRouter } from "./app/module/payment/payment.router";
import { TouristRouter } from "./app/module/tourist/tourist.route";
import { adminRouter } from "./app/module/admin/admin.route";
import { publicRouter } from "./app/module/public/public.route";






const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/guide",GuideRoutes);
app.use("/api/v1/guideavailable",AvailabilityRoutes);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/tourist", TouristRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/public", publicRouter);
app.use("/zod", async (req: Request, res: Response , next: NextFunction) => {
	try {
		const UserzodSchema = z.object([{
		name :z.string(),
		age :z.number(),
		isVerified : z.boolean(),
		books : z.array(z.string()),
	}])

	 const payload =req.body;

	 const result =UserzodSchema.parse(payload)
	 
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH Healthcare System Backend",
		data: result
	});
		
	} catch (error) {
		console.log(error)

		next(error)
		
	}
})


app.get("/test", async (req: Request, res: Response , next: NextFunction) => {
	try {


	

	const granIdTokenResult= await getBkashIdToken()
	console.log(granIdTokenResult);
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH TOUR AND GUIDE System Backend",
		data: null
	});
		

		 
		
	} catch (error) {

		console.log(error)

		next(error)
		
		
	}
})

// Basic route


app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH Healthcare System Backend",
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
