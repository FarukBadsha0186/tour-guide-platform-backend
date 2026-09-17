import { Request, Response, NextFunction, Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { catchAsync } from "../../utils/catchAsync";
import z from "zod";
import { validateRequest } from "../../middleware/validateRequest";

import { AuthController } from "./auth.controller";
import { TouristValidation } from "./auth.validation";


const router = Router();




router.post("/register/tourist",
	validateRequest(TouristValidation.TouristRegistrationZodSchema),
	AuthController.registerTourist);

	router.post("/register/guide",
	validateRequest(TouristValidation.TouristRegistrationZodSchema),
	AuthController.registerGuide);


router.post("/verify-email",
	validateRequest(TouristValidation.TouristEmailVerifySchema),
	AuthController.verifyUserEmail);

router.post("/login", AuthController.loginUser);

router.get("/me",
	auth(Role.ADMIN, Role.TOURIST, Role.GUIDE, ),
	AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google",AuthController.googleLogin);

router.post("/forgotpassword",AuthController.forgotPassword);
router.post("/resetpassword",AuthController.resetPassword);




export const AuthRoutes = router;


